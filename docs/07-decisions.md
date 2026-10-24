# 07 — Nhật ký quyết định kiến trúc (ADR)

Mỗi quyết định dưới đây đã được chốt. Khi muốn thay đổi, thêm ADR mới thay vì sửa ADR cũ.

---

## ADR-001 — Chuyển hẳn sang REST API + Angular

**Ngày:** 2026-10-20 · **Trạng thái:** Đã chấp nhận

**Bối cảnh:** Backend hiện chạy Laravel Blade MVC (18 view, session auth) song song một API mỏng không auth. Tài liệu FR v0.2 chốt Angular + REST API. Hai kiến trúc cùng tồn tại làm mọi thay đổi phải làm hai lần.

**Quyết định:** Laravel chỉ đóng vai trò REST API `/api`. Angular 22 là frontend duy nhất. Thư mục Blade được giữ làm tham chiếu UI trong thời gian đầu, không còn là đường chạy chính; xóa khi FE ổn định.

**Hệ quả**

- (+) Khớp tài liệu, khớp 2 đồ án trước, một nguồn logic.
- (+) FE và BE phát triển song song qua hợp đồng OpenAPI.
- (−) Phải dựng lại toàn bộ UI; cần cấu hình CORS.
- (−) Mất các view đã viết tay (giữ lại để tham chiếu).

**Phương án bị loại:** giữ Blade và bỏ Angular (lệch tài liệu, lệch kỹ năng đã có); chạy song song cả hai (gấp đôi chi phí bảo trì).

---

## ADR-002 — Tên bảng/cột tiếng Việt không dấu

**Ngày:** 2026-10-20 · **Trạng thái:** Đã chấp nhận

**Bối cảnh:** Code hiện tại dùng `lop_hocs`, `sinh_viens`, `ma_sv`, `giao_vien`. Tài liệu FR dùng thuật ngữ tiếng Anh (Section, Enrollment). Cần chọn một kiểu thống nhất.

**Quyết định:** Bảng, cột và field JSON dùng **tiếng Việt không dấu, snake_case, số ít** (`lop_hoc_phan`, `ma_lop_hp`, `si_so_toi_da`). Giá trị enum dùng **tiếng Anh in hoa** (`ACTIVE`, `OPEN`, `SCHEDULED`) để khớp FE và hợp đồng API. Comment và message dùng tiếng Việt có dấu.

**Hệ quả**

- (+) Đồng bộ với code cũ, dễ đọc với người Việt.
- (+) Enum tiếng Anh giữ được thói quen Angular.
- (−) Phải khai báo `protected $table` tường minh trên mọi model (Laravel pluralize tiếng Anh).
- (−) Tên dài hơn (`dang_ky_hoc_phan` vs `enrollments`).

**Phương án bị loại:** toàn tiếng Anh (lệch code cũ); lai cũ Việt/mới Anh (hệ thống trộn hai kiểu).

---

## ADR-003 — Viết lại schema thay vì bổ sung

**Ngày:** 2026-10-20 · **Trạng thái:** Đã chấp nhận

**Bối cảnh:** `lop_hocs` hiện là mô hình v0.1 (`giao_vien` chuỗi, `si_so` nhập tay) — chính là mô hình v0.2 đã bác bỏ. `sinh_viens.lop_hoc_id` trỏ vào bảng này.

**Quyết định:** Xóa migration và bảng cũ (`lop_hocs`, `sinh_viens`, `menus`), dựng lại toàn bộ theo [03-data-model.md](03-data-model.md) với tên bảng số ít (`menu`, `sinh_vien`, ...). DB local chỉ chứa dữ liệu seed nên không có dữ liệu thật cần bảo toàn.

**Hệ quả**

- (+) Schema sạch, không mang nợ kỹ thuật.
- (+) Không phải viết migration chuyển đổi dữ liệu.
- (−) Phải viết lại toàn bộ controller/resource cũ.
- (−) Mọi thay đổi chưa commit sẽ mất nếu không backup.

