import { publicAssetUrl } from "./public-asset";

/** Per-browser personalization for the dashboard (board title, theme, etc). */

export type ThemeMode = "light" | "dark" | "system";

export type Settings = {
  boardTitle: string;
  theme: ThemeMode;
  /** Primary/accent colour as a hex string; drives every highlight. */
  primary: string;
  /** Background image path under /public, or "" for a plain backdrop. */
  background: string;
  /** Hide done tasks completed more than N days ago; 0 = never hide. */
  archiveDays: number;
};

export const DEFAULT_SETTINGS: Settings = {
  boardTitle: "Personal Tracker",
  theme: "light",
  primary: "#f43f5e",
  background: "/bg-2.jpg",
  archiveDays: 90,
};

/** Choices for the auto-hide threshold (Settings). */
export const ARCHIVE_DAY_OPTIONS = [
  { label: "30 ngày", value: 30 },
  { label: "90 ngày", value: 90 },
  { label: "180 ngày", value: 180 },
  { label: "1 năm", value: 365 },
  { label: "Không ẩn", value: 0 },
];

/** Choices for the manual "purge old done tasks" action (Settings). */
export const PURGE_DAY_OPTIONS = [
  { label: "30 ngày", value: 30 },
  { label: "90 ngày", value: 90 },
  { label: "180 ngày", value: 180 },
  { label: "1 năm", value: 365 },
];

// Curated, hue-ordered palette — rich/deep (≈600-level) steps, no near-
// duplicates. The custom picker covers anything in between.
export const PRIMARY_COLORS = [
  { name: "Rose", value: "#e11d48" },
  { name: "Hồng", value: "#db2777" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Blue", value: "#2563eb" },
  { name: "Bạc hà", value: "#0d9488" },
  { name: "Emerald", value: "#059669" },
  { name: "Amber", value: "#d97706" },
  { name: "Đào", value: "#ea580c" },
];

export const BACKGROUNDS = [
  { name: "Lá thu", value: "/bg.jpg" },
  { name: "Lá xanh", value: "/bg-2.jpg" },
  { name: "Khinh khí cầu", value: "/bg-3.jpg" },
  { name: "Bờ băng", value: "/bg-4.jpg" },
  { name: "Đồi cát đêm", value: "/bg-5.jpg" },
  { name: "Đèo tuyết", value: "/bg-6.jpg" },
  { name: "Sa mạc", value: "/bg-7.jpg" },
  { name: "Rừng thông", value: "/bg-8.jpg" },
];

/** Solid-colour backdrops, an alternative to the photographic backgrounds. */
export const BACKGROUND_COLORS = [
  { name: "Mận", value: "#6b5566" },
  { name: "Than", value: "#2b2b30" },
  { name: "Rêu", value: "#4b5d52" },
  { name: "Biển sâu", value: "#3a5a6b" },
  { name: "Cát ấm", value: "#a98c6b" },
  { name: "Hồng đất", value: "#8a5a5a" },
];

/** A background value pointing at a photo under /public. */
export function isImageBackground(bg: string): boolean {
  return bg.startsWith("/");
}

/** A background value holding a solid hex colour. */
export function isColorBackground(bg: string): boolean {
  return bg.startsWith("#");
}

/** True when `value` is not one of the listed presets (i.e. user-picked). */
export function isCustomColor(
  value: string,
  presets: { value: string }[],
): boolean {
  if (!value.startsWith("#")) return false;
  return !presets.some((p) => p.value.toLowerCase() === value.toLowerCase());
}

/**
 * Scale a hex colour down (preserving hue) until its WCAG relative luminance
 * is ≤ `max`. Colours already below `max` pass through unchanged.
 */
function darkenToLuminance(hex: string, max: number): string {
  const c = hex.replace("#", "");
  if (c.length < 6) return hex;
  const r0 = parseInt(c.slice(0, 2), 16);
  const g0 = parseInt(c.slice(2, 4), 16);
  const b0 = parseInt(c.slice(4, 6), 16);
  const toLin = (v: number) => {
    const n = v / 255;
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  };
  const lumAt = (k: number) =>
    0.2126 * toLin(r0 * k) + 0.7152 * toLin(g0 * k) + 0.0722 * toLin(b0 * k);
  let k = 1;
  if (lumAt(1) > max) {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (lumAt(mid) <= max) lo = mid;
      else hi = mid;
    }
    k = lo;
  }
  const hex2 = (n: number) =>
    Math.round(n * k)
      .toString(16)
      .padStart(2, "0");
  return `#${hex2(r0)}${hex2(g0)}${hex2(b0)}`;
}

/**
 * Darken an accent only as much as needed so white text clears ~4.5:1
 * contrast on a solid fill (0.183 = that luminance). Dark colours pass
 * through; bright ones (amber, emerald) deepen just enough to stay legible.
 */
function strongAccent(hex: string): string {
  return darkenToLuminance(hex, 0.183);
}

/**
 * Keep a custom backdrop dark enough to sit behind the translucent white
 * shell — a light pick (near-white) would wash the cards out. Cap luminance
 * to roughly the lightest preset backdrop ("Cát ấm").
 */
export function clampBackgroundColor(hex: string): string {
  return darkenToLuminance(hex, 0.3);
}

/** Resolve "system" to the OS preference; "light"/"dark" pass through. */
export function isDarkTheme(theme: ThemeMode): boolean {
  if (theme === "system") {
    return (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }
  return theme === "dark";
}

/** Push the current settings into the DOM (theme class, accent var, bg image). */
export function applySettings(s: Settings) {
  const root = document.documentElement;
  const isDark = isDarkTheme(s.theme);
  root.classList.toggle("dark", isDark);
  root.style.setProperty("--color-accent", s.primary);
  root.style.setProperty("--color-accent-strong", strongAccent(s.primary));
  // Dark theme dims the photo so bright images don't fight the dark UI.
  const dim = isDark ? "linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5))," : "";
  const bg = s.background;
  // Solid colour wins as-is; a photo path becomes the image; "" falls back
  // to the theme's default backdrop colour.
  document.body.style.backgroundColor = isColorBackground(bg)
    ? bg
    : isDark
      ? "#0c0c0e"
      : "#6b5566";
  document.body.style.backgroundImage = isImageBackground(bg)
    ? `${dim}url("${publicAssetUrl(bg)}")`
    : "none";
}
