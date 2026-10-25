import { Routes } from '@angular/router';
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
    loadComponent: () =>
      import('@features/dao-tao/sinh-vien/danh-sach').then((m) => m.SinhVienDanhSach),
  },
  {
    path: 'sinh-vien/them',
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
    data: { ma: 'SCR-11', title: 'Thêm sinh viên' },
  },
  {
    path: 'sinh-vien/:id/sua',
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
    data: { ma: 'SCR-11', title: 'Sửa sinh viên' },
  },

  // SCR-13/14/15 — Giảng viên
  {
    path: 'giang-vien',
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
    data: { ma: 'SCR-13', title: 'Giảng viên' },
  },

  // SCR-16/17/18 — Lớp hành chính
  {
    path: 'lop-hanh-chinh',
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
    data: { ma: 'SCR-16', title: 'Lớp hành chính' },
  },

  // SCR-19/20 — Môn học
  {
    path: 'mon-hoc',
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
    data: { ma: 'SCR-19', title: 'Môn học' },
  },

  // SCR-21/22 — Học kỳ
  {
    path: 'hoc-ky',
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
    data: { ma: 'SCR-21', title: 'Học kỳ' },
  },

  // SCR-23/24 — Phòng học
  {
    path: 'phong-hoc',
    loadComponent: () => import('@shared/ui/dang-xay-dung').then((m) => m.DangXayDung),
    data: { ma: 'SCR-23', title: 'Phòng học' },
  },
];

/**
 * Dùng `DangXayDung` với `data` route: component đọc qua `inputBinding` của
 * Angular Router nên phải khai `withComponentInputBinding()` trong
 * `provideRouter` — xem `app.config.ts`.
 */
export { DangXayDung };
