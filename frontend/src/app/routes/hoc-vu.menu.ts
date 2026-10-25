import { NhomMenu } from './dao-tao.menu';

/**
 * Nhóm menu HỌC VỤ — thuộc Đạt.
 *
 * Tách khỏi `sidebar.ts` để hai bạn FE không sửa cùng một file.
 */
export const HOC_VU_MENU: NhomMenu = {
  tieu_de: 'Học vụ',
  muc: [
    { nhan: 'Lớp học phần', duong_dan: '/lop-hoc-phan', icon: 'class' },
    { nhan: 'Đăng ký', duong_dan: '/dang-ky', icon: 'how_to_reg' },
    { nhan: 'Lịch học', duong_dan: '/lich-hoc', icon: 'calendar_month' },
    { nhan: 'Điểm danh', duong_dan: '/diem-danh', icon: 'fact_check' },
    { nhan: 'Điểm', duong_dan: '/diem', icon: 'grading' },
  ],
};

/** Nhóm menu HỆ THỐNG — chỉ ADMIN thấy. */
export const HE_THONG_MENU: NhomMenu = {
  tieu_de: 'Hệ thống',
  muc: [
    {
      nhan: 'Người dùng',
      duong_dan: '/nguoi-dung',
      icon: 'manage_accounts',
      vai_tro: ['ADMIN'],
    },
    { nhan: 'Cấu hình', duong_dan: '/cau-hinh', icon: 'settings', vai_tro: ['ADMIN'] },
    { nhan: 'Thùng rác', duong_dan: '/thung-rac', icon: 'delete', vai_tro: ['ADMIN'] },
  ],
};
