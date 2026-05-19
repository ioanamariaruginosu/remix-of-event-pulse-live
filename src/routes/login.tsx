import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — synqmap" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name }, emailRedirectTo: `${window.location.origin}/join?step=1` },
        });
        if (error) throw error;
        navigate({ to: "/join", search: { step: 1 } });
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const uid = data.user?.id;
        let hasProfile = false;
        if (uid) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", uid)
            .maybeSingle();
          hasProfile = !!prof?.name;
        }
        navigate(hasProfile ? { to: "/app" } : { to: "/join", search: { step: 1 } });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
              {mode === "signin" ? "Welcome back" : "New here"}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {mode === "signin" ? "Sign in to synqmap" : "Create your account"}
            </h1>
          </div>
          <div className="flex gap-1 p-1 bg-foreground/5 rounded-xl">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${mode === "signin" ? "bg-background shadow" : "text-foreground/60"}`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${mode === "signup" ? "bg-background shadow" : "text-foreground/60"}`}
            >
              Sign up
            </button>
          </div>
          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={120}
                required
                className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              required
              autoComplete="email"
              className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 chars)"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
            />
            {error && <div className="text-sm text-red-500 px-1">{error}</div>}
            <button
              type="submit"
              disabled={busy}
              className="w-full px-5 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          <div className="text-xs text-foreground/50 text-center">
            By continuing you agree to be a good conference citizen.
          </div>
        </div>
      </div>
    </div>
  );
}