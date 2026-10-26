# 05 — Màn hình & Điều hướng Frontend

**Stack:** Angular 22 standalone · Angular Material 22 · TailwindCSS 3 · Signals

---

## 1. Cấu trúc thư mục

```
src/app/
  core/
    auth/            auth.service.ts, auth.interceptor.ts, role.guard.ts, must-change-password.guard.ts
    models/          *.model.ts  (sinh từ openapi.yaml)
    services/        sinh-vien.service.ts, dashboard.service.ts, ...
    layout/          main-layout.ts, sidebar.ts, header.ts, footer.ts
    mock/            mock.interceptor.ts, mock-registry.ts, mock-response.ts,
                     registry/{dao-tao,hoc-vu}.registry.ts, data/{dao-tao,hoc-vu,dashboard}.mock.ts
  shared/
    ui/              13 component dùng lại + 1 trang giữ chỗ:
                     app-button, app-card, app-alert, status-badge, empty-state,
                     loading (skeleton + spinner), page-header, search-input,
                     pagination, data-table, form-field, confirm-dialog,
                     date-input, dang-xay-dung
    pipes/           ngay-vn.pipe.ts
  features/
    auth/            login, change-password
    dashboard/       admin, teacher, student
    dao-tao/         sinh-vien, giang-vien, lop-hanh-chinh, mon-hoc, hoc-ky, phong-hoc
    hoc-vu/          lop-hoc-phan, dang-ky, lich-hoc, diem-danh, diem
    style-guide/     trang xem token + component
  routes/            dao-tao.routes.ts, hoc-vu.routes.ts + file menu cùng tên
```

> **Vì sao `shared/ui/` chứ không phải `shared/components/`:** thư mục `ui` gom
> mọi thứ hiển thị dùng lại được (nút, bảng, ô nhập, badge…); `pipes` và
> `directives` để riêng vì không phải component. Hai dự án trước dùng
> `shared/components/`, nhưng ở đây đã chốt `shared/ui/` từ Tuần 2 và toàn bộ
> import đang trỏ vào đó (`@shared/ui/*`).

**Quy ước bắt buộc** (theo 2 dự án trước):
- Component `standalone: true`.
- Dùng `@if`, `@for (x of xs; track x.id)`, **không** dùng `*ngIf`/`*ngFor`.
- State bằng signals: `signal()`, `computed()`, `effect()`.
- Import Material module trực tiếp vào `imports` của component.
- Mỗi feature lazy-load qua `loadChildren`/`loadComponent`.

---

## 2. Điều hướng cấp cao

**Bốn nhóm menu trên sidebar:**

| Nhóm hiển thị | Tên trong code | Nội dung |
|---|---|---|
| Tổng quan | — | Dashboard |
| **Đào tạo** | `dao-tao` | Sinh viên, Giảng viên, Lớp hành chính, Môn học, Học kỳ, Phòng học |
| Học vụ | `hoc-vu` | Lớp học phần, Đăng ký, Lịch học, Điểm danh, Điểm |
| Hệ thống | — | Người dùng, Menu, Cấu hình, Nhật ký, Thùng rác |

> Nhóm thứ hai tên là **"Đào tạo"** ở mọi nơi: nhãn sidebar, tên thư mục
> (`features/dao-tao/`), tên file (`routes/dao-tao.routes.ts`), và cột `nhom`
> trong bảng `menus`.

```
/                     → redirect theo vai trò
/dang-nhap            → SCR-01
/doi-mat-khau         → SCR-02
/dashboard            → SCR-03/04/05 (theo vai trò)
/sinh-vien            → SCR-10 (ADMIN, TEACHER)
/giang-vien           → SCR-13
/lop-hanh-chinh       → SCR-16
/mon-hoc              → SCR-19
/hoc-ky               → SCR-21
/phong-hoc            → SCR-23
/lop-hoc-phan         → SCR-25
/dang-ky              → SCR-30 (ADMIN)
/dang-ky-cua-toi      → SCR-33 (STUDENT)
/lich-hoc             → SCR-35
/diem-danh            → SCR-38
/diem                 → SCR-41
/thung-rac            → SCR-45 (ADMIN)
/menu                 → SCR-47 (ADMIN)
/cau-hinh             → SCR-49 (ADMIN)
```

