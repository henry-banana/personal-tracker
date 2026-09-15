import { toIsoDate } from "./date";
import { createId } from "./id";
import { suspendPersistence } from "./use-local-storage";
import type { Bookmark } from "../features/bookmarks/use-bookmarks";
import type { Habit } from "../features/habits/use-habits";
import type {
  ChecklistItem,
  Task,
  TaskStatus,
} from "../features/todo/task-types";

/** Tracker data keys — wiped by "clear", filled by "create sample". */
const DATA_KEYS = {
  todos: "pt.todos",
  bookmarks: "pt.bookmarks",
  groups: "pt.bookmark-groups",
  habits: "pt.habits",
} as const;

function isoInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

/** Epoch ms `days` from now (negative = past); used for done timestamps. */
function msInDays(days: number): number {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.getTime();
}

type SampleTask = {
  title: string;
  description: string;
  dueOffset: number | null;
  status: TaskStatus;
  checklist?: string[];
};

const SAMPLE_TASKS: SampleTask[] = [
  {
    title: "M101 - Coding Assessment Foundations",
    description:
      "Hoàn thành learning flow của M101. Gắn link Notion vào đây khi bắt đầu.",
    dueOffset: 3,
    status: "doing",
    checklist: [
      "Tạo 01 - Lesson bằng AI Studio",
      "Học Lesson và nguồn đã chọn",
      "Tự viết 02 - My Recall",
      "Làm practice hoặc evidence",
      "Feynman với AI học sinh lớp 5",
      "Refactor thành 03 - Refactored Note",
      "Team review và cập nhật Excel",
    ],
  },
  {
    title: "English - Anh Huy Forum - Lesson 01",
    description: "Học lesson đang mở và hoàn thành output ngắn.",
    dueOffset: 1,
    status: "todo",
  },
  {
    title: "Chinese - HSK 3.0 - Unit 01",
    description: "Học unit hiện tại và review các card Anki đến hạn.",
    dueOffset: 2,
    status: "todo",
  },
  {
    title: "Gym - Buổi tập tiếp theo",
    description: "Mở giáo án hiện tại và ghi lại mức tạ sau buổi tập.",
    dueOffset: 0,
    status: "backlog",
  },
  {
    title: "Tổng kết và chọn việc tuần tới",
    description: "Đóng các task đã xong và chọn một vài việc thực sự cần làm.",
    dueOffset: 6,
    status: "backlog",
  },
];

/** Demo bookmarks: url, title, group. */
const SAMPLE_BOOKMARKS: [string, string, string][] = [
  ["https://dev.java/learn/", "Dev.java - Learn Java", "Backend"],
  ["https://leetcode.com/", "LeetCode", "Backend"],
  ["https://dictionary.cambridge.org/", "Cambridge Dictionary", "English"],
  ["https://www.chinesetest.cn/syllabus", "HSK 3.0 Syllabus", "Chinese"],
  ["https://calendar.google.com", "Google Calendar", "General"],
];

const SAMPLE_GROUPS = ["Backend", "English", "Chinese", "General"];

function buildTasks(): Task[] {
  const now = Date.now();
  return SAMPLE_TASKS.map((sample, i) => {
    const { title, description, dueOffset, status, checklist } = sample;
    const task: Task = {
      id: createId(),
      title,
      description,
      dueDate: dueOffset === null ? "" : isoInDays(dueOffset),
      status,
      createdAt: now - (SAMPLE_TASKS.length - i) * 1000,
    };
    if (checklist) {
      task.checklist = checklist.map<ChecklistItem>((text) => ({
        id: createId(),
        text,
        done: false,
      }));
    }
    // Done demos carry a recent completion time (relative to today) so the
    // auto-hide / purge-old-done features have something to act on.
    if (status === "done") task.doneAt = msInDays(dueOffset ?? -1);
    return task;
  });
}

function buildBookmarks(): Bookmark[] {
  return SAMPLE_BOOKMARKS.map(([url, title, group], i) => ({
    id: createId(),
    url,
    title,
    group,
    createdAt: SAMPLE_BOOKMARKS.length - i,
  }));
}

function buildHabits(): Habit[] {
  return [
    { id: createId(), name: "Tập gym", done: [0, -2, -4].map(isoInDays) },
    { id: createId(), name: "Luyện tiếng Anh", done: [0, -1, -3].map(isoInDays) },
    { id: createId(), name: "Luyện tiếng Trung", done: [-1, -2].map(isoInDays) },
  ];
}

/** Write a full demo dataset into storage (no reload). */
export function writeSampleData() {
  const store = window.localStorage;
  store.setItem(DATA_KEYS.todos, JSON.stringify(buildTasks()));
  store.setItem(DATA_KEYS.bookmarks, JSON.stringify(buildBookmarks()));
  store.setItem(DATA_KEYS.groups, JSON.stringify(SAMPLE_GROUPS));
  store.setItem(DATA_KEYS.habits, JSON.stringify(buildHabits()));
}

/** Seed a demo dataset only if the board has never held tasks. */
export function seedSampleDataIfEmpty() {
  if (window.localStorage.getItem(DATA_KEYS.todos) === null) {
    writeSampleData();
  }
}

/** Overwrite every tracker with a full demo dataset, then reload to render it. */
export function createSampleData() {
  // Stop in-memory fields (the debounced note) from flushing stale text over
  // the fresh sample data during the reload's pagehide.
  suspendPersistence();
  writeSampleData();
  window.location.reload();
}

/** Clear all tracker data and reload, keeping personalization settings. */
export function clearData() {
  // Suspend writes first, else the note's pagehide flush re-saves it post-wipe.
  suspendPersistence();
  for (const key of Object.values(DATA_KEYS)) {
    window.localStorage.removeItem(key);
  }
  window.location.reload();
}

const DAY_MS = 24 * 60 * 60 * 1000;

function readTodos(): Task[] {
  try {
    const raw = window.localStorage.getItem(DATA_KEYS.todos);
    return raw ? (JSON.parse(raw) as Task[]) : [];
  } catch {
    return [];
  }
}

/** How many done tasks were completed more than `days` ago (for the confirm). */
export function countDoneOlderThan(days: number): number {
  const cutoff = Date.now() - days * DAY_MS;
  return readTodos().filter(
    (t) => t.status === "done" && t.doneAt != null && t.doneAt < cutoff,
  ).length;
}

/** Permanently delete done tasks completed more than `days` ago, then reload. */
export function purgeDoneOlderThan(days: number) {
  const cutoff = Date.now() - days * DAY_MS;
  const kept = readTodos().filter(
    (t) => !(t.status === "done" && t.doneAt != null && t.doneAt < cutoff),
  );
  window.localStorage.setItem(DATA_KEYS.todos, JSON.stringify(kept));
  window.location.reload();
}
