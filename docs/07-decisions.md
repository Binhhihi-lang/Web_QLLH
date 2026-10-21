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

**Quyết định:** Bỏ khỏi toàn bộ route `/api`. Giữ file middleware để dùng tùy chọn nếu sau này có yêu cầu riêng cho một vài thao tác ghi.

**Hệ quả:** API hoạt động 24/7; nếu môn học yêu cầu ràng buộc giờ, thêm lại có chọn lọc.

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

## ADR-012 — Tài liệu Markdown là nguồn chân lý

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

**Bối cảnh:** Cần hiển thị điểm chữ A/B/C/D/F và điểm hệ 4 bên cạnh thang 10. Không có chuẩn quốc gia thống nhất — mỗi trường ban hành bảng quy đổi riêng trong *Quy chế đào tạo*. Bảng được dùng: A = 8.5–10.0 (4.0), B = 7.0–8.49 (3.0), C = 5.5–6.99 (2.0), D = 4.0–5.49 (1.0), F < 4.0 (0.0).

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
