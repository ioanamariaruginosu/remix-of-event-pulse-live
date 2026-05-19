import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { NetworkGraph } from "@/components/NetworkGraph";
import { LiveNetworkGraph } from "@/components/LiveNetworkGraph";
import { LiveTicker } from "@/components/LiveTicker";
import { IdentityCard } from "@/components/IdentityCard";
import { Logo } from "@/components/Logo";
import { people, event, rooms } from "@/data/event";
import { avatarUrl, defaultAvatarFor } from "@/data/avatars";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "synqmap. Make IRL events unforgettable." },
      {
        name: "description",
        content:
          "Organizers empowered, never overwhelmed. AI handles the grind so you can curate meaningful, personal experiences that keep teaching long after the room clears.",
      },
      { property: "og:title", content: "synqmap. Make IRL events unforgettable." },
      {
        property: "og:description",
        content: "Events that do not end. They evolve into living knowledge engines.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const you = people[0];
  const sample = people[1];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex gap-8 text-sm font-medium items-center">
            <a href="#graph" className="hover:text-primary transition-colors">The Graph</a>
            <a href="#card" className="hover:text-primary transition-colors">Identity</a>
            <a href="#scales" className="hover:text-primary transition-colors">Three Scales</a>
            <div className="px-3 py-1 bg-accent/40 text-foreground rounded-full text-[10px] font-bold tracking-widest uppercase flex items-center gap-2">
              <span className="size-1.5 bg-primary rounded-full animate-pulse" />
              Live: {event.online.toLocaleString()} Online
            </div>
          </div>
          <Link
            to="/login"
            className="bg-foreground text-background px-5 py-2 rounded-full text-sm font-bold hover:bg-primary transition-colors"
          >
            Join Us
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-40 pointer-events-none">
          <NetworkGraph scale="event" height={700} />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/60 via-background/30 to-background pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-soft text-primary rounded-full text-[10px] font-display italic font-bold uppercase tracking-widest mb-8 ring-1 ring-primary/20"
          >
            <span className="size-1.5 bg-primary rounded-full animate-pulse" />
            {event.name} · {event.dates}
          </motion.div>

          <h1 className="text-[2.5rem] sm:text-6xl md:text-8xl lg:text-[110px] font-extrabold tracking-tight leading-[0.95] text-balance mb-8 break-words">
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              MAKE IRL EVENTS
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="block text-primary italic"
            >
              UNFORGETTABLE.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-2xl mx-auto text-lg md:text-xl text-foreground/60 mb-12 text-pretty"
          >
            A PWA that turns live events into a living network — exchange identity cards in a tap, see the room as a graph, and never lose the connections after the lights go down.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link
              to="/organizer/login"
              className="group relative px-6 sm:px-8 py-4 sm:py-5 bg-primary text-white rounded-2xl font-bold text-lg overflow-hidden transition-transform hover:-translate-y-1 active:scale-95"
            >
              <span className="relative z-10">I'm organizing an event</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Link>
            <Link
              to="/login"
              className="px-6 sm:px-8 py-4 sm:py-5 bg-white border-2 border-foreground/10 text-foreground rounded-2xl font-bold text-lg hover:border-primary transition-all"
            >
              Join an event
            </Link>
          </motion.div>
        </div>
      </section>

      <LiveTicker />

      <main className="max-w-7xl mx-auto px-6 py-24 md:py-32 space-y-32 md:space-y-48">
        {/* Mental model */}
        <section id="graph" className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-block px-4 py-1.5 bg-primary-soft text-primary font-display italic text-[10px] font-bold tracking-widest uppercase rounded-full ring-1 ring-primary/20">
              The Mental Model
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-balance">
              Rooms are physical.<br />Sessions are temporal.
            </h2>
            <p className="text-lg text-foreground/60 leading-relaxed text-pretty">
              A <strong className="text-foreground">room</strong> is a zone in the venue — Main Stage, Track A, the Coffee Bar. It exists all day. A <strong className="text-foreground">session</strong> is a scheduled thing happening inside a room. You can stand in a room with no session; you can't sit in a session without being in its room. That distinction is the entire data model.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              {rooms.slice(0, 4).map((r) => (
                <div key={r.id} className="p-4 ring-1 ring-border rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">{r.name}</span>
                    <span className={`text-[9px] font-display italic tracking-tight normal-case px-1.5 py-0.5 rounded ${r.kind === "session" ? "bg-primary-soft text-primary" : "bg-accent/40 text-foreground"}`}>
                      {r.kind}
                    </span>
                  </div>
                  <div className="h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(r.current / r.capacity) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px] font-display italic text-foreground/40">
                    <span>{r.current} here</span>
                    <span>cap {r.capacity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="aspect-[4/3] max-h-[360px] rounded-[24px] overflow-hidden ring-1 ring-primary/20 relative bg-gradient-to-br from-[#2d1a52] via-[#4c2a87] to-[#7c3aed]">
            <LiveNetworkGraph height={320} />
          </div>
        </section>

        {/* Rooms · EventLabs integration */}
        <section id="rooms" className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-block px-4 py-1.5 bg-primary-soft text-primary font-display italic text-[10px] font-bold tracking-widest uppercase rounded-full ring-1 ring-primary/20">
              Inside the Room
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-balance">
              Upload your experience.<br />
              <span className="text-primary italic">Read the room</span> in real time.
            </h2>
            <p className="text-lg text-foreground/60 leading-relaxed text-pretty">
              Every room becomes a living artifact. Drop in photos and notes from the
              session, watch the live transcript scroll as the speaker talks, and walk
              out with a shareable recap auto-generated for you.
            </p>
            <p className="text-sm text-foreground/50 leading-relaxed text-pretty">
              Powered by our integrations with <strong className="text-foreground">RecapHub</strong> and
              <strong className="text-foreground"> Translingo</strong> from
              <span className="font-display italic"> EventLabs</span> — recordings turn
              into clean summaries and live captions translate the room across languages,
              all stitched back into your synqmap graph.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <RoomFeatureCard
              tag="Upload"
              title="Your experience"
              body="Drop photos, notes, takeaways — they pin to the room you were standing in."
            />
            <RoomFeatureCard
              tag="Live"
              title="Transcript"
              body="Watch the speaker's words stream in as captions, searchable the second they're spoken."
              highlight
            />
            <RoomFeatureCard
              tag="RecapHub"
              title="Auto-summaries"
              body="Each session compresses into a shareable recap — speakers, quotes, mindmap."
            />
            <RoomFeatureCard
              tag="Translingo"
              title="Live translation"
              body="Real-time voice translation so language never gates the conversation in the room."
            />
          </div>
        </section>

        {/* Identity card + phone */}
        <section id="card" className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div className="space-y-8 order-2 lg:order-1">
            <div className="inline-block px-4 py-1.5 bg-primary-soft text-primary font-display italic text-[10px] font-bold tracking-widest uppercase rounded-full ring-1 ring-primary/20">
              The Artifact
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-balance">
              Collect identities,<br />not business cards.
            </h2>
            <p className="text-lg text-foreground/60 leading-relaxed text-pretty">
              Tap two phones together. Cards swap. Both vibrate. An edge appears in the live graph and the app tells you exactly why the system matched you. The physical gesture is the consent.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <Stat label="XP today" value="14.2k" />
              <Stat label="Tier" value="Lv 4" accent />
              <Stat label="Cards" value="23" />
            </div>
            <Link
              to="/app/card"
              className="inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all"
            >
              See your card → 
            </Link>
          </div>
          <div className="order-1 lg:order-2 flex justify-center items-center relative h-[560px]">
            <div className="absolute left-0 sm:left-12 top-8 z-10">
              <IdentityCard person={sample} tilt serial="042" />
            </div>
            <div className="absolute right-0 sm:right-0 bottom-0 z-20">
              <IdentityCard person={you} serial="001" />
            </div>
          </div>
        </section>

        {/* Three scales */}
        <section id="scales" className="space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-block px-4 py-1.5 bg-primary-soft text-primary font-display italic text-[10px] font-bold tracking-widest uppercase rounded-full ring-1 ring-primary/20">
              Three Scales
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-balance">
              One network, viewed at three zoom levels.
            </h2>
            <p className="text-lg text-foreground/50 text-pretty">
              The graph is the same data — but the people standing in the venue, the people in a specific room, and the person looking at their own phone each get a different slice of it.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <ScaleCard
              tag="Scale 01 // Macro"
              title="Event Graph"
              copy="The venue-wall spectacle. Every person, topic, and edge pulsing in real time."
              graph={<MiniEventGraph height={300} />}
            />
            <ScaleCard
              tag="Scale 02 // Local"
              title="Room Context"
              copy="When you walk into a room your phone shows just that slice — who's here, what's being asked, who you should meet."
              graph={<MiniRoomGraph height={300} />}
              highlight
            />
            <ScaleCard
              tag="Scale 03 // Ego"
              title="Personal Trail"
              copy="Your node, centered. Every card you collected and the bridge people who connect your clusters."
              graph={<MiniPersonalGraph height={300} />}
            />
          </div>
        </section>

        {/* Final CTA */}
        {/* Vision */}
        {/* Matching algorithm */}
        <section id="matching" className="space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-block px-4 py-1.5 bg-primary-soft text-primary font-display italic text-[10px] font-bold tracking-widest uppercase rounded-full ring-1 ring-primary/20">
              Under the hood
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-balance">
              How matching <span className="text-primary italic">actually</span> works.
            </h2>
          </div>
          <AlgorithmDiagram />
        </section>

        <section id="vision" className="space-y-16">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-block px-4 py-1.5 bg-primary-soft text-primary font-display italic text-[10px] font-bold tracking-widest uppercase rounded-full ring-1 ring-primary/20">
              The Vision
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-balance leading-[0.95]">
              Organizers empowered.<br />
              <span className="text-primary italic">Never overwhelmed.</span>
            </h2>
            <p className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground/80">
              Make IRL events unforgettable.
            </p>
            <p className="text-lg md:text-xl text-foreground/60 leading-relaxed text-pretty">
              AI should handle the grind so organizers can do the human work: curating meaningful, personal experiences. And events should not end. They should evolve. Every talk, every panel, every insight becomes a living knowledge engine that keeps teaching long after the room clears.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <PillarCard
              tag="Pillar 01"
              title="Energy"
              metric="90%"
              metricLabel="of new learning lost in a week without reinforcement"
              copy="The Ebbinghaus forgetting curve is brutal. Roughly half of what attendees learn vanishes within an hour, and close to ninety percent is gone in seven days. synqmap keeps the signal alive with timed reinforcement, so the energy in the room actually compounds."
              source="Ebbinghaus, Memory (1885); replicated by Murre and Dros, PLOS ONE 10(7), 2015."
            />
            <PillarCard
              tag="Pillar 02"
              title="Followup"
              metric="92%"
              metricLabel="of B2B event teams plan to improve post event followup this year"
              copy="Followup failure is universal. Nearly every organizer admits the after event motion is broken, and ROI measurement is even further behind. We turn each handshake into a structured trail your team can actually act on."
              source="Forrester Q1 2024 State of B2B Events Survey, Conrad Mills, July 2024."
              highlight
            />
            <PillarCard
              tag="Pillar 03"
              title="Afterwards"
              metric="1 in 5"
              metricLabel="enterprises integrate their event platform with their marketing stack"
              copy="Anonymous afterwards is the default. Only one in five enterprises connects their primary event platform to the rest of their stack, so attendee data dies in a silo the moment the lights go down. synqmap pipes the live graph straight into the systems your team already uses."
              source="Forrester Q1 2024 State of B2B Events Survey."
            />
          </div>
        </section>

        <section className="bg-primary rounded-[40px] p-12 md:p-16 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/30 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 blur-[120px] rounded-full" />
          <div className="relative z-10 space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-balance">Ready to connect at speed?</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/organizer/login" className="px-8 py-4 bg-white text-primary rounded-2xl font-bold hover:bg-accent transition-colors">
                Organize Your Hub
              </Link>
              <Link to="/venue" className="px-8 py-4 bg-foreground text-white rounded-2xl font-bold ring-1 ring-white/20 hover:bg-foreground/80 transition-colors">
                View the Event
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-foreground text-white/40 py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="size-6 bg-primary rounded-md" />
            <span className="font-bold text-white tracking-tighter lowercase">synq<span className="text-white/40 font-normal">map</span></span>
          </div>
          <div className="flex gap-6 font-display italic text-[10px] font-bold uppercase tracking-widest">
            <a className="hover:text-white transition-colors" href="#">Network Status</a>
            <a className="hover:text-white transition-colors" href="#">Privacy Mesh</a>
            <a className="hover:text-white transition-colors" href="#">Press Kit</a>
          </div>
          <div className="text-[10px] font-display italic">
            SYSTEM_TIME: 14:22:04 // LATENCY: 12ms
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-4 ring-1 ring-border rounded-2xl bg-background">
      <div className={`font-display italic text-2xl font-bold mb-1 ${accent ? "text-primary" : ""}`}>{value}</div>
      <div className="text-[10px] text-foreground/40 uppercase font-bold tracking-wider">{label}</div>
    </div>
  );
}

