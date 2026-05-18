import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const tabs = [
  { to: "/app", label: "You", exact: true, icon: "◉" },
  { to: "/app/room", label: "Room", icon: "▢" },
  { to: "/app/exchange", label: "Tap", icon: "↔" },
  { to: "/app/collection", label: "Deck", icon: "▦" },
  { to: "/app/map", label: "Map", icon: "✦" },
];

function AppLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-foreground/5 py-10 px-4">
      <div className="max-w-md mx-auto mb-6 flex items-center justify-between">
        <Logo />
        <Link to="/" className="text-xs text-foreground/60 font-bold uppercase tracking-widest hover:text-foreground">Exit</Link>
      </div>

      <PhoneFrame>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto pb-24">
            <Outlet />
          </div>
          <nav className="absolute bottom-0 inset-x-0 bg-background border-t border-border px-2 py-2 grid grid-cols-5 gap-1">
            {tabs.map((t) => {
              const active = t.exact ? path === t.to : path.startsWith(t.to);
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`flex flex-col items-center gap-0.5 py-2 rounded-lg transition-colors ${
                    active ? "text-primary" : "text-foreground/40"
                  }`}
                >
                  <span className="text-lg leading-none">{t.icon}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest">{t.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </PhoneFrame>
    </div>
  );
}
