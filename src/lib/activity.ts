import { supabase } from "@/integrations/supabase/client";
import { logActivityRow, queueAll, readValue } from "@/lib/offline";

export type ActivityEntry = {
  id: string;
  action: string;
  description: string;
  created_at: string;
};

/**
 * Append-only activity trail. Never throws into the UI — a failed log entry
 * must not break the action the user actually performed. Offline entries are
 * written locally and pushed with the sync queue.
 */
export async function logActivity(action: string, description: string) {
  try {
    await logActivityRow(description, action);
  } catch {
    /* activity logging is best-effort */
  }
}

export const ACTIVITY_PAGE_SIZE = 50;

/** Newest-first page of activity entries. `page` is zero-based. */
export async function fetchActivity(page = 0): Promise<ActivityEntry[]> {
  const from = page * ACTIVITY_PAGE_SIZE;
  const fetcher = async () => {
    const { data, error } = await supabase
      .from("activity_log")
      .select("id, action, description, created_at")
      .order("created_at", { ascending: false })
      .range(from, from + ACTIVITY_PAGE_SIZE - 1);
    if (error) throw error;
    return (data ?? []) as ActivityEntry[];
  };

  const rows = await readValue<ActivityEntry[]>(
    `activity:${page}`,
    fetcher,
    (cached) => cached ?? [],
  );
  if (page > 0) return rows;

  // Entries still waiting to sync belong at the top of the feed.
  const pending = (await queueAll())
    .filter((m) => m.table === "activity_log" && m.op === "insert")
    .map((m) => m.payload as unknown as ActivityEntry);
  const seen = new Set(rows.map((r) => r.id));
  return [...pending.filter((p) => !seen.has(p.id)), ...rows].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  );
}
