# 08 — Kế hoạch triển khai 10 tuần

Thứ tự đã sửa theo ADR-010: **Lớp học phần → Buổi học → Đăng ký**. Mỗi tuần phải để lại sản phẩm chạy được, không dồn kiểm thử về cuối.

**Quy ước:** ✅ Must · 🔶 Should · ⚪ Could

---

## Tuần 1 — Nền tảng & chốt hợp đồng ✅ (hoàn thành 2026-10-21)

| Việc | Chi tiết | Nguồn | Trạng thái |
|---|---|---|---|
| Chốt tài liệu v0.3 | Rà lại 8 tài liệu, xác nhận không còn mâu thuẫn | `docs/00-index.md` | ✅ |
| Dọn backend | Bỏ Blade khỏi đường chạy chính, thêm `config/cors.php`, cấu hình Sanctum, xóa hẳn middleware `gio.hanh.chinh` | ADR-001, ADR-008 | ✅ |
| Envelope + exception | Chuẩn hóa `ApiResponse`, thêm `ma_loi`, xử lý 401/403/404/409/422/429 cho `api/*` | ADR-009 | ✅ |
| Migration mới | 15 bảng nghiệp vụ + bổ sung cột `users`, theo [03-data-model.md](03-data-model.md) | ADR-003 | ✅ |
| Factory + Seeder | Factory cho 13 model; seeder demo đầy đủ | 03 mục 7 | ✅ |
| `openapi.yaml` khung | Khung OpenAPI + Postman collection rỗng | 04 | ✅ khung `docs/openapi.yaml` |
| **Bàn giao** | `php artisan migrate:fresh --seed` chạy sạch; `GET /api/options/subjects` trả dữ liệu | | ✅ 17 test pass |

**Kết quả thực tế Tuần 1:**
- Schema: 16 bảng nghiệp vụ + 3 bảng hệ thống; bảng cũ `lop_hocs`/`sinh_viens`/`menus` đã xóa.
- 16 model, 16 factory, 12 seeder (số thật sau khi bổ sung v0.4 — bản ghi ban đầu là 13 model/13 factory).
- Seeder sinh 555 users, 120 lớp học phần, 2.040 buổi, 7.028 đăng ký, 76.381 điểm danh, 2.999 điểm.
- 6 endpoint `/api/options/*` hoạt động, envelope + `ma_loi` thống nhất cho mọi lỗi.
- `docs/openapi.yaml` khung 3.1.0 với 6 endpoint options và 4 auth (auth là placeholder, làm ở Tuần 2).
- Test: `tests/Feature/NenTangTest.php` 16 case + ExampleTest.

**Việc dời sang Tuần 2:** Postman collection (chưa tạo), 4 endpoint `/api/auth/*` mới chỉ có trong hợp đồng.

---

## Tuần 2 — Xác thực, phân quyền, layout FE

| Việc | Chi tiết | Trạng thái |
|---|---|---|
| Auth API | Login, logout, me, change-password, `must_change_password` middleware, rate limit | ✅ BE xong |
| Policy khung | `LopHocPhanPolicy`, `SinhVienPolicy`, `DiemPolicy`, `DiemDanhPolicy` | ✅ BE xong (chưa endpoint nào gọi — chờ CRUD Tuần 3) |
| FE core | Auth service, bearer interceptor (xử lý 401), guard (auth, role, must-change-password), ba cổng đăng nhập riêng | 🔶 Auth/guard/ba cổng đã triển khai; E2E với backend còn chờ; SCR-52/53 còn lại |
| FE layout | Layout chính, sidebar, header, footer | ✅ FE xong (menu khai cứng, chưa đọc `/api/menus`) |
| FE shared | `pagination`, `search-input`, `status-badge`, `empty-state`, `loading`, `page-header`, `app-button`, `app-card`, `app-alert` | ✅ 9/11 xong; còn `data-table`, `form-field` |
| Test | TC-01, TC-02, ma trận phân quyền khung | ✅ 46 test BE (12 test MySQL thật) |
| **Bàn giao** | Đăng nhập bằng 3 vai trò trên Angular; sidebar khác nhau; bắt đổi mật khẩu lần đầu | 🔶 UI/API + lọc menu/route đã có; chờ E2E với backend |

