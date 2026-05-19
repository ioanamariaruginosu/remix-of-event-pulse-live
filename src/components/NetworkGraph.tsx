import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { people as allPeople, edges as allEdges, type Person } from "@/data/event";
import { useMembership } from "@/data/presence";
import { avatarUrl, defaultAvatarFor, useUserAvatar } from "@/data/avatars";


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
  extraPeople?: Person[];
  extraEdges?: { source: string; target: string; reason: string }[];
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function rand(seed: string) {
  return (hash(seed) % 10000) / 10000;
}

/* --- Interest clusters → color identity ---
   People who share an interest cluster share a color, so the graph
   reads at a glance: "who is like me?" = "who shares my color?". */
const CLUSTERS: { id: string; color: string; tags: string[] }[] = [
  { id: "design", color: "#ff5e7e", tags: ["design", "ux", "spatial", "product", "architecture", "creative", "webgl"] },
  { id: "ai", color: "#a78bfa", tags: ["ml", "llm", "evals", "agents", "voice", "whisper", "research"] },
  { id: "infra", color: "#22d3ee", tags: ["infra", "devtools", "backend", "p2p", "local-first", "graphs", "consulting"] },
  { id: "hw", color: "#bef264", tags: ["hardware", "ble", "robotics", "badges", "games"] },
  { id: "money", color: "#fbbf24", tags: ["vc", "funding", "fintech", "founders"] },
  { id: "people", color: "#f472b6", tags: ["devrel", "pm", "writing", "panel"] },
];
const DEFAULT_CLUSTER = { id: "other", color: "#94a3b8", tags: [] as string[] };

function clusterFor(p: Person) {
  for (const tag of p.tags) {
    const c = CLUSTERS.find((c) => c.tags.includes(tag));
    if (c) return c;
  }
  return DEFAULT_CLUSTER;
}

