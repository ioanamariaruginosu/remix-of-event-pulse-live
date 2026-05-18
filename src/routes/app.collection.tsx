import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { people, edges, type Person } from "@/data/event";
import { Avatar } from "@/components/Avatar";

export const Route = createFileRoute("/app/collection")({
  head: () => ({ meta: [{ title: "Your deck — synqmap" }] }),
  component: Collection,
});

type Card = { person: Person; reason: string };

function Collection() {
  const cards = useMemo<Card[]>(() => {
    return edges
      .filter((e) => e.source === "you" || e.target === "you")
      .map((e) => {
        const otherId = e.source === "you" ? e.target : e.source;
        return { person: people.find((p) => p.id === otherId)!, reason: e.reason };
      });
  }, []);

  const [index, setIndex] = useState(0);
  const [detail, setDetail] = useState<Card | null>(null);

  const advance = () => setIndex((i) => (i + 1) % cards.length);
  const back = () => setIndex((i) => (i - 1 + cards.length) % cards.length);

  // Top card drag
  const x = useMotionValue(0);
  const rot = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const opacity = useTransform(x, [-220, -120, 0, 120, 220], [0, 1, 1, 1, 0]);

  const stack = useMemo(() => {
    const out: { card: Card; depth: number }[] = [];
    for (let d = 0; d < Math.min(3, cards.length); d++) {
      out.push({ card: cards[(index + d) % cards.length], depth: d });
    }
    return out.reverse();
  }, [cards, index]);

  return (
    <div className="px-5 pt-6 space-y-5 pb-10">
      <div>
        <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest">Day 1</div>
        <h1 className="font-extrabold text-2xl tracking-tight">Your Deck</h1>
        <div className="text-xs text-foreground/60 mt-1">
          {cards.length} cards collected · 250 XP · swipe or tap a card
        </div>
      </div>

      {/* Stacked, swipeable deck */}
      <div className="relative w-full mx-auto" style={{ maxWidth: 360, height: 480 }}>
        {stack.map(({ card, depth }) => {
          const isTop = depth === 0;
          const num = ((index + depth) % cards.length) + 1;
          return isTop ? (
            <motion.div
              key={card.person.id}
              className="absolute inset-0 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing"
              style={{ x, rotate: rot, opacity, zIndex: 10 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                if (info.offset.x < -100 || info.velocity.x < -400) {
                  x.set(0);
                  advance();
                } else if (info.offset.x > 100 || info.velocity.x > 400) {
                  x.set(0);
                  back();
                } else {
                  x.set(0);
                }
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setDetail(card)}
            >
              <DeckCard card={card} num={num} total={cards.length} />
            </motion.div>
          ) : (
            <motion.div
              key={card.person.id}
              className="absolute inset-0 rounded-3xl overflow-hidden"
              initial={false}
              animate={{
                scale: 1 - depth * 0.05,
                y: depth * 12,
                x: depth % 2 === 0 ? depth * 6 : depth * -6,
                rotate: depth % 2 === 0 ? depth * 3.5 : depth * -3.5,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              style={{ zIndex: 10 - depth }}
            >
              <DeckCard card={card} num={num} total={cards.length} dim />
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={back}
          className="size-9 rounded-full ring-1 ring-border grid place-items-center hover:bg-foreground/5"
          aria-label="Previous"
        >
          ‹
        </button>
        <div className="text-[10px] font-display italic text-foreground/40 tabular-nums">
          {index + 1} / {cards.length}
        </div>
        <button
          onClick={advance}
          className="size-9 rounded-full ring-1 ring-border grid place-items-center hover:bg-foreground/5"
          aria-label="Next"
        >
          ›
        </button>
      </div>

      <div className="text-center text-[10px] text-foreground/40 font-display italic">
        Tap the top card for full details
      </div>

      <AnimatePresence>
        {detail && <DetailSheet card={detail} onClose={() => setDetail(null)} />}
      </AnimatePresence>
    </div>
  );
}

function DeckCard({
  card,
  num,
  total,
  dim = false,
}: {
  card: Card;
  num: number;
  total: number;
  dim?: boolean;
}) {
  const { person, reason } = card;
  return (
    <div
      className="relative w-full h-full bg-foreground text-white p-5 flex flex-col shadow-2xl ring-1 ring-white/10"
      style={{
        backgroundImage: `radial-gradient(circle at 100% 0%, ${person.color}55 0%, transparent 55%), radial-gradient(circle at 0% 100%, var(--primary) 0%, transparent 60%)`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="text-[9px] font-display italic uppercase tracking-widest text-white/50">
          Eurhack · Day 1
        </div>
        <div className="text-[9px] font-display italic uppercase tracking-widest text-white/40 tabular-nums">
          #{String(num).padStart(3, "0")} / {String(total).padStart(3, "0")}
        </div>
      </div>

      {/* Big avatar */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-60"
            style={{ background: person.color }}
          />
          <Avatar
            person={person}
            size={160}
            className="relative ring-4 ring-white/20 shadow-2xl"
          />
        </div>
      </div>

      {/* Name + one-liner */}
      <div className="space-y-2">
        <div className="font-extrabold text-2xl tracking-tight leading-tight">{person.name}</div>
        <div className="text-xs text-white/70 leading-snug">{person.oneLiner}</div>

        <div
          className="text-[10px] font-display italic px-3 py-2 rounded-lg"
          style={{ background: `${person.color}22`, color: "white" }}
        >
          <span className="text-white/50 uppercase tracking-widest text-[9px] font-bold mr-1.5">Why</span>
          {reason}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {person.tags.map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 bg-white/10 text-[9px] font-bold uppercase tracking-wider rounded-full"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {dim && <div className="absolute inset-0 bg-foreground/30 pointer-events-none" />}
    </div>
  );
}

function DetailSheet({ card, onClose }: { card: Card; onClose: () => void }) {
  const { person, reason } = card;
  const socials = Object.entries(person.socials).filter(([, v]) => !!v) as [
    keyof typeof person.socials,
    string,
  ][];

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md bg-background rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-foreground/20" />
        </div>

        {/* Hero */}
        <div
          className="px-6 pt-4 pb-6 text-white relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${person.color}, var(--foreground))`,
          }}
        >
          <div className="flex items-center gap-4">
            <Avatar person={person} size={80} className="ring-4 ring-white/30 shadow-xl" />
            <div className="min-w-0">
              <div className="font-extrabold text-2xl tracking-tight leading-tight">{person.name}</div>
              <div className="text-xs text-white/80 mt-1">{person.oneLiner}</div>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 py-5 space-y-5">
          <section>
            <div className="text-[9px] font-display italic font-bold uppercase tracking-widest text-foreground/40 mb-1.5">
              Why you matched
            </div>
            <div className="text-sm leading-relaxed">{reason}</div>
          </section>

          <section>
            <div className="text-[9px] font-display italic font-bold uppercase tracking-widest text-foreground/40 mb-1.5">
              Looking for
            </div>
            <div className="text-sm leading-relaxed">{person.intent}</div>
          </section>

          <section>
            <div className="text-[9px] font-display italic font-bold uppercase tracking-widest text-foreground/40 mb-2">
              Topics
            </div>
            <div className="flex flex-wrap gap-1.5">
              {person.tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-full bg-foreground/5 text-[10px] font-bold uppercase tracking-wider"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>

          {socials.length > 0 && (
            <section>
              <div className="text-[9px] font-display italic font-bold uppercase tracking-widest text-foreground/40 mb-2">
                Connect
              </div>
              <div className="space-y-2">
                {socials.map(([k, v]) => (
                  <a
                    key={k}
                    href={socialHref(k, v)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl ring-1 ring-border hover:bg-foreground/5 transition-colors"
                  >
                    <div
                      className="size-9 rounded-lg grid place-items-center text-white shrink-0"
                      style={{ background: person.color }}
                    >
                      <span className="text-xs font-bold">{socialIcon(k)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-display italic uppercase tracking-widest text-foreground/50">
                        {socialLabel(k)}
                      </div>
                      <div className="text-sm font-bold truncate">{v}</div>
                    </div>
                    <div className="text-foreground/30 text-xs">↗</div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full ring-1 ring-border text-xs font-bold uppercase tracking-widest"
          >
            Close
          </button>
          <button className="flex-[2] py-3 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-widest">
            Send a message
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function socialIcon(k: string) {
  switch (k) {
    case "linkedin": return "in";
    case "x": return "𝕏";
    case "github": return "gh";
    case "email": return "@";
    default: return "•";
  }
}
function socialLabel(k: string) {
  switch (k) {
    case "linkedin": return "LinkedIn";
    case "x": return "X / Twitter";
    case "github": return "GitHub";
    case "email": return "Email";
    default: return k;
  }
}
function socialHref(k: string, v: string) {
  switch (k) {
    case "linkedin": return `https://linkedin.com${v.startsWith("/") ? "" : "/"}${v}`;
    case "x": return `https://x.com/${v.replace(/^@/, "")}`;
    case "github": return `https://github.com/${v}`;
    case "email": return `mailto:${v}`;
    default: return "#";
  }
}
