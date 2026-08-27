/** URL helpers for the bookmark tracker. */

/** Add a protocol if the user pasted a bare domain, else return as-is. */
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Best-effort title from the host (real page title needs a backend/CORS). */
export function titleFromUrl(url: string): string {
  const host = hostname(url);
  const name = host.split(".")[0] ?? host;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Trim a verbose page title to its first meaningful segment, e.g.
 * "Stripe | Financial Infrastructure…" -> "Stripe". Keeps the full string if
 * the first segment is too short to be a real name.
 */
export function tidyTitle(title: string): string {
  const first = title.split(/\s[|–—:·-]\s/)[0]?.trim();
  return first && first.length >= 2 ? first : title.trim();
}
