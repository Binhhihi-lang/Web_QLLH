# 04 — Hợp đồng API

**Base path:** `/api` (không đánh số phiên bản) · **Định dạng:** JSON UTF-8 · **Auth:** Bearer token (Sanctum)

File này là nguồn chân lý cho hợp đồng FE ↔ BE. `openapi.yaml` được sinh từ đây và dùng để sinh model/service phía Angular.

---

## 1. Quy ước chung

### 1.1. Header

```
Accept: application/json
Content-Type: application/json
Authorization: Bearer <token>
```

### 1.2. Envelope thành công

```json
{
  "success": true,
  "message": "Thành công",
  "data": { }
}
```

Danh sách có phân trang:

```json
{
  "success": true,
  "message": "Thành công",
  "data": [ ],
  "meta": {
    "current_page": 1,
    "per_page": 10,
    "total": 120,
    "last_page": 12
  },
  "links": {
    "first": "...?page=1",
    "prev": null,
    "next": "...?page=2",
    "last": "...?page=12"
  }
}
```

### 1.3. Envelope lỗi

```json
{
  "success": false,
  "message": "Lớp học phần đã đầy.",
  "ma_loi": "SECTION_FULL",
  "errors": null
}
```

Lỗi validation (422):

```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ.",
  "ma_loi": "VALIDATION_ERROR",
  "errors": {
    "ma_sv": ["Mã sinh viên này đã tồn tại."],
    "email": ["Email này đã được sử dụng."]
  }
}
```

### 1.4. Mã trạng thái HTTP

| Mã | Dùng khi |
|---|---|
| 200 | Lấy, cập nhật, hành động thành công |
| 201 | Tạo mới thành công |
| 204 | Xóa thành công (không trả body) |
| 401 | Chưa đăng nhập / token hết hạn |
| 403 | Không có quyền, tài khoản bị khóa, chưa đổi mật khẩu lần đầu |
| 404 | Không tìm thấy |
| 409 | Xung đột nghiệp vụ (trùng lịch, hết chỗ, đã chốt điểm, học kỳ đóng, chặn xóa) |
| 422 | Dữ liệu không hợp lệ |
| 429 | Quá giới hạn đăng nhập |

### 1.5. Bảng mã lỗi nghiệp vụ (`ma_loi`)

| Mã | HTTP | Ý nghĩa |
|---|---|---|
| `AUTH_INVALID` | 401 | Sai email hoặc mật khẩu |
| `ACCOUNT_LOCKED` | 403 | Tài khoản bị khóa |
| `MUST_CHANGE_PASSWORD` | 403 | Phải đổi mật khẩu trước khi dùng chức năng khác |
| `FORBIDDEN` | 403 | Không có quyền |
| `NOT_FOUND` | 404 | Không tìm thấy |
| `VALIDATION_ERROR` | 422 | Lỗi validate theo trường |
| `DUPLICATE_CODE` | 422 | Mã đã tồn tại (kể cả bản ghi đã xóa) |
| `DUPLICATE_EMAIL` | 422 | Email đã tồn tại trên toàn hệ thống |
| `SEMESTER_CLOSED` | 409 | Học kỳ đã đóng, chỉ đọc |
| `SEMESTER_HAS_SECTIONS` | 409 | Học kỳ còn lớp học phần |
| `DELETE_BLOCKED` | 409 | Không xóa được do phụ thuộc đang hoạt động |
| `SECTION_FULL` | 409 | Lớp học phần đã đủ sĩ số |
| `SECTION_NOT_OPEN` | 409 | Lớp không nhận đăng ký |
| `DUPLICATE_ENROLLMENT` | 409 | Đã đăng ký lớp này |
| `DUPLICATE_SUBJECT_IN_SEMESTER` | 409 | Đã đăng ký lớp khác cùng môn trong học kỳ |
| `SCHEDULE_CONFLICT` | 409 | Trùng lịch giảng viên/phòng/sinh viên |
| `OUTSIDE_REGISTRATION` | 409 | Ngoài đợt đăng ký |
| `STUDENT_INACTIVE` | 409 | Sinh viên không hoạt động |
| `HAS_GRADE_OR_ATTENDANCE` | 409 | Đã có điểm/điểm danh, không tự hủy được |
| `GRADE_LOCKED` | 409 | Lớp đã chốt điểm |
| `GRADE_INCOMPLETE` | 409 | Chưa đủ điểm thành phần để chốt |
| `RESTORE_PARENT_DELETED` | 409 | Bản ghi cha đã bị xóa |
| `ATTENDANCE_EDIT_EXPIRED` | 409 | Quá hạn sửa điểm danh |