**Kết quả BE Tuần 2 (2026-10-23):**
- 4 endpoint auth: `POST /api/auth/login` (rate limit 5/phút), `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/change-password`.
- `NguoiDungResource` trả kèm hồ sơ `sinh_vien`/`giang_vien`, ADMIN có `ho_so = null`.
- Middleware `doi.mat.khau` chặn toàn bộ endpoint khác khi `must_change_password = true` (FR-01.05).
- 4 Policy khung + `Gate::before` cho ADMIN.
- Toàn bộ `/api/options/*` giờ yêu cầu đăng nhập.
- `config/sanctum.php`: `guard => []` (chỉ Bearer token, không fallback session), `expiration` 7 ngày.
- Postman collection ban đầu 19 request (21 sau bổ sung ảnh); hiện có 74 request.
- Test: `XacThucTest` 16 case, tổng 34 test pass (sau bổ sung MySQL: 46).

**Bổ sung BE (2026-10-24):**
- `POST /api/me/avatar` + `DELETE /api/me/avatar` (FR-01.10/01.11) qua `CloudinaryService`, cột `users.avatar_url` + `avatar_public_id` (ADR-019). Thiếu cấu hình → 503.
- Migration v0.4: `khoa_hoc`/`nganh`/`nam_nhap_hoc`, `hoc_ky.nam_hoc`/`ky_thu`, `lop_hoc_phan.nam_thu`.
- Postman thêm 2 request ảnh (21 request tại thời điểm đó; collection hiện có 74 request).

---

## Trạng thái thực tế tại 2026-10-26

Bảng dưới là ảnh chụp đối chiếu code với kế hoạch, dùng để biết tuần nào thực sự đã xong.

| Hạng mục | Kế hoạch | Thực tế | Ghi chú |
|---|---|---|---|
| Schema + model + factory + seeder | Tuần 1 | ✅ xong | 16 bảng nghiệp vụ, 16 model, 16 factory, 12 seeder |
| Envelope + mã lỗi + exception | Tuần 1 | ✅ xong | 9 mã lỗi đang dùng trong code |
| Auth (4 endpoint) | Tuần 2 | ✅ xong | Có throttle, middleware đổi mật khẩu |
| Ảnh đại diện (Cloudinary) | Tuần 2 | ✅ xong code | **Cần điền `CLOUDINARY_*` vào `.env` mới chạy thật** |
| Options (6 endpoint) | Tuần 1 | ✅ xong | |
| Phân quyền hồ sơ | Tuần 2–3 | 🔶 một phần | `SinhVienPolicy` được gọi ở endpoint sinh viên; `GiangVienController` kiểm tra quyền xem/sửa hồ sơ chính chủ; policy cho module khác chờ triển khai |
| Design system + layout FE | Tuần 2 | ✅ xong | 14 component `shared/ui`, `/style-guide`, dark mode |
| Mock layer | Tuần 2 | ✅ xong | `environment.useMock` bật/tắt interceptor; `false` gửi request tới backend thật |
| Auth phía client (AuthService, bearer interceptor, auth/role/password guard, ba giao diện login) | Tuần 2 (dời sang Tuần 8) | ✅ Đã triển khai; trình duyệt xác minh đăng nhập cả ba vai trò, `/auth/me` và menu tương ứng với backend thật ngày 26/10; test FE/BE pass | CORS cho phép `localhost:4200` và `127.0.0.1:4200`; dashboard gọi `GET /api/dashboard/admin` nhưng backend chưa có route; SCR-52/53 còn lại, PM phụ trách |
| CRUD nghiệp vụ + bulk | Tuần 3–9 | 🔶 triển khai một phần | Backend có 8 route mỗi nhóm `students`, `teachers`, `admin-classes`, `subjects`, `rooms`; CRUD `subjects`/`rooms` đã merge cùng 9 test. Thêm `menus` (5) + `settings` (2) ở nhánh `pm-menu-cau-hinh`. FE có SCR-10–15, SCR-47/48; E2E vẫn cần backend/DB sẵn sàng |
| Đăng ký công khai / quên mật khẩu | Chưa chốt | ⏸ hoãn | Đăng ký chờ PM chốt phạm vi; quên mật khẩu công khai chưa có API/SMTP. Tạm hướng dẫn liên hệ phòng đào tạo/Admin |
| Màn hình FE | Tuần 3–9 | 🔶 đang triển khai | SCR-10–15 (sinh viên, giảng viên) đã có danh sách/form/chi tiết; SCR-47/48 (menu) xong ngày 27/10. Các module nghiệp vụ khác còn trong kế hoạch. Đức Anh: SCR-10–24; Đạt: SCR-25–43, SCR-03–05, SCR-47–51; PM: auth, màn toàn cục, SCR-45 |
| `openapi.yaml` | Tuần 1 → dần | 🔶 41 path / 65 operation | Đã có 65/113 operation hợp đồng; còn 48 operation cần đặc tả |

