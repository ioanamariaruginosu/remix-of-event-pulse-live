export type Room = {
  id: string;
  name: string;
  kind: "session" | "social";
  capacity: number;
  current: number;
};

export type Session = {
  id: string;
  roomId: string;
  title: string;
  speaker: string;
  speakerRole: string;
  time: string;
  abstract: string;
  topics: string[];
};

export type Person = {
  id: string;
  name: string;
  initials: string;
  oneLiner: string;
  intent: string;
  tags: string[];
  socials: { linkedin?: string; x?: string; github?: string; email?: string };
  roomId?: string;
  color: string;
};

export const event = {
  name: "Eurhack 2026",
  dates: "May 22–24, 2026 · Berlin",
  attendees: 1242,
  online: 842,
};

export const rooms: Room[] = [
  { id: "main", name: "Main Stage", kind: "session", capacity: 400, current: 312 },
  { id: "track-a", name: "Track A", kind: "session", capacity: 120, current: 88 },
  { id: "track-b", name: "Track B", kind: "session", capacity: 120, current: 64 },
  { id: "atrium", name: "The Atrium", kind: "social", capacity: 200, current: 174 },
  { id: "coffee", name: "Coffee Bar", kind: "social", capacity: 80, current: 52 },
  { id: "lounge", name: "Founder Lounge", kind: "social", capacity: 60, current: 41 },
];

export const sessions: Session[] = [
  {
    id: "s1",
    roomId: "main",
    title: "The Mesh Decade: Local-first networks",
    speaker: "Lena Smith",
    speakerRole: "Partner, Proto Ventures",
    time: "10:00 — 10:45",
    abstract: "Why the next generation of social infrastructure runs at the edge.",
    topics: ["local-first", "p2p", "infra"],
  },
  {
    id: "s2",
    roomId: "track-a",
    title: "Agent evals in production",
    speaker: "Maya Singh",
    speakerRole: "Staff ML, Northbeam",
    time: "11:00 — 11:45",
    abstract: "Building evaluation harnesses that actually catch regressions.",
    topics: ["llm", "evals", "agents"],
  },
  {
    id: "s3",
    roomId: "track-b",
    title: "Designing for spatial audiences",
    speaker: "Kaelen Moore",
    speakerRole: "Design Lead, Field",
    time: "11:30 — 12:15",
    abstract: "When the room is the canvas, layout is choreography.",
    topics: ["design", "spatial", "ux"],
  },
  {
    id: "s4",
    roomId: "main",
    title: "Funding the unsexy",
    speaker: "Marcus Vento",
    speakerRole: "GP, Quay Capital",
    time: "14:00 — 14:45",
    abstract: "A panel on backing infra that compounds.",
    topics: ["funding", "infra", "panel"],
  },
  {
    id: "s5",
    roomId: "track-a",
    title: "Workshop: Live transcript graphs",
    speaker: "Nico Park",
    speakerRole: "Founder, Tracegraph",
    time: "15:00 — 16:00",
    abstract: "Hands-on with Whisper + force-directed clustering.",
    topics: ["whisper", "graphs", "workshop"],
  },
  {
    id: "s6",
    roomId: "track-b",
    title: "Hardware demos: badges & beacons",
    speaker: "Sarah Chen",
    speakerRole: "Hardware Hacker",
    time: "16:30 — 17:15",
    abstract: "BLE meshes, e-ink badges, and the future of physical UX.",
    topics: ["hardware", "ble", "badges"],
  },
];

const palette = [
  "#7c3aed", "#d9f99d", "#f472b6", "#22d3ee", "#fbbf24", "#34d399",
  "#a78bfa", "#fb7185", "#60a5fa", "#facc15", "#4ade80", "#f97316",
];

