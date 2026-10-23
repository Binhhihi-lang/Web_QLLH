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
| `token` | Bearer token sau khi đăng nhập | ✅ Tự lưu khi login |
| `mon_hoc_id` | ID môn học đầu tiên | ✅ Tự lưu khi gọi options/subjects |
| `hoc_ky_id` | ID học kỳ đang diễn ra | ✅ Tự lưu |
| `giang_vien_id` | ID giảng viên đầu tiên | ✅ Tự lưu |
| `lop_hp_id` | ID lớp học phần còn chỗ | ✅ Tự lưu |

Xem/sửa biến: click vào collection → tab **Variables**.

### 2.2. Cơ chế tự lưu token

Request **"Đăng nhập (ADMIN)"** có đoạn script ở tab **Tests**:

```javascript
const body = pm.response.json();
pm.collectionVariables.set('token', body.data.token);
```

Nghĩa là: chạy login xong, token tự ghi vào biến `token`. Mọi request khác dùng header:

```
Authorization: Bearer {{token}}
```

**Không cần copy-paste token bằng tay.**

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
| 2 | `01 → Đăng nhập (ADMIN)` | 200, có token, lưu biến `token` |
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

1. Chạy `Đăng nhập (SINH VIÊN)` → biến `token` giờ là token sinh viên
2. Chạy `Hồ sơ của tôi` → phải trả `vai_tro: SINH_VIEN` và có `ho_so`
3. Chạy `Đăng nhập (ADMIN)` → token đổi lại thành admin
4. Chạy `Hồ sơ của tôi` → phải trả `vai_tro: ADMIN`, `ho_so: null`

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
