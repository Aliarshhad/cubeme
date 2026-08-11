import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { GlassCard } from "@/components/AppShell";
import { CHANGELOG } from "@/lib/whats-new";

export const Route = createFileRoute("/_authenticated/settings/whats-new")({
  head: () => ({
    meta: [
      { title: "Cube — What's new" },
      {
        name: "description",
        content: "A plain, reverse-chronological list of changes and fixes shipped in Cube.",
      },
      { property: "og:title", content: "Cube — What's new" },
      { property: "og:description", content: "Recent changes and fixes in Cube." },
    ],
  }),
  component: WhatsNewPage,
});

function WhatsNewPage() {
  return (
    <div className="space-y-4">
      <Link
        to="/settings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Settings
      </Link>

      <GlassCard className="space-y-3">
        <h1 className="text-lg uppercase tracking-[0.14em]">What&apos;s new</h1>
        <ul className="divide-y divide-border">
          {CHANGELOG.map((entry, i) => (
            <li key={`${entry.date}-${i}`} className="py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {entry.date}
              </p>
              <p className="mt-1 text-sm">{entry.text}</p>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