const peopleSeed: Omit<Person, "color">[] = [
  { id: "you", name: "You", initials: "YO", oneLiner: "Building something at the edge of design & ML.", intent: "Looking for: a co-founder for a research-heavy startup", tags: ["design", "ml", "berlin"], socials: { linkedin: "/in/you", x: "@you" }, roomId: "track-a" },
  { id: "p2", name: "Maya Singh", initials: "MS", oneLiner: "Staff ML at Northbeam. Building agent evals.", intent: "Looking for: ex-FAANG infra hires", tags: ["llm", "evals", "ml"], socials: { linkedin: "/in/maya", github: "maya" }, roomId: "track-a" },
  { id: "p3", name: "Sam Okafor", initials: "SO", oneLiner: "Cofounder at Tracegraph. Indie hacker.", intent: "Looking for: design feedback on launch deck", tags: ["graphs", "founders", "design"], socials: { x: "@samok", github: "samok" }, roomId: "track-a" },
  { id: "p4", name: "Lena Smith", initials: "LS", oneLiner: "Partner at Proto. Writes about local-first.", intent: "Looking for: seed-stage infra teams", tags: ["vc", "infra", "writing"], socials: { linkedin: "/in/lena", x: "@lenas" }, roomId: "main" },
  { id: "p5", name: "Kaelen Moore", initials: "KM", oneLiner: "Design lead at Field. Loves spatial UX.", intent: "Open to: collabs on physical/digital products", tags: ["design", "spatial", "ux"], socials: { linkedin: "/in/kaelen" }, roomId: "track-b" },
  { id: "p6", name: "Nico Park", initials: "NP", oneLiner: "Building Tracegraph. Whisper + graphs.", intent: "Looking for: pilot customers in events", tags: ["whisper", "graphs", "founders"], socials: { github: "nicopark" }, roomId: "track-a" },
  { id: "p7", name: "Sarah Chen", initials: "SC", oneLiner: "Hardware hacker. BLE & e-ink badges.", intent: "Looking for: industrial designers", tags: ["hardware", "ble", "badges"], socials: { github: "sarahc", x: "@sarahc" }, roomId: "track-b" },
  { id: "p8", name: "Marcus Vento", initials: "MV", oneLiner: "GP at Quay Capital. Infra-first investor.", intent: "Looking for: technical founders", tags: ["vc", "infra"], socials: { linkedin: "/in/marcus" }, roomId: "main" },
  { id: "p9", name: "Jordan Dane", initials: "JD", oneLiner: "Architect turned product designer.", intent: "Open to: side projects with physical components", tags: ["architecture", "design"], socials: { linkedin: "/in/jordan" }, roomId: "atrium" },
  { id: "p10", name: "Iris Volkov", initials: "IV", oneLiner: "Researcher, multi-agent systems.", intent: "Looking for: deployment war stories", tags: ["agents", "research"], socials: { github: "irisv" }, roomId: "track-a" },
  { id: "p11", name: "Tomás Reyes", initials: "TR", oneLiner: "DevRel at a graph database co.", intent: "Open to: technical writers", tags: ["devrel", "graphs"], socials: { x: "@tomr" }, roomId: "atrium" },
  { id: "p12", name: "Priya Anand", initials: "PA", oneLiner: "Founder, voice-first journaling app.", intent: "Looking for: ML eng to join 3-person team", tags: ["voice", "founders"], socials: { linkedin: "/in/priya" }, roomId: "coffee" },
  { id: "p13", name: "Yuki Tan", initials: "YT", oneLiner: "Ex-Stripe infra. Now consulting.", intent: "Open to: short engagements", tags: ["infra", "consulting"], socials: { linkedin: "/in/yuki" }, roomId: "lounge" },
  { id: "p14", name: "Olu Adeyemi", initials: "OA", oneLiner: "Building dev tools for prompts.", intent: "Looking for: design partners", tags: ["devtools", "llm"], socials: { github: "olua" }, roomId: "track-a" },
  { id: "p15", name: "Alex Rivera", initials: "AR", oneLiner: "Creative tech. WebGL & shaders.", intent: "Open to: art collabs", tags: ["webgl", "creative"], socials: { x: "@alexr" }, roomId: "atrium" },
  { id: "p16", name: "Hana Park", initials: "HP", oneLiner: "PM at a productivity startup.", intent: "Looking for: design feedback", tags: ["pm", "design"], socials: { linkedin: "/in/hana" }, roomId: "main" },
  { id: "p17", name: "Felix Wagner", initials: "FW", oneLiner: "Embedded systems & robotics.", intent: "Looking for: ML eng for perception", tags: ["hardware", "robotics"], socials: { github: "felixw" }, roomId: "track-b" },
  { id: "p18", name: "Zara Khan", initials: "ZK", oneLiner: "Product designer, ex-Linear.", intent: "Open to: advisory", tags: ["design", "product"], socials: { linkedin: "/in/zara" }, roomId: "lounge" },
  { id: "p19", name: "Mateo Silva", initials: "MS", oneLiner: "Indie game dev exploring AI NPCs.", intent: "Looking for: writers", tags: ["games", "llm"], socials: { x: "@mateos" }, roomId: "coffee" },
  { id: "p20", name: "Eli Bauer", initials: "EB", oneLiner: "Backend eng, payments.", intent: "Open to: founding-team roles", tags: ["backend", "fintech"], socials: { github: "elib" }, roomId: "main" },
  { id: "p21", name: "Naomi Cole", initials: "NC", oneLiner: "Researcher, swarm robotics.", intent: "Looking for: industry collaborators", tags: ["research", "robotics"], socials: { linkedin: "/in/naomi" }, roomId: "track-b" },
  { id: "p22", name: "Ravi Mehta", initials: "RM", oneLiner: "Solo founder, AI bookkeeping.", intent: "Looking for: GTM advisors", tags: ["founders", "fintech"], socials: { linkedin: "/in/ravi" }, roomId: "lounge" },
];