**Tổng endpoint:** 59 route Laravel khớp hợp đồng / 113 endpoint được mô tả trong
[`04-api-contract.md`](04-api-contract.md) mục 18; còn 54 endpoint theo hợp đồng
chưa có route. Trong đó `PUT /api/me` vẫn chưa có route Laravel; ngoài ra còn
`GET /api/user`, route tiện ích chưa có trong hợp đồng. Số path OpenAPI (41) là
khác đơn vị với số operation (65 đã đặc tả, 48 còn lại).

**Kiểm thử và công cụ đã đối chiếu:** backend có 79 test (67 pass, 12 skipped);
9 test riêng cho CRUD môn học/phòng học đều pass. Pint và `git diff --check`
đều pass. Postman collection hiện có 74 request; folder menu/cấu hình có 7 request.

**Đợt sửa 2026-10-25 — chuẩn bị chia việc cho nhóm 4:**

| Việc | Kết quả |
|---|---|
| Đổi tên nhóm "danh mục" → "đào tạo" toàn bộ | `dao-tao.model.ts`, `dao-tao.mock.ts`, `features/dao-tao/`, `routes/dao-tao.*`, `registry/dao-tao.registry.ts`. Không còn chữ "danh mục" trong `docs/` lẫn code. |
| Dựng 2 component dùng chung còn thiếu | `shared/ui/data-table.ts` (sắp xếp, chọn nhiều dòng, 4 trạng thái), `shared/ui/form-field.ts` |
| Thêm component phụ trợ | `shared/ui/confirm-dialog.ts`, `date-input.ts`, `dang-xay-dung.ts`, `shared/pipes/ngay-vn.pipe.ts` |
| Màn SCR-10 danh sách sinh viên | `features/dao-tao/sinh-vien/danh-sach.ts` — khuôn mẫu cho ~40 màn còn lại, kèm ngăn kéo chi tiết SCR-12 |
| Màn SCR-11 thêm/sửa sinh viên | `features/dao-tao/sinh-vien/form.ts` — tạo/cập nhật qua `SinhVienService`, validation và dialog mật khẩu ban đầu; mock vẫn dùng được khi bật `environment.useMock` |
| Cụm SCR-13–15 giảng viên | Danh sách, chi tiết, thêm/sửa, sửa số điện thoại chính chủ và thao tác hàng loạt qua `GiangVienService`; xóa mềm có xác nhận và chặn theo lớp học phần thuộc học kỳ chưa đóng |
| Thao tác hàng loạt | API `PATCH /students/bulk-status`, `POST /students/bulk-delete`, `PATCH /teachers/bulk-status`, `POST /teachers/bulk-delete`; hiện kết quả từng dòng lỗi |
| Trang giữ chỗ cho màn chưa làm | `DangXayDung` + khai route cho cả 14 mục sidebar, để bấm vào không rơi về dashboard |
| Sửa lỗi Escape không đóng popup | `confirm-dialog`, ngăn kéo chi tiết dùng `@HostListener('document:keydown.escape')` + focus vào hộp thoại |
| Bỏ icon Unicode | `⚠`, `✕`, `▤`, `↕`, `↑↓`, `◍`, `⌕` → Material Icons |
| Tách mock theo nhóm | `hoc-vu.mock.ts` riêng, Đạt không còn sửa file của Đức Anh |
| Sửa lỗi ô "Số dòng" phân trang | `[value]` trên `<select>` không khớp option render bằng `@for` → chọn bằng `[selected]`; có test hồi quy |

**Test FE:** 88/88 pass (10 test files), bao gồm kiểm thử CRUD, xóa mềm đơn, thao tác hàng loạt và điều hướng chi tiết giảng viên.

**Đã đồng bộ FE với hợp đồng (2026-10-24, nhánh `develop`):**

