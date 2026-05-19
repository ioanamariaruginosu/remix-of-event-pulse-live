import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { getPublicNetwork, type PublicNode, type PublicEdge } from "@/lib/network.functions";

type Props = {
  height?: number;
  className?: string;
};

/**
 * Real-data network graph for the landing page.
 * Nodes = every profile in the database (real attendees + new signups).
 * Edges = ONLY pairs that have actually exchanged cards.
 */
export function LiveNetworkGraph({ height = 560, className = "" }: Props) {
  const fetchNetwork = useServerFn(getPublicNetwork);
  const { data } = useQuery({
    queryKey: ["public-network"],
    queryFn: () => fetchNetwork(),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  const nodes = data?.nodes ?? [];
  const edges = data?.edges ?? [];

  return (
    <div className={`relative w-full h-full ${className}`} style={{ minHeight: height }}>
      <GraphSvg nodes={nodes} edges={edges} height={height} />
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-background/90 backdrop-blur rounded-full text-[10px] font-display italic font-bold uppercase tracking-widest flex items-center gap-2 ring-1 ring-border">
        <span className="size-1.5 bg-primary rounded-full animate-pulse" />
        Live Network · {nodes.length} {nodes.length === 1 ? "node" : "nodes"} · {edges.length} {edges.length === 1 ? "edge" : "edges"}
      </div>
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm font-display italic">
          Waiting for the first attendees to join…
        </div>
      )}
    </div>
  );
}

function GraphSvg({
  nodes,
  edges,
  height,
}: {
  nodes: PublicNode[];
  edges: PublicEdge[];
  height: number;
}) {
  const W = 800;
  const H = height;

  // Degree map → bigger circle for more-connected people
  const degree = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of edges) {
      m.set(e.source, (m.get(e.source) ?? 0) + 1);
      m.set(e.target, (m.get(e.target) ?? 0) + 1);
    }
    return m;
  }, [edges]);

  // Sort by degree desc so well-connected nodes sit near center (concentric rings)
  const positions = useMemo(() => {
    const cx = W / 2;
    const cy = H / 2;
    const sorted = [...nodes].sort(
      (a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0),
    );
    const map = new Map<string, { x: number; y: number }>();
    if (sorted.length === 0) return map;
    if (sorted.length === 1) {
      map.set(sorted[0].id, { x: cx, y: cy });
      return map;
    }
    // Center hub
    map.set(sorted[0].id, { x: cx, y: cy });

    const rest = sorted.slice(1);
    const ringSize = Math.ceil(Math.sqrt(rest.length) * 1.3);
    let i = 0;
    let ring = 1;
    while (i < rest.length) {
      const onRing = Math.min(ringSize * ring, rest.length - i);
      const radius = Math.min(W, H) * (0.18 + ring * 0.13);
      for (let k = 0; k < onRing; k++) {
        const a = (k / onRing) * Math.PI * 2 + ring * 0.4;
        map.set(rest[i + k].id, {
          x: cx + Math.cos(a) * radius,
          y: cy + Math.sin(a) * radius,
        });
      }
      i += onRing;
      ring++;
    }
    return map;
  }, [nodes, degree, H]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <radialGradient id="lng-bg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill="url(#lng-bg)" />

      {/* Edges — only real exchanged-card pairs */}
      {edges.map((e, i) => {
        const a = positions.get(e.source);
        const b = positions.get(e.target);
        if (!a || !b) return null;
        return (
          <motion.line
            key={`${e.source}-${e.target}-${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={1.4}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.75 }}
            transition={{ duration: 0.9, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((n, i) => {
        const p = positions.get(n.id);
        if (!p) return null;
        const deg = degree.get(n.id) ?? 0;
        const r = 16 + Math.min(deg, 6) * 2.5;
        return (
          <motion.g
            key={n.id}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
          >
            <circle cx={p.x} cy={p.y} r={r + 8} fill={n.color} opacity={0.18} />
            <circle
              cx={p.x}
              cy={p.y}
              r={r}
              fill={n.color}
              stroke="white"
              strokeOpacity={0.9}
              strokeWidth={1.5}
            />
            <text
              x={p.x}
              y={p.y + 4}
              textAnchor="middle"
              fontSize={11}
              fontWeight={800}
              fill="white"
              style={{ pointerEvents: "none", letterSpacing: "0.5px" }}
            >
              {n.initials}
            </text>
            <text
              x={p.x}
              y={p.y + r + 14}
              textAnchor="middle"
              fontSize={10}
              fill="rgba(255,255,255,0.7)"
              style={{ pointerEvents: "none" }}
            >
              {n.name}
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}