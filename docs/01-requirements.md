# 01 — Yêu cầu chức năng & Phi chức năng (FR v0.4)

**Hệ thống quản lý lớp học (Class Management System)**
Phiên bản: **v0.4** — 2026-10-24 · Kế thừa v0.3, sửa 5 lỗi mâu thuẫn/thiếu sót và bổ sung 7 quy tắc nghiệp vụ (BR-23 → BR-29).

---

## Thông tin chung

| Hạng mục | Nội dung |
|---|---|
| Tên đề tài | Hệ thống quản lý lớp học |
| Thời gian | 10 tuần (xem [08-roadmap.md](08-roadmap.md)) |
| Backend | Laravel / PHP 8.3 — REST API, base path `/api`, không đánh số phiên bản |
| Frontend | Angular 22 standalone + TailwindCSS 3 + Angular Material |
| Database | MySQL 8 |
| Xác thực | Laravel Sanctum — personal access token (Bearer) |
| Mô hình đào tạo | Lớp học phần theo học kỳ + đăng ký học phần |
| Tài liệu liên quan | [02-use-cases](02-use-cases.md) · [03-data-model](03-data-model.md) · [04-api-contract](04-api-contract.md) · [05-screens](05-screens.md) · [06-test-plan](06-test-plan.md) · [07-decisions](07-decisions.md) |

---

## Thay đổi so với v0.3

| Hạng mục | v0.3 | v0.4 | Mã |
|---|---|---|---|
| Tên cột khóa | `lop_hanh_chinh.khoa` (nhập nhằng với khoa/faculty) | `khoa_hoc`; thêm `nganh`, `nam_nhap_hoc` | ADR-016 |
| Ràng buộc năm thứ | Không có — sinh viên năm 1 đăng ký được lớp năm 4 | `lop_hoc_phan.nam_thu` + BR-23, ADMIN override | ✏️ |
| Chương trình đào tạo | Nằm lẫn trong danh sách loại trừ, không giải thích | Ghi rõ ở §10.1 kèm lý do và hệ quả | ADR-016 |
| Học kỳ | Không có năm học / kỳ thứ | Thêm `nam_hoc`, `ky_thu`, unique(`nam_hoc`,`ky_thu`) | ADR-016 |
| Vòng đời học kỳ | "Chuyển thủ công", không nói được chuyển nào | Chỉ tiến, một kỳ ONGOING, ghi `nhat_ky` | BR-24, ADR-017 |
| Xóa học kỳ | UPCOMING hoặc ONGOING | Chỉ UPCOMING | ADR-017 |
| Chồng lấn thời gian | Không kiểm tra | Chặn chồng lấn kỳ, đợt đăng ký và buổi học phải trong kỳ | BR-25 |
| "Trong đợt đăng ký" | Không rõ đợt của kỳ nào | Đợt của học kỳ chứa lớp đó | BR-26 |
| Đổi môn lớp học phần | Chỉ chặn khi đã có điểm | Chặn khi có bất kỳ đăng ký khác CANCELLED (đối xứng đổi học kỳ) | ✏️ |
| Học lại môn | GPA cộng cả hai lần | Một lần/môn, lấy điểm cao nhất; thêm CPA (FR-12.08) | BR-28, ADR-018 |
| Đăng ký lại sau hủy | Không nói dữ liệu cũ xử lý sao | Chặn nếu đã có điểm; chuyên cần chỉ tính buổi sau `dang_ky_luc` | BR-27 |
| Hủy lớp đã chốt điểm | Không quy định | Chặn, phải mở khóa điểm trước | BR-29 |
| Sửa điểm danh trên kỳ CLOSED | BR-14 cấm tuyệt đối, mâu thuẫn FR-11.03 | ADMIN được sửa, ghi `nhat_ky` | ADR-017 |
| Đăng ký hàng loạt | Chỉ đăng ký từng sinh viên | Thêm FR-09.07 theo lớp hành chính | 🆕 |
| Mục 10 | Loại trừ "quy đổi điểm chữ/hệ 4" (trái FR-12.03/12.07) | Bỏ dòng đó; thêm §10.1 giới hạn đã biết | ✏️ |
| `vai_tro` trong data model | `sinh_vien` (chữ thường) | `SINH_VIEN` (ADR-015) | ✏️ |
| ERD | Thiếu `diem_chu`, `diem_he_4` | Đã bổ sung | ✏️ |

---

## Thay đổi so với v0.2

| Hạng mục | v0.2 | v0.3 | Mã |
|---|---|---|---|
| Thứ tự triển khai | Section (tuần 5) → Session (tuần 6) → Enrollment | Section → Session → Enrollment; ADMIN đăng ký hộ phải sau khi có buổi học | ✏️ |
| Xóa học kỳ | Bị chặn nếu còn lớp học phần chưa xóa | Học kỳ CLOSED **không xóa**, chỉ lưu trữ. Chỉ xóa được học kỳ UPCOMING/ONGOING chưa có lớp | ✏️ |
| Chốt điểm | `grade.is_finalized` theo từng dòng điểm | Chốt ở cấp `lop_hoc_phan` (`chot_diem_luc`, `chot_diem_boi`); có lịch sử mở khóa | ✏️ |
| Hủy đăng ký | Chỉ đổi trạng thái | Thêm `huy_luc`, `huy_boi`; danh sách điểm danh tính theo mốc ngày buổi học | ✏️ |
| Hủy lớp học phần | Không quy định hệ quả | Đăng ký ACTIVE → CANCELLED, buổi học chưa diễn ra → CANCELLED, dữ liệu cũ giữ nguyên | 🆕 |
| Đăng ký lại sau hủy | Không quy định | Kích hoạt lại bản ghi cũ, không tạo dòng mới | 🆕 |
| Đổi học kỳ/môn của lớp học phần | Không kiểm tra | Chặn đổi học kỳ nếu đã có đăng ký; chặn đổi môn nếu đã có điểm | 🆕 |
| BR-16 | Định nghĩa chung, lệch bảng 6.1 | Bỏ định nghĩa chung, chỉ dùng bảng 6.1 | ✏️ |
| Công thức điểm | 10/30/60 "dự kiến" | **25% chuyên cần + 25% giữa kỳ + 50% cuối kỳ**, thang 10, đạt ≥ 4.0 | ✏️ |
| Cấu hình điểm | Không có bảng | Bảng `cau_hinh` cho trọng số và ngưỡng đạt | 🆕 |
| Audit | Chỉ lịch sử điểm | Thêm bảng `nhat_ky` cho thay đổi trạng thái tài khoản, xóa/khôi phục | 🆕 |
| Session status | Không định nghĩa | `SCHEDULED` / `DONE` / `CANCELLED` | 🆕 |
| Mật khẩu ban đầu | "ADMIN thông báo" | Sinh ngẫu nhiên, trả **một lần** trong response tạo, bắt đổi lần đầu | ✏️ |
| GPA | Không nói rõ | Tính cả môn KHÔNG ĐẠT, trọng số tín chỉ, làm tròn 2 chữ số | ✏️ |
| API docs | "Scribe hoặc OpenAPI" | OpenAPI 3.1 sinh kèm, `openapi.yaml` là hợp đồng chính thức | ✏️ |
| Middleware giờ hành chính | Không có trong tài liệu, nhưng có trong code | Bỏ khỏi API, **xóa hẳn file** | ❌ |
| Định dạng tài liệu | `.docx` | Toàn bộ `.md` | ✏️ |

---

## 1. Mục tiêu và phạm vi

Hệ thống cung cấp nền tảng tập trung quản lý lớp học phần và các hoạt động học tập cơ bản, hoàn thành trong 10 tuần, ưu tiên nghiệp vụ cốt lõi.

**Mục tiêu chính**

1. Quản lý tài khoản và phân quyền theo 3 vai trò ADMIN / TEACHER / STUDENT.
2. Quản lý sinh viên, giảng viên, môn học, học kỳ, phòng học, lớp hành chính.
3. Mở lớp học phần theo môn và học kỳ, phân công giảng viên.
4. Quản lý buổi học, kiểm tra trùng lịch giảng viên, phòng, sinh viên.
5. Đăng ký học phần: ADMIN đăng ký hộ hoặc sinh viên tự đăng ký, có kiểm tra sĩ số và trùng lịch.
6. Điểm danh theo buổi và thống kê chuyên cần.
7. Nhập, tính, chốt điểm và lưu lịch sử sửa điểm.
8. Dashboard theo vai trò.
9. Xóa mềm và khôi phục, bảo toàn lịch sử học tập.