| Điểm lệch cũ | Đã sửa thành |
|---|---|
| Mock dùng `/sinh-vien`, `/giang-vien`, `/lop-hanh-chinh`, `/mon-hoc`, `/hoc-ky`, `/lop-hoc-phan` | `/students`, `/teachers`, `/admin-classes`, `/subjects`, `/semesters`, `/sections` |
| Options dùng `/options/lop-hanh-chinh`, `/options/mon-hoc`, `/options/hoc-ky`, `/options/giang-vien` | `/options/admin-classes`, `/options/subjects`, `/options/semesters`, `/options/teachers` |
| Options trả trường `nhan` | `label` (khớp `OptionController` và hợp đồng §17) |
| Tìm kiếm dùng `keyword`, sắp xếp dùng `sort`/`order` | `q`, `sort_by`/`sort_dir` (hợp đồng §1.6) |
| `per_page` nhận mọi số | chỉ nhận 10/25/50/100, giá trị khác rơi về 10 |
| Lọc so sánh chuỗi nên `?trang_thai=false` không khớp boolean | so sánh đúng kiểu boolean/số |
| `sinh_vien` trả `lop_hanh_chinh_id` + `lop_hanh_chinh_ten` phẳng | object lồng `lop_hanh_chinh: {id, ma_lop, ten_lop}` |
| Thiếu `da_xoa`, `chot_diem_luc` | đã thêm vào model và mock |
| Dashboard dùng `nhan`, `thoi_gian` là chuỗi tương đối ("5 phút trước") | `label`, datetime `YYYY-MM-DD HH:mm:ss` |

Có 10 test trong `core/mock/registry-probe.spec.ts` khoá các quy ước trên —
lệch lại sẽ fail ngay chứ không đợi đến ngày tắt mock.

**Tách file để hai bạn FE làm song song:** xem `01-requirements.md` §8.3.
Route và menu tách theo nhóm (`routes/dao-tao.*`, `routes/hoc-vu.*`), mock
registry tách theo nhóm (`core/mock/registry/*`).

---

## Tuần 3 — Sinh viên, giảng viên, lớp hành chính

| Việc | Chi tiết |
|---|---|
| API | CRUD `students`, `teachers`, `admin-classes`; tạo kèm tài khoản; trả mật khẩu một lần; **bulk-status + bulk-delete** |
| Nghiệp vụ | Unique xuyên `users`; chặn xóa theo mục 6.1; phạm vi xem của TEACHER; **khóa tài khoản phải thu hồi token (BR-30)**; **thao tác hàng loạt xử lý từng dòng (BR-31)** |
| FE | Đức Anh: SCR-10 → SCR-18 |
| Test | TC-03, TC-04, TC-27, TC-28, TC-29, TC-30 |
| Hạ tầng | Docker Compose staging (PHP + Nginx + MySQL + Angular build) |
| **Bàn giao** | ADMIN tạo sinh viên, sinh viên đăng nhập được và bị bắt đổi mật khẩu |

---

## Tuần 4 — Đào tạo còn lại

| Việc | Chi tiết |
|---|---|
| API | CRUD `subjects`, `semesters`, `rooms`, `menus`, `settings`; endpoint `/options/*` |
| Nghiệp vụ | Chặn xóa học kỳ không phải UPCOMING (BR-24); vòng đời trạng thái chỉ tiến; chặn chồng lấn kỳ (BR-25); chặn xóa phòng còn buổi; menu theo vai trò |
| FE | Đức Anh: SCR-19 → SCR-24; Đạt: SCR-47 → SCR-51 |
| Test | TC-05 (phần đào tạo), TC-18, TC-19, BR-15, BR-19 |
| **Bàn giao** | Đủ dữ liệu đào tạo để mở lớp học phần |

**Cập nhật sau khi hoàn tất CRUD môn học/phòng học:** API `menus` (5 endpoint)
và `settings` (2 endpoint) đã được triển khai trong nhánh `pm-menu-cau-hinh`;
7/7 feature test riêng pass. Postman có thêm 7 request cho hai nhóm endpoint
này. Chưa ghi nhận là đã merge.

**Cập nhật 2026-10-27 (nhánh `pm-menu-cau-hinh`):** FE xong SCR-47 (quản lý menu:
danh sách, thêm tại chỗ, ẩn/hiện, xoá có xác nhận) và SCR-48 (trang sửa menu);
`settings` mới xong phần backend, SCR-49 còn là trang giữ chỗ. Hai quyết định
chốt trong đợt này:

- **Đường dẫn không khớp route tách làm hai kết cục.** URL có trong bảng `menus`
  → màn "chưa làm" trong layout; URL không ai khai → 404 đứng riêng ngoài layout.
  Cả hai đều KHÔNG quay về dashboard như trước.
- **Admin được khai menu trước cho màn chưa code.** Form menu cảnh báo nhưng vẫn
  cho lưu đường dẫn nội bộ hợp lệ chưa có route; chặn nếu không phải đường dẫn
  nội bộ hay địa chỉ http(s).

---

## Tuần 5 — Lớp học phần

