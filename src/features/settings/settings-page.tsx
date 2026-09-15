import { useEffect, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { AppearanceControls } from "../../components/appearance-controls";
import { Modal } from "../../components/modal";
import { useConfirm } from "../../components/confirm-dialog";
import { useI18n } from "../../lib/i18n";
import { useSettings } from "../../lib/use-settings";
import { useSnapshot, useTracker } from "../tracker/provider";
import {
  backup,
  emptySnapshot,
  parseBackup,
  STATE_KEY,
} from "../tracker/persistence";
import { sampleSnapshot } from "../tracker/sample";
import { today } from "../planning/engine";
import { DialogError, Field } from "../planning/dialogs";
export function downloadText(content: string, name: string) {
  const url = URL.createObjectURL(
      new Blob([content], { type: "application/json" }),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function SettingsPage() {
  const s = useSnapshot(),
    store = useTracker(),
    { settings, update } = useSettings(),
    { t, locale } = useI18n(),
    confirm = useConfirm(),
    file = useRef<HTMLInputElement>(null),
    [preview, setPreview] = useState<
      (ReturnType<typeof parseBackup> & { raw: string | null }) | null
    >(null),
    [error, setError] = useState(""),
    [purgeDays, setPurgeDays] = useState(90),
    [title, setTitle] = useState(settings.boardTitle);
  useEffect(() => setTitle(settings.boardTitle), [settings.boardTitle]);
  const download = () =>
    downloadText(
      backup(store.getSnapshot()),
      "personal-tracker-" + today() + ".json",
    );
  async function load(f: File) {
    try {
      const parsed = parseBackup(await f.text());
      setPreview({ ...parsed, raw: localStorage.getItem(STATE_KEY) });
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function action(kind: "reset" | "sample" | "purge") {
    const count = store
      .getSnapshot()
      .tasks.filter(
        (t) =>
          t.status === "done" &&
          t.doneAt &&
          t.doneAt < Date.now() - purgeDays * 86400000,
      ).length;
    const ok = await confirm({
      title:
        kind === "reset"
          ? t("Xóa nội dung?", "Clear content?")
          : kind === "sample"
            ? t("Thay bằng dữ liệu mẫu?", "Replace with sample data?")
            : t("Dọn task đã Done?", "Remove old completed tasks?"),
      message:
        kind === "purge"
          ? t(
              `Xóa ${count} task Done hơn ${purgeDays} ngày và vị trí của chúng.`,
              `Remove ${count} tasks completed over ${purgeDays} days ago and their placements.`,
            )
          : t(
              "Nội dung hiện tại sẽ được thay thế. Giao diện và tùy chọn vẫn giữ. Hãy export trước nếu cần.",
              "Current content will be replaced. Appearance and preferences stay. Export first if needed.",
            ),
      confirmLabel: t("Xác nhận", "Confirm"),
      cancelLabel: t("Hủy", "Cancel"),
      danger: true,
    });
    if (!ok) return;
    store.commit((n) => {
      if (kind === "purge") {
        n.tasks = n.tasks.filter(
          (t) =>
            !(
              t.status === "done" &&
              t.doneAt &&
              t.doneAt < Date.now() - purgeDays * 86400000
            ),
        );
      } else {
        const next =
          kind === "sample"
            ? sampleSnapshot(n)
            : {
                ...emptySnapshot(),
                settings: n.settings,
                preferences: n.preferences,
                welcomed: n.welcomed,
                migration: n.migration,
              };
        Object.assign(n, next);
      }
    });
  }
  return (
    <div className="v2-page v2-settings">
      <section>
        <h2>{t("Giao diện", "Appearance")}</h2>
        <Field label={t("Tên không gian", "Workspace title")}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              const v = title.trim() || "Personal Tracker";
              setTitle(v);
              update({ boardTitle: v });
            }}
          />
        </Field>
        <div className="v2-setting-row">
          <strong>{t("Ngôn ngữ", "Language")}</strong>
          <select
            value={s.settings.language}
            onChange={(e) =>
              store.commit((n) => {
                n.settings.language = e.target.value as "vi" | "en";
              })
            }
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="v2-setting-row">
          <strong>{t("Chế độ hiển thị", "Display mode")}</strong>
          <div className="v2-segment">
            {(["light", "dark", "system"] as const).map((mode, i) => (
              <button
                key={mode}
                aria-pressed={settings.theme === mode}
                onClick={() => update({ theme: mode })}
              >
                {
                  [
                    t("Sáng", "Light"),
                    t("Tối", "Dark"),
                    t("Hệ thống", "System"),
                  ][i]
                }
              </button>
            ))}
          </div>
        </div>
        <div className="v2-appearance">
          <AppearanceControls settings={settings} onUpdate={update} />
        </div>
      </section>
      <section>
        <h2>{t("Dữ liệu & sao lưu", "Data & backup")}</h2>
        <p className="v2-notice">
          {t("Lưu trong trình duyệt này", "Stored in this browser")} ·{" "}
          {s.tasks.length} tasks · {s.habits.length} habits ·{" "}
          {s.resources.length} resources
        </p>
        <div className="v2-setting-row">
          <div>
            <strong>{t("Xuất toàn bộ dữ liệu", "Export all data")}</strong>
            <p>
              {t(
                "Gồm lịch, nội dung, lịch sử và cài đặt.",
                "Includes schedules, content, history and settings.",
              )}
            </p>
          </div>
          <button onClick={download}>
            <Download size={16} />
            Export JSON
          </button>
        </div>
        <div className="v2-setting-row">
          <div>
            <strong>{t("Khôi phục bản sao lưu", "Restore backup")}</strong>
            <p>
              {t(
                "Xem trước rồi xác nhận thay toàn bộ.",
                "Preview, then confirm full replacement.",
              )}
            </p>
          </div>
          <button onClick={() => file.current?.click()}>
            <Upload size={16} />
            Import JSON
          </button>
          <input
            ref={file}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              if (e.target.files?.[0]) void load(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </div>
        <DialogError error={!preview ? error : ""} />
      </section>
      <section>
        <h2>{t("Dọn dữ liệu", "Manage data")}</h2>
        <div className="v2-setting-row">
          <strong>
            {t(
              "Ẩn task Done cũ trên Kanban",
              "Hide old completed tasks in Kanban",
            )}
          </strong>
          <select
            value={settings.archiveDays}
            onChange={(e) => update({ archiveDays: +e.target.value })}
          >
            {[0, 30, 90, 180, 365].map((d) => (
              <option key={d} value={d}>
                {d ? `${d} ${t("ngày", "days")}` : t("Không ẩn", "Never hide")}
              </option>
            ))}
          </select>
        </div>
        <div className="v2-setting-row">
          <strong>{t("Xóa task Done cũ", "Delete old completed tasks")}</strong>
          <div className="v2-inline">
            <select
              value={purgeDays}
              onChange={(e) => setPurgeDays(+e.target.value)}
            >
              {[30, 90, 180, 365].map((d) => (
                <option value={d} key={d}>
                  {d} {t("ngày", "days")}
                </option>
              ))}
            </select>
            <button onClick={() => action("purge")}>
              {t("Dọn", "Delete")}
            </button>
          </div>
        </div>
        <div className="v2-setting-row">
          <strong>{t("Dữ liệu mẫu", "Sample data")}</strong>
          <button onClick={() => action("sample")}>
            {t("Nạp mẫu", "Load sample")}
          </button>
        </div>
        <div className="v2-setting-row">
          <strong>{t("Xóa toàn bộ nội dung", "Clear all content")}</strong>
          <button onClick={() => action("reset")}>
            {t("Xóa nội dung", "Clear content")}
          </button>
        </div>
      </section>
      {preview && (
        <Modal
          open
          title={t("Xác nhận khôi phục", "Confirm restore")}
          onClose={() => setPreview(null)}
        >
          <div className="v2-form">
            <p>{new Date(preview.exportedAt).toLocaleString(locale)}</p>
            <p className="v2-notice">
              {preview.snapshot.tasks.length} tasks ·{" "}
              {preview.snapshot.habits.length} habits ·{" "}
              {preview.snapshot.resources.length} resources ·{" "}
              {preview.snapshot.busy.length} {t("lịch bận", "busy rules")}
            </p>
            <p>
              {t(
                "Thay toàn bộ nội dung, lịch, cài đặt và tùy chọn hiện tại.",
                "Replace all current content, schedules, settings and preferences.",
              )}
            </p>
            <button onClick={download}>
              {t("Tải backup hiện tại", "Download current backup")}
            </button>
            <DialogError error={error} />
            <div className="v2-dialog-actions">
              <button onClick={() => setPreview(null)}>
                {t("Hủy", "Cancel")}
              </button>
              <button
                className="v2-primary"
                onClick={() => {
                  if (
                    store.commit(
                      (n) => Object.assign(n, preview.snapshot),
                      preview.raw,
                    )
                  ) {
                    setPreview(null);
                    setTitle(preview.snapshot.settings.boardTitle);
                  } else setError(store.getError());
                }}
              >
                {t("Khôi phục", "Restore")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
