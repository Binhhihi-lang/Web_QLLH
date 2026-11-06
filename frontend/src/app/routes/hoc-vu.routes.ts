import { Routes } from '@angular/router';
import { roleGuard } from '@core/auth/auth.guard';

/**
 * Route nhóm HỌC VỤ. SCR-30–33 được PM chuyển sang Đức Anh; các màn còn lại
 * trong nhóm vẫn do Đạt phụ trách.
 *
 * Lớp học phần, đăng ký, lịch, điểm danh, điểm và dashboard.
 * `app.routes.ts` chỉ gộp lại; hai bạn FE không sửa cùng một file route.
 *
 * Màn chưa làm dùng `DangXayDung` thay vì bỏ trống — sidebar đã khai đủ mục, bỏ
 * trống thì bấm vào sẽ rơi về dashboard mà không báo gì.
 */
export const hocVuRoutes: Routes = [
  // SCR-03/04/05 — Dashboard: SCR-03 đã khai trực tiếp trong app.routes.ts,
  // SCR-04/05 chuyển vào đây khi làm dashboard theo vai trò.

  {
    path: 'gioi-thieu',
    canActivate: [roleGuard],
    data: {
      roles: ['ADMIN', 'GIANG_VIEN', 'SINH_VIEN'],
      ma: 'Giới thiệu',
      title: 'Giới thiệu',
      chiTiet: 'Nội dung trang giới thiệu đang được chuẩn bị.',
    },
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
  },

  // SCR-25/26/27/28/29 — Lớp học phần
  {
    path: 'lop-hoc-phan',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN', 'SINH_VIEN'] },
    loadComponent: () =>
      import('@features/hoc-vu/lop-hoc-phan/danh-sach').then((m) => m.LopHocPhanDanhSach),
  },
  {
    path: 'lop-hoc-phan/:id/sinh-vien',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN'] },
    loadComponent: () => import('@features/hoc-vu/lop-hoc-phan/sinh-vien').then((m) => m.LopHocPhanSinhVien),
  },
  {
    path: 'lop-hoc-phan/:id/chuyen-can',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN'], ma: 'SCR-40', title: 'Thống kê chuyên cần' },
    loadComponent: () =>
      import('@features/hoc-vu/diem-danh/chuyen-can').then((m) => m.DiemDanhChuyenCan),
  },
  { path: 'lop-hoc-phan/:id/diem/lich-su', canActivate: [roleGuard], data: { roles: ['ADMIN', 'GIANG_VIEN'], ma: 'SCR-43', title: 'Lịch sử sửa điểm' }, loadComponent: () => import('@features/hoc-vu/lop-hoc-phan/diem').then((m) => m.LopHocPhanDiem) },
  { path: 'lop-hoc-phan/:id/diem', canActivate: [roleGuard], data: { roles: ['ADMIN', 'GIANG_VIEN'], ma: 'SCR-41', title: 'Bảng điểm lớp' }, loadComponent: () => import('@features/hoc-vu/lop-hoc-phan/diem').then((m) => m.LopHocPhanDiem) },
  { path: 'lop-hoc-phan/them', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('@features/hoc-vu/lop-hoc-phan/form').then((m) => m.LopHocPhanForm) },
  { path: 'lop-hoc-phan/:id/sua', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('@features/hoc-vu/lop-hoc-phan/form').then((m) => m.LopHocPhanForm) },
  { path: 'lop-hoc-phan/:id', canActivate: [roleGuard], data: { roles: ['ADMIN', 'GIANG_VIEN', 'SINH_VIEN'] }, loadComponent: () => import('@features/hoc-vu/lop-hoc-phan/chi-tiet').then((m) => m.LopHocPhanChiTiet) },

  // SCR-30/31/32/33 — Đăng ký theo vai trò
  {
    path: 'dang-ky',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-30', title: 'Đăng ký' },
    loadComponent: () => import('@features/hoc-vu/dang-ky/dang-ky-ho').then((m) => m.DangKyHo),
  },
  {
    path: 'dang-ky/danh-sach',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN'], ma: 'SCR-31', title: 'Danh sách đăng ký' },
    loadComponent: () => import('@features/hoc-vu/dang-ky/danh-sach').then((m) => m.DangKyDanhSach),
  },
  {
    path: 'dang-ky-cua-toi',
    canActivate: [roleGuard],
    data: { roles: ['SINH_VIEN'], ma: 'SCR-33', title: 'Đăng ký của tôi' },
    loadComponent: () => import('@features/hoc-vu/dang-ky/cua-toi').then((m) => m.DangKyCuaToi),
  },

  // SCR-35/36/37 — Lịch học
  {
    path: 'lich-hoc',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN', 'SINH_VIEN'], ma: 'SCR-35', title: 'Lịch học' },
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
  },

  // SCR-38/39/40 — Điểm danh
  {
    path: 'diem-danh',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN'], ma: 'SCR-38', title: 'Điểm danh' },
    loadComponent: () =>
      import('@features/hoc-vu/diem-danh/danh-sach').then((m) => m.DiemDanhDanhSach),
  },
  {
    path: 'diem-danh/:sessionId',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN'], ma: 'SCR-39', title: 'Điểm danh buổi học' },
    loadComponent: () =>
      import('@features/hoc-vu/diem-danh/chi-tiet').then((m) => m.DiemDanhChiTiet),
  },

  // SCR-41/42/43 — Điểm theo vai trò
  {
    path: 'diem',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN'], ma: 'SCR-41', title: 'Nhập điểm' },
    loadComponent: () =>
      import('@features/hoc-vu/diem/danh-sach-lop').then((m) => m.DanhSachLopNhapDiem),
  },
  {
    path: 'diem-cua-toi',
    canActivate: [roleGuard],
    data: { roles: ['SINH_VIEN'], ma: 'SCR-42', title: 'Điểm của tôi' },
    loadComponent: () =>
      import('@features/hoc-vu/diem/diem-cua-toi').then((m) => m.DiemCuaToi),
  },

];