function AlgoStep({
  n,
  title,
  copy,
  meta,
  highlight,
}: {
  n: string;
  title: string;
  copy: string;
  meta: string;
  highlight?: boolean;
}) {
  return (
    <div className="relative">
      <div
        className={`h-full p-6 rounded-[28px] ring-1 transition-all ${
          highlight
            ? "bg-primary text-white ring-primary"
            : "bg-background ring-border hover:ring-primary/30"
        }`}
      >
        <div
          className={`font-display italic text-[10px] font-bold tracking-widest uppercase mb-3 ${
            highlight ? "text-white/70" : "text-primary"
          }`}
        >
          Step {n}
        </div>
        <h3 className="text-2xl font-extrabold tracking-tight mb-2">{title}</h3>
        <p className={`text-sm leading-relaxed mb-4 ${highlight ? "text-white/80" : "text-foreground/60"}`}>
          {copy}
        </p>
        <div
          className={`text-[10px] font-display italic tracking-tight ${
            highlight ? "text-white/60" : "text-foreground/40"
          }`}
        >
          {meta}
        </div>
      </div>
      {/* Arrow to next step on lg screens */}
      <div
        aria-hidden
        className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10 size-7 rounded-full bg-background ring-1 ring-border items-center justify-center text-primary text-sm font-bold last:hidden"
      >
        →
      </div>
    </div>
  );
}

