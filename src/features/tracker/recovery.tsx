import { useState } from "react";
import { errorMessage } from "../../lib/i18n";
import { downloadText } from "../settings/settings-page";
import { LEGACY_KEYS, parseBackup, STATE_KEY } from "./persistence";

function rawSources() {
  return Object.fromEntries(
    [STATE_KEY, ...LEGACY_KEYS].map((key) => [key, localStorage.getItem(key)]),
  );
}

/** Recovery runs before the provider mounts, so malformed data is never replaced by empty state. */
export function Recovery({ reason }: { reason: string }) {
  const [error, setError] = useState(reason);
  const [preview, setPreview] = useState<
    (ReturnType<typeof parseBackup> & { source: string }) | null
  >(null);

  async function read(file: File) {
    try {
      const parsed = parseBackup(await file.text());
      setPreview({ ...parsed, source: JSON.stringify(rawSources()) });
      setError("");
    } catch (e) {
      setPreview(null);
      setError(e instanceof Error ? e.message : "invalid-snapshot");
    }
  }

  function restore() {
    if (!preview) return;
    try {
      if (JSON.stringify(rawSources()) !== preview.source)
        throw Error("stale-preview");
      // setItem is atomic: quota/storage failure leaves the original source intact.
      localStorage.setItem(STATE_KEY, JSON.stringify(preview.snapshot));
      location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "write-failed");
    }
  }

  return (
    <main className="v2-recovery">
      <h1>Phục hồi dữ liệu / Data recovery</h1>
      <p>
        Dữ liệu gốc được giữ nguyên. Bạn có thể tải bản gốc hoặc khôi phục từ
        backup V2.
      </p>
      <p>
        Your original data is preserved. Download it or restore a V2 backup.
      </p>
      {error && (
        <p role="alert">
          {errorMessage(error)} / {errorMessage(error, true)}
        </p>
      )}
      <button
        onClick={() => {
          try {
            downloadText(
              JSON.stringify(rawSources(), null, 2),
              "personal-tracker-recovery.json",
            );
          } catch {
            setError("missing-storage");
          }
        }}
      >
        Tải dữ liệu gốc / Download raw data
      </button>
      <button onClick={() => location.reload()}>Thử lại / Retry</button>
      <label>
        Chọn backup V2 / Choose V2 backup
        <input
          type="file"
          accept=".json,application/json"
          onChange={(e) => {
            if (e.target.files?.[0]) void read(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </label>
      {preview && (
        <section>
          <h2>Xác nhận thay toàn bộ / Confirm full replacement</h2>
          <p>{new Date(preview.exportedAt).toLocaleString()}</p>
          <p>
            {preview.snapshot.tasks.length} tasks ·{" "}
            {preview.snapshot.habits.length} habits ·{" "}
            {preview.snapshot.resources.length} resources ·{" "}
            {preview.snapshot.busy.length} busy rules
          </p>
          <p>
            Thay toàn bộ nội dung, lịch và cài đặt V2. Các khóa V1 được giữ
            nguyên.
          </p>
          <p>
            Replace all V2 content, schedules and settings. Legacy V1 keys
            remain intact.
          </p>
          <button onClick={() => setPreview(null)}>Hủy / Cancel</button>
          <button onClick={restore}>Khôi phục / Restore</button>
        </section>
      )}
    </main>
  );
}
