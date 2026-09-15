import { useMemo } from "react";
import { createId } from "../../lib/id";
import { useLocalStorage } from "../../lib/use-local-storage";
import { TASK_STATUSES, type Task, type TaskStatus } from "./task-types";

export type TaskDraft = Pick<
  Task,
  "title" | "description" | "dueDate" | "status" | "checklist"
>;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A done task completed more than `days` ago — folded away on the board to
 * reduce clutter. `days <= 0` disables hiding entirely.
 */
export function isArchivedDone(t: Task, days: number): boolean {
  if (days <= 0) return false;
  return (
    t.status === "done" && t.doneAt != null && Date.now() - t.doneAt > days * DAY_MS
  );
}

/** Stamp doneAt when a task enters "done"; clear it when it leaves. */
function stampDone(tasks: Task[]): Task[] {
  const now = Date.now();
  return tasks.map((t) => {
    if (t.status === "done") return t.doneAt != null ? t : { ...t, doneAt: now };
    return t.doneAt != null ? { ...t, doneAt: undefined } : t;
  });
}

/** Source of truth for tasks with grouping + CRUD + status moves. */
export function useTodos() {
  const [tasks, setRawTasks] = useLocalStorage<Task[]>("pt.todos", []);

  // Every write runs through stampDone so doneAt stays correct no matter which
  // path changed the status (dialog edit, status pill, or drag to the column).
  const setTasks: typeof setRawTasks = (updater) =>
    setRawTasks((prev) =>
      stampDone(typeof updater === "function" ? updater(prev) : updater),
    );

  const byStatus = useMemo(() => {
    const groups = Object.fromEntries(
      TASK_STATUSES.map((s) => [s, [] as Task[]]),
    ) as Record<TaskStatus, Task[]>;
    for (const task of tasks) groups[task.status].push(task);
    return groups;
  }, [tasks]);

  function addTask(draft: TaskDraft) {
    setTasks((prev) => [
      { ...draft, id: createId(), createdAt: Date.now() },
      ...prev,
    ]);
  }

  function updateTask(id: string, draft: TaskDraft) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...draft } : t)),
    );
  }

  /** Inline auto-save: merge a partial patch into one task. */
  function patchTask(id: string, patch: Partial<Omit<Task, "id" | "createdAt">>) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  }

  function moveTask(id: string, status: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  /** Replace the whole task list — used by drag-sort to persist new order/status. */
  function reorderTasks(next: Task[]) {
    setTasks(next);
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return {
    tasks,
    byStatus,
    addTask,
    updateTask,
    patchTask,
    moveTask,
    reorderTasks,
    removeTask,
  };
}