---

## 2. Đối tượng sử dụng

| Actor | Mô tả | Phạm vi chính |
|---|---|---|
| **ADMIN** | Quản trị hệ thống | Toàn bộ danh mục, tài khoản, lớp học phần, đăng ký hộ, lịch học, điểm, xóa mềm/khôi phục, dashboard |
| **TEACHER** | Giảng viên | Xem lớp mình phụ trách, xem sinh viên của lớp, điểm danh, nhập và chốt điểm, dashboard cá nhân |
| **STUDENT** | Sinh viên | Xem lớp đang mở, tự đăng ký/hủy trong đợt, xem lịch, điểm danh và điểm cá nhân, dashboard cá nhân |

> Mỗi tài khoản TEACHER gắn 1-1 với hồ sơ `giang_vien`; STUDENT gắn 1-1 với `sinh_vien`. ADMIN không có hồ sơ riêng.

---

## 3. Mô hình nghiệp vụ

### 3.1. Thuật ngữ

| Thuật ngữ | Ý nghĩa |
|---|---|
| Môn học (Subject) | Danh mục môn: mã, tên, số tín chỉ. Không gắn thời gian hay giảng viên. |
| Học kỳ (Semester) | Khoảng thời gian giảng dạy, có đợt mở/đóng đăng ký. |
| Lớp học phần (Section) | Một lần mở môn trong một học kỳ, do một giảng viên phụ trách, có sĩ số tối đa. Là đơn vị giảng dạy, điểm danh, chấm điểm. |
| Đăng ký học phần (Enrollment) | Việc sinh viên tham gia lớp học phần. Điểm và điểm danh gắn vào bản ghi này. |
| Buổi học (Session) | Một buổi cụ thể của lớp học phần: ngày, giờ bắt đầu/kết thúc, phòng. |
| Phòng học (Room) | Địa điểm học, có sức chứa. Dùng kiểm tra trùng phòng. |
| Lớp hành chính (AdminClass) | Nhãn nhóm sinh viên (ví dụ 65PM1) để lọc và thống kê. Không tham gia giảng dạy. |
| Khóa (Cohort) | `lop_hanh_chinh.khoa_hoc`, ví dụ `K65` — năm nhập học. **Không phải khoa (faculty).** Dùng để tính năm thứ của sinh viên. |
| Năm thứ (Study year) | Sinh viên đang học năm thứ mấy, suy ra từ `nam_nhap_hoc` và năm học của kỳ (`03-data-model.md` §5.6). |
| Xóa mềm | Đánh dấu `deleted_at` thay vì xóa khỏi database. Khác với trạng thái ACTIVE/INACTIVE dùng cho vòng đời nghiệp vụ. |
| Học kỳ hiện tại | Học kỳ `ONGOING` có `ngay_bat_dau` mới nhất; nếu không có, lấy `UPCOMING` có `ngay_bat_dau` gần nhất. |

### 3.2. Chuỗi thực thể

```
MonHoc ─┐
        ├──► LopHocPhan ──► DangKyHocPhan ──► DiemDanh (theo buổi)
HocKy  ─┤         │                └──────► Diem (+ LichSuDiem)
GiangVien ┘        └──► BuoiHoc ◄── PhongHoc
```

### 3.3. Danh sách thực thể

Chi tiết cột, kiểu dữ liệu, index và ràng buộc: [03-data-model.md](03-data-model.md). Dưới đây là danh sách rút gọn.

| Thực thể | Bảng | Thuộc tính chính | Quan hệ |
|---|---|---|---|
| User | `users` | email, password, vai_tro, trang_thai, must_change_password | 1–1 với `sinh_vien` hoặc `giang_vien` (trừ ADMIN) |
| SinhVien | `sinh_vien` | ma_sv, ho_ten, ngay_sinh, gioi_tinh, email, sđt, địa chỉ, lop_hanh_chinh_id, user_id | Thuộc tối đa 1 lớp hành chính; nhiều đăng ký |
| GiangVien | `giang_vien` | ma_gv, ho_ten, email, sđt, chuyen_mon, user_id | Phụ trách nhiều lớp học phần |
| LopHanhChinh | `lop_hanh_chinh` | ma_lop, ten_lop, khoa_hoc, nganh, nam_nhap_hoc, mo_ta, trang_thai | Nhiều sinh viên |
| MonHoc | `mon_hoc` | ma_mon, ten_mon, so_tin_chi, mo_ta, trang_thai | Nhiều lớp học phần |
| HocKy | `hoc_ky` | ma_hoc_ky, ten, nam_hoc, ky_thu, ngay_bat_dau, ngay_ket_thuc, mo_dang_ky, dong_dang_ky, trang_thai | Nhiều lớp học phần |
| PhongHoc | `phong_hoc` | ma_phong, ten_phong, suc_chua, trang_thai | Nhiều buổi học |
| LopHocPhan | `lop_hoc_phan` | ma_lop_hp, mon_hoc_id, hoc_ky_id, giang_vien_id, si_so_toi_da, nam_thu, trang_thai, chot_diem_luc, chot_diem_boi | Nhiều buổi học, nhiều đăng ký |
| DangKyHocPhan | `dang_ky_hoc_phan` | sinh_vien_id, lop_hoc_phan_id, trang_thai, dang_ky_boi, dang_ky_luc, huy_boi, huy_luc | 1–1 với điểm |
| BuoiHoc | `buoi_hoc` | lop_hoc_phan_id, ngay_hoc, gio_bat_dau, gio_ket_thuc, phong_hoc_id, trang_thai, ly_do_huy | Nhiều điểm danh |
| DiemDanh | `diem_danh` | buoi_hoc_id, dang_ky_hoc_phan_id, trang_thai, ghi_chu, diem_danh_boi, diem_danh_luc | — |
| Diem | `diem` | dang_ky_hoc_phan_id, diem_chuyen_can, diem_giua_ky, diem_cuoi_ky, diem_tong_ket, diem_chu, diem_he_4, ket_qua | 1–1 với đăng ký |
| LichSuDiem | `lich_su_diem` | diem_id, truong, gia_tri_cu, gia_tri_moi, nguoi_sua_id, ly_do, thoi_diem | Audit điểm |
| CauHinh | `cau_hinh` | khoa, gia_tri, mo_ta | Trọng số, ngưỡng đạt |
| NhatKy | `nhat_ky` | doi_tuong_loai, doi_tuong_id, hanh_dong, gia_tri_cu, gia_tri_moi, nguoi_thuc_hien_id, thoi_diem | Audit chung |
| Menu | `menu` | ten, url, vi_tri, nhom, vai_tro, thu_tu, trang_thai | Menu động cho Angular |

---

## 4. Yêu cầu chức năng

### FR-01. Xác thực & Tài khoản

