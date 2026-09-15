import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

/** Wrap once near the app root so tooltips share a hover/focus delay. */
export const TooltipProvider = TooltipPrimitive.Provider;

type TooltipProps = {
  /** Text shown on hover/focus — give every icon-only control one. */
  label: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  children: ReactNode;
};

/** Hover/focus tooltip for controls without visible text (icon buttons, etc). */
export function Tooltip({ label, side = "top", children }: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={cn(
            "z-[80] select-none rounded-md bg-tooltip px-2 py-1 text-xs font-medium text-tooltip-ink",
            "data-[state=delayed-open]:animate-pop-in data-[state=instant-open]:animate-pop-in",
            "data-[state=closed]:animate-pop-out",
          )}
        >
          {label}
          <TooltipPrimitive.Arrow className="fill-tooltip" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
