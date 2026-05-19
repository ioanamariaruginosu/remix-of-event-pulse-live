import { useRef, useState, useCallback, type WheelEvent, type PointerEvent } from "react";
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
};

const NODES: MockNode[] = [
  { id: "yw", name: "Yael W.",   initials: "YW", color: "#a855f7", x: 130, y: 95 },
  { id: "ls", name: "Lotte S.",  initials: "LS", color: "#a855f7", x: 85,  y: 175 },
  { id: "ka", name: "Kai A.",    initials: "KA", color: "#a855f7", x: 180, y: 195 },
  { id: "ml", name: "Mira L.",   initials: "ML", color: "#a855f7", x: 215, y: 95 },
  { id: "cr", name: "Clara R.",  initials: "CR", color: "#6366f1", x: 415, y: 90 },
  { id: "vk", name: "Viktor K.", initials: "VK", color: "#6366f1", x: 495, y: 145 },
  { id: "ww", name: "Wessel W.", initials: "WW", color: "#6366f1", x: 415, y: 210 },
  { id: "lk", name: "Luuk L.",   initials: "LL", color: "#6366f1", x: 340, y: 155 },
  { id: "dm", name: "Daniel M.", initials: "DM", color: "#ec4899", x: 110, y: 320 },
  { id: "fp", name: "Fenna P.",  initials: "FP", color: "#ec4899", x: 200, y: 360 },
  { id: "ek", name: "Erik K.",   initials: "EK", color: "#ec4899", x: 65,  y: 395 },
  { id: "kv", name: "Karim V.",  initials: "KV", color: "#10b981", x: 430, y: 350 },
  { id: "gl", name: "Gijs L.",   initials: "GL", color: "#10b981", x: 510, y: 395 },
  { id: "el", name: "Erik vdL.", initials: "EL", color: "#10b981", x: 360, y: 405 },
  { id: "ao", name: "Adam O.",   initials: "AO", color: "#fbbf24", x: 300, y: 255 },
];

const EDGES: [string, string][] = [
  ["yw", "ls"], ["yw", "ka"], ["yw", "ml"], ["ls", "ka"], ["ka", "ml"],
  ["cr", "vk"], ["cr", "lk"], ["vk", "ww"], ["lk", "ww"], ["cr", "ww"],
  ["dm", "fp"], ["dm", "ek"], ["fp", "ek"],
  ["kv", "gl"], ["kv", "el"], ["gl", "el"],
  ["ao", "ml"], ["ao", "ka"], ["ao", "lk"], ["ao", "cr"],
  ["ao", "fp"], ["ao", "kv"], ["ao", "ww"],
  ["ml", "lk"], ["ka", "fp"], ["ww", "kv"], ["fp", "el"],
];

const W = 600;
const H = 480;
const MIN_K = 0.5;
const MAX_K = 3;

export function LiveNetworkGraph({ height = 340, className = "" }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [view, setView] = useState({ k: 1, tx: 0, ty: 0 });
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const degree = new Map<string, number>();
  for (const [a, b] of EDGES) {
    degree.set(a, (degree.get(a) ?? 0) + 1);
    degree.set(b, (degree.get(b) ?? 0) + 1);
  }
  const posById = new Map(NODES.map((n) => [n.id, n]));

  const onWheel = useCallback((e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    // mouse in viewBox coords
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    const my = ((e.clientY - rect.top) / rect.height) * H;
    setView((v) => {
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const nk = Math.min(MAX_K, Math.max(MIN_K, v.k * factor));
      const real = nk / v.k;
      // keep point under cursor stationary
      const ntx = mx - (mx - v.tx) * real;
      const nty = my - (my - v.ty) * real;
      return { k: nk, tx: ntx, ty: nty };
    });
  }, []);

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty };
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragRef.current.x) / rect.width) * W;
    const dy = ((e.clientY - dragRef.current.y) / rect.height) * H;
    setView((v) => ({ ...v, tx: dragRef.current!.tx + dx, ty: dragRef.current!.ty + dy }));
  };
  const onPointerUp = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const reset = () => setView({ k: 1, tx: 0, ty: 0 });
  const zoom = (dir: 1 | -1) =>
    setView((v) => {
      const nk = Math.min(MAX_K, Math.max(MIN_K, v.k * (dir === 1 ? 1.2 : 1 / 1.2)));
      const cx = W / 2, cy = H / 2;
      const real = nk / v.k;
      return { k: nk, tx: cx - (cx - v.tx) * real, ty: cy - (cy - v.ty) * real };
    });

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

        <g transform={`translate(${view.tx} ${view.ty}) scale(${view.k})`}>
          <g opacity={0.35}>
            <circle cx={150} cy={140} r={105} fill="#a855f7" opacity={0.08} />
            <circle cx={420} cy={150} r={110} fill="#6366f1" opacity={0.08} />
            <circle cx={125} cy={360} r={95}  fill="#ec4899" opacity={0.08} />
            <circle cx={435} cy={380} r={105} fill="#10b981" opacity={0.08} />
          </g>

          {EDGES.map(([sa, sb], i) => {
            const a = posById.get(sa)!;
            const b = posById.get(sb)!;
            return (
              <motion.line
                key={`${sa}-${sb}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="url(#edge-grad)"
                strokeWidth={1.4 / view.k}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.85 }}
                transition={{ duration: 0.9, delay: 0.2 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              />
            );
          })}

          {NODES.map((n, i) => {
            const deg = degree.get(n.id) ?? 0;
            const r = 13 + Math.min(deg, 7) * 1.4;
            return (
              <motion.g
                key={n.id}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
                <circle cx={n.x} cy={n.y} r={r + 6} fill={n.color} opacity={0.22} />
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
                  fontSize={11}
                  fontWeight={800}
                  fill="white"
                  style={{ pointerEvents: "none", letterSpacing: "0.4px" }}
                >
                  {n.initials}
                </text>
                <text
                  x={n.x} y={n.y + r + 12}
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
        </g>
      </svg>

      <div className="absolute top-3 left-3 px-2.5 py-1 bg-background/90 backdrop-blur rounded-full text-[9px] font-display italic font-bold uppercase tracking-widest flex items-center gap-1.5 ring-1 ring-border">
        <span className="size-1.5 bg-primary rounded-full animate-pulse" />
        Sample Network · {NODES.length} · {EDGES.length} edges
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
