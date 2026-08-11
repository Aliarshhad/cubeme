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

export async function fetchActivity(): Promise<ActivityEntry[]> {
  const { data, error } = await supabase
    .from("activity_log")
    .select("id, action, description, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as ActivityEntry[];
}
