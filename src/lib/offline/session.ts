import { supabase } from "@/integrations/supabase/client";

/**
 * Offline-safe user id. `getUser()` hits the network, so we read the locally
 * persisted session first and only fall back to the server call.
 */
export async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const id = data.session?.user?.id;
    if (id) return id;
  } catch {
    /* fall through */
  }
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}
