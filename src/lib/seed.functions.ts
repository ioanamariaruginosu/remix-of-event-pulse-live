import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Hardcoded START Summit dataset built from the uploaded transcript files.
// One-shot: if the event already exists for this owner, it returns it.
const ROOMS = [
  { name: "Main Stage", kind: "session", capacity: 600 },
  { name: "Founders Stage", kind: "session", capacity: 200 },
  { name: "Workshop Room", kind: "session", capacity: 80 },
  { name: "The Atrium", kind: "social", capacity: 300 },
  { name: "Coffee Bar", kind: "social", capacity: 100 },
];

const SESSIONS: Array<{
  title: string;
  speaker: string;
  speaker_role: string;
  time_label: string;
  abstract: string;
  topics: string[];
  roomIdx: number;
}> = [
  {
    title: "The Alpine Innovation Arc",
    speaker: "Michael Hengartner",
    speaker_role: "President, ETH Board",
    time_label: "Day 2 · 09:00",
    abstract:
      "Switzerland's innovation landscape — research, global collaboration, and an ecosystem that supports startups across the Alpine arc.",
    topics: ["innovation", "research", "entrepreneurship", "venture-capital"],
    roomIdx: 0,
  },
  {
    title: "The Deal You Don't See",
    speaker: "Alex Stöckl, Fabian Gruner, Robert Jäckle, Sia Houchangnia",
    speaker_role: "Founderful · HV · Visionaries · Seedcamp",
    time_label: "Day 2 · 10:30",
    abstract:
      "How VCs find — and lose — the most promising deals. Strategy, deal flow, and the discipline of missed opportunities.",
    topics: ["venture-capital", "deal-flow", "seed", "growth"],
    roomIdx: 0,
  },
  {
    title: "Zero to One: How to Actually Start Building Today",
    speaker: "Petter Made",
    speaker_role: "Co-founder, SumUp",
    time_label: "Day 2 · 12:30",
    abstract:
      "AI has crushed the barrier to starting. Taste and judgement are the new bottleneck — find the problem, build, iterate, ship.",
    topics: ["ai-startups", "mvp", "founder-mindset", "rapid-iteration"],
    roomIdx: 1,
  },
  {
    title: "State of the Ecosystem: Germany vs Switzerland",
    speaker: "Verena Pausder, Sylvie Mutschler",
    speaker_role: "Startupverband · Mutschler Ventures",
    time_label: "Day 1 · 11:00",
    abstract:
      "Two ecosystems compared — deep tech, resilience, bureaucracy, and the case for European collaboration.",
    topics: ["ecosystem", "deep-tech", "european-startups"],
    roomIdx: 0,
  },
  {
    title: "Switzerland's First Unicorn: From HSG to $1B ARR",
    speaker: "Moritz Zimmermann",
    speaker_role: "Co-founder, Hybris · 42CAP",
    time_label: "Day 1 · 14:30",
    abstract:
      "Hybris's journey from 1997 to a billion in ARR — grit, team loyalty, supportive investors, transparent communication.",
    topics: ["entrepreneurship", "ecommerce", "leadership", "grit"],
    roomIdx: 0,
  },
  {
    title: "The Next Decade Won't Wait",
    speaker: "Philipp Schröder, Florian Schweitzer",
    speaker_role: "1KOMMA5° · b2venture",
    time_label: "Day 1 · 16:00",
    abstract:
      "Scaling renewable energy and automating the industry. AI-driven optimisation, EVs, and the case for controlling the value chain.",
    topics: ["renewable-energy", "ai-optimization", "clean-tech"],
    roomIdx: 1,
  },
  {
    title: "VC Stands for Vibes and Coffee",
    speaker: "Alexander Schmitt, Luca Eisenstecken, Christian Miele",
    speaker_role: "Lightspeed · Atomico · Headline",
    time_label: "Day 1 · 17:00",
    abstract:
      "Pattern recognition vs gut feeling in early-stage investing. Founder traits, storytelling, and adapting to a changing market.",
    topics: ["venture-capital", "early-stage", "founder-traits"],
    roomIdx: 1,
  },
];

export const seedStartSummit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // If an event with the same name already exists for this owner, return it.
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("owner_id", userId)
      .eq("name", "START Summit 2026")
      .maybeSingle();

    let eventId: string;
    if (existing) {
      eventId = existing.id;
    } else {
      const { data: ev, error } = await supabase
        .from("events")
        .insert({
          owner_id: userId,
          name: "START Summit 2026",
          dates: "Mar 28–29, 2026",
          city: "St. Gallen",
          description: "Europe's leading student-led conference on entrepreneurship and tech.",
          cover_gradient: "linear-gradient(135deg,#7c3aed,#22d3ee)",
          is_live: true,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      eventId = ev.id;
    }

    // Rooms: insert any missing by name.
    const { data: existingRooms } = await supabase
      .from("rooms")
      .select("id, name")
      .eq("event_id", eventId);
    const existingNames = new Set((existingRooms ?? []).map((r) => r.name));
    const toInsertRooms = ROOMS.filter((r) => !existingNames.has(r.name)).map((r) => ({
      ...r,
      event_id: eventId,
    }));
    if (toInsertRooms.length) {
      const { error } = await supabase.from("rooms").insert(toInsertRooms);
      if (error) throw new Error(error.message);
    }

    const { data: allRooms } = await supabase
      .from("rooms")
      .select("id, name")
      .eq("event_id", eventId);
    const roomByName = new Map((allRooms ?? []).map((r) => [r.name, r.id as string]));

    // Sessions: insert any missing by title.
    const { data: existingSessions } = await supabase
      .from("sessions")
      .select("title")
      .eq("event_id", eventId);
    const existingTitles = new Set((existingSessions ?? []).map((s) => s.title));
    const toInsertSessions = SESSIONS.filter((s) => !existingTitles.has(s.title)).map((s) => ({
      event_id: eventId,
      room_id: roomByName.get(ROOMS[s.roomIdx].name) ?? null,
      title: s.title,
      speaker: s.speaker,
      speaker_role: s.speaker_role,
      time_label: s.time_label,
      abstract: s.abstract,
      topics: s.topics,
    }));
    if (toInsertSessions.length) {
      const { error } = await supabase.from("sessions").insert(toInsertSessions);
      if (error) throw new Error(error.message);
    }

    return { eventId, inserted: { rooms: toInsertRooms.length, sessions: toInsertSessions.length } };
  });