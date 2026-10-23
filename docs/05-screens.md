# 05 — Màn hình & Điều hướng Frontend

**Stack:** Angular 22 standalone · Angular Material 22 · TailwindCSS 3 · Signals

---

## 1. Cấu trúc thư mục

```
src/app/
  core/
    auth/            auth.service.ts, auth.interceptor.ts, role.guard.ts, must-change-password.guard.ts
    models/          *.model.ts  (sinh từ openapi.yaml)
    services/        api.service.ts, sinh-vien.service.ts, ...
    layout/          main-layout.component.ts, sidebar, header
  shared/
    components/      data-table, pagination, confirm-dialog, page-header, empty-state,
                     status-badge, search-input, form-field, loading
    pipes/
    directives/
  features/
    auth/            login, change-password
    dashboard/       admin, teacher, student
    sinh-vien/       list, form, detail
    giang-vien/      list, form, detail
    lop-hanh-chinh/  list, form, detail
    mon-hoc/         list, form
    hoc-ky/          list, form
    phong-hoc/       list, form
    lop-hoc-phan/    list, form, detail, students, grades
    dang-ky/         admin-enroll, my-enrollments, section-register
    lich-hoc/        schedule-view, session-form, generate-form
    diem-danh/       attendance-list, attendance-form, summary
    diem/            grade-entry, my-grades, grade-history
    thung-rac/       trash-list
    menu/            list, form
    cau-hinh/        settings
```

**Quy ước bắt buộc** (theo 2 dự án trước):
- Component `standalone: true`.
- Dùng `@if`, `@for (x of xs; track x.id)`, **không** dùng `*ngIf`/`*ngFor`.
- State bằng signals: `signal()`, `computed()`, `effect()`.
- Import Material module trực tiếp vào `imports` của component.
- Mỗi feature lazy-load qua `loadChildren`/`loadComponent`.

---

## 2. Điều hướng cấp cao

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

### 3.2. Dashboard

| Mã | Màn hình | Route | Vai trò | Nội dung |
|---|---|---|---|---|
| SCR-03 | Dashboard ADMIN | `/dashboard` | ADMIN | 4 thẻ số liệu, tỷ lệ lấp đầy, danh sách lớp sắp mở, đăng ký gần đây |
| SCR-04 | Dashboard TEACHER | `/dashboard` | TEACHER | Lớp phụ trách, buổi sắp tới, buổi chưa điểm danh, việc cần làm |
| SCR-05 | Dashboard STUDENT | `/dashboard` | STUDENT | Học phần đã đăng ký, thời khóa biểu tuần, GPA, tỷ lệ chuyên cần |

### 3.3. Sinh viên (ADMIN, TEACHER)

| Mã | Màn hình | Route | Ghi chú |
|---|---|---|---|
| SCR-10 | Danh sách sinh viên | `/sinh-vien` | Bảng: mã, họ tên, lớp, giới tính, ngày sinh, email, SĐT, trạng thái, thao tác. Bộ lọc: tìm kiếm, lớp hành chính, giới tính, trạng thái, khoảng ngày sinh. Sắp xếp cột. Phân trang. |
| SCR-11 | Thêm/Sửa sinh viên | `/sinh-vien/them`, `/sinh-vien/:id/sua` | Form; sau khi tạo hiện dialog chứa `mat_khau_ban_dau` + nút copy |
| SCR-12 | Chi tiết sinh viên | `/sinh-vien/:id` | Thông tin cá nhân, lớp hành chính, danh sách học phần đã đăng ký, điểm, chuyên cần (tab) |

> TEACHER thấy bộ cột giới hạn (FR-02.03) và không thấy nút thêm/sửa/xóa.

### 3.4. Giảng viên

