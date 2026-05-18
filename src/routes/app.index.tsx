import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { NetworkGraph } from "@/components/NetworkGraph";
import { people, suggestions, edges, pastEvents } from "@/data/event";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Your trail — synqmap" }] }),
  component: Personal,
});

function Personal() {
  const you = people[0];
  const match = people.find((p) => p.id === suggestions.closestMatch)!;
  const bridge = people.find((p) => p.id === suggestions.bridgePerson)!;
  const collected = edges.filter((e) => e.source === "you" || e.target === "you").length;
  const xp = 1240;
  const nextLevel = 2000;

  return (
    <div className="px-5 pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono text-foreground/40 uppercase tracking-widest">Welcome back</div>
          <div className="font-extrabold text-xl tracking-tight">{you.name}</div>
        </div>
        <div className="size-10 rounded-full grid place-items-center font-bold text-sm text-white" style={{ background: you.color }}>
          {you.initials}
        </div>
      </div>

      <div className="p-4 bg-foreground text-white rounded-2xl">
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Level 4 · Networker</div>
            <div className="font-extrabold text-2xl tracking-tight">{xp.toLocaleString()} XP</div>
          </div>
          <div className="text-[10px] font-mono text-accent">+250 today</div>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-accent" style={{ width: `${(xp / nextLevel) * 100}%` }} />
        </div>
        <div className="flex justify-between mt-1 text-[10px] font-mono text-white/40">
          <span>Lv 4</span>
          <span>{nextLevel - xp} XP to Lv 5</span>
        </div>
      </div>

      <div className="aspect-square bg-foreground rounded-2xl overflow-hidden relative">
        <NetworkGraph scale="personal" centerId="you" height={320} showLabels interactive />
        <div className="absolute top-3 left-3 px-2 py-1 bg-background/90 backdrop-blur rounded-full text-[9px] font-mono font-bold uppercase tracking-widest pointer-events-none">
          Your trail · {collected} cards
        </div>
      </div>

      {/* Past events / Wrapped */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <div className="text-[10px] font-mono text-foreground/40 uppercase tracking-widest">Your event wrapped</div>
          <span className="text-[9px] font-mono text-foreground/30 uppercase tracking-widest">{pastEvents.length} past</span>
        </div>
        <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2 snap-x snap-mandatory">
          {pastEvents.map((ev, i) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="snap-start shrink-0 w-[68%]"
            >
              <Link
                to="/app/wrapped"
                search={{ e: ev.id } as never}
                className="block aspect-[3/4] rounded-2xl p-4 text-white relative overflow-hidden ring-1 ring-black/5 active:scale-[0.98] transition-transform"
                style={{ background: ev.cover }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
                <div className="relative h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-white/80">{ev.date}</div>
                    <div className="size-7 rounded-full bg-white/20 backdrop-blur grid place-items-center text-xs">▶</div>
                  </div>
                  <div>
                    <div className="font-extrabold text-xl tracking-tight leading-tight">{ev.name}</div>
                    <div className="text-[11px] text-white/80 mt-0.5">{ev.city}</div>
                    <div className="flex gap-3 mt-3 text-[10px] font-mono uppercase tracking-widest text-white/80">
                      <span><b className="text-base text-white not-italic font-extrabold">{ev.cards}</b> cards</span>
                      <span><b className="text-base text-white not-italic font-extrabold">{ev.newConnections}</b> new</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-mono text-foreground/40 uppercase tracking-widest mb-3">Three moves for you</div>
        <div className="space-y-2">
          <MoveCard
            tag="Closest match"
            person={match.name}
            why="Both work on multi-agent research. In Track A right now."
            color={match.color}
          />
          <MoveCard
            tag="Bridge person"
            person={bridge.name}
            why="Connects you to the founders cluster you haven't entered yet."
            color={bridge.color}
          />
          <Link to="/app/room" className="block p-3 rounded-xl bg-primary-soft ring-1 ring-primary/20">
            <div className="text-[9px] font-mono text-primary font-bold uppercase tracking-widest mb-1">Blind spot</div>
            <div className="font-bold text-sm">{suggestions.blindSpotCluster}</div>
            <div className="text-xs text-foreground/60 mt-1">You haven't met anyone from the hardware row.</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function MoveCard({ tag, person, why, color }: { tag: string; person: string; why: string; color: string }) {
  return (
    <div className="p-3 rounded-xl ring-1 ring-border flex gap-3 items-start">
      <div className="size-9 rounded-full shrink-0 mt-0.5" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-mono text-primary font-bold uppercase tracking-widest">{tag}</div>
        <div className="font-bold text-sm">{person}</div>
        <div className="text-xs text-foreground/60 mt-0.5">{why}</div>
      </div>
    </div>
  );
}
