import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { grantOrganizerRole } from "@/lib/profile.functions";

export const Route = createFileRoute("/organizer")({
  component: OrganizerLayout,
});

const nav = [
  { to: "/organizer", label: "Dashboard", exact: true },
  { to: "/organizer/events", label: "Events" },
  { to: "/organizer/rooms", label: "Rooms" },
  { to: "/organizer/sessions", label: "Schedule" },
  { to: "/organizer/door", label: "Door check-in" },
  { to: "/organizer/invitations", label: "Invitations" },
  { to: "/organizer/live", label: "Live Ops" },
];

function OrganizerLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const active = nav.find((n) => (n.exact ? path === n.to : path.startsWith(n.to) && n.to !== "/organizer")) ?? nav[0];
  const { loading, isAuthenticated, isOrganizer } = useAuth();
  const promote = useServerFn(grantOrganizerRole);

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-sm text-foreground/60">Loading…</div>;
  }
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="max-w-sm text-center space-y-4">
          <h1 className="text-2xl font-extrabold">Organizer area</h1>
          <p className="text-sm text-foreground/60">Sign in to manage events.</p>
          <Link to="/login" className="inline-block px-5 py-3 bg-primary text-white rounded-xl font-bold">Sign in</Link>
        </div>
      </div>
    );
  }
  if (!isOrganizer) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="max-w-sm text-center space-y-4">
          <h1 className="text-2xl font-extrabold">You're not an organizer yet</h1>
          <p className="text-sm text-foreground/60">Grant yourself organizer access to continue (demo).</p>
          <button
            onClick={async () => { await promote({}); window.location.reload(); }}
            className="inline-block px-5 py-3 bg-primary text-white rounded-xl font-bold"
          >
            Become an organizer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b border-border bg-background/90 backdrop-blur">
        <Logo />
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 ring-border text-xs font-bold"
        >
          {active.label}
          <span className={`transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        </button>
      </header>

      {/* Mobile dropdown */}
      {open && (
        <div className="lg:hidden fixed inset-x-0 top-14 z-30 bg-background border-b border-border p-3 space-y-1 shadow-lg">
          <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 px-3 mb-1">
            Organizer
          </div>
          {nav.map((n) => {
            const isActive = n.exact ? path === n.to : path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? "bg-primary text-white" : "text-foreground/70 hover:bg-foreground/5"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-border p-6 flex-col gap-8 shrink-0 bg-background sticky top-0 h-screen">
        <Logo />
        <div className="space-y-1">
          <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 px-3 mb-2">
            Organizer
          </div>
          {nav.map((n) => {
            const isActive = n.exact ? path === n.to : path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-primary text-white" : "text-foreground/70 hover:bg-foreground/5"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-auto p-4 rounded-2xl bg-foreground text-white">
          <div className="font-display italic text-[9px] uppercase tracking-widest text-white/40 mb-1">Event Status</div>
          <div className="font-bold text-sm mb-2">Day 1 · Live</div>
          <div className="flex items-center gap-2 text-[10px] text-accent font-display italic">
            <span className="size-1.5 bg-accent rounded-full animate-pulse" />
            All systems nominal
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
