import { createFileRoute } from "@tanstack/react-router";
import { NetworkGraph } from "@/components/NetworkGraph";
import { Avatar } from "@/components/Avatar";
import { edges, people } from "@/data/event";

export const Route = createFileRoute("/app/map")({
  head: () => ({ meta: [{ title: "Your map — synqmap" }] }),
  component: MapView,
});

function MapView() {
  const you = people[0];
  const myEdges = edges.filter((e) => e.source === "you" || e.target === "you");
  const connected = myEdges
    .map((e) => people.find((p) => p.id === (e.source === "you" ? e.target : e.source))!)
    .filter(Boolean);

  return (
    <div className="px-5 pt-6 space-y-5 pb-10">
      <div>
        <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest">
          End of day artifact
        </div>
        <h1 className="font-extrabold text-2xl tracking-tight">Your Map</h1>
        <p className="text-xs text-foreground/50 mt-1">
          A portrait of the network you built today — every face is a tap.
        </p>
      </div>

      {/* Hero artifact: graph + avatar collage */}
      <div className="rounded-3xl overflow-hidden bg-foreground p-4 relative">
        <div className="aspect-square">
          <NetworkGraph scale="personal" centerId="you" height={300} showLabels />
        </div>
        <div className="absolute top-6 left-6 right-6 flex items-start justify-between text-white">
          <div>
            <div className="font-display italic text-[9px] uppercase tracking-widest text-white/40">
              Eurhack 2026 · Day 1
            </div>
            <div className="font-extrabold text-lg tracking-tight">Your Trail</div>
          </div>
          <div className="text-right">
            <div className="font-display italic text-2xl font-extrabold">{connected.length}</div>
            <div className="font-display italic text-[9px] uppercase tracking-widest text-white/40">
              connections
            </div>
          </div>
        </div>
        <div className="absolute bottom-6 left-6 right-6 flex justify-between font-display italic text-[9px] uppercase tracking-widest text-white/40">
          <span>EURHACK·2026</span>
          <span>BERLIN</span>
        </div>
      </div>

      {/* Avatar collage — paper / sticker aesthetic */}
      <div className="relative rounded-3xl bg-accent/40 p-5 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 8px)",
          }}
        />
        <div className="relative flex items-center justify-between mb-4">
          <div>
            <div className="text-[9px] font-display italic uppercase tracking-widest text-foreground/50">
              People you tapped
            </div>
            <div className="font-extrabold text-base tracking-tight">The deck, as faces</div>
          </div>
          <Avatar person={you} size={44} className="ring-4 ring-background shadow-lg" />
        </div>
        <div className="relative flex flex-wrap gap-2.5 items-center">
          {connected.map((p, i) => (
            <div
              key={p.id}
              className="group relative"
              style={{ transform: `rotate(${(i % 5) * 2 - 4}deg)` }}
            >
              <Avatar
                person={p}
                size={56}
                className="ring-4 ring-background shadow-md hover:scale-110 hover:rotate-0 transition"
              />
              <div className="absolute -bottom-1 -right-1 size-3 rounded-full ring-2 ring-background" style={{ background: p.color }} />
            </div>
          ))}
        </div>
        <div className="relative mt-4 text-[10px] font-display italic text-foreground/50">
          ✺ each sticker = one mutual tap. peel & keep.
        </div>
      </div>

      <button className="w-full py-3 bg-primary text-white rounded-xl font-bold">
        Download as image
      </button>
      <p className="text-xs text-foreground/50 text-center">
        Your take-home: a portrait of the network you built today.
      </p>
    </div>
  );
}
