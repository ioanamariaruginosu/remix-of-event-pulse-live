import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/organizer/events/new")({
  head: () => ({ meta: [{ title: "Organizer · New event — synqmap" }] }),
  component: NewEvent,
});

const steps = ["Basics", "Venue", "Branding", "Review"] as const;

function NewEvent() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    tagline: "",
    startDate: "",
    endDate: "",
    city: "",
    venue: "",
    capacity: 250,
    visibility: "invite-only" as "invite-only" | "public" | "unlisted",
    accent: "#7c3aed",
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="p-5 lg:p-12 max-w-4xl space-y-8 lg:space-y-10">
      <div className="flex items-center gap-3 text-sm">
        <Link to="/organizer/events" className="text-foreground/50 hover:text-foreground">
          ← Events
        </Link>
      </div>

      <div>
        <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-2">
          New event
        </div>
        <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight">
          {form.name || "Untitled event"}
        </h1>
        <p className="text-foreground/50 mt-2">{form.tagline || "Set the stage for your gathering."}</p>
      </div>

      <Stepper step={step} setStep={setStep} />

      <div className="p-5 lg:p-8 ring-1 ring-border rounded-3xl bg-background space-y-6 min-h-[360px]">

        {step === 0 && (
          <div className="space-y-5">
            <Field label="Event name">
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Helsinki Founders Week"
                className="input"
              />
            </Field>
            <Field label="Tagline">
              <input
                value={form.tagline}
                onChange={(e) => update("tagline", e.target.value)}
                placeholder="One line that captures the why"
                className="input"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start date">
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => update("startDate", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="End date">
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => update("endDate", e.target.value)}
                  className="input"
                />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="City">
                <input
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="Berlin"
                  className="input"
                />
              </Field>
              <Field label="Venue">
                <input
                  value={form.venue}
                  onChange={(e) => update("venue", e.target.value)}
                  placeholder="Funkhaus"
                  className="input"
                />
              </Field>
            </div>
            <Field label={`Capacity · ${form.capacity}`}>
              <input
                type="range"
                min={20}
                max={5000}
                step={10}
                value={form.capacity}
                onChange={(e) => update("capacity", Number(e.target.value))}
                className="w-full accent-primary"
              />
            </Field>
            <Field label="Visibility">
              <div className="grid grid-cols-3 gap-2">
                {(["invite-only", "unlisted", "public"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => update("visibility", v)}
                    className={`px-3 py-3 rounded-xl text-xs font-bold ring-1 transition-colors ${
                      form.visibility === v
                        ? "bg-foreground text-white ring-foreground"
                        : "ring-border hover:bg-foreground/5"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <Field label="Accent color">
              <div className="flex gap-2">
                {["#7c3aed", "#22d3ee", "#f472b6", "#34d399", "#fbbf24", "#fb7185"].map((c) => (
                  <button
                    key={c}
                    onClick={() => update("accent", c)}
                    className={`size-12 rounded-xl ring-2 transition ${
                      form.accent === c ? "ring-foreground scale-110" : "ring-transparent"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </Field>
            <Field label="Preview">
              <div
                className="h-40 rounded-2xl p-6 flex flex-col justify-end text-white"
                style={{ background: `linear-gradient(135deg, ${form.accent}, #0f172a)` }}
              >
                <div className="font-display italic text-[10px] uppercase tracking-widest text-white/60">
                  {form.city || "City"} · {form.startDate || "TBD"}
                </div>
                <div className="text-3xl font-extrabold tracking-tight">
                  {form.name || "Your event"}
                </div>
              </div>
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Row k="Name" v={form.name || "—"} />
            <Row k="Tagline" v={form.tagline || "—"} />
            <Row k="Dates" v={`${form.startDate || "TBD"} → ${form.endDate || "TBD"}`} />
            <Row k="Venue" v={`${form.venue || "—"}, ${form.city || "—"}`} />
            <Row k="Capacity" v={form.capacity.toString()} />
            <Row k="Visibility" v={form.visibility} />
            <Row
              k="Accent"
              v={
                <span className="flex items-center gap-2">
                  <span className="size-4 rounded" style={{ background: form.accent }} />
                  {form.accent}
                </span>
              }
            />
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={prev}
          disabled={step === 0}
          className="px-5 py-3 text-sm font-bold rounded-xl ring-1 ring-border disabled:opacity-30 hover:bg-foreground/5"
        >
          ← Back
        </button>
        {step < steps.length - 1 ? (
          <button
            onClick={next}
            className="px-5 py-3 text-sm font-bold rounded-xl bg-foreground text-white hover:bg-primary transition-colors"
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={() => navigate({ to: "/organizer/events" })}
            className="px-5 py-3 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/90"
          >
            Publish event ✦
          </button>
        )}
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.875rem 1rem;
          border-radius: 0.75rem;
          background: transparent;
          border: 1px solid var(--color-border);
          font-family: var(--font-sans);
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus { border-color: var(--color-primary); }
      `}</style>
    </div>
  );
}

function Stepper({ step, setStep }: { step: number; setStep: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto -mx-5 px-5 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
      {steps.map((s, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <button
            key={s}
            onClick={() => setStep(i)}
            className="flex items-center gap-2 group"
          >
            <span
              className={`size-7 grid place-items-center rounded-full text-[10px] font-bold font-display italic transition-colors ${
                active
                  ? "bg-foreground text-white"
                  : done
                  ? "bg-primary text-white"
                  : "bg-foreground/5 text-foreground/40"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span
              className={`text-xs font-bold ${
                active ? "text-foreground" : "text-foreground/40 group-hover:text-foreground/70"
              }`}
            >
              {s}
            </span>
            {i < steps.length - 1 && <span className="w-8 h-px bg-border ml-1" />}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40">
        {label}
      </div>
      {children}
    </label>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40">
        {k}
      </div>
      <div className="text-sm font-bold">{v}</div>
    </div>
  );
}