function AlgorithmDiagram() {
  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="flex flex-col md:flex-row md:items-stretch md:justify-between gap-6 md:gap-3 text-center">
        <AlgoCol kicker="Tower A · 20%" title="Keyword" sub="Jaccard · tags + tokens" />
        <AlgoCol kicker="Tower B · 80%" title="Embedding" sub="cosine · 1536-d vectors" />
        <AlgoArrow />
        <AlgoCol kicker="Fuse" title="RRF" sub="Σ 1 / (k + rank)" emphasis />
        <AlgoArrow />
        <AlgoCol kicker="Gemini Flash" title="Top 3 + reasons" sub="why you should meet" />
      </div>
    </div>
  );
}

function AlgoCol({
  kicker,
  title,
  sub,
  emphasis,
}: {
  kicker: string;
  title: string;
  sub: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-1.5 px-2">
      <div className="font-display italic text-[10px] font-bold tracking-widest uppercase text-foreground/40">
        {kicker}
      </div>
      <div
        className={`text-2xl md:text-3xl font-extrabold tracking-tight ${
          emphasis ? "text-primary italic" : "text-foreground"
        }`}
      >
        {title}
      </div>
      <div className="text-xs text-foreground/55 leading-snug">{sub}</div>
    </div>
  );
}

function AlgoArrow() {
  return (
    <div
      aria-hidden
      className="flex items-center justify-center text-primary/60 text-2xl font-light select-none rotate-90 md:rotate-0"
    >
      →
    </div>
  );
}

