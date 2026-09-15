/** Day-level date helpers shared by the todo board and calendar. */

/**
 * Format a Date as a local yyyy-mm-dd string. Using local components (not
 * toISOString, which is UTC) keeps due dates aligned with calendar cells and
 * the native date input regardless of the user's timezone.
 */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

/** Short Vietnamese label like "12 Th6" for chips and calendar cells. */
export function formatShortDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} Th${d.getMonth() + 1}`;
}

/** Relative urgency used to colour due-date chips. */
export function dueState(iso: string): "none" | "overdue" | "today" | "upcoming" {
  if (!iso) return "none";
  const today = todayIso();
  if (iso < today) return "overdue";
  if (iso === today) return "today";
  return "upcoming";
}
