import { DEFAULT_SETTINGS } from "../../lib/settings";
import { setUiLanguage } from "../../lib/messages";
import {
  checkRecurringHabits,
  checkTime,
  entries,
  occurrenceId,
  overlap,
  today,
  validDate,
} from "../planning/engine";
import type { Command, Snapshot } from "./types";
export const STATE_KEY = "pt.state.v2";
export const LEGACY_KEYS = [
  "pt.todos",
  "pt.habits",
  "pt.bookmarks",
  "pt.bookmark-groups",
  "pt.settings",
  "pt.todo-view",
  "pt.welcomed",
];
export function emptySnapshot(): Snapshot {
  return {
    schemaVersion: 2,
    revision: 0,
    updatedAt: Date.now(),
    tasks: [],
    placements: [],
    habits: [],
    occurrences: {},
    busy: [],
    resources: [],
    groups: [],
    settings: { ...DEFAULT_SETTINGS, language: "vi" },
    preferences: {
      boardView: "board",
      sidebarCollapsed: false,
      queueHidden: false,
    },
    welcomed: false,
  };
}
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const string = (v: unknown) => typeof v === "string";
const id = (v: unknown) =>
  typeof v === "string" &&
  v.length > 0 &&
  !["__proto__", "constructor", "prototype"].includes(v);
