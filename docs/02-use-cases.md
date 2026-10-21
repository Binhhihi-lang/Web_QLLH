# 02 — Use Case & Tiêu chí chấp nhận

Mỗi use case ánh xạ 1-1 tới FR trong [01-requirements.md](01-requirements.md) và test case trong [06-test-plan.md](06-test-plan.md).

**Ký hiệu:** `UC-xx` = use case, `AC-x` = acceptance criteria.

---

## UC-01 — Đăng nhập

**Actor:** mọi vai trò · **FR:** FR-01.01, FR-01.02, BR-02

**Tiền điều kiện:** tài khoản tồn tại.

**Luồng chính**
1. Người dùng nhập email + mật khẩu.
2. Hệ thống kiểm tra tồn tại, mật khẩu đúng, `trang_thai = true`.
3. Tạo token Sanctum hạn 7 ngày.
4. Trả token, thông tin user, cờ `must_change_password`.

**Luồng lỗi**
- Sai email/mật khẩu → 401 `AUTH_INVALID`, thông báo chung "Email hoặc mật khẩu không đúng".
- Tài khoản khóa → 403 `ACCOUNT_LOCKED`.
- Quá 5 lần/phút/IP → 429.

**AC**
- AC-1: Trả 200 với `token` không rỗng.
- AC-2: Sai mật khẩu không tiết lộ email có tồn tại hay không.
- AC-3: Tài khoản khóa không tạo được token.
- AC-4: Mật khẩu lưu dạng bcrypt, không bao giờ trả về.

---

## UC-02 — Đổi mật khẩu lần đầu

**Actor:** TEACHER, STUDENT · **FR:** FR-01.05

**Tiền điều kiện:** đăng nhập thành công, `must_change_password = true`.

**Luồng chính**
1. FE phát hiện cờ, chuyển thẳng tới màn đổi mật khẩu.
2. Người dùng nhập mật khẩu cũ + mới + xác nhận.
3. Hệ thống kiểm tra, cập nhật, đặt cờ = false, thu hồi token khác.

**Luồng lỗi**
- Gọi endpoint khác khi cờ còn true → 403 `MUST_CHANGE_PASSWORD`.
- Mật khẩu cũ sai → 422.

**AC**
- AC-1: Chỉ 3 endpoint được phép khi cờ true.
- AC-2: Đổi xong, mọi endpoint hoạt động bình thường.
- AC-3: Token cũ khác bị thu hồi.

---

## UC-03 — Tạo sinh viên kèm tài khoản

**Actor:** ADMIN · **FR:** FR-02.01, BR-01

**Tiền điều kiện:** đăng nhập ADMIN.

**Luồng chính**
1. Nhập mã SV, họ tên, ngày sinh, giới tính, email, SĐT, địa chỉ, lớp hành chính (tùy chọn).
2. Hệ thống kiểm tra mã SV và email chưa tồn tại (kể cả bản ghi xóa mềm và `users.email`).
3. Tạo `users` (vai_tro `sinh_vien`, mật khẩu ngẫu nhiên 12 ký tự, `must_change_password = true`).
4. Tạo `sinh_vien` gắn `user_id`.
5. Trả hồ sơ + `mat_khau_ban_dau` **một lần duy nhất**.

**Luồng lỗi**
- Trùng mã SV → 422 `DUPLICATE_CODE`.
- Trùng email (bảng nào cũng tính) → 422 `DUPLICATE_EMAIL`.
- Lớp hành chính không tồn tại/đã xóa → 422.
- Thiếu trường bắt buộc → 422.

**AC**
- AC-1: Tạo trong 1 transaction; lỗi bước nào rollback bước đó.
- AC-2: `mat_khau_ban_dau` chỉ xuất hiện trong response tạo/reset, không có trong `GET`.
- AC-3: Sinh viên đăng nhập được bằng email + mật khẩu ban đầu và bị bắt đổi mật khẩu.
- AC-4: Mã của bản ghi đã xóa mềm không dùng lại được.

---

## UC-04 — Xóa sinh viên

**Actor:** ADMIN · **FR:** FR-02.06, mục 6.1

