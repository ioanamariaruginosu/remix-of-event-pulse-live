import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";

const targets = [
  { to: "/", label: "Landing" },
  { to: "/organizer", label: "Organizer" },
  { to: "/join", label: "Onboard" },
  { to: "/app", label: "Participant" },
  { to: "/venue", label: "Venue Screen" },
];

export function DemoSwitcher() {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="fixed bottom-5 right-5 z-[100]">
      {open && (
        <div className="mb-2 bg-foreground text-white rounded-2xl p-2 shadow-2xl ring-1 ring-white/10 min-w-[200px]">
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 px-2 py-1">
            Demo Switcher
          </div>
          {targets.map((t) => {
            const active = path === t.to || (t.to !== "/" && path.startsWith(t.to));
            return (
              <Link
                key={t.to}
                to={t.to}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  active ? "bg-primary text-white" : "hover:bg-white/10 text-white/80"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="size-12 bg-foreground text-white rounded-full grid place-items-center shadow-xl ring-2 ring-primary/40 hover:ring-primary transition-all cursor-pointer"
        aria-label="Demo switcher"
      >
        <span className="font-mono text-[10px] font-bold tracking-tight leading-none text-center">
          DEMO<br/>NAV
        </span>
      </button>
    </div>
  );
}
