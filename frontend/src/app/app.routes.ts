import { Routes } from '@angular/router';
import { MainLayout } from '@core/layout/main-layout';

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
    loadComponent: () =>
      import('@features/auth/login').then((m) => m.LoginPage),
  },

  // ---------- Mọi màn nghiệp vụ nằm trong layout ----------
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('@features/dashboard/dashboard-admin').then((m) => m.DashboardAdminPage),
      },
      {
        path: 'style-guide',
        loadComponent: () =>
          import('@features/style-guide/style-guide').then((m) => m.StyleGuide),
      },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];