| ID | Chức năng | Mô tả | Ưu tiên |
|---|---|---|---|
| FR-01.01 | Đăng nhập | `POST /api/auth/login` bằng email + password. Kiểm tra tài khoản, mật khẩu, `trang_thai`. Trả Bearer token + thông tin user + cờ `must_change_password`. Giới hạn 5 lần/phút/IP. | Must |
| FR-01.02 | Đăng xuất | Thu hồi token hiện tại. | Must |
| FR-01.03 | Quản lý tài khoản | ADMIN xem, tạo, cập nhật, khóa/mở, đặt lại mật khẩu. Đặt lại mật khẩu = cấp mật khẩu mới ngẫu nhiên, trả một lần, đặt `must_change_password = true`. | Must |
| FR-01.04 | Phân quyền | Role ADMIN/TEACHER/STUDENT + Policy kiểm tra sở hữu trên server. Không chỉ ẩn nút ở FE. | Must |
| FR-01.05 | Đổi mật khẩu | Người dùng tự đổi, phải nhập mật khẩu cũ. Khi `must_change_password = true`, **chỉ được gọi** `GET /api/auth/me`, `POST /api/auth/change-password`, `POST /api/auth/logout`; mọi endpoint khác trả `403` mã lỗi `MUST_CHANGE_PASSWORD`. | Must |
| FR-01.06 | Hồ sơ cá nhân | Mọi vai trò xem hồ sơ mình. TEACHER và STUDENT chỉ sửa được: `so_dien_thoai`, `dia_chi`. ADMIN sửa được `name`, `email`. | Should |
| FR-01.07 | Quên mật khẩu | Gửi email đặt lại. Chỉ làm khi cấu hình SMTP. | Could |
| FR-01.08 | Xóa tài khoản | ADMIN xóa mềm tài khoản ADMIN. Tài khoản gắn hồ sơ thì xóa cùng hồ sơ (FR-02.06, FR-04.05). Không tự xóa tài khoản đang đăng nhập, không xóa ADMIN cuối cùng. Token bị thu hồi. | Must |
| FR-01.09 | 🆕 ADMIN xem giao diện theo vai trò | ADMIN chuyển đổi **chế độ xem** sang giao diện TEACHER hoặc STUDENT mà không cần đăng xuất, để kiểm tra phân quyền và giao diện. Chế độ xem chỉ đổi phạm vi hiển thị phía client, **không** cấp quyền ghi của vai trò đó. Xem chi tiết ở mục 4.1. | Should |
| FR-01.10 | 🆕 Ảnh đại diện | Mọi vai trò tải ảnh đại diện của mình qua `POST /api/me/avatar` (multipart, field `anh`). Ảnh lưu trên **Cloudinary** (ADR-019); DB chỉ giữ `avatar_url` và `avatar_public_id`. Nhận JPEG/PNG/WebP/GIF, tối đa 5 MB, tự cắt vuông 512×512. Tải ảnh mới thì xóa ảnh cũ trên Cloudinary. | Should |
| FR-01.11 | 🆕 Gỡ ảnh đại diện | `DELETE /api/me/avatar` xóa ảnh trên Cloudinary và đặt `avatar_url = null`; giao diện quay về ảnh mặc định chữ cái đầu tên. | Should |
| FR-01.12 | 🆕 Khóa / mở tài khoản hàng loạt | ADMIN khóa hoặc mở nhiều tài khoản trong một thao tác (`PATCH /api/users/bulk-status`). Mỗi tài khoản bị khóa đều bị **thu hồi toàn bộ token** (BR-30). Bỏ qua tài khoản đang đăng nhập và ADMIN cuối cùng, trả kết quả từng dòng. | Should |

### FR-02. Quản lý Sinh viên

| ID | Chức năng | Mô tả | Ưu tiên |
|---|---|---|---|
| FR-02.01 | Thêm sinh viên | ADMIN tạo sinh viên + tài khoản STUDENT. Email là duy nhất toàn hệ thống (dùng làm tên đăng nhập). Hệ thống sinh mật khẩu ngẫu nhiên 12 ký tự, **trả một lần** trong response (`mat_khau_ban_dau`), đặt `must_change_password = true`. | Must |
| FR-02.02 | Danh sách | Tìm theo mã, tên, email, SĐT; lọc trạng thái, lớp hành chính, giới tính, khoảng ngày sinh; sắp xếp; phân trang. | Must |
| FR-02.03 | Chi tiết | ADMIN xem đầy đủ. TEACHER xem các trường: `ma_sv`, `ho_ten`, `email`, `so_dien_thoai`, `lop_hanh_chinh`, nhưng **chỉ với sinh viên có đăng ký ACTIVE trong lớp mình phụ trách**. STUDENT xem bản thân. | Must |
| FR-02.04 | Cập nhật | ADMIN sửa mọi trường. STUDENT chỉ sửa `so_dien_thoai`, `dia_chi` qua `/api/me`. | Must |
| FR-02.05 | Trạng thái | ADMIN chuyển ACTIVE/INACTIVE. Sinh viên INACTIVE không đăng ký mới được, dữ liệu cũ giữ nguyên. Ghi `nhat_ky`. | Must |
| FR-02.05b | 🆕 Kích hoạt / khóa hàng loạt | ADMIN chọn nhiều sinh viên và đổi trạng thái một lần (`PATCH /api/students/bulk-status`). Sinh viên bị khóa thì tài khoản kèm theo cũng bị khóa và **thu hồi token** (BR-30). Trả kết quả từng dòng, không rollback toàn bộ khi một dòng lỗi. | Should |
| FR-02.06 | Xóa | Xóa mềm sinh viên + tài khoản. Chặn nếu còn đăng ký ACTIVE ở học kỳ chưa CLOSED (409). Giữ đăng ký, điểm, điểm danh. | Must |
| FR-02.07 | 🆕 Xóa hàng loạt | ADMIN chọn nhiều sinh viên và xóa mềm một lần (`POST /api/students/bulk-delete`). Áp dụng **đúng** điều kiện chặn của FR-02.06 cho từng bản ghi: sinh viên còn đăng ký ACTIVE ở học kỳ chưa CLOSED bị từ chối riêng, các bản ghi khác vẫn xóa được. Trả kết quả từng dòng. | Should |

### FR-03. Quản lý Lớp hành chính

| ID | Chức năng | Mô tả | Ưu tiên |
|---|---|---|---|
| FR-03.01 | Tạo lớp | ADMIN tạo mã, tên, **khóa** (`khoa_hoc`), ngành, năm nhập học, mô tả, trạng thái. | Should |
| FR-03.02 | Danh sách | Hiển thị mã, tên, khóa, ngành, số sinh viên, trạng thái; tìm kiếm/lọc/phân trang. | Should |
| FR-03.03 | Cập nhật | ADMIN sửa thông tin, chuyển ACTIVE/INACTIVE. | Should |
| FR-03.04 | Gán sinh viên | Thêm hoặc chuyển lớp hành chính. Không ảnh hưởng đăng ký, điểm, điểm danh. | Should |
| FR-03.05 | Xóa | Xóa mềm; chặn nếu còn sinh viên chưa xóa (409). | Should |

### FR-04. Quản lý Giảng viên

| ID | Chức năng | Mô tả | Ưu tiên |
|---|---|---|---|
| FR-04.01 | Thêm giảng viên | ADMIN tạo hồ sơ + tài khoản TEACHER, mật khẩu ngẫu nhiên trả một lần, bắt đổi lần đầu. | Must |
| FR-04.02 | Danh sách | Xem, tìm, lọc, phân trang. | Must |
| FR-04.03 | Cập nhật | ADMIN sửa mọi trường; TEACHER chỉ sửa `so_dien_thoai`. | Must |
| FR-04.04 | Trạng thái | Activate/Deactivate. INACTIVE không được gán lớp học phần mới. | Must |
| FR-04.04b | 🆕 Kích hoạt / khóa hàng loạt | ADMIN đổi trạng thái nhiều giảng viên một lần (`PATCH /api/teachers/bulk-status`), thu hồi token của người bị khóa (BR-30), trả kết quả từng dòng. | Should |
| FR-04.05 | Xóa | Xóa mềm + tài khoản. Chặn nếu còn phụ trách lớp học phần chưa xóa thuộc học kỳ chưa CLOSED. Lớp cũ vẫn hiển thị tên giảng viên (kèm nhãn "đã xóa"). | Must |
| FR-04.06 | 🆕 Xóa hàng loạt | ADMIN xóa mềm nhiều giảng viên một lần (`POST /api/teachers/bulk-delete`), áp dụng đúng điều kiện chặn của FR-04.05 cho từng bản ghi. | Should |

### FR-05. Quản lý Môn học

| ID | Chức năng | Mô tả | Ưu tiên |
|---|---|---|---|
| FR-05.01 | Thêm môn | Mã, tên, số tín chỉ (1–10), mô tả, trạng thái. | Must |
| FR-05.02 | Quản lý | Xem, sửa, Activate/Deactivate, tìm kiếm, lọc. Môn INACTIVE không mở lớp mới. | Must |
| FR-05.03 | Xóa | Xóa mềm; chặn nếu còn lớp học phần chưa xóa thuộc học kỳ chưa CLOSED. | Must |
| FR-05.04 | 🆕 Hàng loạt | Đổi trạng thái nhiều môn (`PATCH /api/subjects/bulk-status`) và xóa mềm nhiều môn (`POST /api/subjects/bulk-delete`), mỗi bản ghi áp dụng đúng điều kiện của FR-05.02/05.03. | Could |

### FR-06. Quản lý Học kỳ

