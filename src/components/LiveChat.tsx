import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { people } from "@/data/event";
import { Avatar } from "@/components/Avatar";

type Msg = {
  id: string;
  roomId: string;
  authorId: string;
  text: string;
  ts: number;
};

const key = (roomId: string) => `room-chat:${roomId}`;

function load(roomId: string): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key(roomId)) || "[]");
  } catch {
    return [];
  }
}

function save(roomId: string, msgs: Msg[]) {
  try {
    localStorage.setItem(key(roomId), JSON.stringify(msgs.slice(-50)));
  } catch {
    /* ignore */
  }
}

// Pool of believable live-event reactions
const AMBIENT_LINES = [
  "🔥🔥🔥",
  "this slide is gold",
  "wait, the eval numbers??",
  "+1 to local-first",
  "can someone share the deck?",
  "anyone here from rotterdam?",
  "queue for coffee is wild",
  "great question 👏",
  "lol same",
  "this is the talk of the day",
  "spicy take 👀",
  "agree but also… benchmarks?",
  "rt this whole section",
  "is the recording gonna be up?",
  "im in row 3 if anyone wants to say hi",
  "btw the wifi is `synq-guest` / nfc2024",
  "demo gods are on his side today",
  "okay this changes things",
  "💯",
  "hot take incoming",
  "the chart at 14:02 broke my brain",
  "we need a part 2",
  "side room has snacks btw",
  "calling it: best talk of track A",
  "anybody else taking notes in obsidian?",
];

function pickLine(seed: number) {
  return AMBIENT_LINES[seed % AMBIENT_LINES.length];
}

export function LiveChat({ roomId }: { roomId: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  // attendees in the room (minus you), used as ambient authors
  const roomCrowd = useMemo(
    () => people.filter((p) => p.roomId === roomId && p.id !== "you"),
    [roomId],
  );

  // Load on room change
  useEffect(() => {
    setMsgs(load(roomId));
  }, [roomId]);

  // Persist
  useEffect(() => {
    save(roomId, msgs);
  }, [roomId, msgs]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  // Ambient generator — drops a new message every 5–11s from someone in the room
  useEffect(() => {
    if (roomCrowd.length === 0) return;
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      const author = roomCrowd[Math.floor(Math.random() * roomCrowd.length)];
      const text = pickLine(Math.floor(Math.random() * 9999));
      setMsgs((m) => [
        ...m,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          roomId,
          authorId: author.id,
          text,
          ts: Date.now(),
        },
      ]);
      schedule();
    };
    const schedule = () => {
      const wait = 5000 + Math.random() * 6000;
      timer = setTimeout(tick, wait);
    };
    let timer = setTimeout(tick, 2500);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [roomCrowd, roomId]);

  function send() {
    const text = draft.trim();
    if (!text) return;
    setMsgs((m) => [
      ...m,
      {
        id: `${Date.now()}-me`,
        roomId,
        authorId: "you",
        text,
        ts: Date.now(),
      },
    ]);
    setDraft("");
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest">
            Live chat · this room
          </div>
          <div className="text-[10px] text-foreground/40 mt-0.5 flex items-center gap-1.5">
            <span className="size-1.5 bg-primary rounded-full animate-pulse" />
            {roomCrowd.length} people · drop a thought
          </div>
        </div>
      </div>

      {/* Scrollable full feed */}
      <div
        ref={scrollerRef}
        className="h-48 overflow-y-auto rounded-2xl ring-1 ring-border bg-background p-3 space-y-1.5"
      >
        {msgs.length === 0 && (
          <div className="text-[11px] text-foreground/40 text-center py-12 font-display italic">
            no one's said anything yet… break the ice 👇
          </div>
        )}
        {msgs.map((m) => {
          const author = people.find((p) => p.id === m.authorId);
          const mine = m.authorId === "you";
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2 text-xs ${mine ? "opacity-90" : ""}`}
            >
              {author && <Avatar person={author} size={18} />}
              <div className="min-w-0">
                <span
                  className="font-bold mr-1.5"
                  style={{ color: author?.color }}
                >
                  {author?.name.split(" ")[0] ?? "Anon"}
                </span>
                <span className="text-foreground/80">{m.text}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="mt-2 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          maxLength={200}
          placeholder="say something to the room…"
          className="flex-1 px-4 py-2.5 rounded-full bg-foreground/5 text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          onClick={send}
          disabled={!draft.trim()}
          className="px-4 py-2.5 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-widest disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
