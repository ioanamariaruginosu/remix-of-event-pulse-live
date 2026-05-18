import { createFileRoute } from "@tanstack/react-router";
import { NetworkGraph } from "@/components/NetworkGraph";
import { edges } from "@/data/event";

export const Route = createFileRoute("/app/map")({
  head: () => ({ meta: [{ title: "Your map — synqmap" }] }),
  component: MapView,
});

function MapView() {
  const count = edges.filter((e) => e.source === "you" || e.target === "you").length;
  return (
    <div className="px-5 pt-6 space-y-5 pb-10">
      <div>
        <div className="text-[10px] font-mono text-foreground/40 uppercase tracking-widest">End of day artifact</div>
        <h1 className="font-extrabold text-2xl tracking-tight">Your Map</h1>
      </div>

      <div className="rounded-3xl overflow-hidden bg-foreground p-4 relative">
        <div className="aspect-square">
          <NetworkGraph scale="personal" centerId="you" height={300} showLabels />
        </div>
        <div className="absolute top-6 left-6 right-6 flex items-start justify-between text-white">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-white/40">Eurhack 2026 · Day 1</div>
            <div className="font-extrabold text-lg tracking-tight">Your Trail</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl font-extrabold">{count}</div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-white/40">connections</div>
          </div>
        </div>
        <div className="absolute bottom-6 left-6 right-6 flex justify-between font-mono text-[9px] uppercase tracking-widest text-white/40">
          <span>EURHACK·2026</span>
          <span>BERLIN</span>
        </div>
      </div>

      <button className="w-full py-3 bg-primary text-white rounded-xl font-bold">Download as image</button>
      <p className="text-xs text-foreground/50 text-center">Your take-home: a portrait of the network you built today.</p>
    </div>
  );
}