| ID | Chức năng | Mô tả | Ưu tiên |
|---|---|---|---|
| FR-06.01 | Tạo học kỳ | Mã, tên, **năm học** (`nam_hoc`), **kỳ thứ** (`ky_thu` 1–3), ngày bắt đầu/kết thúc, thời gian mở/đóng đăng ký. Kiểm tra `ngay_bat_dau < ngay_ket_thuc`, `mo_dang_ky < dong_dang_ky`; `mo_dang_ky` và `dong_dang_ky` nằm trong `[ngay_bat_dau, ngay_ket_thuc]`; không chồng lấn ngày với học kỳ khác (BR-25); `(nam_hoc, ky_thu)` chưa tồn tại. | Must |
| FR-06.02 | Danh sách & cập nhật | Xem, tìm, cập nhật. Cập nhật không được vi phạm FR-06.01. | Must |
| FR-06.03 | Trạng thái | ADMIN chuyển trạng thái **thủ công, chỉ tiến**: `UPCOMING → ONGOING → CLOSED` (BR-24). Không quay lại từ `CLOSED`. Chỉ một học kỳ `ONGOING` tại một thời điểm. Trạng thái không tự đổi theo ngày. Mọi lần chuyển ghi `nhat_ky`. Học kỳ CLOSED chỉ đọc toàn bộ: không tạo/sửa/xóa lớp học phần, buổi học, đăng ký, điểm, điểm danh — **trừ** ADMIN sửa điểm danh (BR-14, ADR-017). | Must |
| FR-06.04 | Xóa | Chỉ xóa mềm được học kỳ `UPCOMING` và **chưa có lớp học phần chưa xóa**. Học kỳ `ONGOING` và `CLOSED` **không được xóa**. | Must |

### FR-07. Quản lý Phòng học

| ID | Chức năng | Mô tả | Ưu tiên |
|---|---|---|---|
| FR-07.01 | Thêm phòng | Mã, tên, sức chứa (> 0), trạng thái. | Must |
| FR-07.02 | Quản lý | Xem, sửa, Activate/Deactivate, tìm kiếm. Phòng INACTIVE không xếp lịch mới. | Must |
| FR-07.03 | Xóa | Xóa mềm; chặn nếu còn buổi học `SCHEDULED` có thời điểm kết thúc > hiện tại. Buổi đã diễn ra giữ nguyên. | Must |
| FR-07.04 | 🆕 Hàng loạt | Đổi trạng thái nhiều phòng (`PATCH /api/rooms/bulk-status`) và xóa mềm nhiều phòng (`POST /api/rooms/bulk-delete`), mỗi bản ghi áp dụng đúng điều kiện của FR-07.02/07.03. | Could |

### FR-08. Quản lý Lớp học phần

| ID | Chức năng | Mô tả | Ưu tiên |
|---|---|---|---|
| FR-08.01 | Mở lớp học phần | Mã lớp, môn, học kỳ, giảng viên, sĩ số tối đa, **năm thứ** (`nam_thu`, tùy chọn — `null` = mọi năm), trạng thái. Chặn nếu môn/giảng viên INACTIVE hoặc học kỳ CLOSED. | Must |
| FR-08.02 | Danh sách & chi tiết | ADMIN xem tất cả; TEACHER xem lớp mình; STUDENT xem lớp OPEN và lớp đã đăng ký. Hiển thị `si_so_hien_tai / si_so_toi_da`. | Must |
| FR-08.03 | Cập nhật | ADMIN sửa thông tin, đổi giảng viên. Đổi giảng viên: kiểm tra trùng lịch của giảng viên mới trên buổi `SCHEDULED` (409 kèm danh sách xung đột). **Đổi học kỳ** hoặc **đổi môn**: chặn nếu lớp đã có bất kỳ đăng ký nào khác CANCELLED (409 `SUBJECT_CHANGE_BLOCKED`). Đổi `nam_thu` không bị chặn nhưng không ảnh hưởng đăng ký đã có. | Must |
| FR-08.04 | Trạng thái | `OPEN` (nhận đăng ký), `CLOSED` (ngừng nhận), `CANCELLED` (hủy lớp). Chuyển sang CANCELLED: đăng ký ACTIVE → CANCELLED (ghi `huy_luc`, `huy_boi`, lý do), buổi `SCHEDULED` → CANCELLED. Không chấp nhận đăng ký mới. **Chặn hủy lớp đã chốt điểm** (409 `GRADE_LOCKED`) — phải mở khóa điểm trước (BR-29). | Must |
| FR-08.05 | Kiểm tra hợp lệ | Mã lớp duy nhất trong học kỳ (kể cả bản ghi xóa mềm); không gán giảng viên/môn INACTIVE; không giảm `si_so_toi_da` dưới số đăng ký ACTIVE; `nam_thu` nếu có phải trong 1–6. | Must |
| FR-08.06 | Xóa | Xóa mềm lớp + các buổi học. Chặn nếu còn đăng ký ACTIVE. Giữ đăng ký CANCELLED, điểm, điểm danh. | Must |

### FR-09. Đăng ký học phần

| ID | Chức năng | Mô tả | Ưu tiên |
|---|---|---|---|
| FR-09.01 | ADMIN đăng ký hộ | Chọn sinh viên + lớp học phần. Không giới hạn đợt đăng ký và **được bỏ qua kiểm tra năm thứ** (BR-23, ghi `nhat_ky`), nhưng vẫn chịu BR-08, BR-09. | Must |
| FR-09.02 | Sinh viên tự đăng ký | Trong đợt đăng ký **của học kỳ chứa lớp đó** (BR-26), xem lớp OPEN còn chỗ và tự đăng ký. Lớp có `nam_thu` phải khớp năm thứ hiện tại của sinh viên (BR-23). | Must |
| FR-09.03 | Hủy đăng ký | ADMIN hủy bất kỳ lúc nào (trừ học kỳ CLOSED). STUDENT tự hủy trong đợt đăng ký **và** khi chưa có điểm/điểm danh. Bản ghi chuyển CANCELLED, ghi `huy_luc`, `huy_boi`. Đăng ký lại = kích hoạt lại bản ghi cũ (BR-20). | Must |
| FR-09.04 | Xem danh sách | ADMIN xem theo sinh viên hoặc lớp; TEACHER xem sinh viên lớp mình; STUDENT xem của mình theo học kỳ. | Must |
| FR-09.05 | Kiểm tra khi đăng ký | Sinh viên ACTIVE; lớp OPEN và thuộc học kỳ chưa CLOSED; chưa có đăng ký ACTIVE ở lớp này; không đăng ký 2 lớp cùng môn trong học kỳ; còn chỗ; không trùng lịch với các buổi `SCHEDULED` của lớp đã đăng ký; trong đợt đăng ký (chỉ với STUDENT tự đăng ký); **khớp năm thứ nếu lớp có `nam_thu`** (chỉ với STUDENT tự đăng ký). Trả 409 kèm mã lỗi cụ thể. | Must |
| FR-09.06 | Ghi nhận người thực hiện | Lưu `dang_ky_boi`, `dang_ky_luc`; khi hủy lưu `huy_boi`, `huy_luc`. | Must |
| FR-09.07 | 🆕 Đăng ký hàng loạt theo lớp hành chính | ADMIN chọn một lớp học phần + nhiều sinh viên (hoặc cả một lớp hành chính) và đăng ký trong một transaction. Trả kết quả từng sinh viên: thành công, hoặc mã lỗi riêng (không rollback toàn bộ vì một sinh viên lỗi). | Should |

### FR-10. Quản lý Lịch học

| ID | Chức năng | Mô tả | Ưu tiên |
|---|---|---|---|
| FR-10.01 | Tạo buổi học | ADMIN tạo buổi cho lớp: ngày, giờ bắt đầu/kết thúc, phòng. Giảng viên lấy từ lớp. Không tạo được nếu học kỳ CLOSED. `ngay_hoc` phải nằm trong `[ngay_bat_dau, ngay_ket_thuc]` của học kỳ (BR-25). | Must |
| FR-10.02 | Sinh lịch hàng tuần | Chọn thứ, giờ, phòng, khoảng ngày. Nếu có bất kỳ buổi trùng, **không tạo buổi nào** và trả danh sách trùng (409). Kiểm tra trùng giảng viên, phòng **và sinh viên đã đăng ký**. Khoảng ngày phải nằm trong học kỳ; ngày sinh ra vượt quá `ngay_ket_thuc` thì dừng, không báo lỗi. | Should |
| FR-10.03 | Xem lịch | ADMIN xem toàn bộ, lọc theo học kỳ/giảng viên/phòng; TEACHER xem lịch mình; STUDENT xem thời khóa biểu từ lớp đã đăng ký. | Must |
| FR-10.04 | Kiểm tra trùng lịch | Không trùng thời gian với cùng giảng viên hoặc cùng phòng. Trùng khi `bat_dau_moi < ket_thuc_cu` **và** `ket_thuc_moi > bat_dau_cu` trong cùng ngày; liền kề không tính trùng; khi sửa loại chính bản ghi đang sửa. Sinh viên được kiểm tra khi đăng ký và khi sinh/sửa lịch. | Must |
| FR-10.05 | Sửa buổi học | Đổi giờ/phòng/ngày. Nếu đã có điểm danh, yêu cầu `xac_nhan = true`, trả cảnh báo. Kiểm tra trùng lịch sau khi sửa. | Should |
| FR-10.06 | Xóa buổi học | Xóa mềm. Nếu đã có điểm danh, yêu cầu `xac_nhan = true`; dữ liệu điểm danh giữ nguyên. | Must |

