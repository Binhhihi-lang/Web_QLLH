# 06 — Kế hoạch kiểm thử

**Công cụ:** PHPUnit Feature Test (backend) · Vitest (frontend, nếu cần) · Postman/`.http` cho smoke test API.

Nguyên tắc: test viết song song từng tuần, **không dồn tuần 10**. Mỗi business rule có ít nhất một test.

---

## 1. Cấu trúc test backend

```
tests/
  Feature/
    Auth/             LoginTest, ChangePasswordTest, MustChangePasswordTest
    SinhVien/         SinhVienCrudTest, SinhVienScopeTest, SinhVienDeleteTest
    GiangVien/        GiangVienCrudTest, GiangVienDeleteTest
    DanhMuc/          MonHocTest, HocKyTest, PhongHocTest, LopHanhChinhTest
    LopHocPhan/       LopHocPhanCrudTest, LopHocPhanStatusTest, LopHocPhanPolicyTest
    LichHoc/          BuoiHocTest, SinhLichTest, TrungLichTest
    DangKy/           DangKyAdminTest, DangKyStudentTest, HuyDangKyTest, TranhChapChoTest
    DiemDanh/         DiemDanhTest, ThongKeChuyenCanTest, SuaDiemDanhTest
    Diem/             NhapDiemTest, TinhDiemTest, ChotDiemTest, LichSuDiemTest
    Dashboard/        DashboardTest
    XoaMem/           XoaMemTest, KhoiPhucTest
    Menu/             MenuTest
  Unit/
    Services/         TinhDiemTest, TinhGpaTest, TinhChuyenCanTest
```

Mỗi test dùng `RefreshDatabase`, `travelTo` khi cần cố định giờ, factory riêng cho từng model.

---

## 2. Ma trận FR/BR → Test case