/** Jaccard-style match score 0..1 between two people based on tags. */
function matchScore(a: Person, b: Person) {
  if (a.id === b.id) return 1;
  const setA = new Set(a.tags);
  let inter = 0;
  for (const t of b.tags) if (setA.has(t)) inter++;
  const union = new Set([...a.tags, ...b.tags]).size || 1;
  const jac = inter / union;
  // boost when in same cluster even with low tag overlap
  const sameCluster = clusterFor(a).id === clusterFor(b).id ? 0.25 : 0;
  return Math.min(1, jac * 1.8 + sameCluster);
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
  extraPeople,
  extraEdges,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const membership = useMembership();
  const userOverride = useUserAvatar();

  function avatarFor(p: Person) {
    if (p.id === "you" && userOverride) return userOverride;
    return defaultAvatarFor(p);
  }


  const { nodes, links, center } = useMemo(() => {
    const mergedPeople: Person[] = extraPeople && extraPeople.length
      ? [...allPeople, ...extraPeople.filter((p) => !allPeople.some((ap) => ap.id === p.id))]
      : allPeople;
    const mergedEdges = extraEdges && extraEdges.length
      ? [...allEdges, ...extraEdges]
      : allEdges;
    let people: Person[] = mergedPeople;
    if (scale === "room" && roomId) {
      // Use live presence — door tap-ins update this in real time
      people = mergedPeople.filter((p) => membership.get(p.id) === roomId);
    } else if (scale === "personal" && centerId) {
      const directIds = new Set<string>([centerId]);
      mergedEdges.forEach((e) => {
        if (e.source === centerId) directIds.add(e.target);
        if (e.target === centerId) directIds.add(e.source);
      });
      people = mergedPeople.filter((p) => directIds.has(p.id));
    }
    const ids = new Set(people.map((p) => p.id));
    // Edges = mutual taps that exchanged identity cards
    const links = mergedEdges.filter((e) => ids.has(e.source) && ids.has(e.target));
    const center = centerId ? mergedPeople.find((p) => p.id === centerId) ?? null : null;
    return { nodes: people, links, center };
  }, [scale, roomId, centerId, membership, extraPeople, extraEdges]);


  const W = 800;
  const H = height;

  /* Per-node derived visual state: color from cluster, match-strength from
     similarity to the center person (the "you" node). Min radius is generous
     enough that every node fits a legible avatar. */
  const enriched = useMemo(() => {
    const minR = scale === "personal" ? 14 : 13;
    return nodes.map((n) => {
      const cl = clusterFor(n);
      const match = center ? matchScore(center, n) : 0;
      const baseR = n.id === centerId ? 24 : minR + Math.round(match * 8);
      return { ...n, color: cl.color, cluster: cl.id, match, baseR };
    });
  }, [nodes, center, centerId, scale]);


  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const cx = W / 2;
    const cy = H / 2;

    if (scale === "personal" && centerId) {
      map.set(centerId, { x: cx, y: cy });
      const others = enriched.filter((n) => n.id !== centerId);
      // Place high-match people closer to center
      const sorted = [...others].sort((a, b) => b.match - a.match);
      sorted.forEach((n, i) => {
        const inner = i < Math.ceil(sorted.length / 3);
        const ringR = inner ? Math.min(W, H) * 0.22 : Math.min(W, H) * 0.38;
        const ringTotal = inner ? Math.ceil(sorted.length / 3) : sorted.length - Math.ceil(sorted.length / 3);
        const indexInRing = inner ? i : i - Math.ceil(sorted.length / 3);
        const angleStep = (Math.PI * 2) / Math.max(ringTotal, 1);
        const jitter = (rand(n.id + "j") - 0.5) * 0.35;
        const angle = indexInRing * angleStep + jitter + (inner ? 0 : 0.3);
        map.set(n.id, { x: cx + Math.cos(angle) * ringR, y: cy + Math.sin(angle) * ringR });
      });
    } else if (scale === "room") {
      // Cluster-aware placement: group people of same cluster together
      const clusters = Array.from(new Set(enriched.map((n) => n.cluster)));
      const r = Math.min(W, H) * 0.34;
      const byCluster = new Map<string, typeof enriched>();
      enriched.forEach((n) => {
        const arr = byCluster.get(n.cluster) ?? [];
        arr.push(n);
        byCluster.set(n.cluster, arr);
      });
      clusters.forEach((cId, ci) => {
        const arr = byCluster.get(cId)!;
        const sectorAngle = (Math.PI * 2) / clusters.length;
        const baseAngle = ci * sectorAngle;
        arr.forEach((n, i) => {
          const sub = (i / arr.length) * sectorAngle * 0.8 - sectorAngle * 0.4;
          const rr = r * (0.55 + rand(n.id) * 0.45);
          const a = baseAngle + sub;
          map.set(n.id, { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr });
        });
      });
    } else {
      const cols = Math.ceil(Math.sqrt(enriched.length * (W / H)));
      const rows = Math.ceil(enriched.length / cols);
      enriched.forEach((n, i) => {
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
  }, [enriched, scale, centerId, H]);

  const isDark = variant === "dark";
  const linkStroke = isDark ? "rgba(255,255,255,0.22)" : "rgba(20,20,30,0.14)";
  const labelFill = isDark ? "rgba(255,255,255,0.7)" : "rgba(20,20,30,0.7)";
  const doodleStroke = isDark ? "rgba(255,255,255,0.45)" : "rgba(20,20,30,0.5)";

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

  const focusedPerson = focus ? enriched.find((n) => n.id === focus) : null;
  const focusedEdges = focus
    ? links.filter((l) => l.source === focus || l.target === focus)
    : [];

  // Top match (for the "high match ↗" doodle annotation)
  const topMatch = useMemo(() => {
    if (!centerId) return null;
    const others = enriched.filter((n) => n.id !== centerId);
    if (!others.length) return null;
    return others.reduce((a, b) => (a.match > b.match ? a : b));
  }, [enriched, centerId]);

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
            <stop offset="0%" stopColor="#a78bfa" stopOpacity={isDark ? 0.28 : 0.10} />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ng-bg2" cx="20%" cy="80%" r="40%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity={isDark ? 0.18 : 0.06} />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ng-bg3" cx="85%" cy="15%" r="38%">
            <stop offset="0%" stopColor="#ff5e7e" stopOpacity={isDark ? 0.16 : 0.05} />
            <stop offset="100%" stopColor="#ff5e7e" stopOpacity="0" />
          </radialGradient>
          {/* Per-cluster glow gradients */}
          {CLUSTERS.map((c) => (
            <radialGradient key={c.id} id={`ng-glow-${c.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={c.color} stopOpacity="0.6" />
              <stop offset="60%" stopColor={c.color} stopOpacity="0.12" />
              <stop offset="100%" stopColor={c.color} stopOpacity="0" />
            </radialGradient>
          ))}
          <radialGradient id={`ng-glow-${DEFAULT_CLUSTER.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={DEFAULT_CLUSTER.color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={DEFAULT_CLUSTER.color} stopOpacity="0" />
          </radialGradient>

          {/* Doodle: hand-drawn arrow head */}
          <marker id="ng-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={doodleStroke} />
          </marker>
        </defs>

        <rect x="0" y="0" width={W} height={H} fill="url(#ng-bg)" />
        <rect x="0" y="0" width={W} height={H} fill="url(#ng-bg2)" />
        <rect x="0" y="0" width={W} height={H} fill="url(#ng-bg3)" />

        {/* Starfield */}
        {isDark && Array.from({ length: 50 }).map((_, i) => {
          const x = (hash("bg" + i) % 1000) / 1000 * W;
          const y = (hash("bg" + i + "y") % 1000) / 1000 * H;
          const r = 0.4 + ((hash("bg" + i + "r") % 100) / 100) * 1.1;
          return <circle key={"bg" + i} cx={x} cy={y} r={r} fill="rgba(255,255,255,0.28)" />;
        })}

        {/* Background doodles — asterisks & squiggles, like marginalia */}
        <g opacity={0.55} fontFamily="var(--font-display)" fontStyle="italic" fill={doodleStroke}>
          <text x={40} y={50} fontSize={22}>✺</text>
          <text x={W - 60} y={H - 30} fontSize={18}>✦</text>
          <text x={60} y={H - 40} fontSize={14}>○</text>
          <text x={W - 80} y={70} fontSize={16}>+</text>
          <path
            d={`M 30 ${H * 0.5} q 20 -10 40 0 t 40 0`}
            stroke={doodleStroke}
            strokeWidth={1}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M ${W - 110} ${H * 0.35} q 15 8 30 0 t 30 0`}
            stroke={doodleStroke}
            strokeWidth={1}
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* Links = exchanged taps */}
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
          const curve = (rand(l.source + l.target) - 0.5) * 70;
          const ctrlX = mx + nx * curve;
          const ctrlY = my + ny * curve;
          const path = `M ${a.x} ${a.y} Q ${ctrlX} ${ctrlY} ${b.x} ${b.y}`;
          const involvesCenter = centerId && (l.source === centerId || l.target === centerId);
          const involvesFocus = focus && (l.source === focus || l.target === focus);
          const dimmed = focus && !involvesFocus;
          const dur = 3.5 + (i % 6) * 0.6;

          // Edge gets the color of whichever endpoint isn't the center
          const otherId = involvesCenter ? (l.source === centerId ? l.target : l.source) : l.source;
          const otherNode = enriched.find((n) => n.id === otherId);
          const edgeColor = involvesFocus
            ? "#bef264"
            : involvesCenter && otherNode
            ? otherNode.color
            : linkStroke;

          return (
            <g key={i} style={{ opacity: dimmed ? 0.08 : 1, transition: "opacity .3s" }}>
              <motion.path
                d={path}
                stroke={edgeColor}
                strokeWidth={involvesFocus ? 2 : involvesCenter ? 1.6 : 0.9}
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: involvesCenter ? 0.9 : 0.7 }}
                transition={{ duration: 1.2, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
              />
              <circle
                r={involvesFocus ? 2.6 : 1.8}
                fill={involvesFocus ? "#bef264" : edgeColor === linkStroke ? "#a78bfa" : edgeColor}
                opacity={0.95}
              >
                <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={path} begin={`${(i % 4) * 0.5}s`} />
              </circle>
            </g>
          );
        })}

        {/* Nodes */}
        {enriched.map((n, i) => {
          const p = positions.get(n.id);
          if (!p) return null;
          const isCenter = n.id === centerId;
          const isFocus = focus === n.id;
          const dimmed = focus && !neighbors?.has(n.id);
          const baseR = isCenter || isFocus ? 22 : n.baseR;
          // Match-driven pulse: higher match → bigger, faster glow
          const pulseScale = 1.4 + n.match * 1.6;
          const pulseDur = Math.max(1.4, 3.2 - n.match * 1.8);
          const driftDur = 8 + (hash(n.id) % 6);
          const glowId = `ng-glow-${n.cluster}`;
          const showLabel = showLabels || isCenter || isFocus || n.match > 0.55;

          return (
            <motion.g
              key={n.id}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: dimmed ? 0.22 : 1, scale: 1 }}
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
                {/* Soft cluster-colored glow halo */}
                <circle cx={p.x} cy={p.y} r={baseR * (3 + n.match * 2)} fill={`url(#${glowId})`} />

                {/* Match-driven pulsing rings — stronger for better matches */}
                {(n.match > 0.2 || isCenter || isFocus) && (
                  <motion.circle
                    cx={p.x}
                    cy={p.y}
                    r={baseR}
                    fill="none"
                    stroke={isFocus ? "#bef264" : n.color}
                    strokeWidth={1.5}
                    initial={{ opacity: 0.55, scale: 1 }}
                    animate={{ opacity: 0, scale: pulseScale }}
                    transition={{ duration: pulseDur, repeat: Infinity, ease: "easeOut" }}
                    style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                  />
                )}
                {n.match > 0.55 && !isCenter && (
                  <motion.circle
                    cx={p.x}
                    cy={p.y}
                    r={baseR}
                    fill="none"
                    stroke={n.color}
                    strokeWidth={1}
                    initial={{ opacity: 0.4, scale: 1 }}
                    animate={{ opacity: 0, scale: pulseScale + 0.6 }}
                    transition={{ duration: pulseDur, repeat: Infinity, ease: "easeOut", delay: pulseDur * 0.4 }}
                    style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                  />
                )}

                {/* Hit target */}
                {interactive && (
                  <circle cx={p.x} cy={p.y} r={Math.max(baseR + 10, 18)} fill="transparent" />
                )}

                {/* Avatar puck — every node gets a DiceBear face clipped to a circle. */}
                <defs>
                  <clipPath id={`ng-clip-${n.id}`}>
                    <circle cx={p.x} cy={p.y} r={baseR - 1} />
                  </clipPath>
                </defs>
                {/* Cluster-colored backdrop so transparent avatars still
                    communicate identity and the node glows. */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={baseR}
                  fill={n.color}
                  style={{ filter: `drop-shadow(0 0 ${baseR * (0.5 + n.match)}px ${n.color}cc)` }}
                />
                <image
                  href={avatarUrl(avatarFor(n), 128, "png")}
                  xlinkHref={avatarUrl(avatarFor(n), 128, "png")}
                  x={p.x - baseR}
                  y={p.y - baseR}
                  width={baseR * 2}
                  height={baseR * 2}
                  clipPath={`url(#ng-clip-${n.id})`}
                  preserveAspectRatio="xMidYMid slice"
                  style={{ pointerEvents: "none" }}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={baseR}
                  fill="none"
                  stroke={isFocus ? "#bef264" : isCenter ? "#ffffff" : isDark ? "rgba(255,255,255,0.9)" : "rgba(20,20,30,0.6)"}
                  strokeWidth={isFocus ? 3 : isCenter ? 3 : 1.5}
                />



                {showLabel && !isCenter && (
                  <text
                    x={p.x}
                    y={p.y + baseR + 16}
                    textAnchor="middle"
                    fontSize={isFocus ? 12 : 10}
                    fontWeight={isFocus ? 700 : 500}
                    fill={labelFill}
                    fontFamily="var(--font-display)"
                    fontStyle="italic"
                    style={{ pointerEvents: "none" }}
                  >
                    {n.name.split(" ")[0]}
                  </text>
                )}
              </motion.g>
            </motion.g>
          );
        })}

        {/* Doodle annotations — "you", "high match" */}
        {center && positions.get(center.id) && (() => {
          const p = positions.get(center.id)!;
          return (
            <g fontFamily="var(--font-display)" fontStyle="italic" fill={doodleStroke}>
              <path
                d={`M ${p.x + 50} ${p.y - 38} q -15 -4 -28 8`}
                stroke={doodleStroke}
                strokeWidth={1.2}
                fill="none"
                strokeLinecap="round"
                markerEnd="url(#ng-arrow)"
              />
              <text x={p.x + 52} y={p.y - 42} fontSize={13} fontWeight={600}>you</text>
            </g>
          );
        })()}
        {topMatch && positions.get(topMatch.id) && topMatch.match > 0.3 && (() => {
          const p = positions.get(topMatch.id)!;
          const flipX = p.x > W * 0.6;
          const dx = flipX ? -56 : 56;
          const anchor = flipX ? "end" : "start";
          return (
            <g fontFamily="var(--font-display)" fontStyle="italic" fill={doodleStroke}>
              <path
                d={`M ${p.x + dx} ${p.y - 32} q ${flipX ? 18 : -18} -6 ${flipX ? 30 : -30} 6`}
                stroke={doodleStroke}
                strokeWidth={1.2}
                fill="none"
                strokeLinecap="round"
                markerEnd="url(#ng-arrow)"
              />
              <text x={p.x + dx} y={p.y - 38} fontSize={12} textAnchor={anchor}>
                high match ✺
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Legend chip */}
      {(scale === "room" || scale === "personal") && (
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[60%] pointer-events-none">
          {CLUSTERS.filter((c) => enriched.some((n) => n.cluster === c.id)).slice(0, 4).map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-display italic tracking-tight normal-case bg-background/70 backdrop-blur-md ring-1 ring-border"
            >
              <span className="size-2 rounded-full" style={{ background: c.color }} />
              <span className="text-foreground/70">{c.id}</span>
            </div>
          ))}
        </div>
      )}

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
              <img
                src={avatarUrl(avatarFor(focusedPerson), 96)}
                alt={focusedPerson.name}
                className="size-12 rounded-2xl shrink-0 ring-2 ring-white/40"
                style={{ background: focusedPerson.color, boxShadow: `0 0 18px ${focusedPerson.color}88` }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-extrabold text-sm tracking-tight">{focusedPerson.name}</div>
                  <div className="text-[9px] font-display italic tracking-tight normal-case text-foreground/40">
                    {focusedEdges.length} tap{focusedEdges.length === 1 ? "" : "s"}
                  </div>
                  {centerId && focusedPerson.id !== centerId && (
                    <div
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: `${focusedPerson.color}22`,
                        color: focusedPerson.color,
                      }}
                    >
                      {Math.round(focusedPerson.match * 100)}% match
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-foreground/60 leading-snug mt-0.5 line-clamp-2">{focusedPerson.oneLiner}</div>
                <div className="flex gap-1 flex-wrap mt-1.5">
                  {focusedPerson.tags.slice(0, 4).map((t) => (
                    <span key={t} className="text-[9px] font-display italic tracking-tight normal-case bg-foreground/5 text-foreground/60 px-1.5 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {interactive && !focus && (
        <div className="absolute top-3 right-3 px-2.5 py-1 bg-background/80 backdrop-blur-md rounded-full text-[9px] font-display italic font-bold uppercase tracking-widest text-foreground/60 ring-1 ring-border pointer-events-none">
          Tap a node
        </div>
      )}
    </div>
  );
}
