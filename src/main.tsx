import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./app";
import { ConfirmProvider } from "./components/confirm-dialog";
import { TooltipProvider } from "./components/ui/tooltip";
import { seedSampleDataIfEmpty } from "./lib/sample-data";
import { applySettings, DEFAULT_SETTINGS, type Settings } from "./lib/settings";

// Apply saved theme/accent/background before first paint to avoid a flash.
try {
  const raw = window.localStorage.getItem("pt.settings");
  applySettings(raw ? (JSON.parse(raw) as Settings) : DEFAULT_SETTINGS);
} catch {
  applySettings(DEFAULT_SETTINGS);
}

// First-ever visit lands on a populated board so the welcome tour has content.
if (window.localStorage.getItem("pt.welcomed") === null) {
  seedSampleDataIfEmpty();
}

// Enable accent cross-fade only after the first paint, so the initial colour
// is applied instantly (no sweep) but later changes animate.
requestAnimationFrame(() =>
  document.documentElement.classList.add("theme-ready"),
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TooltipProvider delayDuration={200} skipDelayDuration={300}>
      <ConfirmProvider>
        <App />
      </ConfirmProvider>
    </TooltipProvider>
  </StrictMode>,
);