| Test | Bao phủ | Nội dung kiểm tra |
|---|---|---|
| TC-01 | FR-01.01, BR-02 | Đăng nhập đúng/sai; tài khoản khóa; rate limit; không lộ email |
| TC-02 | FR-01.05 | Chặn endpoint khi `must_change_password`; đổi mật khẩu; thu hồi token khác |
| TC-03 | FR-02.01, BR-01 | Tạo sinh viên + tài khoản; mật khẩu trả một lần; trùng mã/email; mã đã xóa mềm |
| TC-04 | FR-02.06 | Chặn xóa khi còn đăng ký ACTIVE; xóa kèm tài khoản; giữ điểm/điểm danh |
| TC-04B | FR-05 → FR-10, BR-15, BR-22 | Chuẩn bị học kỳ: thiếu học kỳ/môn/GV/phòng → chặn; chưa có buổi học → đăng ký được nhưng không kiểm trùng lịch; sửa lịch gây trùng → 409 |
| TC-05 | FR-08.01, FR-08.05, BR-15 | Mở lớp; chặn môn/GV INACTIVE; chặn học kỳ CLOSED; trùng mã trong kỳ |
| TC-06 | FR-10.02, FR-10.04, BR-06, BR-22 | Sinh lịch all-or-nothing; trùng phòng; trùng GV; trùng SV; liền kề không trùng |
| TC-07 | FR-09.01, BR-08, BR-09 | Đăng ký hộ; trùng môn; trùng lịch; đầy lớp; đăng ký lại sau hủy |
| TC-08 | FR-09.02, BR-10 | Trong/ngoài đợt; STUDENT không đăng ký hộ được |
| TC-09 | FR-09.03, BR-11, BR-20 | Hủy trong đợt; chặn khi có điểm; ADMIN hủy ngoài đợt; đăng ký lại |
| TC-10 | FR-11.01, BR-21 | Danh sách theo mốc thời gian; hủy trước/sau buổi; upsert không trùng |
| TC-11 | FR-12.01 → .04, BR-05, BR-13 | Validate 0–10; tính tổng kết; chặn chốt nếu không có đăng ký ACTIVE (`NO_ACTIVE_ENROLLMENTS`); chặn chốt nếu thiếu điểm; khóa sau chốt; ADMIN mở khóa |
| TC-12 | FR-12.05 | GPA đúng công thức; tính cả môn KHÔNG ĐẠT; làm tròn 2 số |
| TC-13 | FR-14.01 → .05, BR-18 | Xóa mềm ẩn khỏi danh sách; khôi phục; chặn khôi phục khi cha xóa |
| TC-14 | FR-08.04 | Hủy lớp: đăng ký → CANCELLED, buổi → CANCELLED, giữ điểm |
| TC-15 | FR-10.03 | Lịch STUDENT/TEACHER chỉ trong phạm vi |
| TC-16 | FR-13.01 → .03 | Số liệu dashboard khớp dữ liệu. **Chi tiết TC-16a/b/c** — xem bảng dưới, 27 case khoá riêng dashboard TEACHER và STUDENT |
| TC-17 | FR-09.05, BR-23 | Năm thứ: lớp `nam_thu = 4` + sinh viên năm 1 → 409 `WRONG_STUDY_YEAR`; ADMIN đăng ký hộ thành công + có `nhat_ky`; `nam_thu = null` không chặn; thiếu `nam_nhap_hoc` không chặn |
| TC-18 | FR-06.03, BR-24 | Vòng đời học kỳ: tiến hợp lệ; lùi từ `CLOSED` → 409; bỏ qua `ONGOING` → 409; kỳ ONGOING thứ hai → 409; mỗi lần chuyển có `nhat_ky` |
| TC-19 | FR-06.01, FR-10.01, BR-25 | Chồng lấn học kỳ → 409 `SEMESTER_OVERLAP`; đợt đăng ký ngoài khoảng ngày kỳ → 422; buổi học ngoài khoảng ngày kỳ → 409 `SESSION_OUTSIDE_SEMESTER` |
| TC-20 | FR-09.02, BR-26 | Đăng ký vào kỳ không phải kỳ hiện tại nhưng đang trong đợt của kỳ đó → thành công; ngoài đợt của kỳ đó → 409 `OUTSIDE_REGISTRATION` |
| TC-21 | BR-27 | Đăng ký lại sau hủy: chặn khi đã có điểm; `diem_danh` cũ không tính vào chuyên cần; buổi sau `dang_ky_luc` mới tính |
| TC-22 | FR-12.05, FR-12.08, BR-28 | Học lại: GPA chỉ tính một lần với điểm cao nhất; điểm lần thấp vẫn hiển thị trong lịch sử; CPA tính trên học kỳ CLOSED |
| TC-23 | FR-08.04, BR-29 | Hủy lớp đã chốt điểm → 409 `GRADE_LOCKED`; mở khóa rồi hủy thành công |
| TC-24 | FR-08.03 | Đổi môn lớp đã có đăng ký ACTIVE → 409 `SUBJECT_CHANGE_BLOCKED`; đổi môn lớp chỉ có đăng ký CANCELLED → thành công |
| TC-25 | FR-09.07 | Đăng ký hàng loạt 50 SV có 3 lỗi → 47 thành công, 3 dòng `ma_loi`; không vượt sĩ số khi chạy đồng thời |
| TC-26 | FR-01.10, FR-01.11 | Upload ảnh: đúng định dạng → 200 + `avatar_url`; sai MIME → 422; quá 5 MB → 422; thiếu cấu hình → 503; thay ảnh xóa ảnh cũ trên Cloudinary; gỡ ảnh → `avatar_url = null` |
| TC-27 | FR-01.12, BR-30 | Khóa tài khoản đơn lẻ và hàng loạt đều **thu hồi toàn bộ token**: token cũ gọi API → 401 ngay |
| TC-28 | FR-02.05b, FR-02.07, BR-31 | Bulk sinh viên: 10 chọn, 2 còn đăng ký ACTIVE → 8 xóa được, 2 dòng `DELETE_BLOCKED`; khóa hàng loạt khóa luôn tài khoản |
| TC-29 | FR-04.04b, FR-04.06 | Bulk giảng viên: xóa bị chặn khi còn phụ trách lớp chưa đóng; khóa thu hồi token |
| TC-30 | BR-31 | Danh sách rỗng → 422; 501 id → 422; id không tồn tại → dòng `NOT_FOUND`, các dòng khác vẫn thành công |
| TC-31 | SCR-47/48 | FE — điều hướng không khớp route: URL **có** trong bảng `menus` → trang "Màn hình *tên mục* chưa làm" **trong layout**; URL **không ai khai** → 404 đứng riêng, không sidebar/header/footer; cả hai đều không quay về `/dashboard`. Chưa đăng nhập → về trang đăng nhập kèm `returnUrl` |
| TC-32 | SCR-48 | FE — form menu: đường dẫn nội bộ chưa có route → cảnh báo nhưng **vẫn lưu** (khai trước cho màn chưa code); `bao-cao` (thiếu `/`) hoặc `javascript:...` → chặn, không gọi API |
| TC-33 | SCR-47 | FE — menu khớp quyền route: ADMIN thấy **mọi** mục (kể cả `/dang-ky`, `/diem-danh`); vai trò không phải ADMIN chỉ thấy mục của mình; mục nào hiển thị thì route phải cho vai trò đó vào, và ngược lại |
| TC-34 | SCR-47 | BE — `GET /api/menus` (không `quan_ly`): mỗi vai trò chỉ nhận menu có vai trò mình trong mảng `vai_tro` (hoặc `vai_tro = null`); menu `trang_thai = false` bị loại; **không có ngoại lệ ADMIN** — ADMIN không nhận `/dang-ky-cua-toi`, `/diem-cua-toi` |
| TC-35 | SCR-48 | BE — `POST`/`PUT /api/menus` nhận `vai_tro` là **mảng**: `["ADMIN","GIANG_VIEN"]` lưu đúng; `[]` chuẩn hóa thành `null` (mọi vai trò); vai trò không hợp lệ hoặc gửi chuỗi đơn → 422 |

