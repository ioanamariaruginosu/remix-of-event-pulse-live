import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const EMBED_MODEL = "openai/text-embedding-3-small"; // 1536 dims
const CHAT_MODEL = "google/gemini-2.5-flash";

type ProfileRow = {
  id: string;
  name: string | null;
  one_liner: string | null;
  intent: string | null;
  tags: string[] | null;
  color: string | null;
  initials: string | null;
  avatar: { style: string; seed: string; bg: string } | null;
  embedding: number[] | string | null;
  embedding_text: string | null;
};

function profileText(p: { name?: string | null; one_liner?: string | null; intent?: string | null; tags?: string[] | null }) {
  return [
    p.name ? `Name: ${p.name}` : "",
    p.one_liner ? `Bio: ${p.one_liner}` : "",
    p.intent ? `Looking for: ${p.intent}` : "",
    p.tags && p.tags.length ? `Tags: ${p.tags.join(", ")}` : "",
  ].filter(Boolean).join("\n");
}

async function embed(text: string): Promise<number[] | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key || !text.trim()) return null;
  const res = await fetch(`${GATEWAY}/embeddings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, input: text, dimensions: 1536 }),
  });
  if (!res.ok) {
    console.error("embed failed", res.status, await res.text());
    return null;
  }
  const json = await res.json();
  return json.data?.[0]?.embedding ?? null;
}

function parseVec(v: number[] | string | null): number[] | null {
  if (!v) return null;
  if (Array.isArray(v)) return v;
  // Postgres returns vector as string like "[0.1,0.2,...]"
  try {
    return JSON.parse(v as string) as number[];
  } catch {
    return null;
  }
}

function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function tokenize(s?: string | null): Set<string> {
  if (!s) return new Set();
  return new Set(
    s.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
}
const STOP = new Set(["the","and","for","with","into","that","this","from","your","you","are","but","not","our","who","how","what","want","need","looking","work","working","build","building"]);

function jaccard(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const uni = a.size + b.size - inter;
  return uni ? inter / uni : 0;
}

function keywordScore(me: ProfileRow, other: ProfileRow): number {
  const meTags = new Set((me.tags ?? []).map((t) => t.toLowerCase()));
  const otTags = new Set((other.tags ?? []).map((t) => t.toLowerCase()));
  const tagScore = jaccard(meTags, otTags);
  const meText = tokenize(`${me.one_liner ?? ""} ${me.intent ?? ""}`);
  const otText = tokenize(`${other.one_liner ?? ""} ${other.intent ?? ""}`);
  const textScore = jaccard(meText, otText);
  return 0.6 * tagScore + 0.4 * textScore;
}

// Reciprocal Rank Fusion with weighted contributions.
// keywordWeight + embeddingWeight should sum to 1.
function rrf(
  rankedKw: { id: string; rank: number }[],
  rankedEmb: { id: string; rank: number }[],
  keywordWeight = 0.2,
  embeddingWeight = 0.8,
  k = 60,
) {
  const scores = new Map<string, number>();
  for (const r of rankedKw) {
    scores.set(r.id, (scores.get(r.id) ?? 0) + keywordWeight / (k + r.rank));
  }
  for (const r of rankedEmb) {
    scores.set(r.id, (scores.get(r.id) ?? 0) + embeddingWeight / (k + r.rank));
  }
  return [...scores.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
}

/** Embed (or re-embed) the current user's profile text and store the vector. */
export const embedMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: me } = await supabase
      .from("profiles")
      .select("id, name, one_liner, intent, tags, embedding_text")
      .eq("id", userId)
      .maybeSingle();
    if (!me) return { ok: false, reason: "no profile" };
    const text = profileText(me);
    if (!text.trim()) return { ok: false, reason: "empty profile" };
    if (me.embedding_text === text) return { ok: true, cached: true };
    const vec = await embed(text);
    if (!vec) return { ok: false, reason: "embed failed" };
    const { error } = await supabase
      .from("profiles")
      // pgvector accepts a string literal "[..]" or array via supabase-js
      .update({ embedding: vec as unknown as string, embedding_text: text })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true, cached: false };
  });

const GetMatchesInput = z.object({
  event_id: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(10).default(3),
  refresh: z.boolean().default(false),
});

export type MatchResult = {
  person: {
    id: string;
    name: string;
    initials: string;
    one_liner: string | null;
    intent: string | null;
    tags: string[];
    color: string;
    avatar: { style: string; seed: string; bg: string } | null;
  };
  score: number;
  reasons: string[];
};

export const getMatches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => GetMatchesInput.parse(d))
  .handler(async ({ data, context }): Promise<{ matches: MatchResult[] }> => {
    const { supabase, userId } = context;

    // 1. Ensure my embedding is fresh.
    const { data: meRow } = await supabase
      .from("profiles")
      .select("id, name, one_liner, intent, tags, color, initials, avatar, embedding, embedding_text")
      .eq("id", userId)
      .maybeSingle();
    if (!meRow) return { matches: [] };

    const myText = profileText(meRow);
    let myVec = parseVec(meRow.embedding as never);
    if (!myVec || meRow.embedding_text !== myText) {
      myVec = await embed(myText);
      if (myVec) {
        await supabase.from("profiles")
          .update({ embedding: myVec as unknown as string, embedding_text: myText })
          .eq("id", userId);
      }
    }

    // 2. Candidate pool.
    let candidateIds: string[] | null = null;
    if (data.event_id) {
      const { data: atts } = await supabase
        .from("event_attendees")
        .select("user_id")
        .eq("event_id", data.event_id);
      candidateIds = (atts ?? []).map((a) => a.user_id).filter((id) => id !== userId);
      if (!candidateIds.length) return { matches: [] };
    }

    let q = supabase
      .from("profiles")
      .select("id, name, one_liner, intent, tags, color, initials, avatar, embedding, embedding_text")
      .neq("id", userId)
      .limit(200);
    if (candidateIds) q = q.in("id", candidateIds);
    const { data: others } = await q;
    const pool = (others ?? []) as ProfileRow[];
    if (!pool.length) return { matches: [] };

    // 3. Score: keyword + embedding.
    const kwScored = pool.map((p) => ({ id: p.id, s: keywordScore(meRow as ProfileRow, p) }));
    const embScored = pool.map((p) => {
      const v = parseVec(p.embedding as never);
      const s = myVec && v ? cosine(myVec, v) : 0;
      return { id: p.id, s };
    });

    const rankedKw = [...kwScored].sort((a, b) => b.s - a.s).map((r, i) => ({ id: r.id, rank: i + 1 }));
    const rankedEmb = [...embScored].sort((a, b) => b.s - a.s).map((r, i) => ({ id: r.id, rank: i + 1 }));

    // 4. RRF fusion (20% keyword, 80% embedding).
    const fused = rrf(rankedKw, rankedEmb, 0.2, 0.8).slice(0, data.limit);
    const byId = new Map(pool.map((p) => [p.id, p]));
    const top = fused.map((f) => ({ profile: byId.get(f.id)!, score: f.score })).filter((x) => x.profile);

    // 5. LLM reasoning pass (one call, all three matches).
    const reasons = await generateReasons(meRow as ProfileRow, top.map((t) => t.profile));

    const matches: MatchResult[] = top.map((t, i) => ({
      person: {
        id: t.profile.id,
        name: t.profile.name ?? "Unknown",
        initials: t.profile.initials ?? "??",
        one_liner: t.profile.one_liner,
        intent: t.profile.intent,
        tags: t.profile.tags ?? [],
        color: t.profile.color ?? "#7c3aed",
        avatar: t.profile.avatar ?? null,
      },
      score: t.score,
      reasons: reasons[i] ?? [],
    }));

    // Cache to match_results (best-effort).
    if (matches.length) {
      const del = supabase.from("match_results").delete().eq("user_id", userId);
      await (data.event_id ? del.eq("event_id", data.event_id) : del.is("event_id", null));
      await supabase.from("match_results").insert(
        matches.map((m) => ({
          user_id: userId,
          match_user_id: m.person.id,
          event_id: data.event_id ?? null,
          score: m.score,
          reasons: m.reasons,
        })),
      );
    }

    return { matches };
  });

async function generateReasons(me: ProfileRow, others: ProfileRow[]): Promise<string[][]> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key || !others.length) return others.map(() => []);

  const prompt = `You are pairing people at a tech conference. For each candidate, return 2 short reasons (max 12 words each) why they should meet "${me.name ?? "this person"}".

ME
${profileText(me)}

CANDIDATES
${others.map((o, i) => `[${i + 1}] ${o.name ?? "?"}\n${profileText(o)}`).join("\n\n")}

Return strict JSON: {"matches":[{"reasons":["...","..."]}, ...]} — one entry per candidate in order.`;

  try {
    const res = await fetch(`${GATEWAY}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [
          { role: "system", content: "You write concise networking suggestions. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      console.error("reasons failed", res.status, await res.text());
      return others.map(() => []);
    }
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    const arr: { reasons?: string[] }[] = parsed.matches ?? [];
    return others.map((_, i) => (arr[i]?.reasons ?? []).slice(0, 3));
  } catch (e) {
    console.error("reasons error", e);
    return others.map(() => []);
  }
}