import { createFileRoute } from "@tanstack/react-router";
import { rooms } from "@/data/event";

export const Route = createFileRoute("/organizer/rooms")({
  head: () => ({ meta: [{ title: "Organizer · Rooms — synqmap" }] }),
  component: Rooms,
});

function Rooms() {
  return (
    <div className="p-8 lg:p-12 space-y-8 max-w-5xl">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-2">Venue</div>
          <h1 className="text-4xl font-extrabold tracking-tight">Rooms</h1>
          <p className="text-foreground/60 mt-2 max-w-xl">Physical zones in the venue. Each gets a QR code at the entrance as a BLE fallback.</p>
        </div>
        <button className="px-5 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
          + Add room
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {rooms.map((r) => (
          <div key={r.id} className="p-6 ring-1 ring-border rounded-2xl bg-background">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-extrabold tracking-tight">{r.name}</h3>
                  <span
                    className={`text-[9px] font-display italic tracking-tight normal-case px-2 py-0.5 rounded ${
                      r.kind === "session" ? "bg-primary-soft text-primary" : "bg-accent/40 text-foreground"
                    }`}
                  >
                    {r.kind}
                  </span>
                </div>
                <div className="text-xs text-foreground/40 font-display italic">ROOM_ID: {r.id.toUpperCase()}</div>
              </div>
              <div className="size-16 rounded-lg bg-foreground p-2 grid place-items-center">
                <div
                  className="size-full bg-white"
                  style={{
                    backgroundImage:
                      "repeating-conic-gradient(#0f172a 0% 25%, #ffffff 0% 50%)",
                    backgroundSize: "8px 8px",
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-display italic tracking-tight normal-case text-foreground/40 mb-1">
                <span>Occupancy</span>
                <span>{r.current} / {r.capacity}</span>
              </div>
              <div className="h-2 bg-foreground/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${(r.current / r.capacity) * 100}%` }} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 py-2 text-xs font-bold ring-1 ring-border rounded-lg hover:bg-foreground/5">Edit</button>
              <button className="flex-1 py-2 text-xs font-bold ring-1 ring-border rounded-lg hover:bg-foreground/5">Print QR</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
