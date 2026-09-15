import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { Tooltip } from "./ui/tooltip";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Filled dark variant for primary actions, ghost for subtle ones. */
  variant?: "ghost" | "solid";
};

/** Square, pill-rounded icon button with an automatic tooltip from its label. */
export function IconButton({
  variant = "ghost",
  className,
  title,
  "aria-label": ariaLabel,
  ...props
}: IconButtonProps) {
  const label = title ?? ariaLabel;
  const button = (
    <button
      type="button"
      aria-label={ariaLabel}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        "disabled:cursor-not-allowed disabled:opacity-40",
        variant === "ghost" &&
          "bg-surface-muted text-ink-soft hover:bg-surface-hover/80 hover:text-ink",
        variant === "solid" && "bg-btn text-btn-ink hover:opacity-90",
        className,
      )}
      {...props}
    />
  );

  // Icon-only by design — always surface the label as a tooltip when present.
  return label ? <Tooltip label={label}>{button}</Tooltip> : button;
}
