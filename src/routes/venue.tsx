import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { NetworkGraph } from "@/components/NetworkGraph";
import { EventMap } from "@/components/EventMap";
import { event, rooms, tickerEvents } from "@/data/event";

export const Route = createFileRoute("/venue")({
  head: () => ({ meta: [{ title: "Venue Screen — synqmap" }] }),
  component: Venue,
});

function Venue() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-8 overflow-hidden">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-1">Venue Spectacle · Live</div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            {event.name}
          </h1>
        </div>
        <div className="text-right">
          <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-1">Online</div>
          <div className="font-extrabold text-4xl text-accent">{event.online.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-4">
          <EventMap
            eventId="current"
            role="attendee"
            title="Venue Floor · Live"
            showLivePosition
          />
          <div className="flex items-center justify-between px-2">
            <div className="px-4 py-2 bg-foreground text-background rounded-full text-[10px] font-display italic font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="size-2 bg-primary rounded-full animate-pulse" />
              Network Pulse · tick #{tick.toString().padStart(4, "0")}
            </div>
            <div className="font-display italic text-[10px] text-foreground/40 uppercase tracking-widest">
              {rooms.length} rooms · {event.attendees.toLocaleString()} attendees
            </div>
          </div>
          <div className="bg-foreground rounded-3xl overflow-hidden aspect-[16/6] relative">
            <NetworkGraph scale="event" height={360} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40">Live stream</div>
          {tickerEvents.slice(0, 6).map((e, i) => (
            <div
              key={`${tick}-${i}`}
              className="p-3 bg-foreground/[0.03] ring-1 ring-foreground/10 rounded-xl text-[11px] font-display italic font-bold tracking-tight animate-[fade-in-up_0.6s_var(--ease-out-expo)]"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className={i % 3 === 0 ? "text-accent" : i % 3 === 1 ? "text-foreground" : "text-primary"}>{e}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-6">
        {rooms.map((r) => (
          <div key={r.id} className="p-4 bg-foreground/[0.03] ring-1 ring-foreground/10 rounded-2xl">
            <div className="text-[10px] font-display italic tracking-tight normal-case text-foreground/40 truncate">{r.name}</div>
            <div className="font-extrabold text-2xl mt-1">{r.current}</div>
            <div className="h-1 bg-foreground/10 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${(r.current / r.capacity) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
