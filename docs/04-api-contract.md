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
| 204 | Không dùng — mọi response đều có envelope, kể cả thao tác xóa (trả 200, `data = null`) |
| 401 | Chưa đăng nhập / token hết hạn |
| 403 | Không có quyền, tài khoản bị khóa, chưa đổi mật khẩu lần đầu |
| 404 | Không tìm thấy |
| 409 | Xung đột nghiệp vụ (trùng lịch, hết chỗ, đã chốt điểm, học kỳ đóng, chặn xóa) |
| 422 | Dữ liệu không hợp lệ |
| 429 | Quá giới hạn đăng nhập |
| 502 | Dịch vụ ngoài (Cloudinary) từ chối hoặc không phản hồi |
| 503 | Dịch vụ ngoài chưa được cấu hình |

### 1.5. Bảng mã lỗi nghiệp vụ (`ma_loi`)

| Mã | HTTP | Ý nghĩa |
|---|---|---|
| `AUTH_INVALID` | 401 | Sai email hoặc mật khẩu |
| `UNAUTHENTICATED` | 401 | Chưa đăng nhập, token sai hoặc đã hết hạn |
| `ACCOUNT_LOCKED` | 403 | Tài khoản bị khóa |
| `MUST_CHANGE_PASSWORD` | 403 | Phải đổi mật khẩu trước khi dùng chức năng khác |
| `FORBIDDEN` | 403 | Không có quyền |
| `NOT_FOUND` | 404 | Không tìm thấy |
| `VALIDATION_ERROR` | 422 | Lỗi validate theo trường |
| `TOO_MANY_REQUESTS` | 429 | Quá giới hạn đăng nhập (5 lần/phút) |
| `UPLOAD_FAILED` | 502 | Cloudinary từ chối hoặc không phản hồi |
| `UPLOAD_NOT_CONFIGURED` | 503 | Máy chủ thiếu `CLOUDINARY_NAME` / `API_KEY` / `API_SECRET` |
| `DUPLICATE_CODE` | 422 | Mã đã tồn tại (kể cả bản ghi đã xóa) |
| `DUPLICATE_EMAIL` | 422 | Email đã tồn tại trên toàn hệ thống |
| `SEMESTER_CLOSED` | 409 | Học kỳ đã đóng, chỉ đọc |
| `SEMESTER_HAS_SECTIONS` | 409 | Học kỳ còn lớp học phần |
| `DELETE_BLOCKED` | 409 | Không xóa được do phụ thuộc đang hoạt động |
| `SECTION_FULL` | 409 | Lớp học phần đã đủ sĩ số |
| `SECTION_NOT_OPEN` | 409 | Lớp không nhận đăng ký |
| `DUPLICATE_ENROLLMENT` | 409 | Đã đăng ký lớp này |
| `DUPLICATE_SUBJECT_IN_SEMESTER` | 409 | Đã đăng ký lớp khác cùng môn trong học kỳ |
| `SCHEDULE_CONFLICT` | 409 | Có xung đột lịch; tùy API, lỗi trả chi tiết buổi/đối tượng bị trùng |
| `OUTSIDE_REGISTRATION` | 409 | Ngoài đợt đăng ký |
| `STUDENT_INACTIVE` | 409 | Sinh viên không hoạt động |
| `HAS_GRADE_OR_ATTENDANCE` | 409 | Đã có điểm/điểm danh, không tự hủy được |
| `GRADE_LOCKED` | 409 | Lớp đã chốt điểm |
| `NO_ACTIVE_ENROLLMENTS` | 409 | Lớp chưa có đăng ký đang hoạt động, không thể chốt điểm |
| `GRADE_INCOMPLETE` | 409 | Chưa đủ điểm thành phần để chốt |
| `RESTORE_PARENT_DELETED` | 409 | Bản ghi cha đã bị xóa |
| `ATTENDANCE_EDIT_EXPIRED` | 409 | Quá hạn sửa điểm danh |
| `WRONG_STUDY_YEAR` | 409 | Lớp dành cho năm thứ khác với năm thứ hiện tại của sinh viên |
| `SUBJECT_CHANGE_BLOCKED` | 409 | Không đổi môn của lớp đã có đăng ký ACTIVE (FR-08.03) |
| `SEMESTER_CHANGE_BLOCKED` | 409 | Không đổi học kỳ của lớp đã có đăng ký ACTIVE (FR-08.03) |
| `SEMESTER_TRANSITION_INVALID` | 409 | Chuyển trạng thái học kỳ không hợp lệ (chỉ tiến, một kỳ ONGOING) |
| `SEMESTER_CONFIG_REQUIRED` | 409 | Phải lưu cấu hình điểm trước khi chuyển học kỳ sang ONGOING |
| `SEMESTER_CONFIG_LOCKED` | 409 | Chỉ được sửa cấu hình của học kỳ UPCOMING |
| `SEMESTER_OVERLAP` | 409 | Khoảng ngày học chồng lấn; `errors.hoc_ky_trung` cho biết học kỳ và khoảng ngày bị trùng |
| `SESSION_OUTSIDE_SEMESTER` | 409 | Ngày buổi học nằm ngoài khoảng ngày của học kỳ |
| `UPLOAD_NOT_CONFIGURED` | 503 | Chưa cấu hình Cloudinary trên máy chủ |
| `UPLOAD_FAILED` | 502 | Upload ảnh lên Cloudinary thất bại |

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

