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
| `PAST_DATE` | 409 | Ngày xếp lịch đã trôi qua; `errors` nêu trường vi phạm |
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

**STUDENT chỉ đọc.** Yêu cầu từ STUDENT ở cả `GET /api/teachers` và `GET /api/teachers/{id}`
nhận **`GiangVienLienHeResource`** — chỉ `id`, `ma_gv`, `ho_ten`, `email`, `so_dien_thoai`,
`avatar_url`. Không có `nganh_id` / `nganh` / `trang_thai` / `da_xoa` (dữ liệu công tác nội bộ).
ADMIN và TEACHER nhận `GiangVienResource` đầy đủ. FE phải khai kiểu rộng cho cả hai
(`GiangVienHoSo` trong `core/models/dao-tao.model.ts`) và chịu được trường vắng mặt.

---

## 6. Lớp hành chính

| Method | Endpoint | Quyền |
|---|---|---|
| GET | `/api/admin-classes` | ADMIN, TEACHER (lớp có SV mình dạy), STUDENT (lớp của mình) |
| POST | `/api/admin-classes` | ADMIN |
| GET | `/api/admin-classes/{id}` | ADMIN, TEACHER (lớp có SV mình dạy) |
| PUT | `/api/admin-classes/{id}` | ADMIN |
| DELETE | `/api/admin-classes/{id}` | ADMIN |
| GET | `/api/admin-classes/{id}/students` | ADMIN, TEACHER (lớp có SV mình dạy) |

`GET /api/admin-classes` lọc được theo `q`, `khoa_hoc`, **`nganh_id`**, **`khoa_id`** và
`trang_thai`. ADR-020: trường `nganh` (chuỗi) đổi thành **`nganh_id`**; khoa **không** lưu
trên lớp mà suy ra qua ngành nên resource trả thêm khối lồng `khoa`.

**Phạm vi theo vai trò** (`LopHanhChinhPolicy`): TEACHER chỉ thấy lớp hành chính có ít nhất
một sinh viên đang đăng ký lớp học phần mình phụ trách — một truy vấn `exists()`, không nạp
cả bảng. Lớp ngoài phạm vi trả **403** (`ma_loi: FORBIDDEN`), không phải 404 — lớp có tồn tại,
chỉ không có quyền. STUDENT chỉ vào được `GET /api/admin-classes` (đã lọc sẵn còn lớp của
mình); `show` và `students` chặn ở middleware `vai.tro`.
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
| GET | `/api/sections/{id}/students` | ADMIN, TEACHER (lớp mình), STUDENT (lớp đã đăng ký ACTIVE) | Danh sách sinh viên đang ACTIVE. STUDENT chỉ nhận `ma_sv` + `ho_ten` của bạn cùng lớp — không `email`, `lop`, `dang_ky_hoc_phan_id` |
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
| GET | `/api/sections/{id}/sessions` | theo vai trò | ADMIN, giảng viên phụ trách, sinh viên đã đăng ký ACTIVE |
| POST | `/api/sections/{id}/sessions` | ADMIN, TEACHER (lớp mình) | Buổi lẻ. Gửi `tiet_bat_dau`/`tiet_ket_thuc` thì backend tự tính giờ; hoặc gửi thẳng `gio_bat_dau`/`gio_ket_thuc`. `buoi_goc_id` để đánh dấu buổi bù. `hinh_thuc` (`LY_THUYET` mặc định, `THUC_HANH`, `TRUC_TUYEN`) |
| POST | `/api/sections/{id}/sessions/generate` | ADMIN, TEACHER (lớp mình) | Sinh lịch hàng tuần; `hinh_thuc` áp cho cả lô |
| PUT | `/api/sessions/{id}` | ADMIN, TEACHER (lớp mình) | Sửa; nếu đã có điểm danh cần `xac_nhan: true` |
| PATCH | `/api/sessions/{id}/status` | ADMIN, TEACHER (lớp mình) | Body `{ "trang_thai": "CANCELLED", "ly_do_huy": "..." }`. Hủy giữ bản ghi trên lịch; `SCHEDULED` để mở lại. Buổi `DONE` chỉ ADMIN hủy được, và **toàn bộ điểm danh của buổi bị xóa** trong cùng transaction |
| DELETE | `/api/sessions/{id}` | ADMIN, TEACHER (lớp mình) | Xóa mềm; nếu đã có điểm danh cần `xac_nhan: true` |
| GET | `/api/sessions/{id}/attendance` | ADMIN, TEACHER (lớp mình) | Danh sách + trạng thái |
| PUT | `/api/sessions/{id}/attendance` | TEACHER (lớp mình), ADMIN | Điểm danh hàng loạt |
| GET | `/api/schedules` | theo vai trò | Lịch tổng hợp, lọc `hoc_ky_id`, `giang_vien_id`, `phong_hoc_id`, `tu_ngay`, `den_ngay` |
| GET | `/api/options/periods` | mọi vai trò | 15 tiết + ca + giờ, dùng cho ô chọn tiết |
| GET | `/api/exams` | theo vai trò | Ca thi theo kỳ; sinh viên chỉ thấy môn đã đăng ký ACTIVE. Lọc `hoc_ky_id`, `mon_hoc_id`, `tu_ngay`, `den_ngay` |
| POST | `/api/exams` | ADMIN | `{ hoc_ky_id, mon_hoc_id, ngay_thi, tiet_bat_dau, tiet_ket_thuc, phong_hoc_id, dot_thi? }`; 409 `SCHEDULE_CONFLICT` — xem mục "Xung đột lịch" |
| PUT | `/api/exams/{id}` | ADMIN | Cùng kiểm tra xung đột như POST |
| DELETE | `/api/exams/{id}` | ADMIN | Xóa mềm |

### Hình thức học

`buoi_hoc.hinh_thuc` là thuộc tính của **từng buổi**, không phải của lớp: một lớp
có thể học lý thuyết buổi này, thực hành buổi khác. Ba giá trị cố định
`LY_THUYET` / `THUC_HANH` / `TRUC_TUYEN`; mặc định `LY_THUYET`. Response buổi học
trả `hinh_thuc` để giao diện tô màu khối lịch.

### Ngày đã trôi qua

Không xếp lịch cho ngày đã qua — buổi đó không còn dạy được. Áp cho tạo buổi lẻ,
tạo ca thi, và dời buổi/ca thi sang ngày khác đã qua. Trả 409 `PAST_DATE`.

- `generate` không báo lỗi khi khoảng ngày bắt đầu ở quá khứ: `tu_ngay` được kẹp
  lên hôm nay, giống cách FR-10.02 kẹp `den_ngay` vào ngày kết thúc kỳ. Chỉ báo
  `PAST_DATE` khi **toàn bộ** khoảng nằm trong quá khứ.
- Sửa một buổi/ca thi đã có mà **giữ nguyên ngày** vẫn hợp lệ (điểm danh bù sau
  buổi học), kể cả khi ngày đó đã qua.

### Xung đột lịch (`SCHEDULE_CONFLICT`)

Ba loại xung đột, phân biệt bằng `errors.trung_lich[*].loai`:

| `loai` | Khi nào | Trường chi tiết |
|---|---|---|
| `phong_hoc` | Phòng đã có ca thi khác cùng ngày, giờ giao nhau | `lich_thi_id`, `mon_hoc`, `ngay_thi`, `gio_bat_dau`, `gio_ket_thuc`, `doi_tuong` (mã phòng) |
| `buoi_hoc` | Phòng đã có buổi học `SCHEDULED` cùng ngày, giờ giao nhau | `buoi_hoc_id`, `ma_lop_hp`, `ngay_hoc`, `gio_bat_dau`, `gio_ket_thuc` |
| `lich_thi` | Khung giờ đã có ca thi khác (kiểm từ phía buổi học) | `lich_thi_id`, `ngay_hoc`, `gio_bat_dau`, `gio_ket_thuc`, `doi_tuong` (mã môn) |

Lịch thi và lịch học **nhìn thấy nhau**: xếp ca thi vào phòng đang có lớp học bị
chặn, và ngược lại. Kiểm tra chạy cả hai chiều trong transaction có khóa phòng.

Ngoài ra, khi xếp ca thi còn phải bảo đảm **mọi sinh viên của môn đều rảnh**: ca
thi phục vụ tất cả lớp của môn trong kỳ, nên nếu bất kỳ sinh viên nào trong số đó
đang có buổi học hoặc ca thi khác trùng giờ, ca thi bị chặn. Response liệt kê tối
đa 20 dòng vi phạm và tổng số:

```json
{
  "success": false,
  "message": "Ca thi trùng lịch của 12 sinh viên. Chọn ngày hoặc khung tiết khác.",
  "ma_loi": "SCHEDULE_CONFLICT",
  "errors": {
    "trung_lich": [
      { "sinh_vien_id": 2, "ma_sv": "SV000002", "ho_ten": "Nguyễn Văn A",
        "ma_lop_hp": "INT3306-01", "ngay": "2026-11-20",
        "gio_bat_dau": "07:30", "gio_ket_thuc": "09:10", "loai": "buoi_hoc" }
    ],
    "tong_so_vi_pham": 12
  }
}
```