**Phương án bị loại:** đổi `lop_hocs` thành `lop_hanh_chinh` (giữ được dữ liệu nhưng phải sửa toàn bộ code cũ và vẫn thiếu học kỳ/môn); giữ song song (hai khái niệm lớp trùng nhau).

---

## ADR-004 — Sanctum personal access token

**Ngày:** 2026-10-20 · **Trạng thái:** Đã chấp nhận

**Bối cảnh:** Angular SPA chạy origin riêng, cần cơ chế xác thực không dựa cookie session.

**Quyết định:** Sanctum personal access token, gửi qua `Authorization: Bearer`, hạn 7 ngày. Thu hồi khi logout, khóa tài khoản, xóa tài khoản, đổi mật khẩu. Không dùng Sanctum SPA cookie vì dễ vướng CSRF và cấu hình domain.

**Hệ quả**

- (+) Đơn giản, hợp với SPA, không cần CSRF token.
- (+) Thu hồi từng token hoặc toàn bộ.
- (−) Token lưu ở client; cần HTTPS khi triển khai.
- (−) Không tự refresh; hết hạn phải đăng nhập lại.

**Phương án bị loại:** session cookie (vướng CORS/CSRF); JWT tự phát (phải tự viết refresh/blacklist).

---

## ADR-005 — Xóa mềm + unique không lọc `deleted_at`

**Ngày:** 2026-10-20 · **Trạng thái:** Đã chấp nhận

**Bối cảnh:** BR-01 yêu cầu mã của bản ghi đã xóa mềm không được dùng lại. Nếu unique index có `deleted_at`, mã sẽ được giải phóng sau khi xóa — trái yêu cầu.

**Quyết định:** Unique index **không** bao gồm `deleted_at`. Muốn dùng lại mã thì phải khôi phục bản ghi cũ. Mọi bảng xóa mềm có thêm `deleted_by`, `restored_by`.

**Hệ quả**

- (+) Khớp BR-01, bảo toàn dấu vết.
- (−) Người dùng không tạo mới được với mã cũ, phải khôi phục — cần thông báo UI rõ ràng.

---

## ADR-006 — Chốt điểm ở cấp lớp học phần

**Ngày:** 2026-10-20 · **Trạng thái:** Đã chấp nhận

**Bối cảnh:** v0.2 đặt `is_finalized` trên từng dòng điểm nhưng FR-12.04 nói TEACHER "chốt điểm của lớp học phần".

**Quyết định:** Chốt ở `lop_hoc_phan.chot_diem_luc` / `chot_diem_boi`. `diem` chỉ lưu giá trị. Mở khóa do ADMIN, ghi lý do vào `nhat_ky`. Chốt chỉ thành công khi mọi đăng ký ACTIVE có đủ 3 điểm thành phần.

**Hệ quả**

- (+) Đúng nghiệp vụ, một thao tác cho cả lớp.
- (+) Không thể chốt nửa vời.
- (−) Muốn chốt từng phần phải mở khóa cả lớp (không hỗ trợ).

---

## ADR-007 — Buổi học đặt tên `buoi_hoc`

**Ngày:** 2026-10-20 · **Trạng thái:** Đã chấp nhận

**Bối cảnh:** Laravel dùng bảng `sessions` cho session driver `database` (đang cấu hình). Đặt bảng buổi học là `sessions` sẽ xung đột.

**Quyết định:** Bảng buổi học là `buoi_hoc`, model `BuoiHoc`. Endpoint vẫn dùng `/sessions` cho ngắn và khớp tài liệu.

**Hệ quả:** Tên bảng và endpoint khác nhau, phải ghi rõ trong tài liệu (đã ghi ở [04-api-contract.md](04-api-contract.md)).

---

## ADR-008 — Bỏ middleware giờ hành chính khỏi API

**Ngày:** 2026-10-20 · **Trạng thái:** Đã chấp nhận

**Bối cảnh:** Code cũ có `CheckGioHanhChinh` chặn mọi request ngoài 8h–17h, áp lên cả `/api`. Ràng buộc này không có trong FR v0.2, chặn demo ngoài giờ và chặn test.

