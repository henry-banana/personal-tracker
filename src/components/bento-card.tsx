import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type BentoCardProps = {
  icon: LucideIcon;
  title: string;
  /** Optional element rendered at the far right of the fixed header. */
  action?: ReactNode;
  /** Grid placement classes (col/row span) supplied by the layout. */
  className?: string;
  /** When true the body scrolls instead of growing the card. */
  scrollBody?: boolean;
  children: ReactNode;
};

/**
 * Shared card shell: white surface, large rounding, no shadow, and a
 * fixed-height header (icon + title on the left, action on the right).
 * Every tracker renders inside one of these for a fully synced UI.
 */
export function BentoCard({
  icon: Icon,
  title,
  action,
  className,
  scrollBody = true,
  children,
}: BentoCardProps) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col rounded-[var(--radius-card)] border border-line bg-surface",
        className,
      )}
    >
      <header className="flex h-16 shrink-0 items-center gap-3 px-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-inner)] bg-surface-muted text-ink">
          <Icon size={18} strokeWidth={2} />
        </span>
        <h2 className="flex-1 truncate text-[15px] font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {action ? (
          <div className="flex items-center gap-2">{action}</div>
        ) : null}
      </header>
      <div
        className={cn(
          "min-h-0 flex-1 px-5 pb-5",
          scrollBody && "overflow-y-auto",
        )}
      >
        {children}
      </div>
    </section>
  );
}
