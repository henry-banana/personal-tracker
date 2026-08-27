import { Calendar, KanbanSquare, ListChecks, Plus } from "lucide-react";
import { useState } from "react";
import { BentoCard } from "../../components/bento-card";
import { cn } from "../../lib/cn";
import { useLocalStorage } from "../../lib/use-local-storage";
import { CalendarView } from "./calendar-view";
import { KanbanBoard } from "./kanban-board";
import { TaskDetailDialog } from "./task-detail-dialog";
import { TaskDialog } from "./task-dialog";
import type { Task, TaskStatus } from "./task-types";
import { useTodos } from "./use-todos";

type View = "board" | "calendar";

type TodoCardProps = { className?: string; archiveDays: number };

/** Main 2x2 tracker: kanban board or calendar over the same task list. */
export function TodoCard({ className, archiveDays }: TodoCardProps) {
  const { tasks, byStatus, addTask, patchTask, reorderTasks, removeTask } =
    useTodos();
  const [view, setView] = useLocalStorage<View>("pt.todo-view", "board");
  // Creating uses the quick form; opening an existing card uses the detail view.
  const [createTask, setCreateTask] = useState<Task | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailTask = detailId
    ? (tasks.find((t) => t.id === detailId) ?? null)
    : null;

  function openNew(opts: { dueDate?: string; status?: TaskStatus } = {}) {
    setCreateTask({
      ...BLANK,
      dueDate: opts.dueDate ?? "",
      status: opts.status ?? "todo",
    } as Task);
  }

  return (
    <BentoCard
      icon={ListChecks}
      title="Todo"
      scrollBody={false}
      className={className}
      action={
        <>
          <div className="flex items-center gap-1 rounded-full bg-surface-muted p-1">
            <ViewTab
              active={view === "board"}
              onClick={() => setView("board")}
              label="Board"
            >
              <KanbanSquare size={15} />
              <span className="hidden sm:inline">Board</span>
            </ViewTab>
            <ViewTab
              active={view === "calendar"}
              onClick={() => setView("calendar")}
              label="Lịch"
            >
              <Calendar size={15} />
              <span className="hidden sm:inline">Lịch</span>
            </ViewTab>
          </div>
          <button
            type="button"
            onClick={() => openNew()}
            className="flex h-9 items-center gap-1.5 rounded-[var(--radius-inner)] bg-btn pl-3 pr-3.5 text-[13px] font-semibold text-btn-ink transition-colors hover:opacity-90"
          >
            <Plus size={16} />
            Thêm task
          </button>
        </>
      }
    >
      {view === "board" ? (
        <KanbanBoard
          byStatus={byStatus}
          onReorder={reorderTasks}
          onOpen={(task) => setDetailId(task.id)}
          onAddTask={(status) => openNew({ status })}
          archiveDays={archiveDays}
        />
      ) : (
        <CalendarView
          tasks={tasks}
          onOpen={(task) => setDetailId(task.id)}
          onCreateOn={(date) => openNew({ dueDate: date })}
        />
      )}

      <TaskDialog
        open={createTask !== null}
        task={createTask}
        onClose={() => setCreateTask(null)}
        onSubmit={addTask}
      />

      <TaskDetailDialog
        task={detailTask}
        onClose={() => setDetailId(null)}
        onPatch={(patch) => detailId && patchTask(detailId, patch)}
        onDelete={() => detailId && removeTask(detailId)}
      />
    </BentoCard>
  );
}

const BLANK = {
  id: "",
  title: "",
  description: "",
  dueDate: "",
  status: "todo" as const,
  createdAt: 0,
};

function ViewTab({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors",
        active ? "bg-surface text-ink" : "text-ink-soft hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
