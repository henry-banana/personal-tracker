import { Monitor, Moon, Sparkles, Sun, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/cn";
import {
  ARCHIVE_DAY_OPTIONS,
  PURGE_DAY_OPTIONS,
  type Settings,
} from "../lib/settings";
import {
  clearData,
  countDoneOlderThan,
  createSampleData,
  purgeDoneOlderThan,
} from "../lib/sample-data";
import { AppearanceControls } from "./appearance-controls";
import { useConfirm } from "./confirm-dialog";
import { FieldLabel, TextField } from "./form-controls";
import { Modal } from "./modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type SettingsModalProps = {
  open: boolean;
  settings: Settings;
  onClose: () => void;
  onUpdate: (patch: Partial<Settings>) => void;
};

export function SettingsModal({
  open,
  settings,
  onClose,
  onUpdate,
}: SettingsModalProps) {
  const confirm = useConfirm();
  const [purgeDays, setPurgeDays] = useState(30);
  // While a native colour picker is open, fade the dialog so the change is
  // visible live on the dashboard behind it.
  const [peek, setPeek] = useState(false);

  async function handlePurge() {
    const n = countDoneOlderThan(purgeDays);
    const ok = await confirm(
      n === 0
        ? {
            title: "Không có task để dọn",
            message: `Chưa có task đã xong nào cũ hơn ${purgeDays} ngày.`,
            confirmLabel: "Đóng",
            cancelLabel: "Đóng",
          }
        : {
            title: `Xoá ${n} task đã xong?`,
            message: `Các task đã xong cũ hơn ${purgeDays} ngày sẽ bị xoá vĩnh viễn (không khôi phục được). Task chưa xong không bị ảnh hưởng.`,
            confirmLabel: "Xoá",
            danger: true,
          },
    );
    if (ok && n > 0) purgeDoneOlderThan(purgeDays);
  }

  async function handleClear() {
    if (
      await confirm({
        title: "Xoá toàn bộ dữ liệu?",
        message:
          "Tất cả task, resource và thói quen sẽ bị xoá. Cài đặt giao diện được giữ lại.",
        confirmLabel: "Xoá data",
        danger: true,
      })
    ) {
      clearData();
    }
  }

  async function handleSeed() {
    if (
      await confirm({
        title: "Tạo dữ liệu mẫu?",
        message:
          "Thao tác này ghi đè toàn bộ task, resource và thói quen hiện có bằng bộ dữ liệu mẫu.",
        confirmLabel: "Tạo data mẫu",
      })
    ) {
      createSampleData();
    }
  }

  return (
    <Modal
      open={open}
      title="Cài đặt"
      onClose={onClose}
      peek={peek}
    >
      <div className="space-y-5">
        <div>
          <FieldLabel>Tên board</FieldLabel>
          <TextField
            value={settings.boardTitle}
            placeholder="Tên dashboard của bạn"
            onChange={(e) => onUpdate({ boardTitle: e.target.value })}
          />
        </div>

        <div>
          <FieldLabel>Giao diện</FieldLabel>
          <div className="grid grid-cols-3 gap-2">
            <ThemeOption
              active={settings.theme === "light"}
              icon={<Sun size={16} />}
              label="Sáng"
              onClick={() => onUpdate({ theme: "light" })}
            />
            <ThemeOption
              active={settings.theme === "dark"}
              icon={<Moon size={16} />}
              label="Tối"
              onClick={() => onUpdate({ theme: "dark" })}
            />
            <ThemeOption
              active={settings.theme === "system"}
              icon={<Monitor size={16} />}
              label="Hệ thống"
              onClick={() => onUpdate({ theme: "system" })}
            />
          </div>
        </div>

        <AppearanceControls
          settings={settings}
          onUpdate={onUpdate}
          onPreview={setPeek}
        />

        <div className="space-y-4">
          <div>
            <FieldLabel>Tự ẩn task đã xong cũ hơn</FieldLabel>
            <Select
              value={String(settings.archiveDays)}
              onValueChange={(v) => onUpdate({ archiveDays: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ARCHIVE_DAY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <FieldLabel>Xoá hẳn task đã xong cũ hơn</FieldLabel>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  value={String(purgeDays)}
                  onValueChange={(v) => setPurgeDays(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PURGE_DAY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button
                type="button"
                onClick={handlePurge}
                className="flex shrink-0 items-center gap-1.5 rounded-[var(--radius-inner)] bg-surface-muted px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
              >
                <Trash2 size={15} />
                Xoá
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center justify-center gap-2 rounded-[var(--radius-inner)] bg-red-50 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
            >
              <Trash2 size={16} />
              Xoá toàn bộ
            </button>
            <button
              type="button"
              onClick={handleSeed}
              className="flex items-center justify-center gap-2 rounded-[var(--radius-inner)] bg-surface-muted py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
            >
              <Sparkles size={16} />
              Tạo data mẫu
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function ThemeOption({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 items-center justify-center gap-2 rounded-[var(--radius-inner)] text-sm font-medium transition-colors",
        active
          ? "bg-accent-strong text-white"
          : "bg-surface-muted text-ink-soft hover:bg-surface-hover",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
