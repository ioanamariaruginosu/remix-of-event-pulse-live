import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { checkInAttendee } from "@/lib/door.functions";

function parseScannedValue(value: string): string | null {
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

type Props = {
  roomName: string;
  /** Optional callback fired after a successful check-in. */
  onCheckedIn?: (attendeeName: string) => void;
};

/**
 * Tiny per-room scanner: a button that flips the card into a live camera
 * view. When it decodes a synqmap QR, the attendee is signed into this room
 * via checkInAttendee().
 */
export function RoomQrScanner({ roomName, onCheckedIn }: Props) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const lastScanRef = useRef<{ id: string; at: number } | null>(null);

  const stop = async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    setReady(false);
    if (s) {
      await s.stop();
      s.destroy();
    }
  };

  const handleDecoded = async (raw: string) => {
    const id = parseScannedValue(raw);
    if (!id) {
      setMessage("Not a synqmap card.");
      return;
    }
    const now = Date.now();
    if (lastScanRef.current && lastScanRef.current.id === id && now - lastScanRef.current.at < 3000) {
      return;
    }
    lastScanRef.current = { id, at: now };
    setMessage("Checking in…");
    try {
      const { attendee } = await checkInAttendee({
        data: { attendeeUserId: id, roomLabel: roomName },
      });
      setLastName(attendee.name);
      setMessage(`${attendee.name} → ${roomName} ✓`);
      onCheckedIn?.(attendee.name);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Check-in failed.");
    }
  };

  useEffect(() => {
    if (!open) {
      void stop();
      return;
    }
    const start = async () => {
      if (!videoRef.current || scannerRef.current) return;
      try {
        const scanner = new QrScanner(
          videoRef.current,
          (result) => {
            void handleDecoded(typeof result === "string" ? result : result.data);
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
        setReady(true);
        setMessage("Point at an attendee's QR.");
      } catch (err) {
        setMessage(
          err instanceof Error
            ? err.message
            : "Camera unavailable. Allow camera permission and retry.",
        );
      }
    };
    void start();
    return () => {
      void stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 7V5a2 2 0 0 1 2-2h2" />
          <path d="M17 3h2a2 2 0 0 1 2 2v2" />
          <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
          <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          <rect x="7" y="7" width="10" height="10" rx="1" />
        </svg>
        Scan attendee QR
      </button>
    );
  }

  return (
    <div className="w-full space-y-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black ring-1 ring-border">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        <div className="pointer-events-none absolute inset-0 grid place-items-center p-4">
          <div className="h-32 w-32 rounded-2xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.35)]" />
        </div>
        {!ready && (
          <div className="absolute inset-0 grid place-items-center bg-black/45 text-center text-white px-4">
            <div>
              <div className="mx-auto mb-2 size-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <p className="text-xs font-semibold">Starting camera…</p>
            </div>
          </div>
        )}
        {lastName && (
          <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-emerald-400/90 px-2 py-1.5 text-foreground text-[11px] font-bold text-center">
            {lastName} signed into {roomName}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] text-foreground/60 truncate">{message ?? `Scanning for ${roomName}…`}</div>
        <button
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-[11px] font-bold rounded-lg ring-1 ring-border hover:bg-foreground/5"
        >
          Close
        </button>
      </div>
    </div>
  );
}
