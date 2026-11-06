# Kế hoạch phân công công việc

**Hệ thống quản lý lớp học (QLLH)** · Nhóm 4 người · 8 tuần còn lại · hai nhánh phát triển song song

| Phiên bản | Ngày       | Trạng thái              | Căn cứ                                                 |
| --------- | ---------- | ----------------------- | ------------------------------------------------------ |
| 2.1       | 06/11/2026 | Khôi phục phân công backend lịch và bổ sung tài khoản cá nhân cho Tiến | Tiến: lịch học, tài khoản cá nhân, điểm, điểm danh, nhật ký; PM review/sửa lỗi lịch và phụ trách đăng ký |
| 2.0       | 05/11/2026 | Chốt lại quyền sở hữu backend | Tiến phụ trách điểm, điểm danh, nhật ký; PM phụ trách backend còn lại |
| 1.9       | 05/11/2026 | Cập nhật cấu hình điểm theo học kỳ và chuyển backend lịch/đăng ký cho PM | Commit `db79469`; điều chỉnh phân công Tuần 6–7 |
| 1.8       | 03/11/2026 | Hoàn thiện giao diện Hệ thống | Nhánh `giao-dien-he-thong`; SCR-45, SCR-49–51; tách route hệ thống |
| 1.7       | 03/11/2026 | Bổ sung giao diện Khoa/Ngành | SCR-54/55, lọc Khoa tại SCR-19; menu ADMIN |
| 1.6       | 29/10/2026 | Bổ sung lưu điểm hàng loạt | Nhánh `fix/luu-diem-phan-cong-tuan`; endpoint `PUT /sections/{id}/grades` + test hồi quy |
| 1.5       | 29/10/2026 | Đối chiếu cuối ngày     | Xong lớp học phần + người dùng + `PUT /me`: 82/113 endpoint |
| 1.4       | 29/10/2026 | Đối chiếu code `develop` | Commit `6192548` + đo thật: 62/113 endpoint, test FE/BE |
| 1.3       | 27/10/2026 | Đề xuất — chờ nhóm chốt | `docs/08-roadmap.md` + trạng thái code nhánh `pm-menu-cau-hinh` (SCR-47/48 xong) |
| 1.2       | 26/10/2026 | Đề xuất — chờ nhóm chốt | `docs/08-roadmap.md` + trạng thái code nhánh `develop` |

### Cập nhật 05/11/2026 — cấu hình điểm theo học kỳ và điều chỉnh backend

- **Đã hoàn thành:** API quản lý học kỳ và cấu hình quy đổi điểm theo từng học kỳ;
  cấu hình có trang danh sách/lọc, trang chi tiết riêng, chỉ sửa được trước khi học kỳ
  diễn ra. Đã cập nhật luồng hiển thị điểm theo dữ liệu API và hỗ trợ mở đợt đăng ký
  trước ngày bắt đầu học kỳ. Giao diện có test cấu hình; build development đạt.
- **Chuyển giao từ Tiến sang PM:** toàn bộ backend lịch học ở Tuần 6 và đăng ký học
  phần ở Tuần 7, gồm nghiệp vụ lõi, API, kiểm tra xung đột/tranh chấp và test.
- **Chưa hoàn thành:** backend `/sessions`, `/schedules`, `/enrollments` và các luồng
  sinh lịch/đăng ký chưa được tính là xong; tiếp tục theo mốc Tuần 6–7 trong roadmap.

### Cập nhật 06/11/2026 — điều chỉnh phân công backend

- **Tiến phụ trách backend:** lịch học, tài khoản cá nhân (hồ sơ `/api/me`, avatar và thao tác tài khoản của chính mình), điểm,
  điểm danh và nhật ký/audit log; gồm nghiệp vụ, API và kiểm thử.
- **PM phụ trách đăng ký học phần** cùng backend còn lại. Với lịch học, PM review và sửa lỗi sau khi nhận nhánh của Tiến;
  không nhận quyền sở hữu triển khai lịch.
- **Auth nền tảng** (đăng nhập, phát hành/lưu token, xác thực, guard/policy và phân quyền) vẫn do PM phụ trách;
  phần tài khoản cá nhân `/api/me` thuộc Tiến.
