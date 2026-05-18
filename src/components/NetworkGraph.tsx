import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { people as allPeople, edges as allEdges, type Person } from "@/data/event";

type Props = {
  scale?: "event" | "room" | "personal";
  roomId?: string;
  centerId?: string;
  height?: number;
  className?: string;
  showLabels?: boolean;
  variant?: "light" | "dark";
  interactive?: boolean;
  onSelect?: (id: string | null) => void;
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function rand(seed: string) {
  return (hash(seed) % 10000) / 10000;
}

export function NetworkGraph({
  scale = "event",
  roomId,
  centerId,
  height = 480,
  className = "",
  showLabels = false,
  variant = "dark",
  interactive = false,
  onSelect,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const { nodes, links } = useMemo(() => {
    let people: Person[] = allPeople;
    if (scale === "room" && roomId) {
      people = allPeople.filter((p) => p.roomId === roomId);
    } else if (scale === "personal" && centerId) {
      const directIds = new Set<string>([centerId]);
      allEdges.forEach((e) => {
        if (e.source === centerId) directIds.add(e.target);
        if (e.target === centerId) directIds.add(e.source);
      });
      people = allPeople.filter((p) => directIds.has(p.id));
    }
    const ids = new Set(people.map((p) => p.id));
    const links = allEdges.filter((e) => ids.has(e.source) && ids.has(e.target));
    return { nodes: people, links };
  }, [scale, roomId, centerId]);

  const W = 800;
  const H = height;

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const cx = W / 2;
    const cy = H / 2;

    if (scale === "personal" && centerId) {
      map.set(centerId, { x: cx, y: cy });
      const others = nodes.filter((n) => n.id !== centerId);
      others.forEach((n, i) => {
        const ring = i % 3 === 0 ? 0 : 1;
        const ringR = ring === 0 ? Math.min(W, H) * 0.22 : Math.min(W, H) * 0.38;
        const ringCount = others.filter((_, j) => j % 3 === 0).length || 1;
        const angleStep = (Math.PI * 2) / (ring === 0 ? ringCount : Math.max(others.length - ringCount, 1));
        const indexInRing = ring === 0
          ? Math.floor(i / 3)
          : i - Math.floor((i + 1) / 3);
        const jitter = (rand(n.id + "j") - 0.5) * 0.4;
        const angle = indexInRing * angleStep + jitter + (ring * 0.3);
        map.set(n.id, { x: cx + Math.cos(angle) * ringR, y: cy + Math.sin(angle) * ringR });
      });
    } else if (scale === "room") {
      const r = Math.min(W, H) * 0.32;
      nodes.forEach((n, i) => {
        const angle = (i / nodes.length) * Math.PI * 2;
        const rr = r * (0.4 + rand(n.id) * 0.6);
        map.set(n.id, { x: cx + Math.cos(angle) * rr, y: cy + Math.sin(angle) * rr });
      });
    } else {
      const cols = Math.ceil(Math.sqrt(nodes.length * (W / H)));
      const rows = Math.ceil(nodes.length / cols);
      nodes.forEach((n, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const baseX = (col + 0.5) * (W / cols);
        const baseY = (row + 0.5) * (H / rows);
        const jx = (rand(n.id + "x") - 0.5) * (W / cols) * 0.7;
        const jy = (rand(n.id + "y") - 0.5) * (H / rows) * 0.7;
        map.set(n.id, { x: baseX + jx, y: baseY + jy });
      });
    }
    return map;
  }, [nodes, scale, centerId, H]);

  const isDark = variant === "dark";
  const linkStroke = isDark ? "rgba(255,255,255,0.18)" : "rgba(20,20,30,0.12)";
  const linkStrong = isDark ? "rgba(255,255,255,0.45)" : "rgba(80,40,180,0.5)";
  const labelFill = isDark ? "rgba(255,255,255,0.7)" : "rgba(20,20,30,0.7)";

  const focus = selected || hovered;
  const neighbors = useMemo(() => {
    if (!focus) return null;
    const n = new Set<string>([focus]);
    links.forEach((l) => {
      if (l.source === focus) n.add(l.target);
      if (l.target === focus) n.add(l.source);
    });
    return n;
  }, [focus, links]);

  const focusedPerson = focus ? nodes.find((n) => n.id === focus) : null;
  const focusedEdges = focus
    ? links.filter((l) => l.source === focus || l.target === focus)
    : [];

  function handleClick(id: string) {
    if (!interactive) return;
    const next = selected === id ? null : id;
    setSelected(next);
    onSelect?.(next);
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ width: "100%", height: "100%", display: "block" }}
        onClick={() => {
          if (!interactive) return;
          setSelected(null);
          onSelect?.(null);
        }}
      >
        <defs>
          <radialGradient id="ng-bg" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="oklch(0.53 0.27 295)" stopOpacity={isDark ? 0.25 : 0.08} />
            <stop offset="100%" stopColor="oklch(0.53 0.27 295)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ng-nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.65 0.27 295)" stopOpacity="0.5" />
            <stop offset="60%" stopColor="oklch(0.65 0.27 295)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="oklch(0.65 0.27 295)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width={W} height={H} fill="url(#ng-bg)" />

        {isDark && Array.from({ length: 40 }).map((_, i) => {
          const x = (hash("bg" + i) % 1000) / 1000 * W;
          const y = (hash("bg" + i + "y") % 1000) / 1000 * H;
          return <circle key={"bg" + i} cx={x} cy={y} r={0.6} fill="rgba(255,255,255,0.25)" />;
        })}

        {/* Links */}
        {links.map((l, i) => {
          const a = positions.get(l.source);
          const b = positions.get(l.target);
          if (!a || !b) return null;
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = -dy / len;
          const ny = dx / len;
          const curve = (rand(l.source + l.target) - 0.5) * 60;
          const ctrlX = mx + nx * curve;
          const ctrlY = my + ny * curve;
          const path = `M ${a.x} ${a.y} Q ${ctrlX} ${ctrlY} ${b.x} ${b.y}`;
          const involvesCenter = centerId && (l.source === centerId || l.target === centerId);
          const involvesFocus = focus && (l.source === focus || l.target === focus);
          const dimmed = focus && !involvesFocus;
          const dur = 4 + (i % 6);
          const stroke = involvesFocus
            ? "oklch(0.93 0.16 124)"
            : involvesCenter
            ? linkStrong
            : linkStroke;

          return (
            <g key={i} style={{ opacity: dimmed ? 0.08 : 1, transition: "opacity .3s" }}>
              <motion.path
                d={path}
                stroke={stroke}
                strokeWidth={involvesFocus ? 1.8 : involvesCenter ? 1.4 : 0.8}
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
              />
              <circle
                r={involvesFocus ? 2.4 : 1.6}
                fill={involvesFocus ? "oklch(0.93 0.16 124)" : involvesCenter ? "oklch(0.93 0.16 124)" : "oklch(0.75 0.2 295)"}
                opacity={0.9}
              >
                <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={path} begin={`${(i % 4) * 0.5}s`} />
              </circle>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((n, i) => {
          const p = positions.get(n.id);
          if (!p) return null;
          const isCenter = n.id === centerId;
          const isFocus = focus === n.id;
          const dimmed = focus && !neighbors?.has(n.id);
          const baseR = isCenter || isFocus ? 18 : 7 + (hash(n.id) % 5);
          const driftDur = 8 + (hash(n.id) % 6);

          return (
            <motion.g
              key={n.id}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: dimmed ? 0.25 : 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.02, ease: [0.16, 1, 0.3, 1] }}
              style={{ cursor: interactive ? "pointer" : "default" }}
              onClick={(e) => {
                e.stopPropagation();
                handleClick(n.id);
              }}
              onMouseEnter={() => interactive && setHovered(n.id)}
              onMouseLeave={() => interactive && setHovered(null)}
            >
              <motion.g
                animate={{ x: [0, 5, -4, 2, 0], y: [0, -4, 3, -2, 0] }}
                transition={{ duration: driftDur, repeat: Infinity, ease: "easeInOut" }}
              >
                <circle cx={p.x} cy={p.y} r={baseR * 3.5} fill="url(#ng-nodeGlow)" />

                {(isCenter || isFocus) && (
                  <>
                    <motion.circle
                      cx={p.x}
                      cy={p.y}
                      r={baseR}
                      fill="none"
                      stroke={isFocus ? "oklch(0.93 0.16 124)" : "oklch(0.65 0.27 295)"}
                      strokeWidth={1.5}
                      initial={{ opacity: 0.6, scale: 1 }}
                      animate={{ opacity: 0, scale: 3 }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                      style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                    />
                  </>
                )}

                {/* Larger hit target for interactivity */}
                {interactive && (
                  <circle cx={p.x} cy={p.y} r={Math.max(baseR + 8, 16)} fill="transparent" />
                )}

                <circle
                  cx={p.x}
                  cy={p.y}
                  r={baseR}
                  fill={isCenter ? "oklch(0.53 0.27 295)" : n.color}
                  stroke={isFocus ? "oklch(0.93 0.16 124)" : isDark ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,1)"}
                  strokeWidth={isFocus ? 3 : isCenter ? 2.5 : 1.5}
                  style={{ filter: `drop-shadow(0 0 ${baseR * 0.6}px ${n.color}aa)` }}
                />

                {(isCenter || isFocus || baseR >= 10) && (
                  <text
                    x={p.x}
                    y={p.y + baseR / 3}
                    textAnchor="middle"
                    fontSize={isCenter || isFocus ? 11 : baseR * 0.9}
                    fontWeight={800}
                    fill="white"
                    letterSpacing="0.5"
                    style={{ pointerEvents: "none" }}
                  >
                    {n.initials}
                  </text>
                )}

                {(showLabels || isCenter || isFocus) && (
                  <text
                    x={p.x}
                    y={p.y + baseR + 16}
                    textAnchor="middle"
                    fontSize={isCenter || isFocus ? 12 : 10}
                    fontWeight={isCenter || isFocus ? 700 : 500}
                    fill={labelFill}
                    fontFamily="var(--font-mono)"
                    style={{ pointerEvents: "none" }}
                  >
                    {n.name}
                  </text>
                )}
              </motion.g>
            </motion.g>
          );
        })}
      </svg>

      {/* Interactive info card */}
      <AnimatePresence>
        {interactive && focusedPerson && (
          <motion.div
            key={focusedPerson.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-3 left-3 right-3 bg-background/95 backdrop-blur-md rounded-2xl p-3 ring-1 ring-border shadow-xl pointer-events-none"
          >
            <div className="flex items-start gap-3">
              <div
                className="size-10 rounded-xl grid place-items-center font-bold text-[13px] text-white shrink-0"
                style={{ background: focusedPerson.color }}
              >
                {focusedPerson.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-extrabold text-sm tracking-tight">{focusedPerson.name}</div>
                  <div className="text-[9px] font-mono uppercase tracking-widest text-foreground/40">
                    {focusedEdges.length} link{focusedEdges.length === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="text-[11px] text-foreground/60 leading-snug mt-0.5 line-clamp-2">{focusedPerson.oneLiner}</div>
                <div className="flex gap-1 flex-wrap mt-1.5">
                  {focusedPerson.tags.slice(0, 4).map((t) => (
                    <span key={t} className="text-[9px] font-mono uppercase tracking-widest bg-foreground/5 text-foreground/60 px-1.5 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint when interactive and nothing selected */}
      {interactive && !focus && (
        <div className="absolute top-3 right-3 px-2.5 py-1 bg-background/80 backdrop-blur-md rounded-full text-[9px] font-mono font-bold uppercase tracking-widest text-foreground/60 ring-1 ring-border pointer-events-none">
          Tap a node
        </div>
      )}
    </div>
  );
}