### 1.6b. Thao tác hàng loạt (`*/bulk-*`)

Mọi endpoint `bulk-status` / `bulk-delete` dùng chung một hợp đồng (BR-31):

- Body: `{ "ids": [1,2,3] }`, và `trang_thai` với `bulk-status`. Tối đa **500** id, rỗng → 422.
- Xử lý **từng bản ghi độc lập**: một dòng vi phạm điều kiện nghiệp vụ bị từ chối riêng, các dòng khác vẫn thành công.
- Luôn trả **200** (không phải 409) kể cả khi mọi dòng đều lỗi — client đọc `chi_tiet` để biết dòng nào hỏng.

```json
{
  "success": true,
  "message": "Đã xử lý 50 bản ghi.",
  "data": {
    "thanh_cong": 47,
    "that_bai": 3,
    "chi_tiet": [
      { "id": 1, "ket_qua": "THANH_CONG" },
      { "id": 2, "ket_qua": "THAT_BAI", "ma_loi": "DELETE_BLOCKED", "message": "Còn đăng ký ACTIVE ở học kỳ chưa đóng." },
      { "id": 999, "ket_qua": "THAT_BAI", "ma_loi": "NOT_FOUND", "message": "Không tìm thấy bản ghi." }
    ]
  }
}
```

> Khác với `POST /api/enrollments/bulk` (mục 12): ở đó mỗi dòng là một **sinh viên cần đăng ký**, ở đây mỗi dòng là một **bản ghi cần đổi trạng thái hoặc xóa**. Cùng shape kết quả.

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

Sinh viên đăng nhập bằng mã sinh viên:
```json
{ "ma_sv": "SV2026001", "password": "password" }
```

Chỉ gửi một định danh: `email` tiếp tục được hỗ trợ cho tài khoản đã có email;
`ma_sv` chỉ tra hồ sơ sinh viên gắn với tài khoản và không dùng được cho vai trò
khác. Các cổng frontend ADMIN/giảng viên dùng email, cổng sinh viên dùng mã sinh
viên, rồi kiểm tra `vai_tro` trong response có khớp vai trò đã chọn hay không.

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
      "avatar_url": null,
      "vai_tro": "ADMIN",
      "trang_thai": true,
      "must_change_password": false,
      "ho_so": null
    }
  }
}
```

Lỗi: 401 `AUTH_INVALID`, 403 `ACCOUNT_LOCKED`, 429.

### `POST /api/auth/logout`
Thu hồi token hiện tại. Trả **200** kèm envelope (`data = null`) — không dùng 204 vì envelope thống nhất
luôn có body.

### `GET /api/auth/me`
Trả thông tin user + hồ sơ (sinh viên/giảng viên). Quyền **không** trả trong response — client suy ra từ
`vai_tro` và ẩn/hiện giao diện; server luôn kiểm tra lại bằng Policy.

### `POST /api/auth/change-password`
```json
{ "mat_khau_cu": "password", "password": "matkhaumoi", "password_confirmation": "matkhaumoi" }
```
200. Đặt `must_change_password = false`, giữ token hiện tại và thu hồi **các token khác**.

Sai `mat_khau_cu` → 422 `VALIDATION_ERROR` với `errors.mat_khau_cu` (không dùng mã riêng, để giao diện hiển thị
lỗi ngay dưới ô nhập như các lỗi validate khác).

### `PUT /api/me`
Sửa hồ sơ cá nhân.
- ADMIN: `name`, `email`.
- TEACHER: `so_dien_thoai`.
- STUDENT: `so_dien_thoai`, `dia_chi`.

### `POST /api/me/avatar` — ảnh đại diện (FR-01.10)

`multipart/form-data`, field **`anh`**. Mọi vai trò, kể cả ADMIN. Ảnh lưu trên Cloudinary (ADR-019).

| Ràng buộc | Giá trị |
|---|---|
| Định dạng | JPEG, PNG, WebP, GIF — kiểm tra bằng MIME đọc từ nội dung file |
| Kích thước | ≤ 5 MB (`CLOUDINARY_MAX_UPLOAD_KB`) |
| Xử lý | Cắt vuông 512×512, `gravity: face` |

Response 200:
```json
{
  "success": true,
  "message": "Cập nhật ảnh đại diện thành công.",
  "data": {
    "id": 1,
    "name": "Nguyễn Văn A",
    "email": "a@example.com",
    "avatar_url": "https://res.cloudinary.com/demo/image/upload/v1/qllh/avatars/abc123.jpg",
    "vai_tro": "SINH_VIEN",
    "trang_thai": true,
    "must_change_password": false,
    "ho_so": { "loai": "sinh_vien", "id": 1, "ma_sv": "SV001", "ho_ten": "Nguyễn Văn A" }
  }
}
```

| Lỗi | Khi nào |
|---|---|
| 422 `VALIDATION_ERROR` | Thiếu file, sai định dạng, quá kích thước |
| 502 `UPLOAD_FAILED` | Cloudinary từ chối hoặc không phản hồi |
| 503 `UPLOAD_NOT_CONFIGURED` | Máy chủ chưa có `CLOUDINARY_NAME` / `API_KEY` / `API_SECRET` |

### `DELETE /api/me/avatar` — gỡ ảnh (FR-01.11)

Xóa ảnh trên Cloudinary và đặt `avatar_url = null`. Trả 200 kèm hồ sơ đã cập nhật. Không lỗi khi người dùng chưa từng có ảnh.

---

## 3. Người dùng (ADMIN)

| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `/api/users` | Danh sách; lọc `q`, `vai_tro`, `trang_thai`, `sort_by` |
| POST | `/api/users` | Tạo tài khoản admin |
| GET | `/api/users/{id}` | Chi tiết |
| PUT | `/api/users/{id}` | Cập nhật (`name`, `email`, `vai_tro`, `trang_thai`) |
| DELETE | `/api/users/{id}` | Xóa mềm (chỉ tài khoản ADMIN) |
| PATCH | `/api/users/{id}/status` | `{ "trang_thai": false }` — khóa thì **thu hồi toàn bộ token** (BR-30) |
| PATCH | `/api/users/bulk-status` | Khóa/mở nhiều tài khoản — body `{ "ids": [1,2,3], "trang_thai": false }` |
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
    "vai_tro": "GIANG_VIEN",
    "trang_thai": true,
    "mat_khau_ban_dau": "X7k2mP9qR4tZ"
  }
}
```

