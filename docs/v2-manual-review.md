# V2 — Danh sách tự kiểm tra

Code triển khai theo mockup được duyệt ngày 15/09/2026. Người dùng yêu cầu không viết/chạy tests và sẽ tự kiểm tra sau build. Các ô dưới đây là việc cần kiểm tra, chưa phải kết quả đã xác nhận.

Kết quả bàn giao sau thay đổi URL sạch: `npm run build` và `npm run build:pages` đều exit 0; build sinh đủ file entry cho 5 route, dùng chung JS/CSS theo base. `git diff --check` không báo lỗi. Không sửa test files, không chạy tests hoặc browser automation. Vite báo chunk JS khoảng 685 kB (gzip 219 kB); build vẫn thành công.

## Giao diện

- [ ] Mở mặc định Calendar; Tasks, Habits, Resources, Settings chuyển đúng, refresh và back/forward giữ module.
- [ ] URL gốc mở Calendar; mở trực tiếp `/personal-tracker/tasks/`, `/habits/`, `/resources/`, `/settings/` và refresh. Các đường dẫn con đều đặt sau `/personal-tracker/`.
- [ ] Link hash cũ chuyển sang URL sạch; Ctrl/Cmd-click mở module ở tab mới; query string giữ khi chuẩn hóa URL.
- [ ] Thu gọn sidebar và danh sách việc độc lập; reload giữ tùy chọn.
- [ ] VI/EN đổi nhãn, date picker và thông báo; giữ nguyên nội dung task/habit/resource.
- [ ] Light/dark/system, accent tùy chỉnh và các nền vẫn đọc rõ.
- [ ] Ở màn 390 px: Day mặc định, menu mở/đóng, các form, dialog và hành động chính dùng được.
- [ ] Tab/Shift+Tab/Escape trong menu và dialog; focus trở về phần tử hợp lý khi đóng.

## Task và Calendar

- [ ] Nạp mẫu từ Settings; kéo M102 vào giờ trống tạo 30 phút, Backlog → Todo.
- [ ] Start → Doing mà không đổi giờ; kéo sang ngày khác vẫn Doing và chỉ một block.
- [ ] Giãn block, dùng form đổi giờ, thử giao nhau và vượt 24:00; vị trí cũ giữ khi bị từ chối.
- [ ] Thử thả task mới vào khoảng còn 15 phút; hai block sát nhau hợp lệ.
- [ ] Done ở Calendar phản ánh trên Kanban; mở lại giữ lịch cũ và hiện trong Chưa xong nếu ở ngày trước.
- [ ] Chỉ chọn ngày không tự đổi Backlog; bỏ khỏi lịch không xóa task.
- [ ] Checklist, deadline calendar, reorder Kanban, resource/group CRUD vẫn dùng được.

## Habit và Busy

- [ ] English tự hiện hằng ngày; dời/giãn hôm nay không đổi ngày mai.
- [ ] Focus/notes lưu riêng từng buổi; Done/undo phản ánh từ cả Calendar và Habits.
- [ ] Streak tăng một lần; Gym ngày nghỉ không ngắt; sửa lịch sử tính lại theo ngày buổi.
- [ ] Đổi tên/focus/lịch thường lệ giữ lịch quá khứ và thông tin lúc hoàn thành.
- [ ] Archive giữ lịch sử, ngừng buổi chờ từ hôm nay.
- [ ] Tạo Busy chồng task/habit → xem ảnh hưởng → xác nhận → việc chưa Done về chờ xếp.
- [ ] Busy lặp báo habit bị ảnh hưởng lặp lại; Busy chồng Busy hợp lệ.
- [ ] Busy chồng Done bị từ chối; dời habit sang ngày khác bị từ chối.
- [ ] Streak trên Calendar vẫn tính đến hôm nay khi đổi ngày đang xem.
- [ ] Để qua nửa đêm hoặc quay lại tab sau sleep: giờ hiện tại, ngày và streak cập nhật.

## Dữ liệu

- [ ] Trên origin có dữ liệu V1: task, ID/checklist/thứ tự/doneAt, resource groups và appearance được giữ.
- [ ] Habit V1 giữ lịch sử, cần đặt lịch; reload không nhân đôi.
- [ ] Export → sửa nội dung/appearance → import → preview → xác nhận khôi phục đúng.
- [ ] File JSON lỗi, schema/ID/tham chiếu/lịch sai, backup demo và phiên bản không hỗ trợ bị từ chối.
- [ ] Đổi dữ liệu tab khác khi đang mở preview import → yêu cầu xem lại, không ghi đè âm thầm.
- [ ] Storage không ghi được giữ state cũ và báo lỗi.
- [ ] Dữ liệu khởi động lỗi hiển thị phục hồi; có tải nguồn gốc và khôi phục backup hợp lệ.
- [ ] Reset giữ appearance/tùy chọn và không migration lại; purge task không để placement mồ côi.
- [ ] Mở bản Pages ở `/personal-tracker/` và từng trang con, font/nền local tải đúng.

## Giới hạn bàn giao

- Chưa chạy kiểm thử tự động hoặc trình duyệt theo yêu cầu của người dùng.
- Dữ liệu local theo origin; dev ở localhost không tự đọc được localStorage của website Pages.
- Storage event giúp cập nhật giữa tab; không có khóa cho hai lần ghi xảy ra đúng cùng lúc.
- Bundle có cảnh báo kích thước chunk; cần đánh giá cảm nhận tải thực tế trước khi mở việc tối ưu riêng.