- Cập nhật này thay thế phân công backend ngày 05/11 trong bảng tuần và mục 4; các phần Tiến đã được giao trước đó vẫn giữ nguyên.

### Cập nhật 03/11/2026 — giao diện Hệ thống

PM thực hiện trên nhánh `giao-dien-he-thong`: hoàn thiện SCR-45 theo đủ 12 loại
thực thể và bộ lọc API; bổ sung SCR-49 cấu hình; triển khai SCR-50/51 quản lý,
tạo và sửa tài khoản. SCR-47/48 (Menu) đã có giao diện từ phần việc trước của
Đạt, không làm lại. Nhật ký chưa có API đọc danh sách nên chưa triển khai màn
hình gọi dữ liệu giả. Các route quản trị được gom vào `routes/he-thong.routes.ts`
để không tiếp tục thêm route Hệ thống vào file route do Đạt phụ trách.

### Cập nhật 03/11/2026 — Tiến: quản lý học kỳ (nhánh `feature/be-semesters`)

- Đã triển khai 6 endpoint `/api/semesters`: danh sách, tạo, chi tiết, sửa,
  xóa mềm và chuyển trạng thái; kiểm tra BR-24/25, phân quyền và ghi nhật ký.
- `/api/options/semesters` bổ sung `nam_hoc`, `ky_thu` đúng hợp đồng.
- Bổ sung `HocKyTest` và folder Postman **16 — Học kỳ (CRUD + vòng đời BR-24/25)**.
- Trạng thái: triển khai trên nhánh feature, chờ Tiến kiểm thử Postman và PM
  review/merge; chưa coi là đã tích hợp vào `develop`.

---

