import { useEffect, useState } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "synqmap:install-dismissed";

export function InstallPrompt() {
  const [bip, setBip] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Don't show inside the Lovable editor iframe or preview hosts.
    let inIframe = false;
    try { inIframe = window.self !== window.top; } catch { inIframe = true; }
    const host = window.location.hostname;
    const isPreviewHost =
      host.includes("id-preview--") ||
      host.includes("lovableproject.com") ||
      host === "localhost" ||
      host === "127.0.0.1";
    if (inIframe || isPreviewHost) return;

    // Already installed (standalone) — bail.
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari quirk
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    if (localStorage.getItem(DISMISS_KEY)) return;

    const ua = navigator.userAgent || "";
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;

    if (iOS) {
      setIsIOS(true);
      // Show after a small delay so it doesn't compete with first paint.
      const t = setTimeout(() => setShow(true), 2500);
      return () => clearTimeout(t);
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setBip(e as BIPEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
  };

  const install = async () => {
    if (!bip) return;
    await bip.prompt();
    await bip.userChoice.catch(() => null);
    setBip(null);
    setShow(false);
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-[100] sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm">
      <div className="rounded-2xl bg-foreground text-background shadow-2xl ring-1 ring-foreground/20 p-4">
        <div className="flex items-start gap-3">
          <div className="size-10 shrink-0 rounded-xl bg-primary grid place-items-center text-white font-display italic font-bold">s</div>
          <div className="min-w-0 flex-1">
            <div className="font-extrabold text-sm">Install synqmap</div>
            {isIOS ? (
              <p className="mt-1 text-xs leading-snug opacity-80">
                Tap <span className="font-bold">Share</span>{" "}
                <span aria-hidden>⎘</span> in Safari, then{" "}
                <span className="font-bold">Add to Home Screen</span>.
              </p>
            ) : (
              <p className="mt-1 text-xs leading-snug opacity-80">
                Add to your home screen for fullscreen access and faster taps.
              </p>
            )}
            <div className="mt-3 flex gap-2">
              {!isIOS && (
                <button
                  onClick={install}
                  className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold"
                >
                  Install
                </button>
              )}
              <button
                onClick={dismiss}
                className="px-3 py-1.5 rounded-lg ring-1 ring-background/30 text-xs font-bold opacity-80"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="Close"
            className="opacity-60 hover:opacity-100 text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}