### TC-16 chi tiết — dashboard TEACHER/STUDENT (SCR-04/05)

27 case tối thiểu, chia ba nhóm. Hợp đồng đầy đủ: `docs/04-api-contract.md` §14.
| Case | Nhóm | Khoá hành vi |
|---|---|---|
| TC-16a.1 | Phân quyền | TEACHER → 200; ADMIN → 403 `FORBIDDEN`; SINH_VIEN → 403 |
| TC-16a.2 | Phân quyền | STUDENT → 200; ADMIN → 403; GIANG_VIEN → 403 |
| TC-16a.3 | Rỗng | Giảng viên chưa phân lớp → 200, `hoc_ky = null`, 4 mảng rỗng, không 404/500 |
| TC-16a.4 | Rỗng | Sinh viên chưa đăng ký → 200, `hoc_ky = null`, `chuyen_can.ty_le = null` (**không** phải `0`) |
| TC-16a.5 | Dữ liệu hỏng | Tài khoản GIANG_VIEN/SINH_VIEN thiếu hồ sơ → 403 `FORBIDDEN`, không 500 |
| TC-16a.6 | Nhất quán | `gia_tri` thẻ `buoi_sap_toi` = `count(buoi_sap_toi)`; tương tự cho các thẻ khác |
| TC-16a.7 | Nhất quán | Thẻ `chuyen_can.gia_tri` = `round(chuyen_can.ty_le × 100, 1)` — không lệch do nhân 100 hai lần |
| TC-16a.8 | Nhất quán | Khối `gpa` của `/student` **bằng byte-for-byte** payload `GET /api/me/gpa` cùng user |
| TC-16b.1 | TEACHER | Buổi đã qua **có** điểm danh không vào `buoi_chua_diem_danh`; **không** có thì vào |
| TC-16b.2 | TEACHER | Buổi `SCHEDULED` ở tương lai không vào `buoi_chua_diem_danh` |
| TC-16b.3 | TEACHER | Buổi ngoài 14 ngày và buổi `CANCELLED`/`DONE` không vào `buoi_sap_toi` |
| TC-16b.4 | TEACHER | Ranh giới 14 ngày: buổi đúng ngày `today + 14` **có** mặt; `today + 15` không |
| TC-16b.5 | TEACHER | `con_sua_duoc = false` khi kỳ `CLOSED`; `false` khi quá `so_ngay_sua_diem_danh`; `true` trong hạn |
| TC-16b.6 | TEACHER | `so_ngay_tre` = số ngày từ lúc buổi kết thúc tới `now()`, không âm |
| TC-16b.7 | TEACHER | Chỉ thấy lớp của mình — lớp của giảng viên khác không xuất hiện ở cả 4 khối |
| TC-16b.8 | TEACHER | `viec_can_lam` chỉ chứa mục `so_luong > 0`; sắp xếp `cao → trung_binh → thap` |
| TC-16b.9 | TEACHER | `viec_can_lam[chot_diem]` = 0 và bị bỏ khỏi mảng khi kỳ `CLOSED`/`UPCOMING` |
| TC-16b.10 | TEACHER | Số truy vấn ≤ 9 khi giảng viên có 3 lớp (đếm bằng `DB::queryLog`). Ngân sách 8 → 9 vì thêm truy vấn gộp `diem_tb_lop` §14 |
| TC-16b.11 | TEACHER | `lop_phu_trach[].diem_tb_lop` = trung bình `diem_tong_ket` của đăng ký `ACTIVE`, làm tròn 2 chữ số; đăng ký `CANCELLED` không tính |
| TC-16b.12 | TEACHER | `diem_tb_lop = null` khi chưa ai được chấm (không có dòng `diem`, hoặc `diem_tong_ket IS NULL`) — **không phải `0`** |
| TC-16b.13 | TEACHER | `diem_tb_lop` không N+1: số truy vấn **không đổi** khi số lớp tăng từ 1 lên 10 |
| TC-16c.1 | STUDENT | Công thức chuyên cần: `mau_so = tong − co_phep`, `ty_le = (co_mat + di_muon) / mau_so`, 4 chữ số |
| TC-16c.2 | STUDENT | Đăng ký lại giữa kỳ: buổi trước `dang_ky_luc` không vào `mau_so` (BR-27) |
| TC-16c.3 | STUDENT | `ty_le_chuyen_can` từng môn cộng lại khớp khối `chuyen_can` (không lệch do làm tròn từng môn) |
| TC-16c.4 | STUDENT | `ty_le_thap_nhat` = môn có tỉ lệ nhỏ nhất; hòa thì lấy `dang_ky_hoc_phan_id` nhỏ hơn |
| TC-16c.5 | STUDENT | Tuần hiện tại: `tu_ngay` là thứ 2, `den_ngay` là chủ nhật, đúng ngày khi hôm nay là chủ nhật |
| TC-16c.6 | STUDENT | `thu` của chủ nhật = `8` (không phải `0`, không phải `7`) |
| TC-16c.7 | STUDENT | Buổi `CANCELLED` trong tuần vẫn có trong `cac_buoi` kèm `ly_do_huy` |
| TC-16c.8 | STUDENT | Không thấy buổi của lớp mình **không** đăng ký ACTIVE |
| TC-16c.9 | STUDENT | Số truy vấn ≤ 8 khi sinh viên đăng ký 5 học phần (đếm bằng `DB::listen`) |

