import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("events")
      .select("id, name, dates, city, description, cover_gradient, is_live, owner_id, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: event }, { data: rooms }, { data: sessions }, { data: attendees }] = await Promise.all([
      supabase.from("events").select("*").eq("id", data.id).maybeSingle(),
      supabase.from("rooms").select("*").eq("event_id", data.id).order("created_at"),
      supabase.from("sessions").select("*").eq("event_id", data.id).order("created_at"),
      supabase.from("event_attendees").select("user_id, status, created_at").eq("event_id", data.id),
    ]);
    return { event, rooms: rooms ?? [], sessions: sessions ?? [], attendees: attendees ?? [] };
  });

export const createEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      name: z.string().min(1).max(200),
      dates: z.string().max(200).optional(),
      city: z.string().max(200).optional(),
      description: z.string().max(2000).optional(),
      cover_gradient: z.string().max(500).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: ev, error } = await supabase
      .from("events")
      .insert({ ...data, owner_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return ev;
  });

export const updateEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(200).optional(),
      dates: z.string().max(200).optional(),
      city: z.string().max(200).optional(),
      description: z.string().max(2000).optional(),
      is_live: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { id, ...patch } = data;
    const { error } = await supabase.from("events").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("events").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Rooms ---
export const createRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      event_id: z.string().uuid(),
      name: z.string().min(1).max(200),
      kind: z.enum(["session", "social"]).default("session"),
      capacity: z.number().int().min(1).max(100000).default(100),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: room, error } = await supabase.from("rooms").insert(data).select().single();
    if (error) throw new Error(error.message);
    return room;
  });

export const deleteRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("rooms").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Sessions ---
export const createSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      event_id: z.string().uuid(),
      room_id: z.string().uuid().nullable().optional(),
      title: z.string().min(1).max(300),
      speaker: z.string().max(200).optional(),
      speaker_role: z.string().max(200).optional(),
      time_label: z.string().max(100).optional(),
      abstract: z.string().max(2000).optional(),
      topics: z.array(z.string().min(1).max(40)).max(20).default([]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: s, error } = await context.supabase.from("sessions").insert(data).select().single();
    if (error) throw new Error(error.message);
    return s;
  });

export const deleteSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("sessions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Attendees / registration ---
export const registerForEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ event_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("event_attendees")
      .upsert({ event_id: data.event_id, user_id: userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Invitations ---
export const createInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      event_id: z.string().uuid(),
      email: z.string().email().max(200),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: inv, error } = await context.supabase
      .from("invitations")
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return inv;
  });

export const listInvitations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ event_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: invs } = await context.supabase
      .from("invitations")
      .select("*")
      .eq("event_id", data.event_id)
      .order("created_at", { ascending: false });
    return invs ?? [];
  });