> ## ⚠ Thay đổi phân công ngày 29/10/2026 — module lớp học phần chuyển cho PM
>
> **Quyết định của PM (chủ dự án):** riêng **module lớp học phần** chuyển từ Tiến sang
> PM, gồm: CRUD `sections` (11 endpoint), đổi trạng thái OPEN/CLOSED/CANCELLED, kiểm tra
> hợp lệ FR-08.05 khi đổi giảng viên, `LopHocPhanPolicy` theo vai trò, `sections/{id}/students`,
> `sections/{id}/attendance-summary`.
>
> **Tại thời điểm 29/10, không chuyển giao gì khác.** Tiến vẫn giữ: `semesters` (vòng đời trạng thái),
> `ScheduleService` lõi (trùng phòng/GV/SV), `EnrollmentService` lõi (sĩ số, trùng lịch,
> tranh chấp chỗ cuối), nhập điểm + tổng kết + quy đổi + GPA/CPA, `/users`.
>
> **Lý do:** `sections` là đường găng — màn SCR-25–28 đã có giao diện mà chưa có backend,
> và lịch học, đăng ký, điểm danh, điểm đều chờ nó.
>
> **Phạm vi tại ngày 29/10:** ở [mục 4](#4-ranh-giới-sở-hữu-file) và
> [mục 5](#5-phân-công-theo-tuần), module lớp học phần đổi chủ từ Tiến sang PM.
> Phân công này được cập nhật tiếp vào ngày 05/11 ở các mục bên dưới.

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
3. **Khối lượng backend vẫn là rủi ro.** Đã có 62/113 endpoint theo hợp đồng; còn 51 endpoint cần triển khai. Cách xử lý ở [mục 9](#9-rủi-ro-và-cách-xử-lý).

### Con số cần nhớ

| Hạng mục     | Đã xong                                                              | Còn lại | Ai làm        |
| ------------ | -------------------------------------------------------------------- | ------- | ------------- |
| Endpoint API | 82 endpoint theo hợp đồng + 1 route tiện ích                         | 31      | PM + Tiến     |
| Hợp đồng     | 58 path / 88 operation trong `openapi.yaml`                          | 25 operation | PM       |
| Màn hình     | 21 (đăng nhập, đổi mật khẩu, dashboard ADMIN, style-guide, SCR-10–20, SCR-25–28, SCR-45, SCR-47/48) | 26 | Đức Anh + Đạt |
| Thời gian    | 2 tuần / 10 tuần                                                     | 8 tuần  | —             |

**Đo cuối ngày 2026-10-29 (nhánh `pm-dong-bo-tien-do-29-10`):** test backend **124**
(112 pass, 12 skip do Docker chưa chạy); test frontend **202 — pass hết**; Pint sạch;
`ng build` sạch; Postman **135 request / 15 folder**. Trong ngày đã xong module
**lớp học phần** (11 endpoint), **`/api/users`** (8 endpoint) và **`PUT /api/me`**,
kèm sửa test FE đỏ và một test flaky có sẵn.
`useMock: false` vẫn làm các màn chưa có backend lỗi khi chạy thật — chi tiết ở
[`08-roadmap.md`](08-roadmap.md) mục "Trạng thái thực tế tại 2026-10-29".

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

**Cập nhật 2026-10-27 — nhánh `pm-menu-cau-hinh` (Đạt, thuộc tuần 4):**

- **Đã xong SCR-47 (quản lý menu):** danh sách menu (kể cả mục đang ẩn) qua
  `GET /api/menus?quan_ly=1`, thêm mới bằng form tại chỗ ở `/menu`, ẩn/hiện,
  xoá có hộp thoại xác nhận, trang chi tiết `/menu/:id`, trang sửa
  `/menu/:id/sua`. Sidebar và menu đầu trang đọc menu từ API nên vừa lưu là
  thấy ngay, không phải tải lại trang.
- **Backend `settings` đã xong** (`GET`/`PUT /api/settings`); SCR-49 mới là
  trang giữ chỗ, chưa có giao diện.
- **Hai quyết định chốt trong đợt này** (Đạt hỏi PM, PM chốt — các bạn FE cần
  biết khi làm màn mới):
  1. **Đường dẫn không khớp route tách làm hai kết cục**, không gộp: URL có
     trong bảng `menus` → màn "Màn hình *tên mục* chưa làm" **trong layout**;
     URL không ai khai → **404 đứng riêng, không sidebar/header/footer**. Cả
     hai đều không quay về `/dashboard` như trước.
  2. **Được phép khai menu trước cho màn chưa code.** Form menu cảnh báo
     nhưng vẫn lưu đường dẫn nội bộ chưa có route (để khai trước cho tuần sau);
     chỉ chặn khi không phải đường dẫn bắt đầu bằng `/` hoặc địa chỉ http(s).
  3. **Menu phải khớp quyền route.** `menu.vai_tro` ghi vai trò **hẹp nhất** được
     thấy mục, và **ADMIN luôn thấy tất cả** (ADMIN là superuser). Trước đây bộ
     lọc so khớp tuyệt đối nên ADMIN mở được `/dang-ky`, `/diem-danh` mà sidebar
     lại giấu; menu "Đăng ký" còn trỏ nhầm vào SCR-30 (chỉ ADMIN) nhưng gắn
     `SINH_VIEN` khiến sinh viên bấm vào bị đá về dashboard. Đã sửa ở
     `core/utils/menu-vai-tro.ts` + seed mock + `MenuSeeder.php`, và có test
     `core/utils/menu-route-nhat-quan.spec.ts` khoá quan hệ menu ↔ route.
     **Khi thêm màn mới: thêm mục menu với `vai_tro` khớp `data.roles` của route.**
  - Hệ quả cho người làm màn mới: khai route vào `routes/dao-tao.routes.ts` /
    `routes/hoc-vu.routes.ts` như cũ. Màn nào chưa làm thì để `DangXayDung`,
    hoặc bỏ hẳn route và để wildcard hiện trang "chưa làm" theo tên mục menu.
- Kiểm thử: `ng test` 158/158 pass, `ng build` sạch, kiểm chứng trên Chrome
  thật (ba luồng chính, dark mode, mobile 390px, console 0 lỗi).
- **Chưa commit, chưa merge** — Đạt tự commit.

### Cách chia việc trong một câu

> **Đức Anh** nhận toàn bộ màn **đào tạo**, **Đạt** nhận toàn bộ màn **học vụ**; về backend, **Tiến** phụ trách lịch học, tài khoản cá nhân, điểm, điểm danh và nhật ký; **PM** phụ trách đăng ký cùng backend còn lại, hợp đồng API, hạ tầng và tích hợp. PM review/sửa lỗi lịch sau khi nhận nhánh Tiến.

| Vai trò        | Thành viên | Phụ trách chính                                       | Nhánh làm việc             |
| -------------- | ---------- | ----------------------------------------------------- | -------------------------- |
| PM / điều phối | Bạn        | Hợp đồng API, tài liệu, merge, hạ tầng, **backend đăng ký và phần còn lại trừ lịch, tài khoản cá nhân, điểm, điểm danh, nhật ký**, **Auth nền tảng + phân quyền FE**; review/sửa lỗi lịch | `develop` + `feature/pm-*` |
| Frontend 1     | Đức Anh    | Toàn bộ màn đào tạo + CRUD                            | `feature/fe-dao-tao`       |
| Frontend 2     | Đạt        | Toàn bộ màn học vụ + dashboard + quản trị             | `feature/fe-hoc-vu`        |
| Backend        | Tiến       | Backend lịch học, tài khoản cá nhân (`/api/me`), điểm, điểm danh và nhật ký/audit log | `feature/be-*` |

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
| Envelope và mã lỗi thống nhất           | `backend/app/Traits/apiResponse.php` + `frontend/src/app/core/mock/mock-response.ts` | Mọi endpoint trả cùng một hình dạng. FE viết một lần hàm xử lý lỗi là dùng cho toàn bộ 49 màn.                              |
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

14 component trong `shared/ui/` là đủ cho toàn bộ 49 màn.

---

## 4. Ranh giới sở hữu file

Quy tắc duy nhất: **mỗi thư mục có đúng một người được sửa.** Cần sửa ngoài vùng của mình thì báo PM.

| Đường dẫn                                                    | Người sở hữu | Người khác được làm gì           |
| ------------------------------------------------------------ | ------------ | -------------------------------- |
| `backend/app/**`, `backend/database/**`, `backend/routes/**` | PM           | Tiến sở hữu lịch học, tài khoản cá nhân, điểm, điểm danh và nhật ký/audit log |
| Backend `sessions` / `schedules` — controller, service, request, resource, model, migration, factory, seeder | **Tiến** | PM review và sửa lỗi sau khi nhận nhánh |
| Backend hồ sơ/tài khoản cá nhân — `HoSoController`, `QuanLyHoSoService`, request/resource và `/api/me`/avatar routes | **Tiến** | PM review phần tích hợp; Auth nền tảng vẫn PM |
| Backend `enrollments` — controller, service, request, resource, model, migration, factory, seeder | **PM (từ 05/11)** | Tiến đọc |
| Backend điểm, điểm danh và nhật ký — controller, service, request, resource, model, migration, seeder | **Tiến** | PM đọc |
| `backend/tests/**`                                           | PM, trừ test lịch, tài khoản cá nhân, điểm, điểm danh và nhật ký thuộc Tiến | Tiến đọc khi review |
| `backend/app/Http/Controllers/Api/LopHocPhanController.php`  | **PM** (từ 29/10) | Tiến đọc                     |
| `backend/app/Http/Requests/QuanLy/LopHocPhanRequest.php`     | **PM** (từ 29/10) | Tiến đọc                     |
| `backend/app/Http/Resources/LopHocPhanResource.php`          | **PM** (từ 29/10) | Tiến đọc                     |
| `backend/app/Services/QuanLyLopHocPhanService.php`           | **PM** (từ 29/10) | Tiến đọc                     |
| `backend/app/Policies/LopHocPhanPolicy.php`                  | **PM** (từ 29/10) | Tiến đọc                     |
| `backend/routes/api.php` → nhóm `sections`                   | **PM** (từ 29/10) | Tiến đọc                     |
| `backend/routes/api.php` → nhóm lịch và `/me` hồ sơ cá nhân | **Tiến** | PM review/tích hợp |
| `backend/routes/api.php` → mọi nhóm ngoài lịch, `/me`, điểm, điểm danh và nhật ký | **PM** | Tiến đọc |
| `backend/routes/api.php` → nhóm điểm, điểm danh và nhật ký | **Tiến** | PM đọc |
| `backend/tests/Feature/LopHocPhanTest.php`                   | **PM** (từ 29/10) | Tiến đọc                     |
| `docs/**`, `docs/openapi.yaml`                               | PM           | Đọc. Cần sửa hợp đồng → báo PM   |
| `frontend/src/app/features/dao-tao/**`                       | Đức Anh      | Đọc                              |
| `frontend/src/app/features/hoc-vu/**`                        | Đạt          | Đọc                              |
| `frontend/src/app/features/dashboard/**`                     | Đạt          | SCR-03–05; PM tích hợp route chung |
| `frontend/src/app/features/hoc-vu/menu/**` (SCR-47/48)         | Đạt          | PM tích hợp route/menu dùng chung |
| `frontend/src/app/features/he-thong/**` (SCR-49–51)            | PM           | Đạt đọc; SCR-50/51 gọi `/users`, SCR-49 gọi `/settings` |
| `frontend/src/app/features/thung-rac/**` (SCR-45)              | PM           | Đạt đọc; dùng `/trash/{type}` |
| `frontend/src/app/features/not-found/**` (404 + trang "chưa làm") | PM        | Đọc                              |
| `frontend/src/app/core/auth/trang-chua-lam.guard.ts`          | PM           | Đọc                              |
| `frontend/src/app/features/auth/**`                          | PM           | Đọc                              |
| `frontend/src/app/shared/**`                                 | PM           | Đọc. Cần thêm component → báo PM |
| `frontend/src/app/core/**` (layout, models, services, mock)  | PM           | Đọc                              |
| `frontend/src/app/routes/dao-tao.*`                          | Đức Anh      | Đọc                              |
| `frontend/src/app/routes/hoc-vu.*`                           | Đạt          | Đọc                              |
| `frontend/src/app/routes/he-thong.routes.ts`                 | PM           | Đạt đọc; route menu/cấu hình/người dùng |
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
| **3** | — (backend đào tạo thuộc PM theo phân công 05/11) | SCR-10 → 18 (sinh viên, giảng viên, lớp hành chính) | — | Backend CRUD `students`, `teachers`, `admin-classes`, `subjects`, `rooms`; tạo kèm tài khoản, bulk-status/delete; BR-30/31; review test |
| **4** | — (backend đào tạo thuộc PM theo phân công 05/11) | SCR-19 → 24 (môn học, học kỳ, phòng học) | SCR-47/48 (menu) — xong 27/10 | Backend `semesters`, `menus`, `settings`, `/options/*`; hoàn thiện SCR-49–51 |
| **5**          | ~~CRUD `sections` lõi + đổi trạng thái + FR-08.05 + Policy~~ **→ chuyển PM (29/10)**                                                          | —                                                                                                        | SCR-25 → 28 (lớp học phần): danh sách, form, chi tiết, sinh viên của lớp                                | **CRUD `sections` lõi + đổi trạng thái + FR-08.05 + `LopHocPhanPolicy`** (nhận từ Tiến); `/sections/{id}/students` + attendance-summary; Sinh OpenAPI lô 6–7; bắt đầu bộ test E2E |
| **6**          | **Backend lịch học:** `ScheduleService` (trùng phòng/GV/SV), CRUD `sessions`, sinh lịch, `/schedules`; test nghiệp vụ | — | SCR-35 → 37 (lịch tuần/tháng, thêm buổi, sinh lịch) | SCR-45; seeder dữ liệu demo; rà test plan; PM review và sửa lỗi sau khi nhận nhánh Tiến |
| **7**          | ~~Backend đăng ký học phần~~ **→ chuyển PM (05/11)**                                                                                           | —                                                                                                        | SCR-30 → 33 (đăng ký)                                                                                   | **Toàn bộ backend đăng ký:** `EnrollmentService` (sĩ số, trùng lịch, năm thứ, đợt đăng ký, khóa dòng chống tranh chấp), `/enrollments`, bulk, `/me/enrollments`, hủy; test luồng và tranh chấp |
| **8** | Backend điểm danh; backend tài khoản cá nhân `/api/me`, avatar và thao tác hồ sơ của chính mình; nghiệp vụ, API, test | SCR-02, SCR-02B; nối `AuthService` + guard | SCR-38 → 40; rà responsive | PM giữ Auth nền tảng; rà tích hợp và sửa lỗi các nhánh đã nhận |
| **9** | Backend điểm + nhật ký: nhập điểm đơn/hàng loạt, tổng kết, quy đổi, chốt/mở khóa, lịch sử, GPA/CPA; API đọc/ghi `nhat_ky`; kiểm thử | — | SCR-29, SCR-41 → 43, SCR-03 → 05 | `/trash/*`, khôi phục; E2E lưu/chốt; tắt mock, ma trận phân quyền |
| **10** | Ổn định backend điểm, điểm danh, nhật ký; rà test plan | Rà responsive màn đào tạo | Kịch bản demo + dữ liệu demo; rà responsive | Backend còn lại, README, demo, merge cuối, đóng gói staging |

---

## 6. Phụ lục: màn hình thuộc về ai

Danh sách đầy đủ SCR-01 → SCR-55 theo `docs/05-screens.md`. Quy tắc sở hữu: Đức Anh phụ trách toàn bộ SCR đào tạo 10–24; Đạt phụ trách toàn bộ SCR học vụ 25–43, dashboard SCR-03–05 và menu SCR-47/48; PM phụ trách xác thực, màn toàn cục, SCR-45 và SCR-49–51.

> Ghi chú: SCR-06 → 09, 34, 44, 46 không tồn tại trong `docs/05-screens.md` — số được cấp theo nhóm và có khoảng trống, không phải thiếu màn hình. Tổng cộng **49 màn** (gồm SCR-02B, SCR-54 và SCR-55).

| SCR | Màn hình                                | Đường dẫn                          | Phụ trách        | Trạng thái                 |
| --- | --------------------------------------- | ---------------------------------- | ---------------- | -------------------------- |
| 01  | Đăng nhập 3 vai trò                     | `/dang-nhap/admin`, `/dang-nhap/giang-vien`, `/dang-nhap/sinh-vien` | PM | API + đối chiếu role; đã smoke test cả ba vai trò với backend thật; E2E đầy đủ còn lại |
| 02  | Đổi mật khẩu                            | `/doi-mat-khau`                    | PM               | Giao diện + gọi API; E2E đầy đủ còn lại |
| 02B | Ảnh đại diện (dialog trên header)       | —                                  | PM (tuần 8)      | Chưa có                    |
| 03  | Dashboard ADMIN                         | `/dashboard`                       | Đạt (tuần 9)     | ✅ Xong — `GET /dashboard/admin` đã có ở backend |
| 04  | Dashboard GIẢNG VIÊN                    | `/dashboard`                       | Đạt (tuần 9)     | Chưa có                    |
| 05  | Dashboard SINH VIÊN                     | `/dashboard`                       | Đạt (tuần 9)     | Chưa có                    |
| 10  | Danh sách sinh viên                     | `/sinh-vien`                       | Đức Anh          | UI + service API xong; E2E CRUD thật còn lại |
| 11  | Thêm/sửa sinh viên                      | `/sinh-vien/them`, `/:id/sua`      | Đức Anh          | Form + service API xong; E2E CRUD thật còn lại |
| 12  | Chi tiết sinh viên                      | `/sinh-vien/:id`                   | Đức Anh          | Ngăn kéo + service API xong; E2E CRUD thật còn lại |
| 13  | Danh sách giảng viên                    | `/giang-vien`                      | Đức Anh          | UI + service API xong; E2E CRUD thật còn lại |
| 14  | Thêm/sửa giảng viên                     | `/giang-vien/them`, `/:id/sua`     | Đức Anh          | Form + service API xong; E2E CRUD thật còn lại |
| 15  | Chi tiết giảng viên                     | `/giang-vien/:id`                  | Đức Anh          | Hồ sơ + service API xong; E2E CRUD thật còn lại |
| 16  | Danh sách lớp hành chính                | `/lop-hanh-chinh`                  | Đức Anh          | ✅ Xong (hợp nhất 29/10)    |
| 17  | Thêm/sửa lớp                            | `/lop-hanh-chinh/them`, `/:id/sua` | Đức Anh          | ✅ Xong (hợp nhất 29/10)    |
| 18  | Chi tiết lớp + gán sinh viên            | `/lop-hanh-chinh/:id`              | Đức Anh          | ✅ Xong (hợp nhất 29/10)    |
| 19  | Danh sách môn học                       | `/mon-hoc`                         | Đức Anh (tuần 3) | ✅ Xong (hợp nhất 29/10)    |
| 20  | Thêm/sửa môn học                        | `/mon-hoc/them`, `/:id/sua`        | Đức Anh (tuần 3) | ✅ Xong (hợp nhất 29/10)    |
| 21  | Danh sách học kỳ                        | `/hoc-ky`                          | Đức Anh (tuần 3) | Chưa có                    |
| 22  | Thêm/sửa học kỳ + nút chuyển trạng thái | `/hoc-ky/them`, `/:id/sua`         | Đức Anh (tuần 3) | Chưa có                    |
| 23  | Danh sách phòng học                     | `/phong-hoc`                       | Đức Anh (tuần 4) | Chưa có                    |
| 24  | Thêm/sửa phòng học                      | `/phong-hoc/them`, `/:id/sua`      | Đức Anh (tuần 4) | Chưa có                    |
| 25  | Danh sách lớp học phần                  | `/lop-hoc-phan`                    | Đạt (tuần 5)     | ✅ Giao diện + backend `/sections` xong 29/10; chạy thật được |
| 26  | Thêm/sửa lớp học phần                   | `/lop-hoc-phan/them`, `/:id/sua`   | Đạt (tuần 5)     | ✅ Xong 29/10 |
| 27  | Chi tiết lớp học phần                   | `/lop-hoc-phan/:id`                | Đạt (tuần 5)     | ✅ Xong 29/10 |
| 28  | Sinh viên của lớp                       | `/lop-hoc-phan/:id/sinh-vien`      | Đạt (tuần 5)     | ✅ Xong 29/10 |
| 29  | Bảng điểm lớp                           | `/lop-hoc-phan/:id/diem`           | Đạt (tuần 9)    | 🔶 FE + API GET/PUT đã có trên nhánh hiện tại; backend có test; E2E với backend thật còn chờ |
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
| 41  | Nhập điểm                               | `/lop-hoc-phan/:id/diem`           | Đạt (tuần 9)    | 🔶 Form nhập/lưu/chốt đã có; backend PUT hàng loạt mới được bổ sung; cần E2E giao diện thật |
| 42  | Điểm của tôi + CPA                      | `/diem-cua-toi`                    | Đạt (tuần 9)    | Chưa có                    |
| 43  | Lịch sử sửa điểm                        | `/lop-hoc-phan/:id/diem/lich-su`   | Đạt (tuần 9)    | Chưa có                    |
| 45  | Thùng rác                               | `/thung-rac`                       | PM               | ✅ Giao diện, đủ 12 loại API, tìm kiếm/lọc ngày/người xóa, phân trang và khôi phục |
| 47  | Quản lý menu                            | `/menu`                            | Đạt (tuần 4)     | ✅ Xong (nhánh `pm-menu-cau-hinh`) |
| 48  | Sửa menu                                | `/menu/:id/sua`                    | Đạt (tuần 4)     | ✅ Xong; thêm menu bằng form tại chỗ ở `/menu`, không có route `/menu/them` |
| 49  | Cấu hình                                | `/cau-hinh`                        | PM (nhánh `giao-dien-he-thong`) | ✅ FE + `GET`/`PUT /settings`; kiểm tra trọng số, khoảng quy đổi và số ngày |
| 50  | Quản lý người dùng                      | `/nguoi-dung`                      | PM (nhánh `giao-dien-he-thong`) | ✅ Tìm kiếm/lọc/phân trang, trạng thái hàng loạt, đặt lại mật khẩu, xóa ADMIN |
| 51  | Thêm/sửa người dùng                     | `/nguoi-dung/them`, `/:id/sua`     | PM (nhánh `giao-dien-he-thong`) | ✅ Tạo/sửa; mật khẩu tạm chỉ hiện một lần khi tạo |
| —   | Nhật ký                                | `/nhat-ky`                         | Tiến (backend); PM (UI) | Chưa làm UI; Tiến phụ trách API ghi/đọc nhật ký |
| 52  | Nút xem theo vai trò (ADMIN)            | header                             | PM (tuần 8)      | Chưa có                    |
| 53  | Banner đang xem theo vai trò            | toàn cục                           | PM (tuần 8)      | Chưa có                    |
| 54  | Quản lý Khoa                             | `/khoa`                            | PM               | ✅ FE + API; menu chỉ ADMIN |
| 55  | Quản lý Ngành                            | `/nganh`                           | PM               | ✅ FE + API; lọc theo Khoa; menu chỉ ADMIN |
| —   | Trang style-guide                       | `/style-guide`                     | PM               | Xong                       |

### Cập nhật sau khi phát hiện lỗi lưu điểm 405

- **Đã xử lý trên nhánh `fix/luu-diem-phan-cong-tuan`:** frontend đã gửi `PUT
  /api/sections/{id}/grades` nhưng backend trước đó chỉ khai báo GET. Bổ sung route,
  kiểm tra quyền giảng viên phụ trách, validation, lưu hàng loạt và lịch sử sửa điểm.
- **Đã kiểm tra:** test backend cho lưu điểm, tính điểm, audit, quyền, kỳ đóng và lớp
  chốt điểm. Chưa xác nhận E2E trên giao diện chạy với backend thật.
- **Còn trong kế hoạch:** API nhập một dòng `PUT /api/enrollments/{id}/grade`, màn
  lịch sử sửa điểm, điểm của tôi/GPA/CPA. Không đánh dấu các phần này là hoàn tất chỉ
  vì endpoint nhập hàng loạt của bảng điểm lớp đã có.

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

| **Phạm vi backend hiện hành** | **PM:** đăng ký học phần, Auth nền tảng và backend còn lại; review/sửa lỗi lịch sau khi nhận nhánh Tiến. | **Tiến:** backend lịch học, tài khoản cá nhân (`/api/me`), điểm, điểm danh và nhật ký/audit log, gồm nghiệp vụ, API và test. |

> **Phân công hiện hành ngày 06/11/2026:** Tiến sở hữu backend lịch học, tài khoản cá nhân (`/api/me`), điểm, điểm danh và nhật ký/audit log. PM sở hữu đăng ký học phần, Auth nền tảng và backend còn lại; với lịch học PM review/sửa lỗi sau khi nhận nhánh Tiến. Khi thay đổi chạm phần dùng chung, hai bên thống nhất phạm vi trước khi sửa.
>
> **Cập nhật 29/10/2026:** module **lớp học phần** (`sections` + `LopHocPhanPolicy`) chuyển
> từ Tiến sang PM vì là đường găng. Tiến vẫn giữ phần lịch, đăng ký lõi tại thời điểm đó.
>
> **Cập nhật lần 1 ngày 05/11/2026:** backend lịch học và đăng ký chuyển từ Tiến sang PM.
> **Cập nhật ngày 06/11/2026:** lịch học trở lại phạm vi Tiến; Tiến nhận thêm tài khoản cá nhân.
> Đăng ký vẫn do PM phụ trách. Các phần điểm, điểm danh và nhật ký của Tiến được giữ nguyên.

### Các rủi ro còn lại

| Rủi ro                                  | Dấu hiệu nhận biết                                      | Cách xử lý                                                                                              |
| --------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Hai bạn FE conflict ở file dùng chung   | PR nào cũng sửa `app.routes.ts` hoặc `mock-registry.ts` | Đã xử lý bằng việc tách file. Nếu vẫn xảy ra nghĩa là bước tách chưa xong — làm lại trước khi tiếp tục. |
| FE code xong nhưng BE trả khác hợp đồng | Ngày tắt mock, hàng loạt màn hình trắng hoặc trống      | Đây là lý do phải tắt mock theo từng lô (tuần 4, 9) chứ không đợi đến cuối. Phát hiện sớm thì sửa rẻ.   |
| Tiến bị chặn vì chờ quyết định hợp đồng | Daily có câu "đang chờ PM trả lời"                      | PM phải trả lời trong ngày. Hợp đồng chưa chốt thì Tiến làm phần không phụ thuộc, không ngồi chờ.       |
| Đổi schema giữa chừng làm hỏng code FE  | Migration mới xuất hiện mà model FE không đổi           | Quy tắc: đổi schema phải đi kèm cập nhật `docs/03` + model FE + mock trong cùng một PR do PM mở.        |
| Tuần 7 quá tải                          | Giữa tuần 7 mà đăng ký chưa chạy được luồng chính       | PM sở hữu toàn bộ backend đăng ký; ưu tiên luồng chính và kiểm thử tranh chấp chỗ cuối. Nếu vẫn chậm, cắt SCR-31 và SCR-30 phần hàng loạt. |
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
