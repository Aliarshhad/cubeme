export type ThemeName = "founder" | "taurus";

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
    description: "Neon lime noir — electric green glow on black glass.",
    swatches: ["#0a1002", "#172800", "#65a800", "#9cff00"],
    themeColor: "#0a1002",
  },
];

export function isThemeName(value: unknown): value is ThemeName {
  return value === "founder" || value === "taurus";
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

export function readStoredTheme(): ThemeName {
  if (typeof localStorage === "undefined") return "founder";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeName(stored) ? stored : "founder";
}

export function storeTheme(name: ThemeName) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(THEME_STORAGE_KEY, name);
}