### FR-11. Điểm danh

| ID | Chức năng | Mô tả | Ưu tiên |
|---|---|---|---|
| FR-11.01 | Điểm danh theo buổi | TEACHER mở danh sách sinh viên **có đăng ký ACTIVE tại thời điểm buổi học** (đăng ký trước hoặc trong ngày buổi học, và chưa hủy trước buổi). Đánh dấu trạng thái từng người. | Must |
| FR-11.02 | Trạng thái | `PRESENT`, `LATE`, `ABSENT`, `EXCUSED`; có ghi chú. | Must |
| FR-11.03 | Sửa điểm danh | TEACHER sửa trong 7 ngày kể từ thời điểm kết thúc buổi học; quá hạn chỉ ADMIN sửa. **ADMIN sửa được cả khi học kỳ đã CLOSED** (ngoại lệ duy nhất của BR-14, ADR-017). Mọi sửa đổi ghi `nhat_ky`. | Should |
| FR-11.04 | Lịch sử | TEACHER xem theo lớp/buổi; STUDENT xem của mình; ADMIN xem toàn bộ. | Must |
| FR-11.05 | Thống kê chuyên cần | Tổng buổi đã điểm danh, có mặt, đi muộn, vắng có phép, vắng không phép, tỷ lệ chuyên cần. Công thức: `(PRESENT + LATE) / (tong_buoi_da_diem_danh − EXCUSED)`, chỉ tính buổi có `ngay_hoc >= dang_ky_luc` (BR-27). Nếu mẫu số = 0 trả `null`. | Must |

### FR-12. Quản lý Điểm

| ID | Chức năng | Mô tả | Ưu tiên |
|---|---|---|---|
| FR-12.01 | Nhập điểm | TEACHER nhập điểm chuyên cần, giữa kỳ, cuối kỳ cho sinh viên đã đăng ký ACTIVE trong lớp mình phụ trách. Hỗ trợ nhập từng dòng và hàng loạt. Điểm 0–10, tối đa 2 chữ số thập phân. | Must |
| FR-12.02 | Cập nhật điểm | Khi lớp chưa chốt điểm. Mọi thay đổi ghi `lich_su_diem` (ai, khi nào, giá trị cũ/mới, lý do nếu có). | Must |
| FR-12.03 | Tính điểm tổng kết | Công thức cố định: **chuyên cần 25% + giữa kỳ 25% + cuối kỳ 50%**, thang 10, làm tròn 2 chữ số. Sau đó tra bảng quy đổi để lấy **điểm chữ** và **điểm hệ 4**: A = 8.5–10.0 (4.0), B = 7.0–8.49 (3.0), C = 5.5–6.99 (2.0), D = 4.0–5.49 (1.0), F = dưới 4.0 (0.0). `ket_qua = DAT` với A/B/C/D, `KHONG_DAT` với F. Trọng số và bảng quy đổi đọc từ `cau_hinh`, không hard-code. | Must |
| FR-12.04 | Chốt điểm | TEACHER chốt điểm **của lớp học phần**. Lưu `chot_diem_luc`, `chot_diem_boi`. Sau khi chốt, mọi sửa điểm trả 409. ADMIN mở khóa kèm lý do, lưu vào `nhat_ky`; mở khóa không xóa lịch sử. | Should |
| FR-12.05 | Xem điểm | STUDENT xem điểm thành phần, tổng kết, **điểm chữ**, **điểm hệ 4**, kết quả, GPA học kỳ (cả hệ 10 và hệ 4, trọng số tín chỉ, tính cả môn KHÔNG ĐẠT, làm tròn 2 chữ số, **học lại lấy điểm cao nhất** theo BR-28). TEACHER xem lớp mình; ADMIN xem toàn bộ. | Must |
| FR-12.06 | Công thức theo môn | Cho phép cấu hình trọng số riêng từng môn. | Could |
| FR-12.07 | Bảng quy đổi điểm chữ | 🆕 ADMIN xem và sửa bảng quy đổi điểm chữ ↔ hệ 4 trong màn cấu hình. Hệ thống kiểm tra khoảng không chồng lấn và phủ kín 0–10. Mặc định: A ≥ 8.5, B ≥ 7.0, C ≥ 5.5, D ≥ 4.0, F < 4.0. Không hỗ trợ mức `+`/`−` ở bản 1. | Should |
| FR-12.08 | 🆕 GPA tích lũy (CPA) | STUDENT xem GPA học kỳ và **GPA tích lũy** (toàn bộ học kỳ đã CLOSED), cả hệ 10 và hệ 4, cùng tổng tín chỉ tích lũy và số tín chỉ đạt. Học lại lấy điểm cao nhất (BR-28). Endpoint `GET /api/me/gpa`. | Should |

### FR-13. Dashboard & Thống kê

| ID | Chức năng | Mô tả | Ưu tiên |
|---|---|---|---|
| FR-13.01 | ADMIN | Số sinh viên, giảng viên, môn học; số lớp học phần và tỷ lệ lấp đầy (`tong_dang_ky_active / tong_si_so_toi_da`) của học kỳ hiện tại; số đăng ký. | Should |
| FR-13.02 | TEACHER | Lớp phụ trách trong học kỳ hiện tại, buổi sắp tới, buổi chưa điểm danh. | Should |
| FR-13.03 | STUDENT | Học phần đã đăng ký, thời khóa biểu tuần, GPA, tỷ lệ chuyên cần. | Should |

### FR-14. Xóa mềm & Khôi phục

| ID | Chức năng | Mô tả | Ưu tiên |
|---|---|---|---|
| FR-14.01 | Cơ chế | Các bảng được xóa mềm dùng `deleted_at`, `deleted_by`, `restored_by`. Bản ghi đã xóa ẩn khỏi danh sách/tìm kiếm/dropdown mặc định. | Must |
| FR-14.02 | Giữ lịch sử | Điểm, điểm danh, đăng ký cũ vẫn hiển thị đầy đủ tên sinh viên, môn, giảng viên, phòng, kèm nhãn "đã xóa". | Must |
| FR-14.03 | Danh sách đã xóa | ADMIN xem theo loại thực thể; tìm kiếm, lọc theo người xóa và thời gian xóa. | Should |
| FR-14.04 | Khôi phục | ADMIN khôi phục. Kiểm tra bản ghi cha chưa bị xóa (khôi phục lớp khi môn đã xóa → 409). Khôi phục sinh viên/giảng viên thì khôi phục kèm tài khoản. Ghi `restored_by`. | Should |
| FR-14.05 | Kiểm tra điều kiện xóa | Trước khi xóa, kiểm tra phụ thuộc đang hoạt động (mục 6.1). Nếu bị chặn trả 409 kèm `ma_loi` và lý do cụ thể. | Must |

---

## 5. Ma trận quyền chức năng

Chữ **D** trong CRUD luôn là xóa mềm.

| Chức năng | ADMIN | TEACHER | STUDENT |
|---|---|---|---|
| Tài khoản | CRUD, khóa, đặt lại mật khẩu, khóa hàng loạt | Đổi mật khẩu của mình | Đổi mật khẩu của mình |
| Ảnh đại diện | Tải, gỡ của mình | Tải, gỡ của mình | Tải, gỡ của mình |
| Sinh viên | CRUD, hàng loạt (trạng thái, xóa) | Xem (sinh viên lớp mình, trường giới hạn) | Xem, sửa hạn chế (bản thân) |
| Lớp hành chính | CRUD | – | Xem lớp của mình |
| Giảng viên | CRUD | Xem, sửa hạn chế (bản thân) | – |
| Môn học | CRUD | Xem | Xem |
| Học kỳ | CRUD | Xem | Xem |
| Phòng học | CRUD | Xem | – |
| Lớp học phần | CRUD | Xem (lớp mình phụ trách) | Xem (lớp OPEN và lớp đã đăng ký) |
| Đăng ký học phần | CRUD (đăng ký hộ, hủy, đăng ký hàng loạt) | Xem (sinh viên lớp mình) | Đăng ký, hủy, xem bản thân (trong đợt) |
| Lịch học | CRUD | Xem (lịch của mình) | Xem (lớp đã đăng ký) |
| Điểm danh | Xem, sửa quá hạn | CRUD (lớp mình) | Xem của bản thân |
| Điểm | Xem, mở khóa điểm | CRUD khi chưa chốt (lớp mình) | Xem của bản thân |
| Dashboard | Đầy đủ | Theo phạm vi giảng dạy | Theo cá nhân |
| Xóa mềm / Khôi phục | Xóa mềm và khôi phục | – | – |
| Menu động | CRUD | Xem menu của mình | Xem menu của mình |
| Cấu hình | CRUD | – | – |

