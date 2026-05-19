import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ExchangeInput = z.object({
  otherUserId: z.string().uuid(),
  reason: z.string().max(280).optional(),
});

export const exchangeCardWith = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ExchangeInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (data.otherUserId === userId) {
      throw new Error("You cannot exchange a card with yourself.");
    }

    // Verify the other user actually has a profile so we don't write
    // exchanges for arbitrary uuids someone could craft in a QR.
    const { data: other, error: otherErr } = await supabaseAdmin
      .from("profiles")
      .select("id, name, one_liner, intent, tags, socials, color, avatar, initials")
      .eq("id", data.otherUserId)
      .maybeSingle();
    if (otherErr) throw new Error(otherErr.message);
    if (!other) throw new Error("That card no longer exists.");

    const reason = data.reason ?? "Cards exchanged via QR";
    // Write both directions atomically from the server (admin bypasses RLS for
    // the reverse row). ON CONFLICT-style guard: skip if a row already exists.
    const rows = [
      { from_user: userId, to_user: data.otherUserId, reason },
      { from_user: data.otherUserId, to_user: userId, reason },
    ];
    for (const row of rows) {
      const { data: existing } = await supabaseAdmin
        .from("cards_exchanged")
        .select("id")
        .eq("from_user", row.from_user)
        .eq("to_user", row.to_user)
        .limit(1)
        .maybeSingle();
      if (existing) continue;
      const { error } = await supabaseAdmin.from("cards_exchanged").insert(row);
      if (error) throw new Error(error.message);
    }

    return { other };
  });

export const getMyDeck = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: exchanges, error } = await supabase
      .from("cards_exchanged")
      .select("from_user, to_user, reason, at")
      .or(`from_user.eq.${userId},to_user.eq.${userId}`)
      .order("at", { ascending: false });
    if (error) throw new Error(error.message);

    const otherIds = Array.from(
      new Set(
        (exchanges ?? []).map((e) => (e.from_user === userId ? e.to_user : e.from_user)),
      ),
    );
    if (otherIds.length === 0) return { cards: [] as DeckCard[] };

    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, name, one_liner, intent, tags, socials, color, avatar, initials")
      .in("id", otherIds);
    if (pErr) throw new Error(pErr.message);

    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    const seen = new Set<string>();
    const cards: DeckCard[] = [];
    for (const e of exchanges ?? []) {
      const otherId = e.from_user === userId ? e.to_user : e.from_user;
      if (seen.has(otherId)) continue;
      const profile = byId.get(otherId);
      if (!profile) continue;
      seen.add(otherId);
      cards.push({ profile, reason: e.reason ?? "Cards exchanged", at: e.at });
    }
    return { cards };
  });

export type DeckProfile = {
  id: string;
  name: string | null;
  one_liner: string | null;
  intent: string | null;
  tags: string[];
  socials: Record<string, string> | null;
  color: string;
  avatar: { style?: string; seed?: string; bg?: string } | null;
  initials: string | null;
};

export type DeckCard = {
  profile: DeckProfile;
  reason: string;
  at: string;
};