### 1.6. Phân trang, tìm kiếm, lọc, sắp xếp

Mọi endpoint danh sách nhận:

| Query | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `page` | int | 1 | |
| `per_page` | int | 10 | Chỉ nhận 10, 25, 50, 100 |
| `q` | string | | Tìm theo các cột text của resource |
| `sort_by` | string | `id` | Chỉ nhận cột trong whitelist |
| `sort_dir` | `asc`/`desc` | `asc` | |

Bộ lọc riêng ghi ở từng endpoint.

### 1.7. Ngày giờ

- Ngày: `YYYY-MM-DD`
- Giờ: `HH:mm`
- Datetime: `YYYY-MM-DD HH:mm:ss` (giờ Việt Nam, không UTC)

---

## 2. Xác thực & tài khoản

### `POST /api/auth/login` — công khai

Request:
```json
{ "email": "admin@example.com", "password": "password" }
```

Response 200:
```json
{
  "success": true,
  "message": "Đăng nhập thành công.",
  "data": {
    "token": "1|abc...",
    "het_han_luc": "2026-10-27 10:00:00",
    "nguoi_dung": {
      "id": 1,
      "name": "Quản trị viên",
      "email": "admin@example.com",
      "vai_tro": "admin",
      "must_change_password": false,
      "ho_so": null
    }
  }
}
```

Lỗi: 401 `AUTH_INVALID`, 403 `ACCOUNT_LOCKED`, 429.

### `POST /api/auth/logout`
Thu hồi token hiện tại. 204.

### `GET /api/auth/me`
Trả thông tin user + hồ sơ (sinh viên/giảng viên) + danh sách quyền.

### `POST /api/auth/change-password`
```json
{ "mat_khau_cu": "password", "password": "matkhaumoi", "password_confirmation": "matkhaumoi" }
```
200. Đặt `must_change_password = false`, thu hồi các token khác.

### `PUT /api/me`
Sửa hồ sơ cá nhân.
- ADMIN: `name`, `email`.
- TEACHER: `so_dien_thoai`.
- STUDENT: `so_dien_thoai`, `dia_chi`.

---

## 3. Người dùng (ADMIN)

| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `/api/users` | Danh sách; lọc `q`, `vai_tro`, `trang_thai`, `sort_by` |
| POST | `/api/users` | Tạo tài khoản admin |
| GET | `/api/users/{id}` | Chi tiết |
| PUT | `/api/users/{id}` | Cập nhật (`name`, `email`, `vai_tro`, `trang_thai`) |
| DELETE | `/api/users/{id}` | Xóa mềm (chỉ tài khoản ADMIN) |
| PATCH | `/api/users/{id}/status` | `{ "trang_thai": false }` |
| POST | `/api/users/{id}/reset-password` | Trả mật khẩu mới một lần, đặt `must_change_password = true` |

Response tạo mới (201) — **chỉ lần này** có mật khẩu:
```json
{
  "success": true,
  "message": "Tạo tài khoản thành công.",
  "data": {
    "id": 12,
    "name": "Nguyễn Văn A",
    "email": "a@example.com",
    "vai_tro": "giang_vien",
    "trang_thai": true,
    "mat_khau_ban_dau": "X7k2mP9qR4tZ"
  }
}
```

---

## 4. Sinh viên

| Method | Endpoint | Quyền | Ghi chú |
|---|---|---|---|
| GET | `/api/students` | ADMIN, TEACHER (giới hạn) | Lọc `q`, `lop_hanh_chinh_id`, `gioi_tinh`, `trang_thai`, `ngay_sinh_tu`, `ngay_sinh_den` |
| POST | `/api/students` | ADMIN | Tạo kèm tài khoản, trả `mat_khau_ban_dau` một lần |
| GET | `/api/students/{id}` | ADMIN, TEACHER (nếu thuộc lớp mình), STUDENT (bản thân) | |
| PUT | `/api/students/{id}` | ADMIN | |
| DELETE | `/api/students/{id}` | ADMIN | 409 `DELETE_BLOCKED` nếu còn đăng ký ACTIVE |
| PATCH | `/api/students/{id}/status` | ADMIN | |

