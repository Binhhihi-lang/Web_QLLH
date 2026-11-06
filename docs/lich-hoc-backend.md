# Backend lịch học — phần Tiến

Nhánh `feature/be-schedules`: API `GET /api/schedules` và `ScheduleService`
(BR-06, BR-22). CRUD `sessions` và sinh lịch hàng tuần vẫn thuộc PM.

## API xem lịch

Quyền, bộ lọc và response: `04-api-contract.md` mục 11. Dùng `per_page=100`
và theo `links.next` nếu giao diện lịch cần lấy quá một trang. Service mới
không phụ thuộc controller CRUD học kỳ trên nhánh khác.

## Interface cho PM

Laravel tự resolve `App\Services\ScheduleService` qua dependency injection.
Mỗi buổi đầu vào gồm `ngay_hoc`, `gio_bat_dau`, `gio_ket_thuc`, `phong_hoc_id`.
Ngày dùng `YYYY-MM-DD`; giờ nhận `HH:mm` hoặc `HH:mm:ss`.

```php
// Tạo buổi: gọi trước khi lưu.
$scheduleService->kiemTraTrungLich($lop, $duLieu);

// Sửa buổi: bỏ qua chính buổi của lớp đó, không bỏ qua buổi lớp khác.
$scheduleService->kiemTraTrungLich($lop, $duLieu, $buoi->id);

// Đổi giảng viên: kiểm tra với ID mới mà chưa cần cập nhật lớp.
$trung = $scheduleService->timTrungLich($lop, $duLieu, $buoi->id, $giangVienMoiId);

// Sinh lịch: dựng toàn bộ dữ liệu buổi, kiểm tra một lần trước khi insert.
$scheduleService->kiemTraDanhSach($lop, $cacBuoi);

// Adapter cho EnrollmentService của Tiến (chưa tạo đăng ký).
$trung = $scheduleService->timTrungLichDangKy($sinhVien, $lopMuonDangKy);
```

- `timTrungLich()` trả danh sách xung đột; `kiemTraTrungLich()` và
  `kiemTraDanhSach()` ném `LoiNghiepVu` 409 `SCHEDULE_CONFLICT`, có
  `errors.trung_lich`. Không ghi dữ liệu trong các phương thức này.
- Lô tối đa 500 buổi, phát hiện cả xung đột với database và trong chính lô.
  Truy vấn các buổi/đăng ký liên quan được gom lại, không query từng dòng.
- Chỉ kiểm tra buổi SCHEDULED của lớp chưa xóa/chưa CANCELLED. Không chặn
  bởi buổi DONE, CANCELLED hoặc đã xóa mềm. Khoảng liền kề không trùng.
- Sinh viên chỉ gây xung đột khi có đăng ký ACTIVE ở cả hai lớp. Adapter
  đăng ký chỉ kiểm tra lịch của chính sinh viên, không xét phòng/GV không liên quan.
- Mỗi xung đột có ID buổi/lớp, mã lớp, ngày, giờ, `loai` (phong_hoc,
  giang_vien, sinh_vien), `doi_tuong`; loại sinh viên kèm `sinh_vien_id`.
  Một buổi có thể xuất hiện nhiều lần khi vi phạm nhiều loại.

PM vẫn cần kiểm tra quyền, trạng thái học kỳ, ngày buổi nằm trong kỳ, phòng
hoạt động/sức chứa và xác nhận khi đã có điểm danh trong request/service ghi.
Kiểm tra và lưu phải nằm trong cùng transaction; các luồng ghi đồng thời phải
thống nhất khóa phòng/giảng viên/lớp liên quan. Service đọc không tự bảo đảm
chống tranh chấp giữa hai transaction ghi lịch — phần này cần phối hợp khi
PM triển khai endpoint ghi. Nhánh này chưa thay đổi code module lớp học phần của PM.

## Kiểm thử

```powershell
cd backend
php artisan test --filter=LichHocTest
```

Postman: folder **17 — Lịch học (luồng thành công)**, 14 request, chỉ đăng nhập
và GET hợp lệ. Chạy riêng folder theo thứ tự. ID và ngày lọc lấy từ lịch sẵn có;
không có dữ liệu thì các bước lọc cần ID tự bỏ qua. Các tình huống xung đột,
query sai và phân quyền được kiểm tra bằng PHPUnit, không tạo request cố ý
gây lỗi trong folder này.
