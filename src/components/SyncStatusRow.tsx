import { CloudCheck, CloudOff, RefreshCw, TriangleAlert } from "lucide-react";

import { GlassCard } from "@/components/AppShell";
import { OFFLINE_DAYS, useOfflineStatus } from "@/lib/offline";

const COPY = {
  online: {
    icon: CloudCheck,
    label: "Online",
    note: "Everything you add is saved straight away.",
  },
  syncing: {
    icon: RefreshCw,
    label: "Syncing",
    note: "Sending the changes you made offline.",
  },
  offline: {
    icon: CloudOff,
    label: "Offline",
    note: `Showing your last synced data. You can keep adding for ${OFFLINE_DAYS} days offline.`,
  },
  "sync-required": {
    icon: TriangleAlert,
    label: "Sync required",
    note: `You've been offline more than ${OFFLINE_DAYS} days. Reconnect to add anything new — your last synced data stays visible.`,
  },
} as const;

function lastSynced(iso: string | null) {
  if (!iso) return "Not synced yet";
  const d = new Date(iso);
  return `Last synced ${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })} · ${d.toLocaleTimeString(
    undefined,
    { hour: "numeric", minute: "2-digit" },
  )}`;
}

/** Live connection + sync state. Read-only: syncing is always automatic. */
export function SyncStatusRow() {
  const state = useOfflineStatus();
  const copy = COPY[state.status];
  const Icon = copy.icon;

  return (
    <GlassCard className="flex items-start gap-3">
      <Icon
        className={`mt-0.5 h-5 w-5 shrink-0 ${state.status === "syncing" ? "animate-spin text-primary" : state.status === "online" ? "text-primary" : "text-muted-foreground"}`}
      />
      <div className="min-w-0">
        <p className="font-display text-base tracking-tight">{copy.label}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{copy.note}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {lastSynced(state.lastSyncAt)}
          {state.pending > 0
            ? ` · ${state.pending} change${state.pending > 1 ? "s" : ""} waiting`
            : ""}
        </p>
      </div>
    </GlassCard>
  );
}
