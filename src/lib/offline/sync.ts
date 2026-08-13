import { supabase } from "@/integrations/supabase/client";

import { queueAll, queueRemove, type QueuedMutation } from "./db";
import {
  hydrateOfflineState,
  isOnline,
  markSynced,
  refreshPending,
  setOnline,
  setSyncing,
} from "./status";

type WriteResult = { error: { message: string } | null };
type LooseTable = {
  insert: (row: unknown) => Promise<WriteResult>;
  update: (patch: unknown) => { eq: (col: string, val: string) => Promise<WriteResult> };
  delete: () => { eq: (col: string, val: string) => Promise<WriteResult> };
  upsert: (row: unknown, opts: { onConflict: string }) => Promise<WriteResult>;
  select: (cols: string) => {
    eq: (col: string, val: string) => {
      maybeSingle: () => Promise<{ data: { updated_at?: string } | null }>;
    };
  };
};

const table_ = (name: string): LooseTable =>
  (supabase as unknown as { from: (n: string) => LooseTable }).from(name);

/** True when the server copy is newer than the offline edit — server wins. */
async function serverIsNewer(m: QueuedMutation) {
  if (m.op !== "update" || !m.rowId || !m.baseUpdatedAt) return false;
  try {
    const { data } = await table_(m.table).select("updated_at").eq("id", m.rowId).maybeSingle();
    if (!data?.updated_at) return false;
    return new Date(data.updated_at).getTime() > new Date(m.baseUpdatedAt).getTime();
  } catch {
    return false;
  }
}

let running = false;

export type SyncResult = { pushed: number; skipped: string[] };

/** Drains the offline queue in insertion order. Safe to call repeatedly. */
export async function drainQueue(): Promise<SyncResult> {
  const result: SyncResult = { pushed: 0, skipped: [] };
  if (running || !isOnline()) return result;
  const queue = await queueAll();
  if (queue.length === 0) {
    await markSynced();
    return result;
  }
  running = true;
  setSyncing(true);
  try {
    for (const m of queue) {
      const { data } = await supabase.auth.getSession();
      if (!data.session) break;
      if (await serverIsNewer(m)) {
        if (m.label) result.skipped.push(m.label);
        if (m.seq != null) await queueRemove(m.seq);
        continue;
      }
      let error: { message: string } | null = null;
      if (m.op === "insert") ({ error } = await table_(m.table).insert(m.payload));
      else if (m.op === "upsert")
        ({ error } = await table_(m.table).upsert(m.payload, {
          onConflict: m.onConflict ?? "id",
        }));
      else if (m.op === "update" && m.rowId)
        ({ error } = await table_(m.table).update(m.payload).eq("id", m.rowId));
      else if (m.op === "delete" && m.rowId)
        ({ error } = await table_(m.table).delete().eq("id", m.rowId));

      const duplicate = error?.message?.includes("duplicate key");
      if (error && !duplicate) {
        // Network blip: stop here and retry the rest on the next attempt.
        if (!isOnline()) break;
        // A permanent failure must not wedge the queue forever.
        if (m.seq != null) await queueRemove(m.seq);
        result.skipped.push(m.label || `${m.op} on ${m.table}`);
        continue;
      }
      if (m.seq != null) await queueRemove(m.seq);
      result.pushed += 1;
    }
    await markSynced();
  } finally {
    running = false;
    setSyncing(false);
    await refreshPending();
  }
  return result;
}

/**
 * Wires automatic background syncing: on load, on reconnect, on tab focus and
 * every couple of minutes. No buttons, no prompts.
 */
export function startOfflineSync(onSynced: (r: SyncResult) => void) {
  if (typeof window === "undefined") return () => {};

  const run = async () => {
    setOnline(isOnline());
    if (!isOnline()) return;
    const r = await drainQueue();
    if (r.pushed > 0 || r.skipped.length > 0) onSynced(r);
  };

  void hydrateOfflineState().then(run);

  const onOnline = () => void run();
  const onOffline = () => setOnline(false);
  const onVisible = () => {
    if (document.visibilityState === "visible") void run();
  };

  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  document.addEventListener("visibilitychange", onVisible);
  const timer = window.setInterval(() => void run(), 2 * 60 * 1000);

  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
    document.removeEventListener("visibilitychange", onVisible);
    window.clearInterval(timer);
  };
}
