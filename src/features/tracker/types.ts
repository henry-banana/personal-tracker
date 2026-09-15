import type { Task } from "../todo/task-types";
import type { Settings } from "../../lib/settings";
export type Interval = { start: number; duration: number };
export type Placement = {
  taskId: string;
  date: string;
  start: number | null;
  duration: number;
};
export type Schedule = {
  from: string;
  weekdays: number[];
  time: Interval | null;
};
export type Habit = {
  id: string;
  name: string;
  createdAt: number | null;
  schedules: Schedule[];
  focus: { id: string; label: string }[];
  archivedFrom?: string;
};
export type Occurrence = {
  habitId: string;
  date: string;
  time?: Interval;
  displaced?: boolean;
  focusId: string | null;
  focusText: string;
  note: string;
  completion?: {
    at: number | null;
    name: string;
    focusText: string;
    time: Interval | null;
  };
};
export type BusyVersion = Interval & {
  from: string;
  title: string;
  weekdays: number[];
  date: string | null;
};
export type BusyRule = {
  id: string;
  versions: BusyVersion[];
  removedFrom?: string;
};
export type Resource = {
  id: string;
  title: string;
  url: string;
  group: string;
  createdAt: number;
};
export type Snapshot = {
  schemaVersion: 2;
  revision: number;
  updatedAt: number;
  tasks: Task[];
  placements: Placement[];
  habits: Habit[];
  occurrences: Record<string, Occurrence>;
  busy: BusyRule[];
  resources: Resource[];
  groups: string[];
  settings: Settings & { language: "vi" | "en" };
  preferences: {
    boardView: "board" | "calendar";
    sidebarCollapsed: boolean;
    queueHidden: boolean;
    streakCollapsed?: boolean;
  };
  welcomed: boolean;
  migration?: { from: 1; at: number };
};
export type Entry = Interval & {
  id: string;
  kind: "task" | "habit" | "busy";
  ref: string;
  date: string;
  title: string;
  done: boolean;
  focus?: string;
  status?: Task["status"];
};
export type Command = (state: Snapshot) => void;
export type BusyImpact = {
  entries: Entry[];
  recurring: { habitId: string; name: string }[];
};
