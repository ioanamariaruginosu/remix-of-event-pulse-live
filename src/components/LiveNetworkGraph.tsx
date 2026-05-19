import { useRef, useState, useEffect, useMemo, type WheelEvent, type PointerEvent } from "react";
import { getPublicNetwork, type PublicNode, type PublicEdge } from "@/lib/network.functions";
import { people as mockPeople, edges as mockEdges } from "@/data/event";

type Props = {
  height?: number;
  className?: string;
};

type LayoutNode = {
  id: string;
  name: string;
  initials: string;
  color: string;
  x: number;
  y: number;
};

const W = 2000;
const H = 1400;
const MIN_K = 0.4;
const MAX_K = 4;

// Cluster anchors — pushed far apart so 100+ nodes have room to breathe.
const ANCHORS: Record<string, { x: number; y: number }> = {
  "#a855f7": { x:  430, y:  380 },
  "#6366f1": { x: 1570, y:  380 },
  "#ec4899": { x:  430, y: 1020 },
  "#10b981": { x: 1570, y: 1020 },
  "#fbbf24": { x: 1000, y:  700 },
};

// Map a profile to a cluster color based on its tags (track / discipline).
const CLUSTER_COLORS: { match: RegExp; color: string }[] = [
  { match: /business|biz|marketing|creative/i, color: "#a855f7" },
  { match: /dev|engineer|cs|infrastructure|tools/i, color: "#6366f1" },
  { match: /design|product/i, color: "#ec4899" },
  { match: /fintech|payment|finance/i, color: "#10b981" },
  { match: /health|sustain|climate/i, color: "#fbbf24" },
];

function pickColor(node: PublicNode): string {
  for (const tag of node.tags ?? []) {
    for (const c of CLUSTER_COLORS) {
      if (c.match.test(tag)) return c.color;
    }
  }
  if (node.color && /^#?[0-9a-f]{6}$/i.test(node.color.replace("#", ""))) {
    return node.color.startsWith("#") ? node.color : `#${node.color}`;
  }
  // hash-based fallback so unknowns still spread across clusters
  let h = 0;
  for (let i = 0; i < node.id.length; i++) h = (h * 31 + node.id.charCodeAt(i)) >>> 0;
  return ["#a855f7", "#6366f1", "#ec4899", "#10b981", "#fbbf24"][h % 5];
}

// Lay out nodes by color cluster: each cluster has its own anchor; within a
// cluster, nodes are placed on a packed grid in a circle around the anchor.
function layoutNodes(profiles: PublicNode[]): LayoutNode[] {
  const groups = new Map<string, PublicNode[]>();
  for (const p of profiles) {
    const c = pickColor(p);
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c)!.push(p);
  }
  const out: LayoutNode[] = [];
  for (const [color, list] of groups.entries()) {
    const anchor = ANCHORS[color] ?? { x: W / 2, y: H / 2 };
    list.forEach((p, i) => {
      // Concentric rings with generous spacing so nodes never overlap.
      const ring = Math.floor((-1 + Math.sqrt(1 + (8 * i) / 6)) / 2);
      const ringStart = ring === 0 ? 0 : 1 + 6 * (ring * (ring - 1)) / 2 + ring;
      const perRing = Math.max(1, ring * 6);
      const idxInRing = Math.max(0, i - ringStart);
      const angle = (idxInRing / perRing) * Math.PI * 2 + (color.length % 7);
      const radius = ring === 0 ? 0 : 90 + ring * 85;
      out.push({
        id: p.id,
        name: p.name.split(" ").slice(0, 2).join(" "),
        initials: p.initials,
        color,
        x: anchor.x + Math.cos(angle) * radius,
        y: anchor.y + Math.sin(angle) * radius,
      });
    });
  }
  return out;
}

