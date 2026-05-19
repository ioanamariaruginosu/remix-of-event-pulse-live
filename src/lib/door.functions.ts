import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CheckInInput = z.object({
  attendeeUserId: z.string().uuid(),
  roomLabel: z.string().min(1).max(120),
});

/**
 * Organizer scans an attendee's QR. We resolve the attendee profile, then
 * upsert a `presence` row pinning them to a room within the organizer's
 * most recent event. Room is matched by name; if none exists we create
 * one so the demo flow always lands somewhere.
 */
export const checkInAttendee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => CheckInInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, name, initials")
      .eq("id", data.attendeeUserId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!profile) throw new Error("That QR isn't a synqmap card.");

    // Pick the organizer's most recent event (fallback to any latest).
    const { data: ownEvent } = await supabaseAdmin
      .from("events")
      .select("id")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    let eventId = ownEvent?.id ?? null;
    if (!eventId) {
      const { data: anyEvent } = await supabaseAdmin
        .from("events")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      eventId = anyEvent?.id ?? null;
    }
    if (!eventId) throw new Error("No event configured to check in to.");

    // Match room by name within the event; create if missing.
    const { data: room } = await supabaseAdmin
      .from("rooms")
      .select("id")
      .eq("event_id", eventId)
      .ilike("name", data.roomLabel)
      .limit(1)
      .maybeSingle();
    let roomId = room?.id ?? null;
    if (!roomId) {
      const { data: created, error: rErr } = await supabaseAdmin
        .from("rooms")
        .insert({ event_id: eventId, name: data.roomLabel, kind: "session", capacity: 100 })
        .select("id")
        .single();
      if (rErr) throw new Error(rErr.message);
      roomId = created.id;
    }

    // Upsert presence (delete-then-insert because the table has no UPDATE policy
    // for non-organizer self-rows and we want a clean room switch).
    await supabaseAdmin
      .from("presence")
      .delete()
      .eq("user_id", data.attendeeUserId)
      .eq("event_id", eventId);
    const { error: insErr } = await supabaseAdmin
      .from("presence")
      .insert({ user_id: data.attendeeUserId, event_id: eventId, room_id: roomId });
    if (insErr) throw new Error(insErr.message);

    // Log a tap row for the live feed (best-effort).
    await supabaseAdmin
      .from("taps")
      .insert({
        person_id: data.attendeeUserId,
        organizer_id: userId,
        event_id: eventId,
        room_id: roomId,
      });

    return {
      attendee: {
        id: profile.id,
        name: profile.name ?? "Attendee",
        initials: profile.initials ?? "??",
      },
    };
  });