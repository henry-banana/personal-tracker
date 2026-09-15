import { useState } from "react";
import { Modal } from "../../components/modal";
import { useI18n, errorMessage } from "../../lib/i18n";
import { createId } from "../../lib/id";
import { useSnapshot, useTracker } from "../tracker/provider";
import { STATE_KEY } from "../tracker/persistence";
import type { BusyRule, Entry, Habit, Interval } from "../tracker/types";
import {
  busyImpact,
  checkHabitSchedule,
  checkTime,
  entries,
  minutes,
  moveHabit,
  occurrence,
  occurrenceId,
  placeTask,
  saveBusy,
  scheduleOn,
  setStatus,
  timeText,
  today,
  toggleHabit,
  weekday,
} from "./engine";

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="v2-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function DialogError({ error }: { error: string }) {
  const { en } = useI18n();
  return error ? (
    <p role="alert" className="v2-error">
      {errorMessage(error, en)}
    </p>
  ) : null;
}
export function TaskPlanningDialog({
  id,
  date,
  onClose,
}: {
  id?: string;
  date: string;
  onClose: () => void;
}) {
  const snapshot = useSnapshot(),
    store = useTracker(),
    { t } = useI18n(),
    task = snapshot.tasks.find((x) => x.id === id),
    placement = snapshot.placements.find((p) => p.taskId === id);
  const [raw] = useState(() => localStorage.getItem(STATE_KEY)),
    [error, setError] = useState(""),
    [title, setTitle] = useState(task?.title || ""),
    [description, setDescription] = useState(task?.description || ""),
    [due, setDue] = useState(task?.dueDate || ""),
    [day, setDay] = useState(placement?.date || date),
    [time, setTime] = useState(
      placement?.start != null ? timeText(placement.start) : "",
    ),
    [duration, setDuration] = useState(placement?.duration || 30),
    [checks, setChecks] = useState(task?.checklist || []),
    [status, setTaskStatus] = useState(task?.status || "backlog");
  function save(
    action: "save" | "start" | "done" | "remove" | "delete" = "save",
  ) {
    const ok = store.commit((s) => {
      if (!title.trim()) throw Error("empty-name");
      const taskId = id || createId();
      let item = s.tasks.find((x) => x.id === taskId);
      if (!item) {
        item = {
          id: taskId,
          title,
          description,
          dueDate: due,
          status: "backlog",
          createdAt: Date.now(),
          checklist: [],
        };
        s.tasks.unshift(item);
      }
      Object.assign(item, {
        title: title.trim(),
        description,
        dueDate: due,
        checklist: checks,
      });
      if (action === "delete") {
        s.tasks = s.tasks.filter((x) => x.id !== taskId);
        return;
      }
      const oldDone = item.status === "done";
      if (status !== "done" && oldDone) setStatus(s, taskId, status);
      if (action === "remove")
        s.placements = s.placements.filter((p) => p.taskId !== taskId);
      else if (action === "save" && status !== "done") {
        setStatus(s, taskId, status);
        placeTask(s, taskId, day, time ? minutes(time) : null, duration);
      }
      if (action === "start") setStatus(s, taskId, "doing");
      if (action === "done" || (action === "save" && status === "done"))
        setStatus(s, taskId, "done");
    }, raw);
    if (ok) onClose();
    else setError(store.getError());
  }
  return (
    <Modal
      open
      title={
        task
          ? t("Chi tiết & xếp lịch", "Task & schedule")
          : t("Thêm task", "Add task")
      }
      onClose={onClose}
    >
      <form
        className="v2-form"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label={t("Tên task", "Task name")}>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label={t("Mô tả", "Description")}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <div className="v2-fields">
          <Field label="Deadline">
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </Field>
          <Field label={t("Trạng thái", "Status")}>
            <select
              value={status}
              onChange={(e) => setTaskStatus(e.target.value as typeof status)}
            >
              {["backlog", "todo", "doing", "done"].map((x) => (
                <option key={x} value={x}>
                  {x[0].toUpperCase() + x.slice(1)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="v2-fields">
          <Field label={t("Ngày dự định", "Planned date")}>
            <input
              type="date"
              required
              value={day}
              onChange={(e) => setDay(e.target.value)}
              disabled={status === "done"}
            />
          </Field>
          <Field
            label={t(
              "Giờ • để trống nếu chưa xếp",
              "Time • blank to plan later",
            )}
          >
            <input
              type="time"
              step="900"
              value={time}
              disabled={status === "done"}
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>
        </div>
        <Field label={t("Thời lượng (phút)", "Duration (minutes)")}>
          <input
            type="number"
            min="15"
            max="1440"
            step="15"
            value={duration}
            disabled={status === "done"}
            onChange={(e) => setDuration(+e.target.value)}
          />
        </Field>
        {checks.map((c, i) => (
          <label className="v2-check" key={c.id}>
            <input
              type="checkbox"
              checked={c.done}
              onChange={(e) =>
                setChecks(
                  checks.map((x, j) =>
                    j === i ? { ...x, done: e.target.checked } : x,
                  ),
                )
              }
            />
            {c.text}
          </label>
        ))}
        <DialogError error={error} />
        <div className="v2-dialog-actions">
          {task && task.status !== "done" && (
            <>
              <button type="button" onClick={() => save("start")}>
                {t("Bắt đầu", "Start")}
              </button>
              <button type="button" onClick={() => save("done")}>
                ✓ Done
              </button>
            </>
          )}
          {placement && (
            <button type="button" onClick={() => save("remove")}>
              {t("Bỏ khỏi lịch", "Unschedule")}
            </button>
          )}
          <button className="v2-primary">{t("Lưu", "Save")}</button>
        </div>
      </form>
    </Modal>
  );
}
export function HabitOccurrenceDialog({
  id,
  date,
  onClose,
}: {
  id: string;
  date: string;
  onClose: () => void;
}) {
  const snapshot = useSnapshot(),
    store = useTracker(),
    { t } = useI18n(),
    h = snapshot.habits.find((h) => h.id === id)!;
  const o = occurrence(snapshot, h, date),
    effective = entries(snapshot, date).find(
      (e) => e.kind === "habit" && e.ref === id,
    ),
    regular = scheduleOn(h, date)?.time;
  const [raw] = useState(() => localStorage.getItem(STATE_KEY)),
    [time, setTime] = useState(
      timeText(effective?.start ?? o.time?.start ?? regular?.start ?? 480),
    ),
    [duration, setDuration] = useState(
      effective?.duration ?? o.time?.duration ?? regular?.duration ?? 30,
    ),
    [focusId, setFocus] = useState(o.focusId || ""),
    [note, setNote] = useState(o.note),
    [error, setError] = useState("");
  function save(action: "save" | "toggle" | "restore") {
    const ok = store.commit((s) => {
      const current = s.habits.find((x) => x.id === id)!;
      let session = occurrence(s, current, date);
      if (!session.completion) {
        const target: Interval =
          action === "restore"
            ? regular || { start: 480, duration: 30 }
            : { start: minutes(time), duration };
        moveHabit(s, id, date, target);
        session = s.occurrences[occurrenceId(id, date)];
      }
      if (action === "restore") delete session.time;
      session.focusId = focusId || null;
      session.focusText =
        current.focus.find((f) => f.id === focusId)?.label ||
        (focusId === o.focusId ? o.focusText : "");
      session.note = note;
      s.occurrences[occurrenceId(id, date)] = session;
      if (action === "toggle") toggleHabit(s, id, date);
    }, raw);
    if (ok) onClose();
    else setError(store.getError());
  }
  return (
    <Modal open title={`${h.name} · ${date}`} onClose={onClose}>
      <form
        className="v2-form"
        onSubmit={(e) => {
          e.preventDefault();
          save("save");
        }}
      >
        <p className="v2-muted">
          {t(
            "Chỉ sửa buổi này; các ngày khác giữ lịch thường lệ.",
            "Only this session changes; other dates keep their regular time.",
          )}
        </p>
        <div className="v2-fields">
          <Field label={t("Giờ bắt đầu", "Start time")}>
            <input
              type="time"
              required
              step="900"
              value={time}
              disabled={!!o.completion}
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>
          <Field label={t("Thời lượng (phút)", "Duration (minutes)")}>
            <input
              type="number"
              min="15"
              step="15"
              value={duration}
              disabled={!!o.completion}
              onChange={(e) => setDuration(+e.target.value)}
            />
          </Field>
        </div>
        <Field label="Focus">
          <select value={focusId} onChange={(e) => setFocus(e.target.value)}>
            <option value="">
              {t("Chưa chọn focus", "No focus selected")}
            </option>
            {h.focus.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
            {o.focusId && !h.focus.some((f) => f.id === o.focusId) && (
              <option value={o.focusId}>{o.focusText}</option>
            )}
          </select>
        </Field>
        <Field label={t("Ghi chú", "Notes")}>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        {o.completion && (
          <p className="v2-notice">
            ✓ {o.completion.name}{" "}
            {o.completion.focusText && `· ${o.completion.focusText}`}
            <br />
            {t(
              "Tên và focus lúc hoàn thành được giữ trong lịch sử.",
              "The completion name and focus are preserved in history.",
            )}
          </p>
        )}
        <DialogError error={error} />
        <div className="v2-dialog-actions">
          {!o.completion && regular && (
            <button type="button" onClick={() => save("restore")}>
              {t("Giờ thường lệ", "Regular time")}
            </button>
          )}
          <button type="button" onClick={() => save("toggle")}>
            {o.completion ? t("Bỏ Done", "Undo Done") : "✓ Done"}
          </button>
          <button className="v2-primary">{t("Lưu", "Save")}</button>
        </div>
      </form>
    </Modal>
  );
}
export function HabitScheduleDialog({
  id,
  onClose,
}: {
  id?: string;
  onClose: () => void;
}) {
  const snapshot = useSnapshot(),
    store = useTracker(),
    { t } = useI18n(),
    h = snapshot.habits.find((x) => x.id === id),
    rule = h ? scheduleOn(h, today()) : undefined;
  const [raw] = useState(() => localStorage.getItem(STATE_KEY)),
    [name, setName] = useState(h?.name || ""),
    [from, setFrom] = useState(today()),
    [days, setDays] = useState(rule?.weekdays || [1, 2, 3, 4, 5, 6, 7]),
    [time, setTime] = useState(timeText(rule?.time?.start ?? 420)),
    [duration, setDuration] = useState(rule?.time?.duration ?? 30),
    [focus, setFocus] = useState(h?.focus.map((f) => f.label).join("\n") || ""),
    [error, setError] = useState("");
  function save() {
    const ok = store.commit((s) => {
      if (!name.trim()) throw Error("empty-name");
      if (!days.length || from < today()) throw Error("invalid-date");
      const timing = { start: minutes(time), duration };
      checkTime(timing);
      const next: Habit = {
        id: id || createId(),
        name: name.trim(),
        createdAt: h?.createdAt ?? Date.now(),
        focus: [
          ...new Set(
            focus
              .split("\n")
              .map((x) => x.trim())
              .filter(Boolean),
          ),
        ].map((label) => ({
          id: h?.focus.find((f) => f.label === label)?.id || createId(),
          label,
        })),
        schedules: [
          ...(h?.schedules || []).filter((v) => v.from < from),
          { from, weekdays: days, time: timing },
        ],
        archivedFrom: undefined,
      };
      checkHabitSchedule(s, next, from);
      s.habits = s.habits.filter((x) => x.id !== next.id);
      s.habits.push(next);
    }, raw);
    if (ok) onClose();
    else setError(store.getError());
  }
  function archive() {
    if (
      store.commit((s) => {
        s.habits.find((x) => x.id === id)!.archivedFrom = today();
      }, raw)
    )
      onClose();
    else setError(store.getError());
  }
  return (
    <Modal
      open
      title={
        h
          ? t("Lịch thường lệ", "Regular schedule")
          : t("Thêm habit", "Add habit")
      }
      onClose={onClose}
    >
      <form
        className="v2-form"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label={t("Tên habit", "Habit name")}>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label={t("Áp dụng từ ngày", "Effective from")}>
          <input
            type="date"
            required
            min={today()}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </Field>
        <Weekdays days={days} onChange={setDays} />
        <div className="v2-fields">
          <Field label={t("Giờ bắt đầu", "Start time")}>
            <input
              required
              type="time"
              step="900"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>
          <Field label={t("Thời lượng (phút)", "Duration (minutes)")}>
            <input
              type="number"
              required
              min="15"
              step="15"
              value={duration}
              onChange={(e) => setDuration(+e.target.value)}
            />
          </Field>
        </div>
        <Field
          label={t(
            "Focus • mỗi dòng một lựa chọn",
            "Focus • one option per line",
          )}
        >
          <textarea value={focus} onChange={(e) => setFocus(e.target.value)} />
        </Field>
        <p className="v2-muted">
          {t(
            "Lịch sử và buổi đã Done giữ nguyên.",
            "History and completed sessions are preserved.",
          )}
        </p>
        <DialogError error={error} />
        <div className="v2-dialog-actions">
          {h && !h.archivedFrom && (
            <button type="button" onClick={archive}>
              {t("Lưu trữ habit", "Archive habit")}
            </button>
          )}
          <button className="v2-primary">{t("Lưu", "Save")}</button>
        </div>
      </form>
    </Modal>
  );
}
export function Weekdays({
  days,
  onChange,
}: {
  days: number[];
  onChange: (days: number[]) => void;
}) {
  const { t } = useI18n();
  return (
    <fieldset className="v2-days">
      <legend>{t("Ngày lặp", "Repeat on")}</legend>
      {[1, 2, 3, 4, 5, 6, 7].map((d) => (
        <label key={d}>
          <input
            type="checkbox"
            checked={days.includes(d)}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? [...days, d].sort()
                  : days.filter((x) => x !== d),
              )
            }
          />
          {t(
            d === 7 ? "CN" : "T" + (d + 1),
            ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d - 1],
          )}
        </label>
      ))}
    </fieldset>
  );
}
export function BusyDialog({
  id,
  date,
  onClose,
}: {
  id?: string;
  date: string;
  onClose: () => void;
}) {
  const snapshot = useSnapshot(),
    store = useTracker(),
    { t } = useI18n(),
    existing = snapshot.busy.find((b) => b.id === id),
    last = existing?.versions.at(-1);
  const [raw] = useState(() => localStorage.getItem(STATE_KEY)),
    [title, setTitle] = useState(last?.title || ""),
    [day, setDay] = useState(date < today() ? today() : date),
    [time, setTime] = useState(timeText(last?.start ?? 840)),
    [duration, setDuration] = useState(last?.duration ?? 60),
    [weekly, setWeekly] = useState(last ? last.date === null : false),
    [days, setDays] = useState(
      last?.weekdays.length ? last.weekdays : [weekday(date)],
    ),
    [error, setError] = useState(""),
    [preview, setPreview] = useState<{
      rule: BusyRule;
      items: Entry[];
      recurring: { habitId: string; name: string }[];
    } | null>(null);
  function build() {
    if (day < today()) throw Error("invalid-date");
    checkTime({ start: minutes(time), duration });
    if (weekly && !days.length) throw Error("invalid-date");
    const version = {
      from: day,
      title: title.trim() || t("Bận", "Busy"),
      start: minutes(time),
      duration,
      weekdays: weekly ? days : [],
      date: weekly ? null : day,
    };
    return {
      id: id || createId(),
      versions: [
        ...(existing?.versions || []).filter((v) => v.from < day),
        version,
      ],
    };
  }
  function save() {
    try {
      const rule = build(),
        impact = busyImpact(snapshot, rule);
      if (impact.entries.some((e) => e.done)) throw Error("completed-conflict");
      if (impact.entries.length || impact.recurring.length) {
        setPreview({
          rule,
          items: impact.entries,
          recurring: impact.recurring,
        });
        return;
      }
      confirm(rule);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function confirm(rule: BusyRule) {
    if (store.commit((s) => saveBusy(s, rule, true), raw)) onClose();
    else setError(store.getError());
  }
  function remove() {
    if (
      store.commit((s) => {
        s.busy.find((b) => b.id === id)!.removedFrom = today();
      }, raw)
    )
      onClose();
    else setError(store.getError());
  }
  return (
    <Modal
      open
      title={
        preview
          ? t("Các việc cần xếp lại", "Items to reschedule")
          : t("Thời gian bận", "Busy time")
      }
      onClose={onClose}
    >
      {preview ? (
        <div className="v2-form">
          <p>
            {t(
              "Lưu Busy và đưa các việc chưa Done sau về chờ xếp.",
              "Save busy time and unschedule these incomplete items.",
            )}
          </p>
          {preview.items.map((e) => (
            <p className="v2-notice" key={e.id + e.date}>
              {e.title} · {e.date} {timeText(e.start)}
            </p>
          ))}
          {preview.recurring.map((h) => (
            <p key={h.habitId}>
              {h.name} —{" "}
              {t(
                "bị ảnh hưởng lặp lại theo lịch.",
                "affected on recurring dates.",
              )}
            </p>
          ))}
          <DialogError error={error} />
          <div className="v2-dialog-actions">
            <button onClick={() => setPreview(null)}>
              {t("Quay lại", "Back")}
            </button>
            <button
              className="v2-primary"
              onClick={() => confirm(preview.rule)}
            >
              {t("Xác nhận", "Confirm")}
            </button>
          </div>
        </div>
      ) : (
        <form
          className="v2-form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Field label={t("Tên lịch bận", "Busy title")}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label={t("Ngày / áp dụng từ", "Date / effective from")}>
            <input
              required
              type="date"
              min={today()}
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
          </Field>
          <div className="v2-fields">
            <Field label={t("Giờ bắt đầu", "Start time")}>
              <input
                required
                type="time"
                step="900"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </Field>
            <Field label={t("Thời lượng (phút)", "Duration (minutes)")}>
              <input
                type="number"
                required
                min="15"
                step="15"
                value={duration}
                onChange={(e) => setDuration(+e.target.value)}
              />
            </Field>
          </div>
          <label className="v2-check">
            <input
              type="checkbox"
              checked={weekly}
              onChange={(e) => setWeekly(e.target.checked)}
            />
            {t("Lặp hằng tuần, đến khi gỡ", "Repeat weekly until removed")}
          </label>
          {weekly && <Weekdays days={days} onChange={setDays} />}
          <DialogError error={error} />
          <div className="v2-dialog-actions">
            {existing && (
              <button type="button" onClick={remove}>
                {t("Gỡ từ hôm nay", "Remove from today")}
              </button>
            )}
            <button className="v2-primary">{t("Lưu", "Save")}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