**Quyết định:** Bỏ hoàn toàn khỏi hệ thống: gỡ alias `gio.hanh.chinh` trong `bootstrap/app.php` và **xóa file** `CheckGioHanhChinh.php`. Không giữ lại dưới dạng "để dành" — middleware không dùng là code chết, gây nhầm lẫn khi đọc và vẫn bị tính vào độ phủ test.

**Hệ quả:** API hoạt động 24/7. Nếu sau này môn học yêu cầu ràng buộc giờ, viết middleware mới có chọn lọc — git history vẫn còn bản cũ để tham khảo.

---

## ADR-009 — Envelope response thống nhất

**Ngày:** 2026-10-20 · **Trạng thái:** Đã chấp nhận

**Bối cảnh:** Code cũ đã có trait `ApiResponse` trả `{success, message, data}` và biến thể phân trang. Tài liệu v0.2 không quy định.

**Quyết định:** Giữ envelope này, bổ sung `ma_loi` cho lỗi nghiệp vụ và `errors` cho validation. Mọi response — kể cả lỗi hệ thống — đi qua cùng cấu trúc.

**Hệ quả**

- (+) FE xử lý lỗi một chỗ (interceptor).
- (+) Không phá vỡ code cũ đã dùng trait.
- (−) Không theo chuẩn JSON:API thuần; chấp nhận được với quy mô đồ án.

---

## ADR-010 — Thứ tự triển khai: Section → Session → Enrollment

**Ngày:** 2026-10-20 · **Trạng thái:** Đã chấp nhận

**Bối cảnh:** v0.2 xếp đăng ký (tuần 5) trước lịch học (tuần 6), nhưng FR-09.05 yêu cầu kiểm tra trùng lịch sinh viên khi đăng ký — bất khả thi khi chưa có buổi học.

**Quyết định:** Đảo thứ tự: lớp học phần → buổi học → đăng ký. Bổ sung BR-22: khi sinh hoặc sửa lịch mà phát sinh trùng lịch sinh viên đã đăng ký, trả 409 để ADMIN xử lý.

**Hệ quả**

- (+) Mọi quy tắc kiểm tra đều có dữ liệu thật để so.
- (−) ADMIN đăng ký hộ đến tuần 6 mới dùng được đầy đủ.

---

## ADR-011 — Giữ module Menu động

**Ngày:** 2026-10-20 · **Trạng thái:** Đã chấp nhận

**Bối cảnh:** Bảng `menus` + CRUD + lọc theo vai trò không có trong FR v0.2 nhưng đã code xong và có test.

**Quyết định:** Giữ, expose qua `/api/menus`, Angular dựng sidebar/header từ dữ liệu này. Không nằm trong phạm vi bắt buộc — nếu trễ tiến độ có thể cắt mà không ảnh hưởng nghiệp vụ.

**Hệ quả:** Thêm 1 module nhỏ nhưng gần như miễn phí; FE linh hoạt hơn hardcode.

---

## ADR-012 — Tài liệu Markdown

**Ngày:** 2026-10-20 · **Trạng thái:** Đã chấp nhận

**Bối cảnh:** v0.2 chỉ có một file `.docx`, khó diff, khó review, khó đọc bằng công cụ.

**Quyết định:** Toàn bộ tài liệu chuyển sang `.md` trong `docs/`. `.docx` chỉ lưu trữ. Mọi thay đổi hành vi phải cập nhật `.md` **trong cùng commit** với code.

**Hệ quả**

- (+) Diff được trên Git, review được theo dòng.
- (+) Công cụ (kể cả AI agent) đọc trực tiếp.
- (−) Phải kỷ luật cập nhật, nếu không tài liệu sẽ trôi.

---

## ADR-013 — Bảng quy đổi điểm chữ cấu hình được

**Ngày:** 2026-10-21 · **Trạng thái:** Đã chấp nhận

