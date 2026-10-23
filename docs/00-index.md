# 00 — Mục lục tài liệu dự án QLLH

**Hệ thống quản lý lớp học** — Laravel REST API + Angular + MySQL
Phiên bản tài liệu: **v0.3** — cập nhật ngày 2026-10-20

---

## Trạng thái tài liệu

| File | Nội dung | Trạng thái | Nguồn chân lý cho |
|---|---|---|---|
| [01-requirements.md](01-requirements.md) | Yêu cầu chức năng & phi chức năng | ✅ Đã chốt | Phạm vi, FR, BR, NFR, phân quyền |
| [02-use-cases.md](02-use-cases.md) | Use case + tiêu chí chấp nhận | ✅ Đã chốt | Luồng nghiệp vụ, điều kiện biên |
| [03-data-model.md](03-data-model.md) | ERD, bảng, cột, kiểu, index, ràng buộc | ✅ Đã chốt | Schema database, quy tắc xóa mềm |
| [04-api-contract.md](04-api-contract.md) | Quy ước API + danh sách endpoint | ✅ Đã chốt | Hợp đồng FE ↔ BE |
| [openapi.yaml](openapi.yaml) | Khung OpenAPI 3.1 (sinh model TS phía Angular) | 🚧 Đang bổ sung | Máy đọc hợp đồng API |
| [05-screens.md](05-screens.md) | Danh mục màn hình + điều hướng Angular | ✅ Đã chốt | Cấu trúc frontend |
| [06-test-plan.md](06-test-plan.md) | Ma trận FR/BR → test case | ✅ Đã chốt | Kiểm thử |
| [07-decisions.md](07-decisions.md) | Nhật ký quyết định kiến trúc (ADR) | ✅ Đã chốt | Lý do các lựa chọn |
| [08-roadmap.md](08-roadmap.md) | Kế hoạch triển khai 10 tuần | ✅ Đã chốt | Thứ tự công việc |

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
- **Đánh dấu thay đổi:** `🆕` mới so với v0.2, `✏️` sửa so với v0.2, `❌` bỏ so với v0.2.
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