---

## 3b. Khoa & Ngành (ADR-020)

Danh mục hai cấp: mỗi ngành thuộc đúng một khoa. Đọc mở cho cả ba vai trò vì là
dữ liệu tham chiếu; ghi chỉ ADMIN.

| Method | Endpoint | Quyền |
|---|---|---|
| GET | `/api/khoa` | mọi vai trò — lọc `q`, `trang_thai` |
| POST | `/api/khoa` | ADMIN |
| GET | `/api/khoa/{id}` | mọi vai trò |
| PUT | `/api/khoa/{id}` | ADMIN |
| DELETE | `/api/khoa/{id}` | ADMIN |
| GET | `/api/nganh` | mọi vai trò — lọc `q`, `khoa_id`, `trang_thai` |
| POST | `/api/nganh` | ADMIN |
| GET | `/api/nganh/{id}` | mọi vai trò |
| PUT | `/api/nganh/{id}` | ADMIN |
| DELETE | `/api/nganh/{id}` | ADMIN |

Response `khoa`:

```json
{ "id": 1, "ma_khoa": "CNTT", "ten_khoa": "Công nghệ thông tin", "mo_ta": null,
  "trang_thai": true, "so_nganh": 5, "da_xoa": false }
```

Response `nganh`:

```json
{ "id": 1, "khoa_id": 1,
  "khoa": { "id": 1, "ma_khoa": "CNTT", "ten_khoa": "Công nghệ thông tin" },
  "ma_nganh": "KTPM", "ten_nganh": "Công nghệ phần mềm", "mo_ta": null,
  "trang_thai": true, "da_xoa": false }
```

| Lỗi | Khi nào |
|---|---|
| 422 `VALIDATION_ERROR` | `ma_khoa`/`ma_nganh` trùng (kể cả bản ghi xóa mềm); `khoa_id` không tồn tại; trùng `ten_nganh` trong cùng khoa |
| 409 `DELETE_BLOCKED` | Xóa khoa còn ngành hoặc còn môn học; xóa ngành còn giảng viên hoặc còn lớp hành chính |

Cả hai loại xóa mềm và **vào được thùng rác**: `GET /api/trash/khoa`, `GET /api/trash/nganh`,
`POST /api/trash/{type}/{id}/restore`.

---

## 4. Sinh viên

| Method | Endpoint | Quyền | Ghi chú |
|---|---|---|---|
| GET | `/api/students` | ADMIN, TEACHER (giới hạn) | Lọc `q`, `lop_hanh_chinh_id`, `khoa_hoc`, `gioi_tinh`, `trang_thai`, `ngay_sinh_tu`, `ngay_sinh_den` |
| POST | `/api/students` | ADMIN | Tạo kèm tài khoản, trả `mat_khau_ban_dau` một lần |
| GET | `/api/students/{id}` | ADMIN, TEACHER (nếu thuộc lớp mình), STUDENT (bản thân) | |
| PUT | `/api/students/{id}` | ADMIN | |
| DELETE | `/api/students/{id}` | ADMIN | 409 `DELETE_BLOCKED` nếu còn đăng ký ACTIVE |
| PATCH | `/api/students/{id}/status` | ADMIN | |
| PATCH | `/api/students/bulk-status` | ADMIN | `{ "ids": [1,2,3], "trang_thai": false }` — khóa thì khóa tài khoản + thu hồi token (BR-30) |
| POST | `/api/students/bulk-delete` | ADMIN | `{ "ids": [1,2,3] }` — từng bản ghi áp điều kiện FR-02.06 |

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
| PATCH | `/api/teachers/bulk-status` | ADMIN — `{ "ids": [...], "trang_thai": false }`, thu hồi token (BR-30) |
| POST | `/api/teachers/bulk-delete` | ADMIN — `{ "ids": [...] }`, từng bản ghi áp điều kiện FR-04.05 |

