import { Routes } from '@angular/router';

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

  // SCR-25/26/27/28/29 — Lớp học phần
  {
    path: 'lop-hoc-phan',
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
    data: { ma: 'SCR-25', title: 'Lớp học phần' },
  },

  // SCR-30/31 — Đăng ký (ADMIN)
  {
    path: 'dang-ky',
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
    data: { ma: 'SCR-30', title: 'Đăng ký' },
  },

  // SCR-35/36/37 — Lịch học
  {
    path: 'lich-hoc',
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
    data: { ma: 'SCR-35', title: 'Lịch học' },
  },

  // SCR-38/39/40 — Điểm danh
  {
    path: 'diem-danh',
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
    data: { ma: 'SCR-38', title: 'Điểm danh' },
  },

  // SCR-41/42/43 — Điểm
  {
    path: 'diem',
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
    data: { ma: 'SCR-41', title: 'Điểm' },
  },

  // SCR-45 — Thùng rác
  {
    path: 'thung-rac',
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
    data: { ma: 'SCR-45', title: 'Thùng rác' },
  },

  // SCR-47/48/49 — Menu & cấu hình
  {
    path: 'menu',
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
    data: { ma: 'SCR-47', title: 'Quản lý menu' },
  },
  {
    path: 'cau-hinh',
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
    data: { ma: 'SCR-49', title: 'Cấu hình' },
  },

  // SCR-50/51 — Người dùng
  {
    path: 'nguoi-dung',
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
    data: { ma: 'SCR-50', title: 'Người dùng' },
  },
];
