import { Routes } from '@angular/router';
import { MainLayout } from '@core/layout/main-layout';
import { authChildGuard, authGuard, guestGuard } from '@core/auth/auth.guard';
import { daoTaoRoutes } from './routes/dao-tao.routes';
import { hocVuRoutes } from './routes/hoc-vu.routes';

/**
 * Route gốc — chỉ gộp route của hai nhóm, không khai màn hình cụ thể.
 *
 * Vì sao: hai bạn FE làm song song. Nếu mỗi màn khai ở đây thì mỗi lần thêm
 * màn là một lần conflict. Màn đào tạo khai ở `routes/dao-tao.routes.ts`
 * (Đức Anh), màn học vụ ở `routes/hoc-vu.routes.ts` (Đạt).
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
      {
        path: 'dashboard',
        loadComponent: () =>
          import('@features/dashboard/dashboard-admin').then((m) => m.DashboardAdminPage),
      },
      {
        path: 'style-guide',
        loadComponent: () => import('@features/style-guide/style-guide').then((m) => m.StyleGuide),
      },

      // Nhóm đào tạo (Đức Anh) và nhóm học vụ (Đạt) — mỗi nhóm một file.
      ...daoTaoRoutes,
      ...hocVuRoutes,
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];
