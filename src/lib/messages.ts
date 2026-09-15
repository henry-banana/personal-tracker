// Explicit UI-copy catalog. Never apply this function to user-entered content.
let language: "vi" | "en" = "vi";
export const setUiLanguage = (value: "vi" | "en") => {
  language = value;
};
export const uiLocale = () => (language === "en" ? "en-GB" : "vi-VN");
export const englishCopy: Record<string, string> = {
  "Hộp thoại": "Dialog",
  "Thêm task": "Add task",
  "Xoá task?": "Delete task?",
  "Xoá task": "Delete task",
  Xoá: "Delete",
  "Hạn chót": "Deadline",
  "Thêm hạn chót": "Add deadline",
  "Mô tả": "Description",
  "Thêm chi tiết...": "Add details...",
  "Tiêu đề": "Title",
  "Tên task...": "Task name...",
  "Thêm chi tiết (không bắt buộc)": "Add details (optional)",
  "Việc cần làm": "Checklist",
  "Bỏ đánh dấu": "Uncheck",
  "Đánh dấu xong": "Mark complete",
  "Xoá việc": "Delete item",
  "Thêm việc cần làm...": "Add checklist item...",
  "Thêm việc": "Add item",
  "Ẩn bớt task cũ": "Hide old tasks",
  "Chưa có task nào trong ngày này.": "No tasks on this date.",
  "Thêm task ngày này": "Add task on this date",
  "Tháng trước": "Previous month",
  "Tháng sau": "Next month",
  "Chọn ngày": "Choose date",
  "Bỏ ngày": "Clear date",
  "Tạo nhóm mới (không bắt buộc)": "Create a group (optional)",
  "Không nhóm": "Ungrouped",
  "Nhóm mới": "New group",
  "Tên nhóm mới": "New group name",
  "Quản lý nhóm": "Manage groups",
  "Chưa có nhóm nào. Thêm nhóm đầu tiên bên dưới.":
    "No groups yet. Add the first one below.",
  "Lưu tên": "Save name",
  Huỷ: "Cancel",
  Hủy: "Cancel",
  "Đổi tên nhóm": "Rename group",
  "Xoá nhóm": "Delete group",
  Thêm: "Add",
  'Resource trong nhóm sẽ chuyển về "Không nhóm".':
    "Resources in this group will become ungrouped.",
  "Thêm resource": "Add resource",
  "Tất cả": "All",
  "Chưa có resource nào": "No resources yet",
  "Xóa resource": "Delete resource",
  "Đường dẫn": "URL",
  "vd: github.com hoặc https://...": "e.g. github.com or https://...",
  "Đang lấy tiêu đề": "Fetching title",
  "Tên hiển thị": "Display name",
  Nhóm: "Group",
  "Lưu lại": "Save",
  "Xác nhận": "Confirm",
  Đóng: "Close",
  "Màu chủ đạo": "Accent color",
  Nền: "Background",
  "Màu tuỳ chỉnh": "Custom color",
  "Tuỳ chỉnh": "Custom",
  "Mã màu": "Hex color",
  Hồng: "Pink",
  "Bạc hà": "Mint",
  Đào: "Peach",
  "Lá thu": "Autumn leaves",
  "Lá xanh": "Green leaves",
  "Khinh khí cầu": "Hot air balloons",
  "Bờ băng": "Ice shore",
  "Đồi cát đêm": "Night dunes",
  "Đèo tuyết": "Snow pass",
  "Sa mạc": "Desert",
  "Rừng thông": "Pine forest",
  Mận: "Plum",
  Than: "Charcoal",
  Rêu: "Moss",
  "Biển sâu": "Deep sea",
  "Cát ấm": "Warm sand",
  "Hồng đất": "Clay",
  "Xếp lịch / Calendar": "Schedule / Calendar",
};
export function uiText(value: string): string {
  if (language === "vi") return value;
  if (englishCopy[value]) return englishCopy[value];
  if (/^Nền /.test(value)) return "Background " + uiText(value.slice(4));
  const group = value.match(/^Xoá nhóm "(.*)"\?$/);
  if (group) return `Delete group "${group[1]}"?`;
  const task = value.match(
    /^"(.*)" sẽ bị xoá vĩnh viễn, không khôi phục được\.$/,
  );
  if (task) return `"${task[1]}" will be permanently deleted.`;
  const archived = value.match(/^\+ (\d+) task cũ \(đã xong > (\d+) ngày\)$/);
  if (archived)
    return `+ ${archived[1]} old tasks (completed > ${archived[2]} days ago)`;
  return value;
}
