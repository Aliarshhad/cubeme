import { createFileRoute, Link } from "@tanstack/react-router";
import { CloudCheck, HandCoins, PieChart, WalletMinimal } from "lucide-react";

import { CubeWordmark } from "@/components/CubeLogo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cube — Premium monthly budget planner" },
      {
        name: "description",
        content:
          "Cube is a liquid-glass budgeting app: set a monthly budget, log expenses by category, and track lending and borrowing that adjusts your balance automatically.",
      },
      { property: "og:title", content: "Cube — Premium monthly budget planner" },
      {
        property: "og:description",
        content:
          "Set a monthly budget, log expenses by category, and track lending and borrowing in one dark, glassy app.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: WalletMinimal,
    title: "Monthly budget",
    body: "Set a budget for each month and watch what is truly left, day by day.",
  },
  {
    icon: PieChart,
    title: "Your categories",
    body: "Travelling, Food, Strike, Home, Extra — rename them or add your own.",
  },
  {
    icon: HandCoins,
    title: "Lend & borrow",
    body: "Lending drops your balance, borrowing lifts it. Settle any time.",
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

        <h1 className="mt-10 font-marker text-6xl leading-[0.95] text-glow sm:text-7xl">
          Money loves water
        </h1>
        <p className="mt-5 max-w-lg text-base text-muted-foreground">
          A daily budgeting companion for monthly planning, it needs to move and flow to grow rather
          than stay still. When money sits in one place, it loses value, but when it circulates, it
          multiplies.
        </p>


        <Link
          to="/auth"
          className="mt-8 inline-flex h-14 items-center justify-center rounded-3xl bg-primary px-9 font-display text-base uppercase tracking-[0.16em] text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          Open Cube
        </Link>

        <div className="mt-14 grid w-full gap-3 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-3xl p-5 text-left">
              <f.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-3 font-display text-xl uppercase tracking-[0.1em]">{f.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