**Luồng chính**
1. ADMIN chọn xóa.
2. Hệ thống kiểm tra còn đăng ký ACTIVE ở học kỳ chưa CLOSED không.
3. Nếu không, xóa mềm `sinh_vien` + `users`, ghi `deleted_by`, ghi `nhat_ky`.
4. Giữ nguyên đăng ký, điểm, điểm danh.

**Luồng lỗi**
- Còn đăng ký ACTIVE → 409 `DELETE_BLOCKED` kèm danh sách lớp học phần đang học.

**AC**
- AC-1: Bản ghi biến mất khỏi danh sách mặc định.
- AC-2: Điểm và điểm danh cũ vẫn tra cứu được, hiển thị tên kèm nhãn "đã xóa".
- AC-3: Tài khoản bị xóa cùng, token bị thu hồi.

---

## UC-04B — Chuẩn bị học kỳ trước đợt đăng ký

**Actor:** ADMIN · **FR:** FR-05, FR-06, FR-07, FR-08, FR-10, BR-06, BR-15, BR-22

Đây là luồng nghiệp vụ nền: **mọi thứ phải có sẵn trước khi sinh viên bấm đăng ký**. Nếu thiếu một bước, sinh viên sẽ không thấy lớp hoặc không đăng ký được.

### Thứ tự bắt buộc

```
(1) Học kỳ  →  (2) Môn học  →  (3) Phòng học  →  (4) Giảng viên
                                        ↓
                              (5) Lớp học phần
                                        ↓
                              (6) Buổi học  ←  (3) Phòng
                                        ↓
                    (7) Mở đợt đăng ký  →  (8) Sinh viên đăng ký
```

Các bước (1)–(4) là **danh mục dùng chung**, làm một lần và tái sử dụng nhiều học kỳ. Chỉ (5)–(8) lặp lại mỗi kỳ.

### Chi tiết từng bước

| Bước | Việc cần làm | Điều kiện / lưu ý | Nếu thiếu |
|---|---|---|---|
| 1 | Tạo **học kỳ**: mã, tên, ngày bắt đầu/kết thúc, thời gian mở/đóng đăng ký, trạng thái `UPCOMING` | `ngay_bat_dau < ngay_ket_thuc`; `mo_dang_ky < dong_dang_ky` | Không mở được lớp học phần |
| 2 | Đảm bảo **môn học** cần dạy đã tồn tại và `ACTIVE` | Môn INACTIVE không mở lớp được | Không chọn được môn |
| 3 | Đảm bảo **phòng học** tồn tại và `ACTIVE` | Phòng INACTIVE không xếp lịch được | Không xếp được lịch |
| 4 | Đảm bảo **giảng viên** tồn tại và `ACTIVE` | Giảng viên INACTIVE không gán được | Không mở được lớp |
| 5 | Mở **lớp học phần**: mã lớp, môn, học kỳ, giảng viên, sĩ số tối đa, trạng thái `OPEN` | Mã lớp duy nhất **trong học kỳ**; không giảm sĩ số dưới số đã đăng ký | Sinh viên không thấy lớp để đăng ký |
| 6 | Tạo **buổi học** (nhập tay hoặc sinh lịch hàng tuần) | Kiểm tra trùng phòng, trùng giảng viên, trùng sinh viên đã đăng ký | Sinh viên đăng ký được nhưng **không kiểm tra được trùng lịch** |
| 7 | Kiểm tra **thời gian đăng ký** của học kỳ đã đúng chưa; chuyển học kỳ sang `ONGOING` khi vào kỳ | STUDENT chỉ đăng ký được trong khoảng `mo_dang_ky_luc` – `dong_dang_ky_luc` | STUDENT nhận lỗi `OUTSIDE_REGISTRATION` |
| 8 | (Sinh viên đăng ký) | Xem UC-08 | – |

### Ba điều dễ hiểu sai