| Mã | Màn hình | Route | Vai trò |
|---|---|---|---|
| SCR-13 | Danh sách giảng viên | `/giang-vien` | ADMIN |
| SCR-14 | Thêm/Sửa giảng viên | `/giang-vien/them`, `/giang-vien/:id/sua` | ADMIN |
| SCR-15 | Chi tiết giảng viên | `/giang-vien/:id` | ADMIN, TEACHER (bản thân) |

### 3.5. Lớp hành chính

| Mã | Màn hình | Route | Vai trò |
|---|---|---|---|
| SCR-16 | Danh sách lớp hành chính | `/lop-hanh-chinh` | ADMIN, TEACHER |
| SCR-17 | Thêm/Sửa lớp | `/lop-hanh-chinh/them`, `/:id/sua` | ADMIN |
| SCR-18 | Chi tiết lớp + gán sinh viên | `/lop-hanh-chinh/:id` | ADMIN (dialog chọn nhiều sinh viên) |

### 3.6. Môn học, Học kỳ, Phòng học

| Mã | Màn hình | Route | Vai trò |
|---|---|---|---|
| SCR-19 | Danh sách môn học | `/mon-hoc` | mọi vai trò (chỉ xem với TEACHER/STUDENT) |
| SCR-20 | Thêm/Sửa môn học | `/mon-hoc/them`, `/:id/sua` | ADMIN |
| SCR-21 | Danh sách học kỳ | `/hoc-ky` | mọi vai trò |
| SCR-22 | Thêm/Sửa học kỳ | `/hoc-ky/them`, `/:id/sua` | ADMIN — có nút chuyển trạng thái |
| SCR-23 | Danh sách phòng học | `/phong-hoc` | ADMIN, TEACHER |
| SCR-24 | Thêm/Sửa phòng học | `/phong-hoc/them`, `/:id/sua` | ADMIN |

### 3.7. Lớp học phần

| Mã | Màn hình | Route | Vai trò | Ghi chú |
|---|---|---|---|---|
| SCR-25 | Danh sách lớp học phần | `/lop-hoc-phan` | theo vai trò | Cột: mã, môn, học kỳ, giảng viên, sĩ số `x/y`, trạng thái. Lọc: học kỳ, môn, giảng viên, trạng thái, còn chỗ |
| SCR-26 | Thêm/Sửa lớp học phần | `/lop-hoc-phan/them`, `/:id/sua` | ADMIN | |
| SCR-27 | Chi tiết lớp học phần | `/lop-hoc-phan/:id` | theo vai trò | Tab: thông tin, sinh viên, lịch học, điểm danh, điểm |
| SCR-28 | Danh sách sinh viên của lớp | `/lop-hoc-phan/:id/sinh-vien` | ADMIN, TEACHER | Nút hủy đăng ký (ADMIN) |
| SCR-29 | Bảng điểm lớp | `/lop-hoc-phan/:id/diem` | ADMIN, TEACHER | Nhập inline, nút chốt điểm, badge đã chốt |

### 3.8. Đăng ký học phần

| Mã | Màn hình | Route | Vai trò | Ghi chú |
|---|---|---|---|---|
| SCR-30 | Đăng ký hộ | `/dang-ky` | ADMIN | Chọn sinh viên + lớp, hiển thị kết quả kiểm tra |
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
| SCR-42 | Điểm của tôi | `/diem-cua-toi` | STUDENT | Theo học kỳ, GPA hệ 10 và hệ 4, cột điểm chữ A/B/C/D/F, trạng thái đạt/không đạt |
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

---

## 7. Lộ trình dựng FE

1. **Tuần 2:** core (auth service, interceptor, guard), layout, shared components.
2. **Tuần 3–4:** auth, sinh viên, giảng viên, lớp hành chính, danh mục.
3. **Tuần 5–6:** lớp học phần, lịch học.
4. **Tuần 7–8:** điểm danh, điểm.
5. **Tuần 9:** đăng ký sinh viên, dashboard, thùng rác.
6. **Tuần 10:** hoàn thiện UI, responsive, kiểm thử.
