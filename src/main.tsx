import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./v2.css";
import { App } from "./app";
import { ConfirmProvider } from "./components/confirm-dialog";
import { TooltipProvider } from "./components/ui/tooltip";
import { TrackerContext } from "./features/tracker/provider";
import { createStore } from "./features/tracker/persistence";
import { applySettings, DEFAULT_SETTINGS } from "./lib/settings";
import { Recovery } from "./features/tracker/recovery";
const root = createRoot(document.getElementById("root")!);
try {
  const store = createStore(window.localStorage);
  applySettings(store.getSnapshot().settings);
  root.render(
    <StrictMode>
      <TrackerContext.Provider value={store}>
        <TooltipProvider delayDuration={200}>
          <ConfirmProvider>
            <App />
          </ConfirmProvider>
        </TooltipProvider>
      </TrackerContext.Provider>
    </StrictMode>,
  );
} catch (error) {
  applySettings(DEFAULT_SETTINGS);
  root.render(
    <Recovery
      reason={error instanceof Error ? error.message : "invalid-snapshot"}
    />,
  );
}
requestAnimationFrame(() =>
  document.documentElement.classList.add("theme-ready"),
);
