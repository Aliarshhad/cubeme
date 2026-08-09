import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Home, Receipt, HandCoins, Settings, LogOut, History, User } from "lucide-react";
import type { ReactNode } from "react";

import { CubeWordmark } from "@/components/CubeLogo";
import { useProfile, useSignedUrl } from "@/hooks/use-cube";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import { useDailyReminder } from "@/lib/reminders";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/ledger", label: "Ledger", icon: HandCoins },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profile = useProfile();
  const avatar = useSignedUrl("avatars", profile.data?.avatar_url);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="glow-field min-h-screen">
      <header className="sticky top-0 z-30 glass-soft">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link to="/dashboard">
            <CubeWordmark />
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {tabs.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "bg-primary/20 text-foreground" }}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Link
              to="/profile"
              aria-label="Profile"
              className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {avatar.data ? (
                <img
                  src={avatar.data}
                  alt="Your profile picture"
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5" />
              )}
            </Link>
            <button
              onClick={signOut}
              aria-label="Sign out"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-primary/20 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pt-5 pb-28 sm:pb-12">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 glass-soft pb-[env(safe-area-inset-bottom)] sm:hidden">
        <div className="mx-auto flex max-w-3xl items-stretch justify-between px-2 py-1.5">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] uppercase tracking-wider text-muted-foreground transition-colors",
              )}
              activeProps={{ className: "bg-primary/20 text-foreground" }}
            >
              <t.icon className="h-5 w-5" />
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function GlassCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("glass rounded-3xl p-5", className)}>{children}</div>;
}
