import { emptySnapshot } from "./persistence";
import { occurrenceId, shift, today, weekday } from "../planning/engine";
import type { Snapshot } from "./types";
export function sampleSnapshot(base: Snapshot) {
  const s = emptySnapshot(),
    date = today();
  s.settings = base.settings;
  s.preferences = base.preferences;
  s.welcomed = true;
  s.migration = base.migration;
  s.tasks = [
    {
      id: "sample-m102",
      title: "M102",
      description: "Hoàn thành bài tập.",
      status: "backlog",
      createdAt: Date.now(),
      dueDate: shift(date, 1),
      checklist: [],
    },
    {
      id: "sample-cv",
      title: "Nộp CV",
      description: "Cập nhật CV và gửi hồ sơ.",
      status: "todo",
      createdAt: Date.now(),
      dueDate: shift(date, 2),
      checklist: [{ id: "cv-check", text: "Xuất PDF", done: false }],
    },
    {
      id: "sample-review",
      title: "Review Personal Tracker",
      description: "",
      status: "doing",
      createdAt: Date.now(),
      dueDate: date,
      checklist: [],
    },
  ];
  s.placements = [
    {
      taskId: "sample-review",
      date: shift(date, -1),
      start: 840,
      duration: 30,
    },
    { taskId: "sample-cv", date, start: 900, duration: 30 },
  ];
  s.habits = [
    {
      id: "sample-english",
      name: "English",
      createdAt: Date.now(),
      focus: ["Speaking", "Listening", "Reading", "Writing"].map((label) => ({
        id: label.toLowerCase(),
        label,
      })),
      schedules: [
        {
          from: shift(date, -14),
          weekdays: [1, 2, 3, 4, 5, 6, 7],
          time: { start: 480, duration: 30 },
        },
      ],
    },
    {
      id: "sample-reading",
      name: "Đọc sách",
      createdAt: Date.now(),
      focus: [],
      schedules: [
        {
          from: shift(date, -14),
          weekdays: [1, 2, 3, 4, 5, 6, 7],
          time: { start: 510, duration: 30 },
        },
      ],
    },
    {
      id: "sample-gym",
      name: "Gym",
      createdAt: Date.now(),
      focus: [],
      schedules: [
        {
          from: shift(date, -14),
          weekdays: [1, 3, 5],
          time: { start: 1050, duration: 60 },
        },
      ],
    },
  ];
  for (const h of s.habits)
    for (let i = 7; i > 0; i--) {
      const d = shift(date, -i);
      if (
        h.schedules[0].weekdays.includes(weekday(d)) &&
        !(h.id === "sample-reading" && i === 2)
      )
        s.occurrences[occurrenceId(h.id, d)] = {
          habitId: h.id,
          date: d,
          focusId: null,
          focusText: "",
          note: "",
          completion: {
            at: Date.now(),
            name: h.name,
            focusText: "",
            time: h.schedules[0].time,
          },
        };
    }
  s.busy = [
    {
      id: "sample-work",
      versions: [
        {
          from: shift(date, -14),
          title: "Lịch học",
          start: 540,
          duration: 180,
          weekdays: [1, 3],
          date: null,
        },
      ],
    },
    {
      id: "sample-meeting",
      versions: [
        {
          from: date,
          title: "Cuộc hẹn",
          start: 960,
          duration: 60,
          weekdays: [],
          date,
        },
      ],
    },
  ];
  s.groups = ["Học tập"];
  s.resources = [
    {
      id: "sample-link",
      title: "MDN Web Docs",
      url: "https://developer.mozilla.org/",
      group: "Học tập",
      createdAt: Date.now(),
    },
  ];
  return s;
}
