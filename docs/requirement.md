Xây dựng trang Personal Tracker

Hãy tưởng tượng tôi là một người hay quên việc cần làm, có những lúc cần note mà không biết cho vào đâu, có cả mớ bookmark muốn gom theo từng nhóm, ...

Tôi muốn xây dựng một trang dạng dashboard Personal Tracker theo phong các Minimalism Bentor Grid để giải quyết các vấn đề này. Gói gọn trong 1 màn hình duy nhất, dữ liệu lưu ở localStorage nên không cần backend, mỗi trình duyệt coi như một người dùng riêng.

I. Về thiết kế

Dự án sẽ đi theo phong cách Minimalism Bentor Grid, cố gắng fill full màn hình và các card sẽ tự phải làm content theo không gian của nó

Mỗi card sẽ có UI đồng bộ như sau:

1. Rounded lớn
2. Nên trắng
3. Header height cố định bao gồm: Icon + title, bên phải ngoài cùng có action (nếu có)

Tất cả card dùng chung 1 khung cho đồng bộ.

Layout tôi đang đi theo grid 3x3:

- Main content (Todo) sẽ có kích thước 2x2 ở bên trái trên, các chức năng khác cơ bản sẽ là 1x1
- Chức năng nào chưa làm thì cứ mock vào ở dạng title, còn content card thì để chữ comming soon (hiện tại là Thói quen và Chi tiêu)
- Các chức năng đang có: Todo (2 dạng xem canban board hoặc calendar), Ghi chú đơn giản (chỉ cần nhập text), Bookmark (gom theo nhóm), đồng hồ Pomodoro

Trên cùng có 1 header cho cả trang: bên trái là tên board + ngày hôm nay, bên phải có nút Reset dữ liệu và Cài đặt.

Phong cách UI:

- Nên có nền là ảnh, sau đó có container (opacity) padding so với ảnh xong các card đặt trong container
- Phong cách rounded lớn và spacing lớn nhé, lưu ý đồng bộ spacing, spacing giữa các card thì nhỏ, lưu ý quy tắc rounded lớn bao rounded nhỏ hơn 1 chút (container bao card, card bao phần tử bên trong)
- Dùng font Be Vietnam pro
- Không sử dụng shadow
- Không dùng emoji
- Mọi phần tử click được đều phải có con trỏ pointer
- Dùng vite + react + typescript + tailwindCss + lucie react. Kéo-thả canban thì dùng dnd-kit, lịch dùng react-day-picker + date-fns, select / popover theo kiểu shadcn (radix), animation dùng motion (framer-motion) — thêm gì cho board sinh động hơn cũng được nhưng vẫn minimalism
- Không cần header title gì đâu, grid là full UI

Phần cá nhân hóa (nằm trong Cài đặt):

- Đổi được tên board, hiện ngay ở header
- Giao diện Sáng / Tối (dark mode đầy đủ)
- Màu chủ đạo: vài màu chọn nhanh, đổi cái là cả accent đổi theo luôn
- Ảnh nền: vài lựa chọn sẵn (lá thu / lá xanh / trơn)
- Reset dữ liệu: xoá task/note/bookmark nhưng giữ lại cài đặt giao diện

Ảnh tham khảo: /docs/example.webp => Chỉ tham khảo ngôn ngữ, cái gì outscope không cần

II. Về chức năng

1. Todo

Tôi muốn add các task vào không có quên, mỗi task sẽ có Title, Description, Due Date
Sẽ có các trạng thái Backlog, Todo, Doing, Done
Xem được 2 kiểu: Board thì kéo-thả kiểu canban giữa 4 cột, còn Lịch thì task hiện theo Due Date trên calendar

2. Ghi chú

Chỉ cần ghi chú được là được, không cần editor, không cần category, không cần phải nhiều ghi chú
Gõ tới đâu tự lưu tới đó, có đếm số từ cho vui

3. Bookmark

Cái này khi add sẽ được điền link => query lấy title hay favicon thì càng tốt
Cần nhóm được theo nhóm và lọc theo (nếu cần có nhóm, còn dùng không cần nhóm vẫn được)
Nhóm là thực thể riêng, tạo / sửa / xoá được; xoá nhóm thì bookmark trong đó về "Không nhóm"

4. Pomodoro

Cứ fix 1 số loại session vào 25/5 50/10 gì đó, hợp lý là được.
Hết giờ thì tự chuyển focus <=> nghỉ, kêu chuông + bắn thông báo hệ thống

5. Thói quen & Chi tiêu (comming soon)

Hai cái này mock title vào trước, content để comming soon, tính sau