**Bối cảnh:** Cần hiển thị điểm chữ A/B/C/D/F và điểm hệ 4 bên cạnh thang 10. Không có chuẩn quốc gia thống nhất — mỗi trường ban hành bảng quy đổi riêng trong _Quy chế đào tạo_. Bảng được dùng: A = 8.5–10.0 (4.0), B = 7.0–8.49 (3.0), C = 5.5–6.99 (2.0), D = 4.0–5.49 (1.0), F < 4.0 (0.0).

**Quyết định:** Lưu bảng quy đổi trong `cau_hinh` dưới khóa `diem.bang_quy_doi` (mảng khoảng), không hard-code. Khi tính điểm, tra bảng để lấy `diem_chu`, `diem_he_4`, `ket_qua`. Lưu cả ba vào bảng `diem` để truy vấn và thống kê nhanh. Validate khoảng không chồng lấn và phủ kín 0–10.

**Hệ quả**

- (+) Đổi quy chế chỉ cần sửa cấu hình, không sửa code.
- (+) Hỗ trợ cả GPA hệ 10 và hệ 4.
- (+) Bảng cũ có thể thêm lại mức `+` (B+ = 3.5, C+ = 2.5, D+ = 1.5) mà không cần migration.
- (−) Bảng mặc định chỉ đúng với trường đang dùng; trường khác phải sửa cấu hình.
- (−) Nếu đổi bảng quy đổi giữa kỳ, điểm cũ giữ nguyên giá trị đã lưu; cần tính lại thủ công (không tự động hồi tố).

---

## ADR-014 — ADMIN xem giao diện theo vai trò ở phía client

**Ngày:** 2026-10-21 · **Trạng thái:** Đã chấp nhận

**Bối cảnh:** ADMIN cần kiểm tra giao diện và luồng của TEACHER/STUDENT mà không phải đăng xuất rồi đăng nhập bằng tài khoản khác.

**Quyết định:** Thêm chế độ **xem như vai trò (view-as)** thuần phía client. Trạng thái lưu `localStorage`, không gửi lên server, **không đổi token, không đổi quyền server**. Chỉ thay đổi menu, nút, cột và dashboard đang hiển thị. Có banner nhắc và nút quay lại ADMIN.

**Hệ quả**

- (+) Đổi qua lại tức thì, không mất phiên, không cần tài khoản phụ.
- (+) Không tạo lỗ hổng mạo danh: token vẫn là ADMIN, audit vẫn ghi ADMIN.
- (−) **Không kiểm chứng được phân quyền server.** Muốn test thật phải đăng nhập bằng tài khoản TEACHER/STUDENT thật. Điều này phải ghi rõ trên UI.
- (−) Nếu FE ẩn nút dựa hoàn toàn vào chế độ xem mà quên kiểm tra server, dễ tạo cảm giác an toàn giả. Vì vậy Policy server vẫn là nguồn chân lý.

**Phương án bị loại:** cấp token tạm mang vai trò khác (vi phạm nguyên tắc ADMIN không mạo danh, làm mờ audit); tạo tài khoản demo riêng (vẫn phải đăng nhập lại, không giải quyết yêu cầu).

---

## ADR-015 — Giá trị `vai_tro` viết IN HOA

**Ngày:** 2026-10-23 · **Trạng thái:** Đã chấp nhận

**Bối cảnh:** `users.vai_tro` là cột enum duy nhất dùng chữ thường (`admin`, `giang_vien`, `sinh_vien`), trong khi mọi enum khác của hệ thống dùng IN HOA (`ACTIVE`, `OPEN`, `SCHEDULED`...). Đây là di sản của code v0.1 trước khi ADR-002 ban hành quy ước enum. Sự lệch này khiến FE phải nhớ hai kiểu giá trị khác nhau và dễ sai khi so sánh.

**Quyết định:** Đổi `vai_tro` thành **`ADMIN`**, **`GIANG_VIEN`**, **`SINH_VIEN`**. Áp dụng cho cả ba chỗ: giá trị cột trong `users`, giá trị cột `menu.vai_tro`, và field JSON `vai_tro` trong hợp đồng API.