---

## 3. Test bắt buộc cho từng Business Rule

| BR | Test | Kịch bản |
|---|---|---|
| BR-01 | `MaDuyNhatTest` | Tạo bản ghi, xóa mềm, tạo lại cùng mã → 422 |
| BR-02 | `DangNhapTest` | `trang_thai = false` → 403 |
| BR-03 | `PolicyTest` | TEACHER khác lớp → 403 khi điểm danh/nhập điểm |
| BR-04 | `ScopeTest` | STUDENT truy cập dữ liệu người khác → 403/404 |
| BR-05 | `NhapDiemTest` | Điểm -1, 10.01, 3 chữ số thập phân → 422 |
| BR-06 | `LichHocTest` (service đã triển khai) | Trùng phòng, trùng GV, liền kề, sửa chính nó; lô nhiều buổi |
| BR-07 | `XoaMemTest` | Mọi DELETE đều còn bản ghi trong DB với `deleted_at` |
| BR-08 | `DangKyTest` | Cùng môn 2 lớp; trùng lịch |
| BR-09 | `TranhChapChoTest` | 2 request đồng thời, `si_so_toi_da = 1` |
| BR-10 | `DangKyStudentTest` | Ngoài đợt → 409 |
| BR-11 | `HuyDangKyTest` | Có điểm/điểm danh → 409 |
| BR-12 | `DangKyTest` | `dang_ky_boi`, `dang_ky_luc` được lưu |
| BR-13 | `ChotDiemTest` | Sửa sau chốt → 409; ADMIN mở khóa kèm lý do |
| BR-14 | `HocKyDongTest` | Mọi thao tác ghi trên học kỳ CLOSED → 409 |
| BR-15 | `DanhMucTest` | Dùng INACTIVE cho tạo mới → 422 |
| BR-16 | `XoaMemTest` | Bảng 6.1 từng dòng |
| BR-17 | `XoaMemTest` | Xóa SV → tài khoản xóa; xóa lớp → buổi học xóa |
| BR-18 | `KhoiPhucTest` | Cha đã xóa → 409 |
| BR-19 | `NguoiDungTest` | Tự xóa mình; xóa ADMIN cuối |
| BR-20 | `DangKyLaiTest` | Không tạo dòng mới |
| BR-21 | `DiemDanhTest` | Hủy trước buổi không xuất hiện |
| BR-22 | `LichHocTest` (service đã triển khai) | Sửa giờ tạo trùng lịch SV ACTIVE → lỗi 409; endpoint ghi lịch chờ PM tích hợp |
| BR-23 | `NamThuTest` | Lớp `nam_thu` khác năm thứ → 409; ADMIN override; `null` không chặn |
| BR-24 | `HocKyTest` (đã triển khai) | Chỉ tiến; `CLOSED` không quay lại; một kỳ ONGOING; nhật ký chuyển trạng thái |
| BR-25 | `HocKyTest` (phần học kỳ đã triển khai) | Chồng lấn kỳ; đợt ngoài kỳ; sửa ngày kỳ không làm buổi đã có nằm ngoài kỳ. Test tạo/sửa buổi học thuộc module lịch |
| BR-26 | `DotDangKyTest` | Đợt tính theo học kỳ chứa lớp, không theo kỳ hiện tại |
| BR-27 | `DangKyLaiTest` | Chặn khi có điểm; chuyên cần chỉ tính buổi sau `dang_ky_luc` |
| BR-28 | `TinhGpaTest` | Học lại lấy điểm cao nhất; không cộng hai lần |
| BR-29 | `HuyLopTest` | Lớp đã chốt điểm không hủy được |
| BR-30 | `KhoaTaiKhoanTest` | Khóa đơn lẻ và hàng loạt đều xóa `personal_access_tokens` |
| BR-31 | `HangLoatTest` | Từng dòng độc lập; rỗng → 422; quá 500 → 422; id không tồn tại → `NOT_FOUND` |