**Guard:**
- `authGuard`: chưa đăng nhập → `/dang-nhap`.
- `roleGuard(['ADMIN'])`: sai vai trò → `/dashboard` kèm thông báo.
- `mustChangePasswordGuard`: cờ true → `/doi-mat-khau`.
- `guestGuard`: đã đăng nhập → `/dashboard`.

---

## 3. Danh sách màn hình

### 3.1. Xác thực

| Mã | Màn hình | Route | Vai trò | Thành phần chính |
|---|---|---|---|---|
| SCR-01 | Đăng nhập | `/dang-nhap` | công khai | Form email/password, thông báo lỗi, loading |
| SCR-02 | Đổi mật khẩu | `/doi-mat-khau` | mọi vai trò | 3 ô mật khẩu, validate độ mạnh, cảnh báo khi bắt buộc đổi |
| SCR-02B | 🆕 Ảnh đại diện | Dialog trên header (mọi trang) | mọi vai trò | Chọn ảnh → xem trước → tải lên; nút "Gỡ ảnh". Hiển thị ảnh tròn 32 px ở header, `avatar_url` null thì hiện chữ cái đầu tên trên nền màu theo vai trò |

### 3.2. Dashboard

| Mã | Màn hình | Route | Vai trò | Nội dung |
|---|---|---|---|---|
| SCR-03 | Dashboard ADMIN | `/dashboard` | ADMIN | 4 thẻ số liệu, tỷ lệ lấp đầy, danh sách lớp sắp mở, đăng ký gần đây |
| SCR-04 | Dashboard TEACHER | `/dashboard` | TEACHER | Lớp phụ trách, buổi sắp tới, buổi chưa điểm danh, việc cần làm |
| SCR-05 | Dashboard STUDENT | `/dashboard` | STUDENT | Học phần đã đăng ký, thời khóa biểu tuần, GPA, tỷ lệ chuyên cần |

### 3.3. Sinh viên (ADMIN, TEACHER)

| Mã | Màn hình | Route | Ghi chú |
|---|---|---|---|
| SCR-10 ✅ | Danh sách sinh viên | `/sinh-vien` | Bảng: mã, họ tên (+email phụ), lớp, giới tính, ngày sinh, trạng thái, thao tác. Bộ lọc: tìm kiếm, khóa, lớp hành chính, giới tính, trạng thái, khoảng ngày sinh. Sắp xếp cột. Phân trang. **Chọn nhiều dòng → thanh hành động: Kích hoạt / Khóa / Xóa** (FR-02.05b, FR-02.07). Xong với mock. |
| SCR-11 ✅ | Thêm/Sửa sinh viên | `/sinh-vien/them`, `/sinh-vien/:id/sua` | Form tạo/cập nhật hồ sơ; tạo thành công hiện dialog chứa `mat_khau_ban_dau` một lần + nút sao chép. Đã hoàn thành với mock. |
| SCR-12 ✅ | Chi tiết sinh viên | `/sinh-vien/:id` | Ngăn kéo mở từ danh sách, không chuyển trang (giữ vị trí cuộn và bộ lọc). Tải lại theo `id`. Xong với mock. |

> TEACHER thấy bộ cột giới hạn (FR-02.03) và không thấy nút thêm/sửa/xóa.

**Quy ước cột "Lớp" ở mọi màn danh sách:** hiện **mã lớp** (`CNTT-K65-01`), không
hiện tên đầy đủ (`Công nghệ thông tin K65 - Lớp 01`). Tên đầy đủ dài gấp ba mã,
làm bảng tràn ngang trên máy hẹp; vẫn tra được qua tooltip và ở ngăn kéo chi tiết.

**Quy ước thao tác hàng loạt:** luôn hỏi xác nhận kèm số lượng; sau khi xong hiện
khối kết quả `thanh_cong / that_bai` **kèm danh sách dòng lỗi và lý do từng dòng**,
giữ lại các dòng lỗi trong trạng thái đã chọn để người dùng xử lý tiếp.

