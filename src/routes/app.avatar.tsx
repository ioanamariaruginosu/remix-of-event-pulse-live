import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { people } from "@/data/event";
import {
  AVATAR_STYLES,
  avatarUrl,
  defaultAvatarFor,
  setUserAvatar,
  useUserAvatar,
  type AvatarStyleId,
} from "@/data/avatars";

export const Route = createFileRoute("/app/avatar")({
  head: () => ({ meta: [{ title: "Your avatar — synqmap" }] }),
  component: AvatarStudio,
});

const BG_PALETTE = [
  "7c3aed", "a78bfa", "22d3ee", "bef264", "ff5e7e", "f472b6",
  "fbbf24", "34d399", "60a5fa", "facc15", "fb7185", "0f172a",
  "ffffff", "111111",
];

function AvatarStudio() {
  const navigate = useNavigate();
  const you = people[0];
  const existing = useUserAvatar();
  const initial = existing ?? defaultAvatarFor(you);

  const [style, setStyle] = useState<AvatarStyleId>(initial.style);
  const [seed, setSeed] = useState(initial.seed);
  const [bg, setBg] = useState(initial.bg);

  useEffect(() => {
    if (existing) {
      setStyle(existing.style);
      setSeed(existing.seed);
      setBg(existing.bg);
    }
  }, [existing]);

  const cfg = { style, seed, bg };
  const url = avatarUrl(cfg, 320);

  function shuffle() {
    setSeed(Math.random().toString(36).slice(2, 10));
  }

  function save() {
    setUserAvatar(cfg);
    navigate({ to: "/app" });
  }

  return (
    <div className="px-5 pt-6 space-y-6 pb-10">
      <div>
        <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest">
          Made your face yet?
        </div>
        <h1 className="font-extrabold text-2xl tracking-tight">Avatar studio</h1>
        <p className="text-xs text-foreground/50 mt-1 leading-relaxed">
          Pick a style, roll the seed, swap the background. Your avatar shows up on your card, in
          the room graph, and on the map at the end of the day.
        </p>
      </div>

      {/* Preview */}
      <div className="relative rounded-3xl bg-foreground p-6 overflow-hidden">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(217,249,157,0.25), transparent 50%), radial-gradient(circle at 80% 80%, rgba(124,58,237,0.35), transparent 50%)",
          }}
        />
        <div className="relative flex flex-col items-center gap-4">
          <motion.img
            key={`${style}-${seed}-${bg}`}
            src={url}
            alt="Avatar preview"
            initial={{ scale: 0.9, opacity: 0, rotate: -4 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="size-48 rounded-full ring-4 ring-white/15"
            style={{ background: `#${bg}` }}
          />
          <div className="text-center text-white">
            <div className="font-extrabold text-lg tracking-tight">{you.name}</div>
            <div className="font-display italic text-[10px] uppercase tracking-widest text-white/40">
              {AVATAR_STYLES.find((s) => s.id === style)?.label} · seed “{seed}”
            </div>
          </div>
          <button
            onClick={shuffle}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold uppercase tracking-widest transition flex items-center gap-2"
          >
            <span className="text-base">⟳</span> Roll a new face
          </button>
        </div>
      </div>

      {/* Style picker */}
      <section>
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest">
            Style
          </div>
          <div className="text-[10px] font-display italic text-foreground/30">
            {AVATAR_STYLES.find((s) => s.id === style)?.vibe}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {AVATAR_STYLES.map((s) => {
            const active = s.id === style;
            const previewUrl = avatarUrl({ style: s.id, seed, bg }, 96);
            return (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`group relative aspect-square rounded-2xl overflow-hidden ring-2 transition ${
                  active ? "ring-primary" : "ring-border hover:ring-foreground/30"
                }`}
                style={{ background: `#${bg}` }}
                aria-label={s.label}
              >
                <img src={previewUrl} alt={s.label} className="w-full h-full" loading="lazy" />
                <div className="absolute inset-x-0 bottom-0 px-1 py-0.5 bg-black/60 text-white text-[8px] font-bold uppercase tracking-widest text-center">
                  {s.label}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Background */}
      <section>
        <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest mb-2">
          Background
        </div>
        <div className="flex flex-wrap gap-2">
          {BG_PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setBg(c)}
              className={`size-9 rounded-full ring-2 transition ${
                bg === c ? "ring-primary scale-110" : "ring-border hover:ring-foreground/30"
              }`}
              style={{ background: `#${c}` }}
              aria-label={`Background #${c}`}
            />
          ))}
          <label className="size-9 rounded-full ring-2 ring-border grid place-items-center cursor-pointer hover:ring-foreground/30 transition text-foreground/40 text-xs">
            +
            <input
              type="color"
              className="sr-only"
              value={`#${bg}`}
              onChange={(e) => setBg(e.target.value.replace("#", ""))}
            />
          </label>
        </div>
      </section>

      {/* Seed text */}
      <section>
        <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest mb-2">
          Seed (any word — your name, a vibe, a meme)
        </div>
        <input
          value={seed}
          onChange={(e) => setSeed(e.target.value.slice(0, 40))}
          className="w-full px-4 py-3 rounded-xl bg-foreground/5 border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
        />
      </section>

      <div className="flex gap-2 pt-2">
        <button
          onClick={() => navigate({ to: "/app" })}
          className="flex-1 py-3 rounded-xl bg-foreground/5 text-foreground/70 font-bold text-sm"
        >
          Cancel
        </button>
        <button
          onClick={save}
          className="flex-[2] py-3 rounded-xl bg-primary text-white font-bold text-sm"
        >
          Save my face
        </button>
      </div>
    </div>
  );
}
