import { Routes } from '@angular/router';
import { MainLayout } from '@core/layout/main-layout';
import { authChildGuard, authGuard, guestGuard, roleGuard } from '@core/auth/auth.guard';
import { laTrangChuaLamGuard } from '@core/auth/trang-chua-lam.guard';
import { vaiTroCanMatch } from '@core/auth/vai-tro-can-match.guard';
import { daoTaoRoutes } from './routes/dao-tao.routes';
import { heThongRoutes } from './routes/he-thong.routes';
import { hocVuRoutes } from './routes/hoc-vu.routes';

/**
 * Route gốc — gộp route theo nhóm, không khai màn hình cụ thể.
 *
 * Vì sao: các nhóm FE làm song song. Màn đào tạo khai ở
 * `routes/dao-tao.routes.ts` (Đức Anh), màn học vụ ở `routes/hoc-vu.routes.ts`
 * (Đạt), quản trị Hệ thống ở `routes/he-thong.routes.ts` (PM).
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },

  // ---------- Trang KHÔNG có layout (đứng riêng toàn màn hình) ----------
  // Đăng nhập / đăng ký / quên mật khẩu không dùng sidebar, header, footer:
  // người chưa đăng nhập chưa có quyền thấy cấu trúc hệ thống.
  {
    path: 'dang-nhap',
    pathMatch: 'full',
    redirectTo: 'dang-nhap/admin',
  },
  {
    path: 'dang-nhap/admin',
    canActivate: [guestGuard],
    data: { vaiTroDangNhap: 'ADMIN' },
    loadComponent: () => import('@features/auth/login').then((m) => m.LoginPage),
  },
  {
    path: 'dang-nhap/giang-vien',
    canActivate: [guestGuard],
    data: { vaiTroDangNhap: 'GIANG_VIEN' },
    loadComponent: () => import('@features/auth/login').then((m) => m.LoginPage),
  },
  {
    path: 'dang-nhap/sinh-vien',
    canActivate: [guestGuard],
    data: { vaiTroDangNhap: 'SINH_VIEN' },
    loadComponent: () => import('@features/auth/login').then((m) => m.LoginPage),
  },
  {
    path: 'doi-mat-khau',
    canActivate: [authGuard],
    loadComponent: () => import('@features/auth/change-password').then((m) => m.ChangePasswordPage),
  },

  // ---------- Mọi màn nghiệp vụ nằm trong layout ----------
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    children: [
      // Dashboard dùng CHUNG đường dẫn `/dashboard` nhưng ba màn khác nhau.
      // `canMatch` chứ không `canActivate`: guard phải chạy trước khi router
      // chọn component, và không được redirect (xem vai-tro-can-match.guard.ts).
      // Thứ tự quan trọng — cái đầu tiên khớp vai trò thắng.
      {
        path: 'dashboard',
        canMatch: [vaiTroCanMatch('ADMIN')],
        data: { ma: 'SCR-03', title: 'Dashboard' },
        loadComponent: () =>
          import('@features/dashboard/dashboard-admin').then((m) => m.DashboardAdminPage),
      },
      {
        path: 'dashboard',
        canMatch: [vaiTroCanMatch('GIANG_VIEN')],
        data: { ma: 'SCR-04', title: 'Dashboard' },
        loadComponent: () =>
          import('@features/dashboard/dashboard-giang-vien').then((m) => m.DashboardGiangVienPage),
      },
      {
        path: 'dashboard',
        canMatch: [vaiTroCanMatch('SINH_VIEN')],
        data: { ma: 'SCR-05', title: 'Dashboard' },
        loadComponent: () =>
          import('@features/dashboard/dashboard-sinh-vien').then((m) => m.DashboardSinhVienPage),
      },
      {
        path: 'style-guide',
        loadComponent: () => import('@features/style-guide/style-guide').then((m) => m.StyleGuide),
      },
      {
        path: 'tai-khoan',
        data: { title: 'Tài khoản của tôi' },
        loadComponent: () => import('@features/tai-khoan/tai-khoan').then((m) => m.TaiKhoanPage),
      },
      {
        path: 'thung-rac',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'], ma: 'SCR-45', title: 'Thùng rác' },
        loadComponent: () => import('@features/thung-rac/thung-rac').then((m) => m.ThungRacPage),
      },

      // Route từng nhóm giữ ở file riêng để giảm xung đột khi làm song song.
      ...daoTaoRoutes,
      ...hocVuRoutes,
      ...heThongRoutes,

      // URL có trong bảng menu nhưng chưa có màn hình: hiện "Màn hình X chưa
      // làm" NGAY TRONG layout, để admin khai menu trước cho tuần sau mà vẫn
      // điều hướng tiếp được. Guard trả false khi URL không có trong menu →
      // rơi xuống wildcard 404 bên dưới.
      {
        path: '**',
        canMatch: [laTrangChuaLamGuard],
        loadComponent: () =>
          import('@features/not-found/trang-chua-lam').then((m) => m.TrangChuaLam),
      },
    ],
  },

  // ---------- 404: KHÔNG có layout ----------
  // Đường dẫn không ai khai thì đứng riêng toàn màn hình: sidebar/header gợi ý
  // một hệ thống vẫn dùng được, trong khi URL này không tồn tại.
  {
    path: '**',
    loadComponent: () => import('@features/not-found/not-found').then((m) => m.KhongTimThayTrang),
  },
];