---

## 6. Business Rules

| ID | Quy tắc |
|---|---|
| BR-01 | Mã sinh viên, giảng viên, môn học, phòng học, lớp hành chính phải duy nhất; mã lớp học phần duy nhất trong cùng học kỳ. Ràng buộc unique **tính cả bản ghi đã xóa mềm** — mã đã xóa không dùng lại được; muốn dùng lại thì khôi phục bản ghi cũ. |
| BR-02 | Chỉ tài khoản `trang_thai = true` mới đăng nhập được. |
| BR-03 | TEACHER chỉ điểm danh và nhập điểm cho lớp học phần mình phụ trách. |
| BR-04 | STUDENT chỉ xem dữ liệu cá nhân và dữ liệu lớp mình đã đăng ký. |
| BR-05 | Điểm nằm trong khoảng 0–10, tối đa 2 chữ số thập phân. |
| BR-06 | Không trùng lịch cho cùng giảng viên hoặc cùng phòng. Hai khoảng trùng khi `bat_dau_moi < ket_thuc_cu` và `ket_thuc_moi > bat_dau_cu` trong cùng ngày; liền kề không tính trùng; khi sửa loại chính bản ghi đang sửa. |
| BR-07 | Mọi thao tác xóa là xóa mềm; không xóa cứng qua giao diện. Trạng thái nghiệp vụ tách biệt với xóa mềm. |
| BR-08 | Một sinh viên không đăng ký 2 lớp cùng môn trong cùng học kỳ, và không đăng ký lớp có buổi `SCHEDULED` trùng thời gian với lớp đã đăng ký. |
| BR-09 | Số đăng ký ACTIVE của lớp không vượt `si_so_toi_da`. Đăng ký chỗ cuối phải an toàn khi đồng thời: transaction + `lockForUpdate` trên dòng lớp học phần. |
| BR-10 | STUDENT chỉ tự đăng ký/hủy trong đợt đăng ký của học kỳ chứa lớp đó (BR-26). ADMIN không bị giới hạn đợt nhưng vẫn tuân BR-08, BR-09 — riêng BR-23 được bỏ qua (xem BR-23). |
| BR-11 | STUDENT không tự hủy khi đăng ký đã có điểm hoặc điểm danh (bản ghi có ít nhất một giá trị khác null). Hủy chuyển CANCELLED, giữ lịch sử. |
| BR-12 | Mỗi đăng ký lưu người thực hiện và thời điểm; mỗi hủy lưu người hủy và thời điểm. |
| BR-13 | Điểm đã chốt bị khóa; chỉ ADMIN mở khóa kèm lý do. Mọi thay đổi điểm ghi lịch sử. |
| BR-14 | Học kỳ CLOSED chỉ đọc toàn bộ: không sửa đăng ký, điểm danh, điểm, lớp học phần, buổi học. **Ngoại lệ duy nhất:** ADMIN được sửa điểm danh trên học kỳ CLOSED, có ghi `nhat_ky` (ADR-017). |
| BR-15 | Giảng viên, môn học, phòng học, sinh viên INACTIVE không dùng cho thao tác tạo mới, nhưng giữ nguyên dữ liệu đã phát sinh. |
| BR-16 | Bảng 6.1 là nguồn duy nhất định nghĩa điều kiện chặn xóa. |
| BR-17 | Xóa mềm không làm mất dữ liệu liên quan. Một số xóa kéo theo bản ghi con: sinh viên/giảng viên kèm tài khoản; lớp học phần kèm buổi học. |
| BR-18 | Chỉ khôi phục khi bản ghi cha chưa bị xóa. Khôi phục sinh viên/giảng viên thì khôi phục kèm tài khoản. |
| BR-19 | Không tự xóa tài khoản đang đăng nhập; không xóa ADMIN cuối cùng. |
| BR-20 | 🆕 Đăng ký lại sau khi hủy: kích hoạt lại bản ghi cũ (trạng thái ACTIVE, cập nhật `dang_ky_boi`, `dang_ky_luc`), không tạo dòng mới, sau khi kiểm tra lại toàn bộ FR-09.05. |
| BR-21 | 🆕 Điểm danh chỉ áp dụng cho đăng ký ACTIVE tại thời điểm buổi học. Đăng ký hủy trước buổi không xuất hiện trong danh sách. |
| BR-22 | 🆕 Chỉnh lịch sau khi đã có đăng ký phải kiểm tra lại trùng lịch sinh viên; nếu phát sinh xung đột, trả 409 kèm danh sách để ADMIN quyết định. |
| BR-23 | 🆕 **Năm thứ.** `nam_thu` của sinh viên tính theo `03-data-model.md` §5.6. Lớp có `lop_hoc_phan.nam_thu` khác null: STUDENT tự đăng ký chỉ được khi `nam_thu` khớp, sai → 409 `WRONG_STUDY_YEAR`. ADMIN đăng ký hộ được bỏ qua kiểm tra này, ghi `nhat_ky`. Nếu không tính được `nam_thu` (thiếu lớp hành chính hoặc `nam_nhap_hoc`) thì **không chặn**. |
| BR-24 | 🆕 **Vòng đời học kỳ.** Chỉ chuyển tiến `UPCOMING → ONGOING → CLOSED`; `CLOSED` là trạng thái cuối. Chỉ một học kỳ `ONGOING` tại một thời điểm. Mọi lần chuyển ghi `nhat_ky`. |
| BR-25 | 🆕 **Thời gian học kỳ.** Hai học kỳ không chồng lấn `[ngay_bat_dau, ngay_ket_thuc]`; đợt đăng ký nằm trong khoảng ngày của kỳ; `ngay_hoc` của mọi buổi nằm trong khoảng ngày của kỳ. |
| BR-26 | 🆕 **Đợt đăng ký theo học kỳ của lớp.** "Trong đợt đăng ký" nghĩa là thời điểm hiện tại nằm trong `[mo_dang_ky_luc, dong_dang_ky_luc]` của **học kỳ chứa lớp muốn đăng ký**, không phải học kỳ hiện tại. |
| BR-27 | 🆕 **Đăng ký lại và dữ liệu cũ.** Đăng ký lại bị chặn khi bản ghi đã có `diem` (409 `HAS_GRADE_OR_ATTENDANCE`). `diem_danh` cũ giữ nguyên; chuyên cần chỉ tính buổi có `ngay_hoc >= dang_ky_luc` hiện tại. |
| BR-28 | 🆕 **Học lại.** GPA học kỳ và GPA tích lũy tính **một lần cho mỗi môn**, lấy `diem_tong_ket` cao nhất trong các lần học. Điểm lần không được chọn vẫn lưu và vẫn hiển thị trong lịch sử. |
| BR-29 | 🆕 **Hủy lớp đã chốt điểm.** Không cho chuyển lớp sang `CANCELLED` khi `chot_diem_luc` khác null (409 `GRADE_LOCKED`). Phải mở khóa điểm trước. |
| BR-30 | 🆕 **Khóa tài khoản thì thu hồi token.** Chuyển `users.trang_thai = false` phải xóa toàn bộ `personal_access_tokens` của người đó. Nếu không, token còn hạn 7 ngày vẫn dùng được và việc khóa trở nên vô nghĩa. Áp dụng cho khóa đơn lẻ lẫn hàng loạt. Ghi `nhat_ky`. |
| BR-31 | 🆕 **Ngữ nghĩa thao tác hàng loạt.** Mọi endpoint `*/bulk-*` xử lý **từng bản ghi độc lập**: một dòng vi phạm điều kiện nghiệp vụ bị từ chối riêng, các dòng còn lại vẫn thành công. Response luôn 200 với `{thanh_cong, that_bai, chi_tiet[]}`, mỗi dòng có `ma_loi` nếu lỗi. Chỉ rollback khi lỗi hạ tầng (mất kết nối DB). Danh sách rỗng → 422. Tối đa 500 bản ghi mỗi lần. |

