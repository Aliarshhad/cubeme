import { supabase } from "@/integrations/supabase/client";

export type ActivityEntry = {
  id: string;
  action: string;
  description: string;
  created_at: string;
};

/**
 * Append-only activity trail. Never throws into the UI — a failed log entry
 * must not break the action the user actually performed.
 */
export async function logActivity(action: string, description: string) {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;
    await supabase.from("activity_log").insert({ user_id: user.id, action, description });
  } catch {
    /* activity logging is best-effort */
  }
}

export const ACTIVITY_PAGE_SIZE = 50;

/** Newest-first page of activity entries. `page` is zero-based. */
export async function fetchActivity(page = 0): Promise<ActivityEntry[]> {
  const from = page * ACTIVITY_PAGE_SIZE;
  const { data, error } = await supabase
    .from("activity_log")
    .select("id, action, description, created_at")
    .order("created_at", { ascending: false })
    .range(from, from + ACTIVITY_PAGE_SIZE - 1);
  if (error) throw error;
  return (data ?? []) as ActivityEntry[];
}
