import { createContext, useContext, useSyncExternalStore } from "react";
import type { TrackerStore } from "./persistence";
export const TrackerContext = createContext<TrackerStore | null>(null);
export function useTracker() {
  const store = useContext(TrackerContext);
  if (!store) throw Error("TrackerProvider missing");
  return store;
}
export function useSnapshot() {
  const store = useTracker();
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
export function useStorageError() {
  const store = useTracker();
  return useSyncExternalStore(store.subscribeError, store.getError);
}