Trường hồ sơ giảng viên: `ma_gv`, `ho_ten`, `email`, `so_dien_thoai`, **`nganh_id`**
(FK `nganh.id`, nullable), `trang_thai`. **ADR-020: cột `chuyen_mon` đã bị xóa**, thay bằng
`nganh_id`; resource trả thêm khối lồng `nganh: { id, ma_nganh, ten_nganh, khoa_id }`.
`GET /api/teachers` lọc được theo `nganh_id` và theo `khoa_id` (lọc khoa đi qua quan hệ ngành).

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

`GET /api/admin-classes` lọc được theo `q`, `khoa_hoc`, **`nganh_id`**, **`khoa_id`** và
`trang_thai`. ADR-020: trường `nganh` (chuỗi) đổi thành **`nganh_id`**; khoa **không** lưu
trên lớp mà suy ra qua ngành nên resource trả thêm khối lồng `khoa`.
| POST | `/api/admin-classes/{id}/students` | ADMIN — body `{ "sinh_vien_ids": [1,2] }` |
| DELETE | `/api/admin-classes/{id}/students/{studentId}` | ADMIN — gỡ khỏi lớp |

Response mẫu:
```json
{
  "id": 1,
  "ma_lop": "CNTT-K65-01",
  "ten_lop": "Công nghệ thông tin K65 - Lớp 01",
  "khoa_hoc": "K65",
  "nganh_id": 1,
  "nganh": { "id": 1, "ma_nganh": "KTPM", "ten_nganh": "Công nghệ phần mềm", "khoa_id": 1 },
  "khoa": { "id": 1, "ma_khoa": "CNTT", "ten_khoa": "Công nghệ thông tin" },
  "nam_nhap_hoc": 2023,
  "si_so": 42,
  "trang_thai": true,
  "da_xoa": false
}
```

> `khoa_hoc` là **khóa** (cohort, năm nhập học), không phải khoa/faculty. `nganh` chỉ để lọc — xem ADR-016.
> Bộ lọc: `q`, `khoa_hoc`, `nganh`, `trang_thai`.

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
| PATCH | `/api/subjects/bulk-status` | ADMIN — `{ "ids": [...], "trang_thai": false }` |
| POST | `/api/subjects/bulk-delete` | ADMIN — `{ "ids": [...] }`, từng bản ghi áp điều kiện FR-05.03 |

`GET /api/subjects` hỗ trợ tìm theo `q`, lọc `trang_thai`, `so_tin_chi` (số nguyên từ 1 đến 10) và **`khoa_id`**, sắp xếp bằng `sort_by` (`id`, `ma_mon`, `ten_mon`, `so_tin_chi`, `trang_thai`) và `sort_dir` (`asc`, `desc`), cùng phân trang. Môn học có **`khoa_id`** (FK `khoa.id`, nullable, ADR-020) và resource trả khối lồng `khoa: { id, ma_khoa, ten_khoa }`; **không gắn ngành** vì môn thường phục vụ nhiều ngành. Mã môn phải duy nhất; `so_tin_chi` nằm trong khoảng 1–10. Xóa bị từ chối với `409 DELETE_BLOCKED` khi còn lớp học phần chưa xóa thuộc học kỳ chưa `CLOSED`.

---

## 8. Học kỳ

Tạo mới luôn ở `UPCOMING`. Body tạo/sửa không nhận `trang_thai`; dùng endpoint
`/status` để chuyển trạng thái. Ngày nhận `YYYY-MM-DD`, thời điểm đăng ký nhận
`YYYY-MM-DD HH:mm:ss` (giờ Việt Nam). Năm học có dạng hai năm liên tiếp, ví dụ
`2026-2027`. Đợt đăng ký phải nằm trong khoảng ngày của kỳ (BR-25).
Kỳ `CLOSED` chỉ đọc. Khi sửa khoảng ngày, mọi buổi học hiện có phải còn nằm
trong kỳ; vi phạm trả 409 `SESSION_OUTSIDE_SEMESTER`.

| Method | Endpoint | Quyền |
|---|---|---|
| GET | `/api/semesters` | mọi vai trò — lọc `nam_hoc`, `ky_thu`, `trang_thai` |
| POST | `/api/semesters` | ADMIN |
| GET | `/api/semesters/{id}` | mọi vai trò |
| PUT | `/api/semesters/{id}` | ADMIN |
| DELETE | `/api/semesters/{id}` | ADMIN — 409 nếu không phải `UPCOMING` hoặc còn lớp |
| PATCH | `/api/semesters/{id}/status` | ADMIN — chỉ chấp nhận `UPCOMING→ONGOING`, `ONGOING→CLOSED` |

Response mẫu:
```json
{
  "id": 2,
  "ma_hoc_ky": "2026-1",
  "ten_hoc_ky": "Học kỳ 1 năm học 2026-2027",
  "nam_hoc": "2026-2027",
  "ky_thu": 1,
  "ngay_bat_dau": "2026-09-07",
  "ngay_ket_thuc": "2027-01-15",
  "mo_dang_ky_luc": "2026-09-07 08:00:00",
  "dong_dang_ky_luc": "2026-09-20 17:00:00",
  "trang_thai": "ONGOING",
  "dang_mo_dang_ky": false
}
```

