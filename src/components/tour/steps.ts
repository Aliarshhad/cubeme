export type TourStep = {
  /** Route the tour navigates to for this step. */
  route: "/dashboard" | "/expenses" | "/ledger" | "/history" | "/settings";
  /** Value of the data-tour attribute on the element to highlight. */
  target: string;
  text: string;
};

export const TOUR_STEPS: TourStep[] = [
  {
    route: "/dashboard",
    target: "available",
    text: "This is what's left to spend this month. It moves on its own as you spend, lend, borrow, or get paid back.",
  },
  {
    route: "/dashboard",
    target: "budget",
    text: "This is your monthly budget. Tap the pencil anytime to change it — Available updates right away.",
  },
  {
    route: "/dashboard",
    target: "pills",
    text: "These three numbers break down your budget: spent, lent to others, and borrowed from others.",
  },
  {
    route: "/dashboard",
    target: "add-expense",
    text: "Tap this every time you spend something. This one habit keeps everything else in Cube accurate.",
  },
  {
    route: "/dashboard",
    target: "scan",
    text: "Or snap a photo of a receipt — Cube reads the amount for you instead of typing it.",
  },
  {
    route: "/expenses",
    target: "category-filter",
    text: "Everything you've logged, sorted by category. Tap a category to filter it.",
  },
  {
    route: "/ledger",
    target: "ledger-actions",
    text: "Four kinds of money moving between you and other people — pick whichever matches what happened.",
  },
  {
    route: "/history",
    target: "history-toggle",
    text: "Switch between Daily and Monthly to look back on anything you've logged.",
  },
  {
    route: "/settings",
    target: "reminder",
    text: "Turn this on and Cube nudges you once a day so nothing slips through.",
  },
  {
    route: "/settings",
    target: "categories",
    text: "Customize your categories and currency — all from here.",
  },
];

export const TOUR_FLAG_KEY = "cube-tour-done";

/** Per-account backup flag, so one account finishing never suppresses another. */
export function tourFlagKey(userId: string) {
  return `${TOUR_FLAG_KEY}:${userId}`;
}