**1. Gán giảng viên KHÔNG phải tùy chọn.**
Tài liệu yêu cầu mỗi lớp học phần có đúng một giảng viên phụ trách (`giang_vien_id` bắt buộc). Lý do: điểm danh, nhập điểm và phân quyền đều dựa trên quan hệ này. Nếu để trống, lớp không có ai chấm điểm và TEACHER không thấy lớp trong danh sách của mình. Trường hợp "chưa biết ai dạy" thì vẫn phải gán tạm một giảng viên rồi đổi sau (FR-08.03 cho phép đổi, có kiểm tra trùng lịch).

**2. Thứ tự tạo buổi học và đăng ký.**
Phải tạo **buổi học trước** khi sinh viên đăng ký, vì kiểm tra trùng lịch của sinh viên (BR-08) cần biết lớp có những buổi nào. Đây là điểm đã sửa so với v0.2 (ADR-010).

**3. Đăng ký chưa cần điểm, nhưng cần lịch.**
Sinh viên chọn môn → hệ thống so lịch các lớp đã đăng ký với lịch lớp muốn đăng ký → nếu trùng thì báo lỗi kèm **chi tiết buổi nào trùng với lớp nào**, không chỉ báo "trùng lịch".

### Luồng đăng ký của sinh viên (tóm tắt)

```
Sinh viên mở danh sách lớp OPEN của học kỳ
        ↓
Hệ thống lọc: còn chỗ, đúng học kỳ, chưa đăng ký, chưa học môn này trong kỳ
        ↓
Sinh viên chọn lớp  →  hệ thống kiểm tra lại toàn bộ (server-side)
        ↓
   ┌── Trùng lịch? ──► 409 SCHEDULE_CONFLICT + danh sách buổi trùng
   ├── Hết chỗ?    ──► 409 SECTION_FULL
   ├── Trùng môn?  ──► 409 DUPLICATE_SUBJECT_IN_SEMESTER
   └── Hợp lệ       ──► 201, lớp xuất hiện trong thời khóa biểu
```

**AC**
- AC-1: Không thể mở lớp học phần khi thiếu học kỳ, môn, giảng viên.
- AC-2: Sinh viên không thấy lớp `CLOSED`/`CANCELLED` trong danh sách đăng ký.
- AC-3: Khi trùng lịch, response nêu rõ buổi trùng (ngày, giờ, lớp đã đăng ký).
- AC-4: Nếu ADMIN sửa lịch sau khi đã có đăng ký mà gây trùng, hệ thống chặn và trả danh sách xung đột (BR-22).
- AC-5: Sinh viên đăng ký xong thấy ngay lớp trong thời khóa biểu tuần.

---

## UC-05 — Mở lớp học phần

**Actor:** ADMIN · **FR:** FR-08.01, FR-08.05, BR-15

**Luồng chính**
1. Chọn môn, học kỳ, giảng viên, nhập mã lớp HP, sĩ số tối đa, trạng thái OPEN.
2. Hệ thống kiểm tra môn/giảng viên/học kỳ hợp lệ và chưa bị xóa.
3. Kiểm tra mã lớp HP chưa dùng trong học kỳ đó.
4. Tạo bản ghi.

**Luồng lỗi**
- Môn hoặc giảng viên INACTIVE → 422.
- Học kỳ CLOSED → 409 `SEMESTER_CLOSED`.
- Trùng mã trong học kỳ → 422 `DUPLICATE_CODE`.
- Sĩ số ≤ 0 → 422.

**AC**
- AC-1: `si_so_hien_tai` = 0 ngay sau khi tạo.
- AC-2: Mã lớp trùng với bản ghi đã xóa mềm cũng bị chặn.

---

## UC-06 — Sinh lịch hàng tuần

**Actor:** ADMIN · **FR:** FR-10.02, FR-10.04, BR-06, BR-22

**Luồng chính**
1. Chọn thứ trong tuần, giờ bắt đầu/kết thúc, phòng, khoảng ngày.
2. Hệ thống sinh danh sách ngày thỏa điều kiện.
3. Kiểm tra từng ngày: trùng phòng, trùng giảng viên, trùng lịch sinh viên đã đăng ký.
4. Nếu không trùng ngày nào, tạo tất cả trong 1 transaction.
5. Trả danh sách buổi đã tạo.

