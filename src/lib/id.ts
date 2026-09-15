/** Short unique id for client-side entities (tasks, notes, bookmarks). */
export function createId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
