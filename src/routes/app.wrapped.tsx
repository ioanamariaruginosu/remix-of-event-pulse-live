import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { NetworkGraph } from "@/components/NetworkGraph";
import { Avatar } from "@/components/Avatar";
import { pastEvents, people } from "@/data/event";
import { ShareLinkedInButton, ShareLinkedInIcon } from "@/components/ShareLinkedIn";

export const Route = createFileRoute("/app/wrapped")({
  head: () => ({ meta: [{ title: "Event wrapped — synqmap" }] }),
  component: Wrapped,
});

function Wrapped() {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const id = params.get("e") ?? pastEvents[0].id;
  const ev = pastEvents.find((p) => p.id === id) ?? pastEvents[0];
  const topPeople = ev.topPeople.map((pid) => people.find((p) => p.id === pid)!).filter(Boolean);

  const slides = useMemo(() => buildSlides(ev, topPeople), [ev, topPeople]);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = slides.length;
  const DURATION = 5000;

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setStep((s) => (s + 1 < total ? s + 1 : s)), DURATION);
    return () => clearTimeout(t);
  }, [step, paused, total]);

  function next() { setStep((s) => Math.min(s + 1, total - 1)); }
  function prev() { setStep((s) => Math.max(s - 1, 0)); }

  const current = slides[step];

  return (
    <div className="relative -mt-[1px] min-h-[calc(100dvh-72px)] bg-foreground text-white overflow-hidden">
      {/* Progress bars */}
      <div className="absolute top-3 inset-x-3 flex gap-1 z-30">
        {slides.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/15 rounded-full overflow-hidden">
            <motion.div
              key={`${i}-${step}-${paused ? "p" : "r"}`}
              className="h-full bg-white"
              initial={{ width: i < step ? "100%" : "0%" }}
              animate={{ width: i < step ? "100%" : i === step ? (paused ? "50%" : "100%") : "0%" }}
              transition={i === step && !paused ? { duration: DURATION / 1000, ease: "linear" } : { duration: 0.2 }}
            />
          </div>
        ))}
      </div>

      {/* Top bar */}
      <div className="absolute top-7 inset-x-4 z-30 flex items-center justify-between text-[10px] font-display italic tracking-tight normal-case text-white/70">
        <span>{ev.name} · {ev.date}</span>
        <Link to="/app" className="text-white/70">Close ✕</Link>
      </div>

      {/* Tap zones */}
      <button
        type="button"
        onClick={prev}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
        className="absolute inset-y-0 left-0 w-1/3 z-20"
        aria-label="Previous"
      />
      <button
        type="button"
        onClick={next}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
        className="absolute inset-y-0 right-0 w-1/3 z-20"
        aria-label="Next"
      />

      {/* Slide */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 pt-16 pb-6 px-6 flex flex-col"
          style={{ background: current.bg }}
        >
          {current.node}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function buildSlides(ev: typeof pastEvents[number], topPeople: ReturnType<typeof people.filter>) {
  return [
    {
      bg: ev.cover,
      node: (
        <div className="flex-1 flex flex-col justify-end">
          <div className="text-[10px] font-display italic tracking-tight normal-case text-white/70 mb-3">Your wrapped</div>
          <h1 className="font-extrabold text-5xl leading-[0.95] tracking-tight">
            {ev.name}
          </h1>
          <div className="text-white/80 mt-3 text-lg">{ev.date} · {ev.city}</div>
          <div className="mt-8 text-white/70 text-sm">Tap to start →</div>
        </div>
      ),
    },
    {
      bg: "linear-gradient(160deg,#0a0a1a,#1a0a2e)",
      node: (
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <div className="text-[10px] font-display italic tracking-tight normal-case text-white/50 mb-2">You spent</div>
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-extrabold text-[140px] leading-none tracking-tighter bg-gradient-to-br from-white to-primary bg-clip-text text-transparent"
          >
            {ev.hours}
          </motion.div>
          <div className="text-2xl font-bold mt-2">hours at {ev.city}</div>
          <div className="text-white/50 text-sm mt-4">More than 84% of attendees stayed less</div>
        </div>
      ),
    },
    {
      bg: "linear-gradient(140deg,#1a0a2e,#7c3aed)",
      node: (
        <div className="flex-1 flex flex-col">
          <div className="text-[10px] font-display italic tracking-tight normal-case text-white/60">Your top topics</div>
          <div className="flex-1 flex flex-col justify-center">
            {ev.topTopics.map((t, i) => {
              const max = ev.topTopics[0].count;
              return (
                <motion.div
                  key={t.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                  className="my-1.5"
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="font-extrabold text-2xl tracking-tight">#{t.label}</span>
                    <span className="font-display italic text-xs text-white/60">{t.count}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${(t.count / max) * 100}%` }}
                      transition={{ delay: i * 0.12 + 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      bg: "linear-gradient(160deg,#0a0a1a,#0a1a2e)",
      node: (
        <div className="flex-1 flex flex-col">
          <div className="text-[10px] font-display italic tracking-tight normal-case text-white/60 mb-3">Your network grew by</div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="font-extrabold text-[88px] leading-none tracking-tighter text-accent"
          >
            +{ev.newConnections}
          </motion.div>
          <div className="text-lg text-white/80 mt-1">new connections</div>
          <div className="flex-1 relative mt-4 rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black/30">
            <NetworkGraph scale="personal" centerId="you" height={300} interactive variant="dark" />
          </div>
          <div className="text-[10px] font-display italic tracking-tight normal-case text-white/40 text-center mt-2">
            Tap any node to revisit
          </div>
        </div>
      ),
    },
    {
      bg: "linear-gradient(135deg,#7c3aed,#f472b6)",
      node: (
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-[10px] font-display italic tracking-tight normal-case text-white/70 mb-3">Your inner circle</div>
          <div className="space-y-2">
            {topPeople.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex items-center gap-3 bg-black/20 backdrop-blur rounded-2xl p-3 ring-1 ring-white/10"
              >
                <Avatar person={p} size={44} className="ring-2 ring-white/30 shadow-md" />

                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-base">{p.name}</div>
                  <div className="text-[11px] text-white/70 truncate">{p.oneLiner}</div>
                </div>
                <div className="font-display italic text-[9px] uppercase tracking-widest text-white/60">#{i + 1}</div>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
    {
      bg: "linear-gradient(150deg,#0a0a1a,#1f0a2e)",
      node: (
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <div className="text-[10px] font-display italic tracking-tight normal-case text-white/50 mb-3">Longest conversation</div>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="font-extrabold text-[120px] leading-none tracking-tighter text-accent"
          >
            {ev.longestChat.minutes}
          </motion.div>
          <div className="text-xl font-bold mt-1">minutes with</div>
          <div className="text-3xl font-extrabold mt-2 tracking-tight">{ev.longestChat.person}</div>
          <div className="text-white/50 text-sm mt-4">Out of {ev.conversations} total conversations</div>
        </div>
      ),
    },
    {
      bg: "linear-gradient(135deg,#1a0a2e,#7c3aed)",
      node: (
        <div className="flex-1 flex flex-col">
          <div className="text-[10px] font-display italic tracking-tight normal-case text-white/60 mb-3">Highlights</div>
          <div className="flex-1 flex flex-col justify-center space-y-3">
            {ev.highlights.map((h, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
                className="text-2xl font-bold leading-tight"
              >
                <span className="text-accent font-display italic text-sm mr-2">0{i + 1}</span>
                {h}
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
    {
      bg: "linear-gradient(160deg,#0a0a1a,#2a0a3e)",
      node: <PhotoCollageSlide photos={ev.photos} />,
    },
    {
      bg: "linear-gradient(135deg,#000,#7c3aed)",
      node: (
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <div className="text-[10px] font-display italic tracking-tight normal-case text-white/60 mb-3">In total</div>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="font-extrabold text-7xl leading-none tracking-tighter"
          >
            {ev.cards} cards
          </motion.div>
          <div className="text-white/70 mt-3 text-lg">exchanged in {ev.hours}h</div>

          <div className="grid grid-cols-2 gap-3 w-full mt-8">
            <Stat label="Conversations" value={ev.conversations} />
            <Stat label="Rooms entered" value={ev.rooms.length} />
            <Stat label="New links" value={ev.newConnections} />
            <Stat label="Cards" value={ev.cards} />
          </div>

          <Link
            to="/app"
            className="mt-8 px-6 py-3 rounded-full bg-white text-foreground font-bold text-sm"
          >
            Back to current event
          </Link>
        </div>
      ),
    },
  ];
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/5 backdrop-blur ring-1 ring-white/10 rounded-2xl p-3 text-left">
      <div className="text-[9px] font-display italic tracking-tight normal-case text-white/40">{label}</div>
      <div className="font-extrabold text-2xl tracking-tight">{value}</div>
    </div>
  );
}

function PhotoCollageSlide({ photos }: { photos: { url: string; caption: string; by: string }[] }) {
  // Pre-computed deterministic tilts so it feels handheld but stable
  const tilts = [-6, 4, -3, 7, -5, 3];
  return (
    <div className="flex-1 flex flex-col">
      <div className="text-[10px] font-display italic tracking-tight normal-case text-white/60">From the crowd</div>
      <h2 className="font-extrabold text-3xl tracking-tight mt-1 mb-4">
        {photos.length} photos<br />
        <span className="text-white/50 font-display italic text-lg">uploaded by attendees</span>
      </h2>

      <div className="flex-1 relative">
        {photos.slice(0, 6).map((p, i) => {
          const cols = 2;
          const col = i % cols;
          const row = Math.floor(i / cols);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20, rotate: 0, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, rotate: tilts[i % tilts.length], scale: 1 }}
              transition={{ delay: i * 0.12, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bg-white p-2 pb-7 rounded-sm shadow-2xl"
              style={{
                left: `${col * 48 + (i % 2 === 0 ? 0 : 4)}%`,
                top: `${row * 32}%`,
                width: "46%",
                zIndex: i,
              }}
            >
              <div
                className="w-full aspect-square bg-foreground/40 bg-cover bg-center rounded-sm"
                style={{ backgroundImage: `url(${p.url})` }}
              />
              <div className="px-1 pt-1.5">
                <div className="text-foreground text-[9px] font-bold leading-tight truncate">{p.caption}</div>
                <div className="text-foreground/50 text-[8px] font-display italic mt-0.5">by {p.by}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="text-[10px] font-display italic tracking-tight normal-case text-white/40 text-center mt-2">
        Tap to flip through →
      </div>
    </div>
  );
}
