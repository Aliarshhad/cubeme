import { supabase } from "@/integrations/supabase/client";

import { cacheGet, cacheSet, queueAdd, queueAll, type QueuedMutation } from "./db";
import { currentUserId } from "./session";
import {
  OFFLINE_READONLY_MESSAGE,
  isOnline,
  isReadOnly,
  markSynced,
  refreshPending,
} from "./status";

/* ---------------- reads ---------------- */

async function key(k: string) {
  const uid = await currentUserId();
  return `${uid ?? "anon"}:${k}`;
}

function overlay<T extends { id: string }>(
  rows: T[],
  ops: QueuedMutation[],
  table: string,
): T[] {
  let out = [...rows];
  for (const op of ops) {
    if (op.table !== table) continue;
    if (op.op === "insert") {
      const row = op.payload as unknown as T;
      if (!out.some((r) => r.id === row.id)) out = [row, ...out];
    } else if (op.op === "update" && op.rowId) {
      out = out.map((r) => (r.id === op.rowId ? ({ ...r, ...op.payload } as T) : r));
    } else if (op.op === "delete" && op.rowId) {
      out = out.filter((r) => r.id !== op.rowId);
    }
  }
  return out;
}

/**
 * Row list read. Online: fetch, cache, extend the offline pass. Offline (or on a
 * failed fetch): last snapshot with pending offline changes layered on top.
 */
export async function readRows<T extends { id: string }>(
  cacheKey: string,
  table: string,
  fetcher: () => Promise<T[]>,
  opts?: { filter?: (row: T) => boolean; sort?: (a: T, b: T) => number },
): Promise<T[]> {
  const ck = await key(cacheKey);
  if (isOnline()) {
    try {
      const rows = await fetcher();
      await cacheSet(ck, rows);
      void markSynced();
      return rows;
    } catch (e) {
      const cached = await cacheGet<T[]>(ck);
      if (!cached) throw e;
    }
  }
  const cached = (await cacheGet<T[]>(ck)) ?? [];
  let rows = overlay(cached, await queueAll(), table);
  if (opts?.filter) rows = rows.filter(opts.filter);
  if (opts?.sort) rows = rows.sort(opts.sort);
  return rows;
}

/** Non-list read (scalars, single objects) with a caller-supplied offline view. */
export async function readValue<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  offlineView?: (cached: T | null, ops: QueuedMutation[]) => T,
): Promise<T> {
  const ck = await key(cacheKey);
  if (isOnline()) {
    try {
      const value = await fetcher();
      await cacheSet(ck, value);
      void markSynced();
      return value;
    } catch (e) {
      const cached = await cacheGet<T>(ck);
      if (cached == null) throw e;
    }
  }
  const cached = await cacheGet<T>(ck);
  const ops = await queueAll();
  if (offlineView) return offlineView(cached, ops);
  if (cached == null) throw new Error("Not available offline yet");
  return cached;
}

/* ---------------- writes ---------------- */

export function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function logActivityRow(label: string, action: string) {
  const user_id = await currentUserId();
  if (!user_id || !label) return;
  const row = {
    id: newId(),
    user_id,
    action,
    description: label,
    created_at: new Date().toISOString(),
  };
  if (isOnline()) {
    try {
      await supabase.from("activity_log").insert(row);
      return;
    } catch {
      /* fall through to the queue */
    }
  }
  await queueAdd({
    clientId: row.id,
    table: "activity_log",
    op: "insert",
    payload: row,
    label,
    created_at: row.created_at,
  });
  void refreshPending();
}

type WriteMeta = { activity?: string; action?: string };

function guard() {
  if (isReadOnly()) throw new Error(OFFLINE_READONLY_MESSAGE);
}

async function queueWrite(m: Omit<QueuedMutation, "created_at" | "clientId"> & { clientId?: string }) {
  await queueAdd({
    clientId: m.clientId ?? newId(),
    created_at: new Date().toISOString(),
    ...m,
  } as QueuedMutation);
  void refreshPending();
}

/** Insert with a client-generated id, so a retry can never duplicate the row. */
export async function writeInsert(
  table: string,
  row: Record<string, unknown>,
  meta: WriteMeta = {},
): Promise<string> {
  guard();
  const user_id = await currentUserId();
  if (!user_id) throw new Error("Not signed in");
  const full = { id: newId(), user_id, ...row };
  if (isOnline()) {
    const { error } = await supabase.from(table).insert(full as never);
    if (error) throw error;
  } else {
    await queueWrite({
      clientId: full.id as string,
      table,
      op: "insert",
      payload: full,
      label: meta.activity ?? "",
    });
  }
  if (meta.activity) await logActivityRow(meta.activity, meta.action ?? table);
  return full.id as string;
}

export async function writeUpdate(
  table: string,
  id: string,
  patch: Record<string, unknown>,
  meta: WriteMeta & { baseUpdatedAt?: string | null } = {},
) {
  guard();
  if (isOnline()) {
    const { error } = await supabase.from(table).update(patch as never).eq("id", id);
    if (error) throw error;
  } else {
    await queueWrite({
      table,
      op: "update",
      rowId: id,
      payload: patch,
      baseUpdatedAt: meta.baseUpdatedAt ?? new Date().toISOString(),
      label: meta.activity ?? "",
    });
  }
  if (meta.activity) await logActivityRow(meta.activity, meta.action ?? table);
}

export async function writeDelete(table: string, id: string, meta: WriteMeta = {}) {
  guard();
  if (isOnline()) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw error;
  } else {
    await queueWrite({ table, op: "delete", rowId: id, payload: {}, label: meta.activity ?? "" });
  }
  if (meta.activity) await logActivityRow(meta.activity, meta.action ?? table);
}

export async function writeUpsert(
  table: string,
  row: Record<string, unknown>,
  onConflict: string,
  meta: WriteMeta = {},
) {
  guard();
  const user_id = await currentUserId();
  if (!user_id) throw new Error("Not signed in");
  const full = { user_id, ...row };
  if (isOnline()) {
    const { error } = await supabase.from(table).upsert(full as never, { onConflict });
    if (error) throw error;
  } else {
    await queueWrite({ table, op: "upsert", payload: full, onConflict, label: meta.activity ?? "" });
  }
  if (meta.activity) await logActivityRow(meta.activity, meta.action ?? table);
}

export { logActivityRow };