Response mẫu:
```json
{
  "id": 1,
  "ma_sv": "SV001",
  "ho_ten": "Nguyễn Văn A",
  "ngay_sinh": "2005-03-12",
  "gioi_tinh": true,
  "email": "a@example.com",
  "so_dien_thoai": "0901234567",
  "dia_chi": "Hà Nội",
  "trang_thai": true,
  "lop_hanh_chinh": { "id": 1, "ma_lop": "65PM1", "ten_lop": "65PM1" },
  "da_xoa": false
}
```

---

## 5. Giảng viên

| Method | Endpoint | Quyền |
|---|---|---|
| GET | `/api/teachers` | ADMIN, TEACHER, STUDENT (chỉ xem) |
| POST | `/api/teachers` | ADMIN |
| GET | `/api/teachers/{id}` | ADMIN; TEACHER bản thân |
| PUT | `/api/teachers/{id}` | ADMIN; TEACHER sửa `so_dien_thoai` |
| DELETE | `/api/teachers/{id}` | ADMIN |
| PATCH | `/api/teachers/{id}/status` | ADMIN |

---

## 6. Lớp hành chính

| Method | Endpoint | Quyền |
|---|---|---|
| GET | `/api/admin-classes` | ADMIN, TEACHER, STUDENT (lớp của mình) |
| POST | `/api/admin-classes` | ADMIN |
| GET | `/api/admin-classes/{id}` | ADMIN, TEACHER |
| PUT | `/api/admin-classes/{id}` | ADMIN |
| DELETE | `/api/admin-classes/{id}` | ADMIN |
| GET | `/api/admin-classes/{id}/students` | ADMIN, TEACHER |
| POST | `/api/admin-classes/{id}/students` | ADMIN — body `{ "sinh_vien_ids": [1,2] }` |
| DELETE | `/api/admin-classes/{id}/students/{studentId}` | ADMIN — gỡ khỏi lớp |

---

## 7. Môn học

| Method | Endpoint | Quyền |
|---|---|---|
| GET | `/api/subjects` | mọi vai trò |
| POST | `/api/subjects` | ADMIN |
| GET | `/api/subjects/{id}` | mọi vai trò |
| PUT | `/api/subjects/{id}` | ADMIN |
| DELETE | `/api/subjects/{id}` | ADMIN |
| PATCH | `/api/subjects/{id}/status` | ADMIN |

---

## 8. Học kỳ

| Method | Endpoint | Quyền |
|---|---|---|
| GET | `/api/semesters` | mọi vai trò |
| POST | `/api/semesters` | ADMIN |
| GET | `/api/semesters/{id}` | mọi vai trò |
| PUT | `/api/semesters/{id}` | ADMIN |
| DELETE | `/api/semesters/{id}` | ADMIN — 409 nếu CLOSED hoặc còn lớp |
| PATCH | `/api/semesters/{id}/status` | ADMIN |

---

## 9. Phòng học

| Method | Endpoint | Quyền |
|---|---|---|
| GET | `/api/rooms` | ADMIN, TEACHER |
| POST | `/api/rooms` | ADMIN |
| GET | `/api/rooms/{id}` | ADMIN, TEACHER |
| PUT | `/api/rooms/{id}` | ADMIN |
| DELETE | `/api/rooms/{id}` | ADMIN |
| PATCH | `/api/rooms/{id}/status` | ADMIN |

---

## 10. Lớp học phần

