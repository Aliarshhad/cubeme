import { openDB, type IDBPDatabase } from "idb";

/**
 * Local-first storage for Cube. Three stores:
 *  - `cache` : last synced snapshots, keyed `<userId>:<key>`
 *  - `queue` : pending mutations, auto-incrementing `seq` keeps insertion order
 *  - `meta`  : session bookkeeping (last sync, offline pass expiry)
 */
const DB_NAME = "cube-offline";
const DB_VERSION = 1;

export type QueueOp = "insert" | "update" | "delete" | "upsert";

export type QueuedMutation = {
  seq?: number;
  clientId: string;
  table: string;
  op: QueueOp;
  /** Row for insert/upsert, patch for update. */
  payload: Record<string, unknown>;
  /** Primary key for update/delete. */
  rowId?: string;
  onConflict?: string;
  /** `updated_at` of the row when the offline edit was made (server-wins check). */
  baseUpdatedAt?: string | null;
  label: string;
  created_at: string;
};

let dbp: Promise<IDBPDatabase> | null = null;

function db() {
  if (typeof window === "undefined" || !("indexedDB" in window)) return null;
  dbp ??= openDB(DB_NAME, DB_VERSION, {
    upgrade(d) {
      if (!d.objectStoreNames.contains("cache")) d.createObjectStore("cache");
      if (!d.objectStoreNames.contains("queue"))
        d.createObjectStore("queue", { keyPath: "seq", autoIncrement: true });
      if (!d.objectStoreNames.contains("meta")) d.createObjectStore("meta");
    },
  });
  return dbp;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const d = await db();
  if (!d) return null;
  try {
    return ((await d.get("cache", key)) as T | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown) {
  const d = await db();
  if (!d) return;
  try {
    await d.put("cache", value, key);
  } catch {
    /* storage is best-effort */
  }
}

export async function queueAdd(m: QueuedMutation) {
  const d = await db();
  if (!d) return;
  const { seq: _drop, ...rest } = m;
  await d.add("queue", rest);
}

export async function queueAll(): Promise<QueuedMutation[]> {
  const d = await db();
  if (!d) return [];
  try {
    const rows = (await d.getAll("queue")) as QueuedMutation[];
    return rows.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  } catch {
    return [];
  }
}

export async function queueRemove(seq: number) {
  const d = await db();
  if (!d) return;
  await d.delete("queue", seq);
}

export async function queueCount() {
  return (await queueAll()).length;
}

export async function metaGet<T>(key: string): Promise<T | null> {
  const d = await db();
  if (!d) return null;
  try {
    return ((await d.get("meta", key)) as T | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function metaSet(key: string, value: unknown) {
  const d = await db();
  if (!d) return;
  try {
    await d.put("meta", value, key);
  } catch {
    /* best-effort */
  }
}

/** Wipes everything — used on sign-out so a shared device leaks nothing. */
export async function clearOfflineData() {
  const d = await db();
  if (!d) return;
  try {
    await Promise.all([d.clear("cache"), d.clear("queue"), d.clear("meta")]);
  } catch {
    /* best-effort */
  }
}