export const people: Person[] = peopleSeed.map((p, i) => ({ ...p, color: palette[i % palette.length] }));

// Graph: edges = exchanged identity cards (people-people)
export const edges: { source: string; target: string; reason: string }[] = [
  { source: "you", target: "p2", reason: "Both care about evals + live in Berlin" },
  { source: "you", target: "p5", reason: "Overlap on spatial / design topics" },
  { source: "you", target: "p11", reason: "Both follow graph systems" },
  { source: "p2", target: "p3", reason: "Graphs + evals" },
  { source: "p2", target: "p10", reason: "Multi-agent research" },
  { source: "p3", target: "p6", reason: "Tracegraph cofounders' circle" },
  { source: "p4", target: "p8", reason: "Investor coffee" },
  { source: "p4", target: "p13", reason: "Infra perspective" },
  { source: "p5", target: "p9", reason: "Architecture + design" },
  { source: "p5", target: "p18", reason: "Design lineage" },
  { source: "p7", target: "p17", reason: "Hardware row" },
  { source: "p7", target: "p21", reason: "BLE x robotics" },
  { source: "p6", target: "p14", reason: "Devtools meets graphs" },
  { source: "p12", target: "p19", reason: "Voice & games" },
  { source: "p13", target: "p20", reason: "Backend coffee" },
  { source: "p11", target: "p15", reason: "Creative tech" },
  { source: "p15", target: "p9", reason: "Atrium chat" },
  { source: "p16", target: "p18", reason: "Product / design" },
  { source: "p22", target: "p13", reason: "Lounge advisor intro" },
  { source: "p10", target: "p14", reason: "Agents talk" },
  { source: "p17", target: "p21", reason: "Robotics meet" },
  { source: "p2", target: "p6", reason: "Whisper + evals" },
];

export const suggestions = {
  closestMatch: "p10", // Iris — agents research
  bridgePerson: "p3",  // Sam — connects you to the founder cluster
  blindSpotCluster: "Hardware row (Sarah, Felix, Naomi)",
};

export const tickerEvents: string[] = [
  "842 CONNECTIONS MADE",
  "NEW ROOM: STAGE A (52 PEOPLE)",
  "+500 XP EARNED BY @NICO",
  "MAYA ↔ ELI EXCHANGED CARDS",
  "TOPIC SPIKE: EVALS (+38%)",
  "BRIEF GENERATED: MESH DECADE",
  "1,242 ATTENDEES ONLINE",
  "QUEST UNLOCKED: HARDWARE ROW",
];

export const sessionBrief = {
  sessionId: "s1",
  title: "The Mesh Decade: Local-first networks",
  speaker: "Lena Smith",
  room: "Main Stage",
  duration: "45 min",
  takeaways: [
    "Local-first ≠ offline-first — it's a posture about data ownership and conflict resolution.",
    "CRDTs unlock collaboration without coordination; the costs show up in storage, not latency.",
    "The next decade's social products will be small networks that compose, not platforms that scale.",
  ],
  questions: [
    "How do you handle eventual consistency in a UI without confusing users?",
    "What's the right pricing model when there's no central server?",
    "Who pays for the relay infra in a p2p mesh?",
  ],
  whoSpokeUp: ["Maya Singh", "Eli Bauer", "Marcus Vento"],
  matchedFromTalk: ["p4", "p20"],
};
