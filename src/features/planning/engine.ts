import type {
  BusyImpact,
  BusyRule,
  Entry,
  Habit,
  Interval,
  Occurrence,
  Schedule,
  Snapshot,
} from "../tracker/types";
export const today = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const shift = (date: string, days: number) => {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + days);
  return today(d);
};
export const weekday = (date: string) =>
  new Date(date + "T12:00:00").getDay() || 7;
export const monday = (date: string) => shift(date, 1 - weekday(date));
export const timeText = (n: number) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
export const minutes = (text: string) => {
  const [h, m] = text.split(":").map(Number);
  return h * 60 + m;
};
export const occurrenceId = (id: string, date: string) => `${id}@${date}`;
export const overlap = (a: Interval, b: Interval) =>
  a.start < b.start + b.duration && b.start < a.start + a.duration;
export function validDate(date: unknown): date is string {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return false;
  const d = new Date(date + "T12:00:00");
  return Number.isFinite(d.getTime()) && today(d) === date;
}
export function checkTime(t: Interval) {
  if (
    !Number.isInteger(t.start) ||
    !Number.isInteger(t.duration) ||
    t.start < 0 ||
    t.duration < 15 ||
    t.start % 15 ||
    t.duration % 15 ||
    t.start + t.duration > 1440
  )
    throw Error("invalid-time");
}
export function scheduleOn(h: Habit, date: string): Schedule | undefined {
  return [...h.schedules]
    .filter((v) => v.from <= date)
    .sort((a, b) => b.from.localeCompare(a.from))[0];
}
export const dueOn = (h: Habit, date: string) =>
  (!h.archivedFrom || date < h.archivedFrom) &&
  !!scheduleOn(h, date)?.weekdays.includes(weekday(date));
