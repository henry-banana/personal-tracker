# Personal Tracker V2

Calendar là trang chính để nhìn giờ trống, chọn việc và xếp lịch. Task linh hoạt theo ngày; habit có lịch thường lệ và có thể đổi riêng từng buổi. Dữ liệu lưu trong trình duyệt, không cần tài khoản hay backend.

## Chạy và build

```bash
npm install
npm run dev
npm run build
npm run build:pages
npm run preview -- --base=/personal-tracker/
```

Dev: `http://localhost:5173/`. Bản build Pages: `http://localhost:4173/personal-tracker/`.

`npm run build` dùng base `/`; `build:pages` dùng `/personal-tracker/`. App dùng URL sạch và History API để chuyển module không tải lại toàn trang. Build tự tạo `tasks/index.html`, `habits/index.html`, `resources/index.html`, `settings/index.html` và alias `calendar/index.html`; tất cả cùng tải chung bundle. Vì có file ở từng đường dẫn nên GitHub Pages phục vụ được link trực tiếp và refresh, không cần chuyển hướng qua trang 404.

Calendar dùng URL gốc; các trang khác dùng `/personal-tracker/tasks/`, `/personal-tracker/habits/`… Dấu `/` cuối dành cho đường dẫn thư mục; link không có dấu cuối được chuẩn hóa. Link hash cũ như `#/tasks` được đổi sang URL sạch bằng `replaceState`, giữ query string và không sửa dữ liệu. Thêm module tại `src/lib/routes.ts` để router và build dùng chung danh sách.

Script `preview` chỉ phục vụ bản build tại máy; sản phẩm không có mục điều hướng “Bản xem trước”. Mockup HTML ở thư mục sibling, không được đưa vào bundle app.

Stack giữ React 19, TypeScript, Vite, Tailwind, dnd-kit, Radix và Lucide. Be Vietnam Pro được đóng gói local, không tải font từ CDN.

## Các màn hình

| Màn hình | Chức năng |
|---|---|
| **Calendar** | Day/Week, mini calendar, 24 giờ, giờ trống, danh sách việc, habit bị chặn và streak hiện tại. Kéo/dời/giãn block hoặc dùng form xếp lịch. |
| **Tasks** | Kanban Backlog/Todo/Doing/Done; deadline, mô tả, checklist và lịch deadline riêng. Mỗi task có tối đa một placement trên Calendar. |
| **Habits** | Lặp hằng ngày hoặc chọn thứ; lịch có ngày hiệu lực; đổi giờ, focus, ghi chú và Done riêng từng buổi; lịch sử và streak. |
| **Resources** | Bookmark, lấy tiêu đề link, nhóm riêng, đổi tên và xóa nhóm. |
| **Settings** | VI/EN, tên không gian, light/dark/system, accent, nền; export/import, dữ liệu mẫu, reset và dọn task Done cũ. |

Sidebar và danh sách việc thu gọn độc lập. Mobile mặc định Day và có form thay cho thao tác kéo. Giao diện giữ phong cách v1: bề mặt trung tính, CTA đen/trắng, radius 12/10/6/4 px.

### Quy tắc lịch

- Xếp giờ cho Backlog chuyển Todo. Start chuyển Doing nhưng không đổi giờ. Dời task giữ trạng thái và chỉ cập nhật placement hiện có.
- Done là trạng thái của task, không có “Done phiên”. Mở lại task giữ lịch cũ. Bỏ khỏi lịch giữ task và trạng thái.
- Habit sửa từng buổi trong cùng ngày. Chỉnh lịch thường lệ giữ lịch quá khứ và các buổi đã Done. Lịch sử lưu tên/focus tại thời điểm hoàn thành.
- Streak tính theo các ngày/buổi đến lịch. Ngày nghỉ không ngắt chuỗi; hôm nay chưa Done chưa làm mất chuỗi. Calendar hiển thị streak tính đến hôm nay dù đang xem ngày khác.
- Busy một lần hoặc lặp tuần. Trước khi lưu, xem việc bị ảnh hưởng rồi xác nhận đưa việc chưa Done về chờ xếp. Busy không đẩy block đã Done. Busy chồng Busy được phép.
- Planner dùng bước 15 phút, không vượt 24:00. Khoảng trống được tính từ hợp các block, không lưu thành dữ liệu riêng.