`PATCH /api/semesters/{id}/status` — body `{ "trang_thai": "CLOSED" }`. Trả 409 `SEMESTER_TRANSITION_INVALID` khi chuyển lùi, bỏ qua `ONGOING`, hoặc khi đã có kỳ khác `ONGOING`. Khi bắt đầu kỳ, API yêu cầu cấu hình điểm đã lưu (`SEMESTER_CONFIG_REQUIRED`).

Khi tạo/cập nhật học kỳ, hệ thống chỉ so khoảng ngày học (`ngay_bat_dau..ngay_ket_thuc`), không so thời gian mở/đóng đăng ký. Nếu khoảng ngày giao nhau, API trả 409 `SEMESTER_OVERLAP`; `message` nêu khoảng ngày gửi lên và học kỳ bị trùng, còn `errors.hoc_ky_trung` chứa mã, tên và khoảng ngày của học kỳ đó.

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
| PATCH | `/api/rooms/bulk-status` | ADMIN — `{ "ids": [...], "trang_thai": false }` |
| POST | `/api/rooms/bulk-delete` | ADMIN — `{ "ids": [...] }`, từng bản ghi áp điều kiện FR-07.03 |

`GET /api/rooms` hỗ trợ tìm theo `q`, lọc `trang_thai`, sắp xếp bằng `sort_by` (`id`, `ma_phong`, `ten_phong`, `suc_chua`, `trang_thai`) và `sort_dir` (`asc`, `desc`), cùng phân trang. Mã phòng phải duy nhất; `suc_chua` phải lớn hơn 0. Xóa bị từ chối với `409 DELETE_BLOCKED` khi còn buổi học `SCHEDULED` chưa kết thúc.

---

## 10. Lớp học phần

| Method | Endpoint | Quyền | Ghi chú |
|---|---|---|---|
| GET | `/api/sections` | theo vai trò | Lọc `q`, `hoc_ky_id`, `mon_hoc_id`, `giang_vien_id`, `nam_thu`, `trang_thai`, `con_cho` |
| POST | `/api/sections` | ADMIN | |
| GET | `/api/sections/{id}` | theo vai trò | Kèm `si_so_hien_tai`, `si_so_toi_da`, `da_chot_diem` |
| PUT | `/api/sections/{id}` | ADMIN | Kiểm tra FR-08.03 |
| DELETE | `/api/sections/{id}` | ADMIN | 409 nếu còn đăng ký ACTIVE |
| PATCH | `/api/sections/{id}/status` | ADMIN | Chuyển OPEN/CLOSED/CANCELLED |
| GET | `/api/sections/{id}/students` | ADMIN, TEACHER (lớp mình) | Danh sách sinh viên đang ACTIVE |
| GET | `/api/sections/{id}/grades` | ADMIN, TEACHER (lớp mình) | Bảng điểm cả lớp |
| PUT | `/api/sections/{id}/grades` | TEACHER (lớp mình) | Nhập/sửa điểm hàng loạt; không ghi nếu học kỳ đóng hoặc lớp đã chốt |
| GET | `/api/sections/{id}/attendance-summary` | ADMIN, TEACHER (lớp mình) | Thống kê chuyên cần |
| POST | `/api/sections/{id}/finalize` | TEACHER (lớp mình) | Chặn 409 `NO_ACTIVE_ENROLLMENTS` nếu lớp không có SV ACTIVE; 409 `GRADE_INCOMPLETE` nếu còn thiếu điểm |
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
  "nam_thu": 4,
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
| POST | `/api/enrollments/bulk` | ADMIN | Body `{ "lop_hoc_phan_id": 10, "sinh_vien_ids": [1,2,3] }` hoặc `{ "lop_hoc_phan_id": 10, "lop_hanh_chinh_id": 3 }`. Trả mảng kết quả từng sinh viên |
| DELETE | `/api/enrollments/{id}` | ADMIN | Hủy, body `{ "ly_do": "..." }` |
| GET | `/api/me/enrollments` | STUDENT | Lọc `hoc_ky_id`, `trang_thai` |
| POST | `/api/me/enrollments` | STUDENT | Body `{ "lop_hoc_phan_id": 10 }` |
| DELETE | `/api/me/enrollments/{id}` | STUDENT | Hủy trong đợt, khi chưa có điểm/điểm danh |

Quy tắc thực thi: STUDENT chỉ đăng ký/hủy trong khoảng `mo_dang_ky_luc..dong_dang_ky_luc` của học kỳ gắn với lớp; ADMIN đăng ký hộ và hủy ngoài đợt được, mọi thao tác ghi do ADMIN thực hiện đều ghi `nhat_ky`. Cả hai luồng vẫn bị chặn nếu lớp không OPEN, học kỳ đã CLOSED, hết sĩ số, trùng lớp/môn/lịch hoặc sinh viên không hoạt động. ADMIN có thể bỏ qua điều kiện `nam_thu`; sinh viên tự đăng ký thì nhận `WRONG_STUDY_YEAR` khi xác định được năm thứ và không khớp.

`SCHEDULE_CONFLICT` áp dụng khi buổi học của lớp đang đăng ký và buổi `SCHEDULED` thuộc một lớp sinh viên đã đăng ký `ACTIVE` có cùng `ngay_hoc` và khoảng giờ giao nhau (`giờ bắt đầu mới < giờ kết thúc cũ` và `giờ kết thúc mới > giờ bắt đầu cũ`). Ví dụ 09:00–10:00 chồng với 09:30–10:30; 09:00–10:00 không chồng với 10:00–11:00. Không xét phòng học. Response 409 trả `errors.trung_lich` với mã lớp và ngày/giờ của cả hai buổi gây trùng.