### 6.1. Điều kiện xóa mềm theo thực thể

| Thực thể | Bị chặn xóa khi | Xóa kèm / giữ lại |
|---|---|---|
| User (ADMIN) | Là tài khoản đang đăng nhập hoặc ADMIN cuối cùng | Thu hồi toàn bộ token |
| Sinh viên | Còn đăng ký ACTIVE ở học kỳ chưa CLOSED | Xóa kèm tài khoản; giữ đăng ký, điểm, điểm danh |
| Lớp hành chính | Còn sinh viên chưa xóa thuộc lớp | – |
| Giảng viên | Còn phụ trách lớp học phần chưa xóa thuộc học kỳ chưa CLOSED | Xóa kèm tài khoản; giữ lớp cũ |
| Môn học | Còn lớp học phần chưa xóa thuộc học kỳ chưa CLOSED | Giữ lớp cũ |
| Học kỳ | Học kỳ `ONGOING` hoặc `CLOSED`, hoặc còn lớp học phần chưa xóa | – |
| Phòng học | Còn buổi `SCHEDULED` có thời điểm kết thúc > hiện tại | Giữ buổi đã diễn ra |
| Lớp học phần | Còn đăng ký ACTIVE | Xóa kèm buổi học; giữ đăng ký CANCELLED, điểm, điểm danh |
| Buổi học | Không chặn; cảnh báo nếu đã có điểm danh | Giữ điểm danh (ẩn cùng buổi) |
| Đăng ký học phần | Không có xóa riêng: dùng hủy đăng ký | – |
| Điểm danh, Điểm | Không có xóa riêng: sửa bằng cập nhật có lịch sử | Giữ khi đăng ký/buổi bị xóa |

---

## 7. Yêu cầu phi chức năng

| ID | Nhóm | Yêu cầu |
|---|---|---|
| NFR-01 | Bảo mật | Mật khẩu băm bcrypt; giới hạn đăng nhập 5 lần/phút/IP; CORS chỉ cho origin Angular; mọi endpoint trừ login yêu cầu `auth:sanctum`; kiểm tra quyền ở server; token có hạn 7 ngày và thu hồi được. |
| NFR-02 | Quy ước API | Base `/api`, không version. JSON. Tài nguyên số nhiều. Envelope thống nhất: `{success, message, data}`; danh sách thêm `meta`, `links`. Mã trạng thái: 200/201/204, 401, 403, 404, 409 (xung đột nghiệp vụ), 422 (lỗi theo trường), 429 (rate limit). |
| NFR-03 | Tài liệu API | `openapi.yaml` (OpenAPI 3.1) là hợp đồng chính thức, sinh kèm Postman collection. Cập nhật cùng commit với code. |
| NFR-04 | Toàn vẹn dữ liệu | Khóa ngoại và unique index ở database; đăng ký, sinh lịch, nhập điểm hàng loạt, hủy lớp chạy trong transaction. |
| NFR-05 | Audit | Ghi `lich_su_diem` cho mọi thay đổi điểm; `nhat_ky` cho thay đổi trạng thái tài khoản, chuyển trạng thái học kỳ, đăng ký hộ bỏ qua kiểm tra năm thứ, mở khóa điểm, xóa và khôi phục bản ghi. |
| NFR-06 | Hiệu năng | Mọi danh sách phân trang; index cho khóa ngoại và cột tìm kiếm/lọc; eager loading tránh N+1. Mục tiêu < 500 ms với dữ liệu demo: 500 sinh viên, 50 giảng viên, 100 môn, 200 lớp học phần, 20.000 buổi học, 50.000 đăng ký. |
| NFR-07 | Giao diện | Tiếng Việt, responsive (desktop ưu tiên, dùng được tablet/điện thoại), thông báo lỗi rõ ràng, xác nhận trước thao tác nhạy cảm. |
| NFR-08 | Thời gian | Múi giờ `Asia/Ho_Chi_Minh` thống nhất backend, database, frontend. Lưu thời gian dạng `datetime` local, không UTC. |
| NFR-09 | Kiểm thử | Feature Test cho phân quyền, đăng ký (sĩ số, trùng lịch), trùng lịch giảng viên/phòng, tính điểm, chốt điểm, xóa mềm, khôi phục. Test viết song song từng tuần; seeder dữ liệu demo. |
| NFR-10 | Triển khai | Staging từ tuần 3 bằng Docker Compose (PHP-FPM + Nginx + MySQL + Angular build tĩnh). Cấu hình qua `.env`; README hướng dẫn cài đặt. |

---

## 8. Kiến trúc tổng thể

```
User → Angular SPA → HTTP/REST (/api) → Laravel API → MySQL
```

| Tầng | Công nghệ | Trách nhiệm |
|---|---|---|
| Presentation | Angular 22 + Tailwind + Material | Component, routing, form, validation client, hiển thị |
| API | Laravel Route + Controller + Form Request + API Resource | Nhận request, validate, trả JSON |
| Business | Laravel Service + Policy | Nghiệp vụ đăng ký, trùng lịch, điểm danh, tính điểm, kiểm tra sở hữu |
| Data Access | Eloquent ORM | Model, relationship, transaction |
| Database | MySQL 8 | Lưu trữ toàn bộ dữ liệu |

### 8.1. Xác thực & phân quyền

- **Sanctum personal access token (Bearer)**, hạn 7 ngày, thu hồi khi logout hoặc khóa/xóa tài khoản.
- **Role** cột `vai_tro` + **Policy** kiểm tra sở hữu. Các policy: `LopHocPhanPolicy` (giảng viên có phụ trách lớp không), `DangKyHocPhanPolicy`, `DiemPolicy`, `DiemDanhPolicy`, `SinhVienPolicy`.
- Middleware `must_change_password` chặn mọi endpoint trừ 3 endpoint cho phép ở FR-01.05.

### 8.1.1. Chế độ xem theo vai trò của ADMIN (FR-01.09)

**Mục đích:** ADMIN kiểm tra giao diện và phân quyền của TEACHER/STUDENT mà không phải đăng xuất, không cần tạo tài khoản giả.

**Mô hình:** đây là **chế độ xem (view-as) phía client**, không phải đổi danh tính trên server.

| Khía cạnh | Hành vi |
|---|---|
| Kích hoạt | ADMIN chọn "Xem như Giảng viên" / "Xem như Sinh viên" trên header |
| Lưu trạng thái | `localStorage` khóa `xem_nhu_vai_tro`, không gửi lên server, không đổi token |
| Đổi giao diện | Ẩn/hiện menu, nút, cột theo vai trò đang xem |
| Dữ liệu | Giữ nguyên phạm vi ADMIN — xem được mọi lớp/sinh viên |
| Ghi dữ liệu | **Vẫn dùng quyền ADMIN thật**. Hệ thống không giả lập 403 của TEACHER |
| Hiển thị | Banner cố định "Đang xem với vai trò Giảng viên — quay lại ADMIN" |
| Thoát | Nút trên banner hoặc chọn lại ADMIN; xóa khóa `localStorage` |
| Phiên mới | Mặc định về ADMIN |

**Giới hạn cần nêu rõ với người dùng:** vì server vẫn thấy ADMIN, chế độ này **không kiểm chứng được phân quyền server**. Muốn kiểm chứng thật phải đăng nhập bằng tài khoản TEACHER/STUDENT thật. Đây là công cụ xem giao diện, không phải công cụ test bảo mật.

**Phương án bị loại:** cấp token tạm mang vai trò khác (vi phạm nguyên tắc ADMIN không được mạo danh, và làm mờ ranh giới audit); tạo tài khoản demo riêng (đăng nhập lại, không giải quyết yêu cầu).

### 8.2. Cấu trúc backend

```
app/
  Http/Controllers/Api/      # 1 controller / resource
  Http/Requests/             # Form Request, message tiếng Việt
  Http/Resources/            # API Resource
  Http/Middleware/           # auth, role, must_change_password
  Models/
  Policies/
  Services/                  # DangKyService, LichHocService, DiemDanhService, DiemService
  Traits/ApiResponse.php
```

Quy ước: controller mỏng, nghiệp vụ ở Service, validate ở Form Request, response qua Resource.

### 8.3. Cấu trúc frontend

