# 05 — Màn hình & Điều hướng Frontend

**Stack:** Angular 22 standalone · Angular Material 22 · TailwindCSS 3 · Signals

---

## 1. Cấu trúc thư mục

```
src/app/
  core/
    auth/            auth.service.ts, auth.interceptor.ts, role.guard.ts, must-change-password.guard.ts
    models/          *.model.ts  (sinh từ openapi.yaml)
    services/        sinh-vien.service.ts, dashboard.service.ts, ...
    layout/          main-layout.ts, sidebar.ts, header.ts, footer.ts
    mock/            mock.interceptor.ts, mock-registry.ts, mock-response.ts,
                     registry/{dao-tao,hoc-vu}.registry.ts, data/{dao-tao,hoc-vu,dashboard}.mock.ts
  shared/
    ui/              13 component dùng lại + 1 trang giữ chỗ:
                     app-button, app-card, app-alert, status-badge, empty-state,
                     loading (skeleton + spinner), page-header, search-input,
                     pagination, data-table, form-field, confirm-dialog,
                     date-input, dang-xay-dung
    pipes/           ngay-vn.pipe.ts
  features/
    auth/            login, change-password
    dashboard/       admin, teacher, student
    he-thong/        nguoi-dung, cau-hinh
    dao-tao/         sinh-vien, giang-vien, lop-hanh-chinh, mon-hoc, hoc-ky, phong-hoc
    hoc-vu/          lop-hoc-phan, dang-ky, lich-hoc, diem-danh, diem
    style-guide/     trang xem token + component
  routes/            dao-tao.routes.ts, hoc-vu.routes.ts, he-thong.routes.ts
```

> **Vì sao `shared/ui/` chứ không phải `shared/components/`:** thư mục `ui` gom
> mọi thứ hiển thị dùng lại được (nút, bảng, ô nhập, badge…); `pipes` và
> `directives` để riêng vì không phải component. Hai dự án trước dùng
> `shared/components/`, nhưng ở đây đã chốt `shared/ui/` từ Tuần 2 và toàn bộ
> import đang trỏ vào đó (`@shared/ui/*`).

**Quy ước bắt buộc** (theo 2 dự án trước):
- Component `standalone: true`.
- Dùng `@if`, `@for (x of xs; track x.id)`, **không** dùng `*ngIf`/`*ngFor`.
- State bằng signals: `signal()`, `computed()`, `effect()`.
- Import Material module trực tiếp vào `imports` của component.
- Mỗi feature lazy-load qua `loadChildren`/`loadComponent`.

---

## 2. Điều hướng cấp cao

**Bốn nhóm menu trên sidebar:**

| Nhóm hiển thị | Tên trong code | Nội dung |
|---|---|---|
| Tổng quan | — | Dashboard |
| **Đào tạo** | `dao-tao` | Sinh viên, Giảng viên, Lớp hành chính, Môn học, Học kỳ, Phòng học |
| Học vụ | `hoc-vu` | Lớp học phần, Đăng ký, Lịch học, Điểm danh, Điểm |
| Hệ thống | — | Người dùng, Menu, Cấu hình, Nhật ký, Thùng rác |

> Nhóm thứ hai tên là **"Đào tạo"** ở mọi nơi: nhãn sidebar, tên thư mục
> (`features/dao-tao/`), tên file (`routes/dao-tao.routes.ts`), và cột `nhom`
> trong bảng `menus`.
>
> **Phân công UI:** Đức Anh phụ trách đào tạo SCR-10–24; Đạt phụ trách học vụ
> SCR-25–43, dashboard SCR-03–05 và các màn menu SCR-47/48 đã hoàn tất. PM phụ
> trách SCR-45 và SCR-49–51 trên nhánh `giao-dien-he-thong`; Nhật ký đang chờ API
> đọc danh sách từ backend. Chi tiết ownership file và tiến độ nằm trong
> [phan-cong-cong-viec.md](phan-cong-cong-viec.md).

```
/                     → redirect theo vai trò
/dang-nhap            → chuyển tiếp đến cổng quản trị (tương thích route cũ)
/dang-nhap/admin      → SCR-01A (ADMIN)
/dang-nhap/giang-vien → SCR-01B (GIANG_VIEN)
/dang-nhap/sinh-vien  → SCR-01C (SINH_VIEN, dùng mã sinh viên)
/doi-mat-khau         → SCR-02
/tai-khoan            → SCR-02C (mọi vai trò đã đăng nhập)
/dashboard            → SCR-03/04/05 (theo vai trò)
/gioi-thieu           → trang giới thiệu (đang xây dựng)
/sinh-vien            → SCR-10 (ADMIN, TEACHER)
/giang-vien           → SCR-13
/lop-hanh-chinh       → SCR-16
/mon-hoc              → SCR-19
/hoc-ky               → SCR-21
/hoc-ky/:id           → SCR-21 (chi tiết; bấm dòng trong danh sách)
/phong-hoc            → SCR-23
/lop-hoc-phan         → SCR-25
/dang-ky              → SCR-30 (ADMIN)
/dang-ky/danh-sach    → SCR-31 (ADMIN, TEACHER)
/dang-ky-hoc-phan     → SCR-32 (STUDENT) đăng ký theo học kỳ
/dang-ky-cua-toi      → SCR-33 (STUDENT) lịch sử đăng ký
/lich-hoc             → SCR-35
/lich-thi             → SCR-35b
/diem-danh            → SCR-38 (ADMIN, TEACHER)
/diem-danh-cua-toi    → SCR-38b (STUDENT)
/diem                 → SCR-41
/diem-cua-toi         → SCR-42 (STUDENT)
/thung-rac            → SCR-45 (ADMIN)
/menu                 → SCR-47 (ADMIN)
/menu/:id             → SCR-48 chi tiết menu (ADMIN)
/menu/:id/sua         → SCR-48 sửa menu (ADMIN); thêm menu bằng form tại chỗ ở `/menu`
/cau-hinh             → SCR-49 (ADMIN)
/nguoi-dung           → SCR-50 (ADMIN)
/nguoi-dung/them      → SCR-51 tạo tài khoản (ADMIN)
/nguoi-dung/:id/sua   → SCR-51 sửa tài khoản (ADMIN)
```

`/nhat-ky` có màn hình trạng thái chờ API; không gọi endpoint giả hoặc hiển thị
dữ liệu mẫu như thể là nhật ký thật. Chỉ bổ sung chức năng tra cứu khi backend
công bố hợp đồng API đọc danh sách.

**Đường dẫn không khớp route nào** — hai kết cục khác nhau, không được gộp:

| Trường hợp | Hiển thị |
|---|---|
| URL có trong bảng `menus` nhưng màn hình chưa code xong | `TrangChuaLam` — "Màn hình *tên mục* chưa làm", **trong layout**, sidebar vẫn dùng được |
| URL không ai khai (gõ sai) | `KhongTimThayTrang` — 404, **không layout** (không sidebar/header/footer) |

Phân biệt bằng `laTrangChuaLamGuard` (`canMatch`) đặt trên wildcard trong layout;
guard trả `false` thì router rơi tiếp xuống wildcard 404 nằm ngoài layout. Nhờ
vậy admin khai menu trước cho tuần sau được, mà gõ sai đường dẫn vẫn là 404 chứ
không lặng lẽ về dashboard như trước.