### 3.4. Giảng viên

| Mã | Màn hình | Route | Vai trò |
|---|---|---|---|
| SCR-13 | Danh sách giảng viên | `/giang-vien` | ADMIN — chọn nhiều dòng để Kích hoạt / Khóa / Xóa (FR-04.04b, FR-04.06) |
| SCR-14 | Thêm/Sửa giảng viên | `/giang-vien/them`, `/giang-vien/:id/sua` | ADMIN |
| SCR-15 | Chi tiết giảng viên | `/giang-vien/:id` | ADMIN, TEACHER (bản thân) |

### 3.5. Lớp hành chính

| Mã | Màn hình | Route | Vai trò |
|---|---|---|---|
| SCR-16 | Danh sách lớp hành chính | `/lop-hanh-chinh` | ADMIN, TEACHER | Cột: mã, tên, khóa, ngành, sĩ số. Lọc theo khóa/ngành |
| SCR-17 | Thêm/Sửa lớp | `/lop-hanh-chinh/them`, `/:id/sua` | ADMIN | Trường: mã, tên, **khóa** (`khoa_hoc`), ngành, năm nhập học, mô tả |
| SCR-18 | Chi tiết lớp + gán sinh viên | `/lop-hanh-chinh/:id` | ADMIN (dialog chọn nhiều sinh viên) |

### 3.6. Môn học, Học kỳ, Phòng học

| Mã | Màn hình | Route | Vai trò |
|---|---|---|---|
| SCR-19 | Danh sách môn học | `/mon-hoc` | mọi vai trò (chỉ xem với TEACHER/STUDENT). ADMIN chọn nhiều dòng để Kích hoạt / Khóa / Xóa (FR-05.04) |
| SCR-20 | Thêm/Sửa môn học | `/mon-hoc/them`, `/:id/sua` | ADMIN |
| SCR-21 | Danh sách học kỳ | `/hoc-ky` | mọi vai trò | Cột: mã, tên, năm học, kỳ thứ, khoảng ngày, đợt đăng ký, trạng thái |
| SCR-22 | Thêm/Sửa học kỳ | `/hoc-ky/them`, `/:id/sua` | ADMIN — có nút chuyển trạng thái. Chỉ hiện nút cho bước kế tiếp hợp lệ: `UPCOMING` → "Bắt đầu kỳ", `ONGOING` → "Đóng kỳ"; `CLOSED` không có nút (BR-24) |
| SCR-23 | Danh sách phòng học | `/phong-hoc` | ADMIN, TEACHER. ADMIN chọn nhiều dòng để Kích hoạt / Khóa / Xóa (FR-07.04) |
| SCR-24 | Thêm/Sửa phòng học | `/phong-hoc/them`, `/:id/sua` | ADMIN |

### 3.7. Lớp học phần

| Mã | Màn hình | Route | Vai trò | Ghi chú |
|---|---|---|---|---|
| SCR-25 | Danh sách lớp học phần | `/lop-hoc-phan` | theo vai trò | Cột: mã, môn, học kỳ, giảng viên, năm thứ, sĩ số `x/y`, trạng thái. Lọc: học kỳ, môn, giảng viên, năm thứ, trạng thái, còn chỗ |
| SCR-26 | Thêm/Sửa lớp học phần | `/lop-hoc-phan/them`, `/:id/sua` | ADMIN | Trường: mã, môn, học kỳ, giảng viên, sĩ số tối đa, **năm thứ** (để trống = mọi năm) | |
| SCR-27 | Chi tiết lớp học phần | `/lop-hoc-phan/:id` | theo vai trò | Tab: thông tin, sinh viên, lịch học, điểm danh, điểm |
| SCR-28 | Danh sách sinh viên của lớp | `/lop-hoc-phan/:id/sinh-vien` | ADMIN, TEACHER | Nút hủy đăng ký (ADMIN) |
| SCR-29 | Bảng điểm lớp | `/lop-hoc-phan/:id/diem` | ADMIN, TEACHER | Nhập inline, nút chốt điểm, badge đã chốt |

