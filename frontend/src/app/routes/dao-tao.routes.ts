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

  // SCR-21/22 — Học kỳ
  {
    path: 'hoc-ky',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN', 'SINH_VIEN'], ma: 'SCR-21', title: 'Học kỳ' },
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
  },

  // SCR-23/24 — Phòng học
  {
    path: 'phong-hoc',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'GIANG_VIEN'], ma: 'SCR-23', title: 'Phòng học' },
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
  },
];

/**
 * Dùng `DangXayDung` với `data` route: component đọc qua `inputBinding` của
 * Angular Router nên phải khai `withComponentInputBinding()` trong
 * `provideRouter` — xem `app.config.ts`.
 */
export { DangXayDung };
