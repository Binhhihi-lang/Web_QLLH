# Hướng dẫn test API bằng Postman

Tài liệu này hướng dẫn test backend QLLH **độc lập, không cần frontend**.

---

## 1. Chuẩn bị (làm một lần)

### 1.1. Chạy backend

```bash
cd backend
php artisan serve
```

Mặc định chạy ở `http://127.0.0.1:8000`. Nếu đổi cổng thì sửa biến `base_url` trong Postman.

### 1.2. Nạp dữ liệu demo

```bash
php artisan migrate:fresh --seed
```

Mất khoảng 2 phút vì DB ở xa. Kết quả: 555 tài khoản, 120 lớp học phần, 2.040 buổi học.

### 1.3. Import collection

1. Mở Postman → **File → Import**
2. Chọn `docs/postman/QLLH.postman_collection.json`
3. Collection **"QLLH API — Hệ thống quản lý lớp học"** xuất hiện ở sidebar trái

---

## 2. Cách hoạt động

### 2.1. Biến collection

| Biến | Ý nghĩa | Tự động lưu? |
|---|---|---|
| `base_url` | Địa chỉ backend | Cố định, sửa tay nếu đổi cổng |
| `token_admin` | Bearer token ADMIN | ✅ Tự lưu khi đăng nhập ADMIN |
| `token_sinh_vien` | Bearer token SINH_VIEN | ✅ Tự lưu khi đăng nhập SINH_VIEN |
| `token_giang_vien` | Bearer token GIANG_VIEN | ✅ Tự lưu khi đăng nhập GIANG_VIEN |
| `token` | Token ADMIN tương thích với các request cũ | ✅ Cập nhật khi đăng nhập ADMIN |
| `mon_hoc_id` | ID môn học đầu tiên | ✅ Tự lưu khi gọi options/subjects |
| `hoc_ky_id` | ID học kỳ đang diễn ra | ✅ Tự lưu |
| `giang_vien_id` | ID giảng viên đầu tiên | ✅ Tự lưu |
| `lop_hp_id` | ID lớp học phần còn chỗ | ✅ Tự lưu |

Xem/sửa biến: click vào collection → tab **Variables**.

### 2.2. Cơ chế tự lưu token

Collection có script **Tests** ở cấp collection: sau mọi request đăng nhập thành công, script đọc vai trò từ response và tự lưu token vào `token_admin`, `token_sinh_vien` hoặc `token_giang_vien`. ADMIN cũng cập nhật biến `token` để tương thích với request cũ. Request đăng nhập SINH_VIEN trong folder 01 có thêm assertion xác nhận `token_sinh_vien` đã được ghi.

Các request kiểm tra hồ sơ cá nhân đã gắn đúng biến theo vai trò. Không cần mở collection Variables để dán token thủ công.

Request ADMIN cũ dùng header:

```
Authorization: Bearer {{token}}
```

`token` vẫn được cập nhật khi đăng nhập ADMIN để giữ tương thích với các request cũ. Đăng xuất ADMIN sẽ xóa `token` và `token_admin`.

Nếu collection đã được import vào Postman trước khi file này cập nhật, hãy import lại `docs/postman/QLLH.postman_collection.json` để lấy script mới; collection trong workspace không tự đồng bộ theo file trên máy.

### 2.3. Cơ chế kiểm tra tự động

Mỗi request đều có script assert. Sau khi gửi, xem tab **Test Results** ở phần response:

```
✓ Trả 200
✓ Có token trong data
✓ Vai trò là ADMIN
```

Xanh = đúng hợp đồng API. Đỏ = backend trả sai.

---

## 3. Thứ tự chạy

### Cách nhanh nhất: chạy cả collection

1. Click chuột phải collection → **Run collection**
2. Bỏ tick request **"Đổi mật khẩu"** (nó đổi mật khẩu thật trên DB)
3. Bấm **Run QLLH API**

Kết quả: bảng tóm tắt pass/fail từng request.

### Cách thủ công (khuyến nghị khi mới học)

Chạy lần lượt theo số thứ tự:

| Bước | Request | Kỳ vọng |
|---|---|---|
| 1 | `00 → Health check` | 200, `success: true` |
| 2 | `01 → Đăng nhập (ADMIN)` | 200, tự lưu `token_admin` và `token` |
| 3 | `01 → Hồ sơ của tôi (me)` | 200, `vai_tro: ADMIN`, `ho_so: null` |
| 4 | `02 → Môn học` | 200, 30 phần tử |
| 5 | `02 → Học kỳ` | 200, 3 phần tử |
| 6 | `02 → Lớp học phần` | 200, có lớp `con_cho > 0` |
| 7 | `03 → Không có token` | 401 `UNAUTHENTICATED` |
| 8 | `03 → Route không tồn tại` | 404 `NOT_FOUND` |

---

## 4. Test phân quyền 3 vai trò

Điểm quan trọng: **phải đăng nhập bằng tài khoản thật của từng vai trò**, không dùng chế độ "xem như" của ADMIN (ADR-014 ghi rõ view-as không kiểm chứng được phân quyền server).

| Vai trò | Email | Mật khẩu | `ho_so` trả về |
|---|---|---|---|
| ADMIN | `admin@example.com` | `password` | `null` |
| GIẢNG VIÊN | `giangvien@example.com` | `password` | `{ loai: "giang_vien", ma_gv: "GV0000", ... }` |
| SINH VIÊN | `sinhvien@example.com` | `password` | `{ loai: "sinh_vien", ma_sv: "SV000000", ... }` |

**Quy trình test:**

1. Chạy `Đăng nhập (SINH VIÊN)` → token tự lưu vào `token_sinh_vien`
2. Chạy request hồ sơ sinh viên trong folder 14 → phải trả `vai_tro: SINH_VIEN` và có `ho_so`
3. Chạy `Đăng nhập (ADMIN)` → token tự lưu vào `token_admin` (và `token` tương thích)
4. Chạy request hồ sơ ADMIN trong folder 14 → phải trả `vai_tro: ADMIN`, `ho_so: null`

Nếu bước 2 trả ADMIN → backend đang cache token sai.

---

## 5. Test luồng `must_change_password`

Kiểm tra FR-01.05: tài khoản bắt đổi mật khẩu lần đầu chỉ được gọi 3 endpoint.

**Chuẩn bị** — đặt cờ trong DB:

```bash
cd backend
php artisan tinker
```

```php
App\Models\User::where('email', 'admin@example.com')->update(['must_change_password' => true]);
```

**Test:**

| Bước | Request | Kỳ vọng |
|---|---|---|
| 1 | Đăng nhập (ADMIN) | 200, `must_change_password: true` |
| 2 | `Hồ sơ của tôi` | **200** (được phép) |
| 3 | `Môn học` (options/subjects) | **403 `MUST_CHANGE_PASSWORD`** |
| 4 | `Đổi mật khẩu` | 200 |
| 5 | `Môn học` | **200** (đã mở khóa) |

**Khôi phục:**

```php
App\Models\User::where('email', 'admin@example.com')->update(['must_change_password' => false]);
```

---

## 6. Test rate limit đăng nhập

FR-01.01 giới hạn 5 lần/phút/IP.

1. Chạy `Sai mật khẩu` 5 lần liên tiếp
2. Lần thứ 6 → **429 `TOO_MANY_REQUESTS`**

Reset: chờ 1 phút, hoặc `php artisan cache:clear`.

---

## 7. Test bằng dòng lệnh (không cần Postman)

Dùng `curl` khi muốn test nhanh hoặc viết script.

### Đăng nhập và lấy token

```bash
curl -s -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

### Lưu token vào biến shell

**Git Bash / Linux / macOS:**

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
```

**PowerShell:**

```powershell
$resp = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"password"}'
$token = $resp.data.token
```

### Gọi endpoint có bảo vệ

**Git Bash:**

```bash
curl -s http://127.0.0.1:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**PowerShell:**

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/me" `
  -Headers @{ Authorization = "Bearer $token" }
```

### Xem mã HTTP (không chỉ body)

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/api/auth/me
```

---

## 8. Các mã lỗi cần kiểm tra

| Mã HTTP | `ma_loi` | Khi nào |
|---|---|---|
| 401 | `AUTH_INVALID` | Sai email hoặc mật khẩu |
| 401 | `UNAUTHENTICATED` | Không có token / token hết hạn |
| 403 | `ACCOUNT_LOCKED` | Tài khoản `trang_thai = false` |
| 403 | `MUST_CHANGE_PASSWORD` | Chưa đổi mật khẩu lần đầu |
| 403 | `FORBIDDEN` | Sai vai trò |
| 404 | `NOT_FOUND` | Route hoặc bản ghi không tồn tại |
| 409 | `SECTION_FULL`, `SCHEDULE_CONFLICT`, ... | Xung đột nghiệp vụ (Tuần 5–9) |
| 422 | `VALIDATION_ERROR` | Dữ liệu sai định dạng |
| 429 | `TOO_MANY_REQUESTS` | Quá 5 lần đăng nhập/phút |

Bảng đầy đủ: [04-api-contract.md](../04-api-contract.md) mục 1.5.

---

## 9. Xử lý sự cố

| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| `Could not send request` | Backend chưa chạy | `php artisan serve` |
| `401 UNAUTHENTICATED` mọi request | Chưa login hoặc token hết hạn | Chạy lại request đăng nhập |
| `403 MUST_CHANGE_PASSWORD` | Cờ `must_change_password = true` | Đổi mật khẩu, hoặc tắt cờ trong DB |
| `429` | Đã thử 5 lần/phút | `php artisan cache:clear` |
| Đăng nhập báo sai mật khẩu | DB chưa seed hoặc đã đổi mật khẩu | `php artisan migrate:fresh --seed` |
| Response là HTML thay vì JSON | Thiếu header `Accept: application/json` | Thêm header (collection đã có sẵn) |

---

## 10. Lưu ý khi test trên dữ liệu thật

- Collection chạy trên **DB thật** (Aiven), không phải DB test.
- Request **"Đổi mật khẩu"** thay đổi mật khẩu thật → chạy seeder lại để khôi phục.
- Request xóa/sửa dữ liệu (Tuần 3 trở đi) cũng vậy — luôn có `migrate:fresh --seed` làm lưới an toàn.
- Muốn test an toàn hơn: đổi `DB_DATABASE` trong `.env` sang một schema riêng (ví dụ `QLLopHoc_test`).

---

## 11. Tài liệu liên quan

- Hợp đồng API đầy đủ: [04-api-contract.md](../04-api-contract.md)
- OpenAPI (sinh model TS): [openapi.yaml](../openapi.yaml)
- Ma trận test case: [06-test-plan.md](../06-test-plan.md)

## 12. Đăng ký học phần (folder 16)

1. Đăng nhập ADMIN ở folder 01; đăng nhập STUDENT ở request 01 của folder 16. Request này tự lưu `token_sinh_vien` và `enrollment_student_id`.
2. Chạy folder 04 để tạo hai sinh viên test (`sinh_vien_id`, `sinh_vien_bulk_id`). Điền `enrollment_section_id` bằng ID lớp `OPEN`, còn chỗ và học kỳ đang trong đợt đăng ký.
3. Chạy request 02–04 và 07–15 theo thứ tự để kiểm tra tự đăng ký, xem danh sách, trùng lớp, ADMIN đăng ký hộ/bulk, quyền, validate, hủy và đăng ký lại.
4. Chạy request 05–06 và 16–22 để kiểm tra lỗi nghiệp vụ. Điền ID vào biến `enrollment_duplicate_subject_section_id`, `enrollment_conflict_section_id`, `enrollment_outside_section_id`, `enrollment_full_section_id`, `enrollment_protected_id`, `enrollment_wrong_year_section_id`, `enrollment_inactive_student_id`, `enrollment_closed_section_id` theo mô tả từng request.
5. Hủy đăng ký chỉ thành công khi chưa phát sinh điểm/điểm danh. STUDENT chỉ hủy trong đợt; ADMIN được hủy ngoài đợt.

**Riêng request 06 — Trùng lịch:** request 02 trước đó phải đăng ký thành công cho sinh viên vào một lớp có buổi `SCHEDULED`. Biến `enrollment_conflict_section_id` phải là **một lớp khác**, cũng có buổi `SCHEDULED` cùng ngày với buổi ở lớp đã đăng ký và giờ học giao nhau. Ví dụ lớp đã đăng ký học 09:00–10:00, lớp ở request 06 học 09:30–10:30 cùng ngày thì bị trùng; nếu lớp mới bắt đầu lúc 10:00 thì không trùng. Kiểm tra ngày/giờ ở bảng `buoi_hoc`; không cần cùng phòng. Nếu dữ liệu hiện tại không có cặp buổi như vậy thì request 06 sẽ không thể tạo lỗi `SCHEDULE_CONFLICT` chỉ bằng cách điền một ID bất kỳ. Response lỗi có `errors.trung_lich` để xem mã lớp và thời gian của cả hai buổi.

Các lỗi được kiểm tra: `OUTSIDE_REGISTRATION`, `SECTION_FULL`, `DUPLICATE_ENROLLMENT`, `DUPLICATE_SUBJECT_IN_SEMESTER`, `SCHEDULE_CONFLICT`, `WRONG_STUDY_YEAR`, `HAS_GRADE_OR_ATTENDANCE`, cùng các lỗi quyền `403` và validate `422`.
