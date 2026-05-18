import { createFileRoute } from "@tanstack/react-router";
import { event, rooms, sessions, people, edges } from "@/data/event";
import { Avatar } from "@/components/Avatar";
import { EventMap } from "@/components/EventMap";
import { BRAND_COLORS, setBrandColor, useBrandColor } from "@/data/theme";


export const Route = createFileRoute("/organizer/")({
  head: () => ({ meta: [{ title: "Organizer · Dashboard — synqmap" }] }),
  component: Dashboard,
});

function Dashboard() {
  const brand = useBrandColor() ?? "#ebc020";
  return (
    <div className="p-8 lg:p-12 space-y-12 max-w-6xl">
      <div>
        <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-2">Event</div>
        <h1 className="text-5xl font-extrabold tracking-tight mb-2">{event.name}</h1>
        <p className="text-foreground/60">{event.dates}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Attendees" value={event.attendees.toLocaleString()} />
        <Kpi label="Online now" value={event.online.toLocaleString()} accent />
        <Kpi label="Rooms" value={rooms.length.toString()} />
        <Kpi label="Sessions" value={sessions.length.toString()} />
        <Kpi label="Connections" value={edges.length.toString()} />
        <Kpi label="Avg. occupancy" value="71%" />
        <Kpi label="Cards exchanged" value="842" accent />
        <Kpi label="Briefs published" value="3" />
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-extrabold tracking-tight">Venue map</h2>
        <p className="text-sm text-foreground/60 -mt-2">
          This is the "You are here" map attendees see. Replace the image, rotate, or add floors —
          changes apply to everyone in the event.
        </p>
        <EventMap
          eventId="current"
          role="organizer"
          title="You are here · live for attendees"
        />

      </section>

      <section className="space-y-4">

        <h2 className="text-2xl font-extrabold tracking-tight">Branding</h2>
        <div className="p-6 rounded-3xl ring-1 ring-border bg-background grid md:grid-cols-3 gap-6 items-center">
          <div>
            <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-2">Logo</div>
            <div className="flex items-center gap-2">
              <div className="size-10 bg-primary rounded-lg grid place-items-center">
                <div className="size-3 bg-white rounded-full" />
              </div>
              <span className="font-extrabold tracking-tighter text-xl lowercase">
                synq<span className="text-primary">map</span>
              </span>
            </div>
          </div>
          <div>
            <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-2">Palette</div>
            <div className="flex gap-2 flex-wrap">
              {BRAND_COLORS.map((c) => {
                const active = c.hex.toLowerCase() === brand.toLowerCase();
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setBrandColor(c.hex)}
                    aria-label={`Set primary color to ${c.label}`}
                    aria-pressed={active}
                    title={c.label}
                    className={`size-10 rounded-lg ring-2 transition relative ${
                      active ? "ring-foreground scale-110" : "ring-border hover:ring-foreground/40"
                    }`}
                    style={{ background: c.hex }}
                  >
                    {active && (
                      <span className="absolute inset-0 grid place-items-center text-white mix-blend-difference text-sm font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
              <label
                className="size-10 rounded-lg ring-2 ring-border grid place-items-center cursor-pointer hover:ring-foreground/40 transition text-foreground/40 text-lg"
                title="Custom color"
              >
                +
                <input
                  type="color"
                  className="sr-only"
                  value={brand}
                  onChange={(e) => setBrandColor(e.target.value)}
                />
              </label>
            </div>
            <div className="mt-2 text-[10px] font-display italic text-foreground/40">
              Applies live to attendees & organizers.
            </div>
          </div>
          <div>
            <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-2">Type system</div>
            <div className="font-bold text-lg">Inter / JetBrains Mono</div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-extrabold tracking-tight">Top topics today</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            ["Agent evals", 142, "+38%"],
            ["Local-first", 118, "+24%"],
            ["BLE & hardware", 91, "+12%"],
            ["Funding infra", 78, "+9%"],
            ["Spatial design", 64, "+6%"],
            ["Whisper graphs", 52, "+4%"],
          ].map(([topic, count, delta]) => (
            <div key={topic as string} className="p-5 rounded-2xl ring-1 ring-border flex items-center justify-between">
              <div>
                <div className="font-bold">{topic}</div>
                <div className="text-xs text-foreground/40">{count} mentions</div>
              </div>
              <div className="font-display italic text-sm font-bold text-primary">{delta}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-extrabold tracking-tight">Latest exchanges</h2>
        <div className="rounded-2xl ring-1 ring-border overflow-hidden">
          {edges.slice(0, 6).map((e, i) => {
            const a = people.find((p) => p.id === e.source)!;
            const b = people.find((p) => p.id === e.target)!;
            return (
              <div
                key={i}
                className="flex items-center gap-4 px-5 py-3 border-b border-border last:border-b-0 hover:bg-foreground/[0.02]"
              >
                <div className="font-display italic text-[10px] text-foreground/30 w-12">{String(i + 1).padStart(2, "0")}</div>
                <Avatar person={a} size={28} />
                <div className="text-primary">↔</div>
                <Avatar person={b} size={28} />

                <div className="flex-1 text-sm">
                  <span className="font-bold">{a.name}</span> & <span className="font-bold">{b.name}</span>
                </div>
                <div className="text-xs text-foreground/50 hidden md:block">{e.reason}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`p-5 rounded-2xl ring-1 ring-border ${accent ? "bg-primary-soft ring-primary/20" : ""}`}>
      <div className="font-display italic text-3xl font-extrabold mb-1 tracking-tight">{value}</div>
      <div className="text-[10px] text-foreground/40 uppercase font-bold tracking-widest">{label}</div>
    </div>
  );
}
