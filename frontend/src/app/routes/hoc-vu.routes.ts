import { Routes } from '@angular/router';
import { roleGuard } from '@core/auth/auth.guard';

/**
 * Route nhóm HỌC VỤ — thuộc Đạt.
 *
 * Lớp học phần, đăng ký, lịch, điểm danh, điểm, dashboard, thùng rác, menu.
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
  { path: 'lop-hoc-phan/:id/diem', canActivate: [roleGuard], data: { roles: ['ADMIN', 'GIANG_VIEN'] }, loadComponent: () => import('@features/hoc-vu/lop-hoc-phan/diem').then((m) => m.LopHocPhanDiem) },
  { path: 'lop-hoc-phan/them', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('@features/hoc-vu/lop-hoc-phan/form').then((m) => m.LopHocPhanForm) },
  { path: 'lop-hoc-phan/:id/sua', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('@features/hoc-vu/lop-hoc-phan/form').then((m) => m.LopHocPhanForm) },
  { path: 'lop-hoc-phan/:id', canActivate: [roleGuard], data: { roles: ['ADMIN', 'GIANG_VIEN', 'SINH_VIEN'] }, loadComponent: () => import('@features/hoc-vu/lop-hoc-phan/chi-tiet').then((m) => m.LopHocPhanChiTiet) },

  // SCR-30/31/32/33 — Đăng ký theo vai trò
  {
    path: 'dang-ky',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-30', title: 'Đăng ký' },
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
  },
  {
    path: 'dang-ky/danh-sach',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN'], ma: 'SCR-31', title: 'Danh sách đăng ký' },
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
  },
  {
    path: 'dang-ky-cua-toi',
    canActivate: [roleGuard],
    data: { roles: ['SINH_VIEN'], ma: 'SCR-33', title: 'Đăng ký của tôi' },
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
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
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
  },

  // SCR-41/42/43 — Điểm theo vai trò
  {
    path: 'diem',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN'], ma: 'SCR-41', title: 'Nhập điểm' },
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
  },
  {
    path: 'diem-cua-toi',
    canActivate: [roleGuard],
    data: { roles: ['SINH_VIEN'], ma: 'SCR-42', title: 'Điểm của tôi' },
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
  },

  // SCR-45 — Thùng rác
  {
    path: 'thung-rac',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-45', title: 'Thùng rác' },
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
  },

  // SCR-47/48/49 — Menu & cấu hình
  {
    path: 'menu/:id/sua',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], editMode: true, title: 'Sửa menu' },
    loadComponent: () => import('@features/hoc-vu/menu/chi-tiet').then((m) => m.MenuChiTiet),
  },
  {
    path: 'menu/:id',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], title: 'Chi tiết menu' },
    loadComponent: () => import('@features/hoc-vu/menu/chi-tiet').then((m) => m.MenuChiTiet),
  },
  {
    path: 'menu',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-47', title: 'Quản lý menu' },
    loadComponent: () => import('@features/hoc-vu/menu/quan-ly').then((m) => m.MenuQuanLy),
  },
  {
    path: 'cau-hinh',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-49', title: 'Cấu hình' },
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
  },

  // SCR-50/51 — Người dùng
  {
    path: 'nguoi-dung',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-50', title: 'Người dùng' },
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
  },
  {
    path: 'nguoi-dung/them',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-51', title: 'Thêm người dùng' },
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
  },
  {
    path: 'nguoi-dung/:id/sua',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-51', title: 'Sửa người dùng' },
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
  },
];
