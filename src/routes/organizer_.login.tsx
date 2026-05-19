import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

const ORGANIZER_EMAIL = "organizer@example.com";

export const Route = createFileRoute("/organizer_/login")({
  head: () => ({ meta: [{ title: "Organizer sign in — synqmap" }] }),
  component: OrganizerLogin,
});

function OrganizerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (email.trim().toLowerCase() !== ORGANIZER_EMAIL) {
      setError("Organizer access is restricted. Use the organizer account.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      navigate({ to: "/organizer" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="border-b border-border p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Logo />
        <Link to="/" className="text-sm text-foreground/60 hover:text-foreground">Exit</Link>
      </nav>
      <div className="flex-1 grid place-items-center px-6 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <div className="font-display italic text-[10px] uppercase tracking-widest text-primary mb-2">
              Organizer access
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Sign in as organizer</h1>
            <p className="text-sm text-foreground/60 mt-2">
              Restricted to the organizer account.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="organizer@example.com"
              required
              autoComplete="email"
              className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              autoComplete="current-password"
              className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
            />
            {error && <div className="text-sm text-red-500 px-1">{error}</div>}
            <button
              type="submit"
              disabled={busy}
              className="w-full px-5 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              {busy ? "Please wait…" : "Sign in"}
            </button>
          </form>

          <div className="text-xs text-foreground/50 text-center">
            Attending instead?{" "}
            <Link to="/login" className="text-primary font-bold">Attendee sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