**Luồng lỗi**
- Có bất kỳ buổi trùng → **không tạo buổi nào**, trả 409 `SCHEDULE_CONFLICT` kèm danh sách chi tiết.
- Giờ kết thúc ≤ giờ bắt đầu → 422.
- Phòng INACTIVE → 422.

**AC**
- AC-1: Không có buổi nào được tạo khi có xung đột (all-or-nothing).
- AC-2: Danh sách trả về ghi rõ loại xung đột (`phong_hoc`, `giang_vien`, `sinh_vien`).
- AC-3: Hai buổi liền kề (9:00 kết thúc, 9:00 bắt đầu) không bị coi là trùng.

---

## UC-07 — ADMIN đăng ký học phần hộ

**Actor:** ADMIN · **FR:** FR-09.01, FR-09.05, BR-08, BR-09

**Luồng chính**
1. Chọn sinh viên + lớp học phần.
2. Mở transaction, khóa dòng `lop_hoc_phan` (`lockForUpdate`).
3. Kiểm tra lần lượt: sinh viên ACTIVE; lớp OPEN; học kỳ chưa CLOSED; chưa đăng ký ACTIVE lớp này; không trùng môn trong học kỳ; còn chỗ; không trùng lịch.
4. Nếu bản ghi cũ đang CANCELLED → kích hoạt lại; nếu chưa có → tạo mới.
5. Commit, trả bản ghi.

**Luồng lỗi** — trả 409 với mã tương ứng: `STUDENT_INACTIVE`, `SECTION_NOT_OPEN`, `SEMESTER_CLOSED`, `DUPLICATE_ENROLLMENT`, `DUPLICATE_SUBJECT_IN_SEMESTER`, `SECTION_FULL`, `SCHEDULE_CONFLICT`.

**AC**
- AC-1: Hai request đồng thời tranh chỗ cuối → chỉ một thành công, request còn lại nhận `SECTION_FULL`.
- AC-2: ADMIN không bị chặn bởi đợt đăng ký.
- AC-3: Đăng ký lại sau hủy không tạo dòng mới, chỉ đổi trạng thái và cập nhật `dang_ky_luc`.

---

## UC-08 — Sinh viên tự đăng ký

**Actor:** STUDENT · **FR:** FR-09.02, FR-09.05, BR-10

**Tiền điều kiện:** đã đổi mật khẩu lần đầu, đang trong đợt đăng ký.

**Luồng chính**
1. Xem danh sách lớp OPEN còn chỗ trong học kỳ đang mở đăng ký.
2. Chọn lớp, gửi đăng ký.
3. Hệ thống kiểm tra toàn bộ FR-09.05 **cộng** điều kiện trong đợt đăng ký.
4. Tạo đăng ký với `dang_ky_boi = user hiện tại`.

**Luồng lỗi**
- Ngoài đợt → 409 `OUTSIDE_REGISTRATION`.
- Các lỗi còn lại như UC-07.

**AC**
- AC-1: STUDENT không đăng ký hộ người khác được (403).
- AC-2: STUDENT không thấy lớp đã CLOSED/CANCELLED trong danh sách đăng ký.
- AC-3: Không thấy lớp có buổi trùng lịch đã đăng ký (hoặc thấy nhưng bị chặn khi bấm).

---

## UC-09 — Hủy đăng ký

**Actor:** ADMIN, STUDENT · **FR:** FR-09.03, BR-11, BR-20

**Luồng chính**
1. Chọn đăng ký cần hủy.
2. STUDENT: kiểm tra trong đợt đăng ký **và** chưa có điểm/điểm danh.
3. ADMIN: chỉ chặn khi học kỳ CLOSED.
4. Đổi `trang_thai = CANCELLED`, ghi `huy_boi`, `huy_luc`, `ly_do_huy`.
5. Ghi `nhat_ky`.

**Luồng lỗi**
- STUDENT ngoài đợt → 409 `OUTSIDE_REGISTRATION`.
- STUDENT đã có điểm/điểm danh → 409 `HAS_GRADE_OR_ATTENDANCE`.
- Học kỳ CLOSED → 409 `SEMESTER_CLOSED`.