| Việc | Chi tiết |
|---|---|
| API | CRUD `sections`, đổi trạng thái, sinh viên của lớp, policy theo vai trò |
| Nghiệp vụ | FR-08.05; đổi giảng viên kiểm tra trùng lịch (khung); chặn đổi học kỳ/môn khi đã có đăng ký; chặn hủy lớp đã chốt điểm (BR-29) |
| FE | Đạt: SCR-25 → SCR-28 |
| Test | TC-05, TC-24, BR-03 |
| **Bàn giao** | ADMIN mở lớp, gán giảng viên; TEACHER thấy lớp mình; STUDENT thấy lớp OPEN |

---

## Tuần 6 — Buổi học & lịch

| Việc | Chi tiết |
|---|---|
| API | CRUD `sessions`, sinh lịch hàng tuần, `/schedules` |
| Nghiệp vụ | `ScheduleService`: trùng phòng, trùng giảng viên, trùng sinh viên (BR-06, BR-22); buổi học phải trong khoảng ngày của kỳ (BR-25) |
| FE | Đạt: SCR-35 → SCR-37; PM: SCR-45 (thùng rác) |
| Test | TC-06, TC-15, TC-19 |
| **Bàn giao** | Sinh lịch 1 lớp, phát hiện trùng phòng/GV/SV, xem lịch theo vai trò |

---

## Tuần 7 — Đăng ký học phần

| Việc | Chi tiết |
|---|---|
| API | `EnrollmentService` dùng chung; `/enrollments`, `/enrollments/bulk`, `/me/enrollments`; hủy |
| Nghiệp vụ | BR-08, BR-09 (khóa dòng), BR-10, BR-11, BR-20, BR-22, **BR-23 (năm thứ)**, BR-26 (đợt theo kỳ của lớp), BR-27 (đăng ký lại) |
| FE | Đạt: SCR-30 → SCR-33 |
| Test | TC-07, TC-08, TC-09, TC-17, TC-20, TC-21, TC-25, BR-09 tranh chấp chỗ cuối |
| **Bàn giao** | ADMIN đăng ký hộ và STUDENT tự đăng ký; tranh chấp chỗ cuối an toàn |

---

## Tuần 8 — Điểm danh

| Việc | Chi tiết |
|---|---|
| API | `/sessions/{id}/attendance`, thống kê chuyên cần |
| Nghiệp vụ | BR-21 (mốc thời gian), BR-27 (chuyên cần tính từ `dang_ky_luc`), 7 ngày sửa, chuyển `DONE`, ADMIN sửa được trên kỳ CLOSED (BR-14 ngoại lệ) |
| FE | Đạt: SCR-38 → SCR-40 |
| Test | TC-10, công thức chuyên cần |
| **Bàn giao** | TEACHER điểm danh, STUDENT xem chuyên cần |

---

## Tuần 9 — Điểm, chốt điểm, dashboard

| Việc | Chi tiết |
|---|---|
| API | Nhập điểm đơn/hàng loạt, tính tổng kết, **quy đổi điểm chữ + hệ 4**, chốt, mở khóa, lịch sử |
| Nghiệp vụ | Công thức 25/25/50; bảng quy đổi A/B/C/D/F cấu hình trong `cau_hinh`; GPA hệ 10 và hệ 4, **học lại lấy điểm cao nhất** (BR-28), **CPA** (FR-12.08); BR-13 |
| FE | Đạt: SCR-29, SCR-41 → SCR-43, SCR-03 → SCR-05; hoàn thiện bảng quy đổi tại SCR-49 |
| Test | TC-11, TC-12, TC-16, TC-22, unit công thức + quy đổi |
| **Bàn giao** | Toàn bộ luồng end-to-end: mở lớp → sinh lịch → đăng ký → điểm danh → nhập điểm → chốt |

---

## Tuần 10 — Xóa mềm, hoàn thiện, demo

| Việc | Chi tiết |
|---|---|
| API | `/trash/*`, khôi phục, `nhat_ky` |
| FE | PM: SCR-45 thùng rác; Đức Anh/Đạt: rà soát responsive, trạng thái rỗng/lỗi theo phần phụ trách |
| Test | TC-13, TC-14, chạy toàn bộ ma trận phân quyền |
| Tài liệu | Cập nhật `openapi.yaml`, README, kịch bản demo |
| **Bàn giao** | Bản staging ổn định, dữ liệu demo, kịch bản demo 10 phút |

---

## Mốc kiểm soát

| Mốc | Điều kiện đạt |
|---|---|
| Cuối tuần 2 | Đăng nhập 3 vai trò + phân quyền server hoạt động |
| Cuối tuần 4 | Toàn bộ nhóm đào tạo CRUD được |
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
