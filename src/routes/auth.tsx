import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { CubeWordmark } from "@/components/CubeLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Sign in to Cube — Budget planner" },
      {
        name: "description",
        content:
          "Sign in to Cube to track your monthly budget, expenses and lending across your devices.",
      },
      { property: "og:title", content: "Sign in to Cube" },
      {
        property: "og:description",
        content: "Cloud-synced monthly budgeting, expenses and lend/borrow tracking.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="glow-field min-h-screen">
      <header className="sticky top-0 z-30 glass-soft">
        <div className="mx-auto flex max-w-3xl items-center px-5 py-3">
          <CubeWordmark />
        </div>
      </header>
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-5 py-10">
      <div className="glass w-full max-w-sm rounded-4xl p-7">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="mt-2 font-display text-3xl uppercase tracking-[0.12em] text-glow">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Budget, expenses and lending — synced to your account.
          </p>
        </div>

        {sent ? (
          <p className="mt-6 rounded-2xl glass-soft p-4 text-center text-sm text-muted-foreground">
            Check your email to confirm your address, then sign in.
          </p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-input/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-input/40"
              />
            </div>
            <Button type="submit" className="h-12 w-full text-base" disabled={busy}>
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
        )}

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="secondary" className="h-12 w-full text-base" onClick={google}>
          Continue with Google
        </Button>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setSent(false);
          }}
          className="mt-5 w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
