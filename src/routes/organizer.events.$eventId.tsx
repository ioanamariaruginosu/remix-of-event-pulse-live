import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { pastEvents, people, edges, type PastEvent } from "@/data/event";
import { Avatar } from "@/components/Avatar";
import { EventMap } from "@/components/EventMap";

const upcomingEvents = [
  { id: "ue1", name: "Helsinki Founders Week", date: "Sep 14–16, 2026", city: "Helsinki", attendees: 480, status: "upcoming" as const, cover: "linear-gradient(135deg,#a78bfa,#f472b6)" },
  { id: "ue2", name: "Paris Design Salon", date: "Oct 02, 2026", city: "Paris", attendees: 120, status: "draft" as const, cover: "linear-gradient(135deg,#fbbf24,#fb7185)" },
];
type UpcomingEvent = (typeof upcomingEvents)[number];


export const Route = createFileRoute("/organizer/events/$eventId")({
  head: ({ params }) => ({
    meta: [{ title: `Organizer · ${params.eventId} — synqmap` }],
  }),
  loader: ({ params }) => {
    const past = pastEvents.find((e) => e.id === params.eventId);
    if (past) return { kind: "past" as const, ev: past };
    const upcoming = upcomingEvents.find((e) => e.id === params.eventId);
    if (upcoming) return { kind: "upcoming" as const, ev: upcoming };
    throw notFound();
  },
  notFoundComponent: () => (
    <div className="p-12">
      <h1 className="font-extrabold text-2xl mb-2">Event not found</h1>
      <Link to="/organizer/events" className="text-primary font-bold">← Back to events</Link>
    </div>
  ),
  component: EventDetail,
});

function EventDetail() {
  const data = Route.useLoaderData() as
    | { kind: "past"; ev: PastEvent }
    | { kind: "upcoming"; ev: UpcomingEvent };
  if (data.kind === "past") return <ArchiveEvent />;
  return <ConfigureEvent ev={data.ev} />;
}