| Method | Endpoint | Quyền | Ghi chú |
|---|---|---|---|
| GET | `/api/sections` | theo vai trò | Lọc `q`, `hoc_ky_id`, `mon_hoc_id`, `giang_vien_id`, `trang_thai`, `con_cho` |
| POST | `/api/sections` | ADMIN | |
| GET | `/api/sections/{id}` | theo vai trò | Kèm `si_so_hien_tai`, `si_so_toi_da`, `da_chot_diem` |
| PUT | `/api/sections/{id}` | ADMIN | Kiểm tra FR-08.03 |
| DELETE | `/api/sections/{id}` | ADMIN | 409 nếu còn đăng ký ACTIVE |
| PATCH | `/api/sections/{id}/status` | ADMIN | Chuyển OPEN/CLOSED/CANCELLED |
| GET | `/api/sections/{id}/students` | ADMIN, TEACHER (lớp mình) | Danh sách sinh viên đang ACTIVE |
| GET | `/api/sections/{id}/grades` | ADMIN, TEACHER (lớp mình) | Bảng điểm cả lớp |
| GET | `/api/sections/{id}/attendance-summary` | ADMIN, TEACHER (lớp mình) | Thống kê chuyên cần |
| POST | `/api/sections/{id}/finalize` | TEACHER (lớp mình) | Chốt điểm; 409 `GRADE_INCOMPLETE` |
| POST | `/api/sections/{id}/unlock` | ADMIN | Body `{ "ly_do": "..." }` |

Response chi tiết:
```json
{
  "id": 10,
  "ma_lop_hp": "INT3306-01",
  "mon_hoc": { "id": 3, "ma_mon": "INT3306", "ten_mon": "Lập trình web", "so_tin_chi": 3 },
  "hoc_ky": { "id": 1, "ma_hoc_ky": "2026-1", "ten_hoc_ky": "Học kỳ 1 2026-2027", "trang_thai": "ONGOING" },
  "giang_vien": { "id": 5, "ma_gv": "GV005", "ho_ten": "Trần Thị B" },
  "si_so_toi_da": 60,
  "si_so_hien_tai": 42,
  "trang_thai": "OPEN",
  "da_chot_diem": false,
  "chot_diem_luc": null,
  "da_xoa": false
}
```

---

## 11. Buổi học

| Method | Endpoint | Quyền | Ghi chú |
|---|---|---|---|
| GET | `/api/sections/{id}/sessions` | theo vai trò | |
| POST | `/api/sections/{id}/sessions` | ADMIN | |
| POST | `/api/sections/{id}/sessions/generate` | ADMIN | Sinh lịch hàng tuần |
| PUT | `/api/sessions/{id}` | ADMIN | Sửa; nếu đã có điểm danh cần `xac_nhan: true` |
| DELETE | `/api/sessions/{id}` | ADMIN | Nếu đã có điểm danh cần `xac_nhan: true` |
| GET | `/api/sessions/{id}/attendance` | ADMIN, TEACHER (lớp mình) | Danh sách + trạng thái |
| PUT | `/api/sessions/{id}/attendance` | TEACHER (lớp mình), ADMIN | Điểm danh hàng loạt |
| GET | `/api/schedules` | theo vai trò | Lịch tổng hợp, lọc `hoc_ky_id`, `giang_vien_id`, `phong_hoc_id`, `tu_ngay`, `den_ngay` |

Sinh lịch hàng tuần — request:
```json
{
  "thu": [2, 4],
  "gio_bat_dau": "07:30",
  "gio_ket_thuc": "09:30",
  "phong_hoc_id": 4,
  "tu_ngay": "2026-11-02",
  "den_ngay": "2026-12-20"
}
```

Thành công 201 trả danh sách buổi đã tạo. Nếu có bất kỳ buổi trùng, 409:
```json
{
  "success": false,
  "message": "Có buổi học bị trùng lịch, không tạo buổi nào.",
  "ma_loi": "SCHEDULE_CONFLICT",
  "errors": {
    "trung_lich": [
      { "ngay_hoc": "2026-11-03", "gio_bat_dau": "07:30", "gio_ket_thuc": "09:30", "loai": "phong_hoc", "doi_tuong": "A101" }
    ]
  }
}
```

Điểm danh hàng loạt — request:
```json
{
  "diem_danh": [
    { "dang_ky_hoc_phan_id": 101, "trang_thai": "PRESENT", "ghi_chu": null },
    { "dang_ky_hoc_phan_id": 102, "trang_thai": "ABSENT", "ghi_chu": "Không phép" }
  ]
}
```

---

## 12. Đăng ký học phần

