import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <div className="size-8 bg-primary rounded-lg grid place-items-center">
        <div className="size-3 bg-white rounded-full animate-pulse" />
      </div>
      <span className="font-extrabold tracking-tighter text-xl">
        EURHACK<span className="text-primary">2026</span>
      </span>
    </Link>
  );
}
