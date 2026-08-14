export type ThemeName = "founder" | "taurus" | "butterfly" | "eclipse";

export const THEME_STORAGE_KEY = "cube-theme";

export const THEMES: {
  name: ThemeName;
  label: string;
  description: string;
  swatches: string[];
  themeColor: string;
}[] = [
  {
    name: "founder",
    label: "Founder",
    description: "Maroon noir — deep crimson glass over near-black.",
    swatches: ["#0a0507", "#3a0d16", "#8f1230", "#f43f5e"],
    themeColor: "#0a0507",
  },
  {
    name: "taurus",
    label: "Taurus",
    description: "Olive noir — deep forest green satin on black.",
    swatches: ["#050704", "#1b2412", "#42561f", "#7d9b3f"],
    themeColor: "#050704",
  },
  {
    name: "butterfly",
    label: "Butterfly",
    description: "Azure noir — midnight blue glass with electric cyan.",
    swatches: ["#03060f", "#0b1a3a", "#1461c4", "#38bdf8"],
    themeColor: "#03060f",
  },
  {
    name: "eclipse",
    label: "Eclipse",
    description: "Liquid bronze — molten copper and cream light over black.",
    swatches: ["#0b0907", "#3a2a1c", "#a9743c", "#f4dcc0"],
    themeColor: "#0b0907",
  },
];

export function isThemeName(value: unknown): value is ThemeName {
  return value === "founder" || value === "taurus" || value === "butterfly" || value === "eclipse";
}

export function themeColorFor(name: ThemeName) {
  return THEMES.find((t) => t.name === name)?.themeColor ?? "#0a0507";
}

/** Applies the theme to <html> and syncs the PWA status-bar colour. */
export function applyTheme(name: ThemeName) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset["theme"] = name;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = themeColorFor(name);
}

export const DEFAULT_THEME: ThemeName = "founder";

/** Per-account cache key, so one account's theme never paints another's session. */
function themeKey(userId: string) {
  return `${THEME_STORAGE_KEY}:${userId}`;
}

/** Cached theme for this account only; falls back to the default. */
export function readStoredTheme(userId?: string): ThemeName {
  if (typeof localStorage === "undefined" || !userId) return DEFAULT_THEME;
  const stored = localStorage.getItem(themeKey(userId));
  return isThemeName(stored) ? stored : DEFAULT_THEME;
}

export function storeTheme(name: ThemeName, userId?: string) {
  if (typeof localStorage === "undefined" || !userId) return;
  localStorage.setItem(themeKey(userId), name);
}

/** Drops every cached theme, including the legacy device-wide key. */
export function clearStoredThemes() {
  if (typeof localStorage === "undefined") return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k === THEME_STORAGE_KEY || k?.startsWith(`${THEME_STORAGE_KEY}:`)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}