```
src/app/
  core/        # auth service, interceptor, guard, models, api services
  shared/      # table, pagination, modal, confirm, form field, badge
  features/    # auth, dashboard, sinh-vien, giang-vien, mon-hoc, hoc-ky,
               # phong-hoc, lop-hanh-chinh, lop-hoc-phan, dang-ky, lich-hoc,
               # diem-danh, diem, thung-rac, menu, cau-hinh
```

---

## 9. Công nghệ sử dụng

| Nhóm | Công nghệ | Ghi chú |
|---|---|---|
| Backend | PHP 8.3 + Laravel 13 | REST API |
| Frontend | Angular 22 (standalone, signals) | SPA |
| UI | TailwindCSS 3 + Angular Material 22 | Responsive |
| Database | MySQL 8 | Local/staging |
| ORM | Eloquent | |
| Auth | Sanctum token | |
| API docs | OpenAPI 3.1 | `openapi.yaml` |
| Version control | Git + GitHub | |
| Testing | PHPUnit Feature Test | Vitest cho Angular nếu cần |
| Deploy | Docker Compose | Staging + demo |

---

## 10. Phạm vi không thực hiện

- Học phí, thanh toán, online exam, chat/notification realtime, AI, mobile app.
- Ký túc xá, thư viện, nghiệp vụ toàn trường.
- Import/export dữ liệu phức tạp.
- Môn tiên quyết, giới hạn tín chỉ/học kỳ, danh sách chờ khi lớp đầy.
- ADMIN vượt sĩ số (override) khi đăng ký hộ.
- Xóa vĩnh viễn qua giao diện; tự động dọn bản ghi xóa mềm.
- Ràng buộc sức chứa phòng với sĩ số lớp (chỉ cảnh báo ở UI).

### 10.1. Giới hạn đã biết

Các mục dưới đây **cố ý** không làm ở bản 1. Đây là quyết định phạm vi, không phải thiếu sót — ghi ra để người đọc không hiểu nhầm là lỗi.

| Hạng mục | Vì sao không làm | Hệ quả chấp nhận |
|---|---|---|
| **Chương trình đào tạo** (ngành × kỳ thứ → môn) | Muốn đúng hoàn toàn phải có cả **khoa** (faculty) vì chương trình 4 năm của Khoa CNTT khác Khoa Cơ khí. Đó là nghiệp vụ phòng đào tạo, vượt phạm vi quản lý lớp học 10 tuần (ADR-016) | Hệ thống **không** biết môn nào bắt buộc ở kỳ nào, không biết tiên quyết. Ràng buộc duy nhất là `lop_hoc_phan.nam_thu` (BR-23) — thô nhưng chặn được lỗi rõ ràng nhất: sinh viên năm 1 đăng ký lớp dành cho năm 4 |
| **Bảng khoa (faculty)** và ràng buộc khoa ↔ ngành | Cùng lý do trên | `lop_hanh_chinh.nganh` chỉ là nhãn tự do để lọc/thống kê, không có ràng buộc |
| **Đợt đăng ký riêng theo khóa** | Thực tế K68 thường đăng ký sớm hơn K65, nhưng mô hình chỉ có một cửa sổ cho cả học kỳ | Mọi khóa dùng chung một đợt |
| **Tuần điều chỉnh (add/drop)** sau khi kỳ bắt đầu | Mô hình chỉ có một cửa sổ trước kỳ | Sinh viên không thêm/hủy được sau khi đợt đóng |
| **Lịch ngày lễ** | Cần bảng ngày lễ cấp trường | Sinh lịch hàng tuần tạo buổi cả vào ngày lễ; ADMIN phải hủy tay |
| **Trạng thái học tập** (bảo lưu, thôi học, tốt nghiệp, đình chỉ) | Chỉ có boolean `trang_thai` | Không phân biệt được sinh viên bảo lưu với sinh viên đã tốt nghiệp |
| **CPA và tín chỉ tích lũy ngoài phạm vi học kỳ** | Đã có FR-12.08 ở mức Should | Nếu cắt FR-12.08 thì BR-28 chỉ còn tác dụng trong một kỳ (nơi BR-08 đã cấm học lại) |
| **Job tự chuyển buổi học quá hạn sang `DONE`** | Cần scheduler; không đáng cho đồ án | Buổi không ai điểm danh nằm `SCHEDULED` mãi; dùng bộ lọc "chờ điểm danh" ở dashboard thay thế |
| **Quy đổi điểm chữ có mức `+`/`−`** | Bảng chính thức của trường không có | Cấu hình được qua `cau_hinh` khi cần, không cần sửa code |

---

## 11. Câu hỏi đã chốt

| # | Câu hỏi | Quyết định |
|---|---|---|
| 1 | Công thức điểm | **25% chuyên cần + 25% giữa kỳ + 50% cuối kỳ**, thang 10, đạt ≥ 4.0 |
| 2 | Công thức chuyên cần | `(PRESENT + LATE) / (tổng buổi đã điểm danh − EXCUSED)`; mẫu số 0 → `null` |
| 3 | Điểm chuyên cần nhập tay hay tự tính | Nhập tay; hiển thị tỷ lệ chuyên cần để tham khảo |
| 4 | Xác thực | Sanctum Bearer token |
| 5 | Buổi học theo giờ hay tiết | Giờ bắt đầu/kết thúc cụ thể |
| 6 | Đợt đăng ký theo học kỳ hay lớp | Theo học kỳ |
| 7 | Đăng ký lại môn đã học kỳ trước | Cho phép, không kiểm tra lịch sử |
| 8 | Thời hạn sửa điểm danh | 7 ngày sau buổi học |
| 9 | Mật khẩu ban đầu | Ngẫu nhiên 12 ký tự, trả một lần cho ADMIN, bắt đổi lần đầu |
| 10 | Dùng lại mã bản ghi đã xóa | Không; phải khôi phục |
| 11 | Thời gian lưu bản ghi xóa mềm | Vô thời hạn |
| 12 | Học kỳ CLOSED | Không xóa, lưu trữ vĩnh viễn |
| 13 | GPA | Tính cả môn KHÔNG ĐẠT, trọng số tín chỉ, làm tròn 2 chữ số |
| 14 | Đăng nhập | Email duy nhất trên `users`, đồng bộ 1-1 với hồ sơ |
| 15 | Menu động | Giữ, expose qua `/api/menus` |
| 16 | Điểm chữ & hệ 4 | A = 8.5–10 (4.0), B = 7.0–8.49 (3.0), C = 5.5–6.99 (2.0), D = 4.0–5.49 (1.0), F < 4.0 (0.0); không dùng mức `+` ở bản 1 |
| 17 | ADMIN xem theo vai trò | Chế độ xem phía client, không đổi token, không giả lập quyền server |
| 18 | Học kỳ phụ thuộc khóa sinh viên? | **Không.** Học kỳ là trục thời gian toàn trường; khóa là thuộc tính của sinh viên (qua lớp hành chính). Ràng buộc năm thứ đặt ở `lop_hoc_phan.nam_thu` (BR-23), không đặt ở học kỳ |
| 19 | Chương trình đào tạo | Ngoài phạm vi bản 1 (mục 10.1, ADR-016). Cần cả khoa + ngành + chương trình — nghiệp vụ phòng đào tạo |
| 20 | Tên cột `khoa` | Đổi thành `khoa_hoc` để phân biệt **khóa** (cohort) với **khoa** (faculty) |
| 21 | Học lại môn | GPA tính một lần/môn, lấy điểm cao nhất (BR-28, ADR-018) |
| 22 | Vòng đời học kỳ | Chỉ tiến, một kỳ ONGOING tại một thời điểm, CLOSED không quay lại (BR-24, ADR-017) |
| 23 | Sửa điểm danh trên kỳ CLOSED | Chỉ ADMIN, có ghi `nhat_ky` — ngoại lệ duy nhất của BR-14 |
| 24 | Buổi quá hạn không điểm danh | Giữ `SCHEDULED`, không chạy job tự động; dashboard có bộ lọc "chờ điểm danh" |
| 25 | Ảnh đại diện | Một cột `users.avatar_url` cho cả 3 vai trò, lưu trên Cloudinary (ADR-019) |
| 26 | Khóa tài khoản | Phải thu hồi token ngay, nếu không token 7 ngày vẫn dùng được (BR-30) |
| 27 | Thao tác hàng loạt | Xử lý từng dòng độc lập, luôn 200 kèm kết quả chi tiết; không all-or-nothing (BR-31) |
