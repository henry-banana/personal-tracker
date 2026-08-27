import { Settings } from "lucide-react";
import { Modal } from "./modal";

type WelcomeModalProps = {
  open: boolean;
  onClose: () => void;
};

/** First-visit intro: explains the board and that the data is just a sample. */
export function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  return (
    <Modal open={open} title="Chào mừng đến với board!" onClose={onClose}>
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-ink-soft">
          Đây là không gian cá nhân của bạn — mọi thứ lưu ngay trên trình duyệt
          này, không gửi đi đâu, không cần đăng nhập.
        </p>

        <p className="rounded-[var(--radius-inner)] bg-surface-sunken p-3.5 text-sm leading-relaxed text-ink-soft">
          Board đang có <strong className="text-ink">data mẫu</strong>. Hãy mở{" "}
          <span className="inline-flex items-center gap-1 font-medium text-ink">
            <Settings size={13} /> Cài đặt
          </span>{" "}
          → <strong className="text-ink">Xoá data</strong> để bắt đầu với board
          trống của riêng mình nhé.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-[var(--radius-inner)] bg-btn py-2.5 text-sm font-semibold text-btn-ink transition-colors hover:opacity-90"
        >
          Bắt đầu khám phá
        </button>
      </div>
    </Modal>
  );
}
