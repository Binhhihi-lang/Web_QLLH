# Kế hoạch phân công công việc

**Hệ thống quản lý lớp học (QLLH)** · Nhóm 4 người · 8 tuần còn lại · hai nhánh phát triển song song

| Phiên bản | Ngày       | Trạng thái              | Căn cứ                                                 |
| --------- | ---------- | ----------------------- | ------------------------------------------------------ |
| 1.2       | 26/10/2026 | Đề xuất — chờ nhóm chốt | `docs/08-roadmap.md` + trạng thái code nhánh `develop` |

---

## Mục lục

1. [Tóm tắt trong một trang](#1-tóm-tắt-trong-một-trang)
2. [Kiến trúc hiện tại đã đủ để làm việc độc lập chưa](#2-kiến-trúc-hiện-tại-đã-đủ-để-làm-việc-độc-lập-chưa)
3. [Việc PM phải làm trước khi tách nhánh](#3-việc-pm-phải-làm-trước-khi-tách-nhánh)
4. [Ranh giới sở hữu file](#4-ranh-giới-sở-hữu-file)
5. [Phân công theo tuần](#5-phân-công-theo-tuần)
6. [Phụ lục: màn hình thuộc về ai](#6-phụ-lục-màn-hình-thuộc-về-ai)
7. [Quy trình Git và merge](#7-quy-trình-git-và-merge)
8. [Nhịp điều phối](#8-nhịp-điều-phối)
9. [Rủi ro và cách xử lý](#9-rủi-ro-và-cách-xử-lý)
10. [Định nghĩa xong và checklist bàn giao](#10-định-nghĩa-xong-và-checklist-bàn-giao)

---

## 1. Tóm tắt trong một trang

Câu hỏi đặt ra: kiến trúc hiện tại có đủ để hai bên làm việc độc lập, không phải chờ nhau không. **Câu trả lời ngắn: đủ, sau khi đã sửa bốn điểm lệch trong phiên 25/10.** Mô hình đã đúng hướng từ đầu — frontend chạy được mà không cần backend — nhưng có bốn chỗ cụ thể sẽ khiến hai bên giẫm chân nhau ngay tuần đầu. Bốn chỗ đó nay đã xử lý xong.

### Ba kết luận chính

1. **Việc tách là khả thi.** Frontend và backend tách được thật, nhờ mock layer ở tầng HTTP interceptor và bộ hợp đồng API viết trước. Đức Anh và Đạt không cần chờ Tiến một ngày nào.
2. **Điều kiện đã đạt.** Bốn điểm lệch đã sửa: đường dẫn API, tên trường `label`, tách ba file dùng chung, và 18 case test khoá quy ước để không lệch lại.
3. **Khối lượng backend vẫn là rủi ro.** Đã có 52/113 endpoint theo hợp đồng; còn 61 endpoint cần triển khai. Cách xử lý ở [mục 9](#9-rủi-ro-và-cách-xử-lý).

### Con số cần nhớ

| Hạng mục     | Đã xong                                                              | Còn lại | Ai làm        |
| ------------ | -------------------------------------------------------------------- | ------- | ------------- |
| Endpoint API | 52 endpoint theo hợp đồng + 1 route tiện ích                         | 61      | Tiến + PM     |
| Hợp đồng     | 41 path / 65 operation trong `openapi.yaml`                          | 48 operation | PM       |
| Màn hình     | 9 (đăng nhập, dashboard ADMIN, style-guide, SCR-10–15)                | 38      | Đức Anh + Đạt |
| Thời gian    | 2 tuần / 10 tuần                                                     | 8 tuần  | —             |

**Cập nhật tiến độ:** Backend đã có các API quản lý `students`, `teachers`,
`admin-classes`, `subjects` và `rooms`; CRUD môn học/phòng học có test riêng
9/9 pass. Các thay đổi CRUD môn học/phòng học hiện còn trong working tree,
chưa commit hoặc merge. Frontend sinh viên/giảng viên đã gọi các API tương ứng
qua service. AuthService/interceptor đã được triển khai trong commit `cf8d36c`.
Smoke test trình duyệt ngày 26/10 đã đăng nhập cả ba vai trò, tải hồ sơ
`/auth/me` và xác nhận menu theo vai trò từ backend thật. CORS ban đầu chỉ cho
phép `localhost:4200`, trong khi frontend chạy ở `127.0.0.1:4200`; cấu hình đã
bổ sung cả hai origin. E2E đầy đủ cho thao tác ghi CRUD vẫn cần làm; dashboard
đang gọi `GET /api/dashboard/admin` nhưng backend chưa có route này.
Chi tiết trạng thái từng màn ở [mục 6](#6-phụ-lục-màn-hình-thuộc-về-ai)
và [docs/08-roadmap.md](08-roadmap.md).

### Cách chia việc trong một câu

> **Đức Anh** nhận toàn bộ màn **đào tạo** (bảng, form, CRUD lặp lại — làm một lần rồi nhân bản), **Đạt** nhận toàn bộ màn **học vụ** (tương tác phức tạp: đăng ký, lịch, điểm danh, điểm), **Tiến** nhận phần lõi API nghiệp vụ, **PM** giữ hợp đồng API, hạ tầng, merge và phần API khuôn mẫu.

| Vai trò        | Thành viên | Phụ trách chính                                       | Nhánh làm việc             |
| -------------- | ---------- | ----------------------------------------------------- | -------------------------- |
| PM / điều phối | Bạn        | Hợp đồng API, tài liệu, merge, hạ tầng, API khuôn mẫu, **Auth + phân quyền FE** | `develop` + `feature/pm-*` |
| Frontend 1     | Đức Anh    | Toàn bộ màn đào tạo + CRUD                            | `feature/fe-dao-tao`       |
| Frontend 2     | Đạt        | Toàn bộ màn học vụ + dashboard + quản trị             | `feature/fe-hoc-vu`        |
| Backend        | Tiến       | Phần lõi API nghiệp vụ                                | `feature/be-*`             |

### Phạm vi Auth và phân quyền do PM phụ trách

- **Đã triển khai theo API hiện có:** đăng nhập, lưu token theo lựa chọn ghi nhớ,
  tải hồ sơ `/auth/me`, bearer interceptor, xử lý phiên hết hạn (401), đăng xuất,
  đổi mật khẩu bắt buộc và guard theo vai trò/chính chủ. Ba cổng đăng nhập riêng
  theo vai trò; sinh viên dùng mã sinh viên, ADMIN/giảng viên dùng email.
- **Phần UI:** lọc menu và chặn truy cập trực tiếp vào route theo vai trò trong
  `docs/05-screens.md`. Đây là lớp bảo vệ trải nghiệm; backend Policy vẫn là nơi
  bắt buộc kiểm tra quyền và quyền sở hữu dữ liệu.
- **Chưa triển khai:** đăng ký tài khoản công khai (để bàn riêng) và quên mật khẩu
  công khai (chưa có API/SMTP đã xác nhận). Người dùng quên mật khẩu hiện liên hệ
  phòng đào tạo/Admin để được hỗ trợ; không tạo route giả hoặc giả lập luồng gửi mail.
- **Đã smoke test:** đăng nhập cả ba vai trò, tải hồ sơ `/auth/me` và xác nhận menu
  theo vai trò qua backend thật trên trình duyệt.
- **Còn cần tích hợp:** E2E các thao tác ghi CRUD và dashboard; endpoint
  `GET /api/dashboard/admin` chưa có route backend nên màn thống kê hiện báo lỗi.

---

## 2. Kiến trúc hiện tại đã đủ để làm việc độc lập chưa

Đã đọc lại toàn bộ code trên nhánh `develop`, không dựa vào tài liệu. Kết quả: **năm thứ đã sẵn sàng, bốn thứ từng thiếu — nay đã sửa.**

### Năm thứ đã sẵn sàng

| Cơ chế                                  | Nằm ở đâu                                                                            | Vì sao nó cho phép tách việc                                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Hợp đồng API viết trước                 | `docs/04-api-contract.md` (113 endpoint) + `docs/openapi.yaml`                       | Cả hai bên cùng đọc một nguồn. FE biết chính xác URL, tham số, hình dạng JSON trước khi BE viết dòng nào.                   |
| Mock layer ở tầng interceptor           | `frontend/src/app/core/mock/mock.interceptor.ts`                                     | Chặn request ở tầng HTTP, không phải ở service. Service viết y như khi gọi thật — BE xong chỉ cần tắt mock, không sửa code. |
| Công tắc một dòng                       | `frontend/src/environments/environment.ts` → `useMock`                               | Bật/tắt mock cho từng giai đoạn mà không đụng component nào.                                                                |
| Envelope và mã lỗi thống nhất           | `backend/app/Traits/apiResponse.php` + `frontend/src/app/core/mock/mock-response.ts` | Mọi endpoint trả cùng một hình dạng. FE viết một lần hàm xử lý lỗi là dùng cho toàn bộ 47 màn.                              |
| Tên trường tiếng Việt không dấu cố định | `docs/03-data-model.md` + `frontend/src/app/core/models/dao-tao.model.ts`            | Không phải đoán snake_case hay camelCase, không phải dịch tên. Model FE đã khớp schema.                                     |

### Bốn điểm lệch — đã sửa ngày 25/10

| #   | Điểm lệch cũ                              | Bằng chứng                                                              | Hậu quả nếu để nguyên                                              | Trạng thái                    |
| --- | ----------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------- |
| 1   | Đường dẫn API trong mock dùng tiếng Việt  | Mock: `/sinh-vien`, `/mon-hoc`… / Hợp đồng: `/students`, `/subjects`…   | Tắt mock là **toàn bộ** màn danh sách nhận 404, không chỉ dropdown | ✅ Đã sửa                     |
| 2   | Tên trường options lệch                   | BE trả `label` (`OptionController.php`), mock và model FE đọc `nhan`    | Dropdown hiện trống dù API trả 200. Không exception nào được ném   | ✅ Đã sửa                     |
| 3   | Ba file dùng chung cả hai FE đều phải sửa | `app.routes.ts`, `core/layout/sidebar.ts`, `core/mock/mock-registry.ts` | Hai bạn sửa cùng file mỗi ngày → conflict liên tục                 | ✅ Đã tách                    |
| 4   | `openapi.yaml` chưa bao phủ đủ hợp đồng   | 41 path, 65 operation trong tổng 113 endpoint hợp đồng                 | Còn 48 operation cần đặc tả | 🔶 Còn — PM sinh dần theo tuần |

### Chín điểm lệch FE đã sửa trong phiên 25/10

| Điểm lệch                                                                                        | Đã sửa thành                                                                             |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Mock dùng `/sinh-vien`, `/giang-vien`, `/lop-hanh-chinh`, `/mon-hoc`, `/hoc-ky`, `/lop-hoc-phan` | `/students`, `/teachers`, `/admin-classes`, `/subjects`, `/semesters`, `/sections`       |
| Options dùng `/options/lop-hanh-chinh`, `/options/mon-hoc`…                                      | `/options/admin-classes`, `/options/subjects`, `/options/semesters`, `/options/teachers` |
| Options trả `nhan`                                                                               | `label`                                                                                  |
| Tìm kiếm `keyword`; sắp xếp `sort`/`order`                                                       | `q`; `sort_by`/`sort_dir`                                                                |
| `per_page` nhận mọi số                                                                           | chỉ 10/25/50/100, giá trị khác rơi về 10                                                 |
| Lọc so sánh chuỗi nên `?trang_thai=false` không khớp boolean                                     | so sánh đúng kiểu boolean/số                                                             |
| `sinh_vien` trả `lop_hanh_chinh_id` + `lop_hanh_chinh_ten` phẳng                                 | object lồng `lop_hanh_chinh: {id, ma_lop, ten_lop}`                                      |
| Thiếu `da_xoa`, `chot_diem_luc`                                                                  | đã thêm vào model và mock                                                                |
| Dashboard dùng `nhan`, `thoi_gian` là chuỗi tương đối                                            | `label`, datetime `YYYY-MM-DD HH:mm:ss`                                                  |

**Test khoá quy ước:** `frontend/src/app/core/mock/registry-probe.spec.ts` — 18 case, gồm 2 case khẳng định đường dẫn tiếng Việt cũ trả `undefined` và 5 case cho thao tác hàng loạt (BR-31). Kết quả Vitest đã ghi nhận: **88/88 pass**.

> **Kết luận:** về cơ chế lẫn dữ liệu, kiến trúc đã đủ để hai bên làm việc độc lập. Việc còn lại là PM sinh dần `openapi.yaml` cho từng lô endpoint.

---

## 3. Việc PM phải làm trước khi tách nhánh

Năm việc, tổng khoảng 2 ngày làm việc (việc 1–4 đã xong ngày 25/10).

### Việc 1 — Sinh `openapi.yaml` cho lô endpoint sắp làm 🔶 một phần

Không cần viết hết 113 endpoint một lúc. Quy tắc: **trước khi bước vào tuần N, `openapi.yaml` phải có đủ endpoint của tuần N.**

- ✅ Đã đặc tả 41 path / 65 operation trong 113 endpoint hợp đồng; các operation còn lại tiếp tục được bổ sung theo lô tuần.
- Mỗi thứ Sáu: sinh cho tuần kế tiếp, khoảng 2 giờ mỗi lần.
- Sinh xong chạy kiểm tra cú pháp YAML và duyệt `$ref` nội bộ. Hợp đồng sai cú pháp còn tệ hơn không có hợp đồng.

### Việc 2 — Chốt tên endpoint options ✅ xong

Chốt theo backend, vì đó là tên đã ghi trong `docs/04-api-contract.md` và đã có trong code chạy thật. Sửa mock cho khớp, không sửa backend.

| Chốt dùng (backend)              | Bỏ (mock cũ)                      |
| -------------------------------- | --------------------------------- |
| `GET /api/options/admin-classes` | ~~`GET /options/lop-hanh-chinh`~~ |
| `GET /api/options/subjects`      | ~~`GET /options/mon-hoc`~~        |
| `GET /api/options/semesters`     | ~~`GET /options/hoc-ky`~~         |
| `GET /api/options/teachers`      | ~~`GET /options/giang-vien`~~     |

### Việc 3 — Chốt tên trường trong options ✅ xong

Chốt dùng **`label`** vì đó là tên trong `docs/04-api-contract.md` mục options và trong `OptionController.php`. Đã sửa mock và model FE từ `nhan` sang `label`. Nếu sau này thấy `label` khó đọc trong tiếng Việt thì đổi cả hai bên cùng lúc — nhưng phải chốt một lần, không đổi giữa chừng.

### Việc 4 — Tách ba file dùng chung ✅ xong

Đây là việc quyết định xem hai bạn FE có làm song song được hay không. Nguyên tắc: **mỗi người một file, không ai sửa file của người kia.**

| File cũ                                   | Tách thành                                                                                                              | Ai sở hữu                            |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `app.routes.ts`                           | `routes/dao-tao.routes.ts` / `routes/hoc-vu.routes.ts` / `app.routes.ts` (chỉ gộp hai file con)                         | Đức Anh / Đạt / PM                   |
| `core/mock/mock-registry.ts`              | `core/mock/registry/dao-tao.registry.ts` / `core/mock/registry/hoc-vu.registry.ts` / `mock-registry.ts` (chỉ điều phối) | Đức Anh / Đạt / PM                   |
| `core/layout/sidebar.ts` (menu khai cứng) | Giữ một file, nhưng khai báo menu chuyển sang `routes/dao-tao.menu.ts` + `routes/hoc-vu.menu.ts`                        | PM sửa một lần, sau đó không ai đụng |

> Sau khi tách, hai bạn FE không bao giờ mở cùng một file. Đây là lý do duy nhất khiến việc chia hai người FE khả thi.

### Việc 5 — Dựng khung bảng và form dùng chung ✅ xong

Hai bạn FE sẽ viết khoảng 44 màn còn lại, trong đó gần 40 màn là dạng bảng + form + phân trang + bộ lọc. Nếu mỗi người tự viết một bản thì sẽ có hai bản khác nhau, và PM phải chọn một bản để chuẩn hóa sau.

- ✅ `shared/ui/data-table.ts` — sắp xếp, chọn nhiều dòng, ô tuỳ chỉnh bằng `ng-template appOTuyChinh`, bốn trạng thái (đang tải / có dữ liệu / rỗng / lỗi).
- ✅ `shared/ui/form-field.ts` — nhãn, ô nhập, thông báo lỗi, trạng thái bắt buộc, chỉ báo lỗi sau khi chạm ô.
- ✅ Kèm theo: `confirm-dialog.ts` (có `lyDoChan` cho lý do backend chặn xoá), `date-input.ts` (gõ `dd/mm/yyyy`, không phụ thuộc locale hệ điều hành), `ngay-vn.pipe.ts`, `dang-xay-dung.ts`.
- ✅ Màn mẫu đầy đủ: `features/dao-tao/sinh-vien/danh-sach.ts` — chép file này rồi đổi cột và bộ lọc là ra màn danh sách mới.

Dựng xong thì cả hai dùng, không ai sửa. Cần thêm tính năng thì báo PM.

14 component trong `shared/ui/` là đủ cho toàn bộ 47 màn.

---

## 4. Ranh giới sở hữu file

Quy tắc duy nhất: **mỗi thư mục có đúng một người được sửa.** Cần sửa ngoài vùng của mình thì báo PM.

| Đường dẫn                                                    | Người sở hữu | Người khác được làm gì           |
| ------------------------------------------------------------ | ------------ | -------------------------------- |
| `backend/app/**`, `backend/database/**`, `backend/routes/**` | Tiến         | Đọc thì được, sửa thì không      |
| `backend/tests/**`                                           | Tiến         | PM đọc khi review                |
| `docs/**`, `docs/openapi.yaml`                               | PM           | Đọc. Cần sửa hợp đồng → báo PM   |
| `frontend/src/app/features/dao-tao/**`                       | Đức Anh      | Đọc                              |
| `frontend/src/app/features/hoc-vu/**`                        | Đạt          | Đọc                              |
| `frontend/src/app/features/dashboard/**`                     | Đạt          | SCR-03–05; PM tích hợp route chung |
| SCR-47–51 quản trị (feature code; thư mục chưa tạo)            | Đạt          | PM tích hợp route/menu dùng chung |
| SCR-45 thùng rác (feature code; thư mục chưa tạo)              | PM           | Đạt đọc |
| `frontend/src/app/features/auth/**`                          | PM           | Đọc                              |
| `frontend/src/app/shared/**`                                 | PM           | Đọc. Cần thêm component → báo PM |
| `frontend/src/app/core/**` (layout, models, services, mock)  | PM           | Đọc                              |
| `frontend/src/app/routes/dao-tao.*`                          | Đức Anh      | Đọc                              |
| `frontend/src/app/routes/hoc-vu.*`                           | Đạt          | Đọc                              |
| `frontend/src/app/core/mock/registry/dao-tao.registry.ts`    | Đức Anh      | Đọc                              |
| `frontend/src/app/core/mock/registry/hoc-vu.registry.ts`     | Đạt          | Đọc                              |
| `frontend/src/app/core/mock/data/dao-tao.mock.ts`            | Đức Anh      | Đọc                              |
| `frontend/src/app/app.routes.ts`, `core/layout/sidebar.ts`   | PM           | Đọc                              |
| `docker-compose*.yml`, `.env.example`                        | PM           | Đọc                              |

### Ba tình huống hay xảy ra và cách xử lý

| Tình huống                                                                | Xử lý                                                                                                                                                                                   |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Đạt cần thêm trường vào model dùng chung (`core/models/dao-tao.model.ts`) | Báo PM. PM thêm và báo lại Đức Anh nếu trường đó ảnh hưởng màn đào tạo. Không tự sửa.                                                                                                   |
| Đức Anh phát hiện hợp đồng API thiếu tham số lọc                          | Báo PM. PM sửa `docs/04` + `openapi.yaml` trước, rồi báo Tiến. Không tự thêm tham số vào mock rồi coi là chuẩn.                                                                         |
| Tiến thấy cần đổi schema (thêm cột, đổi tên)                              | Báo PM. PM cập nhật `docs/03-data-model.md` + model FE + mock trong cùng một PR, rồi mới cho Tiến chạy migration. Đổi schema mà không báo trước là nguyên nhân hỏng code FE nhiều nhất. |

---

## 5. Phân công theo tuần

Cột "Bàn giao" là điều kiện để tuần đó được coi là xong — dùng làm mốc kiểm tra vào thứ Sáu.

| Tuần           | Tiến — Backend lõi                                                                                                                             | Đức Anh — FE đào tạo                                                                                    | Đạt — FE học vụ                                                                                        | PM                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| **0** (2 ngày) | — (chờ hợp đồng)                                                                                                                               | Đọc `docs/04` + `05`, đọc code mẫu dashboard                                                            | Đọc `docs/04` + `05`, đọc code mẫu dashboard                                                           | ✅ Khung dùng chung đã dựng; test registry 18 case. |
| **3**          | CRUD `students` + `teachers` + `admin-classes`; tạo kèm tài khoản, trả mật khẩu một lần; bulk-status + bulk-delete; BR-30 thu hồi token, BR-31 | SCR-10 → 18 (sinh viên, giảng viên, lớp hành chính)                                                       | —                                                                                                      | CRUD `subjects` + `rooms` (đã có code và test; chưa commit/merge); review PR |
| **4**          | CRUD `semesters` (vòng đời trạng thái, BR-24/25) + hoàn thiện `/options/*`                                                                     | SCR-19 → 24 (môn học, học kỳ, phòng học)                                                                 | SCR-47 → 51 (quản trị: menu, cấu hình, người dùng)                                                     | CRUD `menus` + `settings`; Docker Compose staging; E2E `/options/*` |
| **5**          | CRUD `sections` lõi + đổi trạng thái + FR-08.05 kiểm tra hợp lệ + Policy theo vai trò                                                          | —                                                                                                        | SCR-25 → 28 (lớp học phần): danh sách, form, chi tiết, sinh viên của lớp                                | Sinh OpenAPI lô 6–7; `/sections/{id}/students` + attendance-summary; bắt đầu bộ test E2E |
| **6**          | `ScheduleService`: trùng phòng / giảng viên / sinh viên (BR-06, BR-22) + `/schedules` — phần khó nhất tuần                                     | —                                                                                                        | SCR-35 → 37 (lịch tuần/tháng, thêm buổi, sinh lịch)                                                    | CRUD `sessions` + sinh lịch hàng tuần; SCR-45 (thùng rác); seeder dữ liệu demo; rà test plan |
| **7**          | `EnrollmentService` lõi: sĩ số, trùng lịch, năm thứ, đợt đăng ký, khóa dòng tranh chấp chỗ cuối (BR-08/09/23/26)                               | —                                                                                                        | SCR-30 → 33 (đăng ký)                                                                                   | `/enrollments` (CRUD) + `/enrollments/bulk` + `/me/enrollments` + hủy; test tranh chấp chỗ cuối                   |
| **8**          | Nhập điểm đơn + hàng loạt; tổng kết 25/25/50; quy đổi A/B/C/D/F; chốt/mở khóa; GPA + CPA                                                       | SCR-02 (đổi mật khẩu), SCR-02B (ảnh đại diện); nối `AuthService` thật + guard + chế độ xem theo vai trò | SCR-38 → 40 (điểm danh); rà responsive toàn bộ màn học vụ                                                | Điểm danh nâng cao: BR-21 mốc thời gian, 7 ngày sửa, chuyển DONE, ngoại lệ ADMIN trên kỳ CLOSED; E2E luồng đầy đủ |
| **9**          | Lịch sử sửa điểm + hoàn thiện phần điểm; sửa lỗi khi tắt mock                                                                                  | —                                                                                                        | SCR-29, SCR-41 → 43 (bảng điểm, nhập điểm, điểm của tôi, lịch sử); SCR-03 → 05 (dashboard); hoàn thiện bảng quy đổi tại SCR-49 | `/trash/*`, khôi phục, `nhat_ky`; tắt mock toàn bộ; chạy ma trận phân quyền |
| **10**         | Hỗ trợ sửa lỗi tích hợp; rà test plan                                                                                                          | Rà responsive, trạng thái UI toàn bộ màn đào tạo                                                        | Kịch bản demo + dữ liệu demo; rà responsive                                                            | README, kịch bản demo 10 phút, merge cuối, đóng gói staging                                                       |

---

## 6. Phụ lục: màn hình thuộc về ai

Danh sách đầy đủ SCR-01 → SCR-53 theo `docs/05-screens.md`. Quy tắc sở hữu: Đức Anh phụ trách toàn bộ SCR đào tạo 10–24; Đạt phụ trách toàn bộ SCR học vụ 25–43 và dashboard/quản trị 03–05, 47–51; PM phụ trách xác thực, màn toàn cục và thùng rác. Cột trạng thái phản ánh tiến độ đã đối chiếu với code.

> Ghi chú: SCR-06 → 09, 34, 44, 46 không tồn tại trong `docs/05-screens.md` — số được cấp theo nhóm và có khoảng trống, không phải thiếu màn hình. Tổng cộng **47 màn** (gồm SCR-02B).

| SCR | Màn hình                                | Đường dẫn                          | Phụ trách        | Trạng thái                 |
| --- | --------------------------------------- | ---------------------------------- | ---------------- | -------------------------- |
| 01  | Đăng nhập 3 vai trò                     | `/dang-nhap/admin`, `/dang-nhap/giang-vien`, `/dang-nhap/sinh-vien` | PM | API + đối chiếu role; đã smoke test cả ba vai trò với backend thật; E2E đầy đủ còn lại |
| 02  | Đổi mật khẩu                            | `/doi-mat-khau`                    | PM               | Giao diện + gọi API; E2E đầy đủ còn lại |
| 02B | Ảnh đại diện (dialog trên header)       | —                                  | PM (tuần 8)      | Chưa có                    |
| 03  | Dashboard ADMIN                         | `/dashboard`                       | Đạt (tuần 9)     | Xong (dùng mock)           |
| 04  | Dashboard GIẢNG VIÊN                    | `/dashboard`                       | Đạt (tuần 9)     | Chưa có                    |
| 05  | Dashboard SINH VIÊN                     | `/dashboard`                       | Đạt (tuần 9)     | Chưa có                    |
| 10  | Danh sách sinh viên                     | `/sinh-vien`                       | Đức Anh          | UI + service API xong; E2E CRUD thật còn lại |
| 11  | Thêm/sửa sinh viên                      | `/sinh-vien/them`, `/:id/sua`      | Đức Anh          | Form + service API xong; E2E CRUD thật còn lại |
| 12  | Chi tiết sinh viên                      | `/sinh-vien/:id`                   | Đức Anh          | Ngăn kéo + service API xong; E2E CRUD thật còn lại |
| 13  | Danh sách giảng viên                    | `/giang-vien`                      | Đức Anh          | UI + service API xong; E2E CRUD thật còn lại |
| 14  | Thêm/sửa giảng viên                     | `/giang-vien/them`, `/:id/sua`     | Đức Anh          | Form + service API xong; E2E CRUD thật còn lại |
| 15  | Chi tiết giảng viên                     | `/giang-vien/:id`                  | Đức Anh          | Hồ sơ + service API xong; E2E CRUD thật còn lại |
| 16  | Danh sách lớp hành chính                | `/lop-hanh-chinh`                  | Đức Anh          | Chưa có                    |
| 17  | Thêm/sửa lớp                            | `/lop-hanh-chinh/them`, `/:id/sua` | Đức Anh          | Chưa có                    |
| 18  | Chi tiết lớp + gán sinh viên            | `/lop-hanh-chinh/:id`              | Đức Anh          | Chưa có                    |
| 19  | Danh sách môn học                       | `/mon-hoc`                         | Đức Anh (tuần 3) | Chưa có                    |
| 20  | Thêm/sửa môn học                        | `/mon-hoc/them`, `/:id/sua`        | Đức Anh (tuần 3) | Chưa có                    |
| 21  | Danh sách học kỳ                        | `/hoc-ky`                          | Đức Anh (tuần 3) | Chưa có                    |
| 22  | Thêm/sửa học kỳ + nút chuyển trạng thái | `/hoc-ky/them`, `/:id/sua`         | Đức Anh (tuần 3) | Chưa có                    |
| 23  | Danh sách phòng học                     | `/phong-hoc`                       | Đức Anh (tuần 4) | Chưa có                    |
| 24  | Thêm/sửa phòng học                      | `/phong-hoc/them`, `/:id/sua`      | Đức Anh (tuần 4) | Chưa có                    |
| 25  | Danh sách lớp học phần                  | `/lop-hoc-phan`                    | Đạt (tuần 5)     | Chưa có                    |
| 26  | Thêm/sửa lớp học phần                   | `/lop-hoc-phan/them`, `/:id/sua`   | Đạt (tuần 5)     | Chưa có                    |
| 27  | Chi tiết lớp học phần                   | `/lop-hoc-phan/:id`                | Đạt (tuần 5)     | Chưa có                    |
| 28  | Sinh viên của lớp                       | `/lop-hoc-phan/:id/sinh-vien`      | Đạt (tuần 5)     | Chưa có                    |
| 29  | Bảng điểm lớp                           | `/lop-hoc-phan/:id/diem`           | Đạt (tuần 9)    | Chưa có                    |
| 30  | Đăng ký hộ + đăng ký hàng loạt          | `/dang-ky`                         | Đạt (tuần 7)     | Chưa có                    |
| 31  | Danh sách đăng ký                       | `/dang-ky/danh-sach`               | Đạt (tuần 7)     | Chưa có                    |
| 32  | Lớp đang mở (sinh viên)                 | `/lop-hoc-phan`                    | Đạt (tuần 7)     | Chưa có                    |
| 33  | Đăng ký của tôi                         | `/dang-ky-cua-toi`                 | Đạt (tuần 7)     | Chưa có                    |
| 35  | Xem lịch                                | `/lich-hoc`                        | Đạt (tuần 5)     | Chưa có                    |
| 36  | Thêm buổi học                           | `/lop-hoc-phan/:id/lich/them`      | Đạt (tuần 5)     | Chưa có                    |
| 37  | Sinh lịch hàng tuần                     | `/lop-hoc-phan/:id/lich/sinh`      | Đạt (tuần 5)     | Chưa có                    |
| 38  | Danh sách buổi để điểm danh             | `/diem-danh`                       | Đạt (tuần 8)    | Chưa có                    |
| 39  | Điểm danh một buổi                      | `/diem-danh/:sessionId`            | Đạt (tuần 8)    | Chưa có                    |
| 40  | Thống kê chuyên cần                     | `/lop-hoc-phan/:id/chuyen-can`     | Đạt (tuần 8)    | Chưa có                    |
| 41  | Nhập điểm                               | `/lop-hoc-phan/:id/diem`           | Đạt (tuần 9)    | Chưa có                    |
| 42  | Điểm của tôi + CPA                      | `/diem-cua-toi`                    | Đạt (tuần 9)    | Chưa có                    |
| 43  | Lịch sử sửa điểm                        | `/lop-hoc-phan/:id/diem/lich-su`   | Đạt (tuần 9)    | Chưa có                    |
| 45  | Thùng rác                               | `/thung-rac`                       | PM               | Chưa có                    |
| 47  | Quản lý menu                            | `/menu`                            | Đạt (tuần 4)     | Chưa có                    |
| 48  | Thêm/sửa menu                           | `/menu/them`, `/:id/sua`           | Đạt (tuần 4)     | Chưa có                    |
| 49  | Cấu hình                                | `/cau-hinh`                        | Đạt (tuần 4)     | Chưa có                    |
| 50  | Quản lý người dùng                      | `/nguoi-dung`                      | Đạt (tuần 4)     | Chưa có                    |
| 51  | Thêm/sửa người dùng                     | `/nguoi-dung/them`, `/:id/sua`     | Đạt (tuần 4)     | Chưa có                    |
| 52  | Nút xem theo vai trò (ADMIN)            | header                             | PM (tuần 8)      | Chưa có                    |
| 53  | Banner đang xem theo vai trò            | toàn cục                           | PM (tuần 8)      | Chưa có                    |
| —   | Trang style-guide                       | `/style-guide`                     | PM               | Xong                       |

---

## 7. Quy trình Git và merge

### Mô hình nhánh

| Nhánh                | Vai trò                                    | Ai được push                        |
| -------------------- | ------------------------------------------ | ----------------------------------- |
| `main`               | Bản ổn định để demo và nộp                 | PM, từ `develop`, sau mốc kiểm soát |
| `develop`            | Nhánh tích hợp hằng ngày                   | PM, chỉ nhận qua pull request       |
| `feature/be-*`       | Tiến làm việc                              | Tiến                                |
| `feature/fe-dao-tao` | Đức Anh làm việc                           | Đức Anh                             |
| `feature/fe-hoc-vu`  | Đạt làm việc                               | Đạt                                 |
| `feature/pm-*`       | PM làm module backend khuôn mẫu và hạ tầng | PM                                  |

### Quy tắc pull request

1. **Một PR chỉ làm một việc:** một màn hình, hoặc một module API. Không gộp nhiều màn vào một PR.
2. **Giới hạn mềm 400 dòng thay đổi.** Vượt thì tách PR — PR lớn không ai review được thật.
3. **Trước khi mở PR, rebase lên `develop` mới nhất.** Không merge `develop` vào nhánh feature — lịch sử sẽ rối và conflict khó đọc hơn.
4. **Mô tả PR theo mẫu bốn dòng:** màn/module nào · endpoint nào đã dùng · đã chạy gì để kiểm chứng · còn thiếu gì.
5. **PR đổi hợp đồng API phải có nhãn `[CONTRACT]`** và chờ PM duyệt trước khi merge — vì nó ảnh hưởng cả hai bạn FE.

### Cửa sổ merge

PM merge hai lần mỗi ngày: đầu giờ chiều và cuối ngày. Lý do có cửa sổ thay vì merge bất cứ lúc nào: người khác cần biết `develop` đã đổi hay chưa để rebase. Merge rải rác khiến mọi người phải rebase liên tục.

- Trong cửa sổ merge, PM chỉ merge PR đã xanh (build pass, test pass). PR đỏ thì trả lại kèm lý do.
- Nếu `develop` hỏng sau merge, PM `revert` commit đó ngay, không cố sửa trên `develop`.

### Khi hợp đồng API lệch

Đây là quy tắc quan trọng nhất và cũng dễ bị vi phạm nhất. Khi phát hiện FE và BE trả khác nhau:

1. **Dừng lại.** Không bên nào tự sửa cho khớp bên kia.
2. Đối chiếu `docs/04-api-contract.md`. **Tài liệu là nguồn chân lý**, không phải code của bên nào.
3. Nếu tài liệu đúng → bên lệch sửa theo tài liệu.
4. Nếu tài liệu sai hoặc thiếu → PM sửa tài liệu + `openapi.yaml` trước, rồi báo cả hai bên cùng sửa trong cùng ngày.
5. Ghi lại quyết định vào `docs/07-decisions.md` nếu đó là thay đổi hành vi, không chỉ là sửa lỗi.

> **Cấm:** sửa mock cho khớp backend mà không sửa tài liệu. Làm vậy thì mock trở thành một nguồn sự thật thứ hai, và ba tháng sau không ai biết cái nào đúng.

---

## 8. Nhịp điều phối

| Thời điểm                      | Việc                                                                                                  | Thời lượng |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- | ---------- |
| Mỗi sáng, đầu giờ              | Daily: hôm qua làm gì · hôm nay làm gì · đang bị chặn ở đâu. Chỉ ba câu, đứng tại chỗ.                | 10 phút    |
| Mỗi chiều, cuối giờ            | Cửa sổ merge: PM nhận PR, review, merge vào `develop`.                                                | 30 phút    |
| Thứ Sáu                        | Demo trên máy PM: chạy đúng thứ đã làm trong tuần. Mọi người thấy sản phẩm thật, không nghe mô tả.    | 15 phút    |
| Thứ Sáu, sau demo              | PM sinh `openapi.yaml` cho tuần kế tiếp + cập nhật tài liệu tiến độ.                                  | 2 giờ      |
| Cuối mỗi mốc (tuần 4, 6, 7, 9) | Kiểm tra điều kiện mốc trong `docs/08-roadmap.md`. Không đạt thì cắt việc theo thứ tự ưu tiên đã ghi. | 30 phút    |

### Mốc kiểm soát

| Mốc         | Điều kiện đạt                                                                 | Nếu không đạt                                                    |
| ----------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Cuối tuần 4 | Toàn bộ nhóm đào tạo CRUD được, chạy thật không dùng mock                     | Cắt SCR-47 → 51 (menu, cấu hình) — hạng mục Should               |
| Cuối tuần 6 | Sinh lịch phát hiện đủ 3 loại trùng: phòng, giảng viên, sinh viên             | Cắt sinh lịch hàng tuần (SCR-37), chuyển sang nhập tay từng buổi |
| Cuối tuần 7 | Đăng ký có kiểm tra sĩ số và trùng lịch, tranh chấp chỗ cuối an toàn          | **Không cắt.** Đây là phần lõi của đồ án — dồn thêm người        |
| Cuối tuần 9 | Luồng end-to-end: mở lớp → sinh lịch → đăng ký → điểm danh → nhập điểm → chốt | Cắt dashboard chi tiết, giữ 4 con số                             |

Thứ tự cắt đầy đủ ở `docs/08-roadmap.md` mục "Thứ tự cắt khi trễ". Nguyên tắc: cắt từ dưới lên, không bao giờ cắt phần đăng ký, điểm danh, điểm, lớp học phần, học kỳ, xóa mềm.

---

## 9. Rủi ro và cách xử lý

### Rủi ro số 1

| **A. PM nhận phần backend khuôn mẫu** ✅ đã chốt | PM nhận: CRUD đào tạo khuôn mẫu (`subjects`, `rooms`, `menus`, `settings`) tuần 3–4; CRUD `sessions` + sinh lịch hàng tuần tuần 6; toàn bộ `/enrollments` + bulk + `/me/enrollments` tuần 7; điểm danh nâng cao tuần 8; `/trash/*` tuần 9. Khoảng **45 endpoint**. | Tiến giữ phần lõi cần hiểu sâu nghiệp vụ: `students`/`teachers`/`admin-classes`, `semesters` (vòng đời trạng thái), `sections` + Policy, `ScheduleService`, `EnrollmentService` lõi, nhập điểm + quy đổi + GPA. Khoảng **57 endpoint**. |

> **Phương án A đã chốt.** Cột PM trong bảng tuần (mục 5) đã phản ánh cách chia này. Ranh giới: PM làm phần khuôn mẫu và phần nối (endpoint, validate, Resource); Tiến làm phần cần quyết định nghiệp vụ và có test tranh chấp. Hai người dùng chung Service khi cần — PM mở PR trước, Tiến review.

### Các rủi ro còn lại

| Rủi ro                                  | Dấu hiệu nhận biết                                      | Cách xử lý                                                                                              |
| --------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Hai bạn FE conflict ở file dùng chung   | PR nào cũng sửa `app.routes.ts` hoặc `mock-registry.ts` | Đã xử lý bằng việc tách file. Nếu vẫn xảy ra nghĩa là bước tách chưa xong — làm lại trước khi tiếp tục. |
| FE code xong nhưng BE trả khác hợp đồng | Ngày tắt mock, hàng loạt màn hình trắng hoặc trống      | Đây là lý do phải tắt mock theo từng lô (tuần 4, 9) chứ không đợi đến cuối. Phát hiện sớm thì sửa rẻ.   |
| Tiến bị chặn vì chờ quyết định hợp đồng | Daily có câu "đang chờ PM trả lời"                      | PM phải trả lời trong ngày. Hợp đồng chưa chốt thì Tiến làm phần không phụ thuộc, không ngồi chờ.       |
| Đổi schema giữa chừng làm hỏng code FE  | Migration mới xuất hiện mà model FE không đổi           | Quy tắc: đổi schema phải đi kèm cập nhật `docs/03` + model FE + mock trong cùng một PR do PM mở.        |
| Tuần 7 quá tải                          | Giữa tuần 7 mà đăng ký chưa chạy được luồng chính       | Đã dự trù: PM cùng làm tuần 7. Nếu vẫn chậm, cắt SCR-31 và SCR-30 phần hàng loạt.                       |
| Merge dồn đến cuối kỳ                   | Cuối tuần 9 mà `develop` còn nhiều nhánh chưa merge     | Cửa sổ merge hằng ngày là biện pháp. Không merge thì conflict tích lũy theo cấp số nhân.                |

---

## 10. Định nghĩa xong và checklist bàn giao

### Một việc được coi là xong khi

1. API đã có trong `docs/openapi.yaml`, và code chạy đúng như hợp đồng.
2. Có test cho luồng chính và ít nhất một luồng lỗi.
3. Màn hình tương ứng hoạt động với dữ liệu thật — đã tắt mock cho đường dẫn đó và thử bằng tay.
4. Bốn trạng thái UI đều đúng: đang tải, có dữ liệu, rỗng, lỗi (có nút thử lại).
5. Tài liệu liên quan đã cập nhật trong cùng pull request.
6. Build xanh: `php artisan test` và `ng build` đều không lỗi.

### Checklist cho PM trước khi cho ba bạn tách nhánh

| #   | Việc                                               | Xong khi                                              | Trạng thái                               |
| --- | -------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------- |
| 1   | `openapi.yaml` có đủ endpoint của tuần 3–4         | YAML parse không lỗi, đếm đủ số path                  | ✅ 41 path, 0 `$ref` gãy                 |
| 2   | Tên endpoint options đã chốt theo backend          | Không còn `/options/lop-hanh-chinh` và 3 đường dẫn cũ | ✅                                       |
| 3   | Tên trường options đã chốt là `label`              | mock trả `label`, model FE đọc `label`                | ✅                                       |
| 4   | `app.routes.ts` đã tách thành hai file routes      | Hai bạn FE mỗi người sở hữu một file                  | ✅                                       |
| 5   | `mock-registry.ts` đã tách thành hai registry      | Mỗi người sở hữu một file                             | ✅                                       |
| 6   | Menu sidebar đọc từ file routes, không khai cứng   | `sidebar.ts` chỉ còn gộp 4 nhóm                       | ✅                                       |
| 7   | `shared/ui/data-table.ts` và `form-field.ts` đã có | Cả hai bạn dùng được, không ai phải tự viết           | ✅                                       |
| 8   | Đã tạo stub cho mọi màn trong phụ lục              | Bấm mục menu nào cũng ra trang, không rơi về dashboard | ✅ `DangXayDung` cho 13 màn chưa làm    |
| 9   | Đã tạo 3 nhánh feature và bật bảo vệ `develop`     | Push thẳng `develop` bị từ chối                       | ⬜                                       |
| 10  | Đã họp 30 phút giải thích ranh giới sở hữu         | Cả ba bạn nói lại được quy tắc bằng lời của mình      | ⬜                                       |

### Ba câu để kiểm tra kế hoạch đã thực sự tách được chưa

Sau Tuần 0, hỏi ba bạn ba câu này. Nếu câu nào trả lời "không" thì việc tách chưa xong.

- **Câu 1** — Đạt có thể làm xong SCR-30 (đăng ký hộ) mà không cần Tiến viết một dòng code nào không?
- **Câu 2** — Tiến có thể viết xong CRUD `students` mà không cần hỏi Đức Anh màn hình cần hiển thị gì không?
- **Câu 3** — Hai bạn FE có mở cùng một file trong tuần này không?