export function busyOn(b: BusyRule, date: string) {
  if (b.removedFrom && date >= b.removedFrom) return;
  const v = [...b.versions]
    .filter((x) => x.from <= date)
    .sort((a, c) => c.from.localeCompare(a.from))[0];
  return v && (v.date ? v.date === date : v.weekdays.includes(weekday(date)))
    ? v
    : undefined;
}
export function occurrence(s: Snapshot, h: Habit, date: string): Occurrence {
  return (
    s.occurrences[occurrenceId(h.id, date)] || {
      habitId: h.id,
      date,
      focusId: null,
      focusText: "",
      note: "",
    }
  );
}
export function entries(
  s: Snapshot,
  date: string,
  includeBlocked = false,
): Entry[] {
  const result: Entry[] = [];
  for (const b of s.busy) {
    const v = busyOn(b, date);
    if (v)
      result.push({
        id: "busy:" + b.id,
        ref: b.id,
        kind: "busy",
        date,
        title: v.title,
        start: v.start,
        duration: v.duration,
        done: false,
      });
  }
  for (const h of s.habits) {
    const o = occurrence(s, h, date),
      rule = scheduleOn(h, date);
    const time = o.completion?.time || o.time || rule?.time;
    if (o.completion) {
      if (o.completion.time)
        result.push({
          id: "habit:" + h.id,
          ref: h.id,
          kind: "habit",
          date,
          title: o.completion.name,
          ...o.completion.time,
          done: true,
          focus: o.completion.focusText,
        });
      continue;
    }
    if (!dueOn(h, date) || !time || (o.displaced && !includeBlocked)) continue;
    if (
      !includeBlocked &&
      result.some((e) => e.kind === "busy" && overlap(e, time))
    )
      continue;
    result.push({
      id: "habit:" + h.id,
      ref: h.id,
      kind: "habit",
      date,
      title: h.name,
      ...time,
      done: false,
      focus: o.focusText,
    });
  }
  for (const p of s.placements) {
    if (p.date !== date || p.start === null) continue;
    const t = s.tasks.find((t) => t.id === p.taskId);
    if (t)
      result.push({
        id: "task:" + t.id,
        ref: t.id,
        kind: "task",
        date,
        title: t.title,
        start: p.start,
        duration: p.duration,
        done: t.status === "done",
        status: t.status,
      });
  }
  return result;
}
export function blockedHabits(s: Snapshot, date: string) {
  return s.habits.filter((h) => {
    const o = occurrence(s, h, date),
      time = o.time || scheduleOn(h, date)?.time;
    return (
      !o.completion &&
      dueOn(h, date) &&
      time &&
      (o.displaced ||
        s.busy.some((b) => {
          const v = busyOn(b, date);
          return v && overlap(v, time);
        }))
    );
  });
}
export function freeSlots(s: Snapshot, date: string): Interval[] {
  const occupied = entries(s, date).sort((a, b) => a.start - b.start),
    out: Interval[] = [];
  let end = 0;
  for (const e of occupied) {
    if (e.start > end) out.push({ start: end, duration: e.start - end });
    end = Math.max(end, e.start + e.duration);
  }
  if (end < 1440) out.push({ start: end, duration: 1440 - end });
  return out;
}
export function streak(s: Snapshot, h: Habit, asOf = today()) {
  let date = asOf,
    count = 0;
  const first = h.schedules.reduce((a, v) => (v.from < a ? v.from : a), asOf);
  while (date >= first) {
    if (occurrence(s, h, date).completion) count++;
    else if (dueOn(h, date) && date !== asOf) break;
    date = shift(date, -1);
  }
  return count;
}
export function setStatus(
  s: Snapshot,
  id: string,
  status: Snapshot["tasks"][number]["status"],
) {
  const t = s.tasks.find((t) => t.id === id);
  if (!t) throw Error("missing-task");
  t.status = status;
  if (status === "done") t.doneAt ??= Date.now();
  else delete t.doneAt;
}
export function placeTask(
  s: Snapshot,
  id: string,
  date: string,
  start: number | null,
  duration?: number,
) {
  if (!validDate(date)) throw Error("invalid-date");
  const t = s.tasks.find((t) => t.id === id);
  if (!t) throw Error("missing-task");
  if (t.status === "done") throw Error("reopen-first");
  const old = s.placements.find((p) => p.taskId === id);
  let len = duration ?? old?.duration ?? 30;
  if (start !== null) {
    if (!old && duration === undefined) {
      const rest = entries(s, date)
        .filter((e) => e.id !== "task:" + id && e.start >= start)
        .reduce((n, e) => Math.min(n, e.start - start), 1440 - start);
      len = Math.min(30, Math.floor(rest / 15) * 15);
    }
    checkTime({ start, duration: len });
    if (
      entries(s, date).some(
        (e) => e.id !== "task:" + id && overlap(e, { start, duration: len }),
      )
    )
      throw Error("collision");
    if (t.status === "backlog") setStatus(s, id, "todo");
  } else checkTime({ start: 0, duration: len });
  s.placements = s.placements.filter((p) => p.taskId !== id);
  s.placements.push({ taskId: id, date, start, duration: len });
}
export function moveHabit(
  s: Snapshot,
  id: string,
  date: string,
  time: Interval,
  sourceDate = date,
) {
  if (sourceDate !== date) throw Error("same-day");
  checkTime(time);
  const h = s.habits.find((h) => h.id === id);
  if (!h || !dueOn(h, date)) throw Error("not-due");
  const o = occurrence(s, h, date);
  if (o.completion) throw Error("completed");
  if (entries(s, date).some((e) => e.id !== "habit:" + id && overlap(e, time)))
    throw Error("collision");
  s.occurrences[occurrenceId(id, date)] = { ...o, time, displaced: false };
}
export function toggleHabit(s: Snapshot, id: string, date: string) {
  const h = s.habits.find((h) => h.id === id);
  if (!h) throw Error("not-due");
  const o = occurrence(s, h, date);
  if (o.completion) {
    delete o.completion;
    s.occurrences[occurrenceId(id, date)] = o;
    return;
  }
  if (date > today()) throw Error("future-completion");
  if (!dueOn(h, date)) throw Error("not-due");
  const e = entries(s, date).find((e) => e.kind === "habit" && e.ref === id);
  if (!e) throw Error("schedule-first");
  o.completion = {
    at: Date.now(),
    name: h.name,
    focusText: o.focusText,
    time: { start: e.start, duration: e.duration },
  };
  s.occurrences[occurrenceId(id, date)] = o;
}

