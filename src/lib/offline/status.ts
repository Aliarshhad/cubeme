import { useSyncExternalStore } from "react";

import { metaGet, metaSet, queueCount } from "./db";

export type SyncStatus = "online" | "syncing" | "offline" | "sync-required";

/** How long a device may stay offline after a successful sync. */
export const OFFLINE_DAYS = 7;
const OFFLINE_MS = OFFLINE_DAYS * 24 * 60 * 60 * 1000;

const LAST_SYNC_KEY = "lastSyncAt";
const OFFLINE_UNTIL_KEY = "offlineUntil";

export type OfflineState = {
  online: boolean;
  syncing: boolean;
  pending: number;
  lastSyncAt: string | null;
  offlineUntil: string | null;
  status: SyncStatus;
  /** True when the 7-day offline pass has run out while offline. */
  readOnly: boolean;
};

function derive(s: Omit<OfflineState, "status" | "readOnly">): OfflineState {
  const expired = !s.online && (!s.offlineUntil || new Date(s.offlineUntil).getTime() < Date.now());
  const status: SyncStatus = s.online
    ? s.syncing || s.pending > 0
      ? "syncing"
      : "online"
    : expired
      ? "sync-required"
      : "offline";
  return { ...s, status, readOnly: expired };
}

let state: OfflineState = derive({
  online: true,
  syncing: false,
  pending: 0,
  lastSyncAt: null,
  offlineUntil: null,
});

const listeners = new Set<() => void>();

function set(patch: Partial<Omit<OfflineState, "status" | "readOnly">>) {
  const next = derive({
    online: patch.online ?? state.online,
    syncing: patch.syncing ?? state.syncing,
    pending: patch.pending ?? state.pending,
    lastSyncAt: patch.lastSyncAt !== undefined ? patch.lastSyncAt : state.lastSyncAt,
    offlineUntil: patch.offlineUntil !== undefined ? patch.offlineUntil : state.offlineUntil,
  });
  if (JSON.stringify(next) === JSON.stringify(state)) return;
  state = next;
  for (const l of listeners) l();
}

export function offlineSnapshot() {
  return state;
}

export function isOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

/** Read-only mode: viewing is fine, new writes are refused. */
export function isReadOnly() {
  return state.readOnly;
}

export function setSyncing(syncing: boolean) {
  set({ syncing });
}

export async function refreshPending() {
  set({ pending: await queueCount() });
}

/** A successful server round-trip: stamp the sync and extend the offline pass. */
export async function markSynced() {
  const now = new Date();
  const until = new Date(now.getTime() + OFFLINE_MS);
  const last = state.lastSyncAt ? new Date(state.lastSyncAt).getTime() : 0;
  if (now.getTime() - last < 15_000 && state.offlineUntil) return;
  await metaSet(LAST_SYNC_KEY, now.toISOString());
  await metaSet(OFFLINE_UNTIL_KEY, until.toISOString());
  set({ lastSyncAt: now.toISOString(), offlineUntil: until.toISOString() });
}

export async function hydrateOfflineState() {
  const [lastSyncAt, offlineUntil] = await Promise.all([
    metaGet<string>(LAST_SYNC_KEY),
    metaGet<string>(OFFLINE_UNTIL_KEY),
  ]);
  set({ lastSyncAt, offlineUntil, online: isOnline(), pending: await queueCount() });
}

export function setOnline(online: boolean) {
  set({ online });
}

export function subscribeOffline(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useOfflineStatus() {
  return useSyncExternalStore(subscribeOffline, offlineSnapshot, offlineSnapshot);
}

export const OFFLINE_READONLY_MESSAGE =
  "You've been offline for over 7 days — reconnect to the internet to keep adding to Cube.";
export const OFFLINE_NEEDS_NET = "Needs internet";
