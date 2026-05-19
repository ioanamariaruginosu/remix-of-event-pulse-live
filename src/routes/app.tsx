import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect } from "react";
import { people } from "@/data/event";
import { Avatar } from "@/components/Avatar";
import { useYou, setUserProfile } from "@/data/profile";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const tabs = [
  { to: "/app", label: "You", exact: true, icon: PersonIcon },
  { to: "/app/room", label: "Room", icon: RoomIcon },
  { to: "/app/exchange", label: "Tap", icon: TapIcon, primary: true },
  { to: "/app/collection", label: "Deck", icon: DeckIcon },
  { to: "/app/past", label: "Past", icon: ArchiveIcon },
];

function AppLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const you = useYou(people[0]);
  const navigate = useNavigate();

  // Hydrate the user profile from the backend so the card / header / matches
  // all reflect what was saved during onboarding (not hardcoded demo data).
  useEffect(() => {
    let cancelled = false;
    const load = async (uid: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("name, one_liner, intent, tags, socials")
        .eq("id", uid)
        .maybeSingle();
      if (cancelled || !data) return;
      const s = (data.socials ?? {}) as Record<string, string>;
      setUserProfile({
        name: data.name ?? undefined,
        oneLiner: data.one_liner ?? undefined,
        intent: data.intent ?? undefined,
        tags: data.tags ?? [],
        socials: {
          linkedin: s.LinkedIn ?? s.linkedin,
          x: s["X / Twitter"] ?? s.x,
          github: s.GitHub ?? s.github,
          email: s.Email ?? s.email,
        },
      });
    };
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) load(data.session.user.id);
      else navigate({ to: "/login" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) load(s.user.id);
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [navigate]);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground antialiased flex flex-col relative overflow-hidden">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute -top-40 -right-40 size-[480px] rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 size-[420px] rounded-full bg-accent/30 blur-3xl" />

      {/* App bar — mimics PWA safe area + status row */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="px-5 pt-4 pb-3 max-w-md mx-auto w-full flex items-center justify-between">
          <Link to="/app/avatar" className="flex items-center gap-2.5 group" aria-label="Customize avatar">
            <div className="relative">
              <Avatar person={you} size={36} ring />
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            </div>
            <div className="leading-tight">
              <div className="text-[9px] font-display italic tracking-tight normal-case text-foreground/40 group-hover:text-primary transition">
                Live · Day 1 · tap to edit
              </div>
              <div className="font-extrabold text-sm tracking-tight">{you.name}</div>
            </div>
          </Link>

          <Link
            to="/"
            className="size-9 rounded-full grid place-items-center bg-foreground/5 text-foreground/60 hover:bg-foreground/10 transition"
            aria-label="Exit"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 relative max-w-md mx-auto w-full pb-32">
        <Outlet />
      </main>

      {/* Floating bottom nav — iOS/PWA style */}
      <nav className="fixed bottom-4 inset-x-0 z-50 px-4 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="bg-foreground text-white/60 rounded-full px-2 py-2 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.4)] ring-1 ring-white/10 flex items-center justify-between">
            {tabs.map((t) => {
              const active = t.exact ? path === t.to : path.startsWith(t.to);
              const Icon = t.icon;
              if (t.primary) {
                return (
                  <Link key={t.to} to={t.to} className="relative -mt-7" aria-label={t.label}>
                    <motion.div
                      whileTap={{ scale: 0.92 }}
                      className="size-14 rounded-full bg-primary grid place-items-center text-white shadow-[0_12px_30px_-6px_oklch(0.53_0.27_295/0.6)] ring-4 ring-foreground"
                    >
                      <Icon className="size-5" />
                    </motion.div>
                  </Link>
                );
              }
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full transition-colors ${
                    active ? "text-white" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="navPill"
                      className="absolute inset-0 bg-white/10 rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon className="size-[18px] relative" />
                  <span className="text-[9px] font-bold uppercase tracking-widest relative">{t.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}

type IconProps = { className?: string };
function PersonIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}
function RoomIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <circle cx="8" cy="15" r="1.4" />
    </svg>
  );
}
function TapIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v6m0 8v6M2 12h6m8 0h6" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function DeckIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}
function MapIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}
function ArchiveIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h18M5 7v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7" />
      <path d="M9 11h6" />
      <path d="M4 4h16v3H4z" />
    </svg>
  );
}