function requireValue(condition: unknown): asserts condition {
  if (!condition) throw Error("invalid-snapshot");
}
export function validateSnapshot(input: unknown): Snapshot {
  requireValue(record(input));
  if (input.schemaVersion !== 2) throw Error("unsupported-version");
  requireValue(
    Number.isInteger(input.revision) &&
      Number(input.revision) >= 0 &&
      Number.isFinite(input.updatedAt) &&
      typeof input.welcomed === "boolean",
  );
  for (const k of [
    "tasks",
    "placements",
    "habits",
    "busy",
    "resources",
    "groups",
  ])
    requireValue(Array.isArray(input[k]));
  requireValue(
    record(input.occurrences) &&
      record(input.settings) &&
      record(input.preferences),
  );
  const s = input as unknown as Snapshot;
  requireValue(
    ["vi", "en"].includes(s.settings.language) &&
      ["light", "dark", "system"].includes(s.settings.theme) &&
      /^#[\da-f]{6}$/i.test(s.settings.primary) &&
      string(s.settings.boardTitle) &&
      string(s.settings.background) &&
      Number.isInteger(s.settings.archiveDays) &&
      s.settings.archiveDays >= 0,
  );
  requireValue(
    ["board", "calendar"].includes(s.preferences.boardView) &&
      typeof s.preferences.sidebarCollapsed === "boolean" &&
      typeof s.preferences.queueHidden === "boolean" &&
      (s.preferences.streakCollapsed === undefined ||
        typeof s.preferences.streakCollapsed === "boolean"),
  );
  for (const list of [s.tasks, s.habits, s.busy, s.resources]) {
    requireValue(list.every((x) => record(x) && id(x.id)));
    requireValue(new Set(list.map((x) => x.id)).size === list.length);
  }
  requireValue(
    s.groups.every(string) && new Set(s.groups).size === s.groups.length,
  );
  for (const t of s.tasks) {
    requireValue(
      string(t.title) &&
        t.title.trim() &&
        string(t.description) &&
        (t.dueDate === "" || validDate(t.dueDate)) &&
        ["backlog", "todo", "doing", "done"].includes(t.status) &&
        Number.isFinite(t.createdAt) &&
        (t.doneAt === undefined ||
          (Number.isFinite(t.doneAt) && t.status === "done")),
    );
    if (t.checklist) {
      requireValue(
        Array.isArray(t.checklist) &&
          t.checklist.every(
            (c) =>
              record(c) &&
              id(c.id) &&
              string(c.text) &&
              typeof c.done === "boolean",
          ),
      );
      requireValue(
        new Set(t.checklist.map((c) => c.id)).size === t.checklist.length,
      );
    }
  }
  requireValue(
    new Set(s.placements.map((p) => p.taskId)).size === s.placements.length,
  );
  for (const p of s.placements) {
    requireValue(
      s.tasks.some((t) => t.id === p.taskId) &&
        validDate(p.date) &&
        (p.start === null || Number.isInteger(p.start)),
    );
    checkTime({ start: p.start ?? 0, duration: p.duration });
  }
  const days = (v: number[]) =>
    Array.isArray(v) &&
    v.length &&
    new Set(v).size === v.length &&
    v.every((d) => Number.isInteger(d) && d >= 1 && d <= 7);
  for (const h of s.habits) {
    requireValue(
      string(h.name) &&
        h.name.trim() &&
        (h.createdAt === null || Number.isFinite(h.createdAt)) &&
        Array.isArray(h.focus) &&
        h.focus.every((f) => record(f) && id(f.id) && string(f.label)) &&
        new Set(h.focus.map((f) => f.id)).size === h.focus.length &&
        Array.isArray(h.schedules) &&
        h.schedules.length &&
        (!h.archivedFrom || validDate(h.archivedFrom)),
    );
    for (const [i, v] of h.schedules.entries()) {
      requireValue(
        record(v) &&
          validDate(v.from) &&
          days(v.weekdays) &&
          (!i || h.schedules[i - 1].from < v.from),
      );
      if (v.time !== null) checkTime(v.time);
    }
  }
  for (const [key, o] of Object.entries(s.occurrences)) {
    requireValue(
      record(o) &&
        s.habits.some((h) => h.id === o.habitId) &&
        validDate(o.date) &&
        key === occurrenceId(o.habitId, o.date) &&
        (o.focusId === null || string(o.focusId)) &&
        string(o.focusText) &&
        string(o.note) &&
        (o.displaced === undefined || typeof o.displaced === "boolean"),
    );
    if (o.time) checkTime(o.time);
    if (o.completion) {
      requireValue(
        record(o.completion) &&
          (o.completion.at === null || Number.isFinite(o.completion.at)) &&
          string(o.completion.name) &&
          string(o.completion.focusText),
      );
      if (o.completion.time !== null) checkTime(o.completion.time);
    }
  }
  for (const b of s.busy) {
    requireValue(
      Array.isArray(b.versions) &&
        b.versions.length &&
        (!b.removedFrom || validDate(b.removedFrom)),
    );
    for (const [i, v] of b.versions.entries()) {
      requireValue(
        record(v) &&
          validDate(v.from) &&
          string(v.title) &&
          (v.date === null
            ? days(v.weekdays)
            : validDate(v.date) && v.date >= v.from) &&
          (!i || b.versions[i - 1].from < v.from),
      );
      checkTime(v);
    }
  }
  for (const r of s.resources) {
    requireValue(
      string(r.title) &&
        string(r.group) &&
        Number.isFinite(r.createdAt) &&
        (!r.group || s.groups.includes(r.group)),
    );
    try {
      requireValue(["http:", "https:"].includes(new URL(r.url).protocol));
    } catch {
      throw Error("invalid-url");
    }
  }
  checkRecurringHabits(s);
  // Symbolic recurrence validation above; inspect all finite exceptions and rule boundaries below.
  const boundaries = new Set([
    today(),
    ...s.habits.flatMap((h) => [
      ...h.schedules.map((v) => v.from),
      ...(h.archivedFrom ? [h.archivedFrom] : []),
    ]),
    ...s.busy.flatMap((b) => [
      ...b.versions.map((v) => v.from),
      ...(b.removedFrom ? [b.removedFrom] : []),
    ]),
  ]);
  const dates = new Set([
    ...s.placements.map((p) => p.date),
    ...Object.values(s.occurrences).map((o) => o.date),
    ...s.busy.flatMap((b) =>
      b.versions.flatMap((v) => (v.date ? [v.date] : [])),
    ),
  ]);
  for (const from of boundaries) {
    const d = new Date(from + "T12:00:00");
    for (let i = 0; i < 7; i++) {
      dates.add(today(d));
      d.setDate(d.getDate() + 1);
    }
  }
  for (const date of dates) {
    const es = entries(s, date);
    for (let i = 0; i < es.length; i++)
      for (let j = i + 1; j < es.length; j++)
        if (
          !(es[i].kind === "busy" && es[j].kind === "busy") &&
          overlap(es[i], es[j])
        )
          throw Error("collision");
  }
  return s;
}
export function bootstrap(storage: Storage): Snapshot {
  const raw = storage.getItem(STATE_KEY);
  if (raw !== null) return validateSnapshot(JSON.parse(raw));
  const s = emptySnapshot(),
    values: Record<string, unknown> = {};
  let legacy = false;
  for (const k of LEGACY_KEYS) {
    const v = storage.getItem(k);
    if (v !== null) {
      legacy = true;
      values[k] = JSON.parse(v);
    }
  }
  if (legacy) {
    for (const key of [
      "pt.todos",
      "pt.habits",
      "pt.bookmarks",
      "pt.bookmark-groups",
    ])
      if (values[key] !== undefined) requireValue(Array.isArray(values[key]));
    s.tasks = (values["pt.todos"] ?? []) as Snapshot["tasks"];
    s.resources = (values["pt.bookmarks"] ?? []) as Snapshot["resources"];
    s.groups = (values["pt.bookmark-groups"] ?? []) as string[];
    // Older resources may predate the separate group list. Preserve that membership.
    for (const r of s.resources)
      if (r.group && !s.groups.includes(r.group)) s.groups.push(r.group);
    if (values["pt.settings"] !== undefined) {
      requireValue(record(values["pt.settings"]));
      s.settings = { ...s.settings, ...values["pt.settings"], language: "vi" };
    }
    if (values["pt.todo-view"] !== undefined) {
      requireValue(
        ["board", "calendar"].includes(String(values["pt.todo-view"])),
      );
      s.preferences.boardView = values["pt.todo-view"] as "board" | "calendar";
    }
    if (values["pt.welcomed"] !== undefined) {
      requireValue(typeof values["pt.welcomed"] === "boolean");
      s.welcomed = values["pt.welcomed"];
    }
    for (const rawHabit of (values["pt.habits"] ?? []) as unknown[]) {
      requireValue(
        record(rawHabit) &&
          id(rawHabit.id) &&
          string(rawHabit.name) &&
          Array.isArray(rawHabit.done) &&
          rawHabit.done.every(validDate),
      );
      const h = {
        id: rawHabit.id as string,
        name: rawHabit.name as string,
        createdAt: null,
        focus: [],
        schedules: [
          {
            from: [today(), ...(rawHabit.done as string[])].sort()[0],
            weekdays: [1, 2, 3, 4, 5, 6, 7],
            time: null,
          },
        ],
      };
      s.habits.push(h);
      for (const date of new Set(rawHabit.done as string[]))
        s.occurrences[occurrenceId(h.id, date)] = {
          habitId: h.id,
          date,
          focusId: null,
          focusText: "",
          note: "",
          completion: { at: null, name: h.name, focusText: "", time: null },
        };
    }
    s.migration = { from: 1, at: Date.now() };
  }
  validateSnapshot(s);
  storage.setItem(STATE_KEY, JSON.stringify(s));
  return s;
}
export function createStore(storage: Storage) {
  let state = bootstrap(storage),
    error = "";
  setUiLanguage(state.settings.language);
  const listeners = new Set<() => void>(),
    errors = new Set<() => void>();
  const report = (e: unknown) => {
    error = e instanceof Error ? e.message : "write-failed";
    for (const l of errors) l();
  };
  function commit(command: Command, expectedRaw?: string | null): boolean {
    try {
      const raw = storage.getItem(STATE_KEY);
      if (expectedRaw !== undefined && raw !== expectedRaw)
        throw Error("stale-preview");
      if (raw === null) throw Error("missing-storage");
      const latest = validateSnapshot(JSON.parse(raw)),
        next = structuredClone(latest);
      command(next);
      const removed = new Set(
        latest.tasks
          .filter((t) => !next.tasks.some((n) => n.id === t.id))
          .map((t) => t.id),
      );
      next.placements = next.placements.filter((p) => !removed.has(p.taskId));
      for (const t of next.tasks) {
        if (t.status === "done") t.doneAt ??= Date.now();
        else delete t.doneAt;
      }
      next.revision = latest.revision + 1;
      next.updatedAt = Date.now();
      validateSnapshot(next);
      storage.setItem(STATE_KEY, JSON.stringify(next));
      state = next;
      setUiLanguage(state.settings.language);
      error = "";
      for (const l of listeners) l();
      for (const l of errors) l();
      return true;
    } catch (e) {
      report(e);
      return false;
    }
  }
  const onStorage = (e: StorageEvent) => {
    if (e.key === STATE_KEY || e.key === null) {
      try {
        const raw = storage.getItem(STATE_KEY);
        if (!raw) throw Error("missing-storage");
        state = validateSnapshot(JSON.parse(raw));
        setUiLanguage(state.settings.language);
        for (const l of listeners) l();
      } catch (e) {
        report(e);
      }
    }
  };
  window.addEventListener("storage", onStorage);
  return {
    getSnapshot: () => state,
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    commit,
    getError: () => error,
    subscribeError: (l: () => void) => {
      errors.add(l);
      return () => {
        errors.delete(l);
      };
    },
    clearError: () => {
      error = "";
      for (const l of errors) l();
    },
    dispose: () => window.removeEventListener("storage", onStorage),
  };
}
export type TrackerStore = ReturnType<typeof createStore>;
export const backup = (s: Snapshot) =>
  JSON.stringify(
    {
      format: "personal-tracker",
      backupVersion: 2,
      exportedAt: new Date().toISOString(),
      snapshot: s,
    },
    null,
    2,
  );
export function parseBackup(text: string) {
  const data: unknown = JSON.parse(text);
  requireValue(record(data) && data.format === "personal-tracker");
  if (data.backupVersion !== 2) throw Error("unsupported-version");
  requireValue(
    typeof data.exportedAt === "string" &&
      Number.isFinite(Date.parse(data.exportedAt)),
  );
  return {
    snapshot: validateSnapshot(data.snapshot),
    exportedAt: data.exportedAt,
  };
}