### 3.8. Đăng ký học phần

| Mã | Màn hình | Route | Vai trò | Ghi chú |
|---|---|---|---|---|
| SCR-30 | Đăng ký hộ | `/dang-ky` | ADMIN | Chọn sinh viên + lớp, hiển thị kết quả kiểm tra. Nút **"Đăng ký theo lớp hành chính"** mở dialog chọn lớp HP + lớp HC, hiện bảng kết quả từng sinh viên (FR-09.07) |
| SCR-31 | Danh sách đăng ký | `/dang-ky/danh-sach` | ADMIN, TEACHER | Lọc theo học kỳ, lớp, sinh viên, trạng thái |
| SCR-32 | Danh sách lớp đang mở | `/lop-hoc-phan` (view STUDENT) | STUDENT | Hiện số chỗ còn, nút "Đăng ký" |
| SCR-33 | Đăng ký của tôi | `/dang-ky-cua-toi` | STUDENT | Theo học kỳ, trạng thái, nút hủy |

### 3.9. Lịch học

| Mã | Màn hình | Route | Vai trò | Ghi chú |
|---|---|---|---|---|
| SCR-35 | Xem lịch | `/lich-hoc` | theo vai trò | Chế độ tuần/tháng, lọc học kỳ/giảng viên/phòng |
| SCR-36 | Thêm buổi học | `/lop-hoc-phan/:id/lich/them` | ADMIN | |
| SCR-37 | Sinh lịch hàng tuần | `/lop-hoc-phan/:id/lich/sinh` | ADMIN | Chọn thứ, giờ, phòng, khoảng ngày; hiện preview; hiển thị xung đột |

### 3.10. Điểm danh

| Mã | Màn hình | Route | Vai trò | Ghi chú |
|---|---|---|---|---|
| SCR-38 | Danh sách buổi để điểm danh | `/diem-danh` | TEACHER, ADMIN | Lọc lớp, ngày, trạng thái điểm danh |
| SCR-39 | Điểm danh một buổi | `/diem-danh/:sessionId` | TEACHER, ADMIN | Danh sách sinh viên + 4 nút trạng thái + ghi chú + lưu hàng loạt |
| SCR-40 | Thống kê chuyên cần | `/lop-hoc-phan/:id/chuyen-can` | ADMIN, TEACHER | Bảng tổng hợp + tỷ lệ, xuất nháp |

### 3.11. Điểm

| Mã | Màn hình | Route | Vai trò | Ghi chú |
|---|---|---|---|---|
| SCR-41 | Nhập điểm | `/lop-hoc-phan/:id/diem` | TEACHER, ADMIN | Bảng nhập inline, tự tính tổng kết + điểm chữ + hệ 4, cảnh báo khi đã chốt |
| SCR-42 | Điểm của tôi | `/diem-cua-toi` | STUDENT | Theo học kỳ, GPA hệ 10 và hệ 4, **GPA tích lũy + tín chỉ tích lũy** (FR-12.08), cột điểm chữ A/B/C/D/F, trạng thái đạt/không đạt |
| SCR-43 | Lịch sử sửa điểm | `/lop-hoc-phan/:id/diem/lich-su` | ADMIN, TEACHER | Dialog theo từng sinh viên |

### 3.12. Quản trị

| Mã | Màn hình | Route | Vai trò |
|---|---|---|---|
| SCR-45 | Thùng rác | `/thung-rac` | ADMIN — chọn loại thực thể, lọc, khôi phục |
| SCR-47 | Quản lý menu | `/menu` | ADMIN |
| SCR-48 | Thêm/Sửa menu | `/menu/them`, `/:id/sua` | ADMIN |
| SCR-49 | Cấu hình | `/cau-hinh` | ADMIN — trọng số điểm, **bảng quy đổi điểm chữ A/B/C/D/F ↔ hệ 4**, số ngày sửa điểm danh |
| SCR-50 | Quản lý người dùng | `/nguoi-dung` | ADMIN |
| SCR-51 | Thêm/Sửa người dùng | `/nguoi-dung/them`, `/:id/sua` | ADMIN |