**Menu và route phải nói cùng một chuyện.** `menu.vai_tro` là **mảng** vai trò
được thấy mục (`null` = mọi vai trò), nên một mục dùng chung cho nhiều vai trò
viết được trực tiếp, ví dụ `/diem-danh` → `["ADMIN","GIANG_VIEN"]`. **Không có
ngoại lệ dành cho ADMIN**: mục nào ADMIN không được thấy thì đừng ghi ADMIN vào
mảng — nhờ vậy ADMIN không thấy `/dang-ky-cua-toi`, `/diem-cua-toi`, hai trang chỉ
có nghĩa với sinh viên. Giá trị phải khớp `data.roles` của route tương ứng.

Cài đặt: `core/utils/menu-vai-tro.ts` (`vaiTroDuocThayMenu`) cho sidebar và menu
đầu trang, `Menu::scopeHienThiCho` cho `GET /api/menus` — **hai bên phải lọc
giống hệt nhau**, sửa một bên thì sửa bên kia.

> **Lỗi đã xảy ra (27/10):** ADMIN mở được `/dang-ky` và `/diem-danh` nhưng
> sidebar giấu hai mục đó, vì menu gắn `SINH_VIEN`/`GIANG_VIEN` và bộ lọc so
> khớp tuyệt đối. Ngược lại, menu "Đăng ký" trỏ `/dang-ky` (SCR-30 đăng ký hộ,
> chỉ ADMIN) nhưng lại gắn `SINH_VIEN` → sinh viên thấy mục rồi bấm vào bị đá về
> dashboard. Có test khoá quan hệ menu ↔ route ở
> `core/utils/menu-route-nhat-quan.spec.ts`: thêm màn mới thì phải thêm mục menu
> với `vai_tro` khớp `data.roles` của route.

Ba cổng SCR-01 gọi chung `POST /api/auth/login`: ADMIN/giảng viên gửi `email`,
sinh viên gửi `ma_sv`; mỗi cổng có nhận diện, nội dung và màu nhấn riêng, sau đó
đối chiếu vai trò response của backend. Phiên đăng nhập được khôi phục qua
`GET /api/auth/me`, token Bearer được gắn vào request API và phiên bị xóa khi
request có token nhận 401. SCR-02 gọi `POST /api/auth/change-password`; tài khoản
có `must_change_password` chỉ được tiếp tục vào route này. Route nghiệp vụ và menu
được lọc theo vai trò, nhưng quyền truy cập dữ liệu vẫn phải được backend kiểm tra.
Chưa có đăng ký công khai hoặc API quên mật khẩu; người dùng liên hệ phòng đào tạo/Admin.

Khi `environment.useMock = true`, ba cổng hiển thị nút **Điền tài khoản mẫu**
để thử đăng nhập và vào các màn theo vai trò. Tài khoản mẫu: ADMIN
`admin@qllh.test`, giảng viên `gv0001@university.edu.vn`, sinh viên `2000000`;
mật khẩu dùng chung `QllhMock2026!`. Mock hỗ trợ đăng nhập, khôi phục phiên,
đăng xuất và đổi mật khẩu; các tài khoản này chỉ dùng với mock, không dùng được
để đăng nhập Backend thật. Dữ liệu đổi mật khẩu chỉ giữ trong bộ nhớ phiên mock,
tải lại ứng dụng sẽ khôi phục mật khẩu mẫu ban đầu. Khi `useMock = false`, thông
tin thử nghiệm không hiển thị.

**Guard:**
- `authGuard`: chưa đăng nhập → `/dang-nhap`.
- `roleGuard(['ADMIN'])`: sai vai trò → `/dashboard` kèm thông báo.
- `mustChangePasswordGuard`: cờ true → `/doi-mat-khau`.
- `guestGuard`: đã đăng nhập → `/dashboard`.

---

## 3. Danh sách màn hình

### 3.1. Xác thực

| Mã | Màn hình | Route | Vai trò | Thành phần chính |
|---|---|---|---|---|
| SCR-01A | Đăng nhập quản trị | `/dang-nhap/admin` | công khai | Giao diện nhận diện quản trị; email/password; xác minh role `ADMIN` |
| SCR-01B | Đăng nhập giảng viên | `/dang-nhap/giang-vien` | công khai | Giao diện nhận diện giảng viên; email/password; xác minh role `GIANG_VIEN` |
| SCR-01C | Đăng nhập sinh viên | `/dang-nhap/sinh-vien` | công khai | Giao diện nhận diện sinh viên; mã sinh viên/password (`ma_sv`); xác minh role `SINH_VIEN` |
| SCR-02 | Đổi mật khẩu | `/doi-mat-khau` | mọi vai trò đã đăng nhập | Form gọi API, kiểm tra mật khẩu mới/xác nhận; bắt buộc khi `must_change_password = true` |
| SCR-02B | 🆕 Ảnh đại diện | Dialog trên header (mọi trang) | mọi vai trò | Chọn ảnh → xem trước → tải lên; nút "Gỡ ảnh". Hiển thị ảnh tròn 32 px ở header, `avatar_url` null thì hiện chữ cái đầu tên trên nền màu theo vai trò |
| SCR-02C | Tài khoản của tôi | `/tai-khoan` | mọi vai trò đã đăng nhập | ADMIN sửa tên/email; giảng viên sửa số điện thoại; sinh viên sửa số điện thoại/địa chỉ; thông tin định danh chỉ đọc |

### 3.2. Dashboard

Ba màn cùng đường dẫn `/dashboard`, chọn bằng `vaiTroCanMatch` (`app.routes.ts`) — thứ tự
khai báo quyết định, cái đầu tiên khớp vai trò thắng.

| Mã | Màn hình | Route | Vai trò | Nội dung |
|---|---|---|---|---|
| SCR-03 | Dashboard ADMIN | `/dashboard` | ADMIN | 4 thẻ số liệu, tỷ lệ lấp đầy, danh sách lớp sắp mở, đăng ký gần đây. Đã làm (`features/dashboard/dashboard-admin.ts`) |
| SCR-04 | Dashboard TEACHER | `/dashboard` | GIANG_VIEN | 4 thẻ số liệu, lớp phụ trách, buổi sắp tới, buổi chưa điểm danh, việc cần làm |
| SCR-05 | Dashboard STUDENT | `/dashboard` | SINH_VIEN | 4 thẻ số liệu, học phần đã đăng ký, thời khoá biểu tuần, GPA, tỷ lệ chuyên cần |

Cả ba gọi một endpoint riêng, **không** gọi chéo endpoint của vai trò khác:
`GET /api/dashboard/admin` · `/teacher` · `/student` (hợp đồng đầy đủ: `04-api-contract.md` §14).
Endpoint của vai trò khác trả `403 FORBIDDEN` — FE không được gọi "cho chắc rồi bỏ qua lỗi".

#### Quy ước dùng chung cho SCR-03/04/05

