import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Offline, `getUser()` can't reach the server — fall back to the session
    // stored on the device so the app still opens without a connection.
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) throw redirect({ to: "/auth" });
      return { user: data.session.user };
    }
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      const local = await supabase.auth.getSession();
      if (local.data.session?.user) return { user: local.data.session.user };
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