---

## 4. Test Unit cho công thức

| Test | Input | Kỳ vọng |
|---|---|---|
| `TinhDiemTest` | 8.5 / 7.0 / 8.0 | 7.88, DAT |
| `TinhDiemTest` | 3 / 3 / 3 | 3.00, KHONG_DAT |
| `TinhDiemTest` | 0 / 0 / 0 | 0.00, KHONG_DAT |
| `TinhDiemTest` | 10 / 10 / 10 | 10.00, DAT |
| `TinhDiemTest` | thiếu 1 điểm | `diem_tong_ket = null`, `ket_qua = null` |
| `TinhDiemTest` | 4.0 chính xác | D, 1.0, DAT |
| `TinhDiemTest` | 3.99 | F, 0.0, KHONG_DAT |
| `TinhDiemTest` | 8.5 / 8.49 / 7.0 / 6.99 / 5.5 / 5.49 / 4.0 | A / B / B / C / C / D / D (biên dưới đúng) |
| `QuyDoiDiemChuTest` | bảng cấu hình chồng lấn | 422 khi lưu `cau_hinh` |
| `QuyDoiDiemChuTest` | bảng không phủ 0–10 | 422 khi lưu `cau_hinh` |
| `TinhGpaTest` | 2 môn 3 tín chỉ, hệ 4 là 3.0 và 2.0 | `gpa_he_4 = 2.50` |
| `TinhGpaTest` | có môn F (0.0) | vẫn tính vào GPA |
| `TinhGpaTest` | 0 tín chỉ | `null` |
| `TinhGpaTest` | môn X học 2 lần: 5.0 và 8.0 (3 tín chỉ) | chỉ tính 8.0 một lần |
| `TinhGpaTest` | môn X học 2 lần: 8.0 và 5.0 | vẫn tính 8.0 (điểm cao nhất, không phải lần cuối) |
| `NamThuTest` | nhập học 2023, kỳ thuộc năm học 2026-2027 | `nam_thu = 4` |
| `NamThuTest` | không có lớp hành chính | `null` |
| `TinhChuyenCanTest` | 8 PRESENT, 1 LATE, 1 EXCUSED | 1.0 |
| `TinhChuyenCanTest` | toàn EXCUSED | `null` |
| `TinhChuyenCanTest` | 0 buổi | `null` |

