# 00 — Mục lục tài liệu dự án QLLH

**Hệ thống quản lý lớp học** — Laravel REST API + Angular + MySQL
Phiên bản tài liệu: **v0.4** — cập nhật ngày 2026-10-26

---

## Trạng thái tài liệu

| File | Nội dung | Trạng thái | Nguồn chân lý cho |
|---|---|---|---|
| [01-requirements.md](01-requirements.md) | Yêu cầu chức năng & phi chức năng | ✅ Đã chốt | Phạm vi, FR, BR, NFR, phân quyền |
| [02-use-cases.md](02-use-cases.md) | Use case + tiêu chí chấp nhận | ✅ Đã chốt | Luồng nghiệp vụ, điều kiện biên |
| [03-data-model.md](03-data-model.md) | ERD, bảng, cột, kiểu, index, ràng buộc | ✅ Đã chốt | Schema database, quy tắc xóa mềm |
| [04-api-contract.md](04-api-contract.md) | Quy ước API + danh sách endpoint | ✅ Đã chốt | Hợp đồng FE ↔ BE |
| [openapi.yaml](openapi.yaml) | OpenAPI 3.1 — **41 path, 65 operation** đã đặc tả trong hợp đồng 113 endpoint | 🚧 Đang bổ sung | Máy đọc hợp đồng API |
| [postman/](postman/) | Collection **74 request** + hướng dẫn test API độc lập | ✅ Dùng được | Test backend không cần FE |
| [05-screens.md](05-screens.md) | Danh sách màn hình + điều hướng Angular | ✅ Đã chốt | Cấu trúc frontend |
| [06-test-plan.md](06-test-plan.md) | Ma trận FR/BR → test case | ✅ Đã chốt | Kiểm thử |
| [07-decisions.md](07-decisions.md) | Nhật ký quyết định kiến trúc (ADR) | ✅ Đã chốt | Lý do các lựa chọn |
| [08-roadmap.md](08-roadmap.md) | Kế hoạch triển khai 10 tuần | ✅ Đã chốt | Thứ tự công việc |
| [phan-cong-cong-viec.md](phan-cong-cong-viec.md) | Phân công nhóm 4 người + quy trình Git | ✅ Dùng được | Ai làm gì, ai sở hữu file nào |
| [tong-quan-kien-truc.html](tong-quan-kien-truc.html) | Sơ đồ kiến trúc trực quan (mở bằng trình duyệt) | ✅ Dùng được | Thuyết trình, giới thiệu dự án |

**Lưu trữ:** `archive/Functional_Requirements_Class_Management_v0.2.docx` là bản cũ, **không còn hiệu lực**. Chỉ dùng để tham chiếu lịch sử.

---

## Thứ tự đọc đề xuất

1. **Mới vào dự án:** 01 → 03 → 04 → 08.
2. **Code backend:** 03 → 04 → 02 → 06.
3. **Code frontend:** 05 → 04 → 02.
4. **Review/tranh luận:** 07 (ghi lại lý do, tránh mở lại quyết định cũ).

---

## Quy ước chung của bộ tài liệu

- **Ngôn ngữ:** nội dung tiếng Việt; tên bảng, cột, endpoint, field JSON **tiếng Việt không dấu** (xem ADR-002).
- **Mã tham chiếu:** `FR-xx.yy` (chức năng), `BR-xx` (quy tắc nghiệp vụ), `NFR-xx` (phi chức năng), `UC-xx` (use case), `SCR-xx` (màn hình), `ADR-xx` (quyết định).
- **Ưu tiên:** MoSCoW — Must / Should / Could.
- **Đánh dấu thay đổi:** `🆕` mới, `✏️` sửa, `❌` bỏ.
- Khi tài liệu và code lệch nhau, **tài liệu là nguồn chân lý**; ngược lại nếu tài liệu sai thì sửa tài liệu trong cùng commit với code.

---

## Tóm tắt 8 lỗi nghiệp vụ đã sửa so với v0.2

| # | Lỗi | Sửa ở |
|---|---|---|
| 1 | Đăng ký trước khi có buổi học → không kiểm tra được trùng lịch | FR-09.05, FR-10.04, roadmap đảo thứ tự |
| 2 | Ba luật xóa khóa lẫn nhau, học kỳ không bao giờ xóa được | FR-06.04, BR-16 |
| 3 | Chốt điểm lưu sai cấp (theo dòng điểm thay vì theo lớp) | FR-12.04, bảng `lop_hoc_phan` |
| 4 | Điểm danh thiếu mốc thời gian hủy đăng ký | FR-11.01, `dang_ky_hoc_phan.huy_luc` |
| 5 | Hủy lớp học phần không có hệ quả | FR-08.04 |
| 6 | Đăng ký lại sau hủy chưa có luật | FR-09.03, BR-20 |
| 7 | Đổi học kỳ/môn của lớp học phần không bị kiểm tra | FR-08.03 |
| 8 | BR-16 định nghĩa lệch bảng 6.1 | BR-16 |

## Bổ sung ở v0.3.1 (2026-10-21)

