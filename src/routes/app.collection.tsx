import { createFileRoute } from "@tanstack/react-router";
import { people, edges } from "@/data/event";
import { Avatar } from "@/components/Avatar";

export const Route = createFileRoute("/app/collection")({
  head: () => ({ meta: [{ title: "Your deck — synqmap" }] }),
  component: Collection,
});

function Collection() {
  const yourEdges = edges.filter((e) => e.source === "you" || e.target === "you");
  const cards = yourEdges
    .map((e) => {
      const otherId = e.source === "you" ? e.target : e.source;
      return { person: people.find((p) => p.id === otherId)!, reason: e.reason };
    });

  return (
    <div className="px-5 pt-6 space-y-5 pb-10">
      <div>
        <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest">Day 1</div>
        <h1 className="font-extrabold text-2xl tracking-tight">Your Deck</h1>
        <div className="text-xs text-foreground/60 mt-1">{cards.length} cards collected · 250 XP</div>
      </div>

      <div className="space-y-3">
        {cards.map(({ person, reason }, i) => (
          <div key={person.id} className="p-4 rounded-2xl bg-foreground text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 size-32 bg-primary/30 blur-3xl rounded-full" />
            <div className="relative flex items-start gap-3">
              <Avatar person={person} size={52} className="ring-2 ring-white/20 shrink-0 shadow-md" />

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-bold tracking-tight truncate">{person.name}</div>
                  <div className="font-display italic text-[9px] text-white/40 uppercase tracking-widest shrink-0">#{String(i + 1).padStart(3, "0")}</div>
                </div>
                <div className="text-xs text-white/70 truncate">{person.oneLiner}</div>
                <div className="text-[10px] text-accent mt-2 font-display italic">Why: {reason}</div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {person.tags.map((t) => (
                    <span key={t} className="px-1.5 py-0.5 bg-white/10 text-[9px] font-bold uppercase rounded">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
