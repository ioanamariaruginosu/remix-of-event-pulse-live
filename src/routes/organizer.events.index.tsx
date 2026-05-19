import { createFileRoute, Link } from "@tanstack/react-router";
import { event, pastEvents } from "@/data/event";

export const Route = createFileRoute("/organizer/events/")({
  head: () => ({ meta: [{ title: "Organizer · Events — synqmap" }] }),
  component: Events,
});

type EventRow = {
  id: string;
  name: string;
  date: string;
  city: string;
  attendees: number;
  status: "live" | "upcoming" | "draft" | "past";
  cover: string;
};

const upcoming: EventRow[] = [
  {
    id: "ue1",
    name: "Helsinki Founders Week",
    date: "Sep 14–16, 2026",
    city: "Helsinki",
    attendees: 480,
    status: "upcoming",
    cover: "linear-gradient(135deg,#a78bfa,#f472b6)",
  },
  {
    id: "ue2",
    name: "Paris Design Salon",
    date: "Oct 02, 2026",
    city: "Paris",
    attendees: 120,
    status: "draft",
    cover: "linear-gradient(135deg,#fbbf24,#fb7185)",
  },
];

function Events() {
  const live: EventRow = {
    id: "current",
    name: event.name,
    date: event.dates,
    city: "Rotterdam",
    attendees: event.attendees,
    status: "live",
    cover: "linear-gradient(135deg,#7c3aed,#22d3ee)",
  };

  const past: EventRow[] = pastEvents.map((p) => ({
    id: p.id,
    name: p.name,
    date: p.date,
    city: p.city,
    attendees: p.attendees,
    status: "past",
    cover: p.cover,
  }));

  return (
    <div className="p-8 lg:p-12 space-y-12 max-w-6xl">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-2">
            Workspace
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-2">Events</h1>
          <p className="text-foreground/60 max-w-xl">
            Spin up a new gathering, manage what's running, and revisit the archive.
          </p>
        </div>
        <Link
          to="/organizer/events/new"
          className="px-5 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
        >
          + New event
        </Link>
      </div>

      <section className="space-y-4">
        <SectionLabel>Live now</SectionLabel>
        <EventCard row={live} accent />
      </section>

      <section className="space-y-4">
        <SectionLabel>Upcoming & drafts</SectionLabel>
        <div className="grid md:grid-cols-2 gap-4">
          {upcoming.map((e) => (
            <EventCard key={e.id} row={e} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionLabel>Archive</SectionLabel>
        <div className="grid md:grid-cols-3 gap-4">
          {past.map((e) => (
            <EventCard key={e.id} row={e} compact />
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40">{children}</div>;
}

function EventCard({ row, accent, compact }: { row: EventRow; accent?: boolean; compact?: boolean }) {
  const tone =
    row.status === "live"
      ? "bg-primary-soft text-primary"
      : row.status === "upcoming"
        ? "bg-accent/40 text-foreground"
        : row.status === "draft"
          ? "bg-foreground/5 text-foreground/60"
          : "bg-foreground/5 text-foreground/50";

  return (
    <div
      className={`rounded-3xl ring-1 overflow-hidden bg-background flex flex-col ${
        accent ? "ring-primary/30" : "ring-border"
      }`}
    >
      <div className={`relative ${compact ? "h-24" : "h-40"}`} style={{ background: row.cover }}>
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span
            className={`text-[9px] font-display italic font-bold uppercase tracking-widest px-2 py-1 rounded ${tone}`}
          >
            {row.status === "live" && (
              <span className="inline-block size-1.5 bg-primary rounded-full animate-pulse mr-1.5 align-middle" />
            )}
            {row.status}
          </span>
        </div>
      </div>
      <div className={`p-5 flex-1 flex flex-col gap-3 ${compact ? "" : "p-6"}`}>
        <div>
          <h3 className={`font-extrabold tracking-tight ${compact ? "text-lg" : "text-2xl"}`}>{row.name}</h3>
          <div className="text-xs text-foreground/50 mt-1">
            {row.date} · {row.city}
          </div>
        </div>
        <div className="flex items-end justify-between mt-auto pt-2">
          <div>
            <div className="font-display italic text-2xl font-extrabold">{row.attendees.toLocaleString()}</div>
            <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40">
              {row.status === "past" ? "attendees" : "registered"}
            </div>
          </div>
          <div className="flex gap-2">
            {row.status === "live" && (
              <Link
                to="/organizer/live"
                className="px-3 py-1.5 text-xs font-bold bg-foreground text-white rounded-lg hover:bg-primary transition-colors"
              >
                Live ops ↗
              </Link>
            )}
            {row.status === "past" ? (
              <Link
                to="/organizer/events/$eventId"
                params={{ eventId: row.id }}
                className="px-3 py-1.5 text-xs font-bold bg-foreground text-white rounded-lg hover:bg-primary transition-colors"
              >
                Analytics ↗
              </Link>
            ) : row.status === "live" ? (
              <Link
                to="/organizer"
                className="px-3 py-1.5 text-xs font-bold bg-foreground text-white rounded-lg hover:bg-primary transition-colors"
              >
                Open ↗
              </Link>
            ) : (
              <Link
                to="/organizer/events/$eventId"
                params={{ eventId: row.id }}
                className="px-3 py-1.5 text-xs font-bold bg-foreground text-white rounded-lg hover:bg-primary transition-colors"
              >
                Open ↗
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
