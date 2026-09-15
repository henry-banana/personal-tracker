import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import { toIsoDate, todayIso } from "../../lib/date";
import { IconButton } from "../../components/icon-button";
import { Modal } from "../../components/modal";
import { STATUS_META, type Task } from "./task-types";

type CalendarViewProps = {
  tasks: Task[];
  onOpen: (task: Task) => void;
  onCreateOn: (dateIso: string) => void;
};

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTHS = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`);

/** Month grid that drops each task onto its due date. */
export function CalendarView({ tasks, onOpen, onCreateOn }: CalendarViewProps) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  /** ISO date whose task list is shown in the day-detail dialog, or null. */
  const [dayView, setDayView] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const list = map.get(t.dueDate) ?? [];
      list.push(t);
      map.set(t.dueDate, list);
    }
    return map;
  }, [tasks]);

  const cells = useMemo(
    () => buildMonthCells(cursor.year, cursor.month),
    [cursor],
  );

  function shift(delta: number) {
    setCursor(({ year, month }) => {
      const next = new Date(year, month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  const today = todayIso();

  const dayTasksInView = dayView ? (byDate.get(dayView) ?? []) : [];

  return (
    <>
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">
          {MONTHS[cursor.month]} {cursor.year}
        </h3>
        <div className="flex items-center gap-1.5">
          <IconButton aria-label="Tháng trước" onClick={() => shift(-1)}>
            <ChevronLeft size={18} />
          </IconButton>
          <IconButton aria-label="Tháng sau" onClick={() => shift(1)}>
            <ChevronRight size={18} />
          </IconButton>
        </div>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-ink-faint">
            {d}
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 auto-rows-[minmax(88px,1fr)] grid-cols-7 gap-2 overflow-y-auto">
        {cells.map((cell) => {
          const dayTasks = byDate.get(cell.iso) ?? [];
          return (
            <button
              type="button"
              key={cell.iso}
              onClick={() => setDayView(cell.iso)}
              className={cn(
                "flex min-h-0 flex-col gap-1 overflow-hidden rounded-[0.85rem] p-1.5 text-left transition-colors",
                cell.inMonth ? "bg-surface-sunken hover:bg-surface-muted" : "bg-transparent",
              )}
            >
              <span
                className={cn(
                  "grid h-5 w-5 place-items-center rounded-full text-[11px] font-medium",
                  cell.iso === today
                    ? "bg-accent-strong text-white"
                    : cell.inMonth
                      ? "text-ink-soft"
                      : "text-ink-faint/60",
                )}
              >
                {cell.day}
              </span>
              <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
                {dayTasks.slice(0, 2).map((t) => (
                  <span
                    key={t.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(t);
                    }}
                    className={cn(
                      "cursor-pointer truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-tight",
                      STATUS_META[t.status].chip,
                    )}
                  >
                    {t.title}
                  </span>
                ))}
                {dayTasks.length > 2 ? (
                  <span className="px-1 text-[10px] text-ink-faint">
                    +{dayTasks.length - 2}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>

      <Modal
        open={dayView !== null}
        title={dayView ? formatFullDate(dayView) : ""}
        onClose={() => setDayView(null)}
      >
        <div className="space-y-3">
          {dayTasksInView.length > 0 ? (
            <div className="space-y-1.5">
              {dayTasksInView.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onOpen(t);
                    setDayView(null);
                  }}
                  className="flex w-full items-start gap-3 rounded-[var(--radius-inner)] bg-surface-sunken px-3 py-2.5 text-left transition-colors hover:bg-surface-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {t.title}
                    </p>
                    {t.description ? (
                      <p className="mt-0.5 truncate text-xs text-ink-faint">
                        {t.description}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      STATUS_META[t.status].chip,
                    )}
                  >
                    {STATUS_META[t.status].label}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="py-2 text-center text-sm text-ink-faint">
              Chưa có task nào trong ngày này.
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              if (dayView) onCreateOn(dayView);
              setDayView(null);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-inner)] bg-btn py-2.5 text-sm font-semibold text-btn-ink transition-colors hover:opacity-90"
          >
            <Plus size={16} />
            Thêm task ngày này
          </button>
        </div>
      </Modal>
    </>
  );
}

/** Full Vietnamese date label for the day-detail dialog title. */
function formatFullDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const weekday = [
    "Chủ nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ][d.getDay()];
  return `${weekday}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

type Cell = { iso: string; day: number; inMonth: boolean };

/** Build a Monday-first grid with exactly the weeks the month spans. */
function buildMonthCells(year: number, month: number): Cell[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Mon = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = Math.ceil((offset + daysInMonth) / 7);
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return {
      iso: toIsoDate(d),
      day: d.getDate(),
      inMonth: d.getMonth() === month,
    };
  });
}
