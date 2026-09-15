import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
} from "@dnd-kit/core";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flame,
  ListTodo,
  Plus,
  X,
} from "lucide-react";
import { useSnapshot, useTracker } from "../tracker/provider";
import { useI18n } from "../../lib/i18n";
import { useNarrow } from "../../lib/use-local-clock";
import { navigate, RouteLink } from "../../lib/navigation";
import type { Entry, Snapshot } from "../tracker/types";
import type { Task } from "../todo/task-types";
import {
  blockedHabits,
  dueOn,
  entries,
  freeSlots,
  monday,
  moveHabit,
  occurrence,
  placeTask,
  scheduleOn,
  shift,
  streak,
  timeText,
  today,
} from "./engine";
import {
  BusyDialog,
  HabitOccurrenceDialog,
  TaskPlanningDialog,
} from "./dialogs";
type Open = { kind: "task" | "habit" | "busy"; id?: string; date: string };
type DragData = {
  kind: "task" | "habit";
  id: string;
  date: string;
  duration?: number;
  title: string;
};
export function MiniCalendar({
  date,
  onChange,
}: {
  date: string;
  onChange: (date: string) => void;
}) {
  const { locale, t } = useI18n(),
    first = date.slice(0, 8) + "01",
    start = monday(first);
  function month(n: number) {
    const d = new Date(first + "T12:00:00");
    d.setMonth(d.getMonth() + n);
    onChange(today(d));
  }
  return (
    <div className="v2-mini-wrap">
      <div className="v2-mini-heading">
        <strong>
          {new Date(date + "T12:00:00").toLocaleDateString(locale, {
            month: "long",
            year: "numeric",
          })}
        </strong>
        <button
          aria-label={t("Tháng trước", "Previous month")}
          onClick={() => month(-1)}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          aria-label={t("Tháng sau", "Next month")}
          onClick={() => month(1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="v2-mini">
        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
          <small key={d}>
            {t(
              d === 7 ? "CN" : "T" + (d + 1),
              ["M", "T", "W", "T", "F", "S", "S"][d - 1],
            )}
          </small>
        ))}
        {Array.from({ length: 42 }, (_, i) => {
          const d = shift(start, i);
          return (
            <button
              key={d}
              aria-label={d}
              aria-pressed={d === date}
              className={`${d === date ? "selected" : ""} ${d.slice(0, 7) !== date.slice(0, 7) ? "outside" : ""}`}
              onClick={() => onChange(d)}
            >
              {+d.slice(-2)}
            </button>
          );
        })}
      </div>
      <div className="v2-legend">
        <span>
          <i className="task" />
          {t("Task linh hoạt", "Flexible tasks")}
        </span>
        <span>
          <i className="habit" />
          {t("Habit thường lệ", "Scheduled habits")}
        </span>
        <span>
          <i className="busy" />
          {t("Thời gian bận", "Busy time")}
        </span>
      </div>
    </div>
  );
}
function TaskQueueCard({
  task,
  snapshot,
  onOpen,
}: {
  task: Task;
  snapshot: Snapshot;
  onOpen: () => void;
}) {
  const p = snapshot.placements.find((p) => p.taskId === task.id),
    { t } = useI18n();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: "queue:" + task.id,
    data: {
      kind: "task",
      id: task.id,
      date: p?.date || "",
      duration: p?.duration,
      title: task.title,
    } satisfies DragData,
  });
  return (
    <article
      ref={setNodeRef}
      className="v2-task-card"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <div className="v2-task-meta">
        <span className={"status-" + task.status}>● {task.status}</span>
        <small
          className={task.dueDate && task.dueDate < today() ? "v2-error" : ""}
        >
          {task.dueDate && `${t("Hạn", "Due")} ${task.dueDate.slice(5)}`}
        </small>
      </div>
      <button
        className="v2-drag-title"
        {...attributes}
        {...listeners}
        onClick={onOpen}
      >
        {task.title}
      </button>
      <div className="v2-task-bottom">
        <small>
          {p
            ? `${p.date.slice(5)} · ${p.start === null ? t("Chưa chọn giờ", "No time") : timeText(p.start)}`
            : t("Chưa xếp lịch", "Unscheduled")}
        </small>
        <button onClick={onOpen}>{t("Xếp lịch", "Schedule")}</button>
      </div>
    </article>
  );
}
function DayColumn({
  date,
  children,
}: {
  date: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: date, data: { date } });
  return (
    <div
      ref={setNodeRef}
      className={"v2-day-column " + (date === today() ? "is-today" : "")}
      data-day={date}
    >
      {children}
    </div>
  );
}
function CalendarBlock({
  entry,
  onOpen,
  onResize,
}: {
  entry: Entry;
  onOpen: () => void;
  onResize: (duration: number) => void;
}) {
  const ref = useRef<HTMLButtonElement | null>(null),
    prevent = useRef(false),
    { setNodeRef, listeners, attributes, isDragging } = useDraggable({
      id: entry.date + entry.id,
      disabled: entry.kind === "busy" || entry.done,
      data: {
        kind: entry.kind,
        id: entry.ref,
        date: entry.date,
        duration: entry.duration,
        title: entry.title,
      },
    });
  const { t } = useI18n();
  return (
    <button
      ref={(el) => {
        ref.current = el;
        setNodeRef(el);
      }}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!prevent.current) onOpen();
      }}
      className={`v2-block ${entry.kind} ${entry.done ? "done" : ""}`}
      style={{
        top: entry.start * 1.2,
        height: entry.duration * 1.2 - 2,
        opacity: isDragging ? 0.3 : undefined,
      }}
      aria-label={`${entry.title}, ${timeText(entry.start)}–${timeText(entry.start + entry.duration)}${entry.done ? ", Done" : ""}`}
    >
      <strong>
        {entry.done ? "✓ " : entry.kind === "busy" ? "▧ " : ""}
        {entry.title}
      </strong>
      <small>
        {timeText(entry.start)}–{timeText(entry.start + entry.duration)}
        {entry.status ? " · " + entry.status : ""}
      </small>
      {entry.kind === "habit" && (
        <small>
          {entry.focus || t("Chưa chọn focus", "No focus selected")}
        </small>
      )}
      {entry.kind !== "busy" && !entry.done && (
        <span
          aria-hidden
          className="v2-resize"
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            prevent.current = true;
            const el = e.currentTarget,
              y = e.clientY;
            let length = entry.duration;
            el.setPointerCapture(e.pointerId);
            el.onpointermove = (ev) => {
              length = Math.max(
                15,
                entry.duration + Math.round((ev.clientY - y) / 18) * 15,
              );
              if (ref.current)
                ref.current.style.height = length * 1.2 - 2 + "px";
            };
            el.onpointerup = () => {
              el.onpointermove = null;
              el.onpointerup = null;
              onResize(length);
              if (ref.current)
                ref.current.style.height = entry.duration * 1.2 - 2 + "px";
              setTimeout(() => {
                prevent.current = false;
              }, 200);
            };
            el.onpointercancel = () => {
              el.onpointermove = null;
              prevent.current = false;
              if (ref.current)
                ref.current.style.height = entry.duration * 1.2 - 2 + "px";
            };
          }}
        />
      )}
    </button>
  );
}
export function CalendarPage({
  date,
  setDate,
  now,
}: {
  date: string;
  setDate: (date: string) => void;
  now: Date;
}) {
  const s = useSnapshot(),
    store = useTracker(),
    { t, locale } = useI18n(),
    narrow = useNarrow(),
    overlay = useNarrow("(max-width: 1000px)");
  const [mode, setMode] = useState<"day" | "week">(narrow ? "day" : "week"),
    [queueOpen, setQueueOpen] = useState(false),
    [search, setSearch] = useState(""),
    [open, setOpen] = useState<Open | null>(null),
    [drag, setDrag] = useState<DragData | null>(null),
    [drop, setDrop] = useState<{ date: string; start: number } | null>(null),
    scroll = useRef<HTMLDivElement>(null),
    head = useRef<HTMLDivElement>(null);
  const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    ),
    days =
      mode === "week"
        ? Array.from({ length: 7 }, (_, i) => shift(monday(date), i))
        : [date];
  useEffect(() => {
    if (narrow) setMode("day");
    setQueueOpen(false);
  }, [narrow]);
  useEffect(() => {
    if (scroll.current) {
      scroll.current.scrollTop =
        (date === today()
          ? Math.max(0, new Date().getHours() * 60 - 90)
          : 480) * 1.2;
      if (head.current)
        head.current.style.paddingRight =
          scroll.current.offsetWidth - scroll.current.clientWidth + "px";
    }
  }, [date, mode]);
  const shown = overlay ? queueOpen : !s.preferences.queueHidden;
  const tasks = s.tasks
    .filter(
      (t) =>
        t.status !== "done" &&
        t.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    )
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
  const late = tasks.filter((t) =>
      s.placements.some(
        (p) => p.taskId === t.id && p.start !== null && p.date < today(now),
      ),
    ),
    planned = tasks.filter(
      (t) =>
        !late.includes(t) &&
        s.placements.some(
          (p) => p.taskId === t.id && p.date === date && p.start === null,
        ),
    );
  const sections = [
    [t("Chưa xong", "Unfinished"), late],
    [t("Dự định trong ngày", "Planned for this day"), planned],
    [
      t("Chờ xếp", "To schedule"),
      tasks.filter((t) => !late.includes(t) && !planned.includes(t)),
    ],
  ] as const;
  const current = s.habits
      .filter((h) => !h.archivedFrom || h.archivedFrom > today(now))
      .map((h) => ({ h, count: streak(s, h, today(now)) }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count || a.h.name.localeCompare(b.h.name)),
    collapsed = s.preferences.streakCollapsed ?? narrow;
  function toggleQueue() {
    if (overlay) setQueueOpen(!queueOpen);
    else
      store.commit((n) => {
        n.preferences.queueHidden = !n.preferences.queueHidden;
      });
  }
  function location(e: DragMoveEvent | DragEndEvent) {
    if (!e.over) return null;
    const column = document.querySelector<HTMLElement>(
        `[data-day="${e.over.id}"]`,
      ),
      event = e.activatorEvent as PointerEvent;
    if (!column || typeof event.clientY !== "number") return null;
    // Keep the original grab point inside a block; queue cards use the pointer as their start.
    const grabOffset = String(e.active.id).startsWith("queue:")
      ? 0
      : event.clientY - (e.active.rect.current.initial?.top ?? event.clientY);
    return {
      date: String(e.over.id),
      start: Math.max(
        0,
        Math.min(
          1425,
          Math.round(
            (event.clientY +
              e.delta.y -
              grabOffset -
              column.getBoundingClientRect().top) /
              18,
          ) * 15,
        ),
      ),
    };
  }
  function finish(e: DragEndEvent) {
    const pos = location(e),
      d = e.active.data.current as DragData | undefined;
    setDrag(null);
    setDrop(null);
    if (!pos || !d) return;
    store.commit((n) => {
      if (d.kind === "task")
        placeTask(n, d.id, pos.date, pos.start, d.duration);
      else
        moveHabit(
          n,
          d.id,
          pos.date,
          { start: pos.start, duration: d.duration || 30 },
          d.date,
        );
    });
  }
  function resize(e: Entry, duration: number) {
    store.commit((n) => {
      if (e.kind === "task") placeTask(n, e.ref, e.date, e.start, duration);
      else moveHabit(n, e.ref, e.date, { start: e.start, duration });
    });
  }
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("[role=dialog]"))
        setQueueOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={(e) => setDrag(e.active.data.current as DragData)}
      onDragMove={(e) => setDrop(location(e))}
      onDragEnd={finish}
      onDragCancel={() => {
        setDrag(null);
        setDrop(null);
      }}
    >
      <div className="v2-calendar-page">
        <div className="v2-calendar-actions">
          <button onClick={toggleQueue} aria-expanded={shown}>
            <ListTodo size={16} />
            <span>{t("Việc cần làm", "Task list")}</span>
          </button>
          <button onClick={() => setDate(today(now))}>
            {t("Hôm nay", "Today")}
          </button>
          <div className="v2-segment">
            <button
              aria-pressed={mode === "week"}
              onClick={() => setMode("week")}
            >
              {t("Tuần", "Week")}
            </button>
            <button
              aria-pressed={mode === "day"}
              onClick={() => setMode("day")}
            >
              {t("Ngày", "Day")}
            </button>
          </div>
          <button
            className="v2-primary"
            onClick={() => setOpen({ kind: "busy", date })}
          >
            <Plus size={16} />
            {t("Bận", "Busy")}
          </button>
        </div>
        <div className="v2-calendar-layout">
          {shown && (
            <section
              className={"v2-queue " + (overlay ? "overlay" : "")}
              aria-label={t("Việc cần làm", "Task list")}
            >
              <div className="v2-queue-head">
                <strong>{t("Việc của bạn", "Your tasks")}</strong>
                <button
                  aria-label={t("Thêm task", "Add task")}
                  onClick={() => setOpen({ kind: "task", date })}
                >
                  <Plus size={17} />
                </button>
                <button
                  aria-label={t("Đóng danh sách", "Close task list")}
                  onClick={toggleQueue}
                >
                  <X size={17} />
                </button>
                <input
                  type="search"
                  placeholder={t("Tìm công việc", "Search tasks")}
                  aria-label={t("Tìm công việc", "Search tasks")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="v2-queue-scroll">
                {sections.map(
                  ([name, items]) =>
                    !!items.length && (
                      <details key={name} open>
                        <summary>
                          {name}
                          <span>{items.length}</span>
                        </summary>
                        {items.map((task) => (
                          <TaskQueueCard
                            key={task.id}
                            task={task}
                            snapshot={s}
                            onOpen={() =>
                              setOpen({ kind: "task", id: task.id, date })
                            }
                          />
                        ))}
                      </details>
                    ),
                )}
                {!tasks.length && (
                  <p className="v2-empty">
                    {t("Không có việc phù hợp.", "No matching tasks.")}
                  </p>
                )}
                {blockedHabits(s, date).length > 0 && (
                  <details open>
                    <summary>
                      {t("Habit cần xếp lại", "Habits to reschedule")}
                    </summary>
                    {blockedHabits(s, date).map((h) => (
                      <button
                        className="v2-task-card"
                        key={h.id}
                        onClick={() =>
                          setOpen({ kind: "habit", id: h.id, date })
                        }
                      >
                        {h.name} · {t("Đổi giờ", "Reschedule")}
                      </button>
                    ))}
                  </details>
                )}
              </div>
            </section>
          )}
          <section
            className="v2-calendar"
            style={{ "--days": days.length } as React.CSSProperties}
          >
            <div className="v2-calendar-toolbar">
              <button
                aria-label={t("Khoảng trước", "Previous period")}
                onClick={() => setDate(shift(date, mode === "week" ? -7 : -1))}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                aria-label={t("Khoảng sau", "Next period")}
                onClick={() => setDate(shift(date, mode === "week" ? 7 : 1))}
              >
                <ChevronRight size={18} />
              </button>
              <label className="v2-date-control">
                <CalendarDays size={16} />
                <input
                  type="date"
                  value={date}
                  aria-label={t("Chọn ngày", "Choose date")}
                  onChange={(e) => {
                    if (e.target.value) setDate(e.target.value);
                  }}
                />
              </label>
              <small className="v2-zone">
                {t("15 phút / bước", "15-minute steps")}
              </small>
            </div>
            <section
              className="v2-streaks"
              aria-label={t("Streak hiện tại", "Current streaks")}
            >
              <div className="v2-streak-heading">
                <button
                  aria-expanded={!collapsed}
                  onClick={() =>
                    store.commit((n) => {
                      n.preferences.streakCollapsed = !collapsed;
                    })
                  }
                >
                  <Flame size={16} />
                  {t("Streak hiện tại", "Current streaks")}{" "}
                  <b>{current.length}</b>
                </button>
                <small>{t("Tính đến hôm nay", "As of today")}</small>
                <RouteLink to="habits">{t("Xem tất cả", "View all")}</RouteLink>
              </div>
              {!collapsed && (
                <div className="v2-streak-items">
                  {current.slice(0, 3).map(({ h, count }) => (
                    <button
                      key={h.id}
                      onClick={() => {
                        if (
                          dueOn(h, today(now)) &&
                          scheduleOn(h, today(now))?.time
                        )
                          setOpen({
                            kind: "habit",
                            id: h.id,
                            date: today(now),
                          });
                        else locationToHabits();
                      }}
                    >
                      <strong>{h.name}</strong>
                      <span>
                        {count}{" "}
                        {scheduleOn(h, today(now))?.weekdays.length === 7
                          ? t("ngày", "days")
                          : t("buổi", "sessions")}
                      </span>
                      {occurrence(s, h, today(now)).completion
                        ? "✓"
                        : !dueOn(h, today(now))
                          ? t("Ngày nghỉ", "Rest day")
                          : ""}
                    </button>
                  ))}
                  {!current.length && (
                    <p>
                      {t(
                        "Hoàn thành buổi đầu để bắt đầu streak.",
                        "Complete your first session to start a streak.",
                      )}
                    </p>
                  )}
                </div>
              )}
            </section>
            <div className="v2-day-headings" ref={head}>
              <div />
              {days.map((d) => (
                <div key={d}>
                  <small>
                    {new Date(d + "T12:00:00").toLocaleDateString(locale, {
                      weekday: narrow ? "short" : "long",
                    })}
                  </small>
                  <b className={d === today(now) ? "current" : ""}>
                    {+d.slice(-2)}
                  </b>
                </div>
              ))}
            </div>
            <div className="v2-calendar-scroll" ref={scroll}>
              <div className="v2-timeline">
                <div className="v2-hours">
                  {Array.from({ length: 24 }, (_, h) => (
                    <span key={h} style={{ top: h * 72 }}>
                      {String(h).padStart(2, "0")}:00
                    </span>
                  ))}
                </div>
                {days.map((d) => (
                  <DayColumn key={d} date={d}>
                    {freeSlots(s, d)
                      .filter(
                        (f) =>
                          f.duration >= 45 && f.start >= 420 && f.start < 1260,
                      )
                      .map((f) => (
                        <div
                          className="v2-free"
                          key={f.start}
                          style={{ top: f.start * 1.2 + 8 }}
                        >
                          {t("Trống", "Free")}{" "}
                          {Math.floor(f.duration / 60)
                            ? `${Math.floor(f.duration / 60)}h `
                            : ""}
                          {f.duration % 60 ? `${f.duration % 60}m` : ""}
                        </div>
                      ))}
                    {entries(s, d).map((e) => (
                      <CalendarBlock
                        key={e.id}
                        entry={e}
                        onOpen={() =>
                          setOpen({ kind: e.kind, id: e.ref, date: d })
                        }
                        onResize={(duration) => resize(e, duration)}
                      />
                    ))}
                    {d === today(now) && (
                      <div
                        className="v2-now"
                        style={{
                          top: (now.getHours() * 60 + now.getMinutes()) * 1.2,
                        }}
                      />
                    )}
                    {drop?.date === d && (
                      <div
                        className="v2-drop"
                        style={{
                          top: drop.start * 1.2,
                          height: (drag?.duration || 30) * 1.2,
                        }}
                      >
                        {timeText(drop.start)}
                      </div>
                    )}
                  </DayColumn>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
      <DragOverlay>
        {drag && (
          <div className="v2-drag-overlay">
            {drag.title} {drop && timeText(drop.start)}
          </div>
        )}
      </DragOverlay>
      {open?.kind === "task" && (
        <TaskPlanningDialog
          key={"task" + open.id}
          id={open.id}
          date={open.date}
          onClose={() => setOpen(null)}
        />
      )}{" "}
      {open?.kind === "habit" && (
        <HabitOccurrenceDialog
          key={open.id + open.date}
          id={open.id!}
          date={open.date}
          onClose={() => setOpen(null)}
        />
      )}{" "}
      {open?.kind === "busy" && (
        <BusyDialog
          key={open.id || "new"}
          id={open.id}
          date={open.date}
          onClose={() => setOpen(null)}
        />
      )}
    </DndContext>
  );
}
function locationToHabits() {
  navigate("habits");
}