function ArrowGlyph() {
  return (
    <div aria-hidden className="text-white/50 text-2xl text-center font-extrabold select-none rotate-90 md:rotate-0">
      →
    </div>
  );
}

function RoomFeatureCard({
  tag,
  title,
  body,
  highlight,
}: {
  tag: string;
  title: string;
  body: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-6 rounded-2xl ring-1 transition-all ${
        highlight
          ? "bg-foreground text-white ring-foreground"
          : "bg-background ring-border hover:ring-foreground/40"
      }`}
    >
      <div
        className={`font-display italic text-[10px] font-bold tracking-widest uppercase mb-4 ${
          highlight ? "text-accent" : "text-foreground/40"
        }`}
      >
        {tag}
      </div>
      <h3 className="text-xl font-extrabold tracking-tight mb-2">{title}</h3>
      <p
        className={`text-sm leading-relaxed ${
          highlight ? "text-white/75" : "text-foreground/60"
        }`}
      >
        {body}
      </p>
    </div>
  );
}

function DiagramNode({
  kicker,
  title,
  sub,
  pills,
  accent,
  highlight,
}: {
  kicker: string;
  title: string;
  sub?: string;
  pills?: string[];
  accent?: boolean;
  highlight?: boolean;
}) {
  const base = highlight
    ? "ring-primary/60 bg-primary/20"
    : accent
      ? "ring-accent/40 bg-accent/10"
      : "ring-white/15 bg-white/5";
  const kickerColor = highlight ? "text-primary" : accent ? "text-accent" : "text-white/50";
  return (
    <div className={`rounded-2xl px-5 py-3 ring-1 ${base} text-center min-w-[180px]`}>
      <div className={`text-[10px] uppercase tracking-widest font-bold ${kickerColor}`}>
        {kicker}
      </div>
      <div className="text-white font-extrabold text-lg tracking-tight mt-0.5 not-italic font-sans">
        {title}
      </div>
      {sub && <div className="text-white/55 text-[11px] mt-0.5 not-italic font-sans">{sub}</div>}
      {pills && (
        <div className="flex flex-wrap gap-1.5 mt-2 justify-center not-italic font-sans">
          {pills.map((p) => (
            <span
              key={p}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/80"
            >
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Connector() {
  return <div aria-hidden className="h-6 w-px bg-gradient-to-b from-white/40 to-white/10" />;
}

function BranchConnector() {
  return (
    <svg aria-hidden viewBox="0 0 200 40" className="w-48 h-8 text-white/30">
      <path d="M100 0 V14 M30 40 V26 H170 V40" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="100" cy="14" r="2" fill="currentColor" />
    </svg>
  );
}

function MergeConnector() {
  return (
    <svg aria-hidden viewBox="0 0 200 40" className="w-48 h-8 text-white/30">
      <path d="M30 0 V14 H170 V0 M100 40 V26" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="100" cy="26" r="2" fill="currentColor" />
    </svg>
  );
}

function ScaleCard({
  tag,
  title,
  copy,
  graph,
  highlight,
}: {
  tag: string;
  title: string;
  copy: string;
  graph: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`group p-6 rounded-[32px] ring-1 transition-all ${
        highlight
          ? "bg-primary-soft ring-primary/20"
          : "bg-background ring-border hover:ring-primary/30"
      }`}
    >
      <div className="aspect-square mb-6 rounded-2xl relative overflow-hidden bg-gradient-to-br from-[#2d1a52] via-[#4c2a87] to-[#7c3aed] ring-1 ring-primary/20">
        {graph}
      </div>
      <div className="font-display italic text-xs font-bold text-primary tracking-widest uppercase mb-2">{tag}</div>
      <h3 className="text-2xl font-bold mb-3 tracking-tight">{title}</h3>
      <p className="text-sm text-foreground/60 leading-relaxed">{copy}</p>
    </div>
  );
}

function PillarCard({
  tag,
  title,
  metric,
  metricLabel,
  copy,
  source,
  highlight,
}: {
  tag: string;
  title: string;
  metric: string;
  metricLabel: string;
  copy: string;
  source: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`group p-8 rounded-[32px] ring-1 transition-all flex flex-col gap-6 ${
        highlight
          ? "bg-foreground text-background ring-foreground"
          : "bg-background ring-border hover:ring-primary/30"
      }`}
    >
      <div className={`font-display italic text-[10px] font-bold tracking-widest uppercase ${highlight ? "text-accent" : "text-primary"}`}>
        {tag}
      </div>
      <h3 className="text-3xl font-extrabold tracking-tight">{title}</h3>
      <div>
        <div className={`text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight ${highlight ? "text-accent" : "text-primary"}`}>
          {metric}
        </div>
        <div className={`text-xs mt-2 ${highlight ? "text-background/60" : "text-foreground/50"}`}>
          {metricLabel}
        </div>
      </div>
      <p className={`text-sm leading-relaxed ${highlight ? "text-background/80" : "text-foreground/70"}`}>
        {copy}
      </p>
      <div className={`mt-auto text-[10px] font-display italic ${highlight ? "text-background/40" : "text-foreground/40"}`}>
        {source}
      </div>
    </div>
  );
}

function MiniEventGraph({ height = 300 }: { height?: number }) {
  const W = 320;
  const H = 240;
  const nodes = [
    { id: "a", initials: "AO", name: "Adam",  color: "#fbbf24", x: 160, y: 120 }, // hub
    { id: "b", initials: "YW", name: "Yael",  color: "#a855f7", x:  60, y:  60 },
    { id: "c", initials: "CR", name: "Clara", color: "#6366f1", x: 260, y:  60 },
    { id: "d", initials: "FP", name: "Fenna", color: "#ec4899", x:  60, y: 190 },
    { id: "e", initials: "KV", name: "Karim", color: "#10b981", x: 260, y: 190 },
  ];
  const edges: [string, string][] = [
    ["a", "b"], ["a", "c"], ["a", "d"], ["a", "e"], ["b", "c"], ["d", "e"],
  ];
  const pos = new Map(nodes.map((n) => [n.id, n]));
  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%", display: "block" }}>
        <defs>
          <radialGradient id="mini-bg" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </radialGradient>
          {nodes.map((n) => (
            <clipPath key={`clip-${n.id}`} id={`mini-evt-clip-${n.id}`}>
              <circle cx={n.x} cy={n.y} r={17} />
            </clipPath>
          ))}
        </defs>
        <rect x="0" y="0" width={W} height={H} fill="url(#mini-bg)" />
        {edges.map(([s, t]) => {
          const a = pos.get(s)!;
          const b = pos.get(t)!;
          return (
            <line key={`${s}-${t}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} strokeLinecap="round" />
          );
        })}
        {nodes.map((n) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={24} fill={n.color} opacity={0.22} />
            <circle cx={n.x} cy={n.y} r={18} fill={n.color} />
            <image
              href={avatarUrl(defaultAvatarFor({ id: n.id, color: n.color }), 64)}
              x={n.x - 17} y={n.y - 17} width={34} height={34}
              clipPath={`url(#mini-evt-clip-${n.id})`}
              preserveAspectRatio="xMidYMid slice"
            />
            <circle cx={n.x} cy={n.y} r={18} fill="none" stroke="white" strokeOpacity={0.95} strokeWidth={1.5} />
            <text x={n.x} y={n.y + 34} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.78)">
              {n.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function MiniRoomGraph({ height = 300 }: { height?: number }) {
  const W = 320;
  const H = 240;
  const roomName = "Track A · AI for Business";
  // 10 nodes across 3 clusters — each cluster sits in its own region so
  // intra-cluster edges read as "you should meet these people".
  const nodes = [
    // cluster: Business (purple)
    { id: "y",  initials: "YOU", name: "You",    color: "#a855f7", x:  70, y:  90 },
    { id: "b1", initials: "YW",  name: "Yael",   color: "#a855f7", x:  50, y: 150 },
    { id: "b2", initials: "LS",  name: "Lotte",  color: "#a855f7", x: 110, y: 175 },
    { id: "b3", initials: "KA",  name: "Kai",    color: "#a855f7", x: 115, y: 110 },
    // cluster: Dev (indigo)
    { id: "d1", initials: "CR",  name: "Clara",  color: "#6366f1", x: 235, y:  85 },
    { id: "d2", initials: "VK",  name: "Viktor", color: "#6366f1", x: 275, y: 140 },
    { id: "d3", initials: "WW",  name: "Wessel", color: "#6366f1", x: 215, y: 150 },
    // cluster: Creative (pink)
    { id: "c1", initials: "FP",  name: "Fenna",  color: "#ec4899", x: 175, y: 200 },
    { id: "c2", initials: "DM",  name: "Daniel", color: "#ec4899", x: 235, y: 205 },
    // hub bridge
    { id: "h",  initials: "AO",  name: "Adam",   color: "#fbbf24", x: 165, y: 120 },
  ];
  // Strong edges WITHIN clusters; sparse bridges through hub between clusters.
  const strong: [string, string][] = [
    ["y", "b1"], ["y", "b3"], ["b1", "b2"], ["b2", "b3"], ["b3", "b1"], // business
    ["d1", "d2"], ["d2", "d3"], ["d1", "d3"],                            // dev
    ["c1", "c2"],                                                         // creative
  ];
  const weak: [string, string][] = [
    ["h", "b3"], ["h", "d3"], ["h", "c1"], ["d3", "c2"],
  ];
  const pos = new Map(nodes.map((n) => [n.id, n]));
  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%", display: "block" }}>
        <defs>
          <radialGradient id="mini-room-bg" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </radialGradient>
          {nodes.map((n) => (
            <clipPath key={`clip-${n.id}`} id={`mini-room-clip-${n.id}`}>
              <circle cx={n.x} cy={n.y} r={14} />
            </clipPath>
          ))}
        </defs>
        <rect x="0" y="0" width={W} height={H} fill="url(#mini-room-bg)" />

        {/* faint cross-cluster bridges via hub (solid, no dashes) */}
        {weak.map(([s, t]) => {
          const a = pos.get(s)!;
          const b = pos.get(t)!;
          return (
            <line key={`w-${s}-${t}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="rgba(255,255,255,0.18)" strokeWidth={1} strokeLinecap="round" />
          );
        })}
        {/* strong / same-cluster edges */}
        {strong.map(([s, t]) => {
          const a = pos.get(s)!;
          const b = pos.get(t)!;
          return (
            <line key={`s-${s}-${t}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={a.color} strokeOpacity={0.7} strokeWidth={1.6} strokeLinecap="round" />
          );
        })}

        {nodes.map((n) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={20} fill={n.color} opacity={0.22} />
            <circle cx={n.x} cy={n.y} r={15} fill={n.color} />
            <image
              href={avatarUrl(defaultAvatarFor({ id: n.id, color: n.color }), 56)}
              x={n.x - 14} y={n.y - 14} width={28} height={28}
              clipPath={`url(#mini-room-clip-${n.id})`}
              preserveAspectRatio="xMidYMid slice"
            />
            <circle cx={n.x} cy={n.y} r={15} fill="none" stroke="white" strokeOpacity={0.95} strokeWidth={1.5} />
          </g>
        ))}
      </svg>

      {/* Room label badge */}
      <div className="absolute top-2 left-2 px-2.5 py-1 bg-background/90 backdrop-blur rounded-full text-[9px] font-display italic font-bold uppercase tracking-widest flex items-center gap-1.5 ring-1 ring-border">
        <span className="size-1.5 bg-primary rounded-full animate-pulse" />
        {roomName}
      </div>
      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/30 rounded-full text-[9px] font-display italic text-white/80 ring-1 ring-white/10">
        {nodes.length} in room
      </div>
    </div>
  );
}
