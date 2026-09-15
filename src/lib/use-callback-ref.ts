import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a stable callback identity that always invokes the latest function.
 * Lets effects depend on a handler without re-running when it changes.
 */
export function useCallbackRef<Args extends unknown[], R>(
  callback: (...args: Args) => R,
) {
  const ref = useRef(callback);

  useEffect(() => {
    ref.current = callback;
  });

  return useCallback((...args: Args) => ref.current(...args), []);
}
