import { Routes } from '@angular/router';
import { roleGuard } from '@core/auth/auth.guard';
import { DangXayDung } from '@shared/ui/dang-xay-dung';

/**
 * Route nhóm ĐÀO TẠO — thuộc Đức Anh.
 *
 * Mỗi màn khai ở đây; `app.routes.ts` chỉ gộp lại. Hai bạn FE không sửa cùng
 * một file route nên không conflict khi thêm màn song song.
 *
 * Đường dẫn URL dùng tiếng Việt (khác đường dẫn API) — xem docs/05-screens.md.
 *
 * Màn chưa làm dùng `DangXayDung` thay vì bỏ trống: sidebar đã khai đủ mục, bỏ
 * trống thì bấm vào sẽ rơi về dashboard mà không báo gì.
 */
export const daoTaoRoutes: Routes = [
  // SCR-10/11/12 — Sinh viên
  {
    path: 'sinh-vien',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN'] },
    loadComponent: () =>
      import('@features/dao-tao/sinh-vien/danh-sach').then((m) => m.SinhVienDanhSach),
  },
  {
    path: 'sinh-vien/them',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('@features/dao-tao/sinh-vien/form').then((m) => m.SinhVienForm),
  },
  {
    path: 'sinh-vien/:id/sua',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('@features/dao-tao/sinh-vien/form').then((m) => m.SinhVienForm),
  },

  // SCR-13/14/15 — Giảng viên
  {
    path: 'giang-vien',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN', 'SINH_VIEN'] },
    loadComponent: () =>
      import('@features/dao-tao/giang-vien/danh-sach').then((m) => m.GiangVienDanhSach),
  },
  {
    path: 'giang-vien/them',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('@features/dao-tao/giang-vien/form').then((m) => m.GiangVienForm),
  },
  {
    path: 'giang-vien/:id/sua',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN'], ownTeacherProfile: true },
    loadComponent: () => import('@features/dao-tao/giang-vien/form').then((m) => m.GiangVienForm),
  },
  {
    path: 'giang-vien/:id',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN'], ownTeacherProfile: true },
    loadComponent: () =>
      import('@features/dao-tao/giang-vien/chi-tiet').then((m) => m.GiangVienChiTiet),
  },

  // SCR-16/17/18 — Lớp hành chính
  {
    path: 'lop-hanh-chinh',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN'], ma: 'SCR-16', title: 'Lớp hành chính' },
    loadComponent: () =>
      import('@features/dao-tao/lop-hanh-chinh/danh-sach').then(
        (m) => m.LopHanhChinhDanhSach,
      ),
  },
  {
    path: 'lop-hanh-chinh/them',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-17', title: 'Tạo lớp hành chính' },
    loadComponent: () =>
      import('@features/dao-tao/lop-hanh-chinh/form').then((m) => m.LopHanhChinhForm),
  },
  {
    path: 'lop-hanh-chinh/:id/sua',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-17', title: 'Cập nhật lớp hành chính' },
    loadComponent: () =>
      import('@features/dao-tao/lop-hanh-chinh/form').then((m) => m.LopHanhChinhForm),
  },
  {
    path: 'lop-hanh-chinh/:id',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-18', title: 'Chi tiết lớp hành chính' },
    loadComponent: () =>
      import('@features/dao-tao/lop-hanh-chinh/chi-tiet').then((m) => m.LopHanhChinhChiTiet),
  },

  // SCR-19/20 — Môn học
  {
    path: 'mon-hoc',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN', 'SINH_VIEN'], ma: 'SCR-19', title: 'Môn học' },
    loadComponent: () =>
      import('@features/dao-tao/mon-hoc/danh-sach').then((m) => m.MonHocDanhSach),
  },
  {
    path: 'mon-hoc/them',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-20', title: 'Thêm môn học' },
    loadComponent: () => import('@features/dao-tao/mon-hoc/form').then((m) => m.MonHocForm),
  },
  {
    path: 'mon-hoc/:id',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN', 'SINH_VIEN'], ma: 'SCR-19', title: 'Chi tiết môn học' },
    loadComponent: () => import('@features/dao-tao/mon-hoc/chi-tiet').then((m) => m.MonHocChiTiet),
  },
  {
    path: 'mon-hoc/:id/sua',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-20', title: 'Sửa môn học' },
    loadComponent: () => import('@features/dao-tao/mon-hoc/form').then((m) => m.MonHocForm),
  },

  // SCR-54 — Quản lý Khoa
  {
    path: 'khoa',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-54', title: 'Quản lý Khoa' },
    loadComponent: () => import('@features/dao-tao/khoa/danh-sach').then((m) => m.KhoaDanhSach),
  },
  {
    path: 'khoa/them',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-54', title: 'Thêm khoa' },
    loadComponent: () => import('@features/dao-tao/khoa/form').then((m) => m.KhoaForm),
  },
  {
    path: 'khoa/:id',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-54', title: 'Chi tiết khoa' },
    loadComponent: () => import('@features/dao-tao/khoa/chi-tiet').then((m) => m.KhoaChiTiet),
  },
  {
    path: 'khoa/:id/sua',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-54', title: 'Sửa khoa' },
    loadComponent: () => import('@features/dao-tao/khoa/form').then((m) => m.KhoaForm),
  },

  // SCR-55 — Quản lý Ngành
  {
    path: 'nganh',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-55', title: 'Quản lý Ngành' },
    loadComponent: () => import('@features/dao-tao/nganh/danh-sach').then((m) => m.NganhDanhSach),
  },
  {
    path: 'nganh/them',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-55', title: 'Thêm ngành' },
    loadComponent: () => import('@features/dao-tao/nganh/form').then((m) => m.NganhForm),
  },
  {
    path: 'nganh/:id',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-55', title: 'Chi tiết ngành' },
    loadComponent: () => import('@features/dao-tao/nganh/chi-tiet').then((m) => m.NganhChiTiet),
  },
  {
    path: 'nganh/:id/sua',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-55', title: 'Sửa ngành' },
    loadComponent: () => import('@features/dao-tao/nganh/form').then((m) => m.NganhForm),
  },

  // SCR-21/22 — Học kỳ
  {
    path: 'hoc-ky',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN', 'SINH_VIEN'], ma: 'SCR-21', title: 'Học kỳ' },
    loadComponent: () =>
      import('@features/dao-tao/hoc-ky/danh-sach').then((m) => m.HocKyDanhSach),
  },
  {
    path: 'hoc-ky/them',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-22', title: 'Thêm học kỳ' },
    loadComponent: () => import('@features/dao-tao/hoc-ky/form').then((m) => m.HocKyForm),
  },
  {
    path: 'hoc-ky/:id/sua',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-22', title: 'Sửa học kỳ' },
    loadComponent: () => import('@features/dao-tao/hoc-ky/form').then((m) => m.HocKyForm),
  },
  {
    path: 'hoc-ky/:id',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN', 'SINH_VIEN'], ma: 'SCR-21', title: 'Chi tiết học kỳ' },
    loadComponent: () =>
      import('@features/dao-tao/hoc-ky/chi-tiet').then((m) => m.HocKyChiTiet),
  },

  // SCR-23/24 — Phòng học
  {
    path: 'phong-hoc',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN'], ma: 'SCR-23', title: 'Phòng học' },
    loadComponent: () =>
      import('@features/dao-tao/phong-hoc/danh-sach').then((m) => m.PhongHocDanhSach),
  },
  {
    path: 'phong-hoc/them',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-24', title: 'Thêm phòng học' },
    loadComponent: () => import('@features/dao-tao/phong-hoc/form').then((m) => m.PhongHocForm),
  },
  {
    path: 'phong-hoc/:id',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN'], ma: 'SCR-23', title: 'Chi tiết phòng học' },
    loadComponent: () =>
      import('@features/dao-tao/phong-hoc/chi-tiet').then((m) => m.PhongHocChiTiet),
  },
  {
    path: 'phong-hoc/:id/sua',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-24', title: 'Sửa phòng học' },
    loadComponent: () => import('@features/dao-tao/phong-hoc/form').then((m) => m.PhongHocForm),
  },
];

/**
 * Dùng `DangXayDung` với `data` route: component đọc qua `inputBinding` của
 * Angular Router nên phải khai `withComponentInputBinding()` trong
 * `provideRouter` — xem `app.config.ts`.
 */
export { DangXayDung };