| Quy ước | Lý do |
|---|---|
| **Ô chọn học kỳ đặt ở đầu trang, một ô duy nhất cho cả màn** | Mọi con số trong dashboard thuộc một kỳ: GPA, tín chỉ, chuyên cần, điểm từng môn, thời khoá biểu, lớp phụ trách. Cho mỗi khối một ô chọn riêng thì người dùng sẽ so GPA kỳ này với chuyên cần kỳ khác mà không nhận ra, và mỗi khối thành một request (vượt ngân sách < 500 ms của UC-16 AC-3). Đổi kỳ → tải lại toàn bộ màn |
| Mặc định mở kỳ `ONGOING`; không có thì kỳ mới nhất người dùng có dữ liệu | Người dùng vào xem kỳ đang học, không phải kỳ cũ nhất |
| Không nhớ lựa chọn kỳ giữa các lần vào | Tránh trạng thái ẩn: người dùng không biết vì sao lần sau mở ra lại thấy kỳ cũ |
| Bốn thẻ số liệu dùng **cùng** shape `the_so_lieu[]` (`khoa`, `label`, `gia_tri`, `don_vi`, `phu_chu`, `xu_huong`) và cùng component | Ba dashboard phải trông như một hệ thống, không phải ba sản phẩm khác nhau. Icon lấy theo `khoa` bằng một map trong component, không phải một field mới từ API
| `gia_tri` hiển thị `number`, **không** ép `int` | GPA `2.74` và phần trăm `90.7` là số thực; cắt thành int sẽ ra "2 điểm" và "90 %" sai |
| Gọi API **một lần** khi vào màn, không tự ghép nhiều endpoint rồi cộng ở client | UC-16 AC-3 đặt ngưỡng < 500 ms; tự ghép ở client sẽ lặp lại N+1 và số liệu lệch nhau giữa các lần tải |
| Trạng thái rỗng **khác** trạng thái lỗi | Trang mới chưa có dữ liệu (giảng viên chưa phân lớp, sinh viên chưa đăng ký) là bình thường, không phải sự cố |
| Nút "Thử lại" chỉ ở trạng thái lỗi | Rỗng mà hiện "Thử lại" khiến người dùng bấm mãi |
| Không vẽ chart khi mảng nguồn có < 2 phần tử | Một cột duy nhất trông như lỗi render; hiện `empty-state` hoặc số liệu dạng chữ |

#### SCR-04 — Dashboard TEACHER

**Dữ liệu:** `GET /api/dashboard/teacher`, một lần gọi, không tham số.

**Thành phần, theo thứ tự trên trang:**

| # | Thành phần | Nguồn | Trạng thái rỗng | Hành vi bấm |
|---|---|---|---|---|
| 1 | `page-header` — "Xin chào, {tên}" + dòng phụ tên học kỳ | `hoc_ky.ten_hoc_ky` | `hoc_ky = null` → phụ đề "Chưa được phân lớp trong học kỳ nào" | — |
| 2 | Lưới 4 thẻ số liệu | `the_so_lieu[]` | mảng rỗng → ẩn cả lưới, không hiện 4 thẻ trống | Thẻ `buoi_chua_diem_danh` → `/diem-danh`; thẻ `lop_phu_trach` → `/lop-hoc-phan`. Thẻ `sinh_vien_phu_trach` và `buoi_sap_toi` không bấm |
| 3 | "Lớp phụ trách" | `lop_phu_trach[]` | `empty-state`: "Chưa được phân lớp trong học kỳ này" | Bấm dòng → `/lop-hoc-phan/{id}`. Cột sĩ số hiện chuỗi `"38/45"` nguyên văn + thanh tiến trình theo `ty_le`. Badge trạng thái: `da_chot_diem = true` → "Đã chốt" màu trung tính; ngược lại `trang_thai = 'OPEN'` → "Đang mở" màu thành công; còn lại → "Đã đóng" màu trung tính |
| 3b | "Điểm TB lớp phụ trách" — biểu đồ cột, thang 10, một chuỗi | `lop_phu_trach[].diem_tb_lop` | Không lớp nào có `diem_tb_lop` là số → ẩn cả khối | Cột không bấm. Nút "Xem chi tiết" → `/lop-hoc-phan`. Ghi chú dưới biểu đồ: "Chỉ lớp đã có ít nhất một dòng điểm mới được tính. Lớp chưa chấm điểm không hiện cột." |
| 4 | "Buổi học sắp tới" — **bảng** 4 cột Ngày / Tiết / Môn / Phòng | `buoi_sap_toi[]` | `empty-state`: "Không có buổi học trong 14 ngày tới" | Bấm dòng → `/lich-hoc` (không mở form sửa — SCR-36 quản lý buổi ở trang lớp). Cột Ngày hiện `T{thu} {ngay_hoc}`; cột Tiết hiện `{tiet_bat_dau}–{tiet_ket_thuc} · {gio_bat_dau}`; dòng `hinh_thuc = THUC_HANH` gắn badge "Thực hành" cạnh tên môn; cột Phòng hiện `phong_hoc.ma_phong`, `null` → "—" |
| 5 | "Buổi chưa điểm danh" | `buoi_chua_diem_danh[]` | `empty-state`: "Đã điểm danh đủ các buổi đã qua" | Bấm dòng → `/diem-danh/{id}` nếu `con_sua_duoc = true`; nếu `false` → chỉ mở `/diem-danh` kèm thông báo "Quá hạn sửa điểm danh, chỉ quản trị viên sửa được" và **không** điều hướng vào form. Dòng `con_sua_duoc = false` hiện badge "Quá hạn" màu cảnh báo |
| 6 | "Việc cần làm" | `viec_can_lam[]` | mảng rỗng → **ẩn cả khối**, không hiện khung trống "Không có việc" | Bấm mục → `url` trong mục đó. FE **không** tự dựng URL từ `loai` — URL do backend trả để sau này thêm loại việc mới mà không sửa FE |

`muc_do` chỉ dùng để chọn màu icon/badge: `cao` → `warn`, `trung_binh` → `info`, `thap` →
`neutral`. **Không** hiển thị chữ "cao/trung bình/thấp" — người dùng không cần đọc nhãn nội bộ.

**Chuyển động (chốt 2026-11-09, cập nhật 2026-11-11):** dùng chung bộ animation của ba
dashboard, đặt ở `dashboard-chung.css` và token `--ease-out` trong `_tokens.scss`. Thẻ KPI
trượt lên so le 60/120/180ms; thanh tiến trình sĩ số chạy từ `width: 0`; cột biểu đồ mọc từ
dưới. Tất cả tắt hẳn khi `prefers-reduced-motion: reduce`.

**Bố cục (chốt 2026-11-11, sau khi đo trên trình duyệt thật):**

- **`.khung` của `MainLayout` phải có `position: relative`.** Thiếu nó, `main.noi-dung`
  (`overflow-y: auto`, nội dung 2423px trong khung 485px) không có containing block gần
  nhất nên vùng cuộn của nó bị tính vào **document**: đo được `scrollHeight` **1372px**
  trong khi viewport 582px → cuộn trang xuống thấy 790px trắng trơn, header và sidebar
  trôi mất khỏi màn hình. `overflow: hidden` trên `.khung` không chặn được. Đặt `relative`
  thì document về đúng bằng viewport, cuộn nội bộ trong `main` vẫn chạy. Khoá bằng
  `frontend/src/app/core/layout/main-layout.spec.ts`.
- `.luoi-hai` dùng `align-items: start` — mỗi thẻ tự cao theo nội dung. Bản `stretch`
  (hai thẻ cùng hàng cao bằng nhau) để lại khoảng trắng trơ trong thẻ ngắn: đo được thẻ
  "Kết quả học tập" của SCR-05 trống **462px** ở 390px (389px thật so với 851px của thẻ
  bên cạnh), và 107/113px trên SCR-04. SCR-03 cũng dùng `start`.
