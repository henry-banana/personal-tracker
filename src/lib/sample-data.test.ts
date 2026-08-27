import { beforeEach, describe, expect, test } from "vitest";
import type { Task } from "../features/todo/task-types";
import { writeSampleData } from "./sample-data";

describe("sample tracker data", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("seeds a small general tracker with the Backend learning flow", () => {
    writeSampleData();

    const tasks = JSON.parse(
      window.localStorage.getItem("pt.todos") ?? "[]",
    ) as Task[];
    const m101 = tasks.find(
      (task) => task.title === "M101 - Coding Assessment Foundations",
    );

    expect(tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "M101 - Coding Assessment Foundations",
        }),
        expect.objectContaining({
          title: "English - Anh Huy Forum - Lesson 01",
        }),
        expect.objectContaining({ title: "Chinese - HSK 3.0 - Unit 01" }),
      ]),
    );
    expect(m101?.checklist?.map((item) => item.text)).toEqual([
      "Tạo 01 - Lesson bằng AI Studio",
      "Học Lesson và nguồn đã chọn",
      "Tự viết 02 - My Recall",
      "Làm practice hoặc evidence",
      "Feynman với AI học sinh lớp 5",
      "Refactor thành 03 - Refactored Note",
      "Team review và cập nhật Excel",
    ]);
    expect(window.localStorage.getItem("pt.note")).toBeNull();
    expect(
      JSON.parse(window.localStorage.getItem("pt.bookmark-groups") ?? "[]"),
    ).toEqual(["Backend", "English", "Chinese", "General"]);
  });
});
