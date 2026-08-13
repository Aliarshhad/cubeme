import { createFileRoute, Link } from "@tanstack/react-router";
import { CloudCheck, HandCoins, PieChart, WalletMinimal } from "lucide-react";

import { CubeWordmark } from "@/components/CubeLogo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cube" },
      {
        name: "description",
        content:
          "Cube: Calculate your budget everyday.\nBudget your month, log expenses, and track who owes who — all in one app.",
      },
      { property: "og:title", content: "Cube" },
      {
        property: "og:description",
        content:
          "Cube: Calculate your budget everyday.\nBudget your month, log expenses, and track who owes who — all in one app.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: WalletMinimal,
    title: "Monthly budget",
    body: "Set what you've got for the month and watch what's actually left, day by day — not just what your bank balance says, since half of that is already owed to someone.",
  },
  {
    icon: PieChart,
    title: "Your categories",
    body: "Travelling, Food, Strike, Home, Extra — rename them or add your own.",
  },
  {
    icon: HandCoins,
    title: "Lend & borrow",
    body: "Stop keeping loans in your head, your notes app, or a WhatsApp chat you'll never scroll back to. Log what you lent and what you borrowed, and settle without the awkward “hey, remember that 3,000…”",
  },
  {
    icon: CloudCheck,
    title: "Cloud synced",
    body: "Your data is securely saved and available on any device.",
  },
];

function Landing() {
  return (
    <div className="glow-field min-h-screen">
      <main className="mx-auto flex max-w-3xl flex-col items-center px-5 py-16 text-center">
        <CubeWordmark className="scale-125" />

        <h1 className="mt-10 font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-glow sm:text-7xl">
          Money loves water
        </h1>
        <p className="mt-5 max-w-lg text-base text-muted-foreground">
          Money needs to move and flow to grow rather than stay still. When you circulates, it
          multiplies.
        </p>
        <p className="mt-3 max-w-lg text-sm text-muted-foreground">
          Cube is free while we build it. No card, no trial clock, no catch.
        </p>

        <span className="glass-soft mt-8 inline-flex items-center rounded-full px-4 py-1.5 text-xs font-medium tracking-tight text-foreground/80">
          Free during early access
        </span>

        <Link
          to="/auth"
          className="mt-4 inline-flex h-14 items-center justify-center rounded-3xl bg-primary px-9 font-display text-base font-semibold tracking-tight text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          Open Cube
        </Link>

        <div className="mt-14 grid w-full gap-3 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-3xl p-5 text-left">
              <f.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-3 font-display text-xl tracking-tight">{f.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>

        <Link
          to="/privacy"
          className="mt-12 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Privacy &amp; data policy
        </Link>
      </main>
    </div>
  );
}
