import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { people } from "@/data/event";
import { IdentityCard } from "@/components/IdentityCard";
import { upsertMyProfile } from "@/lib/profile.functions";
import {
  AVATAR_STYLES,
  avatarUrl,
  defaultAvatarFor,
  setUserAvatar,
  useUserAvatar,
  type AvatarStyleId,
} from "@/data/avatars";
import {
  DEFAULT_GRADIENT,
  GRADIENT_PRESETS,
  setUserProfile,
  useUserProfile,
  type ProfileGradient,
} from "@/data/profile";

export const Route = createFileRoute("/app/avatar")({
  head: () => ({ meta: [{ title: "Your profile — synqmap" }] }),
  component: MeStudio,
});

const BG_PALETTE = [
  "7c3aed", "a78bfa", "22d3ee", "bef264", "ff5e7e", "f472b6",
  "fbbf24", "34d399", "60a5fa", "facc15", "fb7185", "0f172a",
  "ffffff", "111111",
];

const TAG_SUGGESTIONS = [
  "design", "ml", "ai", "research", "founders", "vc", "hiring",
  "infra", "hardware", "robotics", "spatial", "evals", "agents",
  "climate", "health", "fintech", "creative-tools", "rotterdam",
];

type Tab = "card" | "avatar" | "profile" | "socials";