**AC**
- AC-1: Sĩ số lớp giảm ngay.
- AC-2: Điểm và điểm danh cũ giữ nguyên.
- AC-3: Đăng ký lại được sau khi hủy (nếu còn chỗ và thỏa điều kiện).

---

## UC-10 — Điểm danh buổi học

**Actor:** TEACHER · **FR:** FR-11.01, FR-11.02, BR-03, BR-21

**Luồng chính**
1. TEACHER mở buổi học thuộc lớp mình phụ trách.
2. Hệ thống lấy danh sách đăng ký ACTIVE **tại thời điểm buổi học** (theo `dang_ky_luc` và `huy_luc`).
3. TEACHER đánh dấu từng người, gửi hàng loạt.
4. Hệ thống upsert `diem_danh`, ghi `diem_danh_boi`, `diem_danh_luc`.
5. Nếu buổi đang `SCHEDULED` và thời điểm kết thúc đã qua, chuyển `DONE`.

**Luồng lỗi**
- Lớp không thuộc TEACHER → 403.
- Học kỳ CLOSED → 409.
- Sửa quá 7 ngày (TEACHER) → 409 `ATTENDANCE_EDIT_EXPIRED`.
- Đăng ký không thuộc buổi → 422.

**AC**
- AC-1: Sinh viên hủy trước buổi không xuất hiện.
- AC-2: Sinh viên hủy sau buổi vẫn có bản ghi điểm danh.
- AC-3: Điểm danh lần 2 cập nhật bản ghi cũ, không tạo trùng.

---

## UC-11 — Nhập và chốt điểm

**Actor:** TEACHER · **FR:** FR-12.01 → FR-12.04, BR-05, BR-13

**Luồng chính**
1. TEACHER mở bảng điểm lớp mình phụ trách.
2. Nhập điểm chuyên cần, giữa kỳ, cuối kỳ cho từng sinh viên.
3. Hệ thống validate 0–10, 2 chữ số thập phân; tính `diem_tong_ket` và `ket_qua` khi đủ 3 điểm; ghi `lich_su_diem` cho mỗi thay đổi.
4. Khi đã nhập đủ, TEACHER bấm chốt.
5. Hệ thống kiểm tra mọi đăng ký ACTIVE có đủ 3 điểm; nếu đủ, lưu `chot_diem_luc`, `chot_diem_boi`.

**Luồng lỗi**
- Điểm ngoài 0–10 → 422.
- Sửa sau khi chốt → 409 `GRADE_LOCKED`.
- Chốt khi còn sinh viên thiếu điểm → 409 `GRADE_INCOMPLETE` kèm danh sách.

**AC**
- AC-1: Công thức 25/25/50, làm tròn 2 chữ số.
- AC-2: `ket_qua = DAT` khi ≥ 4.0.
- AC-3: Mọi thay đổi có dòng `lich_su_diem` ghi giá trị cũ và mới.
- AC-4: Sau chốt, TEACHER không sửa được; ADMIN mở khóa được kèm lý do và lý do được ghi `nhat_ky`.

---

## UC-12 — Xem điểm và GPA

**Actor:** STUDENT · **FR:** FR-12.05

**Luồng chính**
1. STUDENT mở trang điểm theo học kỳ.
2. Hệ thống trả danh sách môn, điểm thành phần, tổng kết, kết quả.
3. Tính GPA theo trọng số tín chỉ, tính cả môn KHÔNG ĐẠT, làm tròn 2 chữ số.

**AC**
- AC-1: Chỉ thấy điểm của chính mình.
- AC-2: Không thấy điểm khi lớp chưa có điểm tổng kết (trả null).
- AC-3: GPA khớp công thức ở [03-data-model.md](03-data-model.md) mục 5.2.

---

## UC-13 — Xóa mềm và khôi phục

**Actor:** ADMIN · **FR:** FR-14.01 → FR-14.05