**Hệ quả**
- (+) Toàn hệ thống chỉ còn một quy ước enum, FE không phải phân biệt hai kiểu.
- (+) Khớp ADR-002 (enum tiếng Anh in hoa).
- (+) Code đã dùng hằng `User::ADMIN` nên chỉ đổi giá trị ở một chỗ, không phải sửa từng controller.
- (−) Phá vỡ hợp đồng API cũ: FE nào đang so sánh `'admin'` sẽ hỏng. Chấp nhận được vì FE chưa code.
- (−) Dữ liệu cũ trong DB phải chạy lại seeder (DB chỉ có dữ liệu demo).

**Phương án bị loại:** giữ chữ thường cho riêng `vai_tro` (duy trì hai quy ước); đổi tất cả enum khác sang chữ thường (ngược ADR-002, phải sửa nhiều nơi hơn).

---

## ADR-016 — Tách "khóa" khỏi "khoa", chương trình đào tạo ngoài phạm vi

**Ngày:** 2026-10-24 · **Trạng thái:** Đã chấp nhận

**Bối cảnh:** Cột `lop_hanh_chinh.khoa` (ví dụ `K65`) mang nghĩa **khóa** (cohort — năm nhập học), nhưng viết không dấu trùng với **khoa** (faculty — Khoa CNTT, Khoa Cơ khí). Người đọc dễ hiểu nhầm rằng học kỳ phải gắn với khoa, dẫn tới đề xuất "tạo học kỳ phải phụ thuộc khóa sinh viên".

Thực tế, chặn "sinh viên năm 1 không học môn năm 4" cần **chương trình đào tạo**: ánh xạ (ngành × kỳ thứ) → danh sách môn. Muốn đúng hoàn toàn còn cần cả **khoa** vì chương trình 4 năm của Khoa CNTT khác Khoa Cơ khí. Đó là nghiệp vụ phòng đào tạo, không phải quản lý lớp học.

**Quyết định:**

1. Đổi `lop_hanh_chinh.khoa` → **`khoa_hoc`** để hết nhập nhằng.
2. Thêm `lop_hanh_chinh.nganh` và `lop_hanh_chinh.nam_nhap_hoc` — **chỉ để lọc và thống kê**, không dùng chặn đăng ký.
3. Thêm `lop_hoc_phan.nam_thu` (nullable, `null` = mọi năm) — ràng buộc nhẹ ở cấp lớp, không cần chương trình đào tạo.
4. **Không** đưa bảng `khoa` (faculty) và `chuong_trinh_dao_tao` vào phạm vi v1.

**Hệ quả**

- (+) Tên cột hết nhập nhằng; FE/BE/người chấm đọc đúng khái niệm.
- (+) Chặn được lỗi đăng ký sai năm với chi phí thấp (BR-23), ADMIN vẫn override được khi cần.
- (+) Tính được "sinh viên đang năm thứ mấy" mà không phải đoán từ chuỗi `K65`.
- (−) `nam_thu` là ràng buộc **thô**: nó không biết môn nào bắt buộc/kỳ nào, không biết tiên quyết, không biết chương trình từng ngành. Đây là giới hạn đã biết, ghi ở [01-requirements.md](01-requirements.md) mục 10.
- (−) Khi một lớp phục vụ nhiều năm (môn đại cương), ADMIN phải nhớ để `nam_thu = null`.

**Phương án bị loại:** đưa chương trình đào tạo đầy đủ vào (vượt phạm vi 10 tuần, biến đồ án thành hệ thống quản lý trường); gắn `khoa` vào `hoc_ky` (sai bản chất — học kỳ là trục thời gian toàn trường, mọi khóa cùng học); không kiểm tra gì (bỏ ngỏ lỗi nghiệp vụ rõ ràng).

---

## ADR-017 — Vòng đời học kỳ chỉ tiến, một kỳ ONGOING tại một thời điểm

**Ngày:** 2026-10-24 · **Trạng thái:** Đã chấp nhận

