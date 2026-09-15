import { useState } from "react";
import { Flame, Plus, Repeat2 } from "lucide-react";
import { useSnapshot, useTracker } from "../tracker/provider";
import { useI18n } from "../../lib/i18n";
import {
  dueOn,
  occurrence,
  scheduleOn,
  shift,
  streak,
  timeText,
  today,
  toggleHabit,
} from "../planning/engine";
import {
  HabitOccurrenceDialog,
  HabitScheduleDialog,
} from "../planning/dialogs";
export function HabitsPage({ now }: { now: Date }) {
  const s = useSnapshot(),
    store = useTracker(),
    { t, locale } = useI18n(),
    date = today(now),
    [archive, setArchive] = useState(false),
    [edit, setEdit] = useState<string | null | undefined>(undefined),
    [session, setSession] = useState<{ id: string; date: string } | null>(null),
    [historyDate, setHistoryDate] = useState(date);
  return (
    <div className="v2-page v2-habits">
      <div className="v2-page-tools">
        <label className="v2-check">
          <input
            type="checkbox"
            checked={archive}
            onChange={(e) => setArchive(e.target.checked)}
          />
          {t("Hiện habit lưu trữ", "Show archived habits")}
        </label>
        <button className="v2-primary" onClick={() => setEdit(null)}>
          <Plus size={16} />
          {t("Thêm habit", "Add habit")}
        </button>
      </div>
      <div className="v2-page-tools">
        <label>
          {t("Xem lịch sử đến ngày", "History through")}{" "}
          <input
            type="date"
            value={historyDate}
            max={date}
            onChange={(e) => e.target.value && setHistoryDate(e.target.value)}
          />
        </label>
      </div>
      {s.habits
        .filter((h) => archive || !h.archivedFrom || h.archivedFrom > date)
        .map((h) => {
          const rule = scheduleOn(h, date),
            o = occurrence(s, h, date),
            count = streak(s, h, date);
          return (
            <article key={h.id} className="v2-habit-row">
              <div className="v2-icon-well">
                <Repeat2 size={20} />
              </div>
              <div className="v2-habit-main">
                <h2>
                  {h.name}{" "}
                  {h.archivedFrom && h.archivedFrom <= date && (
                    <small>{t("Đã lưu trữ", "Archived")}</small>
                  )}
                </h2>
                <p className="v2-muted">
                  {rule?.time
                    ? `${timeText(rule.time.start)}–${timeText(rule.time.start + rule.time.duration)} · ${rule.weekdays.length === 7 ? t("Hằng ngày", "Every day") : rule.weekdays.map((d) => t(d === 7 ? "CN" : "T" + (d + 1), ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d - 1])).join(" · ")}`
                    : t(
                        "Cần đặt lịch thường lệ • lịch sử được giữ nguyên",
                        "Needs a regular schedule • history preserved",
                      )}
                </p>
                <div className="v2-history">
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = shift(historyDate, i - 6),
                      o = occurrence(s, h, d),
                      due = dueOn(h, d);
                    return (
                      <button
                        key={d}
                        className={`${o.completion ? "done" : ""} ${!due ? "rest" : ""}`}
                        aria-label={`${h.name}, ${d}, ${o.completion ? t("Đã xong", "Completed") : due ? t("Chưa xong", "Incomplete") : t("Ngày nghỉ", "Rest day")}`}
                        title={new Date(d + "T12:00:00").toLocaleDateString(
                          locale,
                        )}
                        disabled={
                          !o.completion && (!due || !scheduleOn(h, d)?.time)
                        }
                        onClick={() => setSession({ id: h.id, date: d })}
                      >
                        {o.completion ? "✓" : d.slice(-2)}
                      </button>
                    );
                  })}
                  <span>
                    <Flame size={15} />
                    {count}{" "}
                    {rule?.weekdays.length === 7
                      ? t("ngày liên tiếp", "day streak")
                      : t("buổi liên tiếp", "session streak")}
                  </span>
                </div>
              </div>
              <div className="v2-habit-actions">
                {dueOn(h, date) && rule?.time && (
                  <>
                    <button
                      aria-pressed={!!o.completion}
                      onClick={() =>
                        store.commit((n) => toggleHabit(n, h.id, date))
                      }
                    >
                      {o.completion
                        ? "✓ Done"
                        : t("Đánh dấu Done", "Mark Done")}
                    </button>
                    <button onClick={() => setSession({ id: h.id, date })}>
                      {t("Buổi hôm nay", "Today’s session")}
                    </button>
                  </>
                )}
                <button
                  disabled={!!h.archivedFrom && h.archivedFrom <= date}
                  onClick={() => setEdit(h.id)}
                >
                  {rule?.time
                    ? t("Sửa lịch", "Edit schedule")
                    : t("Đặt lịch", "Set schedule")}
                </button>
              </div>
            </article>
          );
        })}
      {!s.habits.length && (
        <div className="v2-empty">
          <Repeat2 size={28} />
          <h2>
            {t("Tạo nhịp thường lệ của bạn", "Build your regular rhythm")}
          </h2>
          <p>
            {t(
              "Thêm habit, chọn ngày và giờ thường lệ.",
              "Add a habit and choose its regular days and time.",
            )}
          </p>
          <button onClick={() => setEdit(null)}>
            {t("Thêm habit", "Add habit")}
          </button>
        </div>
      )}
      {edit !== undefined && (
        <HabitScheduleDialog
          key={edit || "new"}
          id={edit || undefined}
          onClose={() => setEdit(undefined)}
        />
      )}{" "}
      {session && (
        <HabitOccurrenceDialog
          key={session.id + session.date}
          id={session.id}
          date={session.date}
          onClose={() => setSession(null)}
        />
      )}
    </div>
  );
}
