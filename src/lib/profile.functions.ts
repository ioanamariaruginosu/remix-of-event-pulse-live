import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ProfileInput = z.object({
  name: z.string().min(1).max(120).optional(),
  one_liner: z.string().max(500).optional(),
  intent: z.string().max(500).optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  socials: z.record(z.string(), z.string().max(300)).optional(),
  color: z.string().max(20).optional(),
  avatar: z
    .object({
      style: z.string().min(1).max(40),
      seed: z.string().min(1).max(80),
      bg: z.string().min(1).max(20),
    })
    .optional(),
});

export const upsertMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ProfileInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const initials = data.name
      ? data.name.replace(/[^a-zA-Z ]/g, "").trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
      : undefined;
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, ...data, initials, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const grantOrganizerRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Demo flow: any signed-in user can self-promote to organizer.
    const { userId } = context;
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "organizer" }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });