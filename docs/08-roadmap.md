# 08 — Kế hoạch triển khai 10 tuần

Thứ tự đã sửa theo ADR-010: **Lớp học phần → Buổi học → Đăng ký**. Mỗi tuần phải để lại sản phẩm chạy được, không dồn kiểm thử về cuối.

**Quy ước:** ✅ Must · 🔶 Should · ⚪ Could

---

## Tuần 1 — Nền tảng & chốt hợp đồng ✅ (hoàn thành 2026-10-21)

| Việc | Chi tiết | Nguồn | Trạng thái |
|---|---|---|---|
| Chốt tài liệu v0.3 | Rà lại 8 tài liệu, xác nhận không còn mâu thuẫn | `docs/00-index.md` | ✅ |
| Dọn backend | Bỏ Blade khỏi đường chạy chính, thêm `config/cors.php`, cấu hình Sanctum, bỏ `gio.hanh.chinh` khỏi `/api` | ADR-001, ADR-008 | ✅ |
| Envelope + exception | Chuẩn hóa `ApiResponse`, thêm `ma_loi`, xử lý 401/403/404/409/422/429 cho `api/*` | ADR-009 | ✅ |
| Migration mới | 15 bảng nghiệp vụ + bổ sung cột `users`, theo [03-data-model.md](03-data-model.md) | ADR-003 | ✅ |
| Factory + Seeder | Factory cho 13 model; seeder demo đầy đủ | 03 mục 7 | ✅ |
| `openapi.yaml` khung | Khung OpenAPI + Postman collection rỗng | 04 | ✅ khung `docs/openapi.yaml` |
| **Bàn giao** | `php artisan migrate:fresh --seed` chạy sạch; `GET /api/options/subjects` trả dữ liệu | | ✅ 17 test pass |

**Kết quả thực tế Tuần 1:**
- Schema: 16 bảng nghiệp vụ mới + 3 bảng hệ thống; bảng cũ `lop_hocs`/`sinh_viens`/`menus` đã xóa.
- 13 model mới với quan hệ, scope và hằng enum.
- Seeder sinh 555 users, 120 lớp học phần, 2.040 buổi, 7.028 đăng ký, 76.381 điểm danh, 2.999 điểm.
- 6 endpoint `/api/options/*` hoạt động, envelope + `ma_loi` thống nhất cho mọi lỗi.
- `docs/openapi.yaml` khung 3.1.0 với 6 endpoint options và 4 auth (auth là placeholder, làm ở Tuần 2).
- Test: `tests/Feature/NenTangTest.php` 16 case + ExampleTest.

**Việc dời sang Tuần 2:** Postman collection (chưa tạo), 4 endpoint `/api/auth/*` mới chỉ có trong hợp đồng.

---

## Tuần 2 — Xác thực, phân quyền, layout FE

| Việc | Chi tiết |
|---|---|
| Auth API | Login, logout, me, change-password, `must_change_password` middleware, rate limit |
| Policy khung | `LopHocPhanPolicy`, `SinhVienPolicy`, `DiemPolicy`, `DiemDanhPolicy` |
| FE core | Auth service, interceptor (gắn token, xử lý 401/403), guard (auth, role, must-change-password), **bộ chuyển chế độ xem vai trò cho ADMIN (SCR-52/53)** |
| FE layout | Layout chính, sidebar từ `/api/menus`, header, breadcrumb |
| FE shared | `data-table`, `pagination`, `search-input`, `confirm-dialog`, `status-badge`, `empty-state`, `form-field` |
| Test | TC-01, TC-02, ma trận phân quyền khung |
| **Bàn giao** | Đăng nhập bằng 3 vai trò trên Angular; sidebar khác nhau; bắt đổi mật khẩu lần đầu |

---

## Tuần 3 — Sinh viên, giảng viên, lớp hành chính

| Việc | Chi tiết |
|---|---|
| API | CRUD `students`, `teachers`, `admin-classes`; tạo kèm tài khoản; trả mật khẩu một lần |
| Nghiệp vụ | Unique xuyên `users`; chặn xóa theo mục 6.1; phạm vi xem của TEACHER |
| FE | SCR-10 → SCR-18 |
| Test | TC-03, TC-04 |
| Hạ tầng | Docker Compose staging (PHP + Nginx + MySQL + Angular build) |
| **Bàn giao** | ADMIN tạo sinh viên, sinh viên đăng nhập được và bị bắt đổi mật khẩu |

---

## Tuần 4 — Danh mục còn lại

| Việc | Chi tiết |
|---|---|
| API | CRUD `subjects`, `semesters`, `rooms`, `menus`, `settings`; endpoint `/options/*` |
| Nghiệp vụ | Chặn xóa học kỳ CLOSED; chặn xóa phòng còn buổi; menu theo vai trò |
| FE | SCR-19 → SCR-24, SCR-47 → SCR-51 |
| Test | TC-05 (phần danh mục), BR-15, BR-19 |
| **Bàn giao** | Đủ danh mục để mở lớp học phần |

---

## Tuần 5 — Lớp học phần

| Việc | Chi tiết |
|---|---|
| API | CRUD `sections`, đổi trạng thái, sinh viên của lớp, policy theo vai trò |
| Nghiệp vụ | FR-08.05; đổi giảng viên kiểm tra trùng lịch (khung); chặn đổi học kỳ/môn |
| FE | SCR-25 → SCR-28 |
| Test | TC-05, BR-03 |
| **Bàn giao** | ADMIN mở lớp, gán giảng viên; TEACHER thấy lớp mình; STUDENT thấy lớp OPEN |

---

## Tuần 6 — Buổi học & lịch

| Việc | Chi tiết |
|---|---|
| API | CRUD `sessions`, sinh lịch hàng tuần, `/schedules` |
| Nghiệp vụ | `ScheduleService`: trùng phòng, trùng giảng viên, trùng sinh viên (BR-06, BR-22) |
| FE | SCR-35 → SCR-37, lịch tuần/tháng |
| Test | TC-06, TC-15 |
| **Bàn giao** | Sinh lịch 1 lớp, phát hiện trùng phòng/GV/SV, xem lịch theo vai trò |

---

## Tuần 7 — Đăng ký học phần

| Việc | Chi tiết |
|---|---|
| API | `EnrollmentService` dùng chung; `/enrollments`, `/me/enrollments`; hủy |
| Nghiệp vụ | BR-08, BR-09 (khóa dòng), BR-10, BR-11, BR-20, BR-22 |
| FE | SCR-30 → SCR-33 |
| Test | TC-07, TC-08, TC-09, BR-09 tranh chấp chỗ cuối |
| **Bàn giao** | ADMIN đăng ký hộ và STUDENT tự đăng ký; tranh chấp chỗ cuối an toàn |

---

## Tuần 8 — Điểm danh

| Việc | Chi tiết |
|---|---|
| API | `/sessions/{id}/attendance`, thống kê chuyên cần |
| Nghiệp vụ | BR-21 (mốc thời gian), 7 ngày sửa, chuyển `DONE` |
| FE | SCR-38 → SCR-40 |
| Test | TC-10, công thức chuyên cần |
| **Bàn giao** | TEACHER điểm danh, STUDENT xem chuyên cần |

---

## Tuần 9 — Điểm, chốt điểm, dashboard

| Việc | Chi tiết |
|---|---|
| API | Nhập điểm đơn/hàng loạt, tính tổng kết, **quy đổi điểm chữ + hệ 4**, chốt, mở khóa, lịch sử |
| Nghiệp vụ | Công thức 25/25/50; bảng quy đổi A/B/C/D/F cấu hình trong `cau_hinh`; GPA hệ 10 và hệ 4; BR-13 |
| FE | SCR-41 → SCR-43 (có cột điểm chữ), SCR-03 → SCR-05, SCR-49 (sửa bảng quy đổi) |
| Test | TC-11, TC-12, TC-16, unit công thức + quy đổi |
| **Bàn giao** | Toàn bộ luồng end-to-end: mở lớp → sinh lịch → đăng ký → điểm danh → nhập điểm → chốt |

---

## Tuần 10 — Xóa mềm, hoàn thiện, demo

| Việc | Chi tiết |
|---|---|
| API | `/trash/*`, khôi phục, `nhat_ky` |
| FE | SCR-45 thùng rác, rà soát responsive, trạng thái rỗng/lỗi toàn bộ màn |
| Test | TC-13, TC-14, chạy toàn bộ ma trận phân quyền |
| Tài liệu | Cập nhật `openapi.yaml`, README, kịch bản demo |
| **Bàn giao** | Bản staging ổn định, dữ liệu demo, kịch bản demo 10 phút |

---

## Mốc kiểm soát

| Mốc | Điều kiện đạt |
|---|---|
| Cuối tuần 2 | Đăng nhập 3 vai trò + phân quyền server hoạt động |
| Cuối tuần 4 | Toàn bộ danh mục CRUD được |
| Cuối tuần 6 | Sinh lịch phát hiện đủ 3 loại trùng |
| Cuối tuần 7 | Đăng ký có kiểm tra sĩ số và trùng lịch |
| Cuối tuần 9 | Luồng end-to-end hoàn chỉnh |
| Cuối tuần 10 | Demo chạy không lỗi, tài liệu khớp code |

---

## Thứ tự cắt khi trễ

Cắt **từ dưới lên**, giữ nguyên luồng Must:

1. ⚪ FR-12.06 (công thức theo môn), FR-01.07 (quên mật khẩu).
2. 🔶 FR-14.03/14.04 (danh sách đã xóa, khôi phục) — giữ FR-14.01/14.02.
3. 🔶 Dashboard chi tiết → rút gọn còn 4 con số.
4. 🔶 FR-11.03 (giới hạn 7 ngày sửa điểm danh).
5. 🔶 FR-10.05 (sửa buổi học).
6. 🔶 FR-03 (lớp hành chính) — chuyển thành cột text nếu cần.
7. 🔶 FR-01.06 (hồ sơ cá nhân).
8. 🔶 FR-10.02 (sinh lịch hàng tuần) — nhập tay từng buổi.

**Không cắt:** FR-09 (đăng ký), FR-11.01/11.02 (điểm danh), FR-12.01–12.03/12.05 (điểm), FR-08 (lớp học phần), FR-14.01/14.02 (xóa mềm), FR-06 (học kỳ).

---

## Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| FE và BE lệch hợp đồng | `openapi.yaml` cập nhật trước khi code; sinh model TS từ đó |
| Đổi schema làm hỏng code cũ | DB local chỉ có seed; backup trước khi `migrate:fresh` |
| Tuần 7 quá tải (đăng ký là phần khó nhất) | Đã dồn toàn bộ tuần 7, không ghép việc khác |
| Trùng lịch phức tạp | Tách `ScheduleService` + unit test riêng từ tuần 6 |
| Tài liệu trôi khỏi code | Cập nhật `.md` trong cùng commit (ADR-012) |
| Cháy tiến độ tuần 9 | Dashboard là Should, cắt trước khi cắt phần điểm |

---

## Định nghĩa "xong" cho mỗi hạng mục

1. API có trong `openapi.yaml`.
2. Có test Feature cho luồng chính + luồng lỗi.
3. Màn hình FE tương ứng hoạt động với dữ liệu thật.
4. Tài liệu `.md` liên quan đã cập nhật.
5. `php artisan test` xanh, `ng build` 0 lỗi.