**Bối cảnh:** FR-06.03 chỉ nói ADMIN "chuyển thủ công" giữa ba trạng thái, không nói được phép chuyển nào. Hệ quả: có thể mở lại kỳ `CLOSED` (trái BR-14 "lưu trữ vĩnh viễn"), có thể có nhiều kỳ `ONGOING` cùng lúc (làm "học kỳ hiện tại" trở nên nhập nhằng), có thể bỏ qua `ONGOING`. Ngoài ra không chặn hai học kỳ chồng lấn ngày.

**Quyết định:**

1. Chỉ cho chuyển **tiến**: `UPCOMING → ONGOING → CLOSED`. `CLOSED` là trạng thái cuối, không quay lại.
2. Chỉ **một** học kỳ `ONGOING` tại một thời điểm.
3. Hai học kỳ không được chồng lấn khoảng `[ngay_bat_dau, ngay_ket_thuc]`.
4. Đợt đăng ký phải nằm trong khoảng ngày của học kỳ.
5. Mọi lần chuyển trạng thái ghi `nhat_ky` (NFR-05).
6. Chỉ xóa mềm được học kỳ `UPCOMING` và chưa có lớp học phần — bỏ quyền xóa kỳ `ONGOING`.
7. BR-14 có một ngoại lệ: **ADMIN được sửa điểm danh** trên kỳ `CLOSED`, có ghi `nhat_ky`. Không cần mở lại học kỳ.

**Hệ quả**

- (+) "Học kỳ hiện tại" luôn xác định duy nhất, dashboard và mọi truy vấn theo kỳ ổn định.
- (+) Kỳ đã đóng thật sự bất biến với dữ liệu điểm, chỉ còn lỗ hổng vận hành (điểm danh sót) được xử lý có kiểm soát.
- (−) ADMIN không sửa sai được thứ tự kỳ nếu đã chuyển nhầm sang `CLOSED`; phải tạo kỳ mới.
- (−) Ngoại lệ điểm danh làm BR-14 không còn tuyệt đối — phải đọc kèm để hiểu.

**Phương án bị loại:** cho chuyển tự do (phá tính bất biến của dữ liệu lịch sử); cho mở lại kỳ `CLOSED` (phải thêm luồng mở khóa, audit, và mọi báo cáo cũ có thể đổi số); để nhiều kỳ `ONGOING` (không xác định được kỳ hiện tại).

---

## ADR-018 — Học lại: GPA tính điểm cao nhất mỗi môn

**Ngày:** 2026-10-24 · **Trạng thái:** Đã chấp nhận

**Bối cảnh:** Câu hỏi đã chốt #7 cho phép đăng ký lại môn đã học kỳ trước và "không kiểm tra lịch sử". Công thức GPA ở [03-data-model.md](03-data-model.md) §5.2 lại cộng **mọi** đăng ký ACTIVE có điểm. Học lại một môn vì vậy bị tính **hai lần** vào GPA — không trường nào làm vậy.

**Quyết định:**

1. GPA (học kỳ và tích lũy) tính **một lần cho mỗi môn**, lấy `diem_tong_ket` **cao nhất** trong các lần học.
2. Áp dụng cho cả GPA học kỳ và GPA tích lũy (CPA).
3. Thêm `GET /api/me/gpa` trả GPA học kỳ và CPA, để quy tắc này có chỗ thể hiện (FR-12.08).
4. Điểm của lần học không được chọn **vẫn lưu** trong bảng `diem` và vẫn hiển thị trong lịch sử học tập — chỉ không tham gia GPA.

**Hệ quả**

- (+) GPA đúng nghiệp vụ, không phạt sinh viên học lại để cải thiện điểm.
- (+) CPA có chỗ hiển thị, phục vụ xét tốt nghiệp/học bổng ở mức demo.
- (−) Truy vấn GPA phức tạp hơn: cần nhóm theo `mon_hoc_id` và lấy max, không chỉ `sum`/`count`.
- (−) "Điểm cao nhất" khác "điểm lần cuối" — nếu trường dùng lần cuối, phải sửa công thức; ghi rõ trong tài liệu.