// Rule intersections are bounded by version boundaries, not an arbitrary future window.
type Pattern = {
  from: string;
  until?: string;
  weekdays: number[];
  date?: string | null;
  time: Interval;
};
function patternsBusy(b: BusyRule): Pattern[] {
  return b.versions.map((v, i) => ({
    from: v.from,
    until: [b.versions[i + 1]?.from, b.removedFrom]
      .filter((x): x is string => !!x)
      .sort()[0],
    weekdays: v.weekdays,
    date: v.date,
    time: v,
  }));
}
function patternsHabit(h: Habit): Pattern[] {
  return h.schedules.flatMap((v, i) =>
    v.time
      ? [
          {
            from: v.from,
            until: [h.schedules[i + 1]?.from, h.archivedFrom]
              .filter((x): x is string => !!x)
              .sort()[0],
            weekdays: v.weekdays,
            time: v.time,
          },
        ]
      : [],
  );
}
function commonDate(a: Pattern, b: Pattern, from: string) {
  if (!overlap(a.time, b.time)) return;
  const lo = [a.from, b.from, from, a.date || "", b.date || ""].sort().at(-1)!;
  const hi = [
    a.until,
    b.until,
    a.date ? shift(a.date, 1) : undefined,
    b.date ? shift(b.date, 1) : undefined,
  ]
    .filter((x): x is string => !!x)
    .sort()[0];
  for (let i = 0; i < 7; i++) {
    const d = shift(lo, i);
    if (hi && d >= hi) return;
    if (
      (a.date ? d === a.date : a.weekdays.includes(weekday(d))) &&
      (b.date ? d === b.date : b.weekdays.includes(weekday(d)))
    )
      return d;
  }
}
export function busyImpact(
  s: Snapshot,
  rule: BusyRule,
  from = today(),
): BusyImpact {
  const dates = new Set<string>([
    from,
    ...s.placements.map((p) => p.date),
    ...Object.values(s.occurrences).map((o) => o.date),
  ]);
  for (const v of rule.versions) if (v.date) dates.add(v.date);
  const recurring: BusyImpact["recurring"] = [];
  for (const h of s.habits) {
    let hit = false;
    for (const a of patternsBusy(rule))
      for (const b of patternsHabit(h)) {
        const d = commonDate(a, b, from);
        if (d) {
          dates.add(d);
          if (!a.date) hit = true;
        }
      }
    if (hit) recurring.push({ habitId: h.id, name: h.name });
  }
  const affected: Entry[] = [];
  for (const date of dates) {
    if (date < from) continue;
    const v = busyOn(rule, date);
    if (!v) continue;
    for (const e of entries(s, date, true)) {
      if (
        e.kind !== "busy" &&
        overlap(v, e) &&
        !affected.some((a) => a.id === e.id && a.date === date)
      )
        affected.push(e);
    }
  }
  return { entries: affected, recurring };
}
export function saveBusy(s: Snapshot, rule: BusyRule, confirmed: boolean) {
  const impact = busyImpact(s, rule);
  if (impact.entries.some((e) => e.done)) throw Error("completed-conflict");
  if ((impact.entries.length || impact.recurring.length) && !confirmed)
    throw Error("confirm-conflicts");
  for (const e of impact.entries) {
    if (e.kind === "task") {
      const p = s.placements.find((p) => p.taskId === e.ref);
      if (p) p.start = null;
    } else if (s.occurrences[occurrenceId(e.ref, e.date)]) {
      s.occurrences[occurrenceId(e.ref, e.date)].displaced = true;
    }
  }
  s.busy = s.busy.filter((b) => b.id !== rule.id);
  s.busy.push(rule);
}
export function checkHabitSchedule(s: Snapshot, h: Habit, from = today()) {
  const candidate = structuredClone(s);
  candidate.habits = candidate.habits.filter((x) => x.id !== h.id);
  candidate.habits.push(h);
  const exceptional = new Set([
    ...s.placements.map((p) => p.date),
    ...Object.values(s.occurrences).map((o) => o.date),
    ...s.busy.flatMap((b) =>
      b.versions.flatMap((v) => (v.date ? [v.date] : [])),
    ),
  ]);
  for (const a of patternsHabit(h)) {
    for (const other of s.habits.filter((x) => x.id !== h.id))
      for (const b of patternsHabit(other))
        if (unmodifiedIntersection(a, b, from, exceptional))
          throw Error("schedule-conflict");
    for (const b of s.busy)
      for (const p of patternsBusy(b)) {
        const d = commonDate(a, p, from);
        if (d && p.date) exceptional.add(d);
        else if (d && unmodifiedIntersection(a, p, from, exceptional))
          throw Error("schedule-conflict");
      }
  }
  for (const date of exceptional) {
    if (date < from) continue;
    const e = entries(candidate, date, true).find(
      (e) => e.kind === "habit" && e.ref === h.id,
    );
    if (
      e &&
      !e.done &&
      entries(candidate, date, true).some((x) => x.id !== e.id && overlap(x, e))
    )
      throw Error("schedule-conflict");
  }
}
function unmodifiedIntersection(
  a: Pattern,
  b: Pattern,
  from: string,
  exceptions: Set<string>,
) {
  for (let day = 1; day <= 7; day++) {
    if (!a.weekdays.includes(day) || !b.weekdays.includes(day)) continue;
    let date = commonDate(
      { ...a, weekdays: [day] },
      { ...b, weekdays: [day] },
      from,
    );
    if (!date) continue;
    while (exceptions.has(date)) {
      date = shift(date, 7);
      if ((a.until && date >= a.until) || (b.until && date >= b.until)) break;
    }
    if ((!a.until || date < a.until) && (!b.until || date < b.until))
      return true;
  }
  return false;
}
export function checkRecurringHabits(s: Snapshot) {
  const exceptions = new Set(Object.values(s.occurrences).map((o) => o.date));
  for (let i = 0; i < s.habits.length; i++)
    for (let j = i + 1; j < s.habits.length; j++)
      for (const a of patternsHabit(s.habits[i]))
        for (const b of patternsHabit(s.habits[j]))
          if (
            unmodifiedIntersection(a, b, [a.from, b.from].sort()[1], exceptions)
          )
            throw Error("schedule-conflict");
}
