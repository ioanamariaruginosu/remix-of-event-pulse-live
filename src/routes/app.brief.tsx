import { createFileRoute } from "@tanstack/react-router";
import { sessionBrief, people } from "@/data/event";
import { Avatar } from "@/components/Avatar";

export const Route = createFileRoute("/app/brief")({
  head: () => ({ meta: [{ title: "Session brief — synqmap" }] }),
  component: Brief,
});

function Brief() {
  return (
    <div className="px-5 pt-6 space-y-5 pb-10">
      <div className="p-4 rounded-2xl bg-accent">
        <div className="text-[9px] font-display italic font-bold uppercase tracking-widest mb-1">What you missed</div>
        <div className="font-extrabold tracking-tight">{sessionBrief.title}</div>
        <div className="text-xs mt-1">{sessionBrief.speaker} · {sessionBrief.room} · {sessionBrief.duration}</div>
      </div>

      <div>
        <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest mb-2">Takeaways</div>
        <ol className="space-y-3">
          {sessionBrief.takeaways.map((t, i) => (
            <li key={i} className="flex gap-3">
              <div className="size-6 rounded-full bg-primary text-white grid place-items-center font-display italic text-[10px] font-bold shrink-0">{i + 1}</div>
              <div className="text-sm leading-relaxed">{t}</div>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest mb-2">Open questions</div>
        <div className="space-y-2">
          {sessionBrief.questions.map((q, i) => (
            <div key={i} className="p-3 ring-1 ring-border rounded-xl text-sm italic text-foreground/80">"{q}"</div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest mb-2">People to follow up with</div>
        <div className="space-y-2">
          {sessionBrief.matchedFromTalk.map((id) => {
            const p = people.find((x) => x.id === id);
            if (!p) return null;
            return (
              <div key={id} className="p-3 rounded-xl bg-primary-soft ring-1 ring-primary/20 flex items-center gap-3">
                <div className="size-9 rounded-lg grid place-items-center text-white font-bold text-xs" style={{ background: p.color }}>{p.initials}</div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{p.name}</div>
                  <div className="text-[10px] text-foreground/60">Spoke up during the talk</div>
                </div>
                <button className="text-[10px] font-bold text-primary uppercase tracking-widest">Add</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