function ConfigureEvent({ ev }: { ev: UpcomingEvent }) {
  const sections: { to: "/organizer" | "/organizer/rooms" | "/organizer/sessions" | "/organizer/invitations" | "/organizer/door"; label: string; copy: string }[] = [
    { to: "/organizer", label: "Dashboard & map", copy: "Edit the venue map, branding, and headline KPIs." },
    { to: "/organizer/rooms", label: "Rooms", copy: "Add, rename, or remove rooms and tracks." },
    { to: "/organizer/sessions", label: "Schedule", copy: "Plan sessions, speakers, and time slots." },
    { to: "/organizer/invitations", label: "Invitations", copy: "Send invites and manage RSVPs." },
    { to: "/organizer/door", label: "Door check-in", copy: "Pre-print badges and configure check-in." },
  ];
  return (
    <div className="p-8 lg:p-12 space-y-10 max-w-5xl">
      <div>
        <Link to="/organizer/events" className="text-xs font-bold text-foreground/50 hover:text-foreground inline-flex items-center gap-1">← All events</Link>
        <div className="mt-4 rounded-3xl overflow-hidden ring-1 ring-border">
          <div className="h-32" style={{ background: ev.cover }} />
          <div className="p-6 sm:p-8 space-y-2">
            <span className={`inline-block text-[9px] font-display italic font-bold uppercase tracking-widest px-2 py-1 rounded ${ev.status === "upcoming" ? "bg-accent/40 text-foreground" : "bg-foreground/5 text-foreground/60"}`}>
              {ev.status}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{ev.name}</h1>
            <div className="text-sm text-foreground/60">{ev.date} · {ev.city} · {ev.attendees.toLocaleString()} registered</div>
          </div>
        </div>
      </div>

      <div>
        <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-3">Configure</div>
        <div className="grid sm:grid-cols-2 gap-3">
          {sections.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="p-5 rounded-2xl ring-1 ring-border bg-background hover:ring-primary/40 hover:bg-foreground/[0.02] transition-colors block"
            >
              <div className="font-bold tracking-tight">{s.label}</div>
              <div className="text-xs text-foreground/60 mt-1">{s.copy}</div>
              <div className="text-[10px] font-display italic font-bold uppercase tracking-widest text-primary mt-3">Open ↗</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ArchiveEvent() {
  const data = Route.useLoaderData() as { kind: "past"; ev: PastEvent };
  const ev = data.ev;

  // Derived analytics
  const avgConversation = +(ev.hours * 60 / Math.max(1, ev.conversations)).toFixed(1);
  const cardsPerHour = +(ev.cards / Math.max(1, ev.hours)).toFixed(1);
  const matchRate = Math.round((ev.newConnections / Math.max(1, ev.cards)) * 100);
  const topicTotal = ev.topTopics.reduce((s, t) => s + t.count, 0);

  // Fake clusters built from edges + topPeople (illustrative)
  const clusters = ev.topTopics.slice(0, 4).map((t, i) => {
    const memberIds = ev.topPeople.slice(0, 2 + (i % 2)).concat(
      people
        .filter((p) => p.tags.some((tag) => tag.includes(t.label.slice(0, 3))))
        .slice(0, 3)
        .map((p) => p.id),
    );
    const unique = Array.from(new Set(memberIds)).slice(0, 5);
    return { topic: t.label, count: t.count, members: unique };
  });

  // Hourly density curve (deterministic from id)
  const seed = ev.id.charCodeAt(2);
  const hourly = Array.from({ length: 12 }, (_, i) => {
    const v = Math.abs(Math.sin((seed + i) * 1.7)) * 80 + 20;
    return Math.round(v);
  });

  return (
    <div className="p-8 lg:p-12 space-y-10 max-w-6xl">
      {/* Header */}
      <div>
        <Link
          to="/organizer/events"
          className="text-xs font-bold text-foreground/50 hover:text-foreground inline-flex items-center gap-1"
        >
          ← Events
        </Link>
        <div className="mt-3 rounded-3xl overflow-hidden ring-1 ring-border">
          <div className="relative h-44" style={{ background: ev.cover }}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 text-white flex items-end justify-between">
              <div>
                <span className="px-2 py-1 bg-white/15 backdrop-blur rounded text-[9px] font-display italic font-bold uppercase tracking-widest">
                  Archive
                </span>
                <h1 className="font-extrabold text-4xl tracking-tight mt-2">{ev.name}</h1>
                <div className="font-display italic text-sm text-white/80 mt-1">
                  {ev.date} · {ev.city}
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="font-display italic text-3xl font-extrabold">{ev.attendees.toLocaleString()}</div>
                <div className="font-display italic text-[10px] uppercase tracking-widest text-white/60">attendees</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="cards exchanged" value={ev.cards} />
        <KPI label="new connections" value={ev.newConnections} suffix={`${matchRate}% rate`} />
        <KPI label="conversations" value={ev.conversations} suffix={`${avgConversation} min avg`} />
        <KPI label="cards / hour" value={cardsPerHour} suffix={`over ${ev.hours}h`} />
      </section>

      {/* Topics */}
      <section className="space-y-4">
        <SectionHeader title="Topics people connected on" sub="What conversations actually happened in the room." />
        <div className="grid md:grid-cols-[1.2fr_1fr] gap-5">
          <div className="rounded-2xl ring-1 ring-border p-5 space-y-3">
            {ev.topTopics.map((t) => {
              const pct = Math.round((t.count / topicTotal) * 100);
              return (
                <div key={t.label}>
                  <div className="flex items-end justify-between mb-1.5">
                    <div className="font-bold text-sm">#{t.label}</div>
                    <div className="font-display italic text-xs text-foreground/50">
                      {t.count} convos · {pct}%
                    </div>
                  </div>
                  <div className="h-2 bg-foreground/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="rounded-2xl bg-foreground text-white p-5 flex flex-col">
            <div className="font-display italic text-[10px] uppercase tracking-widest text-white/40 mb-2">
              Headline insight
            </div>
            <div className="font-extrabold text-xl tracking-tight leading-tight">
              "{ev.topTopics[0].label}" carried {Math.round((ev.topTopics[0].count / topicTotal) * 100)}% of
              the room's conversations.
            </div>
            <div className="mt-auto pt-4 font-display italic text-xs text-white/60">
              Longest chat: {ev.longestChat.person} · {ev.longestChat.minutes} min
            </div>
          </div>
        </div>
      </section>

      {/* Clusters */}
      <section className="space-y-4">
        <SectionHeader title="Connection clusters" sub="Who formed pods around which topic." />
        <div className="grid md:grid-cols-2 gap-4">
          {clusters.map((c) => (
            <div key={c.topic} className="rounded-2xl ring-1 ring-border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-extrabold text-lg tracking-tight">#{c.topic}</div>
                <div className="font-display italic text-xs text-foreground/50">{c.members.length} people</div>
              </div>
              <div className="flex -space-x-2">
                {c.members.map((id) => {
                  const p = people.find((x) => x.id === id);
                  if (!p) return null;
                  return (
                    <div key={id} className="ring-2 ring-background rounded-full">
                      <Avatar person={p} size={36} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Activity over time */}
      <section className="space-y-4">
        <SectionHeader title="Activity over time" sub="Card exchanges per hour bucket." />
        <div className="rounded-2xl ring-1 ring-border p-5">
          <div className="h-32 flex items-end gap-1.5">
            {hourly.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full bg-primary/80 rounded-sm hover:bg-primary transition-colors"
                  style={{ height: `${h}%` }}
                />
                <div className="font-display italic text-[9px] text-foreground/40">{i + 9}h</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rooms breakdown */}
      <section className="space-y-4">
        <SectionHeader title="Rooms" sub="How the floor plan was used." />
        <EventMap
          eventId={ev.id}
          role="organizer"
          title="Venue map · organizer controls"
        />


        <div className="grid md:grid-cols-3 gap-3">
          {ev.rooms.map((r, i) => {
            const share = Math.round(((seed + i * 7) % 60) + 20);
            return (
              <div key={r} className="rounded-xl ring-1 ring-border p-4">
                <div className="font-bold text-sm truncate">{r}</div>
                <div className="font-display italic text-2xl font-extrabold mt-1">{share}%</div>
                <div className="font-display italic text-[10px] text-foreground/40 uppercase tracking-widest">
                  share of cards
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top people */}
      <section className="space-y-4">
        <SectionHeader title="Most connected" sub="Highest in-degree on the night." />
        <div className="space-y-2">
          {ev.topPeople.map((id, i) => {
            const p = people.find((x) => x.id === id);
            if (!p) return null;
            const deg = edges.filter((e) => e.source === id || e.target === id).length + 4 - i;
            return (
              <div
                key={id}
                className="flex items-center gap-3 p-3 rounded-xl ring-1 ring-border"
              >
                <div className="font-display italic text-foreground/40 w-5 text-sm">{i + 1}</div>
                <Avatar person={p} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{p.name}</div>
                  <div className="text-[11px] text-foreground/50 truncate">{p.oneLiner}</div>
                </div>
                <div className="text-right">
                  <div className="font-display italic text-lg font-extrabold">{deg}</div>
                  <div className="font-display italic text-[9px] text-foreground/40 uppercase tracking-widest">
                    connections
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Highlights */}
      <section className="space-y-4">
        <SectionHeader title="Highlights" sub="Surfaced from attendee wraps." />
        <ul className="space-y-2">
          {ev.highlights.map((h, i) => (
            <li
              key={i}
              className="p-4 rounded-xl bg-accent/30 font-display italic text-sm leading-snug"
            >
              "{h}"
            </li>
          ))}
        </ul>
      </section>

      <div className="pt-4 border-t border-border flex flex-wrap gap-3">
        <button className="px-4 py-2.5 rounded-xl bg-foreground text-white font-bold text-sm">
          Export report (PDF)
        </button>
        <button className="px-4 py-2.5 rounded-xl ring-1 ring-border font-bold text-sm hover:bg-foreground/5">
          Download CSV
        </button>
        <Link
          to="/organizer/events"
          className="px-4 py-2.5 rounded-xl ring-1 ring-border font-bold text-sm hover:bg-foreground/5 ml-auto"
        >
          ← All events
        </Link>
      </div>
    </div>
  );
}

function KPI({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  return (
    <div className="rounded-2xl ring-1 ring-border p-4">
      <div className="font-display italic text-3xl font-extrabold tracking-tight">{value}</div>
      <div className="font-display italic text-[10px] text-foreground/40 uppercase tracking-widest mt-1">
        {label}
      </div>
      {suffix && (
        <div className="font-display italic text-[11px] text-foreground/60 mt-1.5">{suffix}</div>
      )}
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <h2 className="font-extrabold text-xl tracking-tight">{title}</h2>
      {sub && <div className="font-display italic text-sm text-foreground/50 mt-0.5">{sub}</div>}
    </div>
  );
}
