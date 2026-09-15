import { useMemo } from "react";
import { createId } from "../../lib/id";
import { useSnapshot, useTracker } from "../tracker/provider";
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
    t.status === "done" &&
    t.doneAt != null &&
    Date.now() - t.doneAt > days * DAY_MS
  );
}

/** Source of truth for tasks with grouping + CRUD + status moves. */
export function useTodos() {
  const { tasks } = useSnapshot();
  const store = useTracker();
  // The shared store stamps completion and removes orphan placements atomically.
  const setTasks = (update: (current: Task[]) => Task[]) =>
    store.commit((state) => {
      state.tasks = update(state.tasks);
    });

  const byStatus = useMemo(() => {
    const groups = Object.fromEntries(
      TASK_STATUSES.map((s) => [s, [] as Task[]]),
    ) as Record<TaskStatus, Task[]>;
    for (const task of tasks) groups[task.status].push(task);
    return groups;
  }, [tasks]);

  function addTask(draft: TaskDraft) {
    return setTasks((prev) => [
      { ...draft, id: createId(), createdAt: Date.now() },
      ...prev,
    ]);
  }

  function updateTask(id: string, draft: TaskDraft) {
    return setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...draft } : t)),
    );
  }

  /** Inline auto-save: merge a partial patch into one task. */
  function patchTask(
    id: string,
    patch: Partial<Omit<Task, "id" | "createdAt">>,
  ) {
    return setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  }

  function moveTask(id: string, status: TaskStatus) {
    return setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t)),
    );
  }

  /** Replace the whole task list — used by drag-sort to persist new order/status. */
  function reorderTasks(next: Task[]) {
    // Reconcile the order/status gesture with the newest stored task contents.
    // A drag cannot overwrite another tab's checklist or delete its new task.
    return setTasks((current) => {
      const latest = new Map(current.map((task) => [task.id, task]));
      const ordered = next.flatMap((task) => {
        const stored = latest.get(task.id);
        if (!stored) return [];
        latest.delete(task.id);
        const before = tasks.find((item) => item.id === task.id);
        return [
          {
            ...stored,
            status:
              before?.status !== task.status ? task.status : stored.status,
          },
        ];
      });
      return [...ordered, ...latest.values()];
    });
  }

  function removeTask(id: string) {
    return setTasks((prev) => prev.filter((t) => t.id !== id));
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
