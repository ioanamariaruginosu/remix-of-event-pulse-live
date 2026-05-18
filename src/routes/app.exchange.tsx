import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { IdentityCard } from "@/components/IdentityCard";
import { people } from "@/data/event";

export const Route = createFileRoute("/app/exchange")({
  head: () => ({ meta: [{ title: "Tap to exchange — synqmap" }] }),
  component: Exchange,
});

function Exchange() {
  const [stage, setStage] = useState<"ready" | "matching" | "done">("ready");
  const other = people[1];

  return (
    <div className="px-5 pt-6 space-y-5 pb-10">
      <div>
        <div className="text-[10px] font-display italic text-primary font-bold uppercase tracking-widest">BLE active</div>
        <h1 className="font-extrabold text-2xl tracking-tight">Tap to exchange</h1>
      </div>

      <AnimatePresence mode="wait">
        {stage === "ready" && (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="aspect-square bg-foreground rounded-3xl relative overflow-hidden grid place-items-center">
              <div className="absolute inset-0">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="absolute inset-0 rounded-full border border-primary/40"
                    style={{
                      animation: `pulse-glow 2.4s ease-out ${i * 0.6}s infinite`,
                      transformOrigin: "center",
                    }}
                  />
                ))}
              </div>
              <div className="size-24 bg-primary rounded-full grid place-items-center text-white font-display italic text-xs font-bold uppercase tracking-widest shadow-2xl shadow-primary/40">
                Tap
              </div>
            </div>
            <button
              onClick={() => {
                setStage("matching");
                setTimeout(() => setStage("done"), 1400);
              }}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold"
            >
              Simulate a tap
            </button>
            <p className="text-xs text-foreground/50 text-center">Bring two phones within 10cm. Both will vibrate when cards swap.</p>
          </motion.div>
        )}

        {stage === "matching" && (
          <motion.div key="matching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="aspect-square grid place-items-center">
            <div className="text-center space-y-4">
              <div className="size-20 mx-auto rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <div className="font-display italic text-xs uppercase tracking-widest text-foreground/60">Exchanging…</div>
            </div>
          </motion.div>
        )}

        {stage === "done" && (
          <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="p-4 rounded-2xl bg-primary-soft ring-1 ring-primary/20">
              <div className="text-[9px] font-display italic text-primary font-bold uppercase tracking-widest mb-1">Match earned · +50 XP</div>
              <div className="font-bold text-sm">You both care about evals and live in Rotterdam.</div>
            </div>
            <div className="flex justify-center scale-90 origin-top">
              <IdentityCard person={other} serial="042" />
            </div>
            <button
              onClick={() => setStage("ready")}
              className="w-full py-3 ring-1 ring-border rounded-xl font-bold text-sm hover:bg-foreground/5"
            >
              Tap again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