| Method | Endpoint | Quyền | Ghi chú |
|---|---|---|---|
| GET | `/api/enrollments` | ADMIN, TEACHER | Lọc `hoc_ky_id`, `lop_hoc_phan_id`, `sinh_vien_id`, `trang_thai` |
| POST | `/api/enrollments` | ADMIN | Body `{ "sinh_vien_id": 1, "lop_hoc_phan_id": 10 }` |
| DELETE | `/api/enrollments/{id}` | ADMIN | Hủy, body `{ "ly_do": "..." }` |
| GET | `/api/me/enrollments` | STUDENT | Lọc `hoc_ky_id`, `trang_thai` |
| POST | `/api/me/enrollments` | STUDENT | Body `{ "lop_hoc_phan_id": 10 }` |
| DELETE | `/api/me/enrollments/{id}` | STUDENT | Hủy trong đợt, khi chưa có điểm/điểm danh |

Response đăng ký:
```json
{
  "id": 500,
  "sinh_vien": { "id": 1, "ma_sv": "SV001", "ho_ten": "Nguyễn Văn A" },
  "lop_hoc_phan": { "id": 10, "ma_lop_hp": "INT3306-01", "mon_hoc": "Lập trình web" },
  "trang_thai": "ACTIVE",
  "dang_ky_boi": { "id": 1, "name": "Quản trị viên" },
  "dang_ky_luc": "2026-10-20 09:00:00",
  "huy_boi": null,
  "huy_luc": null
}
```

---

## 13. Điểm

| Method | Endpoint | Quyền | Ghi chú |
|---|---|---|---|
| PUT | `/api/enrollments/{id}/grade` | TEACHER (lớp mình) | Nhập/sửa 1 dòng |
| PUT | `/api/sections/{id}/grades` | TEACHER (lớp mình) | Nhập hàng loạt |
| GET | `/api/enrollments/{id}/grade-history` | ADMIN, TEACHER (lớp mình) | Lịch sử sửa |
| GET | `/api/sections/{id}/grades` | ADMIN, TEACHER (lớp mình) | Bảng điểm |
| GET | `/api/me/grades` | STUDENT | Điểm + GPA theo học kỳ |

Request nhập điểm:
```json
{
  "diem_chuyen_can": 8.5,
  "diem_giua_ky": 7.0,
  "diem_cuoi_ky": 8.0,
  "ly_do": null
}
```

Response:
```json
{
  "id": 77,
  "dang_ky_hoc_phan_id": 500,
  "diem_chuyen_can": 8.5,
  "diem_giua_ky": 7.0,
  "diem_cuoi_ky": 8.0,
  "diem_tong_ket": 7.88,
  "diem_chu": "B",
  "diem_he_4": 3.0,
  "ket_qua": "DAT",
  "da_chot_diem": false
}
```

### `GET /api/me/grades` — response

```json
{
  "hoc_ky": { "id": 1, "ma_hoc_ky": "2026-1", "ten_hoc_ky": "Học kỳ 1 2026-2027" },
  "mon_hoc": [
    {
      "ma_mon": "INT3306",
      "ten_mon": "Lập trình web",
      "so_tin_chi": 3,
      "diem_chuyen_can": 8.5,
      "diem_giua_ky": 7.0,
      "diem_cuoi_ky": 8.0,
      "diem_tong_ket": 7.88,
      "diem_chu": "B",
      "diem_he_4": 3.0,
      "ket_qua": "DAT"
    }
  ],
  "gpa_he_10": 7.88,
  "gpa_he_4": 3.00,
  "tong_tin_chi": 3
}
```

### `GET /api/settings` — phần bảng quy đổi

```json
{
  "diem.trong_so": { "chuyen_can": 0.25, "giua_ky": 0.25, "cuoi_ky": 0.50 },
  "diem.bang_quy_doi": [
    { "tu": 8.5, "den": 10.0, "chu": "A", "he_4": 4.0, "dat": true },
    { "tu": 7.0, "den": 8.49, "chu": "B", "he_4": 3.0, "dat": true },
    { "tu": 5.5, "den": 6.99, "chu": "C", "he_4": 2.0, "dat": true },
    { "tu": 4.0, "den": 5.49, "chu": "D", "he_4": 1.0, "dat": true },
    { "tu": 0.0, "den": 3.99, "chu": "F", "he_4": 0.0, "dat": false }
  ]
}
```

