import { useEffect, useState } from "react";
import { cn } from "../../lib/cn";
import { isSubmitEnter } from "../../lib/keyboard";
import { Modal } from "../../components/modal";
import { DatePicker } from "../../components/ui/date-picker";
import { TaskChecklist } from "./task-checklist";
import { STATUS_META, TASK_STATUSES, type Task } from "./task-types";
import type { TaskDraft } from "./use-todos";

type TaskDialogProps = {
  open: boolean;
  /** Prefilled fields (status from a column, due date from the calendar). */
  task: Task | null;
  onClose: () => void;
  onSubmit: (draft: TaskDraft) => void;
};

const EMPTY: TaskDraft = {
  title: "",
  description: "",
  dueDate: "",
  status: "todo",
  checklist: [],
};

/**
 * Create dialog — same layout as the detail "card back" (status pills, title,
 * due date, description, checklist) but fields are plain inputs gathered into a
 * draft and committed with one button, so the create/edit experience matches.
 */
export function TaskDialog({ open, task, onClose, onSubmit }: TaskDialogProps) {
  const [draft, setDraft] = useState<TaskDraft>(EMPTY);

  useEffect(() => {
    if (!open) return;
    setDraft(
      task
        ? {
            title: task.title,
            description: task.description,
            dueDate: task.dueDate,
            status: task.status,
            checklist: task.checklist ?? [],
          }
        : EMPTY,
    );
  }, [open, task]);

  function submit() {
    if (!draft.title.trim()) return;
    onSubmit({ ...draft, title: draft.title.trim() });
    onClose();
  }

  const statusPills = (
    <div className="flex flex-wrap gap-1.5">
      {TASK_STATUSES.map((s) => {
        const active = draft.status === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => setDraft((d) => ({ ...d, status: s }))}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-accent-strong text-white"
                : "bg-surface-muted text-ink-soft hover:bg-surface-hover",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                active ? "bg-white/80" : STATUS_META[s].dot,
              )}
            />
            {STATUS_META[s].label}
          </button>
        );
      })}
    </div>
  );

  return (
    <Modal open={open} wide title={statusPills} onClose={onClose}>
      <div className="space-y-5">
        {/* Title. */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Tiêu đề
          </p>
          <input
            autoFocus
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            onKeyDown={(e) => {
              if (isSubmitEnter(e)) submit();
            }}
            placeholder="Tên task..."
            className="w-full rounded-[var(--radius-inner)] bg-surface-muted px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:bg-surface-sunken focus:ring-2 focus:ring-accent/40"
          />
        </div>

        {/* Due date. */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Hạn chót
          </p>
          <DatePicker
            value={draft.dueDate}
            onChange={(iso) => setDraft((d) => ({ ...d, dueDate: iso }))}
            placeholder="Thêm hạn chót"
          />
        </div>

        {/* Description. */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Mô tả
          </p>
          <textarea
            rows={4}
            value={draft.description}
            onChange={(e) =>
              setDraft((d) => ({ ...d, description: e.target.value }))
            }
            placeholder="Thêm chi tiết (không bắt buộc)"
            className="w-full resize-none rounded-[var(--radius-inner)] bg-surface-muted p-3 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-faint focus:bg-surface-sunken focus:ring-2 focus:ring-accent/40"
          />
        </div>

        {/* Checklist. */}
        <div>
          <TaskChecklist
            items={draft.checklist ?? []}
            onChange={(checklist) => setDraft((d) => ({ ...d, checklist }))}
          />
        </div>

        <button
          type="button"
          onClick={submit}
          className="w-full rounded-[var(--radius-inner)] bg-btn py-2.5 text-sm font-semibold text-btn-ink transition-colors hover:opacity-90"
        >
          Thêm task
        </button>
      </div>
    </Modal>
  );
}
