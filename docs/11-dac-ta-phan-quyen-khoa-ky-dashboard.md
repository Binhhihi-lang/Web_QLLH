# Đặc tả: sửa phân quyền, khóa học kỳ, dashboard, mã lớp

Trạng thái: **chờ user duyệt**. Chưa code.
Ngày soạn: 2026-11-12. Nguồn: `docs/design/ctdt-va-quyen-buoi-hoc.html` (mockup đã duyệt).

---

## 0. Phạm vi đợt này

Sáu việc đã được duyệt. **Học lại / chương trình khung** tách đợt sau (user: "giải quyết các
phần kia trước đã rồi thảo luận sâu hơn về học lại").

| Mã | Việc | Loại |
|---|---|---|
| V1 | Đổi mã lớp học phần sang `<mã lớp HC>-<mã môn>` + seeder + làm sạch DB local | Dữ liệu |
| V2 | Sinh lịch / thêm / sửa / hủy buổi: **ADMIN only** | Code + test |
| V3 | Kỳ CLOSED: **không ai** ghi được điểm danh lẫn nhập điểm, kể cả ADMIN | Code + test |
| V4 | Bỏ `chuyen_can` khỏi payload dashboard sinh viên (đổi response shape) | Hợp đồng API |
| V5 | Thêm mã môn 6 số vào payload dashboard | Hợp đồng API |
| V6 | Bỏ `nam_thu` khỏi `lop_hoc_phan` — **hoãn** | Migration |

**Không nằm trong đợt này:** bảng `chuong_trinh_dao_tao` / `chuong_trinh_mon` (A1), quyền xem
lịch trước khi đăng ký (C2), luật học lại. Sẽ thảo luận ở đợt sau.

---

## V1 — Mã lớp học phần `<mã lớp HC>-<mã môn>`

### Hiện trạng đo được

- `database/seeders/LopHocPhanSeeder.php:45` → `sprintf('LHP%04d', $dem)`
- `database/seeders/DanhMucSeeder.php:35-50` → `sprintf('%s-%s%02d', $nganhCuaLop, $khoaHoc, $i)`
  → `KTPM-K63-01`
- `lop_hoc_phan` **không có** `lop_hanh_chinh_id` (`2026_10_21_001600_create_lop_hoc_phan_table.php`)
- Ràng buộc: `unique(['hoc_ky_id', 'ma_lop_hp'])` (dòng 28)

### Quy tắc mới

| Thực thể | Định dạng | Ví dụ |
|---|---|---|
| Lớp hành chính | `<khoa_hoc viết tắt ngành><số lớp>` | `68PM2`, `68MHT1` |
| Lớp học phần | `<mã lớp HC>-<ma_mon>` | `68PM2-396602`, `68MHT1-250102` |
| Lớp học lại riêng | `HL-<ma_mon>-<nam_hoc>-<ky_thu>` | `HL-396602-2026-1` |

Bảng viết tắt ngành: `PM` = Phần mềm, `MHT` = Mạng máy tính, `ATTT` = An toàn thông tin,
`TTNT` = Trí tuệ nhân tạo, `HTTT` = Hệ thống thông tin. Lưu ở đâu: thêm cột
`nganh.viet_tat` (migration mới) **hoặc** map cứng trong seeder.

**Vì sao không đổi unique key:** mã môn nằm trong mã lớp nên `unique(hoc_ky_id, ma_lop_hp)`
vẫn đúng. Không sửa schema.

### Việc phải làm

1. `DanhMucSeeder` — sinh mã lớp HC theo quy tắc mới.
2. `LopHocPhanSeeder` — sinh mã lớp HP = `<mã lớp HC>-<ma_mon>`.
3. Cập nhật dữ liệu demo/Postman đang dùng `LHP0001`.
4. Kiểm: `ma_lop_hp` dài tối đa 30 ký tự (cột hiện tại). `68PM2-396602` = 12 ký tự → đủ.

### Rủi ro

**Quyết định của user (2026-11-12):** làm sạch dữ liệu **DB local trước**, Aiven để sau.
Nghĩa là: không viết migration update bản ghi cũ. Chỉ đổi seeder + chạy lại seed trên DB local.
DB Aiven (dữ liệu thật) giữ nguyên mã cũ cho tới khi user quyết riêng.

Cột `ma_lop_hp` dài tối đa 30 ký tự. `68PM2-396602` = 12 ký tự → đủ.

---

## V2 — Buổi học: ADMIN only (toàn bộ, không chỉ hủy)

### Quyết định của user (2026-11-12)

"Giảng viên không có quyền sinh lịch nhé chỉ có ADMIN thôi, nó như phòng đào tạo ế."

Nghĩa là **cả bốn thao tác** đều ADMIN only: sinh lịch, thêm buổi, sửa buổi, hủy/mở lại, xóa.
Không cần tách method như đề xuất trước — chỉ đổi một dòng.

### Hiện trạng đo được

`app/Policies/LopHocPhanPolicy.php:95`:

```php
public function quanLyBuoiHoc(User $nguoiDung, LopHocPhan $lop): bool
{
    return $nguoiDung->laAdmin() || $this->laGiangVienCuaLop($nguoiDung, $lop);
}
```

Gọi ở **6 chỗ** trong `BuoiHocController.php`: dòng 37, 50, 64, 78, 94.

### Hành vi mới

```php
/** Sinh lịch, thêm, sửa, hủy, mở lại, xóa buổi — chỉ ADMIN (phòng đào tạo). */
public function quanLyBuoiHoc(User $nguoiDung, LopHocPhan $lop): bool
{
    return $nguoiDung->laAdmin();
}
```

### Việc phải làm

1. Sửa `LopHocPhanPolicy::quanLyBuoiHoc()` — bỏ nhánh giảng viên.
2. `BuoiHocController` — thêm `vai.tro:ADMIN` cho 5 route sinh lịch/thêm/sửa/hủy/xóa
   (`routes/api.php:238-243` và `:259-260`). Route middleware chặn trước, policy chặn sau —
   cả hai cùng đúng ý.
3. `xemBuoiHoc` (dòng 87) **giữ nguyên**: giảng viên vẫn xem lịch lớp mình.
4. Test:
   - `tests/Feature/BuoiHocTest.php:288` — `test_giang_vien_khong_huy_duoc_buoi_da_day` vẫn xanh.
   - **Thêm** `test_giang_vien_khong_sua_duoc_buoi` và `test_giang_vien_khong_sinh_duoc_lich`.
   - `tests/Feature/BuoiHocTest.php` các test đang dùng `actingAs($giangVien)` để sinh lịch phải
     đổi sang `actingAs($admin)`.

### Rủi ro

Giảng viên ốm đột xuất phải gọi ADMIN hủy hộ — đúng như user mô tả ("như phòng đào tạo").
Không có luồng "giảng viên đề xuất hủy" trong đợt này.

---

## V3 — Kỳ CLOSED: không ai ghi được, kể cả ADMIN

### Quyết định của user (2026-11-12)

"Kỳ đóng rồi thì tôi nghĩ lại là không cho cả điểm danh lẫn nhập điểm nữa, muốn thì chốt trong
kỳ ấy, làm vậy thì tổ chức rõ ràng luôn."

Đây là **đảo ngược** BR-14 + ADR-017 (đang cho ADMIN ngoại lệ). Cần cập nhật docs.

### Hiện trạng đo được — chỉ còn đúng hai lỗ

| File | Dòng | Hiện tại |
|---|---|---|
| `QuanLyDiemService.php` | 43 | `if ($lop->hocKy?->trang_thai === HocKy::CLOSED)` → **đã chặn cả ADMIN** |
| `QuanLyDiemDanhService.php` | 139 | `if (... === CLOSED && ! $user->laAdmin())` → **ADMIN lách được** |

Nghĩa là nhập điểm **đã đúng** ý user. Chỉ điểm danh còn lỗ.

Hai chỗ phụ liên quan:
- `QuanLyDiemDanhService.php:352-359` — `coTheSuaDiemDanh()` trả `true` sớm cho ADMIN, bỏ qua
  cả kiểm tra CLOSED. Đây là hàm quyết định nút sửa có bật hay không.
- `DashboardService.php:340` — `con_sua_duoc` đã đúng (chỉ xét `!== CLOSED` + hạn 7 ngày),
  **không** có ngoại lệ ADMIN. Giữ nguyên.

### Hành vi mới

```php
// QuanLyDiemDanhService::luu()
if ($lop->hocKy?->trang_thai === HocKy::CLOSED) {
    throw new LoiNghiepVu('SEMESTER_CLOSED', 'Học kỳ đã đóng, không thể điểm danh.', 409);
}

// QuanLyDiemDanhService::coTheSuaDiemDanh() — bỏ nhánh return true sớm cho ADMIN
if ($buoiHoc->lopHocPhan->hocKy?->trang_thai === HocKy::CLOSED) {
    return false;
}
```

### Việc phải làm

1. `QuanLyDiemDanhService.php:139` — bỏ `&& ! $user->laAdmin()`.
2. `QuanLyDiemDanhService.php:352-354` — bỏ `if ($user->laAdmin()) return true;`.
3. Cập nhật `docs/01-requirements.md` BR-14: bỏ câu "Ngoại lệ duy nhất: ADMIN được sửa điểm danh
   trên học kỳ CLOSED".
4. Cập nhật `docs/07-decisions.md` ADR-017: đánh dấu **superseded**.
5. Test `tests/Feature/DiemDanhTest.php:246-251` — hiện chờ ADMIN `assertOk()`. Đổi thành
   `assertStatus(409)` + `assertJsonPath('ma_loi', 'SEMESTER_CLOSED')`.

### Hệ quả nghiệp vụ cần user biết

Giảng viên báo sai điểm danh **sau khi kỳ đã đóng** thì không còn đường sửa. Quy trình phải là:
phát hiện và sửa **trước** khi chuyển kỳ sang `CLOSED`. Nếu không, sai sót vĩnh viễn.

Đây là cái giá của "tổ chức rõ ràng" — user đã chấp nhận. Nhưng nên có cảnh báo trong UI:
hộp thoại chuyển kỳ sang CLOSED phải nói rõ "sau bước này không sửa được điểm danh/điểm nữa".

### Không cần ô nhập lý do nữa

Spec trước đề xuất bắt ADMIN nhập lý do. **Bỏ phần đó** — không ai ghi được thì không cần lý do.
Hộp thoại "Mở khóa ghi điểm" trong mockup (dòng ~2700) vẫn dùng cho **chot_diem_luc** (BR-13,
`moKhoaDiem`) — đó là cơ chế khác, không đụng tới.

---

## V4 — Bỏ `chuyen_can` khỏi payload dashboard

### Hiện trạng đo được

`app/Services/DashboardService.php:527` trả `'chuyen_can' => $chuyenCan`.
Cùng file dòng 485-520: `the_so_lieu` có thẻ `khoa => 'chuyen_can'`.

### Thay đổi

**Bỏ hẳn:**
- Key `chuyen_can` ở cấp gốc response.
- Thẻ `chuyen_can` trong `the_so_lieu`.
- Trường `ty_le_chuyen_can`, `diem_tong_ket`, `diem_chu`, `ket_qua` trong mỗi phần tử
  `hoc_phan_da_dang_ky` (mockup bảng 2 cột chỉ cần `ma_mon`, `ten_mon`, `so_tin_chi`).

**Thêm:**
- Thẻ `khoa => 'buoi_tuan'` — số buổi trong `thoi_khoa_bieu_tuan.cac_buoi`, đã có sẵn, không
  truy vấn thêm.

### Việc FE phải sửa

`frontend/src/app/features/dashboard/dashboard-sinh-vien.html`:
- Dòng 148-204: bảng học phần về 2 cột (`ma_mon` + `ten_mon` | `so_tin_chi`).
- Dòng 243-325: bỏ cả card "Chuyên cần & GPA" (doughnut + cảnh báo "môn cần chú ý").
- Dòng 165-202: bỏ thanh `o-chuyen-can`.

`dashboard-sinh-vien.ts`:
- Dòng 195-211: `taiDiem()` vẫn cần cho **biểu đồ** (dùng `bangDiem`), nhưng không dùng
  `ty_le_chuyen_can` nữa.
- Bỏ computed liên quan `chuyenCan()`, `latChuyenCan()`, `sacChuyenCan()`, `moMonCanChuY()`.

`dashboard.model.ts` — xóa interface trường tương ứng.

### Rủi ro

Đổi response shape → Postman collection và tài liệu `docs/04-api-contract.md` §14 phải cập nhật
cùng lượt. FE cũ gọi API mới sẽ không vỡ (chỉ thiếu key), nhưng nếu có client khác thì phải biết.

---

## V5 — Thêm `ma_mon` vào payload dashboard

Đã đo: `DashboardService.php:443-445` trả đủ ba trường bảng 2 cột cần:

```php
'ma_mon'      => $lop?->monHoc?->ma_mon ?? '',
'ten_mon'     => $lop?->monHoc?->ten_mon ?? '',
'so_tin_chi'  => (int) ($lop?->monHoc?->so_tin_chi ?? 0),
```

**Không cần đổi API.** V5 chỉ còn là việc FE bỏ cột và hiển thị lại `ma_mon` thay cho `ma_lop_hp`.
Gộp V5 vào V4.

---

## V6 — Bỏ `nam_thu`

### Hiện trạng đo được

- Migration: `2026_10_24_000300_them_nam_thu_vao_lop_hoc_phan.php` (có cả `down()`)
- **16 file** backend tham chiếu, **14 file** frontend.
- `LopHocPhanResource.php:46` trả `'nam_thu'`.
- `LopHocPhanController` validate `'nam_thu' => between:1,6`.
- `DangKyHocPhanService::kiemTraDieuKienDangKy()` dòng 203-208 — luật `WRONG_STUDY_YEAR`.
- `tests/Feature/DangKyHocPhanTest.php:228` chờ `ma_loi = WRONG_STUDY_YEAR`.
- `docs/03-data-model.md` §5.6 — công thức `nam_thu`.

### Việc phải làm

1. Migration mới `dropColumn('nam_thu')` + `dropIndex(['nam_thu'])`.
2. Xóa luật BR-23 khỏi `kiemTraDieuKienDangKy()`.
3. Xóa `WRONG_STUDY_YEAR` khỏi API contract và test.
4. FE: bỏ cột "Năm thứ" (`danh-sach.ts:92`), bỏ dòng 77 trong `dang-ky-hoc-phan.ts`.
5. Docs: BR-23, FR-09.02, FR-09.05, `03-data-model.md` §5.6.

### Rủi ro

Bỏ cột là **không thể hoàn tác** nếu dữ liệu thật đã có giá trị. Cần user duyệt migration.
`down()` có thể thêm lại cột nhưng dữ liệu cũ mất.

---

## Thứ tự thực hiện đề xuất

```
V2 + V3 (backend thuần, không đổi schema, đổi quyền + test)
  ↓
V4 (đổi hợp đồng API, FE sửa cùng lượt)
  ↓
V1 (seeder + seed lại DB local)
```

**V6 hoãn** — bỏ `nam_thu` chạm 16 file BE + 14 file FE và không hoàn tác được. Bỏ nó xong thì
không còn rào nào chặn sinh viên khóa trước vào lớp khóa dưới. Bịt lỗ đó là việc của kiến trúc
học lại (đợt sau). Làm V6 bây giờ = mở lỗ trong lúc chờ bịt.

---

## Đã chốt, không cần hỏi lại

| Câu | Trả lời |
|---|---|
| V1 làm sạch dữ liệu cũ? | Có — DB local trước, Aiven sau |
| V2 giảng viên sinh lịch? | **Không.** Chỉ ADMIN, như phòng đào tạo |
| V3 phạm vi lý do khi kỳ đóng? | Không cần lý do — **không ai** ghi được, kể cả ADMIN |
| V6 bỏ `nam_thu`? | Hoãn tới khi chốt kiến trúc học lại |

## Còn chờ user

Không còn câu chặn. Spec đủ điều kiện để giao code V2 + V3.
