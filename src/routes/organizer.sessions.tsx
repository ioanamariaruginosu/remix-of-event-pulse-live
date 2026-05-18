import { createFileRoute } from "@tanstack/react-router";
import { sessions, rooms } from "@/data/event";

export const Route = createFileRoute("/organizer/sessions")({
  head: () => ({ meta: [{ title: "Organizer · Schedule — synqmap" }] }),
  component: Schedule,
});

function Schedule() {
  return (
    <div className="p-8 lg:p-12 space-y-8 max-w-6xl">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-2">Day 1 · May 22</div>
          <h1 className="text-4xl font-extrabold tracking-tight">Schedule</h1>
          <p className="text-foreground/60 mt-2 max-w-xl">Each session lives inside a room and feeds topic nodes into the live graph.</p>
        </div>
        <button className="px-5 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
          + New session
        </button>
      </div>

      <div className="space-y-3">
        {sessions.map((s) => {
          const room = rooms.find((r) => r.id === s.roomId);
          return (
            <div key={s.id} className="p-5 ring-1 ring-border rounded-2xl grid md:grid-cols-[120px_1fr_auto] gap-4 items-start hover:ring-primary/30 transition-colors">
              <div>
                <div className="font-display italic text-sm font-bold">{s.time}</div>
                <div className="text-[10px] font-display italic tracking-tight normal-case text-primary mt-1">{room?.name}</div>
              </div>
              <div>
                <h3 className="font-extrabold text-lg tracking-tight mb-1">{s.title}</h3>
                <div className="text-sm text-foreground/60 mb-2">{s.speaker} · <span className="text-foreground/40">{s.speakerRole}</span></div>
                <p className="text-sm text-foreground/50">{s.abstract}</p>
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {s.topics.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-foreground/5 text-[10px] font-display italic font-bold uppercase tracking-widest rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex md:flex-col gap-2">
                <button className="px-3 py-1.5 text-xs font-bold ring-1 ring-border rounded-lg hover:bg-foreground/5">Edit</button>
                <button className="px-3 py-1.5 text-xs font-bold ring-1 ring-border rounded-lg hover:bg-foreground/5">Transcript</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