Danh sách trả phân trang Laravel với các bộ lọc trong bảng. `GET /api/enrollments` của GIANG_VIEN chỉ trả lớp do giảng viên đó phụ trách; `/api/me/enrollments` chỉ trả hồ sơ sinh viên đang đăng nhập. Hủy và đăng ký lại dùng lại cùng bản ghi `dang_ky_hoc_phan`; đăng ký lại bị chặn nếu bản ghi cũ đã có điểm.

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

Response đăng ký hàng loạt (`POST /api/enrollments/bulk`) — luôn 200, kết quả từng sinh viên:
```json
{
  "success": true,
  "message": "Đã xử lý 50 sinh viên.",
  "data": {
    "thanh_cong": 47,
    "that_bai": 3,
    "chi_tiet": [
      { "sinh_vien_id": 1, "ma_sv": "SV001", "ket_qua": "THANH_CONG" },
      { "sinh_vien_id": 2, "ma_sv": "SV002", "ket_qua": "THAT_BAI", "ma_loi": "SCHEDULE_CONFLICT", "message": "Trùng lịch với lớp INT3306-02" }
    ]
  }
}
```

---

## 13. Điểm

| Method | Endpoint | Quyền | Ghi chú |
|---|---|---|---|
| PUT | `/api/enrollments/{id}/grade` | TEACHER (lớp mình) | Chưa triển khai |
| PUT | `/api/sections/{id}/grades` | TEACHER (lớp mình) | Nhập hàng loạt |
| GET | `/api/enrollments/{id}/grade-history` | ADMIN, TEACHER (lớp mình) | Chưa triển khai |
| GET | `/api/sections/{id}/grades` | ADMIN, TEACHER (lớp mình) | Bảng điểm |
| GET | `/api/me/grades` | STUDENT | Điểm + GPA theo học kỳ |
| GET | `/api/me/gpa` | STUDENT | GPA học kỳ + GPA tích lũy (CPA), tín chỉ tích lũy (FR-12.08) |

`PUT /api/sections/{id}/grades` nhận danh sách đăng ký ACTIVE thuộc chính lớp đó. Mỗi điểm thành phần có thể là `null` khi chưa chấm; điểm số từ 0–10, tối đa hai chữ số thập phân. `ly_do` không bắt buộc, tối đa 500 ký tự, dùng cho lịch sử sửa điểm.

Request nhập điểm hàng loạt:
```json
{
  "ly_do": "Điều chỉnh sau phúc khảo",
  "diem": [
    {
      "dang_ky_hoc_phan_id": 500,
      "diem_chuyen_can": 8.5,
      "diem_giua_ky": 7.0,
      "diem_cuoi_ky": 8.0
    }
  ]
}
```

Response là mảng các dòng điểm của lớp, cùng cấu trúc với `GET /api/sections/{id}/grades`:
```json
{
  "success": true,
  "data": [
    {
      "id": 77,
      "dang_ky_hoc_phan_id": 500,
      "sinh_vien": {
        "id": 12,
        "ma_sv": "SV0012",
        "ho_ten": "Nguyễn Văn A",
        "email": "sv0012@example.edu.vn",
        "lop": "CNTT K20",
        "dang_ky_hoc_phan_id": 500
      },
      "diem_chuyen_can": 8.5,
      "diem_giua_ky": 7.0,
      "diem_cuoi_ky": 8.0,
      "diem_tong_ket": 7.88,
      "diem_chu": "B",
      "diem_he_4": 3.0,
      "ket_qua": "DAT",
      "da_chot_diem": false
    }
  ]
}
```

Trả `403` nếu không phải giảng viên phụ trách lớp, `409 GRADE_LOCKED` nếu điểm đã chốt,
`409 SEMESTER_CLOSED` nếu học kỳ đã đóng, và `422 VALIDATION_ERROR` nếu payload sai
hoặc đăng ký không ACTIVE/không thuộc lớp. Các endpoint nhập điểm đơn
`PUT /api/enrollments/{id}/grade` và xem lịch sử
`GET /api/enrollments/{id}/grade-history` vẫn chưa được triển khai.

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

> Học lại một môn: chỉ tính lần có `diem_tong_ket` cao nhất (BR-28, ADR-018).

### `GET /api/me/gpa` — response

```json
{
  "hoc_ky_hien_tai": {
    "id": 2,
    "ma_hoc_ky": "2026-1",
    "ten_hoc_ky": "Học kỳ 1 năm học 2026-2027",
    "gpa_he_10": 7.88,
    "gpa_he_4": 3.00,
    "tong_tin_chi": 18
  },
  "tich_luy": {
    "gpa_he_10": 7.42,
    "gpa_he_4": 2.87,
    "tong_tin_chi": 96,
    "tin_chi_dat": 88,
    "so_hoc_ky_da_tinh": 5
  }
}
```

`tich_luy` chỉ tính các học kỳ `CLOSED`; mỗi môn tính một lần với điểm cao nhất. `tin_chi_dat` là tổng tín chỉ của các môn có `ket_qua = DAT`.