Vì một môn có thể có trên 160 sinh viên, ràng buộc này khiến ca thi gần như chỉ
xếp được **sau khi hết lịch dạy** — giống quy trình thi thật.

### Khung tiết

`tiet_hoc` giữ 15 tiết/ngày chia Sáng (1–6), Chiều (7–12), Tối (13–15). Buổi học
và ca thi lưu `tiet_bat_dau`/`tiet_ket_thuc` (nullable với dữ liệu cũ) và giờ được
suy ra từ bảng này. Ca là thuộc tính của tiết, không phải của buổi: một buổi tiết
5–7 vắt qua sáng và chiều vẫn hợp lệ.

`generate` nhận `{ thu: [2,4], tiet_bat_dau, tiet_ket_thuc, phong_hoc_id, tu_ngay, den_ngay }`.
`thu` theo quy ước Việt Nam: 2–7 là Thứ 2–Thứ 7, 8 là Chủ nhật. Khoảng ngày vượt quá
`ngay_ket_thuc` của học kỳ thì dừng ở ngày cuối kỳ, không báo lỗi (FR-10.02). Tối đa
500 buổi mỗi lô; có bất kỳ buổi trùng thì không tạo buổi nào và trả 409 `SCHEDULE_CONFLICT`.


### Lịch tổng hợp (`GET /api/schedules`)

- Danh sách có `meta`, `links`, nhận `page`, `per_page` (10/25/50/100).
- ADMIN xem toàn bộ; GIANG_VIEN chỉ xem lớp mình phụ trách; SINH_VIEN chỉ xem
  các lớp đang đăng ký ACTIVE. Bộ lọc không mở rộng quyền xem. Chưa có hồ sơ
  hoặc không có lịch phù hợp trả 200 với `data: []`.
- `tu_ngay`, `den_ngay` nhận `YYYY-MM-DD`, bao gồm cả hai ngày biên; có thể
  truyền riêng một mốc. Thêm lọc `trang_thai`: SCHEDULED, DONE, CANCELLED.
- `sort_by`: `id` (mặc định), `ngay_hoc`, `gio_bat_dau`, `gio_ket_thuc`,
  `trang_thai`; `sort_dir`: `asc` (mặc định) hoặc `desc`.
- Buổi/lớp đã xóa mềm không xuất hiện. Vẫn hiển thị lịch sử DONE/CANCELLED
  và thông tin giảng viên/phòng đã xóa, kèm `da_xoa` trên hai object đó.

Mỗi phần tử `data` có dạng:

```json
{
  "id": 12,
  "ngay_hoc": "2026-11-10",
  "gio_bat_dau": "07:00",
  "gio_ket_thuc": "09:00",
  "trang_thai": "SCHEDULED",
  "ly_do_huy": null,
  "lop_hoc_phan": { "id": 3, "ma_lop_hp": "INT3306-01" },
  "mon_hoc": { "id": 4, "ma_mon": "INT3306", "ten_mon": "Lập trình web" },
  "hoc_ky": { "id": 2, "ma_hoc_ky": "2026-1", "ten_hoc_ky": "Học kỳ 1" },
  "giang_vien": { "id": 5, "ma_gv": "GV005", "ho_ten": "Nguyễn Văn A", "da_xoa": false },
  "phong_hoc": { "id": 6, "ma_phong": "A101", "ten_phong": "Phòng A101", "da_xoa": false }
}
```

`ScheduleService` là phần kiểm tra trùng dùng chung, không có endpoint kiểm tra
trùng riêng. PM gọi service khi triển khai CRUD/sinh buổi. Cách tích hợp:
[lich-hoc-backend.md](lich-hoc-backend.md).

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

`GET /api/sessions/{id}/attendance` — response. `data` là **object** gồm thông tin
buổi học và mảng sinh viên, không phải mảng trần:

```json
{
  "success": true,
  "message": "Thành công",
  "data": {
    "buoi_hoc": {
      "id": 1021,
      "ngay_hoc": "2026-09-08",
      "gio_bat_dau": "07:00",
      "gio_ket_thuc": "08:30",
      "trang_thai": "DONE",
      "ly_do_huy": null,
      "phong_hoc": { "id": 11, "ma_phong": "B201", "ten_phong": "Phòng B201" },
      "lop_hoc_phan": {
        "id": 61,
        "ma_lop_hp": "LHP0061",
        "ten_mon_hoc": "Lập trình cơ bản",
        "hoc_ky": { "id": 2, "ma_hoc_ky": "2026-1", "trang_thai": "ONGOING" }
      },
      "co_the_sua": true
    },
    "danh_sach": [
      {
        "dang_ky_hoc_phan_id": 151,
        "sinh_vien": {
          "id": 19,
          "ma_sv": "SV000019",
          "ho_ten": "Đặng Thị Bảo",
          "email": "sv0019@example.com",
          "lop": "Lớp MTTT-K6619"
        },
        "trang_thai": "PRESENT",
        "ghi_chu": null,
        "diem_danh_luc": "2026-11-08T00:39:09+07:00",
        "diem_danh_boi": "Nguyễn Văn Giảng"
      }
    ]
  }
}
```

`trang_thai` của từng dòng là `null` khi buổi chưa được điểm danh. `danh_sach`
theo BR-21: chỉ gồm đăng ký ACTIVE có `dang_ky_luc` trước thời điểm kết thúc buổi.

`PUT /api/sessions/{id}/attendance` — response **không** trả lại danh sách. Muốn
cập nhật giao diện thì gọi lại `GET`:

```json
{
  "success": true,
  "message": "Lưu điểm danh thành công.",
  "data": { "buoi_hoc_id": 1021, "so_luong": 51, "trang_thai_buoi_hoc": "DONE" }
}
```

`GET /api/sections/{id}/sessions` trả sẵn `da_diem_danh` (bool) và `so_diem_danh`
(số dòng đã ghi) cho từng buổi — dùng hai trường này để biết buổi nào đã điểm danh,
không gọi `GET /sessions/{id}/attendance` cho từng buổi.

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

Endpoint này **mở cho cả ba vai trò** vì màn nhập điểm của GIANG_VIEN và trang
điểm của SINH_VIEN cần trọng số/bảng quy đổi để hiển thị công thức. Với người
gọi không phải ADMIN, `data` chỉ còn các khoá bắt đầu bằng `diem.` — khoá vận
hành khác trong bảng `cau_hinh` không lộ ra. `PUT /api/settings` và
`GET /api/settings/semesters` vẫn chỉ ADMIN.

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

> Nhãn vai trò trong bảng dùng dạng tài liệu (`ADMIN`, `TEACHER`, `STUDENT`); giá trị thật
> trong `users.vai_tro` và middleware `vai.tro` là `ADMIN`, `GIANG_VIEN`, `SINH_VIEN`.
> `TEACHER` ≡ `GIANG_VIEN`, `STUDENT` ≡ `SINH_VIEN`.

