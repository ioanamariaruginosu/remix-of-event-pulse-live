import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NetworkGraph } from "@/components/NetworkGraph";
import { people, suggestions, edges } from "@/data/event";
import { Avatar } from "@/components/Avatar";
import { useUserAvatar } from "@/data/avatars";
import { useYou } from "@/data/profile";
import { getMatches, type MatchResult } from "@/lib/matches.functions";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Your trail — synqmap" }] }),
  component: Personal,
});

function Personal() {
  const you = useYou(people[0]);
  const userAvatar = useUserAvatar();
  const collected = edges.filter((e) => e.source === "you" || e.target === "you").length;
  const xp = 1240;
  const nextLevel = 2000;

  const fetchMatches = useServerFn(getMatches);
  const [hasSession, setHasSession] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setHasSession(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);
  const { data: matchData, isLoading: matchesLoading } = useQuery({
    queryKey: ["matches", "personal"],
    queryFn: () => fetchMatches({ data: { limit: 3, refresh: false } }),
    staleTime: 60_000,
    enabled: hasSession,
  });
  const matches: MatchResult[] = matchData?.matches ?? [];

  return (
    <div className="px-5 pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest">Welcome back</div>
          <div className="font-extrabold text-xl tracking-tight">{you.name}</div>
        </div>
        <Link to="/app/avatar" aria-label="Customize avatar">
          <Avatar person={you} size={44} ring className="hover:scale-105 transition" />
        </Link>
      </div>

      {!userAvatar && (
        <Link
          to="/app/avatar"
          className="block relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent p-4 text-white group"
        >
          <div className="flex items-center gap-3">
            <Avatar person={you} size={48} className="ring-2 ring-white/40" />
            <div className="flex-1 min-w-0">
              <div className="text-[9px] font-display italic uppercase tracking-widest text-white/60">First things first</div>
              <div className="font-extrabold text-sm tracking-tight">Pick a face — make this yours</div>
              <div className="text-[11px] text-white/70 mt-0.5">13 styles · infinite seeds · zero AI-slop</div>
            </div>
            <div className="text-2xl group-hover:translate-x-1 transition">→</div>
          </div>
        </Link>
      )}



      <div className="p-4 bg-foreground text-white rounded-2xl">
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="text-[10px] font-display italic text-white/40 uppercase tracking-widest">Level 4 · Networker</div>
            <div className="font-extrabold text-2xl tracking-tight">{xp.toLocaleString()} XP</div>
          </div>
          <div className="text-[10px] font-display italic text-accent">+250 today</div>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-accent" style={{ width: `${(xp / nextLevel) * 100}%` }} />
        </div>
        <div className="flex justify-between mt-1 text-[10px] font-display italic text-white/40">
          <span>Lv 4</span>
          <span>{nextLevel - xp} XP to Lv 5</span>
        </div>
      </div>

      <div className="aspect-square bg-foreground rounded-2xl overflow-hidden relative">
        <NetworkGraph scale="personal" centerId="you" height={320} showLabels interactive />
        <div className="absolute top-3 left-3 px-2 py-1 bg-background/90 backdrop-blur rounded-full text-[9px] font-display italic font-bold uppercase tracking-widest pointer-events-none">
          Your trail · {collected} cards
        </div>
      </div>


      <div>
        <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest mb-3">Three moves for you</div>
        <div className="space-y-2">
          {matchesLoading && (
            <div className="text-xs text-foreground/40 px-1">Finding people you should meet…</div>
          )}
          {!matchesLoading && matches.length === 0 && (
            <div className="p-3 rounded-xl ring-1 ring-border text-xs text-foreground/60">
              No matches yet. Fill out your <Link to="/app/card" className="text-primary underline">card</Link> so we can match you.
            </div>
          )}
          {matches.map((m, i) => (
            <MatchCard
              key={m.person.id}
              tag={i === 0 ? "Closest match" : i === 1 ? "Bridge person" : "Worth a hello"}
              person={m.person}
              reasons={m.reasons.length ? m.reasons : [m.person.one_liner ?? "Profile overlaps with yours."]}
            />
          ))}
          <Link to="/app/room" className="block p-3 rounded-xl bg-primary-soft ring-1 ring-primary/20">
            <div className="text-[9px] font-display italic text-primary font-bold uppercase tracking-widest mb-1">Blind spot</div>
            <div className="font-bold text-sm">{suggestions.blindSpotCluster}</div>
            <div className="text-xs text-foreground/60 mt-1">You haven't met anyone from the hardware row.</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function MatchCard({
  tag,
  person,
  reasons,
}: {
  tag: string;
  person: {
    id: string;
    name: string;
    color: string;
    initials: string;
    avatar?: { style: string; seed: string; bg: string } | null;
  };
  reasons: string[];
}) {
  return (
    <div className="p-3 rounded-xl ring-1 ring-border flex gap-3 items-start">
      <Avatar person={person} size={36} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-display italic text-primary font-bold uppercase tracking-widest">{tag}</div>
        <div className="font-bold text-sm">{person.name}</div>
        <ul className="text-xs text-foreground/60 mt-0.5 space-y-0.5">
          {reasons.map((r, i) => (
            <li key={i}>· {r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