## Dữ liệu và phục hồi

Snapshot có schema/version tại `pt.state.v2`. Provider chung đọc bản mới nhất trước mỗi lệnh, kiểm tra trạng thái kế tiếp và ghi thành công trước khi cập nhật UI. Storage/quota lỗi giữ dữ liệu cũ và hiện thông báo. Tab khác nhận thay đổi qua sự kiện `storage`; đây không phải cơ chế cộng tác hay khóa giao dịch giữa nhiều tab đồng thời.

Lần đầu mở V2 trên **cùng origin với V1**, app đọc các khóa `pt.todos`, `pt.habits`, `pt.bookmarks`, `pt.bookmark-groups`, `pt.settings`, `pt.todo-view`, `pt.welcomed`. ID, thứ tự task, checklist, doneAt, nhóm và appearance được giữ. Habit cũ giữ lịch sử, hiển thị **Cần đặt lịch thường lệ** vì V1 không lưu giờ.

Các khóa V1 không bị xóa. Khi có snapshot V2, app không migration lại, kể cả sau reset. Không có dữ liệu cũ thì bắt đầu rỗng, với lựa chọn nạp mẫu.

Backup JSON gồm snapshot và thời điểm export. Import chỉ hỗ trợ backup production V2 và thay toàn bộ sau màn xác nhận; không nhận backup demo. File lỗi JSON/schema/ID/tham chiếu/lịch hoặc ghi thất bại không đổi dữ liệu hiện tại. Nếu dữ liệu đổi trong lúc xác nhận, mở lại preview trước khi import.

Nếu khởi động không đọc được dữ liệu, màn phục hồi cho tải nguyên nguồn và chọn backup V2 hợp lệ. Không mount state rỗng để ghi đè dữ liệu lỗi. Reset giữ giao diện/tùy chọn; xóa và purge task xóa placement liên quan cùng thao tác.

## Cấu trúc triển khai

```text
src/
  app.tsx                          # Shell, navigation, language, midnight refresh
  features/
    tracker/                       # Model, store, validation, migration, backup, recovery, sample
    planning/                      # Recurrence/conflict/streak engine, Calendar, planning forms
    todo/                          # Kanban, deadline calendar, checklist, task forms
    habits/habits-page.tsx          # Regular schedules, sessions and history
    bookmarks/                     # Resource/group UI and shared-store commands
    settings/settings-page.tsx     # Appearance, backup, reset and purge
  lib/                             # Route catalog/History navigation, settings, UI translations, local clock
  assets/fonts/                    # Local Be Vietnam Pro and OFL license
  v2.css                           # V2 layout and tokens over the existing v1 theme
```

Một số component V1 được giữ trong source để tránh xóa ngoài phạm vi; app V2 không mount dashboard, timer hoặc writer V1 cũ. `use-local-storage.ts` là adapter tương thích đọc/ghi qua provider, không tự ghi từng khóa.

## Bàn giao kiểm tra

Theo yêu cầu triển khai ngày 15/09/2026: **không thêm và không chạy tests**; chỉ build thường và build Pages. Test files hiện có được giữ nguyên; các assertion về dashboard V1 chưa chuyển sang bố cục V2. Build không thay thế kiểm tra tương tác, migration và mobile. Danh sách thao tác để tự kiểm tra nằm ở [docs/v2-manual-review.md](docs/v2-manual-review.md).

Workflow Pages hiện có deploy khi push `main` hoặc chạy thủ công theo cấu hình repository. Việc code/build local không tự publish thay đổi này.