function MeStudio() {
  const navigate = useNavigate();
  const upsert = useServerFn(upsertMyProfile);
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const base = people[0];
  const existingAvatar = useUserAvatar();
  const existingProfile = useUserProfile();
  const initialAvatar = existingAvatar ?? defaultAvatarFor(base);

  // Avatar state
  const [style, setStyle] = useState<AvatarStyleId>(initialAvatar.style);
  const [seed, setSeed] = useState(initialAvatar.seed);
  const [bg, setBg] = useState(initialAvatar.bg);

  // Profile state
  const [name, setName] = useState(existingProfile?.name ?? base.name);
  const [oneLiner, setOneLiner] = useState(existingProfile?.oneLiner ?? base.oneLiner);
  const [intent, setIntent] = useState(existingProfile?.intent ?? base.intent);
  const [tags, setTags] = useState<string[]>(existingProfile?.tags ?? base.tags);
  const [tagDraft, setTagDraft] = useState("");
  const [linkedin, setLinkedin] = useState(existingProfile?.socials?.linkedin ?? base.socials.linkedin ?? "");
  const [x, setX] = useState(existingProfile?.socials?.x ?? base.socials.x ?? "");
  const [github, setGithub] = useState(existingProfile?.socials?.github ?? base.socials.github ?? "");
  const [email, setEmail] = useState(existingProfile?.socials?.email ?? base.socials.email ?? "");

  // Gradient
  const [gradient, setGradient] = useState<ProfileGradient>(existingProfile?.gradient ?? DEFAULT_GRADIENT);

  useEffect(() => {
    if (existingAvatar) {
      setStyle(existingAvatar.style);
      setSeed(existingAvatar.seed);
      setBg(existingAvatar.bg);
    }
  }, [existingAvatar]);

  const [tab, setTab] = useState<Tab>("card");

  // Preview person merges live state
  const previewPerson = useMemo(
    () => ({
      ...base,
      name: name.trim() || base.name,
      oneLiner,
      intent,
      tags,
      socials: {
        linkedin: linkedin || undefined,
        x: x || undefined,
        github: github || undefined,
        email: email || undefined,
      },
    }),
    [base, name, oneLiner, intent, tags, linkedin, x, github, email],
  );

  const avatarUrlBig = avatarUrl({ style, seed, bg }, 240);

  function shuffle() {
    setSeed(Math.random().toString(36).slice(2, 10));
  }

  function addTag(raw: string) {
    const t = raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (!t || tags.includes(t) || tags.length >= 8) return;
    setTags([...tags, t]);
  }
  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    const socials = {
      linkedin: linkedin || undefined,
      x: x || undefined,
      github: github || undefined,
      email: email || undefined,
    };
    const finalName = name.trim() || base.name;
    setUserAvatar({ style, seed, bg });
    setUserProfile({ name: finalName, oneLiner, intent, tags, socials, gradient });
    try {
      await upsert({
        data: {
          name: finalName,
          one_liner: oneLiner,
          intent,
          tags,
          socials: Object.fromEntries(
            Object.entries(socials).filter(([, v]) => Boolean(v)),
          ) as Record<string, string>,
        },
      });
      // Force matches to recompute against the new profile.
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      toast.success("Profile saved");
      navigate({ to: "/app" });
    } catch (e) {
      console.error(e);
      toast.error("Couldn't save profile. Are you signed in?");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-5 pt-6 pb-32 space-y-6">
      {/* Header */}
      <div>
        <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest">
          Make it unmistakably you
        </div>
        <h1 className="font-extrabold text-2xl tracking-tight">Your card studio</h1>
        <p className="text-xs text-foreground/50 mt-1 leading-relaxed">
          Tune your card the way someone will remember it after tapping phones with you.
        </p>
      </div>

      {/* Live card preview */}
      <div
        className="relative rounded-3xl p-6 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${gradient.from}22, ${gradient.via}22, ${gradient.to}22)`,
        }}
      >
        <div className="absolute inset-0 bg-foreground/95" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(circle at 20% 20%, ${gradient.from}55, transparent 50%), radial-gradient(circle at 80% 80%, ${gradient.to}55, transparent 50%)`,
          }}
        />
        <div className="relative flex flex-col items-center gap-3">
          <motion.div
            key={`${style}-${seed}-${bg}-${gradient.from}-${gradient.via}-${gradient.to}`}
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <IdentityCard person={previewPerson} serial="001" gradient={gradient} />
          </motion.div>
          <div className="font-display italic text-[10px] uppercase tracking-widest text-white/40">
            Live preview · updates as you edit
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex p-1 rounded-full bg-foreground/5 text-[10px] font-bold uppercase tracking-widest">
        {(["card", "avatar", "profile", "socials"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-full transition ${
              tab === t ? "bg-foreground text-white" : "text-foreground/50 hover:text-foreground/80"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Card → gradients */}
      {tab === "card" && (
        <section className="space-y-4">
          <div>
            <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest mb-2">
              Card gradient
            </div>
            <div className="grid grid-cols-2 gap-2">
              {GRADIENT_PRESETS.map((g) => {
                const active =
                  g.gradient.from === gradient.from &&
                  g.gradient.via === gradient.via &&
                  g.gradient.to === gradient.to;
                return (
                  <button
                    key={g.id}
                    onClick={() => setGradient(g.gradient)}
                    className={`relative h-16 rounded-2xl overflow-hidden ring-2 transition ${
                      active ? "ring-primary" : "ring-border hover:ring-foreground/30"
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${g.gradient.from}, ${g.gradient.via}, ${g.gradient.to})`,
                    }}
                  >
                    <div className="absolute inset-x-0 bottom-0 px-2 py-1 bg-black/40 text-white text-[9px] font-bold uppercase tracking-widest text-left">
                      {g.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest mb-2">
              Mix your own
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["from", "via", "to"] as const).map((k) => (
                <label
                  key={k}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl ring-1 ring-border cursor-pointer"
                >
                  <div
                    className="size-10 rounded-full ring-2 ring-border"
                    style={{ background: gradient[k] }}
                  />
                  <span className="text-[9px] font-display italic uppercase tracking-widest text-foreground/40">
                    {k}
                  </span>
                  <input
                    type="color"
                    className="sr-only"
                    value={gradient[k]}
                    onChange={(e) => setGradient({ ...gradient, [k]: e.target.value })}
                  />
                </label>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Avatar */}
      {tab === "avatar" && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <img
              src={avatarUrlBig}
              alt="Avatar"
              className="size-20 rounded-full ring-2 ring-border"
              style={{ background: `#${bg}` }}
            />
            <button
              onClick={shuffle}
              className="px-3 py-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-[10px] font-bold uppercase tracking-widest transition flex items-center gap-2"
            >
              <span className="text-base">⟳</span> Roll new face
            </button>
          </div>

          <div>
            <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest mb-2">
              Style
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
          </div>

          <div>
            <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest mb-2">
              Avatar background
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
          </div>

          <div>
            <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest mb-2">
              Seed
            </div>
            <input
              value={seed}
              onChange={(e) => setSeed(e.target.value.slice(0, 40))}
              className="w-full px-4 py-3 rounded-xl bg-foreground/5 border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
            />
          </div>
        </section>
      )}

      {/* Profile */}
      {tab === "profile" && (
        <section className="space-y-4">
          <Field label="Display name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 40))}
              className="w-full px-4 py-3 rounded-xl bg-foreground/5 border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </Field>
          <Field label="One-liner" hint="One sentence. Make it stick.">
            <input
              value={oneLiner}
              onChange={(e) => setOneLiner(e.target.value.slice(0, 120))}
              className="w-full px-4 py-3 rounded-xl bg-foreground/5 border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </Field>
          <Field label="Intent" hint="What you're here for, today.">
            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value.slice(0, 200))}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-foreground/5 border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
            />
          </Field>
          <Field label={`Tags · ${tags.length}/8`}>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => (
                <button
                  key={t}
                  onClick={() => removeTag(t)}
                  className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:bg-primary/20"
                >
                  {t} <span className="text-xs leading-none">×</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(tagDraft);
                    setTagDraft("");
                  }
                }}
                placeholder="add a tag, press enter"
                className="flex-1 px-3 py-2 rounded-lg bg-foreground/5 border border-border focus:outline-none focus:ring-2 focus:ring-primary text-xs"
              />
              <button
                onClick={() => { addTag(tagDraft); setTagDraft(""); }}
                className="px-3 py-2 rounded-lg bg-foreground text-white text-[10px] font-bold uppercase tracking-widest"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {TAG_SUGGESTIONS.filter((t) => !tags.includes(t)).slice(0, 10).map((t) => (
                <button
                  key={t}
                  onClick={() => addTag(t)}
                  className="px-2 py-1 rounded-full bg-foreground/5 text-foreground/50 text-[10px] font-bold uppercase tracking-widest hover:text-foreground hover:bg-foreground/10"
                >
                  + {t}
                </button>
              ))}
            </div>
          </Field>
        </section>
      )}

      {/* Socials */}
      {tab === "socials" && (
        <section className="space-y-4">
          <Field label="LinkedIn">
            <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="/in/you"
              className="w-full px-4 py-3 rounded-xl bg-foreground/5 border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
          </Field>
          <Field label="X / Twitter">
            <input value={x} onChange={(e) => setX(e.target.value)} placeholder="@you"
              className="w-full px-4 py-3 rounded-xl bg-foreground/5 border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
          </Field>
          <Field label="GitHub">
            <input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="you"
              className="w-full px-4 py-3 rounded-xl bg-foreground/5 border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
          </Field>
          <Field label="Email">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@domain.com" type="email"
              className="w-full px-4 py-3 rounded-xl bg-foreground/5 border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
          </Field>
        </section>
      )}

      {/* Actions */}
      <div className="sticky bottom-20 flex gap-2 pt-2">
        <button
          onClick={() => navigate({ to: "/app" })}
          className="flex-1 py-3 rounded-xl bg-background/80 backdrop-blur ring-1 ring-border text-foreground/70 font-bold text-sm"
        >
          Cancel
        </button>
        <button
          onClick={save}
          className="flex-[2] py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30"
        >
          Save my card
        </button>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest">
          {label}
        </div>
        {hint && <div className="text-[10px] font-display italic text-foreground/30">{hint}</div>}
      </div>
      {children}
    </div>
  );
}