- **Lịch tuần SCR-05** chia cột theo bề rộng đọc được, không cố định 7 cột: ≤900px dùng
  `repeat(auto-fit, minmax(140px, 1fr))` (768px ra 4 cột, ô buổi 151px), ≤640px về 1 cột
  và ẩn ngày trống. Giữ 7 cột ở 768px làm ô buổi chỉ còn 78px trong khi nội dung cần 77px
  — chữ bị cắt và ô phình lên 145px (đo 2026-11-11).
- **Không đặt `max-height` + `overflow-y: auto` cho khối danh sách trong thẻ.** Bản cũ giới
  hạn 240px trong khi nội dung 406px, sinh vòng cuộn lồng bên trong `main.noi-dung` — người
  dùng phải cuộn hai lần. Cuộn là việc của trang; khối nào cần cuộn ngang thì khai
  `overflow-x: auto` + `overflow-y: clip` (khai `visible` sẽ bị trình duyệt ép thành `auto`).
- **Đường TB trên biểu đồ không dùng màu tối.** `--color-diem-duong` là `#366ef2` (light) /
  `#477af0` (dark), đạt 4.50:1 và 4.49:1 trên nền bề mặt. Giá trị cũ `#0f172a` chỉ đạt
  **1.01:1** trên nền tối `#111827` — đường gần như vô hình (đo 2026-11-11).
- **Tooltip biểu đồ** phải nằm trọn trong khung cuộn: chặn toạ độ dọc bằng
  `bottom: min(calc(var(--cao-nhan) + 24px), calc(100% - var(--tt-cao)))`, và cột sát mép
  (đầu, thứ 2, áp chót, cuối) dán tooltip vào mép thay vì căn giữa — căn giữa đẩy nửa khối
  ra ngoài viewport ở 390px.