| Thay đổi | Nơi áp dụng |
|---|---|
| 🆕 Điểm chữ A/B/C/D/F + điểm hệ 4, bảng quy đổi cấu hình được | FR-12.03, FR-12.05, FR-12.07; `diem.diem_chu`, `diem.diem_he_4`; ADR-013 |
| 🆕 ADMIN xem giao diện theo vai trò không cần đăng xuất | FR-01.09, mục 4.1; SCR-52/53; ADR-014 |
| 🆕 Luồng chuẩn bị học kỳ trước đợt đăng ký | UC-04B, TC-04B |

Chi tiết đầy đủ ở [01-requirements.md](01-requirements.md) mục "Thay đổi so với v0.2".

## Bổ sung ở v0.4 (2026-10-24)

Rà soát nghiệp vụ toàn bộ tài liệu, sửa mâu thuẫn nội bộ và bổ sung 7 quy tắc.

| # | Thay đổi | Nơi áp dụng |
|---|---|---|
| 1 | `lop_hanh_chinh.khoa` → `khoa_hoc` (khóa ≠ khoa); thêm `nganh`, `nam_nhap_hoc` | ADR-016, `03` §3.4, `01` FR-03.01 |
| 2 | Học kỳ có `nam_hoc` + `ky_thu` | ADR-016, `03` §3.6 |
| 3 | 🆕 Ràng buộc năm thứ khi đăng ký (`lop_hoc_phan.nam_thu`) | BR-23, FR-08.01, FR-09.02/05 |
| 4 | 🆕 Vòng đời học kỳ chỉ tiến, một kỳ ONGOING | BR-24, FR-06.03, ADR-017 |
| 5 | 🆕 Chặn chồng lấn thời gian (kỳ, đợt, buổi học) | BR-25, FR-06.01, FR-10.01/02 |
| 6 | 🆕 "Trong đợt đăng ký" tính theo học kỳ chứa lớp | BR-26, FR-09.02 |
| 7 | 🆕 Đăng ký lại: chặn khi có điểm, chuyên cần tính từ `dang_ky_luc` | BR-27, FR-11.05 |
| 8 | 🆕 Học lại: GPA một lần/môn, điểm cao nhất; thêm CPA | BR-28, FR-12.08, ADR-018 |
| 9 | 🆕 Chặn hủy lớp đã chốt điểm | BR-29, FR-08.04 |
| 10 | 🆕 Đăng ký hàng loạt theo lớp hành chính | FR-09.07, `POST /api/enrollments/bulk` |
| 11 | Sửa: đổi môn lớp chặn khi có đăng ký (đối xứng đổi học kỳ) | FR-08.03 |
| 12 | Sửa: BR-14 có ngoại lệ ADMIN sửa điểm danh kỳ CLOSED | BR-14, FR-11.03 |
| 13 | Sửa: mục 10 bỏ "quy đổi điểm chữ/hệ 4", thêm §10.1 giới hạn đã biết | `01` §10 |
| 14 | Sửa: `vai_tro` IN HOA trong data model (ADR-015); ERD thêm `diem_chu`, `diem_he_4` | `03` §1, §3.1 |
| 15 | 🆕 Ảnh đại diện trên Cloudinary, một cột `users.avatar_url` cho cả 3 vai trò | FR-01.10/01.11, ADR-019, `03` §3.1 |
| 16 | 🆕 Khóa / kích hoạt **hàng loạt**, kèm thu hồi token khi khóa | FR-01.12, FR-02.05b, FR-04.04b, FR-05.04, FR-07.04, BR-30 |
| 17 | 🆕 Xóa **hàng loạt** cho sinh viên, giảng viên, môn, phòng | FR-02.07, FR-04.06, BR-31, `04` §1.6b |

**Vì sao:** rà soát 2026-10-24 phát hiện tài liệu tự mâu thuẫn (mục 10 loại trừ quy đổi điểm chữ trong khi FR-12.03 bắt buộc có), schema lệch ADR-015, và có 6 lỗ hổng nghiệp vụ chưa định nghĩa. Gốc của câu hỏi "học kỳ có phụ thuộc khóa sinh viên không" là tên cột `khoa` nhập nhằng — đã tách rõ ở ADR-016.

## Cập nhật triển khai và phân công (2026-10-26)

- Phân công màn hình đã thống nhất: Đức Anh phụ trách đào tạo SCR-10–24; Đạt phụ trách học vụ SCR-25–43 và dashboard/quản trị SCR-03–05, SCR-47–51; PM phụ trách xác thực, màn toàn cục và thùng rác. Chi tiết tại [phan-cong-cong-viec.md](phan-cong-cong-viec.md).
- Backend hiện có 59/113 endpoint theo hợp đồng và 1 route tiện ích (CRUD môn học/phòng học đã merge; `menus` 5 + `settings` 2 endpoint đang ở nhánh `pm-menu-cau-hinh`, chưa merge).
- Postman có 74 request. OpenAPI có 41 path, tương ứng 65 operation; không so sánh số path trực tiếp với tổng endpoint trong hợp đồng.
- Nhánh `pm-menu-cau-hinh`: FE đã xong SCR-47 (quản lý menu) và SCR-48 (sửa menu; thêm menu bằng form tại chỗ ở `/menu`). Đường dẫn không khớp route nay tách hai kết cục — URL có trong menu ra trang "chưa làm" trong layout, URL không ai khai ra 404 đứng riêng ngoài layout (xem [05-screens.md](05-screens.md) §2).
