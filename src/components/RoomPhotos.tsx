import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { people } from "@/data/event";
import { Avatar } from "@/components/Avatar";

type Photo = { id: string; src: string; ts: number; uploaderId: string };

const key = (roomId: string) => `room-photos:${roomId}`;

function load(roomId: string): Photo[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key(roomId)) || "[]");
  } catch {
    return [];
  }
}

function save(roomId: string, photos: Photo[]) {
  try {
    localStorage.setItem(key(roomId), JSON.stringify(photos));
  } catch {
    /* quota — ignore */
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function compress(file: File, max = 1280, quality = 0.8): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  const img = new Image();
  img.src = dataUrl;
  await new Promise((r) => (img.onload = r));
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return c.toDataURL("image/jpeg", quality);
}

// Deterministic seed photos so every room has a believable stack.
// Uses picsum.photos with stable seeds (no API key).
function seedPhotos(roomId: string): Photo[] {
  const others = people.filter((p) => p.id !== "you");
  // hash roomId → consistent picks
  let h = 0;
  for (let i = 0; i < roomId.length; i++) h = (h * 31 + roomId.charCodeAt(i)) >>> 0;
  const count = 5 + (h % 3); // 5–7 photos
  const seeds = Array.from({ length: count }, (_, i) => `${roomId}-${i}`);
  return seeds.map((s, i) => {
    const uploader = others[(h + i * 7) % others.length];
    return {
      id: `seed-${roomId}-${i}`,
      src: `https://picsum.photos/seed/${encodeURIComponent(s)}/900/1200`,
      ts: Date.now() - (i + 1) * 1000 * 60 * (5 + (h % 30)),
      uploaderId: uploader.id,
    };
  });
}

export function RoomPhotos({ roomId }: { roomId: string }) {
  const [uploaded, setUploaded] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const seeds = useMemo(() => seedPhotos(roomId), [roomId]);
  const photos = useMemo(() => [...uploaded, ...seeds], [uploaded, seeds]);

  useEffect(() => {
    setUploaded(load(roomId));
    setIndex(0);
  }, [roomId]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      const added: Photo[] = [];
      for (const f of files) {
        const src = await compress(f);
        added.push({ id: crypto.randomUUID(), src, ts: Date.now(), uploaderId: "you" });
      }
      const next = [...added, ...uploaded];
      setUploaded(next);
      save(roomId, next);
      setIndex(0);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const advance = () => setIndex((i) => (i + 1) % photos.length);
  const back = () => setIndex((i) => (i - 1 + photos.length) % photos.length);

  // Top card drag
  const x = useMotionValue(0);
  const rot = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const opacity = useTransform(x, [-220, -120, 0, 120, 220], [0, 1, 1, 1, 0]);

  // Render the next 3 cards stacked (visual depth)
  const stack = useMemo(() => {
    const out: { photo: Photo; depth: number }[] = [];
    for (let d = 0; d < Math.min(3, photos.length); d++) {
      out.push({ photo: photos[(index + d) % photos.length], depth: d });
    }
    return out.reverse(); // back-most first so top card is last in DOM
  }, [photos, index]);

  return (
    <div>
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest">
            Photos from this room
          </div>
          <div className="text-[10px] text-foreground/40 mt-0.5">
            {photos.length} {photos.length === 1 ? "photo" : "photos"} · swipe to browse
          </div>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="px-3 py-1.5 rounded-full bg-foreground text-white text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
        >
          {busy ? "Uploading…" : "+ Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={onPick}
          className="hidden"
        />
      </div>

      <div
        className="relative w-full mx-auto"
        style={{ maxWidth: 360, height: 460 }}
      >
        {stack.map(({ photo, depth }) => {
          const isTop = depth === 0;
          const uploader = people.find((p) => p.id === photo.uploaderId);
          return isTop ? (
            <motion.div
              key={photo.id}
              className="absolute inset-0 rounded-3xl overflow-hidden ring-1 ring-border bg-foreground shadow-2xl cursor-grab active:cursor-grabbing"
              style={{ x, rotate: rot, opacity, zIndex: 10 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                if (info.offset.x < -100 || info.velocity.x < -400) {
                  // swipe left → next
                  x.set(0);
                  advance();
                } else if (info.offset.x > 100 || info.velocity.x > 400) {
                  x.set(0);
                  back();
                } else {
                  x.set(0);
                }
              }}
              whileTap={{ scale: 0.98 }}
            >
              <PhotoCard photo={photo} uploader={uploader} />
            </motion.div>
          ) : (
            <motion.div
              key={photo.id}
              className="absolute inset-0 rounded-3xl overflow-hidden ring-1 ring-border bg-foreground shadow-xl"
              initial={false}
              animate={{
                scale: 1 - depth * 0.05,
                y: depth * 10,
                opacity: 1 - depth * 0.25,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              style={{ zIndex: 10 - depth }}
            >
              <PhotoCard photo={photo} uploader={uploader} dim />
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-3 mt-4">
        <button
          onClick={back}
          className="size-9 rounded-full ring-1 ring-border grid place-items-center hover:bg-foreground/5"
          aria-label="Previous"
        >
          ‹
        </button>
        <div className="text-[10px] font-display italic text-foreground/40 tabular-nums">
          {index + 1} / {photos.length}
        </div>
        <button
          onClick={advance}
          className="size-9 rounded-full ring-1 ring-border grid place-items-center hover:bg-foreground/5"
          aria-label="Next"
        >
          ›
        </button>
      </div>
    </div>
  );
}

function PhotoCard({
  photo,
  uploader,
  dim = false,
}: {
  photo: Photo;
  uploader?: { id: string; color: string; initials: string; name: string };
  dim?: boolean;
}) {
  return (
    <div className="relative w-full h-full">
      <img
        src={photo.src}
        alt=""
        draggable={false}
        className="w-full h-full object-cover select-none pointer-events-none"
      />
      {dim && <div className="absolute inset-0 bg-foreground/20" />}
      <div className="absolute inset-x-0 bottom-0 p-4 pt-12 bg-gradient-to-t from-black/70 to-transparent text-white flex items-center gap-2">
        {uploader && <Avatar person={uploader} size={28} ring />}
        <div className="min-w-0">
          <div className="text-xs font-bold truncate">{uploader?.name ?? "Anonymous"}</div>
          <div className="text-[10px] font-display italic text-white/60">{timeAgo(photo.ts)}</div>
        </div>
      </div>
    </div>
  );
}

function timeAgo(t: number) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