`PUT /api/settings` với `diem.bang_quy_doi` trả 422 nếu khoảng chồng lấn, không phủ kín 0–10, hoặc `chu` không thuộc `A/B/C/D/F`.

---

## 14. Điểm danh cá nhân & dashboard

| Method | Endpoint | Quyền |
|---|---|---|
| GET | `/api/me/schedule` | STUDENT |
| GET | `/api/me/attendance` | STUDENT |
| GET | `/api/me/attendance-summary` | STUDENT |
| GET | `/api/dashboard/admin` | ADMIN |
| GET | `/api/dashboard/teacher` | TEACHER |
| GET | `/api/dashboard/student` | STUDENT |

Dashboard ADMIN:
```json
{
  "so_sinh_vien": 500,
  "so_giang_vien": 50,
  "so_mon_hoc": 30,
  "hoc_ky_hien_tai": { "id": 1, "ma_hoc_ky": "2026-1", "ten_hoc_ky": "Học kỳ 1 2026-2027" },
  "so_lop_hoc_phan": 80,
  "ty_le_lap_day": 0.72,
  "so_dang_ky": 3200
}
```

---

## 15. Xóa mềm & khôi phục

| Method | Endpoint | Quyền | Ghi chú |
|---|---|---|---|
| GET | `/api/trash/{type}` | ADMIN | `type`: `users`, `students`, `teachers`, `admin-classes`, `subjects`, `semesters`, `rooms`, `sections`, `sessions`, `menus` |
| POST | `/api/trash/{type}/{id}/restore` | ADMIN | 409 `RESTORE_PARENT_DELETED` nếu cha đã xóa |

Bộ lọc: `q`, `deleted_by`, `deleted_tu`, `deleted_den`, `page`, `per_page`.

---

## 16. Menu động & cấu hình

| Method | Endpoint | Quyền |
|---|---|---|
| GET | `/api/menus` | mọi vai trò — tự lọc theo `vai_tro` và `trang_thai` |
| GET | `/api/menus/{id}` | ADMIN |
| POST | `/api/menus` | ADMIN |
| PUT | `/api/menus/{id}` | ADMIN |
| DELETE | `/api/menus/{id}` | ADMIN |
| GET | `/api/settings` | ADMIN |
| PUT | `/api/settings` | ADMIN |

---

## 17. Endpoint tiện ích cho dropdown

| Method | Endpoint | Trả về |
|---|---|---|
| GET | `/api/options/semesters` | `[{ id, label, trang_thai }]` |
| GET | `/api/options/subjects` | `[{ id, label, so_tin_chi }]` |
| GET | `/api/options/teachers` | `[{ id, label }]` |
| GET | `/api/options/rooms` | `[{ id, label, suc_chua }]` |
| GET | `/api/options/admin-classes` | `[{ id, label }]` |
| GET | `/api/options/sections` | `[{ id, label, con_cho }]` |

Chỉ trả bản ghi chưa xóa; mặc định `trang_thai = true` trừ khi truyền `tat_ca=1`.

---

## 18. Bảng tóm tắt số lượng endpoint

| Nhóm | Số endpoint |
|---|---|
| Auth & me | 12 |
| Người dùng | 7 |
| Sinh viên | 6 |
| Giảng viên | 6 |
| Lớp hành chính | 8 |
| Môn học | 6 |
| Học kỳ | 6 |
| Phòng học | 6 |
| Lớp học phần | 11 |
| Buổi học & lịch | 8 |
| Đăng ký | 6 |
| Điểm | 5 |
| Dashboard | 3 |
| Thùng rác | 2 |
| Menu & cấu hình | 7 |
| Options | 6 |
| **Tổng** | **~99** |

---

## 19. Sinh `openapi.yaml`

- Viết tay `docs/openapi.yaml` từ tài liệu này, hoặc dùng `scribe`/`l5-swagger` để sinh.
- Quy ước: mỗi endpoint có `summary`, `security`, `parameters`, `requestBody`, `responses` cho 200/201/401/403/404/409/422.
- Khi thêm endpoint mới, cập nhật file này **trước**, rồi mới code.
- FE sinh model TypeScript từ `openapi.yaml` để tránh lệch kiểu.
