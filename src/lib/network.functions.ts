import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PublicNode = {
  id: string;
  name: string;
  initials: string;
  color: string;
  tags: string[];
};

export type PublicEdge = { source: string; target: string };

/**
 * Public, unauthenticated read of the live network for the landing page.
 * Returns ONLY non-sensitive columns: id, display name, initials, color, tags.
 * Edges are derived from cards_exchanged (deduped, undirected).
 */
export const getPublicNetwork = createServerFn({ method: "GET" }).handler(
  async () => {
    const [{ data: profiles, error: pErr }, { data: exchanges, error: eErr }] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id, name, initials, color, tags"),
        supabaseAdmin.from("cards_exchanged").select("from_user, to_user"),
      ]);
    if (pErr) throw new Error(pErr.message);
    if (eErr) throw new Error(eErr.message);

    const nodes: PublicNode[] = (profiles ?? []).map((p) => ({
      id: p.id,
      name: p.name ?? "Anon",
      initials: (p.initials ?? (p.name ?? "?").slice(0, 2)).toUpperCase(),
      color: p.color ?? "#7c3aed",
      tags: p.tags ?? [],
    }));

    const ids = new Set(nodes.map((n) => n.id));
    const seen = new Set<string>();
    const edges: PublicEdge[] = [];
    for (const e of exchanges ?? []) {
      if (!ids.has(e.from_user) || !ids.has(e.to_user)) continue;
      const key =
        e.from_user < e.to_user
          ? `${e.from_user}|${e.to_user}`
          : `${e.to_user}|${e.from_user}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ source: e.from_user, target: e.to_user });
    }

    return { nodes, edges };
  },
);