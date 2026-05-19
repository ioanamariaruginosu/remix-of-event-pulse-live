import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { IdentityCard } from "@/components/IdentityCard";
import { people, type Person } from "@/data/event";
import { QRCodeSVG } from "qrcode.react";
import QrScanner from "qr-scanner";
import { supabase } from "@/integrations/supabase/client";
import { exchangeCardWith, type DeckProfile } from "@/lib/exchange.functions";

export const Route = createFileRoute("/app/exchange")({
  head: () => ({ meta: [{ title: "Tap to exchange — synqmap" }] }),
  component: Exchange,
});

function Exchange() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<"ready" | "matching" | "done">("ready");
  const [mode, setMode] = useState<"nfc" | "qr">("nfc");
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcStatus, setNfcStatus] = useState<string | null>(null);
  const [qrScanStatus, setQrScanStatus] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [matchedPerson, setMatchedPerson] = useState<Person | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const other = people[1];
  const me = people[0];
  const qrPayload = useMemo(() => {
    if (typeof window === "undefined" || !myUserId) return "";
    return `${window.location.origin}/app/exchange?scan=${encodeURIComponent(myUserId)}`;
  }, [myUserId]);

  // Payload exchanged over NFC / encoded into QR.
  const payload = myUserId ? payloadForId(myUserId) : "";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setMyUserId(data.session?.user.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setMyUserId(s?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

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

  const completeWithPerson = (personId: string) => {
    if (!myUserId) {
      setQrScanStatus("Sign in first so we can save the card to your deck.");
      return;
    }
    if (personId === myUserId) {
      setQrScanStatus("That's your own code. Ask the other person to show theirs.");
      return;
    }
    if (!/^[0-9a-f-]{36}$/i.test(personId)) {
      setQrScanStatus("That QR code isn't a synqmap card.");
      return;
    }
    setQrScanStatus(null);
    setScannerOpen(false);
    void stopScanner();
    setStage("matching");
    exchangeCardWith({
      data: {
        otherUserId: personId,
        reason: `Exchanged at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      },
    })
      .then(({ other: profile }) => {
        setMatchedPerson(profileToPerson(profile));
        setStage("done");
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Could not save the exchange.";
        setQrScanStatus(msg);
        setStage("ready");
      });
  };

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setCameraReady(false);
    if (scanner) {
      await scanner.stop();
      scanner.destroy();
    }
  };

  const openScanner = () => {
    setQrScanStatus("Point the camera at their QR code.");
    setScannerOpen(true);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const search = new URLSearchParams(window.location.search);
    const incoming = search.get("scan");
    if (incoming) completeWithPerson(incoming);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!scannerOpen) {
      void stopScanner();
      return;
    }

    const startQrScanner = async () => {
      if (!videoRef.current || scannerRef.current) return;

      try {
        const scanner = new QrScanner(
          videoRef.current,
          (result) => {
            const decoded = parseScannedValue(typeof result === "string" ? result : result.data);
            if (!decoded) {
              setQrScanStatus("That QR code isn’t a synqmap card.");
              return;
            }
            completeWithPerson(decoded);
          },
          {
            preferredCamera: "environment",
            highlightScanRegion: true,
            highlightCodeOutline: true,
            returnDetailedScanResult: true,
          },
        );
        scannerRef.current = scanner;
        await scanner.start();
        setCameraReady(true);
      } catch (error) {
        setQrScanStatus(
          error instanceof Error
            ? error.message
            : "Camera access failed. Allow camera permission and try again.",
        );
      }
    };

    void startQrScanner();

    return () => {
      void stopScanner();
    };
  }, [scannerOpen]);

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
                  <QRCodeSVG value={qrPayload} size={256} bgColor="#ffffff" fgColor="#0a0d1a" level="M" includeMargin={false} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => void openScanner()}
                    className="w-full py-4 bg-primary text-white rounded-xl font-bold"
                  >
                    Scan in app
                  </button>
                  <button
                    onClick={() => navigate({ to: "/app/card" })}
                    className="w-full py-4 ring-1 ring-border rounded-xl font-bold text-sm hover:bg-foreground/5"
                  >
                    Show my code
                  </button>
                </div>
                <p className="text-xs text-foreground/50 text-center">
                  Open the camera inside synqmap and scan the other person’s code right here on iPhone or Android.
                </p>
                {scannerOpen && (
                  <div className="space-y-3 rounded-3xl bg-foreground p-3 text-white">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-black/60 ring-1 ring-white/10">
                      <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                      <div className="pointer-events-none absolute inset-0 grid place-items-center p-6">
                        <div className="h-56 w-full max-w-56 rounded-[28px] border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.28)]" />
                      </div>
                      {!cameraReady && (
                        <div className="absolute inset-0 grid place-items-center bg-black/45 text-center px-6">
                          <div>
                            <div className="mx-auto mb-3 size-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            <p className="text-sm font-semibold">Starting camera…</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-white/70">{qrScanStatus ?? "Center the QR inside the frame."}</p>
                      <button
                        onClick={() => setScannerOpen(false)}
                        className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-white/15 hover:bg-white/10"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
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
              <div className="text-[9px] font-display italic text-primary font-bold uppercase tracking-widest mb-1">Cards swapped · +50 XP</div>
              <div className="font-bold text-sm">
                {matchedPerson
                  ? `${matchedPerson.name}'s card is in your deck — and yours just landed in theirs.`
                  : "Cards exchanged both ways."}
              </div>
            </div>
            <div className="flex justify-center scale-90 origin-top">
              <IdentityCard person={matchedPerson ?? other} serial="042" />
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

function payloadForId(personId: string) {
  return `synqmap://card/${personId}`;
}

function profileToPerson(p: DeckProfile): Person {
  return {
    id: p.id,
    name: p.name ?? "Anonymous",
    initials: p.initials ?? "??",
    oneLiner: p.one_liner ?? "",
    intent: p.intent ?? "",
    tags: p.tags ?? [],
    socials: (p.socials ?? {}) as Person["socials"],
    color: p.color ?? "#7c3aed",
  };
}

function parseScannedValue(value: string) {
  try {
    if (value.startsWith("synqmap://card/")) {
      return value.replace("synqmap://card/", "").trim();
    }

    const url = new URL(value);
    if (url.pathname === "/app/exchange") {
      return url.searchParams.get("scan")?.trim() ?? null;
    }
  } catch {
    return null;
  }

  return null;
}
