import { createFileRoute } from "@tanstack/react-router";
import { rooms, tickerEvents } from "@/data/event";
import { NetworkGraph } from "@/components/NetworkGraph";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/organizer/live")({
  head: () => ({ meta: [{ title: "Organizer · Live Ops — synqmap" }] }),
  component: LiveOps,
});

function LiveOps() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2200);
    return () => clearInterval(id);
  }, []);

  const stream = tickerEvents.slice(tick % 4, (tick % 4) + 5).concat(tickerEvents.slice(0, 5));

  return (
    <div className="p-8 lg:p-12 space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="size-2 bg-primary rounded-full animate-pulse" />
            <div className="font-display italic text-[10px] uppercase tracking-widest text-primary">Live</div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Ops Dashboard</h1>
        </div>
        <button className="px-5 py-3 bg-foreground text-white rounded-xl font-bold text-sm hover:bg-primary transition-colors">
          Project to venue screen ↗
        </button>
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <div className="bg-foreground rounded-3xl overflow-hidden aspect-[16/10] relative ring-1 ring-border">
          <NetworkGraph scale="event" height={500} showLabels={false} />
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="px-3 py-1.5 bg-background/90 backdrop-blur rounded-full text-[10px] font-display italic font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="size-1.5 bg-primary rounded-full animate-pulse" />
              Live Network Topology
            </div>
            <div className="font-display italic text-[10px] text-white/40 uppercase tracking-widest">
              tick #{tick.toString().padStart(4, "0")}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl ring-1 ring-border">
            <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-3">Live Stream</div>
            <div className="space-y-2">
              {stream.map((e, i) => (
                <div key={`${tick}-${i}`} className="flex items-center gap-2 text-xs animate-[fade-in-up_0.4s_var(--ease-out-expo)]">
                  <span className="size-1.5 bg-primary rounded-full shrink-0" />
                  <span className="font-display italic font-bold tracking-tight truncate">{e}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl ring-1 ring-border">
            <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-3">Connection Rate</div>
            <div className="font-extrabold text-3xl mb-1">128<span className="text-foreground/40 text-base font-display italic ml-1">/min</span></div>
            <div className="h-8 flex items-end gap-1">
              {[40, 55, 32, 70, 88, 62, 95, 78, 100, 84, 91, 72].map((h, i) => (
                <div key={i} className="flex-1 bg-primary rounded-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-3">Room Density</div>
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
          {rooms.map((r) => {
            const pct = (r.current / r.capacity) * 100;
            const hot = pct > 80;
            return (
              <div key={r.id} className={`p-4 rounded-xl ring-1 ${hot ? "ring-primary/40 bg-primary-soft" : "ring-border"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm truncate">{r.name}</div>
                  {hot && <span className="text-[9px] font-display italic font-bold text-primary uppercase">Hot</span>}
                </div>
                <div className="font-display italic text-2xl font-extrabold">{r.current}</div>
                <div className="text-[10px] text-foreground/40 font-display italic tracking-tight normal-case">{Math.round(pct)}% full</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