**Luồng chính**
1. ADMIN mở thùng rác theo loại.
2. Lọc theo người xóa, thời gian.
3. Chọn khôi phục.
4. Hệ thống kiểm tra bản ghi cha chưa bị xóa và mã không xung đột.
5. Khôi phục, ghi `restored_by`, ghi `nhat_ky`. Sinh viên/giảng viên khôi phục kèm tài khoản.

**Luồng lỗi**
- Cha đã xóa → 409 `RESTORE_PARENT_DELETED`.
- Mã bị bản ghi khác chiếm → 409 `DUPLICATE_CODE`.

**AC**
- AC-1: Bản ghi khôi phục xuất hiện lại trong danh sách.
- AC-2: Tài khoản đi kèm được khôi phục cùng.
- AC-3: Dữ liệu lịch sử liên quan vẫn nguyên.

---

## UC-14 — Hủy lớp học phần

**Actor:** ADMIN · **FR:** FR-08.04

**Luồng chính**
1. ADMIN chuyển lớp sang CANCELLED, nhập lý do.
2. Hệ thống chuyển toàn bộ đăng ký ACTIVE → CANCELLED (ghi `huy_boi`, `huy_luc`, lý do).
3. Chuyển buổi `SCHEDULED` → CANCELLED.
4. Giữ nguyên điểm và điểm danh đã phát sinh.
5. Ghi `nhat_ky`.

**AC**
- AC-1: Không còn đăng ký ACTIVE sau khi hủy lớp.
- AC-2: Sinh viên thấy lớp ở trạng thái "đã hủy" trong lịch sử.
- AC-3: Không nhận đăng ký mới.

---

## UC-15 — Xem thời khóa biểu

**Actor:** STUDENT, TEACHER · **FR:** FR-10.03

**Luồng chính**
1. Người dùng chọn tuần.
2. STUDENT: hệ thống lấy buổi học của các lớp đã đăng ký ACTIVE.
3. TEACHER: lấy buổi của các lớp mình phụ trách.
4. Trả danh sách theo ngày, kèm môn, lớp, phòng, giờ, trạng thái buổi.

**AC**
- AC-1: Không lộ lịch lớp không liên quan.
- AC-2: Buổi CANCELLED hiển thị khác biệt (mờ/gạch).
- AC-3: Lọc theo tuần, tháng, học kỳ.

---

## UC-16 — Dashboard theo vai trò

**Actor:** ADMIN, TEACHER, STUDENT · **FR:** FR-13.01 → FR-13.03

**AC chung**
- AC-1: Dữ liệu tính theo học kỳ hiện tại.
- AC-2: TEACHER/STUDENT chỉ thấy dữ liệu trong phạm vi của mình.
- AC-3: Không có truy vấn N+1; thời gian phản hồi < 500 ms với dữ liệu demo.

---

## Ma trận truy vết

| UC | FR | BR | Test case |
|---|---|---|---|
| UC-01 | FR-01.01, .02 | BR-02 | TC-01 |
| UC-02 | FR-01.05 | – | TC-02 |
| UC-03 | FR-02.01 | BR-01 | TC-03 |
| UC-04 | FR-02.06 | 6.1 | TC-04 |
| UC-04B | FR-05 → FR-10 | BR-06, BR-15, BR-22 | TC-04B |
| UC-05 | FR-08.01, .05 | BR-15 | TC-05 |
| UC-06 | FR-10.02, .04 | BR-06, BR-22 | TC-06 |
| UC-07 | FR-09.01, .05 | BR-08, BR-09 | TC-07 |
| UC-08 | FR-09.02, .05 | BR-10 | TC-08 |
| UC-09 | FR-09.03 | BR-11, BR-20 | TC-09 |
| UC-10 | FR-11.01, .02 | BR-03, BR-21 | TC-10 |
| UC-11 | FR-12.01 → .04 | BR-05, BR-13 | TC-11 |
| UC-12 | FR-12.05 | – | TC-12 |
| UC-13 | FR-14.01 → .05 | BR-18 | TC-13 |
| UC-14 | FR-08.04 | – | TC-14 |
| UC-15 | FR-10.03 | – | TC-15 |
| UC-16 | FR-13.01 → .03 | – | TC-16 |
