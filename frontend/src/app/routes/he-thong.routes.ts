import { Routes } from '@angular/router';
import { roleGuard } from '@core/auth/auth.guard';

/**
 * Route quản trị Hệ thống: menu, cấu hình và tài khoản.
 * Tách riêng để không buộc nhóm Học vụ sửa file route của nhau.
 */
export const heThongRoutes: Routes = [
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
    loadComponent: () => import('@features/he-thong/cau-hinh/cau-hinh').then((m) => m.CauHinhPage),
  },
  {
    path: 'nguoi-dung/them',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-51', title: 'Thêm người dùng' },
    loadComponent: () => import('@features/he-thong/nguoi-dung/form').then((m) => m.NguoiDungForm),
  },
  {
    path: 'nguoi-dung/:id/sua',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-51', title: 'Sửa người dùng' },
    loadComponent: () => import('@features/he-thong/nguoi-dung/form').then((m) => m.NguoiDungForm),
  },
  {
    path: 'nguoi-dung',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'], ma: 'SCR-50', title: 'Người dùng' },
    loadComponent: () =>
      import('@features/he-thong/nguoi-dung/danh-sach').then((m) => m.NguoiDungDanhSach),
  },
];