### Cấu hình điểm theo học kỳ

`GET /api/settings/semesters` trả danh sách học kỳ gồm mã, năm học, thời gian,
trạng thái và `cau_hinh_da_luu` để dựng bảng tra cứu/lọc.
`GET /api/settings?hoc_ky_id={id}` trả cấu hình riêng của học kỳ; nếu chưa lưu,
các giá trị trọng số, bảng quy đổi và số ngày sửa điểm danh lấy từ cấu hình mặc định.
`diem.cau_hinh_hoc_ky` là `null` khi chưa lưu, hoặc:

```json
{
  "diem.cau_hinh_hoc_ky": {
    "id": 12,
    "hoc_ky_id": 45,
    "quy_tac_lam_tron": "HALF_UP_2"
  }
}
```

`HALF_UP_2` làm tròn điểm tổng kết đến hai chữ số thập phân theo half-up trước
khi tra khoảng quy đổi. Mỗi học kỳ có tối đa một cấu hình. Khi kỳ chuyển sang
`ONGOING`, cấu hình bị khóa; các học kỳ khác có thể dùng quy tắc riêng. Điểm đã
lưu giữ nguyên kết quả và `quy_doi_diem_id`; cập nhật cấu hình của kỳ tương lai
không hồi tố điểm lịch sử.

```json
{
  "diem.trong_so": { "chuyen_can": 0.25, "giua_ky": 0.25, "cuoi_ky": 0.50 },
  "diem.bang_quy_doi": [
    { "tu": 8.5, "den": 10.0, "chu": "A", "he_4": 4.0, "xep_loai": "Giỏi", "dat": true },
    { "tu": 8.0, "den": 8.49, "chu": "B+", "he_4": 3.5, "xep_loai": "Khá giỏi", "dat": true },
    { "tu": 7.0, "den": 7.99, "chu": "B", "he_4": 3.0, "xep_loai": "Khá", "dat": true },
    { "tu": 6.5, "den": 6.99, "chu": "C+", "he_4": 2.5, "xep_loai": "Trung bình khá", "dat": true },
    { "tu": 5.5, "den": 6.49, "chu": "C", "he_4": 2.0, "xep_loai": "Trung bình", "dat": true },
    { "tu": 5.0, "den": 5.49, "chu": "D+", "he_4": 1.5, "xep_loai": "Trung bình yếu", "dat": true },
    { "tu": 4.0, "den": 4.99, "chu": "D", "he_4": 1.0, "xep_loai": "Yếu", "dat": true },
    { "tu": 0.0, "den": 3.99, "chu": "F", "he_4": 0.0, "xep_loai": "Kém (không đạt)", "dat": false }
  ]
}
```

`PUT /api/settings` phải có `hoc_ky_id`. Lưu lần đầu tạo cấu hình cho kỳ; lưu lại
khi kỳ vẫn `UPCOMING` sẽ cập nhật chính cấu hình đó. API từ chối cập nhật kỳ đang
diễn ra/đã đóng bằng `409 SEMESTER_CONFIG_LOCKED`. Chuyển học kỳ sang `ONGOING`
cần có cấu hình điểm đã lưu; nếu chưa có, API trả `409 SEMESTER_CONFIG_REQUIRED`.

Với `diem.bang_quy_doi`, API trả 422 nếu khoảng chồng lấn, có khoảng trống,
không phủ kín 0–10, hoặc `chu` không thuộc `A/B+/B/C+/C/D+/D/F`. Mỗi khoảng
gồm `tu`, `den`, `chu`, `he_4`, `xep_loai` và `dat`.
Với `diem.trong_so`, ba trường `chuyen_can`, `giua_ky`, `cuoi_ky` phải nằm trong
khoảng 0–1 và có tổng bằng 1. Bảng quy đổi phải phủ kín 0–10, không chồng lấn
hoặc có khoảng trống; các mốc dùng tối đa hai chữ số thập phân. `PUT` chỉ ghi
các khóa được gửi lên và trả lại toàn bộ cấu hình.

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

Dashboard ADMIN (`GET /api/dashboard/admin`) — đủ dữ liệu cho SCR-03:

```json
{
  "the_so_lieu": [
    { "khoa": "sinh_vien", "label": "Tổng sinh viên", "gia_tri": 501, "don_vi": null,
      "phu_chu": "12 sinh viên mới trong học kỳ này", "xu_huong": "len" },
    { "khoa": "lop_hoc_phan", "label": "Lớp học phần đang mở", "gia_tri": 34, "don_vi": null,
      "phu_chu": "6 lớp đã đầy sĩ số", "xu_huong": "len" },
    { "khoa": "dang_ky", "label": "Lượt đăng ký học phần", "gia_tri": 7028, "don_vi": null,
      "phu_chu": "Trung bình 14.0 lớp mỗi sinh viên", "xu_huong": "len" },
    { "khoa": "cho_dang_ky", "label": "Chỗ còn trống", "gia_tri": 214, "don_vi": "chỗ",
      "phu_chu": "Chiếm 14.2% tổng sức chứa", "xu_huong": "xuong" }
  ],
  "ty_le_lap_day": [
    { "hoc_ky": "HK1 2025-2026", "tong_cho": 1310, "da_dang_ky": 1124 }
  ],
  "lop_sap_mo": [
    { "id": 31, "ma_lop_hp": "INT2215-2026-1-31", "ten_mon_hoc": "Lập trình web",
      "ten_giang_vien": "Nguyễn Văn An", "si_so": "38/45", "ty_le": 84,
      "trang_thai": "OPEN", "nam_thu": 4 }
  ],
  "dang_ky_gan_day": [
    { "id": 1, "ma_sv": "2100001", "ho_ten": "Nguyễn Văn An",
      "ma_lop_hp": "INT2215-2026-1-31", "ten_mon_hoc": "Lập trình web",
      "thoi_gian": "2026-10-24 09:15:00", "trang_thai": "THANH_CONG" }
  ]
}
```

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `the_so_lieu[].khoa` | string | `sinh_vien`, `lop_hoc_phan`, `dang_ky`, `cho_dang_ky` — FE dùng để gắn icon |
| `the_so_lieu[].label` | string | Nhãn hiển thị. Dùng `label` chứ **không** phải `nhan` — cùng tên trường với `/api/options/*` |
| `the_so_lieu[].xu_huong` | `len`/`xuong`/`bang` | So với học kỳ trước |
| `ty_le_lap_day` | array | 4 học kỳ gần nhất, dùng vẽ biểu đồ cột |
| `lop_sap_mo[].si_so` | string | Dạng `"38/45"` để hiển thị trực tiếp |
| `lop_sap_mo[].ty_le` | int 0–100 | Độ dài thanh tiến trình |
| `dang_ky_gan_day[].thoi_gian` | datetime | `YYYY-MM-DD HH:mm:ss`, không phải chuỗi tương đối |

Dashboard TEACHER và STUDENT: bổ sung khi làm SCR-04/05 (Tuần 7).

---

## 15. Xóa mềm & khôi phục

| Method | Endpoint | Quyền | Ghi chú |
|---|---|---|---|
| GET | `/api/trash/{type}` | ADMIN | `type`: `users`, `students`, `teachers`, `admin-classes`, `subjects`, `semesters`, `rooms`, `sections`, `sessions`, `menus`, `khoa`, `nganh` |
| POST | `/api/trash/{type}/{id}/restore` | ADMIN | 409 `RESTORE_PARENT_DELETED` nếu cha đã xóa |

Bộ lọc: `q`, `deleted_by`, `deleted_tu`, `deleted_den`, `page`, `per_page`.

---

## 16. Menu động & cấu hình

| Method | Endpoint | Quyền |
|---|---|---|
| GET | `/api/menus` | mọi vai trò — tự lọc theo `vai_tro` và `trang_thai`; ADMIN có thể gửi `quan_ly=1` để lấy mọi menu chưa xóa, gồm menu đang ẩn và menu của vai trò khác. Không gửi `quan_ly`, mỗi vai trò chỉ nhận menu có vai trò mình trong `vai_tro` (hoặc `vai_tro = null`); **không có ngoại lệ ADMIN** — xem `docs/05-screens.md` §2 |
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
| GET | `/api/options/semesters` | `[{ id, label, trang_thai, nam_hoc, ngay_bat_dau }]` |
| GET | `/api/options/subjects` | `[{ id, label, so_tin_chi, khoa_id }]` |
| GET | `/api/options/teachers` | `[{ id, label }]` |
| GET | `/api/options/rooms` | `[{ id, label, suc_chua }]` |
| GET | `/api/options/admin-classes` | `[{ id, label, khoa_hoc, nganh_id, nganh }]` (`nganh` là **tên** ngành) |
| GET | `/api/options/sections` | `[{ id, label, con_cho, nam_thu }]` |
| GET | `/api/options/khoa` | `[{ id, label, ma_khoa }]` |
| GET | `/api/options/nganh` | `[{ id, label, khoa_id, ma_nganh }]` — nhận thêm `?khoa_id=` để lọc |

Chỉ trả bản ghi chưa xóa; mặc định `trang_thai = true` trừ khi truyền `tat_ca=1`.

---

## 18. Bảng tóm tắt số lượng endpoint

| Nhóm | Số endpoint |
|---|---|
| Xác thực & hồ sơ | 7 |
| Người dùng | 8 |
| Khoa | 5 |
| Ngành | 5 |
| Sinh viên | 8 |
| Giảng viên | 8 |
| Lớp hành chính | 8 |
| Môn học | 8 |
| Học kỳ | 6 |
| Phòng học | 8 |
| Lớp học phần | 11 |
| Buổi học & lịch | 8 |
| Đăng ký | 7 |
| Điểm | 6 |
| Điểm danh cá nhân & dashboard | 6 |
| Thùng rác | 2 |
| Menu & cấu hình | 6 |
| Options | 8 |
| **Tổng** | **125** |

---

## 19. Sinh `openapi.yaml`

- Viết tay `docs/openapi.yaml` từ tài liệu này, hoặc dùng `scribe`/`l5-swagger` để sinh.
- Quy ước: mỗi endpoint có `summary`, `security`, `parameters`, `requestBody`, `responses` cho 200/201/401/403/404/409/422.
- Khi thêm endpoint mới, cập nhật file này **trước**, rồi mới code.
- FE sinh model TypeScript từ `openapi.yaml` để tránh lệch kiểu.
