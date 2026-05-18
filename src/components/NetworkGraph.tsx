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
};

// Deterministic seeded layout
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function position(id: string, w: number, h: number, ring = 0) {
  const angle = (hash(id) % 360) * (Math.PI / 180);
  const r = 0.18 + ((hash(id + "r") % 100) / 100) * 0.32 + ring * 0.15;
  const cx = w / 2;
  const cy = h / 2;
  return {
    x: cx + Math.cos(angle) * r * w * 0.45,
    y: cy + Math.sin(angle) * r * h * 0.45,
  };
}

export function NetworkGraph({
  scale = "event",
  roomId,
  centerId,
  height = 480,
  className = "",
  showLabels = false,
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
    if (scale === "personal" && centerId) {
      map.set(centerId, { x: W / 2, y: H / 2 });
      const others = nodes.filter((n) => n.id !== centerId);
      others.forEach((n, i) => {
        const angle = (i / others.length) * Math.PI * 2;
        const r = 0.32 + ((hash(n.id) % 100) / 100) * 0.12;
        map.set(n.id, { x: W / 2 + Math.cos(angle) * r * W * 0.5, y: H / 2 + Math.sin(angle) * r * H * 0.9 });
      });
    } else {
      nodes.forEach((n) => map.set(n.id, position(n.id, W, H)));
    }
    return map;
  }, [nodes, scale, centerId, H]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
      </defs>

      {links.map((l, i) => {
        const a = positions.get(l.source);
        const b = positions.get(l.target);
        if (!a || !b) return null;
        return (
          <motion.line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="#7c3aed"
            strokeOpacity={0.35}
            strokeWidth={1}
            strokeDasharray="4 6"
            style={{ animation: `dash-flow ${4 + (i % 5)}s linear infinite` }}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.4 }}
            transition={{ duration: 1.2, delay: i * 0.04 }}
          />
        );
      })}

      {nodes.map((n, i) => {
        const p = positions.get(n.id);
        if (!p) return null;
        const isCenter = n.id === centerId;
        const r = isCenter ? 14 : 6 + ((hash(n.id) % 4));
        return (
          <motion.g
            key={n.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.g
              animate={{ x: [0, 4, -3, 0], y: [0, -3, 4, 0] }}
              transition={{ duration: 6 + (hash(n.id) % 6), repeat: Infinity, ease: "easeInOut" }}
            >
              <circle cx={p.x} cy={p.y} r={r * 3} fill="url(#nodeGlow)" />
              <circle
                cx={p.x}
                cy={p.y}
                r={r}
                fill={isCenter ? "#7c3aed" : n.color}
                stroke="white"
                strokeWidth={isCenter ? 3 : 1.5}
                style={{ filter: `drop-shadow(0 0 ${r}px ${n.color}88)` }}
              />
              {(showLabels || isCenter) && (
                <text
                  x={p.x}
                  y={p.y + r + 14}
                  textAnchor="middle"
                  fontSize={isCenter ? 12 : 10}
                  fontWeight={isCenter ? 700 : 500}
                  fill="currentColor"
                  fillOpacity={isCenter ? 1 : 0.6}
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
