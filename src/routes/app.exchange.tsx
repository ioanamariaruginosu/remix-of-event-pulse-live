import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { IdentityCard } from "@/components/IdentityCard";
import { people } from "@/data/event";
import { QRCodeSVG } from "qrcode.react";

export const Route = createFileRoute("/app/exchange")({
  head: () => ({ meta: [{ title: "Tap to exchange — synqmap" }] }),
  component: Exchange,
});

function Exchange() {
  const [stage, setStage] = useState<"ready" | "matching" | "done">("ready");
  const [mode, setMode] = useState<"nfc" | "qr">("nfc");
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcStatus, setNfcStatus] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const other = people[1];
  const me = people[0];

  // Payload exchanged over NFC / encoded into QR.
  const payload = `synqmap://card/${me?.id ?? "me"}`;

  useEffect(() => {
    const supported = typeof window !== "undefined" && "NDEFReader" in window;
    setNfcSupported(supported);
    if (!supported) setMode("qr");
    return () => abortRef.current?.abort();
  }, []);

  const complete = () => {
    setStage("matching");
    setTimeout(() => setStage("done"), 1200);
  };

  const startNfc = async () => {
    if (!("NDEFReader" in window)) {
      setMode("qr");
      return;
    }
    try {
      setNfcStatus("Hold phones together…");
      const NDEFReader = (window as unknown as { NDEFReader: new () => {
        scan: (opts?: { signal?: AbortSignal }) => Promise<void>;
        write: (msg: unknown, opts?: { signal?: AbortSignal }) => Promise<void>;
        addEventListener: (ev: string, cb: (e: unknown) => void) => void;
      } }).NDEFReader;
      const reader = new NDEFReader();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      await reader.scan({ signal: ctrl.signal });
      reader.addEventListener("reading", () => {
        setNfcStatus(null);
        complete();
      });
      // Best-effort: also try to write our card so peers reading us get it.
      reader.write({ records: [{ recordType: "url", data: payload }] }, { signal: ctrl.signal }).catch(() => {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : "NFC unavailable";
      setNfcStatus(msg);
    }
  };

  return (
    <div className="px-5 pt-6 space-y-5 pb-10">
      <div>
        <div className="text-[10px] font-display italic text-primary font-bold uppercase tracking-widest">BLE active</div>
        <h1 className="font-extrabold text-2xl tracking-tight">Tap to exchange</h1>
      </div>

      {/* Mode toggle: NFC (Android Chrome) ↔ QR (iOS + unsupported) */}
      <div className="flex gap-2 p-1 bg-foreground/5 rounded-xl text-xs font-bold">
        <button
          disabled={!nfcSupported}
          onClick={() => setMode("nfc")}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            mode === "nfc" ? "bg-background shadow ring-1 ring-border" : "opacity-60"
          } ${!nfcSupported ? "opacity-30 cursor-not-allowed" : ""}`}
        >
          NFC{!nfcSupported && " (n/a)"}
        </button>
        <button
          onClick={() => setMode("qr")}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            mode === "qr" ? "bg-background shadow ring-1 ring-border" : "opacity-60"
          }`}
        >
          QR code
        </button>
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
            {mode === "nfc" ? (
              <>
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
                  onClick={nfcSupported ? startNfc : complete}
                  className="w-full py-4 bg-primary text-white rounded-xl font-bold"
                >
                  {nfcSupported ? "Start NFC exchange" : "Simulate a tap"}
                </button>
                <p className="text-xs text-foreground/50 text-center">
                  {nfcStatus ?? "Bring two phones within 10cm. Both will vibrate when cards swap."}
                </p>
              </>
            ) : (
              <>
                <div className="aspect-square bg-white rounded-3xl grid place-items-center p-6 ring-1 ring-border">
                  <QRCodeSVG value={payload} size={256} bgColor="#ffffff" fgColor="#0a0d1a" level="M" includeMargin={false} />
                </div>
                <button
                  onClick={complete}
                  className="w-full py-4 bg-primary text-white rounded-xl font-bold"
                >
                  Mark as scanned
                </button>
                <p className="text-xs text-foreground/50 text-center">
                  iOS doesn't support Web NFC. Have the other person scan this QR with their camera to grab your card.
                </p>
              </>
            )}
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
