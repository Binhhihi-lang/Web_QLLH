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
| TC-11 | FR-12.01 → .04, BR-05, BR-13 | Validate 0–10; tính tổng kết; chốt; khóa sau chốt; ADMIN mở khóa |
| TC-12 | FR-12.05 | GPA đúng công thức; tính cả môn KHÔNG ĐẠT; làm tròn 2 số |
| TC-13 | FR-14.01 → .05, BR-18 | Xóa mềm ẩn khỏi danh sách; khôi phục; chặn khôi phục khi cha xóa |
| TC-14 | FR-08.04 | Hủy lớp: đăng ký → CANCELLED, buổi → CANCELLED, giữ điểm |
| TC-15 | FR-10.03 | Lịch STUDENT/TEACHER chỉ trong phạm vi |
| TC-16 | FR-13.01 → .03 | Số liệu dashboard khớp dữ liệu |

---

## 3. Test bắt buộc cho từng Business Rule

| BR | Test | Kịch bản |
|---|---|---|
| BR-01 | `MaDuyNhatTest` | Tạo bản ghi, xóa mềm, tạo lại cùng mã → 422 |
| BR-02 | `DangNhapTest` | `trang_thai = false` → 403 |
| BR-03 | `PolicyTest` | TEACHER khác lớp → 403 khi điểm danh/nhập điểm |
| BR-04 | `ScopeTest` | STUDENT truy cập dữ liệu người khác → 403/404 |
| BR-05 | `NhapDiemTest` | Điểm -1, 10.01, 3 chữ số thập phân → 422 |
| BR-06 | `TrungLichTest` | Trùng phòng, trùng GV, liền kề, sửa chính nó |
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
| BR-22 | `SuaLichTest` | Sửa giờ tạo trùng lịch SV → 409 |

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
| `POST /api/sections/{id}/finalize` | 403 | 200 | 403 |
| `PUT /api/sessions/{id}/attendance` | 200 | 200 (lớp mình) | 403 |
| `POST /api/me/enrollments` | 403 | 403 | 201 |
| `POST /api/enrollments` | 201 | 403 | 403 |
| `GET /api/me/grades` | 403 | 403 | 200 |
| `GET /api/trash/students` | 200 | 403 | 403 |
| `GET /api/dashboard/admin` | 200 | 403 | 403 |

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
