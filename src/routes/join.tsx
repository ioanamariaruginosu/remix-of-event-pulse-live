import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/join")({
  head: () => ({ meta: [{ title: "Join — synqmap" }] }),
  component: Join,
});

const steps = [
  { id: "scan", title: "Scan the event QR" },
  { id: "intent", title: "Set your intent" },
  { id: "card", title: "Build your card" },
];

function Join() {
  const [step, setStep] = useState(0);
  const [intent, setIntent] = useState("Looking for: a co-founder for a research-heavy startup");
  const [tags, setTags] = useState<string[]>(["design", "ml"]);
  const allTags = ["design", "ml", "founders", "vc", "infra", "hardware", "spatial", "graphs", "rotterdam", "evals"];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border p-6 flex items-center justify-between max-w-7xl mx-auto">
        <Logo />
        <Link to="/" className="text-sm text-foreground/60 hover:text-foreground">Exit</Link>
      </nav>
      <div className="max-w-md mx-auto p-6 space-y-8 pt-16">
        <div>
          <div className="flex items-center gap-1.5 mb-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-foreground/10"}`}
              />
            ))}
          </div>
          <div className="font-display italic text-[10px] uppercase tracking-widest text-primary mb-2">
            Step {step + 1} of {steps.length}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">{steps[step].title}</h1>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 0 && (
              <div className="space-y-6">
                <p className="text-foreground/60">Point your camera at the QR posted at the entrance.</p>
                <div className="aspect-square bg-foreground rounded-3xl p-8 grid place-items-center relative overflow-hidden">
                  <div
                    className="size-full bg-white rounded-2xl"
                    style={{
                      backgroundImage:
                        "repeating-conic-gradient(#0f172a 0% 25%, #ffffff 0% 50%)",
                      backgroundSize: "16px 16px",
                    }}
                  />
                  <div className="absolute inset-8 border-2 border-primary rounded-2xl pointer-events-none animate-pulse" />
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-6">
                <p className="text-foreground/60">What are you here for? This is the only thing matchers see first.</p>
                <textarea
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  rows={3}
                  className="w-full p-4 rounded-2xl ring-1 ring-border bg-background font-medium resize-none focus:ring-2 focus:ring-primary outline-none"
                />
                <div>
                  <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-2">Pick 1–3 tags</div>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((t) => {
                      const on = tags.includes(t);
                      return (
                        <button
                          key={t}
                          onClick={() =>
                            setTags((cur) => (on ? cur.filter((x) => x !== t) : cur.length >= 3 ? cur : [...cur, t]))
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
                            on ? "bg-primary text-white" : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-6">
                <p className="text-foreground/60">Add the socials you'd be happy to share when you tap phones.</p>
                <div className="space-y-3">
                  {["LinkedIn", "X / Twitter", "GitHub", "Email", "Personal site"].map((s) => (
                    <div key={s} className="p-4 rounded-xl ring-1 ring-border flex items-center justify-between">
                      <span className="font-bold text-sm">{s}</span>
                      <button className="px-3 py-1 text-xs font-bold bg-foreground/5 rounded-full hover:bg-foreground/10">
                        Connect
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-5 py-3 rounded-xl ring-1 ring-border font-bold text-sm hover:bg-foreground/5"
            >
              Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 px-5 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
            >
              Continue
            </button>
          ) : (
            <Link
              to="/app"
              className="flex-1 px-5 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors text-center"
            >
              Enter the venue →
            </Link>
          )}
        </div>
      </div>

    </div>
  );
}
