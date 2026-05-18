import { useEffect, useRef, useState } from "react";

type Photo = { id: string; src: string; ts: number };

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

// Downscale to keep localStorage small
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

export function RoomPhotos({ roomId }: { roomId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [viewer, setViewer] = useState<Photo | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPhotos(load(roomId));
  }, [roomId]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      const added: Photo[] = [];
      for (const f of files) {
        const src = await compress(f);
        added.push({ id: crypto.randomUUID(), src, ts: Date.now() });
      }
      const next = [...added, ...photos];
      setPhotos(next);
      save(roomId, next);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(id: string) {
    const next = photos.filter((p) => p.id !== id);
    setPhotos(next);
    save(roomId, next);
    setViewer(null);
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest">
            Photos from this room
          </div>
          <div className="text-[10px] text-foreground/40 mt-0.5">
            {photos.length} {photos.length === 1 ? "photo" : "photos"}
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

      {photos.length === 0 ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full aspect-[2/1] rounded-2xl ring-1 ring-dashed ring-border text-foreground/40 text-xs flex flex-col items-center justify-center gap-1 hover:ring-foreground/40 hover:text-foreground/60 transition"
        >
          <span className="text-2xl leading-none">＋</span>
          <span>Tap to add the first photo</span>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((p) => (
            <button
              key={p.id}
              onClick={() => setViewer(p)}
              className="aspect-square rounded-lg overflow-hidden bg-foreground/5"
            >
              <img src={p.src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {viewer && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          onClick={() => setViewer(null)}
        >
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={viewer.src} alt="" className="max-w-full max-h-full object-contain" />
          </div>
          <div className="p-5 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setViewer(null)}
              className="text-white/70 text-xs font-bold uppercase tracking-widest"
            >
              Close
            </button>
            <button
              onClick={() => remove(viewer.id)}
              className="text-red-400 text-xs font-bold uppercase tracking-widest"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
