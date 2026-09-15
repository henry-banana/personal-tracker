import { createId } from "../../lib/id";
import { toIsoDate, todayIso } from "../../lib/date";
import { useLocalStorage } from "../../lib/use-local-storage";

export type Habit = {
  id: string;
  name: string;
  /** ISO dates (yyyy-mm-dd) on which the habit was completed. */
  done: string[];
};

/** Habit store: add / remove / toggle today's completion. */
export function useHabits() {
  const [habits, setHabits] = useLocalStorage<Habit[]>("pt.habits", []);

  function addHabit(name: string) {
    const clean = name.trim();
    if (!clean) return;
    setHabits((prev) => [...prev, { id: createId(), name: clean, done: [] }]);
  }

  function removeHabit(id: string) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }

  function toggleToday(id: string) {
    const t = todayIso();
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              done: h.done.includes(t)
                ? h.done.filter((d) => d !== t)
                : [...h.done, t],
            }
          : h,
      ),
    );
  }

  return { habits, addHabit, removeHabit, toggleToday };
}

function shiftIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

/** Consecutive completed days ending today (or yesterday if today isn't done). */
export function currentStreak(done: string[]): number {
  const set = new Set(done);
  let offset = set.has(shiftIso(0)) ? 0 : -1;
  let streak = 0;
  while (set.has(shiftIso(offset))) {
    streak++;
    offset--;
  }
  return streak;
}

/** The last 7 days (oldest → newest) with completion + today flags. */
export function last7Days(
  done: string[],
): Array<{ iso: string; done: boolean; isToday: boolean }> {
  const set = new Set(done);
  const today = todayIso();
  return Array.from({ length: 7 }, (_, i) => {
    const iso = shiftIso(i - 6);
    return { iso, done: set.has(iso), isToday: iso === today };
  });
}
