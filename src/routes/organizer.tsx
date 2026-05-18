import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/organizer")({
  component: OrganizerLayout,
});

const nav = [
  { to: "/organizer", label: "Dashboard", exact: true },
  { to: "/organizer/events", label: "Events" },
  { to: "/organizer/rooms", label: "Rooms" },
  { to: "/organizer/sessions", label: "Schedule" },
  { to: "/organizer/invitations", label: "Invitations" },
  { to: "/organizer/live", label: "Live Ops" },
];

function OrganizerLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="w-64 border-r border-border p-6 flex flex-col gap-8 shrink-0 bg-background sticky top-0 h-screen">
        <Logo />
        <div className="space-y-1">
          <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 px-3 mb-2">
            Organizer
          </div>
          {nav.map((n) => {
            const active = n.exact ? path === n.to : path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "text-foreground/70 hover:bg-foreground/5"
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