### 3.13. Chế độ xem theo vai trò (ADMIN)

| Mã | Thành phần | Vị trí | Hành vi |
|---|---|---|---|
| SCR-52 | Bộ chuyển vai trò | Header, chỉ hiện với ADMIN | Dropdown 3 lựa chọn: ADMIN / Giảng viên / Sinh viên. Lưu `localStorage` khóa `xem_nhu_vai_tro` |
| SCR-53 | Banner chế độ xem | Đầu trang, dưới header | Hiện khi vai trò xem khác ADMIN: "Đang xem với vai trò **Giảng viên** — dữ liệu và quyền vẫn là ADMIN" + nút "Quay lại ADMIN" |

**Hành vi chi tiết**

| Khía cạnh | Mô tả |
|---|---|
| Đổi menu | Sidebar gọi `/api/menus` và lọc theo vai trò **đang xem**, không theo vai trò thật |
| Ẩn/hiện nút | Các nút thêm/sửa/xóa ẩn theo vai trò đang xem |
| Dữ liệu | Vẫn là phạm vi ADMIN (xem mọi lớp, mọi sinh viên) |
| Thao tác ghi | Vẫn dùng quyền ADMIN thật; không bị 403 |
| Dashboard | Hiển thị dashboard của vai trò đang xem nhưng số liệu toàn hệ thống |
| Đăng xuất | Về ADMIN, xóa khóa `localStorage` |
| Chuyển route | Nếu đang ở route không thuộc vai trò xem (ví dụ `/menu` khi xem như STUDENT) → chuyển về `/dashboard` kèm thông báo |

---

## 4. Thành phần dùng chung

| Component | Dùng ở | Chức năng |
|---|---|---|
| `page-header` | mọi màn | Tiêu đề, mô tả, nút hành động |
| `data-table` | mọi danh sách | Cột cấu hình, sắp xếp, chọn dòng, trạng thái rỗng/loading |
| `pagination` | mọi danh sách | Điều hướng trang, chọn `per_page` |
| `search-input` | mọi danh sách | Debounce 300 ms |
| `confirm-dialog` | thao tác xóa/hủy/chốt | Tiêu đề, nội dung, nút xác nhận nguy hiểm |
| `status-badge` | bảng | Màu theo trạng thái (ACTIVE/INACTIVE, OPEN/CLOSED/CANCELLED, DAT/KHONG_DAT...) |
| `empty-state` | danh sách rỗng | Icon, thông điệp, CTA |
| `loading` | toàn cục | Spinner/skeleton |
| `form-field` | mọi form | Label, lỗi, gợi ý |
| `password-reveal-dialog` | tạo tài khoản | Hiện mật khẩu một lần + copy |
| `role-view-switcher` | header (ADMIN) | Chuyển chế độ xem vai trò, đồng bộ `localStorage` |
| `role-view-banner` | đầu trang | Nhắc đang ở chế độ xem, nút quay lại ADMIN |

---

## 5. Trạng thái UI bắt buộc

Mỗi màn hình danh sách phải có 4 trạng thái: **loading**, **có dữ liệu**, **rỗng**, **lỗi** (kèm nút thử lại).

Mỗi form phải có: validate client, hiển thị lỗi 422 theo trường, chặn submit khi đang gửi, thông báo thành công/thất bại.

---

## 6. Hiển thị lỗi nghiệp vụ

Ánh xạ `ma_loi` → thông điệp tiếng Việt:

| `ma_loi` | Thông điệp UI |
|---|---|
| `SECTION_FULL` | Lớp học phần đã đủ sĩ số. |
| `DUPLICATE_ENROLLMENT` | Bạn đã đăng ký lớp học phần này. |
| `DUPLICATE_SUBJECT_IN_SEMESTER` | Bạn đã đăng ký một lớp khác cùng môn trong học kỳ này. |
| `SCHEDULE_CONFLICT` | Trùng lịch: hiển thị danh sách buổi xung đột. |
| `OUTSIDE_REGISTRATION` | Ngoài thời gian đăng ký của học kỳ. |
| `GRADE_LOCKED` | Điểm đã được chốt, không thể sửa. |
| `SEMESTER_CLOSED` | Học kỳ đã đóng, chỉ được xem. |
| `DELETE_BLOCKED` | Không thể xóa: hiển thị danh sách phụ thuộc. |
| `MUST_CHANGE_PASSWORD` | Chuyển hướng `/doi-mat-khau`. |
| `WRONG_STUDY_YEAR` | Lớp này dành cho sinh viên năm thứ {n}. |
| `SEMESTER_TRANSITION_INVALID` | Không thể chuyển trạng thái học kỳ theo hướng này. |
| `SEMESTER_OVERLAP` | Khoảng ngày trùng với học kỳ {tên}. |
| `SESSION_OUTSIDE_SEMESTER` | Ngày buổi học nằm ngoài khoảng ngày của học kỳ. |
| `SUBJECT_CHANGE_BLOCKED` | Lớp đã có sinh viên đăng ký, không đổi được môn/học kỳ. |
| `UPLOAD_NOT_CONFIGURED` | Chức năng tải ảnh chưa được cấu hình. Liên hệ quản trị viên. |
| `UPLOAD_FAILED` | Tải ảnh lên thất bại, vui lòng thử lại. |

**Thao tác hàng loạt:** luôn hiện dialog xác nhận kèm số lượng; sau khi xong hiện bảng kết quả từng dòng (thành công / lỗi kèm lý do), **không** đóng dialog tự động để người dùng đọc được dòng nào hỏng.

---

## 7. Lộ trình dựng FE

1. **Tuần 2 ✅:** core (models, services, mock layer), layout, shared components (14 component `shared/ui`).
2. **Tuần 3–4:** auth, sinh viên, giảng viên, lớp hành chính, môn học, học kỳ, phòng học.
3. **Tuần 5–6:** lớp học phần, lịch học.
4. **Tuần 7–8:** điểm danh, điểm.
5. **Tuần 9:** đăng ký sinh viên, dashboard, thùng rác.
6. **Tuần 10:** hoàn thiện UI, responsive, kiểm thử.

---

## 8. Quy ước khi viết màn hình mới

Rút ra từ màn SCR-10 — áp dụng cho ~43 màn còn lại để không phải sửa lại về sau.

| Quy ước | Lý do |
|---|---|
| Chép `features/dao-tao/sinh-vien/danh-sach.ts` rồi đổi cột + bộ lọc | Bảng, phân trang, tìm kiếm, 4 trạng thái đã nằm trong `shared/ui`, không viết lại |
| State: một `signal` cho tham số truy vấn, một cho kết quả; đổi tham số thì gọi lại API | Lọc/sắp xếp phía client sẽ sai khi phân trang — backend phải tính trên toàn bộ dữ liệu |
| Tách "bộ lọc đang chọn" khỏi "bộ lọc đã áp dụng" khi có khoảng ngày | Áp dụng ngay giữa hai lần chọn ngày sẽ ra kết quả của một nửa bộ lọc |
| Ô `<select>` có option render bằng `@for` phải chọn bằng `[selected]` trên từng option, **không** `[value]` trên thẻ select | Trình duyệt chưa có option khớp thì rơi về option đầu — lỗi âm thầm, có test hồi quy ở `design-system.spec.ts` |
| Popup/ngăn kéo đóng bằng **cả ba cách**: bấm ra ngoài, Escape, và nút đóng | `@HostListener('document:keydown.escape')` + focus vào hộp thoại; gắn `(keydown.escape)` lên div không focus được sẽ không bao giờ chạy |
| Icon dùng Material Icons, **không** ký tự Unicode | `⚠ ✕ ▤ ↕ ◍ ⌕` render khác nhau theo font từng máy, có máy ra ô vuông rỗng |
| Cột chứa mã (lớp, môn, khoá) hiện mã, tên đầy đủ để trong tooltip | Mã ngắn và ổn định; tên đầy đủ làm bảng tràn ngang trên mobile |
| Không có comment chứa dấu `` ` `` bên trong template literal hoặc `styles` | Chuỗi `` ` `` đóng template sớm, gây lỗi cú pháp khó tìm |