export function LiveNetworkGraph({ height = 340, className = "" }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const groupRef = useRef<SVGGElement | null>(null);
  const [view, setView] = useState({ k: 1, tx: 0, ty: 0 });
  const viewRef = useRef(view);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [remote, setRemote] = useState<{ nodes: PublicNode[]; edges: PublicEdge[] } | null>(null);

  // Imperatively apply view to the <g> for buttery-smooth pan/zoom.
  const applyView = (v: { k: number; tx: number; ty: number }) => {
    viewRef.current = v;
    const g = groupRef.current;
    if (g) g.setAttribute("transform", `translate(${v.tx} ${v.ty}) scale(${v.k})`);
  };
  // Commit view to React state (used after interaction settles, so anything
  // depending on view.k — like stroke widths — gets the final value).
  const commitView = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setView(viewRef.current));
  };

  useEffect(() => {
    let cancelled = false;
    getPublicNetwork()
      .then((r) => { if (!cancelled) setRemote(r); })
      .catch(() => { /* keep mock fallback */ });
    return () => { cancelled = true; };
  }, []);

  const { nodes, edges } = useMemo(() => {
    // Always include the 100 mock attendees from the seed list,
    // and merge in any real in-app profiles on top.
    const mockAsPublic: PublicNode[] = mockPeople
      .filter((p) => p.id !== "you")
      .map((p) => ({
        id: `mock:${p.id}`,
        name: p.name,
        initials: p.initials,
        color: p.color,
        tags: p.tags,
      }));
    const remoteNodes = remote?.nodes ?? [];
    const all = [...mockAsPublic, ...remoteNodes];
    const laid = layoutNodes(all);

    const mockEdgeTuples: [string, string][] = mockEdges
      .filter((e) => e.source !== "you" && e.target !== "you")
      .map((e) => [`mock:${e.source}`, `mock:${e.target}`]);
    const remoteTuples: [string, string][] = (remote?.edges ?? []).map((e) => [e.source, e.target]);
    return { nodes: laid, edges: [...mockEdgeTuples, ...remoteTuples] };
  }, [remote]);

  const degree = useMemo(() => {
    const d = new Map<string, number>();
    for (const [a, b] of edges) {
      d.set(a, (d.get(a) ?? 0) + 1);
      d.set(b, (d.get(b) ?? 0) + 1);
    }
    return d;
  }, [edges]);
  const posById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const onWheel = (e: WheelEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    e.preventDefault();
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    const my = ((e.clientY - rect.top) / rect.height) * H;
    const v = viewRef.current;
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const nk = Math.min(MAX_K, Math.max(MIN_K, v.k * factor));
    const real = nk / v.k;
    applyView({
      k: nk,
      tx: mx - (mx - v.tx) * real,
      ty: my - (my - v.ty) * real,
    });
    commitView();
  };

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const v = viewRef.current;
    dragRef.current = { x: e.clientX, y: e.clientY, tx: v.tx, ty: v.ty };
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragRef.current.x) / rect.width) * W;
    const dy = ((e.clientY - dragRef.current.y) / rect.height) * H;
    const v = viewRef.current;
    applyView({ k: v.k, tx: dragRef.current.tx + dx, ty: dragRef.current.ty + dy });
  };
  const onPointerUp = () => {
    dragRef.current = null;
    setDragging(false);
    commitView();
  };

  const reset = () => { applyView({ k: 1, tx: 0, ty: 0 }); commitView(); };
  const zoom = (dir: 1 | -1) => {
    const v = viewRef.current;
    const nk = Math.min(MAX_K, Math.max(MIN_K, v.k * (dir === 1 ? 1.2 : 1 / 1.2)));
    const cx = W / 2, cy = H / 2;
    const real = nk / v.k;
    applyView({ k: nk, tx: cx - (cx - v.tx) * real, ty: cy - (cy - v.ty) * real });
    commitView();
  };

  return (
    <div className={`relative w-full h-full ${className}`} style={{ minHeight: height }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          cursor: dragging ? "grabbing" : "grab",
          touchAction: "none",
        }}
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

        <g ref={groupRef} transform={`translate(${view.tx} ${view.ty}) scale(${view.k})`}>
          <g opacity={0.35}>
            {Object.entries(ANCHORS).map(([c, a]) => (
              <circle key={c} cx={a.x} cy={a.y} r={360} fill={c} opacity={0.06} />
            ))}
          </g>

          {edges.map(([sa, sb]) => {
            const a = posById.get(sa);
            const b = posById.get(sb);
            if (!a || !b) return null;
            return (
              <line
                key={`${sa}-${sb}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="url(#edge-grad)"
                strokeWidth={1.6 / view.k}
                strokeLinecap="round"
                opacity={0.55}
              />
            );
          })}

          {nodes.map((n) => {
            const deg = degree.get(n.id) ?? 0;
            const baseR = nodes.length > 60 ? 14 : nodes.length > 25 ? 18 : 22;
            const r = baseR + Math.min(deg, 8) * 1.3;
            const showLabel = nodes.length <= 60 || deg >= 4;
            return (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={r + 4} fill={n.color} opacity={0.22} />
                <circle
                  cx={n.x} cy={n.y} r={r}
                  fill={n.color}
                  stroke="white"
                  strokeOpacity={0.95}
                  strokeWidth={1.5 / view.k}
                />
                <text
                  x={n.x} y={n.y + 4}
                  textAnchor="middle"
                  fontSize={Math.max(10, Math.round(r * 0.7))}
                  fontWeight={800}
                  fill="white"
                  style={{ pointerEvents: "none", letterSpacing: "0.4px" }}
                >
                  {n.initials}
                </text>
                {showLabel && (
                  <text
                    x={n.x} y={n.y + r + 14}
                    textAnchor="middle"
                    fontSize={11}
                    fill="rgba(255,255,255,0.78)"
                    style={{ pointerEvents: "none" }}
                  >
                    {n.name}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      <div className="absolute top-3 left-3 px-2.5 py-1 bg-background/90 backdrop-blur rounded-full text-[9px] font-display italic font-bold uppercase tracking-widest flex items-center gap-1.5 ring-1 ring-border">
        <span className="size-1.5 bg-primary rounded-full animate-pulse" />
        Live · {nodes.length} attendees · {(remote?.nodes.length ?? 0)} in-app · {edges.length} edges
      </div>

      {/* Zoom controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1">
        <button
          onClick={() => zoom(1)}
          className="size-7 rounded-md bg-background/90 backdrop-blur ring-1 ring-border text-foreground text-base leading-none font-bold hover:bg-background"
          aria-label="Zoom in"
        >+</button>
        <button
          onClick={() => zoom(-1)}
          className="size-7 rounded-md bg-background/90 backdrop-blur ring-1 ring-border text-foreground text-base leading-none font-bold hover:bg-background"
          aria-label="Zoom out"
        >−</button>
        <button
          onClick={reset}
          className="size-7 rounded-md bg-background/90 backdrop-blur ring-1 ring-border text-foreground text-[9px] font-display italic font-bold uppercase hover:bg-background"
          aria-label="Reset view"
        >fit</button>
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 text-[9px] font-display italic font-semibold uppercase tracking-wider text-white/85">
        <LegendDot color="#a855f7" label="Biz" />
        <LegendDot color="#6366f1" label="Dev" />
        <LegendDot color="#ec4899" label="Creative" />
        <LegendDot color="#10b981" label="Fintech" />
        <span className="ml-auto px-2 py-0.5 bg-black/25 rounded-full ring-1 ring-white/10 normal-case tracking-normal">
          drag · scroll to zoom
        </span>
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
