import { Check, Flame, Plus, Repeat, X } from "lucide-react";
import { useState } from "react";
import { BentoCard } from "../../components/bento-card";
import { Tooltip } from "../../components/ui/tooltip";
import { cn } from "../../lib/cn";
import { todayIso } from "../../lib/date";
import { currentStreak, last7Days, useHabits, type Habit } from "./use-habits";

/** Daily habit tracker: check off today, see streak + last-7-days grid. */
export function HabitCard({ className }: { className?: string }) {
  const { habits, addHabit, removeHabit, toggleToday } = useHabits();
  const [draft, setDraft] = useState("");

  function submit() {
    addHabit(draft);
    setDraft("");
  }

  return (
    <BentoCard
      icon={Repeat}
      title="Thói quen"
      scrollBody={false}
      className={className}
    >
      <div className="flex h-full flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-0.5">
          {habits.length === 0 ? (
            <p className="grid flex-1 place-items-center text-center text-sm text-ink-faint">
              Chưa có thói quen nào.
              <br />
              Thêm một cái bên dưới để bắt đầu.
            </p>
          ) : (
            habits.map((h) => (
              <HabitRow
                key={h.id}
                habit={h}
                onToggle={() => toggleToday(h.id)}
                onRemove={() => removeHabit(h.id)}
              />
            ))
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mt-3 flex shrink-0 items-center gap-2"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Thêm thói quen mới..."
            className="min-w-0 flex-1 rounded-[var(--radius-inner)] bg-surface-muted px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:bg-surface-sunken focus:ring-2 focus:ring-accent/40"
          />
          <Tooltip label="Thêm thói quen">
            <button
              type="submit"
              aria-label="Thêm thói quen"
              className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-btn text-btn-ink transition-colors hover:opacity-90"
            >
              <Plus size={18} />
            </button>
          </Tooltip>
        </form>
      </div>
    </BentoCard>
  );
}

function HabitRow({
  habit,
  onToggle,
  onRemove,
}: {
  habit: Habit;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const doneToday = habit.done.includes(todayIso());
  const streak = currentStreak(habit.done);

  return (
    <div className="group flex items-center rounded-[var(--radius-inner)] bg-surface-sunken px-3 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Tooltip label={doneToday ? "Bỏ đánh dấu hôm nay" : "Đánh dấu hôm nay"}>
          <button
            type="button"
            onClick={onToggle}
            aria-label={doneToday ? "Bỏ đánh dấu hôm nay" : "Đánh dấu hôm nay"}
            className={cn(
              "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
              doneToday
                ? "border-transparent bg-accent-strong text-white"
                : "border-line text-transparent hover:border-ink-faint",
            )}
          >
            <Check size={13} strokeWidth={3} />
          </button>
        </Tooltip>

        <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
          {habit.name}
        </p>

        {/* Seven dots = the last 7 days (oldest → today, today is the largest). */}
        <div className="flex shrink-0 items-center gap-1">
          {last7Days(habit.done).map((d) => (
            <span
              key={d.iso}
              title={d.iso}
              className={cn(
                "rounded-full",
                d.isToday ? "h-2.5 w-2.5" : "h-2 w-2",
                d.done ? "bg-accent" : "bg-surface-hover",
              )}
            />
          ))}
        </div>

        {/* Streak count as a fire-and-day label, not a bare number. */}
        {streak > 0 ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-ink-soft">
            <Flame size={13} className="text-amber-500" />
            <span className="tabular-nums">{streak} ngày</span>
          </span>
        ) : null}
      </div>

      {/* Slides in from the right on hover, pushing the row left (no overlay). */}
      <Tooltip label="Xoá thói quen">
        <button
          type="button"
          onClick={onRemove}
          aria-label="Xoá thói quen"
          className="grid h-7 w-0 shrink-0 place-items-center overflow-hidden rounded-full text-ink-faint opacity-0 transition-all duration-200 hover:bg-surface-hover hover:text-ink group-hover:ml-2 group-hover:w-7 group-hover:opacity-100"
        >
          <X size={14} />
        </button>
      </Tooltip>
    </div>
  );
}
