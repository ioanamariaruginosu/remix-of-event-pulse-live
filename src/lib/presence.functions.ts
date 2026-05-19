import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Where am I right now? Position is set only when an organizer scans my
 * QR at a door — see checkInAttendee. Returns the most recent presence
 * row for the authenticated user, with the room name resolved.
 */
export const getMyPresence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data, error } = await supabaseAdmin
      .from("presence")
      .select("room_id, event_id, updated_at, rooms(name)")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return { roomId: null, roomName: null, updatedAt: null };
    const roomName =
      (data as unknown as { rooms?: { name?: string } | null }).rooms?.name ?? null;
    return {
      roomId: data.room_id,
      roomName,
      updatedAt: data.updated_at,
    };
  });