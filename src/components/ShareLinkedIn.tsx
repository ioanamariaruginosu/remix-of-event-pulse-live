import { type MouseEvent } from "react";

function buildShareUrl(url: string) {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

function openShare(e: MouseEvent, url: string) {
  e.preventDefault();
  e.stopPropagation();
  const target =
    url.startsWith("http")
      ? url
      : typeof window !== "undefined"
        ? new URL(url, window.location.origin).toString()
        : url;
  if (typeof window !== "undefined") {
    window.open(buildShareUrl(target), "_blank", "noopener,noreferrer,width=600,height=600");
  }
}

function LinkedInIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.37V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

export function ShareLinkedInButton({
  url,
  label = "Share on LinkedIn",
  variant = "light",
  className = "",
}: {
  url: string;
  label?: string;
  variant?: "light" | "dark" | "ghost";
  className?: string;
}) {
  const styles =
    variant === "dark"
      ? "bg-white text-[#0a66c2] hover:bg-white/90"
      : variant === "ghost"
        ? "bg-transparent text-foreground/70 hover:text-[#0a66c2]"
        : "bg-[#0a66c2] text-white hover:bg-[#004182]";
  return (
    <button
      type="button"
      onClick={(e) => openShare(e, url)}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-colors ${styles} ${className}`}
      aria-label={label}
    >
      <LinkedInIcon className="size-4" />
      {label}
    </button>
  );
}

export function ShareLinkedInIcon({
  url,
  className = "",
  ariaLabel = "Share on LinkedIn",
}: {
  url: string;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => openShare(e, url)}
      aria-label={ariaLabel}
      className={`size-8 grid place-items-center rounded-full text-foreground/50 hover:text-[#0a66c2] hover:bg-[#0a66c2]/10 transition-colors ${className}`}
    >
      <LinkedInIcon className="size-3.5" />
    </button>
  );
}