**Tab chi tiết lớp học phần theo vai trò (chốt 2026-11-11):** SCR-04/05 không liên quan,
nhưng SCR-27 dùng chung đường dẫn cho ba vai trò nên ghi ở đây. ADMIN và GIANG_VIEN thấy 6
tab (Thông tin / Sinh viên / Lịch học / Điểm danh / Chuyên cần / Điểm). SINH_VIEN thấy 4 tab
(Thông tin / Sinh viên / Lịch học + hai lối sang trang cá nhân "Điểm danh của tôi" và "Điểm
của tôi", kèm `?hoc_ky_id=` của lớp). Lý do: `GET /sections/{id}/grades` và
`/attendance-summary` chỉ mở cho ADMIN/GIANG_VIEN; sinh viên đọc điểm qua `/api/me/grades`.

**Không có trên màn này:** thông báo (chưa có bảng `notifications`), nút điểm danh nhanh,
danh sách sinh viên. Giữ màn gọn — mọi thao tác ghi nằm ở màn chuyên trách.

#### SCR-05 — Dashboard STUDENT

**Dữ liệu:** `GET /api/dashboard/student`, một lần gọi, không tham số. Tuần hiển thị là
**tuần chứa hôm nay**, backend tính — FE không gửi `tu_ngay`.

**Thành phần, theo thứ tự trên trang:**

| # | Thành phần | Nguồn | Trạng thái rỗng | Hành vi bấm |
|---|---|---|---|---|
| 1 | `page-header` — "Xin chào, {tên}" + dòng phụ tên học kỳ | `hoc_ky.ten_hoc_ky` | `hoc_ky = null` → phụ đề "Chưa đăng ký học phần nào" | — |
| 1b | **Ô chọn học kỳ** (góc phải page-header) | `GET /api/options/semesters` | Không có kỳ nào → ẩn ô chọn | Đổi kỳ → gọi lại `GET /api/dashboard/student?hoc_ky_id=` và cập nhật cả màn. Trong lúc tải: giữ nguyên khung, chỉ mờ nhẹ phần số liệu (không xoá trắng gây nhảy layout) |
| 2 | Lưới 4 thẻ số liệu | `the_so_lieu[]` | mảng rỗng → ẩn lưới | `tin_chi` và `hoc_phan` → `/dang-ky-cua-toi`; `gpa_he_4` → `/diem-cua-toi`; `chuyen_can` → `/diem-danh-cua-toi` |
| 3 | "Thời khoá biểu tuần" | `thoi_khoa_bieu_tuan.cac_buoi[]` | `empty-state`: "Tuần này không có buổi học" | Bấm khối buổi → `/lich-hoc` (không mở popup liên hệ ở dashboard; popup thuộc SCR-35) |
| 4 | "Học phần đã đăng ký" | `hoc_phan_da_dang_ky[]` | `empty-state`: "Chưa đăng ký học phần nào trong học kỳ này" + nút "Đăng ký ngay" → `/dang-ky-hoc-phan` | Bấm dòng → `/lop-hoc-phan/{lop_hoc_phan_id}` |
| 5 | "Kết quả học tập" — **biểu đồ cột điểm tổng kết từng môn, thang 10** | `GET /api/me/grades?hoc_ky_id=` → `mon_hoc[].diem_tong_ket` và `mon_hoc[].diem_tb_lop` | Ít hơn 1 môn có `diem_tong_ket ≠ null` → `empty-state` "Học kỳ này chưa có điểm tổng kết". Môn chưa chấm (`null`) → cột không vẽ, nhãn trên cột hiện "—" | Cột không bấm. Nút "Xem chi tiết" ở đầu khối → `/diem-cua-toi` (lọc theo kỳ đang chọn) |
| 5b | "Chuyên cần & GPA" | `gpa`, `chuyen_can` | `gpa` luôn có; `chuyen_can.ty_le = null` → hiện "—" kèm phụ chú "Chưa có buổi nào được điểm danh" | Bấm khối GPA → `/diem-cua-toi`; bấm khối chuyên cần → `/diem-danh-cua-toi` |
| 6 | Dòng cảnh báo "Môn cần chú ý" | `chuyen_can.ty_le_thap_nhat` | `null` → ẩn | Bấm → `/diem-danh-cua-toi` (lọc theo học kỳ) |

**Hiển thị tỉ lệ — hai thang, không lẫn:**

- `the_so_lieu[khoa=chuyen_can].gia_tri` là **phần trăm 0–100** (đã có `don_vi: "%"`) → hiện
  `90,7 %`. FE **không** nhân 100 thêm lần nữa.
- `chuyen_can.ty_le` và `hoc_phan_da_dang_ky[].ty_le_chuyen_can` là **phân số 0–1** → nhân 100
  và làm tròn 1 chữ số khi cần hiện phần trăm; hoặc dùng trực tiếp để vẽ thanh tiến trình
  (thanh nhận 0–1 sẵn).
- Cả hai dùng `null` để nói "chưa có dữ liệu", khác `0` (đã điểm danh và vắng hết). `0` hiện
  `0 %`, `null` hiện `—`. Nhầm hai giá trị này là hiển thị sai nghiêm trọng.

**Màu tỉ lệ chuyên cần** — ngưỡng chỉ để tô màu, **không** phải quy tắc nghiệp vụ (hệ thống
không có BR nào cấm thi khi vắng): `< 80 %` → `warn`, `80–89,9 %` → `info`, `≥ 90 %` →
`success`. *Chờ user chốt* ngưỡng, vì đây là quyết định thẩm mỹ. Nếu user muốn bỏ hẳn màu thì
chỉ hiện số.

**Biểu đồ cột điểm (khối 5) — quy ước vẽ:**

- Trục dọc cố định **0–10**, vạch mỗi 2 điểm. **Không** co giãn theo dữ liệu: trục tự co
  khiến 7,5 và 8,0 trông chênh như 5 và 9, người đọc hiểu sai.
- Mỗi môn một cột cao `diem_tong_ket / 10`, cùng một màu (`--color-chart-1`). Không tô màu
  theo mức điểm — màu đó đã mang nghĩa "đạt/không đạt" ở chỗ khác.
- Đường nối các `diem_tb_lop` vẽ bằng `--color-chart-2`, có chấm tròn rỗng tại từng môn,
  **cùng một trục 0–10** với cột. Chú giải nằm dưới biểu đồ, hai mục: "Điểm của bạn" (chấm
  đặc) và "Điểm TB lớp học phần" (chấm rỗng).
- Chỉ có **một** đường trung bình, không có đường cao nhất/thấp nhất (xem `docs/04` §14c về
  ranh giới quyền).
- Tên môn dưới cột tối đa 2 dòng rồi ellipsis, tên đầy đủ trong `title`. Quá 8 môn thì cuộn
  ngang trong khối, không bóp cột xuống dưới 56 px.
- Số trên đầu cột dùng `1.234,56` (dấu phẩy thập phân theo tiếng Việt), không `1,234.56`.

**Tên môn dài:** cột/hàng tên môn cắt 1 dòng bằng ellipsis, đưa tên đầy đủ vào `title` —
cùng quy ước với cột "Lớp" ở §3.3.

#### Trạng thái loading / lỗi / rỗng của SCR-04, SCR-05

| Trạng thái | Hiển thị |
|---|---|
| Đang tải | Skeleton cho thẻ số liệu và cho từng khối danh sách; **không** dựng layout nhảy giật sau khi có dữ liệu |
| Lỗi mạng / 5xx | `app-alert` loại lỗi ở đầu trang + nút "Thử lại" gọi lại endpoint; các khối bên dưới ẩn hẳn, không hiện khung rỗng |
| `403 FORBIDDEN` | Không xảy ra với vai trò đúng. Nếu xảy ra (token còn hạn nhưng vai trò đã đổi) → đăng xuất và về trang đăng nhập, giống xử lý 401 ở `auth.interceptor` |
| `401` | `auth.interceptor` xử lý: xoá phiên, về `/dang-nhap` |
| Rỗng toàn bộ (200 + mọi mảng rỗng) | Vẫn hiện lưới thẻ (giá trị 0) + một `empty-state` chung "Chưa có dữ liệu cho học kỳ này", kèm liên kết tới màn nghiệp vụ tương ứng |

#### Chế độ xem theo vai trò (ADMIN)

Hiện `app.routes.ts` chọn dashboard theo **vai trò tài khoản** (`vaiTroCanMatch` đọc
`auth.nguoiDung().vai_tro`), **không** theo vai trò đang xem. Vì vậy bảng "Hành vi chi tiết"
ở §3.13 dòng **Dashboard** ("Hiển thị dashboard của vai trò đang xem") **chưa đúng với code**:
chưa có component `role-view-switcher`/`role-view-banner` trong `shared/ui/`, nên tính năng
SCR-52/53 chưa tồn tại. Ghi nhận để không ai giả định nó đang chạy; khi làm SCR-52/53 thì
`vaiTroCanMatch` phải đọc vai trò **đang xem**, và dashboard TEACHER/STUDENT gọi endpoint
`/dashboard/teacher|student` sẽ nhận `403` dưới token ADMIN — lúc đó cần một nhánh riêng
(ví dụ backend cho ADMIN gọi `teacher`/`student` với `giang_vien_id`/`sinh_vien_id` chỉ định).
*Chờ user chốt hướng khi làm SCR-52/53.*

### 3.3. Sinh viên (ADMIN, TEACHER)

| Mã | Màn hình | Route | Ghi chú |
|---|---|---|---|
| SCR-10 ✅ | Danh sách sinh viên | `/sinh-vien` | Bảng: mã, họ tên (+email phụ), lớp, giới tính, ngày sinh, trạng thái, thao tác. Bộ lọc: tìm kiếm, khóa, lớp hành chính, giới tính, trạng thái, khoảng ngày sinh. Sắp xếp cột, phân trang, chọn nhiều dòng để kích hoạt/khóa/xóa. Kết nối `GET /api/students` và API bulk qua `SinhVienService`; mock vẫn có thể bật theo `environment.useMock`. |
| SCR-11 ✅ | Thêm/Sửa sinh viên | `/sinh-vien/them`, `/sinh-vien/:id/sua` | Form tạo/cập nhật hồ sơ qua API. Khi tạo thành công, dialog hiện `mat_khau_ban_dau` một lần và có nút sao chép. |
| SCR-12 ✅ | Chi tiết sinh viên | `/sinh-vien/:id` | Ngăn kéo mở từ danh sách, không chuyển trang (giữ vị trí cuộn và bộ lọc). Tải chi tiết theo `id` qua API. |

> TEACHER thấy bộ cột giới hạn (FR-02.03) và không thấy nút thêm/sửa/xóa.

Danh sách, form và chi tiết dùng `SinhVienService`; `environment.useMock = true` thì
request được mock interceptor xử lý, còn `false` thì gọi backend Laravel theo
`apiBaseUrl`.

**Quy ước cột "Lớp" ở mọi màn danh sách:** hiện **mã lớp** (`CNTT-K65-01`), không
hiện tên đầy đủ (`Công nghệ thông tin K65 - Lớp 01`). Tên đầy đủ dài gấp ba mã,
làm bảng tràn ngang trên máy hẹp; vẫn tra được qua tooltip và ở ngăn kéo chi tiết.

**Tích hợp API:** các màn sinh viên/giảng viên đã gọi `SinhVienService` /
`GiangVienService` theo endpoint trong hợp đồng. `environment.useMock = true` thì
interceptor trả dữ liệu giả, bao gồm luồng đăng nhập và phiên người dùng; `false`
thì auth và API nghiệp vụ gọi Backend Laravel, cần tài khoản Backend hợp lệ.

**Quy ước thao tác hàng loạt:** luôn hỏi xác nhận kèm số lượng; sau khi xong hiện
khối kết quả `thanh_cong / that_bai` **kèm danh sách dòng lỗi và lý do từng dòng**,
giữ lại các dòng lỗi trong trạng thái đã chọn để người dùng xử lý tiếp.

### 3.4. Giảng viên

| Mã | Màn hình | Route | Vai trò |
|---|---|---|---|
| SCR-13 ✅ | Danh sách giảng viên | `/giang-vien` | ADMIN — tìm theo mã/tên/email, lọc chuyên môn/trạng thái, sắp xếp và phân trang; chọn nhiều dòng để kích hoạt/khóa/xóa. Kết nối `/api/teachers` qua `GiangVienService`; mỗi dòng cũng có thao tác sửa/xóa. |
| SCR-14 ✅ | Thêm/Sửa giảng viên | `/giang-vien/them`, `/giang-vien/:id/sua` | ADMIN — bắt buộc mã, họ tên, email; tạo tài khoản qua API và hiển thị mật khẩu ban đầu một lần. **ADR-020:** ô "Chuyên môn" (nhập tự do) đổi thành ô chọn **Ngành** (`nganh_id`, cho phép để trống). Danh sách giảng viên cũng đổi bộ lọc "Chuyên môn" thành lọc theo Ngành. |
| SCR-15 ✅ | Chi tiết giảng viên | `/giang-vien/:id` | ADMIN, TEACHER (bản thân) — xem hồ sơ, liên hệ, chuyên môn và trạng thái qua API. TEACHER chỉ được sửa số điện thoại của chính mình. |

Các màn giảng viên dùng `GiangVienService`; mock interceptor có thể bật/tắt
theo `environment.useMock`, giống luồng sinh viên.

### 3.5. Lớp hành chính

| Mã | Màn hình | Route | Vai trò |
|---|---|---|---|
| SCR-16 | Danh sách lớp hành chính | `/lop-hanh-chinh` | ADMIN, TEACHER | Cột: mã, tên, khóa, ngành, sĩ số, trạng thái. Lọc/tìm kiếm/phân trang; ADMIN bấm dòng để xem chi tiết và xóa mềm từng lớp, bị chặn khi còn sinh viên chưa xóa (FR-03.05) |
| SCR-17 | Thêm/Sửa lớp | `/lop-hanh-chinh/them`, `/:id/sua` | ADMIN | Trường: mã, tên, **khóa** (`khoa_hoc`), **ngành** (ô chọn `nganh_id`, ADR-020 — khoa suy ra từ ngành nên không nhập riêng), năm nhập học, mô tả |
| SCR-18 | Chi tiết lớp + gán sinh viên | `/lop-hanh-chinh/:id` | ADMIN (dialog chọn nhiều sinh viên) |

### 3.6. Môn học, Học kỳ, Phòng học

| Mã | Màn hình | Route | Vai trò |
|---|---|---|---|
| SCR-19 | Danh sách và chi tiết môn học | `/mon-hoc`, `/mon-hoc/:id` | mọi vai trò (chỉ xem với TEACHER/STUDENT). Tìm theo mã/tên; lọc Khoa, trạng thái và số tín chỉ; bảng hiển thị Khoa. Chọn dòng để xem chi tiết. ADMIN chọn nhiều dòng để Kích hoạt / Khóa / Xóa (FR-05.04) |
| SCR-20 | Thêm/Sửa môn học | `/mon-hoc/them`, `/:id/sua` | ADMIN |
| SCR-21 | Danh sách học kỳ | `/hoc-ky` | mọi vai trò | Cột: mã, tên, năm học, kỳ thứ, khoảng ngày, đợt đăng ký, trạng thái |
| SCR-22 | Thêm/Sửa học kỳ | `/hoc-ky/them`, `/:id/sua` | ADMIN — có nút chuyển trạng thái. Chỉ hiện nút cho bước kế tiếp hợp lệ: `UPCOMING` → "Bắt đầu kỳ", `ONGOING` → "Đóng kỳ"; `CLOSED` không có nút (BR-24) |
| SCR-23 | Danh sách và chi tiết phòng học | `/phong-hoc`, `/phong-hoc/:id` | ADMIN, TEACHER. Tìm theo mã/tên, lọc trạng thái; chọn dòng để xem chi tiết. ADMIN chọn nhiều dòng để Kích hoạt / Khóa / Xóa (FR-07.04) |
| SCR-24 | Thêm/Sửa phòng học | `/phong-hoc/them`, `/:id/sua` | ADMIN |

### 3.7. Lớp học phần

| Mã | Màn hình | Route | Vai trò | Ghi chú |
|---|---|---|---|---|
| SCR-25 | Danh sách lớp học phần | `/lop-hoc-phan` | theo vai trò | Cột: mã, môn, học kỳ, giảng viên, năm thứ, sĩ số `x/y`, trạng thái. Lọc: học kỳ, môn, giảng viên, năm thứ, trạng thái, còn chỗ |
| SCR-26 | Thêm/Sửa lớp học phần | `/lop-hoc-phan/them`, `/:id/sua` | ADMIN | Trường: mã, môn, học kỳ, giảng viên, sĩ số tối đa, **năm thứ** (để trống = mọi năm) | |
| SCR-27 | Chi tiết lớp học phần | `/lop-hoc-phan/:id` | theo vai trò | Tab: thông tin, sinh viên, lịch học, điểm danh, điểm |
| SCR-28 | Danh sách sinh viên của lớp | `/lop-hoc-phan/:id/sinh-vien` | ADMIN, TEACHER, STUDENT (lớp đã đăng ký) | Nút hủy đăng ký (ADMIN). STUDENT chỉ thấy 2 cột mã + tên của bạn cùng lớp |
| SCR-29 | Bảng điểm lớp | `/lop-hoc-phan/:id/diem` | ADMIN, TEACHER | Nhập inline, tổng kết và quy đổi điểm chữ/xếp loại theo cấu hình, nút chốt điểm, badge đã chốt |

### 3.8. Đăng ký học phần

| Mã | Màn hình | Route | Vai trò | Ghi chú |
|---|---|---|---|---|
| SCR-30 | Đăng ký hộ | `/dang-ky` | ADMIN | Chọn sinh viên + lớp, hiển thị kết quả kiểm tra. Nút **"Đăng ký theo lớp hành chính"** mở dialog chọn lớp HP + lớp HC, hiện bảng kết quả từng sinh viên (FR-09.07) |
| SCR-31 | Danh sách đăng ký | `/dang-ky/danh-sach` | ADMIN, TEACHER | Lọc theo học kỳ, lớp, sinh viên, trạng thái |
| SCR-32 | Danh sách lớp đang mở | `/dang-ky-hoc-phan` | STUDENT | Chọn học kỳ rồi đăng ký các lớp đang mở còn chỗ; học kỳ đã qua hiện lịch sử. Xem lại lịch sử các kỳ tại `/dang-ky-cua-toi` |
| SCR-33 | Lịch sử đăng ký | `/dang-ky-cua-toi` | STUDENT | Theo học kỳ, trạng thái, nút hủy. Không phân trang — dữ liệu đăng ký của một sinh viên ít |

### 3.9. Lịch học

| Mã | Màn hình | Route | Vai trò | Ghi chú |
|---|---|---|---|---|
| SCR-35 | Xem lịch tuần | `/lich-hoc` | theo vai trò | Lưới 7 ngày × 3 ca (Sáng/Chiều/Tối). Lọc Tất cả / Lịch học / Lịch thi bằng nút radio, chọn tuần bằng `app-date-input`, điều hướng tuần trước/sau/hôm nay. ADMIN lọc thêm giảng viên và phòng. Bấm khối ca học mở popup liên hệ giảng viên (họ tên, mã GV, email, điện thoại). Chú giải 5 loại, phân biệt bằng màu: lý thuyết (xám), thực hành (xanh lá), trực tuyến (xanh dương), lịch thi (vàng), tạm ngưng (đỏ đặc + dải chéo). Buổi đã dạy không có màu riêng — tô theo hình thức học |
| SCR-35b | Lịch thi | `/lich-thi` | theo vai trò | Ca thi theo kỳ, dùng chung khung tiết với buổi học. ADMIN thêm/sửa/xóa ca; sinh viên chỉ thấy ca của môn đã đăng ký ACTIVE. Bấm dòng mở chi tiết; sửa và xóa đều qua hộp thoại. Khi backend trả `SCHEDULE_CONFLICT`, hiện danh sách sinh viên/lớp bị trùng kèm `tong_so_vi_pham` |
| SCR-36 | Thêm buổi học | `/lop-hoc-phan/:id/lich-hoc` (nút "Thêm buổi") | ADMIN, TEACHER (lớp mình) | Form tại chỗ: ngày, từ tiết, đến tiết, phòng, hình thức học (lý thuyết/thực hành/trực tuyến). Backend suy ra giờ từ `tiet_hoc`. Không tạo được cho ngày đã qua (`PAST_DATE`). Hủy buổi đã dạy chỉ ADMIN, có cảnh báo sẽ xóa điểm danh |
| SCR-37 | Sinh lịch hàng tuần | `/lop-hoc-phan/them` (khối "Lịch học") | ADMIN | Chọn thứ, tiết, phòng, khoảng ngày, hình thức học; preview số buổi; hiển thị xung đột. Gọi `POST /sections/{id}/sessions/generate` ngay sau khi tạo lớp |

Tab **Lịch học** trong chi tiết lớp (`/lop-hoc-phan/:id/lich-hoc`) là trang riêng, liệt kê
toàn bộ buổi kèm trạng thái, số sinh viên đã điểm danh, và thao tác hủy / mở lại. Buổi đã
hủy vẫn hiện để đối chiếu, không hiện lý do hủy trên lịch (người dùng yêu cầu).


### 3.10. Điểm danh

| Mã | Màn hình | Route | Vai trò | Ghi chú |
|---|---|---|---|---|
| SCR-38 | Danh sách buổi để điểm danh | `/diem-danh` | TEACHER, ADMIN | Lọc **học kỳ** trước, rồi lớp (ô tìm kiếm theo mã lớp / tên môn), ngày và trạng thái điểm danh. Biết buổi nào đã điểm danh qua `da_diem_danh` của `GET /sections/{id}/sessions`, không gọi thêm API từng buổi |
| SCR-38b | Điểm danh của tôi | `/diem-danh-cua-toi` | STUDENT | Chọn học kỳ, xem số buổi có mặt / đi muộn / vắng có phép / vắng không phép theo từng môn. Tỉ lệ theo FR-11.05, đếm theo buổi không theo tiết |
| SCR-39 | Điểm danh một buổi | `/diem-danh/:sessionId` | TEACHER, ADMIN | Danh sách sinh viên + 4 nút trạng thái + ghi chú + lưu hàng loạt. Response `GET` là object `{buoi_hoc, danh_sach}`, không phải mảng trần |
| SCR-40 | Thống kê chuyên cần | `/lop-hoc-phan/:id/chuyen-can` | ADMIN, TEACHER | Bảng tổng hợp + tỷ lệ, xuất nháp |


### 3.11. Điểm

| Mã | Màn hình | Route | Vai trò | Ghi chú |
|---|---|---|---|---|
| SCR-41 | Nhập điểm | `/lop-hoc-phan/:id/diem` | TEACHER, ADMIN | Bảng nhập inline, tự tính tổng kết + điểm chữ + hệ 4, cảnh báo khi đã chốt |
| SCR-42 | Điểm của tôi | `/diem-cua-toi` | STUDENT | Theo học kỳ, GPA hệ 10 và hệ 4, **GPA tích lũy + tín chỉ tích lũy** (FR-12.08), cột điểm chữ A/B/C/D/F, trạng thái đạt/không đạt |
| SCR-43 | Lịch sử sửa điểm | `/lop-hoc-phan/:id/diem/lich-su` | ADMIN, TEACHER | Dialog theo từng sinh viên |

### 3.12. Quản trị

| Mã | Màn hình | Route | Vai trò |
|---|---|---|---|
| SCR-45 | Thùng rác | `/thung-rac` | ADMIN — 12 loại thực thể theo API; tìm kiếm, lọc người xóa/khoảng ngày, phân trang và khôi phục (có cảnh báo nếu bản ghi cha chưa khôi phục) |
| SCR-47 | Quản lý menu | `/menu` | ADMIN — danh sách (kể cả mục đang ẩn), thêm tại chỗ, ẩn/hiện, xoá có xác nhận |
| SCR-48 | Chi tiết / Sửa menu | `/menu/:id`, `/menu/:id/sua` | ADMIN — thêm menu dùng form tại chỗ ở `/menu`, không có route `/menu/them` |
| SCR-49 | Cấu hình | `/cau-hinh` | ADMIN — bảng học kỳ có tìm kiếm/lọc theo năm học, trạng thái và tình trạng cấu hình; chọn dòng để xem cấu hình riêng. Chỉ `UPCOMING` được lưu/cập nhật; `ONGOING` và `CLOSED` chỉ xem. Mỗi học kỳ có một cấu hình; trọng số tổng bằng 1, bảng quy đổi phủ liên tục 0–10, làm tròn `HALF_UP_2`, số ngày sửa điểm danh |
| SCR-50 | Quản lý người dùng | `/nguoi-dung` | ADMIN — tìm kiếm, lọc vai trò/trạng thái, phân trang, kích hoạt/khóa hàng loạt, đặt lại mật khẩu, xóa tài khoản ADMIN |
| SCR-51 | Thêm/Sửa người dùng | `/nguoi-dung/them`, `/:id/sua` | ADMIN — tạo/sửa tài khoản; mật khẩu tạm chỉ hiện một lần khi tạo; hồ sơ giảng viên/sinh viên được quản lý ở màn tương ứng |
| — | Nhật ký | `/nhat-ky` | ADMIN — giao diện trạng thái chờ API; chưa hiển thị dữ liệu cho tới khi backend công bố endpoint đọc danh sách |

### 3.13. Chế độ xem theo vai trò (ADMIN)

| Mã | Thành phần | Vị trí | Hành vi |
|---|---|---|---|
| SCR-52 | Bộ chuyển vai trò | Header, chỉ hiện với ADMIN | Dropdown 3 lựa chọn: ADMIN / Giảng viên / Sinh viên. Lưu `localStorage` khóa `xem_nhu_vai_tro` |
| SCR-53 | Banner chế độ xem | Đầu trang, dưới header | Hiện khi vai trò xem khác ADMIN: "Đang xem với vai trò **Giảng viên** — dữ liệu và quyền vẫn là ADMIN" + nút "Quay lại ADMIN" |
| SCR-54 | Danh sách, chi tiết & Thêm/Sửa Khoa | `/khoa`, `/khoa/:id`, `/khoa/them`, `/khoa/:id/sua` | ADMIN (ADR-020) | ✅ FE + API CRUD; bấm dòng mở chi tiết; tìm kiếm, lọc trạng thái, phân trang, xác nhận xóa và hiển thị lý do backend chặn xóa |
| SCR-55 | Danh sách, chi tiết & Thêm/Sửa Ngành | `/nganh`, `/nganh/:id`, `/nganh/them`, `/nganh/:id/sua` | ADMIN (ADR-020) | ✅ FE + API CRUD; bấm dòng mở chi tiết có liên kết tới Khoa; lọc theo khoa/trạng thái, chọn khoa trong form, phân trang, xác nhận xóa và hiển thị lý do backend chặn xóa |

**Hành vi chi tiết**

| Khía cạnh | Mô tả |
|---|---|
| Đổi menu | Sidebar gọi `/api/menus` và lọc theo vai trò **đang xem**, không theo vai trò thật |
| Ẩn/hiện nút | Các nút thêm/sửa/xóa ẩn theo vai trò đang xem |
| Dữ liệu | Vẫn là phạm vi ADMIN (xem mọi lớp, mọi sinh viên) |
| Thao tác ghi | Vẫn dùng quyền ADMIN thật; không bị 403 |
| Dashboard | Hiển thị dashboard của vai trò đang xem nhưng số liệu toàn hệ thống — **chưa làm**: `vaiTroCanMatch` đang đọc vai trò thật của tài khoản, xem ghi chú cuối §3.2 |
| Đăng xuất | Về ADMIN, xóa khóa `localStorage` |
| Chuyển route | Nếu đang ở route không thuộc vai trò xem (ví dụ `/menu` khi xem như STUDENT) → chuyển về `/dashboard` kèm thông báo |

---

## 4. Thành phần dùng chung

| Component | Dùng ở | Chức năng |
|---|---|---|
| `page-header` | mọi màn | Tiêu đề, mô tả, nút hành động |
| `data-table` | mọi danh sách | Cột cấu hình, sắp xếp, chọn dòng, trạng thái rỗng/loading |
| `pagination` | mọi danh sách | Điều hướng trang, chọn `per_page` |
| `search-input` | mọi danh sách | Debounce 300 ms |
| `confirm-dialog` | thao tác xóa/hủy/chốt | Tiêu đề, nội dung, nút xác nhận nguy hiểm |
| `status-badge` | bảng | Màu theo trạng thái (ACTIVE/INACTIVE, OPEN/CLOSED/CANCELLED, DAT/KHONG_DAT...) |
| `empty-state` | danh sách rỗng | Icon, thông điệp, CTA |
| `loading` | toàn cục | Spinner/skeleton |
| `form-field` | mọi form | Label, lỗi, gợi ý |
| `password-reveal-dialog` | tạo tài khoản | Hiện mật khẩu một lần + copy |
| `role-view-switcher` | header (ADMIN) | Chuyển chế độ xem vai trò, đồng bộ `localStorage` |
| `role-view-banner` | đầu trang | Nhắc đang ở chế độ xem, nút quay lại ADMIN |

---

## 5. Trạng thái UI bắt buộc

Mỗi màn hình danh sách phải có 4 trạng thái: **loading**, **có dữ liệu**, **rỗng**, **lỗi** (kèm nút thử lại).

Mỗi form phải có: validate client, hiển thị lỗi 422 theo trường, chặn submit khi đang gửi, thông báo thành công/thất bại.

---

## 6. Hiển thị lỗi nghiệp vụ

Ánh xạ `ma_loi` → thông điệp tiếng Việt:

| `ma_loi` | Thông điệp UI |
|---|---|
| `SECTION_FULL` | Lớp học phần đã đủ sĩ số. |
| `DUPLICATE_ENROLLMENT` | Bạn đã đăng ký lớp học phần này. |
| `DUPLICATE_SUBJECT_IN_SEMESTER` | Bạn đã đăng ký một lớp khác cùng môn trong học kỳ này. |
| `SCHEDULE_CONFLICT` | Trùng lịch: hiển thị danh sách buổi xung đột. |
| `OUTSIDE_REGISTRATION` | Ngoài thời gian đăng ký của học kỳ. |
| `GRADE_LOCKED` | Điểm đã được chốt, không thể sửa. |
| `SEMESTER_CLOSED` | Học kỳ đã đóng, chỉ được xem. |
| `DELETE_BLOCKED` | Không thể xóa: hiển thị danh sách phụ thuộc. |
| `MUST_CHANGE_PASSWORD` | Chuyển hướng `/doi-mat-khau`. |
| `WRONG_STUDY_YEAR` | Lớp này dành cho sinh viên năm thứ {n}. |
| `SEMESTER_TRANSITION_INVALID` | Không thể chuyển trạng thái học kỳ theo hướng này. |
| `SEMESTER_OVERLAP` | Khoảng ngày trùng với học kỳ {tên}. |
| `SESSION_OUTSIDE_SEMESTER` | Ngày buổi học nằm ngoài khoảng ngày của học kỳ. |
| `SUBJECT_CHANGE_BLOCKED` | Lớp đã có sinh viên đăng ký, không đổi được môn/học kỳ. |
| `UPLOAD_NOT_CONFIGURED` | Chức năng tải ảnh chưa được cấu hình. Liên hệ quản trị viên. |
| `UPLOAD_FAILED` | Tải ảnh lên thất bại, vui lòng thử lại. |

**Thao tác hàng loạt:** luôn hiện dialog xác nhận kèm số lượng; sau khi xong hiện bảng kết quả từng dòng (thành công / lỗi kèm lý do), **không** đóng dialog tự động để người dùng đọc được dòng nào hỏng.

---

## 7. Lộ trình dựng FE

1. **Tuần 2 ✅:** core (models, services, mock layer), layout, shared components (14 component `shared/ui`).
2. **Tuần 3–4:** auth, sinh viên, giảng viên, lớp hành chính, môn học, học kỳ, phòng học.
3. **Tuần 5–6:** lớp học phần, lịch học.
4. **Tuần 7–8:** điểm danh, điểm.
5. **Tuần 9:** đăng ký sinh viên, dashboard, thùng rác.
6. **Tuần 10:** hoàn thiện UI, responsive, kiểm thử.

---

## 8. Quy ước khi viết màn hình mới

Rút ra từ màn SCR-10 — áp dụng cho ~43 màn còn lại để không phải sửa lại về sau.

| Quy ước | Lý do |
|---|---|
| Chép `features/dao-tao/sinh-vien/danh-sach.ts` rồi đổi cột + bộ lọc | Bảng, phân trang, tìm kiếm, 4 trạng thái đã nằm trong `shared/ui`, không viết lại |
| State: một `signal` cho tham số truy vấn, một cho kết quả; đổi tham số thì gọi lại API | Lọc/sắp xếp phía client sẽ sai khi phân trang — backend phải tính trên toàn bộ dữ liệu |
| Tách "bộ lọc đang chọn" khỏi "bộ lọc đã áp dụng" khi có khoảng ngày | Áp dụng ngay giữa hai lần chọn ngày sẽ ra kết quả của một nửa bộ lọc |
| Ô `<select>` có option render bằng `@for` phải chọn bằng `[selected]` trên từng option, **không** `[value]` trên thẻ select | Trình duyệt chưa có option khớp thì rơi về option đầu — lỗi âm thầm, có test hồi quy ở `design-system.spec.ts` |
| Popup/ngăn kéo đóng bằng **cả ba cách**: bấm ra ngoài, Escape, và nút đóng | `@HostListener('document:keydown.escape')` + focus vào hộp thoại; gắn `(keydown.escape)` lên div không focus được sẽ không bao giờ chạy |
| Icon dùng Material Icons, **không** ký tự Unicode | `⚠ ✕ ▤ ↕ ◍ ⌕` render khác nhau theo font từng máy, có máy ra ô vuông rỗng |
| Cột chứa mã (lớp, môn, khoá) hiện mã, tên đầy đủ để trong tooltip | Mã ngắn và ổn định; tên đầy đủ làm bảng tràn ngang trên mobile |
| Không có comment chứa dấu `` ` `` bên trong template literal hoặc `styles` | Chuỗi `` ` `` đóng template sớm, gây lỗi cú pháp khó tìm |
