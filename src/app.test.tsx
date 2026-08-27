import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { App } from "./app";
import { ConfirmProvider } from "./components/confirm-dialog";
import { TooltipProvider } from "./components/ui/tooltip";

function renderApp() {
  return render(
    <TooltipProvider>
      <ConfirmProvider>
        <App />
      </ConfirmProvider>
    </TooltipProvider>,
  );
}

describe("dashboard composition", () => {
  beforeEach(() => {
    window.localStorage.setItem("pt.welcomed", JSON.stringify(true));
  });

  test("keeps Todo Board and Calendar while showing only Resources and Habits beside it", () => {
    renderApp();

    expect(screen.getByRole("heading", { name: "Todo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Board" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lịch" })).toBeInTheDocument();
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getByText("Thói quen")).toBeInTheDocument();

    expect(screen.queryByText("Pomodoro")).not.toBeInTheDocument();
    expect(screen.queryByText("Ghi chú")).not.toBeInTheDocument();
  });
});
