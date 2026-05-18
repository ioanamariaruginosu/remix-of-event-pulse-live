import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { NetworkGraph } from "@/components/NetworkGraph";
import { LiveTicker } from "@/components/LiveTicker";
import { IdentityCard } from "@/components/IdentityCard";
import { Logo } from "@/components/Logo";
import { people, event, rooms } from "@/data/event";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "synqmap — Physical space, live graphed." },
      {
        name: "description",
        content:
          "Turn every handshake into a data point. Rooms are physical, sessions are temporal. The live network for in-person events.",
      },
      { property: "og:title", content: "synqmap — Physical space, live graphed." },
      {
        property: "og:description",
        content: "The live network for in-person events. Tap to exchange identity cards.",
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
            to="/join"
            className="bg-foreground text-background px-5 py-2 rounded-full text-sm font-bold hover:bg-primary transition-colors"
          >
            Get the App
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
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-soft text-primary rounded-full text-[10px] font-mono font-bold uppercase tracking-widest mb-8 ring-1 ring-primary/20"
          >
            <span className="size-1.5 bg-primary rounded-full animate-pulse" />
            {event.name} · {event.dates}
          </motion.div>

          <h1 className="text-5xl sm:text-7xl md:text-[110px] font-extrabold tracking-tight leading-[0.9] text-balance mb-8">
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              PHYSICAL SPACE
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="block text-primary italic"
            >
              LIVE GRAPHED.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-2xl mx-auto text-lg md:text-xl text-foreground/60 mb-12 text-pretty"
          >
            Turn every handshake into a data point. synqmap converts rooms into physical nodes and sessions into temporal edges — projected onto the venue wall in real time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link
              to="/organizer"
              className="group relative px-8 py-5 bg-primary text-white rounded-2xl font-bold text-lg overflow-hidden transition-transform hover:-translate-y-1 active:scale-95"
            >
              <span className="relative z-10">I'm organizing an event</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Link>
            <Link
              to="/join"
              className="px-8 py-5 bg-white border-2 border-foreground/10 text-foreground rounded-2xl font-bold text-lg hover:border-primary transition-all"
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
            <div className="inline-block px-4 py-1.5 bg-primary-soft text-primary font-mono text-[10px] font-bold tracking-widest uppercase rounded-full ring-1 ring-primary/20">
              The Mental Model
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-balance">
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
                    <span className={`text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded ${r.kind === "session" ? "bg-primary-soft text-primary" : "bg-accent/40 text-foreground"}`}>
                      {r.kind}
                    </span>
                  </div>
                  <div className="h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(r.current / r.capacity) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px] font-mono text-foreground/40">
                    <span>{r.current} here</span>
                    <span>cap {r.capacity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="aspect-square bg-foreground rounded-[32px] overflow-hidden ring-1 ring-border relative">
            <NetworkGraph scale="event" height={560} />
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-background/90 backdrop-blur rounded-full text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="size-1.5 bg-primary rounded-full animate-pulse" />
              Live Network · {people.length} nodes
            </div>
          </div>
        </section>

        {/* Identity card + phone */}
        <section id="card" className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div className="space-y-8 order-2 lg:order-1">
            <div className="inline-block px-4 py-1.5 bg-primary-soft text-primary font-mono text-[10px] font-bold tracking-widest uppercase rounded-full ring-1 ring-primary/20">
              The Artifact
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-balance">
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
            <div className="inline-block px-4 py-1.5 bg-primary-soft text-primary font-mono text-[10px] font-bold tracking-widest uppercase rounded-full ring-1 ring-primary/20">
              Three Scales
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-balance">
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
              graph={<NetworkGraph scale="event" height={300} />}
            />
            <ScaleCard
              tag="Scale 02 // Local"
              title="Room Context"
              copy="When you walk into a room your phone shows just that slice — who's here, what's being asked, who you should meet."
              graph={<NetworkGraph scale="room" roomId="track-a" height={300} showLabels />}
              highlight
            />
            <ScaleCard
              tag="Scale 03 // Ego"
              title="Personal Trail"
              copy="Your node, centered. Every card you collected and the bridge people who connect your clusters."
              graph={<NetworkGraph scale="personal" centerId="you" height={300} showLabels />}
            />
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-primary rounded-[40px] p-12 md:p-16 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/30 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 blur-[120px] rounded-full" />
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-balance">Ready to connect at speed?</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/organizer" className="px-8 py-4 bg-white text-primary rounded-2xl font-bold hover:bg-accent transition-colors">
                Organize Your Hub
              </Link>
              <Link to="/venue" className="px-8 py-4 bg-foreground text-white rounded-2xl font-bold ring-1 ring-white/20 hover:bg-foreground/80 transition-colors">
                View the Spectacle
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
          <div className="flex gap-6 font-mono text-[10px] font-bold uppercase tracking-widest">
            <a className="hover:text-white transition-colors" href="#">Network Status</a>
            <a className="hover:text-white transition-colors" href="#">Privacy Mesh</a>
            <a className="hover:text-white transition-colors" href="#">Press Kit</a>
          </div>
          <div className="text-[10px] font-mono">
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
      <div className={`font-mono text-2xl font-bold mb-1 ${accent ? "text-primary" : ""}`}>{value}</div>
      <div className="text-[10px] text-foreground/40 uppercase font-bold tracking-wider">{label}</div>
    </div>
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
      <div className="aspect-square mb-6 bg-foreground rounded-2xl relative overflow-hidden">
        {graph}
      </div>
      <div className="font-mono text-xs font-bold text-primary tracking-widest uppercase mb-2">{tag}</div>
      <h3 className="text-2xl font-bold mb-3 tracking-tight">{title}</h3>
      <p className="text-sm text-foreground/60 leading-relaxed">{copy}</p>
    </div>
  );
}
