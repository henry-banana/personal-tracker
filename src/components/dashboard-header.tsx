import { LayoutDashboard, Settings as SettingsIcon } from "lucide-react";

type DashboardHeaderProps = {
  title: string;
  onOpenSettings: () => void;
};

/**
 * Slim header rendered as a bento card (opaque surface, same rounding as the
 * trackers) so it sits flush with the grid. Board title on the left, a single
 * labelled "Cài đặt" pill on the right (data actions live inside the modal).
 */
export function DashboardHeader({
  title,
  onOpenSettings,
}: DashboardHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-surface px-4 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <LayoutDashboard size={18} strokeWidth={2} />
        <h1 className="truncate text-lg font-semibold tracking-tight text-ink">
          {title}
        </h1>
      </div>
      <button
        type="button"
        onClick={onOpenSettings}
        className="flex h-9 shrink-0 items-center gap-2 rounded-[var(--radius-inner)] bg-btn pl-3.5 pr-4 text-sm font-semibold text-btn-ink transition-colors hover:opacity-90"
      >
        <SettingsIcon size={16} />
        Cài đặt
      </button>
    </header>
  );
}
