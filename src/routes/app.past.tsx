import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { pastEvents, people } from "@/data/event";
import { Avatar } from "@/components/Avatar";
import { ShareLinkedInButton, ShareLinkedInIcon } from "@/components/ShareLinkedIn";

export const Route = createFileRoute("/app/past")({
  head: () => ({ meta: [{ title: "Past events — synqmap" }] }),
  component: PastEvents,
});

function PastEvents() {
  const totalCards = pastEvents.reduce((s, e) => s + e.cards, 0);
  const totalEvents = pastEvents.length;
  const totalHours = pastEvents.reduce((s, e) => s + e.hours, 0);
  const featured = pastEvents[0];
  const rest = pastEvents.slice(1);

  return (
    <div className="px-5 pt-6 space-y-6">
      <div>
        <div className="text-[10px] font-display italic tracking-tight normal-case text-foreground/50">your archive</div>
        <h1 className="font-extrabold text-3xl tracking-tight leading-none mt-1">
          Past events
        </h1>
        <p className="font-display italic text-foreground/60 text-base leading-snug mt-2">
          Every room you walked into, every card you exchanged — replayed.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="events" value={totalEvents} />
        <Stat label="cards" value={totalCards} />
        <Stat label="hours" value={totalHours} />
      </div>

      {/* Featured */}
      <Link
        to="/app/wrapped"
        search={{ e: featured.id } as never}
        className="block relative aspect-[5/6] rounded-3xl overflow-hidden text-white active:scale-[0.99] transition-transform"
        style={{ background: featured.cover }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
        <FeaturedDots />
        <div className="relative h-full p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-display italic tracking-tight text-white/80">{featured.date} · {featured.city}</span>
            <span className="px-2 py-1 rounded-full bg-white/15 backdrop-blur text-[9px] font-bold uppercase tracking-widest">
              Featured wrap
            </span>
          </div>
          <div>
            <h2 className="font-extrabold text-4xl tracking-tight leading-[0.95]">{featured.name}</h2>
            <p className="font-display italic text-white/85 text-lg mt-2">
              {featured.newConnections} new connections in {featured.hours} hours.
            </p>
            <div className="flex gap-2 mt-4">
              {featured.topPeople.slice(0, 4).map((pid, i) => {
                const p = people.find((x) => x.id === pid);
                if (!p) return null;
                return (
                  <div
                    key={pid}
                    className="rounded-full ring-2 ring-black/30 -ml-2 first:ml-0 overflow-hidden"
                    style={{ zIndex: 10 - i }}
                  >
                    <Avatar person={p} size={36} />
                  </div>
                );
              })}

              <div className="size-9 rounded-full bg-white/15 backdrop-blur grid place-items-center text-[10px] font-bold -ml-2">
                +{featured.cards - 4}
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2">
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-foreground font-bold text-sm">
                Open wrap
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </div>
              <ShareLinkedInButton
                url={`/app/wrapped?e=${featured.id}`}
                label="Share"
                variant="dark"
              />
            </div>
          </div>
        </div>
      </Link>

      {/* Older events list */}
      <div className="space-y-3">
        <div className="text-[10px] font-display italic tracking-tight text-foreground/50">earlier</div>
        {rest.map((ev, i) => (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.5 }}
          >
            <Link
              to="/app/wrapped"
              search={{ e: ev.id } as never}
              className="flex items-stretch gap-3 rounded-2xl ring-1 ring-border overflow-hidden active:bg-foreground/5 transition-colors"
            >
              <div
                className="w-20 shrink-0 relative"
                style={{ background: ev.cover }}
              >
                <div className="absolute inset-0 grid place-items-center text-white font-extrabold text-2xl font-display italic">
                  {ev.cards}
                </div>
              </div>
              <div className="flex-1 py-3 pr-3 min-w-0 flex flex-col justify-center">
                <div className="font-extrabold text-base tracking-tight truncate">{ev.name}</div>
                <div className="text-[11px] text-foreground/60 truncate">{ev.date} · {ev.city}</div>
                <div className="flex gap-3 mt-1.5 font-display italic text-[11px] text-foreground/50">
                  <span>{ev.newConnections} new</span>
                  <span>·</span>
                  <span>{ev.hours}h</span>
                  <span>·</span>
                  <span>{ev.topTopics[0].label}</span>
                </div>
              </div>
              <div className="self-center pr-4 text-foreground/30">→</div>
            </Link>
          </motion.div>
        ))}
      </div>

      <Link
        to="/app/map"
        className="block text-center rounded-2xl ring-1 ring-border p-4 hover:bg-foreground/5 transition-colors"
      >
        <div className="font-extrabold text-sm tracking-tight">End-of-day map</div>
        <div className="font-display italic text-foreground/60 text-xs mt-0.5">View today's personal artifact</div>
      </Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl ring-1 ring-border p-3 text-center">
      <div className="font-display italic text-3xl tracking-tight leading-none">{value}</div>
      <div className="text-[10px] text-foreground/50 mt-1.5 font-display italic">{label}</div>
    </div>
  );
}

function FeaturedDots() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-30 mix-blend-overlay" viewBox="0 0 200 240" preserveAspectRatio="none">
      {Array.from({ length: 60 }).map((_, i) => {
        const x = ((i * 37) % 200);
        const y = ((i * 53) % 240);
        const r = ((i * 7) % 3) + 0.6;
        return <circle key={i} cx={x} cy={y} r={r} fill="white" />;
      })}
    </svg>
  );
}
