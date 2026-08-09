import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Database, Eye, Lock, ShieldCheck, Trash2 } from "lucide-react";

import { CubeWordmark } from "@/components/CubeLogo";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy & data policy — Cube" },
      {
        name: "description",
        content:
          "How Cube handles your budgeting data: what is collected, how it is used, how long it is kept, how it is secured and how to delete it.",
      },
      { property: "og:title", content: "Privacy & data policy — Cube" },
      {
        property: "og:description",
        content:
          "What Cube collects, how each type of data is used, retention and deletion, security measures and your rights.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Privacy,
});

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Lock;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-4xl p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function Privacy() {
  return (
    <div className="glow-field min-h-screen">
      <main className="mx-auto max-w-2xl px-5 py-12">
        <Link to="/" className="inline-block">
          <CubeWordmark />
        </Link>

        <h1 className="mt-8 font-display text-4xl tracking-tight">Privacy &amp; data policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Cube is a personal finance app, so this page states plainly what is stored, why, where it
          lives and how to get rid of it. Last updated 9 August 2026.
        </p>

        <div className="mt-8 space-y-4">
          <Section icon={Eye} title="What we collect">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong className="text-foreground">Account info</strong> — your email address, the
                display name you choose and a profile picture if you upload one.
              </li>
              <li>
                <strong className="text-foreground">Financial entries you type</strong> — monthly
                budget amounts, expense amounts and categories, notes, and lending or borrowing
                amounts together with the person names you attach to them.
              </li>
              <li>
                <strong className="text-foreground">Receipt photos</strong> — only when you use the
                receipt scanner, plus the line items extracted from them.
              </li>
              <li>
                <strong className="text-foreground">Basic device and usage data</strong> — the
                minimum needed to keep the app running and to diagnose errors.
              </li>
            </ul>
            <p>
              Cube does not connect to your bank, does not ask for card numbers, and does not read
              your phone contacts or messages. Nothing is imported automatically — everything in
              Cube is there because you entered or uploaded it.
            </p>
          </Section>

          <Section icon={Database} title="What each type of data is used for">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Budget and expense data powers your dashboard, category breakdowns and history
                pages. That is its only use.
              </li>
              <li>
                Receipt photos are processed to extract the merchant, total and line items, and are
                then kept in your private storage so you can review a receipt later. You can delete
                any receipt photo at any time.
              </li>
              <li>
                Lending and borrowing contact names exist only to label rows in your own ledger.
                They are never shared with that person, never notified and never shared with anyone
                else.
              </li>
              <li>
                Device and usage data is used only for reliability and error diagnosis, never for
                profiling.
              </li>
            </ul>
            <p>Your data is never sold, rented, or used for advertising.</p>
          </Section>

          <Section icon={Trash2} title="Retention and deletion">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                When you delete an expense, ledger entry or receipt in the app, the record is
                removed from the database straight away.
              </li>
              <li>
                You can request deletion of your entire account. Once requested, your profile,
                budgets, expenses, ledger entries and receipt photos are removed within 30 days.
              </li>
              <li>
                Routine encrypted backups may retain a copy for up to 30 days after deletion before
                they roll over; nothing is restored from them except to recover from an outage.
              </li>
            </ul>
          </Section>

          <Section icon={Lock} title="Security">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Passwords are hashed and are never stored in a readable form — nobody, including the
                app owner, can read your password.
              </li>
              <li>All traffic between your device and the server is encrypted over HTTPS.</li>
              <li>
                Data is stored in a managed PostgreSQL database with per-user access rules, so a
                query can only ever return rows belonging to the signed-in account.
              </li>
              <li>
                Receipt photos and profile pictures live in private storage buckets that are not
                publicly listable; images are served only through short-lived signed links to their
                owner.
              </li>
              <li>Authentication, session tokens and password resets are handled by Supabase.</li>
            </ul>
          </Section>

          <Section icon={ShieldCheck} title="Your rights">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Access — you can view all of your data inside the app at any time.</li>
              <li>
                Correction — every entry, name, note, category and amount is editable from the
                screen it appears on.
              </li>
              <li>Export — you can request a copy of your data.</li>
              <li>Deletion — you can delete individual entries or request full account deletion.</li>
            </ul>
            <p>
              For access, export or deletion requests, contact{" "}
              <span className="text-foreground">privacy@example.com</span> — replace this with your
              own contact address before sharing the app publicly.
            </p>
          </Section>
        </div>

        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Cube
        </Link>
      </main>
    </div>
  );
}
