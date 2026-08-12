/**
 * Manually maintained changelog. Add a new entry at the TOP of the array
 * whenever something ships. `date` is a plain display string.
 */
export type ChangelogEntry = { date: string; text: string };

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "Aug 12, 2026",
    text: "Added an \u201cInstall Cube\u201d option in Settings \u2014 add the app to your home screen in one tap on Android, or see the steps for iPhone.",
  },
  { date: "Aug 12, 2026", text: "New Cube logo across the app icon, header and loading screen." },
  { date: "Aug 12, 2026", text: "Fixed daily reminders failing to turn on." },
  { date: "Aug 11, 2026", text: "Fixed Sent and Received ledger entries failing to save." },

  { date: "Aug 11, 2026", text: "Added a 10-step guided tour, replayable from Settings." },
  { date: "Aug 11, 2026", text: "Settings reorganised into collapsible sections with their own pages." },
  { date: "Aug 11, 2026", text: "Lent entries now record both the lent date and the return date." },
  { date: "Aug 11, 2026", text: "History gained an Activity log of every change you make." },
  { date: "Aug 11, 2026", text: "Daily reminders now arrive even when the app is closed." },
  { date: "Aug 11, 2026", text: "Removed recurring expenses." },
  { date: "Aug 10, 2026", text: "Added the Taurus and Butterfly themes and a tumbling loading screen." },
  { date: "Aug 9, 2026", text: "Fixed dashboard numbers overflowing on large budgets." },
];