---

## 5. Test phân quyền (ma trận)

Bảng test tự động: với mỗi cặp (vai trò, endpoint), khẳng định mã trạng thái mong đợi.

| Nhóm endpoint | ADMIN | TEACHER | STUDENT |
|---|---|---|---|
| `POST /api/students` | 201 | 403 | 403 |
| `GET /api/students` | 200 | 200 (lọc) | 403 |
| `DELETE /api/students/{id}` | 200/409 | 403 | 403 |
| `PUT /api/sections/{id}` | 200 | 403 | 403 |
| `POST /api/sections/{id}/finalize` | 403 | 200 nếu có đăng ký ACTIVE đủ điểm; nếu không có thì 409 `NO_ACTIVE_ENROLLMENTS` | 403 |
| `PUT /api/sessions/{id}/attendance` | 200 | 200 (lớp mình) | 403 |
| `POST /api/me/enrollments` | 403 | 403 | 201 |
| `POST /api/enrollments` | 201 | 403 | 403 |
| `POST /api/enrollments/bulk` | 200 | 403 | 403 |
| `GET /api/me/grades` | 403 | 403 | 200 |
| `GET /api/me/gpa` | 403 | 403 | 200 |
| `GET /api/settings` | 200 (đủ khoá) | 200 (chỉ `diem.*`) | 200 (chỉ `diem.*`) |
| `PUT /api/settings` | 200 | 403 | 403 |
| `GET /api/sections/{id}/students` | 200 | 200 (lớp mình) | 200 nếu đã đăng ký ACTIVE (chỉ `ma_sv` + `ho_ten`), 403 nếu chưa |
| `GET /api/sections/{id}/grades` | 200 | 200 (lớp mình) | 403 |
| `GET /api/sections/{id}/attendance-summary` | 200 | 200 (lớp mình) | 403 |
| `POST /api/me/avatar` | 200 | 200 | 200 |
| `PATCH /api/users/bulk-status` | 200 | 403 | 403 |
| `POST /api/students/bulk-delete` | 200 | 403 | 403 |
| `GET /api/trash/students` | 200 | 403 | 403 |
| `GET /api/dashboard/admin` | 200 | 403 | 403 |
| `GET /api/khoa` | 200 | 200 | 200 |
| `POST /api/khoa` | 201 | 403 | 403 |
| `POST /api/nganh` | 201 | 403 | 403 |
| `DELETE /api/khoa/{id}` (còn ngành) | 409 | 403 | 403 |

