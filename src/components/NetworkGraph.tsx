import { useMemo } from "react";
import { motion } from "motion/react";
import { people as allPeople, edges as allEdges, type Person } from "@/data/event";

type Props = {
  scale?: "event" | "room" | "personal";
  roomId?: string;
  centerId?: string;
  height?: number;
  className?: string;
  showLabels?: boolean;
  variant?: "light" | "dark";
};

// Deterministic seeded layout
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
}: Props) {
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
      // Two concentric rings for richer composition
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
      // Tight cluster
      const r = Math.min(W, H) * 0.32;
      nodes.forEach((n, i) => {
        const angle = (i / nodes.length) * Math.PI * 2;
        const rr = r * (0.4 + rand(n.id) * 0.6);
        map.set(n.id, { x: cx + Math.cos(angle) * rr, y: cy + Math.sin(angle) * rr });
      });
    } else {
      // Poisson-disk-ish deterministic distribution across the canvas
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

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
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
        <linearGradient id="ng-linkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="oklch(0.65 0.27 295)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="oklch(0.93 0.16 124)" stopOpacity="0.5" />
        </linearGradient>
        <filter id="ng-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Ambient backdrop glow */}
      <rect x="0" y="0" width={W} height={H} fill="url(#ng-bg)" />

      {/* Subtle constellation backdrop dots */}
      {isDark && Array.from({ length: 40 }).map((_, i) => {
        const x = (hash("bg" + i) % 1000) / 1000 * W;
        const y = (hash("bg" + i + "y") % 1000) / 1000 * H;
        return <circle key={"bg" + i} cx={x} cy={y} r={0.6} fill="rgba(255,255,255,0.25)" />;
      })}

      {/* Links — curved bezier with traveling particle */}
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
        const cx = mx + nx * curve;
        const cy = my + ny * curve;
        const path = `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
        const involvesCenter = centerId && (l.source === centerId || l.target === centerId);
        const dur = 4 + (i % 6);

        return (
          <g key={i}>
            <motion.path
              d={path}
              stroke={involvesCenter ? linkStrong : linkStroke}
              strokeWidth={involvesCenter ? 1.4 : 0.8}
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
            />
            {/* Traveling pulse particle */}
            <circle r={1.6} fill={involvesCenter ? "oklch(0.93 0.16 124)" : "oklch(0.75 0.2 295)"} opacity={0.9}>
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
        const baseR = isCenter ? 18 : 7 + (hash(n.id) % 5);
        const driftDur = 8 + (hash(n.id) % 6);

        return (
          <motion.g
            key={n.id}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: i * 0.025, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.g
              animate={{ x: [0, 5, -4, 2, 0], y: [0, -4, 3, -2, 0] }}
              transition={{ duration: driftDur, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Halo */}
              <circle cx={p.x} cy={p.y} r={baseR * 3.5} fill="url(#ng-nodeGlow)" />

              {/* Pulse ring for center */}
              {isCenter && (
                <>
                  <motion.circle
                    cx={p.x}
                    cy={p.y}
                    r={baseR}
                    fill="none"
                    stroke="oklch(0.65 0.27 295)"
                    strokeWidth={1.5}
                    initial={{ opacity: 0.6, scale: 1 }}
                    animate={{ opacity: 0, scale: 3 }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                    style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                  />
                  <motion.circle
                    cx={p.x}
                    cy={p.y}
                    r={baseR}
                    fill="none"
                    stroke="oklch(0.93 0.16 124)"
                    strokeWidth={1}
                    initial={{ opacity: 0.5, scale: 1 }}
                    animate={{ opacity: 0, scale: 2.4 }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 1.2 }}
                    style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                  />
                </>
              )}

              {/* Node body */}
              <circle
                cx={p.x}
                cy={p.y}
                r={baseR}
                fill={isCenter ? "oklch(0.53 0.27 295)" : n.color}
                stroke={isDark ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,1)"}
                strokeWidth={isCenter ? 2.5 : 1.5}
                style={{ filter: `drop-shadow(0 0 ${baseR * 0.6}px ${n.color}aa)` }}
              />

              {/* Initials on bigger nodes */}
              {(isCenter || baseR >= 10) && (
                <text
                  x={p.x}
                  y={p.y + baseR / 3}
                  textAnchor="middle"
                  fontSize={isCenter ? 11 : baseR * 0.9}
                  fontWeight={800}
                  fill="white"
                  letterSpacing="0.5"
                  style={{ pointerEvents: "none" }}
                >
                  {n.initials}
                </text>
              )}

              {/* Labels */}
              {(showLabels || isCenter) && (
                <text
                  x={p.x}
                  y={p.y + baseR + 16}
                  textAnchor="middle"
                  fontSize={isCenter ? 12 : 10}
                  fontWeight={isCenter ? 700 : 500}
                  fill={labelFill}
                  fontFamily="var(--font-mono)"
                >
                  {n.name}
                </text>
              )}
            </motion.g>
          </motion.g>
        );
      })}
    </svg>
  );
}