**Phương án bị loại:** lấy điểm lần gần nhất (phạt sinh viên học lại, ít trường dùng); cộng cả hai lần (sai rõ ràng, đang là hành vi hiện tại).

---

## ADR-019 — Ảnh đại diện trên Cloudinary, một cột cho cả ba vai trò

**Ngày:** 2026-10-24 · **Trạng thái:** Đã chấp nhận

**Bối cảnh:** Cả ba vai trò đều cần ảnh đại diện nhưng `sinh_vien` và `giang_vien` không có cột nào. Hai lựa chọn: thêm cột ảnh vào từng bảng hồ sơ, hoặc đặt một cột trên `users`. Đồng thời phải quyết định lưu file ở đâu — đĩa server, DB dạng blob, hay dịch vụ ngoài.

Dự án đặt vé máy bay (đồ án trước của cùng tác giả) đã dùng Cloudinary với `users.avatar_url`; giữ cùng cách làm để tái dùng kinh nghiệm và cấu hình.

**Quyết định:**

1. Ảnh nằm ở **`users.avatar_url`** (text) và **`users.avatar_public_id`**, không nằm trên `sinh_vien`/`giang_vien`. Lý do: ADMIN không có hồ sơ riêng vẫn cần ảnh; mỗi người chỉ có một tài khoản nên không có nguy cơ lệch dữ liệu giữa hai bảng.
2. Lưu trên **Cloudinary**, không lưu nhị phân trong DB và không lưu trên đĩa server. DB chỉ giữ URL hiển thị và `public_id` để xóa.
3. Endpoint `POST /api/me/avatar` (multipart, field `anh`) và `DELETE /api/me/avatar`, dùng chung cho cả ba vai trò.
4. Ảnh được **cắt vuông 512×512** khi upload (Cloudinary transformation `fill` + `gravity: face`), để không phải truyền ảnh 10 MP về trình duyệt cho một avatar 40 px.
5. Chỉ nhận JPEG/PNG/WebP/GIF, tối đa 5 MB (`CLOUDINARY_MAX_UPLOAD_KB`). Kiểm tra bằng MIME đọc từ **nội dung file**, không tin phần mở rộng hay header do client gửi.
6. Thiếu cấu hình Cloudinary → endpoint trả **503 `UPLOAD_NOT_CONFIGURED`**, phần còn lại của hệ thống vẫn chạy. Không để lỗi cấu hình làm hỏng cả ứng dụng.
7. Khi thay ảnh: upload ảnh mới trước, ghi DB, **sau đó** mới xóa ảnh cũ. Nếu bước ghi DB lỗi thì ảnh cũ vẫn còn dùng được.
8. Xóa ảnh là thao tác **không ném lỗi**: ảnh mồ côi trên Cloudinary không đáng làm hỏng việc xóa tài khoản.

**Hệ quả**

- (+) Một chỗ duy nhất cho ảnh của cả ba vai trò, không phải đồng bộ hai bảng.
- (+) Không tăng dung lượng DB, không phải sao lưu file, không phải phục vụ file tĩnh.
- (+) Cấu hình và kinh nghiệm tái dùng từ đồ án đặt vé.
- (−) Phụ thuộc dịch vụ ngoài: Cloudinary lỗi hoặc hết quota thì không đổi được ảnh (nhưng hệ thống vẫn chạy).
- (−) Cần thêm 2 biến bí mật vào `.env`; máy nào chưa cấu hình thì không test được luồng upload.
- (−) Ảnh đã upload rồi mà DB mất thì ảnh mồ côi trên Cloudinary — chấp nhận, dọn tay nếu cần.

**Phương án bị loại:** thêm `anh_dai_dien` vào cả `sinh_vien` và `giang_vien` (ADMIN không có chỗ lưu, phải đồng bộ hai nơi); lưu file trên đĩa server (phải sao lưu, phải phục vụ tĩnh, mất khi container bị tạo lại); lưu base64/blob trong MySQL (phình DB, chậm mọi truy vấn bảng `users`).