---

## 6. Smoke test API

File `tests/smoke.http` (REST Client) hoặc Postman collection:

1. Login ADMIN → lấy token.
2. Tạo học kỳ → môn → phòng → giảng viên → sinh viên → lớp học phần.
3. Sinh lịch 4 tuần.
4. Đăng ký 5 sinh viên.
5. Login TEACHER → điểm danh buổi đầu.
6. Nhập điểm, chốt điểm.
7. Login STUDENT → xem điểm, GPA, chuyên cần.
8. ADMIN xóa mềm một sinh viên → xem thùng rác → khôi phục.

Mỗi bước khẳng định mã trạng thái và một trường dữ liệu then chốt.

---

## 7. Tiêu chí chất lượng

- Toàn bộ test pass trên SQLite in-memory trong CI.
- Độ phủ dòng ≥ 70% cho `app/Services` và `app/Policies`.
- Không test nào phụ thuộc thời gian thực (`travelTo` cố định).
- Không test nào phụ thuộc thứ tự chạy.
- Mỗi bug sửa xong phải thêm test hồi quy.

---

## 6. Test danh mục Khoa / Ngành (ADR-020)

`KhoaNganhTest` — 13 case, chạy cùng suite Feature.

| Case | Khẳng định |
|---|---|
| CRUD khoa | Tạo 201 (`so_nganh = 0`), chi tiết, cập nhật, xóa mềm + `nhat_ky` |
| Mã khoa trùng | 422, **kể cả khi bản ghi đã xóa mềm** (BR-01) |
| Chặn xóa khoa | Còn ngành → 409; còn môn học → 409; khoa rảnh → 200 |
| CRUD ngành | Tạo 201 (có khối lồng `khoa`), cập nhật, xóa mềm |
| Trùng tên ngành | Cùng khoa → 422; khác khoa → 201 (khớp `unique(khoa_id, ten_nganh)`) |
| `khoa_id` không tồn tại | 422, lỗi nằm ở trường `khoa_id` |
| Chặn xóa ngành | Còn giảng viên → 409; còn lớp hành chính → 409; rảnh → 200 |
| Options | `/options/khoa`, `/options/nganh`, lọc `?khoa_id=` |
| Gắn khoa/ngành | Môn học có `khoa_id` + khối `khoa`; giảng viên có `nganh_id` + khối `nganh` và **không còn** `chuyen_mon`; lớp hành chính có `nganh` + `khoa` suy ra |
| Lọc | Môn học theo `khoa_id`; giảng viên theo `nganh_id` và theo `khoa_id` (qua quan hệ) |
| Phân quyền | Sinh viên đọc được `/khoa`, `/nganh`; tạo bị 403 |
| Thùng rác | `/trash/khoa` liệt kê được và khôi phục được |
| Seeder | `KhoaNganhSeeder` chạy hai lần vẫn 1 khoa + 5 ngành; `DanhMucSeeder`/`GiangVienSeeder` gắn đúng `khoa_id`/`nganh_id` |

> Ghi chú: `DanhMucSeeder` và `GiangVienSeeder` phụ thuộc `KhoaNganhSeeder` phải chạy trước
> (đã xếp đúng thứ tự trong `DatabaseSeeder`). `GiangVienSeeder` cần `UserSeeder` chạy trước vì
> gắn hồ sơ demo vào tài khoản `giangvien@example.com`.
