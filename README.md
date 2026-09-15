# Personal Tracker

Dashboard cá nhân theo phong cách **Minimalism Bento Grid**. Một màn hình duy nhất gom các công cụ hay dùng: Todo, Ghi chú, Bookmark, Pomodoro, Thói quen — toàn bộ dữ liệu lưu ở `localStorage`, không cần backend.

## Chạy dự án

```bash
npm install
npm run dev      # mở http://localhost:5173
npm run build    # build production vào dist/
npm run preview  # xem thử bản build
```

Stack: **Vite + React 19 + TypeScript + Tailwind CSS v4 + lucide-react**. Font: Be Vietnam Pro.

## Deploy GitHub Pages

Website: https://henry-banana.github.io/personal-tracker/

Chọn **Settings → Pages → Source → GitHub Actions** trong repo. Workflow
`.github/workflows/deploy.yml` build và deploy khi push `main`, hoặc khi chạy
thủ công từ tab **Actions** trên nhánh `main`.

Build và xem thử bản GitHub Pages tại máy:

```bash
npm run build:pages
npm run preview -- --base=/personal-tracker/
```

Mở http://localhost:4173/personal-tracker/. Bản Pages dùng base
`/personal-tracker/`; `npm run build` vẫn dùng base `/` cho Vercel.

## Chức năng

| Card | Mô tả |
|------|-------|
| **Todo** (2x2) | Hai view: **Board** (Kanban kéo-thả 4 cột Backlog / Todo / Doing / Done) và **Lịch** (task hiện theo Due Date). Task gồm Title, Description, Due Date, Status. |
| **Pomodoro** | Hai preset **Cổ điển** (25/5) và **Chuyên sâu** (50/10), vòng tiến trình, tự chuyển focus ⇄ break. Hết giờ phát chuông (Web Audio) + thông báo hệ thống (Notification API). |
| **Ghi chú** | Một vùng text thuần, tự lưu, đếm số từ. |
| **Bookmark** | Dán link → **tự lấy tiêu đề** trang (qua proxy CORS, cắt gọn ở dấu phân cách) + favicon. Nhóm là thực thể riêng: chọn nhóm có sẵn hoặc tạo mới; không có nhóm thì không hiện list. Xóa được nhóm (bookmark trong đó về "Không nhóm"). |
| **Thói quen** | Tick hoàn thành hôm nay, xem streak (chuỗi ngày liên tiếp) + lưới 7 ngày gần nhất. |

## Header & Cài đặt (cá nhân hóa)

Header toàn trang: bên trái là **tên board + ngày hôm nay**, bên phải có nút **Cài đặt**. Mỗi trình duyệt là một người dùng riêng (localStorage), tùy biến qua modal Cài đặt:

- **Tên board** — hiện ở header.
- **Giao diện** — Sáng / Tối / **Hệ thống** (theo `prefers-color-scheme`, tự đổi khi OS đổi).
- **Màu chủ đạo** — 8 màu đậm sắp theo bánh xe màu + ô **Tuỳ chỉnh** (color picker). Đổi màu **cross-fade mượt** toàn UI (token accent đăng ký `@property`). Nút bấm chính (CTA) dùng luôn màu primary.
- **Nền** — 8 ảnh + dải **màu nền đặc** + ô **Tuỳ chỉnh**, gộp chung một lưới tile có **scroll** khi dài. Ảnh hay màu, chọn cái nào áp cái đó.
- **Xoá data / Tạo data mẫu** — Xoá data giữ lại cài đặt giao diện; tạo data mẫu ghi đè toàn bộ task/note/bookmark.

Theme dùng CSS variable semantic (`--color-surface`, `--color-ink`, `--color-accent`...) flip theo class `.dark`; màu primary chỉ đổi `--color-accent`, các sắc độ phụ tự suy ra bằng `color-mix`. **Nút solid dùng token `--color-btn` = đen/trắng trung tính** (không theo accent) để CTA luôn tĩnh; **tooltip** có token đen riêng. Màu primary (accent) chỉ dùng cho **điểm nhấn + trạng thái hoàn thành**: tab/filter active, ô "today", chấm Done, tick checklist/thói quen, chấm streak. Deadline gần/quá hạn dùng **đỏ**, lửa streak **amber**, còn lại trung tính. Settings áp trước khi paint (trong `main.tsx`) để không nháy theme khi load.

## Thiết kế

- Nền ảnh `public/bg.jpg` → container mờ (full width, có padding) → các card trắng bo góc lớn.
- Quy tắc bo góc: container `2.5rem` bao card `1.75rem` bao phần tử trong `1rem`.
- Spacing giữa card nhỏ và đồng bộ; không shadow, không emoji.
- Mỗi card dùng chung khung `BentoCard`: header cao cố định (icon + title, action bên phải) + body.
- **Mọi phần tử click được đều có `cursor: pointer`** — rule global trong `src/index.css`; phần tử click không phải `<button>/<a>` (vd span có onClick) thêm class `cursor-pointer` thủ công.

## Cấu trúc

```
src/
├── app.tsx                      # Bố cục Bento Grid 3x3 + header + settings
├── components/                  # BentoCard, Modal, header, settings-modal, form controls
├── lib/                         # localStorage, settings, date, url, notify, id, cn
└── features/
    ├── todo/                    # board, calendar, dialog, hook, types
    ├── notes/
    ├── bookmarks/
    ├── pomodoro/
    └── habits/
```

Mỗi file giữ < 200 dòng, đặt tên kebab-case mô tả rõ mục đích.