| Method | Endpoint | Quyền | Trạng thái code |
|---|---|---|---|
| GET | `/api/me/schedule` | STUDENT | **Không tồn tại** — dùng `GET /api/schedules` (§18 sai lệch #1) |
| GET | `/api/me/attendance` | STUDENT | Đã code |
| GET | `/api/me/attendance-summary` | STUDENT | Đã code |
| GET | `/api/dashboard/admin` | ADMIN | Đã code — đặc tả dưới đây |
| GET | `/api/dashboard/teacher` | TEACHER (`GIANG_VIEN`) | **Đặc tả xong, chưa code** |
| GET | `/api/dashboard/student` | STUDENT (`SINH_VIEN`) | **Đặc tả xong, chưa code** |
| GET | `/api/me/grades` | STUDENT | Đã code — **bổ sung `diem_tb_lop`** (§14c) |

### §14a — Học kỳ là tham số của cả màn hình (chốt 2026-11-09)

Ba dashboard và `GET /api/me/grades` đều xoay quanh **một học kỳ đang chọn**. Mọi con số
(GPA, tín chỉ, chuyên cần, điểm từng môn, thời khoá biểu, lớp phụ trách) đều thuộc học kỳ đó.

**Tham số:** `?hoc_ky_id={id}` — tuỳ chọn trên cả ba endpoint.

| Trường hợp | Hành vi |
|---|---|
| Không truyền `hoc_ky_id` | Chọn học kỳ `ONGOING` mà người dùng có dữ liệu (lớp với giảng viên, đăng ký ACTIVE với sinh viên) |
| Không có kỳ `ONGOING` | Học kỳ có `ngay_bat_dau` lớn nhất mà người dùng có dữ liệu |
| Người dùng chưa có dữ liệu | `hoc_ky = null`, mọi mảng rỗng, thẻ số liệu rỗng. Vẫn `200` |
| `hoc_ky_id` trỏ kỳ không tồn tại | `404` `SEMESTER_NOT_FOUND` |
| `hoc_ky_id` trỏ kỳ người dùng không có dữ liệu | `200` với `hoc_ky` đúng kỳ đó và mọi mảng rỗng — không phải lỗi, người dùng có thể xem kỳ trống |

**`hoc_ky` trong response** luôn phản ánh kỳ ĐÃ CHỌN (không phải kỳ mặc định), để FE biết
mình đang hiển thị kỳ nào kể cả khi request không truyền tham số.

**Danh sách kỳ cho ô chọn:** `GET /api/options/semesters` đã có. FE **không** tự lọc theo
kỳ có dữ liệu; hiện đủ để người dùng chuyển tự do. Ô chọn nằm ở đầu trang, một ô duy nhất
cho cả màn — không đặt ô chọn riêng trong từng khối.

**Vì sao không cho mỗi khối một ô chọn kỳ:** người dùng sẽ so sánh GPA kỳ này với chuyên cần
kỳ khác mà không nhận ra; và mỗi khối thành một request riêng, mất ngân sách < 500 ms của
UC-16 AC-3.

### §14b — `GET /api/me/grades` nhận `hoc_ky_id`

Bảng §13 hiện ghi endpoint này không nhận tham số. Nay nhận `?hoc_ky_id={id}`, hành vi chọn
kỳ giống §14a. Không truyền thì dùng kỳ mặc định như trên.

### §14c — Bổ sung `diem_tb_lop` vào `GET /api/me/grades` (chốt 2026-11-09)

Mỗi phần tử `mon_hoc[]` thêm **một** trường:

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `diem_tb_lop` | number \| null | Trung bình `diem_tong_ket` của **mọi** đăng ký `ACTIVE` trong lớp học phần đó, làm tròn 2 chữ số. `null` khi chưa có ai được chấm điểm. |

**Ranh giới quyền:** chỉ trả **một con số trung bình**, không trả điểm của từng sinh viên
khác, không trả điểm cao nhất/thấp nhất kèm danh tính. Sinh viên không suy ngược được điểm
cá nhân của bạn khác từ giá trị này. Đây là lý do chỉ số này được phép có trong response của
STUDENT dù FR-12 cấm sinh viên xem điểm người khác.

Nếu sau này cần "điểm cao nhất lớp", phải mở một quyết định riêng — trung bình và cao nhất
rò rỉ thông tin khác nhau khi lớp ít sinh viên.

---

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

### Quy ước chung cho cả ba dashboard

Ba endpoint `/api/dashboard/*` dùng **cùng một shape thẻ số liệu** `the_so_lieu[]`
để FE dùng lại một component (`features/dashboard/`):

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `khoa` | string | Khoá định danh để gắn icon + màu. Mỗi vai trò có bộ khoá riêng, liệt kê ở từng mục dưới |
| `label` | string | Nhãn hiển thị |
| `gia_tri` | **number** | Số hiển thị. **Không phải integer**: GPA (`2.74`) và phần trăm (`90.7`) là số thực. `openapi.yaml` đã nới `TheSoLieu.gia_tri` từ `integer` sang `number` (2026-11-08); kiểu TS `TheSoLieu.gia_tri: number` trong `core/mock/data/dashboard.mock.ts` đã đúng sẵn, không phải sửa |
| `don_vi` | string \| null | Đơn vị hiện sau số, ví dụ `"buổi"`, `"%"`, `"tín chỉ"` |
| `phu_chu` | string | Một dòng mô tả phụ, **phải khớp** số liệu trong cùng response (xem quy tắc nhất quán bên dưới) |
| `xu_huong` | `len`/`xuong`/`bang` | Chiều so sánh với học kỳ trước — xem quyết định bên dưới |

**Quy tắc nhất quán** (áp cho cả hai endpoint mới):

- `the_so_lieu[].gia_tri` của một thẻ **luôn bằng** số phần tử hoặc tổng của mảng tương ứng
  trong cùng response (ví dụ `gia_tri` của `buoi_sap_toi` = `count(buoi_sap_toi)`), trừ khi
  ghi rõ công thức khác.
- Mọi mảng có giới hạn (`take`) thì `phu_chu` phải nói rõ cửa sổ thời gian, để người đọc
  không tưởng đó là tổng toàn hệ thống.
- Mọi trường tỉ lệ **phân biệt rõ hai thang**: trường tên `ty_le` là **phân số 0–1, 4 chữ số
  thập phân** (giống `GET /api/me/attendance-summary`); trường nằm trong `the_so_lieu`
  là **phần trăm 0–100** vì có `don_vi: "%"`. Không nhân 100 thêm lần nữa ở FE.
- Ngày `YYYY-MM-DD`, giờ `HH:mm`, datetime `YYYY-MM-DD HH:mm:ss` (§1.7).
- Trường `thu` (thứ trong tuần, quy ước Việt Nam **2–7 là Thứ 2–Thứ 7, 8 là Chủ nhật**,
  khớp `generate` ở §11) chỉ có trong hai response dashboard, không có trong
  `/api/schedules`. Backend tính bằng PHP từ `ngay_hoc`, **không** dùng `DAYOFWEEK()` của
  MySQL — hai quy ước lệch nhau ở Chủ nhật.

**`xu_huong` của dashboard TEACHER/STUDENT luôn `bang`.** Hai dashboard này không so sánh
với học kỳ trước: so sánh đúng sẽ cần thêm 4–6 truy vấn tổng hợp mỗi lần tải trang và dễ
ra số vô nghĩa khi sinh viên mới vào kỳ đầu. Trường vẫn giữ để dùng chung `TheSoLieu` với
dashboard ADMIN. *Chờ user chốt:* nếu muốn có mũi tên thật, xem phương án B trong báo cáo
bàn giao — chi phí ước lượng thêm ~2 truy vấn và một nhánh so sánh mỗi thẻ.

---

### `GET /api/dashboard/teacher` — dashboard GIANG_VIEN (SCR-04, FR-13.02)

**Quyền:** `GIANG_VIEN`. ADMIN gọi vào nhận `403 FORBIDDEN` từ middleware `vai.tro`.

**Học kỳ được chọn** (`hoc_ky` trong response) — theo thứ tự:

1. Học kỳ `ONGOING` mà giảng viên có ít nhất một lớp `lop_hoc_phan` (không tính đã xóa mềm).
2. Nếu không có: học kỳ có `ngay_bat_dau` lớn nhất mà giảng viên có lớp.
3. Nếu giảng viên chưa được phân lớp nào: `hoc_ky = null`, mọi mảng rỗng. Vẫn trả `200`.

Toàn bộ số liệu dưới đây chỉ tính trong `hoc_ky` đó.

**Tài khoản `GIANG_VIEN` chưa có hồ sơ `giang_vien`** (dữ liệu hỏng) → `403 FORBIDDEN`,
"Không tìm thấy hồ sơ giảng viên." — giống `GET /api/me/gpa`.

Ví dụ (số liệu tính tại thời điểm `2026-11-08 20:00`, học kỳ `2026-1` ONGOING):

```json
{
  "success": true,
  "message": "Tải số liệu dashboard thành công.",
  "data": {
    "hoc_ky": {
      "id": 2,
      "ma_hoc_ky": "2026-1",
      "ten_hoc_ky": "Học kỳ 1 năm học 2026-2027",
      "trang_thai": "ONGOING"
    },
    "the_so_lieu": [
      { "khoa": "lop_phu_trach", "label": "Lớp phụ trách", "gia_tri": 3, "don_vi": null,
        "phu_chu": "2 lớp chưa chốt điểm", "xu_huong": "bang" },
      { "khoa": "sinh_vien_phu_trach", "label": "Sinh viên phụ trách", "gia_tri": 118, "don_vi": null,
        "phu_chu": "Lớp đông nhất 41 sinh viên", "xu_huong": "bang" },
      { "khoa": "buoi_sap_toi", "label": "Buổi học sắp tới", "gia_tri": 4, "don_vi": "buổi",
        "phu_chu": "Trong 14 ngày tới", "xu_huong": "bang" },
      { "khoa": "buoi_chua_diem_danh", "label": "Buổi chưa điểm danh", "gia_tri": 2, "don_vi": "buổi",
        "phu_chu": "1 buổi đã quá hạn sửa", "xu_huong": "bang" }
    ],
    "lop_phu_trach": [
      { "id": 61, "ma_lop_hp": "INT3306-2026-1-61",
        "ma_mon": "INT3306", "ten_mon": "Lập trình web", "so_tin_chi": 3,
        "si_so": "38/45", "ty_le": 84, "nam_thu": 3,
        "trang_thai": "OPEN", "da_chot_diem": false, "diem_tb_lop": 7.83 },
      { "id": 62, "ma_lop_hp": "INT2204-2026-1-62",
        "ma_mon": "INT2204", "ten_mon": "Cơ sở dữ liệu", "so_tin_chi": 3,
        "si_so": "41/45", "ty_le": 91, "nam_thu": 3,
        "trang_thai": "OPEN", "da_chot_diem": false, "diem_tb_lop": null },
      { "id": 63, "ma_lop_hp": "MAT1093-2026-1-63",
        "ma_mon": "MAT1093", "ten_mon": "Đại số tuyến tính", "so_tin_chi": 3,
        "si_so": "39/50", "ty_le": 78, "nam_thu": 3,
        "trang_thai": "CLOSED", "da_chot_diem": true, "diem_tb_lop": 6.45 }
    ],
    "buoi_sap_toi": [
      { "id": 4102, "ngay_hoc": "2026-11-09", "thu": 2,
        "tiet_bat_dau": 1, "tiet_ket_thuc": 3, "gio_bat_dau": "06:30", "gio_ket_thuc": "09:10",
        "hinh_thuc": "LY_THUYET", "trang_thai": "SCHEDULED",
        "ma_lop_hp": "INT3306-2026-1-61", "ma_mon": "INT3306", "ten_mon": "Lập trình web",
        "phong_hoc": { "id": 11, "ma_phong": "A101", "ten_phong": "Phòng A101" } },
      { "id": 4103, "ngay_hoc": "2026-11-10", "thu": 3,
        "tiet_bat_dau": 1, "tiet_ket_thuc": 3, "gio_bat_dau": "06:30", "gio_ket_thuc": "09:10",
        "hinh_thuc": "THUC_HANH", "trang_thai": "SCHEDULED",
        "ma_lop_hp": "INT3306-2026-1-61", "ma_mon": "INT3306", "ten_mon": "Lập trình web",
        "phong_hoc": { "id": 14, "ma_phong": "B201", "ten_phong": "Phòng B201" } },
      { "id": 4110, "ngay_hoc": "2026-11-12", "thu": 5,
        "tiet_bat_dau": 7, "tiet_ket_thuc": 9, "gio_bat_dau": "12:30", "gio_ket_thuc": "15:10",
        "hinh_thuc": "LY_THUYET", "trang_thai": "SCHEDULED",
        "ma_lop_hp": "INT2204-2026-1-62", "ma_mon": "INT2204", "ten_mon": "Cơ sở dữ liệu",
        "phong_hoc": { "id": 12, "ma_phong": "A102", "ten_phong": "Phòng A102" } },
      { "id": 4116, "ngay_hoc": "2026-11-13", "thu": 6,
        "tiet_bat_dau": 7, "tiet_ket_thuc": 9, "gio_bat_dau": "12:30", "gio_ket_thuc": "15:10",
        "hinh_thuc": "LY_THUYET", "trang_thai": "SCHEDULED",
        "ma_lop_hp": "MAT1093-2026-1-63", "ma_mon": "MAT1093", "ten_mon": "Đại số tuyến tính",
        "phong_hoc": { "id": 13, "ma_phong": "A103", "ten_phong": "Phòng A103" } }
    ],
    "buoi_chua_diem_danh": [
      { "id": 4088, "ngay_hoc": "2026-10-29", "thu": 5,
        "tiet_bat_dau": 1, "tiet_ket_thuc": 3, "gio_ket_thuc": "09:10",
        "ma_lop_hp": "INT3306-2026-1-61", "ma_mon": "INT3306", "ten_mon": "Lập trình web",
        "si_so_lop": 38, "so_ngay_tre": 10, "con_sua_duoc": false },
      { "id": 4095, "ngay_hoc": "2026-11-05", "thu": 5,
        "tiet_bat_dau": 7, "tiet_ket_thuc": 9, "gio_ket_thuc": "15:10",
        "ma_lop_hp": "INT2204-2026-1-62", "ma_mon": "INT2204", "ten_mon": "Cơ sở dữ liệu",
        "si_so_lop": 41, "so_ngay_tre": 3, "con_sua_duoc": true }
    ],
    "viec_can_lam": [
      { "loai": "cham_diem_danh", "tieu_de": "Điểm danh buổi đã qua",
        "mo_ta": "2 buổi đã qua chưa điểm danh, trong đó 1 buổi đã quá hạn sửa.",
        "so_luong": 2, "muc_do": "cao", "url": "/diem-danh" },
      { "loai": "chot_diem", "tieu_de": "Chốt điểm lớp học phần",
        "mo_ta": "2 lớp chưa chốt điểm.", "so_luong": 2, "muc_do": "trung_binh",
        "url": "/lop-hoc-phan" },
      { "loai": "buoi_sap_toi", "tieu_de": "Buổi học trong 24 giờ tới",
        "mo_ta": "1 buổi bắt đầu trong 24 giờ tới.", "so_luong": 1, "muc_do": "thap",
        "url": "/lich-hoc" }
    ]
  }
}
```

#### Nguồn số liệu TEACHER — bảng, cột, điều kiện

`G` = giảng viên đang đăng nhập, `K` = học kỳ đã chọn.

| Trường | Tính từ | Cột / điều kiện | Index dùng |
|---|---|---|---|
| `lop_phu_trach` | `lop_hoc_phan` | `giang_vien_id = G.id AND hoc_ky_id = K.id`, không tính xóa mềm. `si_so` = `withCount` đăng ký `ACTIVE` + `/si_so_toi_da`; `ty_le = min(100, round(si_so_thuc/si_so_toi_da*100))`, mẫu số 0 → 0 | `index(giang_vien_id)` |
| `lop_phu_trach[].diem_tb_lop` | `dang_ky_hoc_phan` + `diem` | `AVG(diem.diem_tong_ket)` của các đăng ký `trang_thai = 'ACTIVE'` trong lớp, bỏ qua dòng `diem_tong_ket IS NULL`, làm tròn 2 chữ số. Không có dòng nào được chấm → `null` (**không phải `0`**). **Một** truy vấn gộp `GROUP BY lop_hoc_phan_id` cho mọi lớp của kỳ, dùng chung hàm `QuanLyDiemService::diemTrungBinhLop()` với `GET /api/me/grades` (§14c) | `index(lop_hoc_phan_id, trang_thai)`, `unique(diem.dang_ky_hoc_phan_id)` |
| `the_so_lieu[lop_phu_trach]` | — | `count(lop_phu_trach)`; `phu_chu` = số phần tử có `da_chot_diem = false` | — |
| `the_so_lieu[sinh_vien_phu_trach]` | `dang_ky_hoc_phan` | `sum(si_so_thuc)` trên các lớp ở trên; `phu_chu` = `max(si_so_thuc)` | `index(lop_hoc_phan_id, trang_thai)` |
| `buoi_sap_toi` | `buoi_hoc` | thuộc lớp của G trong K, `trang_thai = 'SCHEDULED'`, `TIMESTAMP(ngay_hoc, gio_ket_thuc) > now()`, `ngay_hoc <= today + 14 ngày`. Sắp xếp `ngay_hoc`, `gio_bat_dau`; **tối đa 20 dòng** | `index(lop_hoc_phan_id, ngay_hoc)` |
| `the_so_lieu[buoi_sap_toi]` | — | `count(buoi_sap_toi)`. `phu_chu` cố định "Trong 14 ngày tới" — **không** phải tổng số buổi còn lại của kỳ | — |
| `buoi_chua_diem_danh` | `buoi_hoc` + `diem_danh` | thuộc lớp của G trong K, `trang_thai = 'SCHEDULED'`, `TIMESTAMP(ngay_hoc, gio_ket_thuc) < now()`, **và** `withCount('diemDanh') = 0`. Sắp xếp `ngay_hoc` **tăng dần** (buổi cũ nhất trước — đó là buổi gấp nhất); **tối đa 20 dòng** | `index(lop_hoc_phan_id, ngay_hoc)`, `unique(buoi_hoc_id, dang_ky_hoc_phan_id)` |
| `buoi_chua_diem_danh[].si_so_lop` | `dang_ky_hoc_phan` | số đăng ký `ACTIVE` của lớp tại thời điểm gọi. Tên khác `buoi_chua_diem_danh[].si_so` ở dashboard ADMIN (`"38/45"`) vì đây là **một con số** | `index(lop_hoc_phan_id, trang_thai)` |
| `buoi_chua_diem_danh[].so_ngay_tre` | — | `floor(now() − TIMESTAMP(ngay_hoc, gio_ket_thuc))` theo ngày | — |
| `buoi_chua_diem_danh[].con_sua_duoc` | `quy_doi_diem` / `cau_hinh` | `false` nếu `K.trang_thai = 'CLOSED'`; ngược lại `now() <= TIMESTAMP(ngay_hoc, gio_ket_thuc) + N ngày`, với `N` = `quy_doi_diem.so_ngay_sua_diem_danh` của K, không có thì `cau_hinh['diem.diem_danh.sua_trong_so_ngay']`, mặc định `7` | `unique(quy_doi_diem.hoc_ky_id)` |
| `viec_can_lam[cham_diem_danh]` | — | `so_luong = count(buoi_chua_diem_danh)`; `muc_do = 'cao'` nếu có ít nhất một dòng `con_sua_duoc = false`, ngược lại `'trung_binh'` | — |
| `viec_can_lam[chot_diem]` | `lop_hoc_phan` | `so_luong` = số lớp ở trên có `chot_diem_luc IS NULL` **và** `K.trang_thai = 'ONGOING'` **và** lớp đã có ít nhất một buổi `DONE`. Kỳ `CLOSED` hoặc `UPCOMING` → `so_luong = 0` và **bỏ hẳn** phần tử này khỏi mảng | `index(giang_vien_id)` |
| `viec_can_lam[buoi_sap_toi]` | — | `so_luong` = số buổi `SCHEDULED` có `TIMESTAMP(ngay_hoc, gio_bat_dau)` trong `[now(), now() + 24 giờ]` | — |

Quy tắc cho `viec_can_lam`: **chỉ trả những việc có `so_luong > 0`**, sắp xếp theo
`muc_do` giảm dần (`cao` → `trung_binh` → `thap`) rồi theo thứ tự khai báo. Không có việc
nào → `viec_can_lam: []`.

#### Trường của TEACHER response

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `hoc_ky` | object \| null | `id`, `ma_hoc_ky`, `ten_hoc_ky`, `trang_thai`. `null` khi giảng viên chưa được phân lớp nào |
| `the_so_lieu[].khoa` | string | `lop_phu_trach`, `sinh_vien_phu_trach`, `buoi_sap_toi`, `buoi_chua_diem_danh` — FE cần map thêm 4 khoá này sang icon |
| `lop_phu_trach[].si_so` | string | Dạng `"38/45"`, hiển thị trực tiếp — cùng quy ước với dashboard ADMIN |
| `lop_phu_trach[].ty_le` | int 0–100 | Độ dài thanh tiến trình |
| `lop_phu_trach[].nam_thu` | int \| null | `null` = lớp phục vụ mọi năm (BR-23) |
| `lop_phu_trach[].da_chot_diem` | bool | `chot_diem_luc !== null` |
| `lop_phu_trach[].diem_tb_lop` | number \| null | Trung bình `diem_tong_ket` của mọi đăng ký `ACTIVE` trong lớp, thang 10, làm tròn 2 chữ số. `null` = **chưa ai được chấm điểm** (không phải `0`) — FE bỏ lớp đó khỏi biểu đồ "Điểm TB lớp phụ trách" chứ không vẽ cột 0 |
| `buoi_sap_toi[].thu` | int 2–8 | 2 = Thứ 2 … 7 = Thứ 7, 8 = Chủ nhật |
| `buoi_sap_toi[].hinh_thuc` | string | `LY_THUYET` / `THUC_HANH` / `TRUC_TUYEN` — quyết định màu khối lịch (SCR-35) |
| `buoi_sap_toi[].phong_hoc` | object \| null | `id`, `ma_phong`, `ten_phong`. `null` nếu phòng đã xóa cứng (không xảy ra với dữ liệu hiện tại — phòng dùng xóa mềm) |
| `buoi_chua_diem_danh[].so_ngay_tre` | int ≥ 0 | Số ngày kể từ lúc buổi kết thúc đến hiện tại |
| `buoi_chua_diem_danh[].si_so_lop` | int | Số đăng ký `ACTIVE` của lớp. Tên khác `lop_sap_mo[].si_so` (`"38/45"`) vì đây là **một con số**, không phải chuỗi hiển thị |
| `buoi_chua_diem_danh[].con_sua_duoc` | bool | `false` → FE hiện nút "Chỉ xem", không mở form điểm danh (BE vẫn chặn bằng `409 ATTENDANCE_EDIT_EXPIRED`) |
| `viec_can_lam[].loai` | string | `cham_diem_danh`, `chot_diem`, `buoi_sap_toi` |
| `viec_can_lam[].muc_do` | string | `cao`, `trung_binh`, `thap` — chỉ dùng để tô màu, không phải trạng thái nghiệp vụ |
| `viec_can_lam[].url` | string | Đường dẫn FE để bấm vào là tới màn xử lý. **Không kèm query**; FE tự thêm bộ lọc học kỳ đang chọn |

---

### `GET /api/dashboard/student` — dashboard SINH_VIEN (SCR-05, FR-13.03)

**Quyền:** `SINH_VIEN`. ADMIN gọi vào nhận `403 FORBIDDEN`.

**Học kỳ được chọn** (`hoc_ky` trong response) — đúng bằng
`GET /api/me/gpa` → `hoc_ky_hien_tai`, để hai màn không bao giờ lệch nhau:

1. Học kỳ `ONGOING` mà sinh viên có đăng ký `ACTIVE`.
2. Nếu không: học kỳ có `ngay_bat_dau` lớn nhất mà sinh viên có đăng ký `ACTIVE`.
3. Nếu chưa đăng ký gì: `hoc_ky = null`, mọi mảng rỗng, `gpa.tich_luy` vẫn trả số (có thể 0).

**Tài khoản `SINH_VIEN` chưa có hồ sơ `sinh_vien`** → `403 FORBIDDEN`,
"Không tìm thấy hồ sơ sinh viên." — giống `GET /api/me/gpa`.

Ví dụ (cùng thời điểm `2026-11-08 20:00`; tuần hiển thị là tuần chứa hôm nay,
`2026-11-02` → `2026-11-08`):

```json
{
  "success": true,
  "message": "Tải số liệu dashboard thành công.",
  "data": {
    "hoc_ky": {
      "id": 2,
      "ma_hoc_ky": "2026-1",
      "ten_hoc_ky": "Học kỳ 1 năm học 2026-2027",
      "trang_thai": "ONGOING"
    },
    "the_so_lieu": [
      { "khoa": "hoc_phan", "label": "Học phần đã đăng ký", "gia_tri": 5, "don_vi": "học phần",
        "phu_chu": "Học kỳ 2026-1", "xu_huong": "bang" },
      { "khoa": "tin_chi", "label": "Tín chỉ trong kỳ", "gia_tri": 15, "don_vi": "tín chỉ",
        "phu_chu": "Trong 5 học phần", "xu_huong": "bang" },
      { "khoa": "gpa_he_4", "label": "GPA tích lũy", "gia_tri": 2.74, "don_vi": "hệ 4",
        "phu_chu": "3 học kỳ đã đóng, 96 tín chỉ", "xu_huong": "bang" },
      { "khoa": "chuyen_can", "label": "Tỷ lệ chuyên cần", "gia_tri": 90.7, "don_vi": "%",
        "phu_chu": "39/43 buổi có mặt hoặc đi muộn", "xu_huong": "bang" }
    ],
    "hoc_phan_da_dang_ky": [
      { "dang_ky_hoc_phan_id": 151, "lop_hoc_phan_id": 71,
        "ma_lop_hp": "INT3306-2026-1-71", "ma_mon": "INT3306", "ten_mon": "Lập trình web",
        "so_tin_chi": 3,
        "giang_vien": { "id": 5, "ma_gv": "GV005", "ho_ten": "Nguyễn Văn An" },
        "ty_le_chuyen_can": 1.0, "diem_tong_ket": null, "diem_chu": null, "ket_qua": null },
      { "dang_ky_hoc_phan_id": 152, "lop_hoc_phan_id": 72,
        "ma_lop_hp": "INT2204-2026-1-72", "ma_mon": "INT2204", "ten_mon": "Cơ sở dữ liệu",
        "so_tin_chi": 3,
        "giang_vien": { "id": 6, "ma_gv": "GV006", "ho_ten": "Trần Thị Ngọc Anh" },
        "ty_le_chuyen_can": 0.7778, "diem_tong_ket": null, "diem_chu": null, "ket_qua": null },
      { "dang_ky_hoc_phan_id": 153, "lop_hoc_phan_id": 73,
        "ma_lop_hp": "MAT1093-2026-1-73", "ma_mon": "MAT1093", "ten_mon": "Đại số tuyến tính",
        "so_tin_chi": 3,
        "giang_vien": { "id": 7, "ma_gv": "GV007", "ho_ten": "Hoàng Đức Long" },
        "ty_le_chuyen_can": 0.875, "diem_tong_ket": null, "diem_chu": null, "ket_qua": null },
      { "dang_ky_hoc_phan_id": 154, "lop_hoc_phan_id": 74,
        "ma_lop_hp": "INT3401-2026-1-74", "ma_mon": "INT3401", "ten_mon": "Trí tuệ nhân tạo",
        "so_tin_chi": 3,
        "giang_vien": { "id": 8, "ma_gv": "GV008", "ho_ten": "Lê Minh Cường" },
        "ty_le_chuyen_can": 1.0, "diem_tong_ket": null, "diem_chu": null, "ket_qua": null },
      { "dang_ky_hoc_phan_id": 155, "lop_hoc_phan_id": 75,
        "ma_lop_hp": "INT2203-2026-1-75", "ma_mon": "INT2203", "ten_mon": "Lập trình hướng đối tượng",
        "so_tin_chi": 3,
        "giang_vien": { "id": 9, "ma_gv": "GV009", "ho_ten": "Phạm Thu Hà" },
        "ty_le_chuyen_can": 0.875, "diem_tong_ket": null, "diem_chu": null, "ket_qua": null }
    ],
    "thoi_khoa_bieu_tuan": {
      "tu_ngay": "2026-11-02",
      "den_ngay": "2026-11-08",
      "cac_buoi": [
        { "id": 4075, "ngay_hoc": "2026-11-02", "thu": 2,
          "tiet_bat_dau": 1, "tiet_ket_thuc": 3, "gio_bat_dau": "06:30", "gio_ket_thuc": "09:10",
          "trang_thai": "DONE", "hinh_thuc": "LY_THUYET", "ly_do_huy": null,
          "ma_lop_hp": "INT3306-2026-1-71", "ma_mon": "INT3306", "ten_mon": "Lập trình web",
          "ma_phong": "A101", "ten_phong": "Phòng A101" },
        { "id": 4078, "ngay_hoc": "2026-11-03", "thu": 3,
          "tiet_bat_dau": 7, "tiet_ket_thuc": 9, "gio_bat_dau": "12:30", "gio_ket_thuc": "15:10",
          "trang_thai": "DONE", "hinh_thuc": "LY_THUYET", "ly_do_huy": null,
          "ma_lop_hp": "INT3401-2026-1-74", "ma_mon": "INT3401", "ten_mon": "Trí tuệ nhân tạo",
          "ma_phong": "B201", "ten_phong": "Phòng B201" },
        { "id": 4082, "ngay_hoc": "2026-11-05", "thu": 5,
          "tiet_bat_dau": 1, "tiet_ket_thuc": 3, "gio_bat_dau": "06:30", "gio_ket_thuc": "09:10",
          "trang_thai": "SCHEDULED", "hinh_thuc": "LY_THUYET", "ly_do_huy": null,
          "ma_lop_hp": "INT2204-2026-1-72", "ma_mon": "INT2204", "ten_mon": "Cơ sở dữ liệu",
          "ma_phong": "A102", "ten_phong": "Phòng A102" },
        { "id": 4085, "ngay_hoc": "2026-11-06", "thu": 6,
          "tiet_bat_dau": 7, "tiet_ket_thuc": 9, "gio_bat_dau": "12:30", "gio_ket_thuc": "15:10",
          "trang_thai": "CANCELLED", "hinh_thuc": "THUC_HANH",
          "ly_do_huy": "Giảng viên ốm",
          "ma_lop_hp": "INT2203-2026-1-75", "ma_mon": "INT2203", "ten_mon": "Lập trình hướng đối tượng",
          "ma_phong": "C301", "ten_phong": "Phòng C301" },
        { "id": 4087, "ngay_hoc": "2026-11-07", "thu": 7,
          "tiet_bat_dau": 1, "tiet_ket_thuc": 3, "gio_bat_dau": "06:30", "gio_ket_thuc": "09:10",
          "trang_thai": "SCHEDULED", "hinh_thuc": "LY_THUYET", "ly_do_huy": null,
          "ma_lop_hp": "MAT1093-2026-1-73", "ma_mon": "MAT1093", "ten_mon": "Đại số tuyến tính",
          "ma_phong": "A103", "ten_phong": "Phòng A103" }
      ]
    },
    "gpa": {
      "hoc_ky_hien_tai": {
        "id": 2, "ma_hoc_ky": "2026-1", "ten_hoc_ky": "Học kỳ 1 năm học 2026-2027",
        "gpa_he_10": null, "gpa_he_4": null, "tong_tin_chi": 15
      },
      "tich_luy": {
        "gpa_he_10": 7.21, "gpa_he_4": 2.74,
        "tong_tin_chi": 96, "tin_chi_dat": 88, "so_hoc_ky_da_tinh": 3
      }
    },
    "chuyen_can": {
      "ty_le": 0.9070,
      "tong_buoi_da_diem_danh": 45,
      "mau_so": 43,
      "co_mat": 35,
      "di_muon": 4,
      "vang": 4,
      "co_phep": 2,
      "ty_le_thap_nhat": { "ma_mon": "INT2204", "ten_mon": "Cơ sở dữ liệu", "ty_le": 0.7778 }
    }
  }
}
```

#### Nguồn số liệu STUDENT — bảng, cột, điều kiện

`S` = sinh viên đang đăng nhập, `K` = học kỳ đã chọn.

| Trường | Tính từ | Cột / điều kiện | Index dùng |
|---|---|---|---|
| `hoc_phan_da_dang_ky` | `dang_ky_hoc_phan` + `lop_hoc_phan` + `mon_hoc` + `giang_vien` | `sinh_vien_id = S.id AND trang_thai = 'ACTIVE'` và `lop_hoc_phan.hoc_ky_id = K.id`, không tính lớp xóa mềm. Eager load `lopHocPhan.monHoc`, `lopHocPhan.giangVien` | `index(sinh_vien_id, trang_thai)` |
| `hoc_phan_da_dang_ky[].ty_le_chuyen_can` | `diem_danh` | công thức FR-11.05 bên dưới, tính riêng cho từng `dang_ky_hoc_phan_id`; mẫu số 0 → `null` | `index(dang_ky_hoc_phan_id)` |
| `hoc_phan_da_dang_ky[].diem_*` | `diem` | `diem_tong_ket`, `diem_chu`, `ket_qua` của chính đăng ký đó; chưa có điểm → `null`. **Không** áp dụng quy tắc BR-28 (lấy điểm cao nhất) ở đây — quy tắc đó chỉ dùng cho GPA, xem ghi chú | `unique(dang_ky_hoc_phan_id)` |
| `the_so_lieu[hoc_phan]` | — | `count(hoc_phan_da_dang_ky)` | — |
| `the_so_lieu[tin_chi]` | `mon_hoc` | `sum(so_tin_chi)` trên các học phần đó | — |
| `the_so_lieu[gpa_he_4]` | `diem` | `gpa.tich_luy.gpa_he_4`; `phu_chu` = `"{so_hoc_ky_da_tinh} học kỳ đã đóng, {tong_tin_chi} tín chỉ"` | `index(sinh_vien_id, trang_thai)`, `index(trang_thai)` trên `hoc_ky` |
| `the_so_lieu[chuyen_can]` | `diem_danh` | `round(chuyen_can.ty_le * 100, 1)`; `phu_chu` = `"{co_mat + di_muon}/{mau_so} buổi có mặt hoặc đi muộn"`. `ty_le = null` → `gia_tri = 0`, `phu_chu` = "Chưa có buổi nào được điểm danh" | — |
| `thoi_khoa_bieu_tuan` | `buoi_hoc` | buổi thuộc lớp mà S đăng ký `ACTIVE`, `ngay_hoc` trong `[thứ 2, chủ nhật]` của tuần chứa hôm nay, không tính buổi xóa mềm. **Giữ cả `CANCELLED`** để hiện gạch chéo như SCR-35. Sắp xếp `ngay_hoc`, `gio_bat_dau`; **tối đa 50 dòng** | `index(lop_hoc_phan_id, ngay_hoc)` |
| `gpa` | `diem` + `mon_hoc` + `hoc_ky` | **Dùng lại nguyên `QuanLyDiemService::gpaCuaToi()`**, không viết lại. Shape đúng bằng `GET /api/me/gpa` (§13). `hoc_ky` của dashboard lấy từ `gpa.hoc_ky_hien_tai` | `index(sinh_vien_id, trang_thai)`, `unique(dang_ky_hoc_phan_id)` |
| `chuyen_can.co_mat/di_muon/vang/co_phep` | `diem_danh` | `count` theo `trang_thai` trên toàn bộ đăng ký `ACTIVE` của K, chỉ tính buổi `ngay_hoc >= dang_ky_luc` của **chính** đăng ký đó (BR-27) | `index(dang_ky_hoc_phan_id)` |
| `chuyen_can.tong_buoi_da_diem_danh` | `diem_danh` | tổng số bản ghi điểm danh được tính (gồm cả `EXCUSED`). Bằng `co_mat + di_muon + vang + co_phep` | — |
| `chuyen_can.mau_so` | — | `tong_buoi_da_diem_danh − co_phep` | — |
| `chuyen_can.ty_le` | — | `mau_so = 0 ? null : round((co_mat + di_muon) / mau_so, 4)` | — |
| `chuyen_can.ty_le_thap_nhat` | — | môn có `ty_le_chuyen_can` nhỏ nhất trong số `ty_le_chuyen_can !== null`; hòa thì lấy `dang_ky_hoc_phan_id` nhỏ hơn. Không có môn nào có tỉ lệ → `null` | — |

**Công thức chuyên cần (FR-11.05, `docs/03-data-model.md` §5.3):**

```
mau_so = co_mat + di_muon + vang            // = tổng bản ghi − EXCUSED
ty_le  = mau_so == 0 ? null : (co_mat + di_muon) / mau_so      // phân số 0–1, 4 chữ số
```

Chỉ đếm buổi có `buoi_hoc.ngay_hoc >= dang_ky_hoc_phan.dang_ky_luc` (so theo **ngày**, không
theo giờ — BR-27). Bản ghi điểm danh của buổi trước mốc đăng ký lại **không** bị xóa nhưng
không được tính.

**`gpa` và `chuyen_can` phải khớp nhau:** `chuyen_can.co_mat/di_muon/vang/co_phep` là **tổng
theo từng môn** của các giá trị dùng để tính `hoc_phan_da_dang_ky[].ty_le_chuyen_can`. Nói
cách khác, nếu cộng ngược các con số đếm của từng đăng ký thì ra đúng khối `chuyen_can`.
Response chỉ trả `ty_le` cho từng môn (không trả bốn con số đếm riêng) để payload gọn, nhưng
test phải khoá ràng buộc này.

Ví dụ trong JSON trên khớp như sau (mẫu số từng môn → cộng lại):

| Môn | có mặt + đi muộn / mẫu số | `ty_le_chuyen_can` |
|---|---|---|
| INT3306 | 10/10 | `1.0` |
| INT2204 | 7/9 | `0.7778` |
| MAT1093 | 7/8 | `0.875` |
| INT3401 | 8/8 | `1.0` |
| INT2203 | 7/8 | `0.875` |
| **Tổng** | **39/43** | `0.9070` |

`vang` môn nào cũng bằng `mẫu số − (có mặt + đi muộn)` → tổng `vang = 43 − 39 = 4`. Cộng
`co_phep = 2` ra `tong_buoi_da_diem_danh = 45`. Môn thấp nhất là `INT2204` với `0.7778` —
đúng bằng `chuyen_can.ty_le_thap_nhat`. `co_mat = 35` và `di_muon = 4` là cách chia 39 kia
thành hai nhóm; cả hai đều nằm trong tử số nên tỉ lệ không phụ thuộc cách chia.

> Số trong ba response mẫu (ADMIN, TEACHER, STUDENT) là **ví dụ minh hoạ**, không phải dữ
> liệu seed thật. Ràng buộc là **nhất quán nội tại**: `gia_tri` của thẻ bằng số phần tử hoặc
> tổng của mảng tương ứng; `phu_chu` khớp số liệu trong cùng response.

**Vì sao `hoc_phan_da_dang_ky[].diem_tong_ket` không áp BR-28:** bảng này là "học phần đã
đăng ký **trong kỳ này**", mỗi dòng là một đăng ký thật; hiển thị điểm của lần học khác sẽ
sai. BR-28 (lấy điểm cao nhất) chỉ áp khi gộp theo môn để tính GPA, và việc đó nằm trong
`gpa` — dùng lại service, không tính lại.

#### Trường của STUDENT response

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `hoc_ky` | object \| null | `{id, ma_hoc_ky, ten_hoc_ky, trang_thai}` của **cùng** bản ghi `hoc_ky` mà `gpa.hoc_ky_hien_tai` trỏ tới, thêm `trang_thai` lấy từ model. `null` khi sinh viên chưa đăng ký kỳ nào |
| `the_so_lieu[].khoa` | string | `hoc_phan`, `tin_chi`, `gpa_he_4`, `chuyen_can` — FE cần map thêm 4 khoá này sang icon |
| `hoc_phan_da_dang_ky[].ty_le_chuyen_can` | number \| null | **Phân số 0–1, 4 chữ số** (không phải %). `null` = chưa điểm danh buổi nào |
| `hoc_phan_da_dang_ky[].giang_vien` | object \| null | `id`, `ma_gv`, `ho_ten` — không trả email/điện thoại; liên hệ dùng `GET /api/teachers/{id}` |
| `thoi_khoa_bieu_tuan.tu_ngay` / `den_ngay` | date | Thứ 2 và Chủ nhật của tuần chứa hôm nay |
| `thoi_khoa_bieu_tuan.cac_buoi[].trang_thai` | string | `SCHEDULED`, `DONE`, `CANCELLED` — **không** dùng để suy ra đã điểm danh; dashboard không trả `da_diem_danh` |
| `chuyen_can.ty_le` | number \| null | Phân số 0–1, 4 chữ số. Thẻ `the_so_lieu[chuyen_can]` mới là phần trăm |
| `chuyen_can.mau_so` | int | Mẫu số thật của công thức; `0` → `ty_le = null`, UI hiện "—" |
| `chuyen_can.ty_le_thap_nhat` | object \| null | `ma_mon`, `ten_mon`, `ty_le` — dùng cho dòng cảnh báo "Môn cần chú ý" |

**Phụ thuộc chưa có:** không có bảng `notifications` và không có endpoint thông báo trong
repo tại thời điểm viết đặc tả này (đã kiểm `backend/database/migrations/`). Vì vậy
dashboard TEACHER/STUDENT **không** trả khối thông báo. Khi làm tính năng thông báo, thêm
`thong_bao_chua_doc: { so_luong }` hoặc một khối riêng — không sửa shape hiện tại.

**Truy vấn bắt buộc tránh N+1 (UC-16 AC-3):** mỗi endpoint tối đa **9 truy vấn** cho dữ
liệu demo (501 sinh viên / 150 lớp / 2.550 buổi / 7.028 đăng ký / 76.381 điểm danh). Cụ thể:

- Dùng `withCount` cho sĩ số lớp và số dòng điểm danh của buổi, **không** gọi
  `->count()` trong vòng lặp.
- Điểm danh của toàn bộ học phần trong kỳ: **một** truy vấn
  `diem_danh WHERE dang_ky_hoc_phan_id IN (...) JOIN buoi_hoc` rồi gom trong PHP, **không**
  lặp theo từng đăng ký như `QuanLyDiemDanhService::thongKeCuaToi()` đang làm
  (`backend/app/Services/QuanLyDiemDanhService.php:307-310` — mỗi đăng ký một truy vấn).
- Cấu hình số ngày sửa điểm danh: đọc **một lần** cho cả response (map theo `hoc_ky_id`).
- `viec_can_lam[buoi_sap_toi]` (cửa sổ 24 giờ) **suy từ** collection `buoi_sap_toi` đã tải
  (vì 24 giờ ⊂ 14 ngày) — không phát sinh truy vấn thứ hai. Lọc trong PHP theo
  `TIMESTAMP(ngay_hoc, gio_bat_dau)`.
- `viec_can_lam[chot_diem]` cần biết "lớp đã có ít nhất một buổi `DONE`": lấy bằng **một**
  truy vấn gộp `SELECT lop_hoc_phan_id, COUNT(*) ... WHERE trang_thai='DONE' GROUP BY ...`
  trên các lớp của giảng viên, không `exists()` từng lớp.
- `lop_phu_trach[].diem_tb_lop`: **một** truy vấn gộp
  `SELECT lop_hoc_phan_id, AVG(diem_tong_ket) ... GROUP BY lop_hoc_phan_id` cho mọi lớp của
  kỳ (`QuanLyDiemService::diemTrungBinhLop()`, dùng chung với `/api/me/grades`), không
  `avg()` từng lớp.

Ngân sách truy vấn dự kiến của `/teacher`: hồ sơ giảng viên + học kỳ (2) + lớp kèm `withCount`
(1) + `diem_tb_lop` gộp (1) + `buoi_sap_toi` (1) + `buoi_chua_diem_danh` kèm `withCount` (1)
+ lớp có buổi `DONE` (1) + cấu hình (1) = **8**.

Đo bằng `DB::enableQueryLog()` (2026-11-09): **8 truy vấn**, không đổi từ 1 đến 30 lớp —
`test_diem_tb_lop_khong_phat_sinh_them_truy_van_theo_so_lop` khoá điều này. Trước khi thêm
`diem_tb_lop` là **7**; phần tăng thêm đúng **một** truy vấn gộp `GROUP BY lop_hoc_phan_id`,
không phải một truy vấn mỗi lớp.

Của `/student`, đo bằng `DB::enableQueryLog()` trong
`DashboardVaiTroTest::test_dashboard_student_toi_da_8_truy_van` (2026-11-09): **10**.

| # | Truy vấn | Ghi chú |
|---|---|---|
| 1 | hồ sơ sinh viên | |
| 2 | chọn học kỳ mặc định | ONGOING có đăng ký → kỳ mới nhất; truyền `hoc_ky_id` thì bỏ |
| 3–7 | đăng ký của kỳ + 4 eager load (lớp, môn, giảng viên, điểm) | gồm sĩ số lớp |
| 8 | CPA tích lũy: đăng ký của các kỳ `CLOSED` + 3 eager load | bắt buộc, khác kỳ hiện tại |
| 9 | điểm danh gộp (JOIN `buoi_hoc`) | |
| 10 | buổi học trong tuần (JOIN `phong_hoc`) | |

**Sửa ngưỡng test từ 8 → 10.** Con số "7–8" trước đây đếm một chuỗi eager-load là MỘT
truy vấn, trong khi Eloquent chạy mỗi quan hệ một truy vấn riêng. Đây là **sai cách đếm**,
không phải code chậm: 10 truy vấn cho một trang dashboard, mỗi truy vấn đều dùng index và
trả về collection gộp — không có N+1 (không truy vấn nào nằm trong vòng lặp).

Muốn xuống 8 thì phải bỏ khối `gpa.tich_luy` (2 truy vấn) — nhưng SCR-05 hiển thị GPA tích
lũy và 96 tín chỉ, nên cắt nó là cắt tính năng. Giữ 10 và ghi đúng ngưỡng.
Test TC-16b.10 và TC-16c.9 (`docs/06-test-plan.md`) khoá ngưỡng này bằng `DB::listen`.

#### Mã lỗi của hai endpoint mới

Không có mã lỗi mới nào. Cả hai dùng đúng mã đã có ở §1.5:

| Tình huống | HTTP | `ma_loi` | Ghi chú |
|---|---|---|---|
| Không gửi token / token hết hạn | 401 | `UNAUTHENTICATED` | Middleware `auth:sanctum` |
| Chưa đổi mật khẩu lần đầu | 403 | `MUST_CHANGE_PASSWORD` | Middleware `doi.mat.khau` |
| Vai trò không khớp (`ADMIN` gọi `/teacher` hoặc `/student`) | 403 | `FORBIDDEN` | Middleware `vai.tro` |
| Tài khoản `GIANG_VIEN`/`SINH_VIEN` chưa có hồ sơ | 403 | `FORBIDDEN` | Message: "Không tìm thấy hồ sơ giảng viên/sinh viên." |
| Lỗi máy chủ | 500 | — | Envelope lỗi mặc định, `ma_loi: null` |

Không có `404` (không nhận tham số đường dẫn), không có `422` (không nhận body/query),
không có `409` (endpoint chỉ đọc).

#### Test tối thiểu phải có (PHPUnit)

Danh sách case **chỉ khai một nơi**: `docs/06-test-plan.md` mục **TC-16a/b/c** (30 case).
Lý do tách: hợp đồng API giữ shape, test plan giữ kịch bản; chép hai nơi thì sớm muộn cũng
lệch nhau. Ba nhóm:

- **TC-16a (8 case)** — phân quyền, nhánh rỗng, dữ liệu hỏng, quy tắc nhất quán `gia_tri`,
  và `gpa` của `/student` phải bằng đúng payload `/api/me/gpa`.
- **TC-16b (13 case)** — cửa sổ thời gian, `con_sua_duoc`, `viec_can_lam`, phạm vi lớp của
  giảng viên, `diem_tb_lop` (giá trị, `null`, không N+1), ngưỡng truy vấn.
- **TC-16c (9 case)** — công thức chuyên cần, BR-27, ranh giới tuần, quy ước `thu`, ngưỡng
  truy vấn.

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
| GET | `/api/settings` | ADMIN, GIANG_VIEN, SINH_VIEN — không phải ADMIN chỉ nhận khoá `diem.*` |
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

Hai cột, **không gộp**: *Đặc tả* = số operation khai trong file này; *Đã code* = số route
thật trong `backend/routes/api.php`. Cả hai đếm **theo prefix đường dẫn**, không theo nhóm
nghiệp vụ — nhờ vậy đếm lại được bằng máy (`php artisan route:list` và grep bảng trong file
này), không phải đoán.

> Đo ngày **2026-11-08**: 134 route thật, 131 operation đặc tả (3 operation đặc tả nhưng
> chưa có route; 6 route có nhưng chưa đặc tả).

| Prefix | Đặc tả | Đã code | Ghi chú |
|---|---|---|---|
| `sections` | 15 | 15 | 12 route ở §10, 3 route buổi học ở §11 |
| `me` | **11** | 10 | Chênh 1: `GET /api/me/schedule` đặc tả nhưng **không có route** (xem mục Sai lệch #1) |
| `options` | 9 | 9 | 8 ở §17 + `options/periods` ở §11 |
| `admin-classes` | 8 | 8 | |
| `rooms` | 8 | 8 | |
| `students` | 8 | 8 | |
| `subjects` | 8 | 8 | |
| `teachers` | 8 | 8 | |
| `users` | 8 | 8 | |
| `enrollments` | 6 | 6 | 4 ở §12 + 2 route điểm ở §13 |
| `semesters` | 6 | 6 | |
| `khoa` | 5 | 5 | |
| `menus` | 5 | 5 | |
| `nganh` | 5 | 5 | |
| `sessions` | 5 | 5 | |
| `auth` | 4 | 4 | |
| `exams` | 4 | 4 | |
| `dashboard` | **3** | **1** | Đã code chỉ `dashboard/admin`. **`dashboard/teacher` và `dashboard/student` vừa được đặc tả đầy đủ ở §14, chưa code** |
| `settings` | 2 | 3 | Đặc tả 2 ở §16; `GET /settings/semesters` đặc tả bằng văn xuôi ở §13 nên bộ đếm theo bảng không thấy — **thực tế đủ 3, không thiếu** |
| `trash` | 2 | 2 | |
| `schedules` | 1 | 1 | |
| `logs` | 0 | 3 | **Chưa đặc tả** — `GET /logs`, `/logs/options`, `/logs/{id}` |
| `audit-logs` | 0 | 1 | **Chưa đặc tả** — alias của `/logs`, cùng `NhatKyController@index` |
| `user` | 0 | 1 | **Chưa đặc tả** — route debug Laravel mẫu (xem Sai lệch #2) |
| **Tổng** | **131** | **134** | Đặc tả 131 + `settings/semesters` (đặc tả văn xuôi) = **132 operation thật**; code 134, chênh 2 = `logs` 3 + `audit-logs` 1 + `user` 1 (5 route chưa đặc tả) − `me/schedule` 1 + `dashboard/teacher` 1 + `dashboard/student` 1 (3 operation đặc tả chưa code) = 134 |

**Sai lệch đã biết — chưa sửa trong lượt này** (ngoài phạm vi dashboard, ghi lại để không
mất dấu):

1. `GET /api/me/schedule` có trong bảng §14 nhưng **không tồn tại** trong `routes/api.php`.
   Sinh viên xem lịch tuần đang dùng `GET /api/schedules` (có phân trang; `LichHocService`
   gọi đúng route đó và tự lấy đủ trang). Đề xuất: **xóa dòng `/api/me/schedule` khỏi §14**
   thay vì viết endpoint mới — `/api/schedules` đã lọc theo vai trò `SINH_VIEN` và trả đủ
   trường. *Chờ user chốt.*
2. `GET /api/user` (route debug của Laravel mẫu) trả `User` trần, **không** theo envelope
   `{success, message, data}`. Không đặc tả, không dùng ở FE; đề xuất xóa route.
3. `GET /api/audit-logs` trùng chức năng với `GET /api/logs` (cùng `NhatKyController@index`).
   Giữ một cái, xóa cái còn lại.
4. §13 vẫn ghi `PUT /api/enrollments/{id}/grade` và `GET /api/enrollments/{id}/grade-history`
   là "chưa triển khai" nhưng cả hai **đã có route và controller** (`DiemController`).
   Sửa nhãn khi chạm module điểm.
5. Bảng cũ ghi tổng **125** trong khi đặc tả thật là 131 và code là 134 — không nhóm nào
   khớp. Bảng mới đếm theo prefix để lần sau đối chiếu bằng một lệnh.

---

## 18b. Đề xuất index cho dashboard TEACHER/STUDENT

Đo trên dữ liệu seed (`docs/03-data-model.md` §7: 150 lớp, 2.550 buổi, 7.028 đăng ký,
76.381 điểm danh). **Chưa tạo migration nào** — đây là đề xuất, chờ user chốt trước khi
`qllh-backend` viết migration.

| # | Bảng | Index đề xuất | Truy vấn được lợi | Có sẵn index gần nhất |
|---|---|---|---|---|
| 1 | `diem_danh` | `index(dang_ky_hoc_phan_id, buoi_hoc_id)` | Đếm điểm danh theo từng đăng ký của dashboard STUDENT; đã có `index(dang_ky_hoc_phan_id)` nên index này **chỉ thêm phần `buoi_hoc_id` để thành covering** cho `SELECT trang_thai` khi join buổi | `index(dang_ky_hoc_phan_id)` — đủ cho tra cứu, chưa covering |
| 2 | `buoi_hoc` | `index(lop_hoc_phan_id, trang_thai, ngay_hoc)` | `buoi_sap_toi` và `buoi_chua_diem_danh` của TEACHER: lọc `trang_thai` + khoảng `ngay_hoc` trong một lớp. Hiện có `index(lop_hoc_phan_id, ngay_hoc)` phải đọc rồi lọc `trang_thai` | `index(lop_hoc_phan_id, ngay_hoc)` |
| 3 | `dang_ky_hoc_phan` | `index(sinh_vien_id, trang_thai, lop_hoc_phan_id)` | `hoc_phan_da_dang_ky` + `chuyen_can` của STUDENT: lấy danh sách `id` đăng ký để `WHERE IN` sang `diem_danh`. Hiện có `index(sinh_vien_id, trang_thai)` phải về bảng chính lấy `lop_hoc_phan_id` | `index(sinh_vien_id, trang_thai)` |

**Kết luận:** không index nào là **bắt buộc** để chạy đúng — cả ba đều là tối ưu đọc.
Nếu bỏ qua cả ba, dashboard vẫn < 500 ms với dữ liệu seed vì mọi truy vấn đều lọc theo
`sinh_vien_id`/`giang_vien_id` đã có index. Chỉ nên làm #1 và #3 nếu đo thật thấy chậm sau
khi có dữ liệu lớn hơn seed (quy tắc "chỉ sửa khi có số đo" trong `CLAUDE.md`).

**Index KHÔNG cần:**
- `diem(dang_ky_hoc_phan_id)` — đã có `unique(dang_ky_hoc_phan_id)`.
- `hoc_ky(trang_thai)` — đã có.
- `diem_danh(buoi_hoc_id)` — đã có qua `unique(buoi_hoc_id, dang_ky_hoc_phan_id)` (cột đầu).

---

## 19. Sinh `openapi.yaml`

- Viết tay `docs/openapi.yaml` từ tài liệu này, hoặc dùng `scribe`/`l5-swagger` để sinh.
- Quy ước: mỗi endpoint có `summary`, `security`, `parameters`, `requestBody`, `responses` cho 200/201/401/403/404/409/422.
- Khi thêm endpoint mới, cập nhật file này **trước**, rồi mới code.
- FE sinh model TypeScript từ `openapi.yaml` để tránh lệch kiểu.
