import { useSnapshot } from "../features/tracker/provider";
export function useI18n() {
  const { settings } = useSnapshot();
  const en = settings.language === "en";
  return {
    en,
    locale: en ? "en-GB" : "vi-VN",
    t: (vi: string, english: string) => (en ? english : vi),
  };
}
export function errorMessage(code: string, en = false) {
  const messages: Record<string, [string, string]> = {
    "invalid-time": [
      "Giờ và thời lượng cần theo bước 15 phút, trong khoảng 00:00–24:00.",
      "Use 15-minute steps within 00:00–24:00.",
    ],
    "invalid-date": ["Ngày không hợp lệ.", "Invalid date."],
    collision: [
      "Khoảng này đã có lịch. Chọn giờ khác.",
      "This time is occupied. Choose another slot.",
    ],
    "same-day": [
      "Chỉ dời buổi habit trong cùng ngày.",
      "Move a habit session within its own day.",
    ],
    "not-due": [
      "Habit không đến lịch ngày này.",
      "This habit is not scheduled for this date.",
    ],
    completed: [
      "Bỏ Done trước khi đổi giờ.",
      "Undo completion before rescheduling.",
    ],
    "reopen-first": [
      "Mở lại task trước khi đổi lịch.",
      "Reopen this task before rescheduling.",
    ],
    "future-completion": [
      "Chưa thể hoàn thành buổi ở ngày tương lai.",
      "Future sessions cannot be completed yet.",
    ],
    "schedule-first": [
      "Đặt lại giờ cho buổi này trước khi đánh dấu hoàn thành.",
      "Schedule this session before marking it complete.",
    ],
    "completed-conflict": [
      "Lịch bận trùng block đã Done. Hãy sửa khoảng bận.",
      "Busy time overlaps a completed block. Change the busy interval.",
    ],
    "schedule-conflict": [
      "Lịch thường lệ trùng lịch khác. Chọn giờ hoặc ngày khác.",
      "The regular schedule conflicts with another item. Choose another time or day.",
    ],
    "stale-preview": [
      "Dữ liệu đã thay đổi. Mở lại hộp thoại để xem dữ liệu mới.",
      "Data changed. Reopen this dialog to review the latest data.",
    ],
    "invalid-snapshot": [
      "Dữ liệu không đúng cấu trúc. Bản hiện tại được giữ nguyên.",
      "Invalid data structure. Existing data is preserved.",
    ],
    "unsupported-version": [
      "Phiên bản dữ liệu chưa được hỗ trợ.",
      "Unsupported data version.",
    ],
    "invalid-url": [
      "Link cần bắt đầu bằng http:// hoặc https://.",
      "Links must use http:// or https://.",
    ],
    "missing-storage": [
      "Không tìm thấy snapshot hiện tại. Hãy tải lại trang để phục hồi.",
      "The current snapshot is missing. Reload to recover.",
    ],
    "empty-name": ["Nhập tên trước khi lưu.", "Enter a name before saving."],
    "confirm-conflicts": [
      "Cần xác nhận các việc phải xếp lại.",
      "Confirm the affected items first.",
    ],
    "write-failed": [
      "Không lưu được dữ liệu. Bản cũ được giữ nguyên.",
      "Could not save. Existing data is preserved.",
    ],
  };
  if (messages[code]) return messages[code][en ? 1 : 0];
  if (/quota|exceeded|storage|access|denied/i.test(code))
    return en
      ? "Browser storage is unavailable or full. Existing data is preserved."
      : "Bộ nhớ trình duyệt đầy hoặc không dùng được. Dữ liệu cũ được giữ nguyên.";
  if (/JSON|Unexpected|position|token/i.test(code))
    return en
      ? "Invalid JSON file. Existing data is preserved."
      : "File JSON không hợp lệ. Dữ liệu cũ được giữ nguyên.";
  return code;
}
