import type { Dispatch, SetStateAction } from "react";
import { useSnapshot, useTracker } from "../features/tracker/provider";
import type { Snapshot } from "../features/tracker/types";
// Compatibility adapter for existing v1 components. No individual hook writes storage.
export const STORAGE_FULL_EVENT = "pt:storage-full";
export function suspendPersistence() {
  /* Legacy helper is not mounted in v2. */
}
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  _options?: { debounce?: number },
): readonly [T, Dispatch<SetStateAction<T>>] {
  const snapshot = useSnapshot(),
    store = useTracker();
  const read = (s: Snapshot): T => {
    const values: Record<string, unknown> = {
      "pt.todos": s.tasks,
      "pt.settings": s.settings,
      "pt.bookmarks": s.resources,
      "pt.bookmark-groups": s.groups,
      "pt.todo-view": s.preferences.boardView,
      "pt.welcomed": s.welcomed,
      "pt.habits": s.habits,
    };
    return (values[key] ?? initialValue) as T;
  };
  const set: Dispatch<SetStateAction<T>> = (update) => {
    store.commit((s) => {
      const value =
        typeof update === "function"
          ? (update as (old: T) => T)(read(s))
          : update;
      switch (key) {
        case "pt.todos":
          s.tasks = value as Snapshot["tasks"];
          break;
        case "pt.settings":
          s.settings = { ...s.settings, ...(value as Snapshot["settings"]) };
          break;
        case "pt.bookmarks":
          s.resources = value as Snapshot["resources"];
          break;
        case "pt.bookmark-groups":
          s.groups = value as string[];
          break;
        case "pt.todo-view":
          s.preferences.boardView = value as "board" | "calendar";
          break;
        case "pt.welcomed":
          s.welcomed = Boolean(value);
          break;
        default:
          throw Error("Unsupported legacy writer: " + key);
      }
    });
  };
  return [read(snapshot), set];
}
