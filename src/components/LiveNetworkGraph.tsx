import { motion } from "motion/react";

type Props = {
  height?: number;
  className?: string;
};

type MockNode = {
  id: string;
  name: string;
  initials: string;
  color: string;
  x: number;
  y: number;
  cluster: "biz" | "eng" | "design" | "fin";
};

const NODES: MockNode[] = [
  // AI for Business cluster (top-left)
  { id: "yw", name: "Yael W.",   initials: "YW", color: "#a855f7", x: 130, y: 95,  cluster: "biz" },
  { id: "ls", name: "Lotte S.",  initials: "LS", color: "#a855f7", x: 85,  y: 175, cluster: "biz" },
  { id: "ka", name: "Kai A.",    initials: "KA", color: "#a855f7", x: 180, y: 195, cluster: "biz" },
  { id: "ml", name: "Mira L.",   initials: "ML", color: "#a855f7", x: 215, y: 95,  cluster: "biz" },

  // Dev Tools / Eng cluster (top-right)
  { id: "cr", name: "Clara R.",  initials: "CR", color: "#6366f1", x: 415, y: 90,  cluster: "eng" },
  { id: "vk", name: "Viktor K.", initials: "VK", color: "#6366f1", x: 495, y: 145, cluster: "eng" },
  { id: "ww", name: "Wessel W.", initials: "WW", color: "#6366f1", x: 415, y: 210, cluster: "eng" },
  { id: "lk", name: "Luuk L.",   initials: "LL", color: "#6366f1", x: 340, y: 155, cluster: "eng" },

  // Creative / Design (bottom-left)
  { id: "dm", name: "Daniel M.", initials: "DM", color: "#ec4899", x: 110, y: 320, cluster: "design" },
  { id: "fp", name: "Fenna P.",  initials: "FP", color: "#ec4899", x: 200, y: 360, cluster: "design" },
  { id: "ek", name: "Erik K.",   initials: "EK", color: "#ec4899", x: 65,  y: 395, cluster: "design" },

  // Fintech (bottom-right)
  { id: "kv", name: "Karim V.",  initials: "KV", color: "#10b981", x: 430, y: 350, cluster: "fin" },
  { id: "gl", name: "Gijs L.",   initials: "GL", color: "#10b981", x: 510, y: 395, cluster: "fin" },
  { id: "el", name: "Erik vdL.", initials: "EL", color: "#10b981", x: 360, y: 405, cluster: "fin" },

  // Center hub — cross-cluster super-connector
  { id: "ao", name: "Adam O.",   initials: "AO", color: "#fbbf24", x: 300, y: 255, cluster: "eng" },
];

const EDGES: [string, string][] = [
  // Biz cluster — dense
  ["yw", "ls"], ["yw", "ka"], ["yw", "ml"], ["ls", "ka"], ["ka", "ml"],
  // Eng cluster — dense
  ["cr", "vk"], ["cr", "lk"], ["vk", "ww"], ["lk", "ww"], ["cr", "ww"],
  // Design cluster
  ["dm", "fp"], ["dm", "ek"], ["fp", "ek"],
  // Fintech cluster
  ["kv", "gl"], ["kv", "el"], ["gl", "el"],
  // Hub bridges
  ["ao", "ml"], ["ao", "ka"], ["ao", "lk"], ["ao", "cr"],
  ["ao", "fp"], ["ao", "kv"], ["ao", "ww"],
  // A couple of cross-cluster ties
  ["ml", "lk"], ["ka", "fp"], ["ww", "kv"], ["fp", "el"],
];

const W = 600;
const H = 480;

export function LiveNetworkGraph({ height = 420, className = "" }: Props) {
  const degree = new Map<string, number>();
  for (const [a, b] of EDGES) {
    degree.set(a, (degree.get(a) ?? 0) + 1);
    degree.set(b, (degree.get(b) ?? 0) + 1);
  }
  const posById = new Map(NODES.map((n) => [n.id, n]));

  return (
    <div className={`relative w-full h-full ${className}`} style={{ minHeight: height }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <defs>
          <radialGradient id="lng-bg" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="edge-grad" x1="0" x2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={W} height={H} fill="url(#lng-bg)" />

        {/* Cluster halos — subtle */}
        <g opacity={0.35}>
          <circle cx={150} cy={140} r={105} fill="#a855f7" opacity={0.08} />
          <circle cx={420} cy={150} r={110} fill="#6366f1" opacity={0.08} />
          <circle cx={125} cy={360} r={95}  fill="#ec4899" opacity={0.08} />
          <circle cx={435} cy={380} r={105} fill="#10b981" opacity={0.08} />
        </g>

        {/* Edges */}
        {EDGES.map(([sa, sb], i) => {
          const a = posById.get(sa)!;
          const b = posById.get(sb)!;
          return (
            <motion.line
              key={`${sa}-${sb}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="url(#edge-grad)"
              strokeWidth={1.4}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.85 }}
              transition={{ duration: 0.9, delay: 0.2 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
            />
          );
        })}

        {/* Nodes */}
        {NODES.map((n, i) => {
          const deg = degree.get(n.id) ?? 0;
          const r = 14 + Math.min(deg, 7) * 1.6;
          return (
            <motion.g
              key={n.id}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <circle cx={n.x} cy={n.y} r={r + 7} fill={n.color} opacity={0.22} />
              <circle
                cx={n.x} cy={n.y} r={r}
                fill={n.color}
                stroke="white"
                strokeOpacity={0.95}
                strokeWidth={1.5}
              />
              <text
                x={n.x} y={n.y + 4}
                textAnchor="middle"
                fontSize={11}
                fontWeight={800}
                fill="white"
                style={{ pointerEvents: "none", letterSpacing: "0.4px" }}
              >
                {n.initials}
              </text>
              <text
                x={n.x} y={n.y + r + 13}
                textAnchor="middle"
                fontSize={9.5}
                fill="rgba(255,255,255,0.78)"
                style={{ pointerEvents: "none" }}
              >
                {n.name}
              </text>
            </motion.g>
          );
        })}
      </svg>

      <div className="absolute top-3 left-3 px-2.5 py-1 bg-background/90 backdrop-blur rounded-full text-[9px] font-display italic font-bold uppercase tracking-widest flex items-center gap-1.5 ring-1 ring-border">
        <span className="size-1.5 bg-primary rounded-full animate-pulse" />
        Sample Network · {NODES.length} attendees · {EDGES.length} connections
      </div>

      {/* Cluster legend */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 text-[9px] font-display italic font-semibold uppercase tracking-wider text-white/85">
        <LegendDot color="#a855f7" label="AI for Business" />
        <LegendDot color="#6366f1" label="Dev Tools" />
        <LegendDot color="#ec4899" label="Creative" />
        <LegendDot color="#10b981" label="Fintech" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-black/25 rounded-full ring-1 ring-white/10">
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
