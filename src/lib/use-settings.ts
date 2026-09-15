import { useEffect, useMemo } from "react";
import { useLocalStorage } from "./use-local-storage";
import { applySettings, DEFAULT_SETTINGS, type Settings } from "./settings";

/** Read/write personalization settings and keep the DOM in sync with them. */
export function useSettings() {
  const [stored, setSettings] = useLocalStorage<Settings>(
    "pt.settings",
    DEFAULT_SETTINGS,
  );
  // Merge defaults so settings saved before a new field existed still resolve.
  const settings = useMemo(() => ({ ...DEFAULT_SETTINGS, ...stored }), [stored]);

  useEffect(() => {
    applySettings(settings);
    // In "system" mode, re-apply whenever the OS light/dark preference flips.
    if (settings.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applySettings(settings);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [settings]);

  function update(patch: Partial<Settings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  return { settings, update };
}
