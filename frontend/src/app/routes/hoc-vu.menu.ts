import { NhomMenu } from './dao-tao.menu';

/**
 * Nhóm menu HỌC VỤ — thuộc Đạt.
 *
 * Tách khỏi `sidebar.ts` để hai bạn FE không sửa cùng một file.
 */
export const HOC_VU_MENU: NhomMenu = {
  tieu_de: 'Học vụ',
  muc: [
    {
      nhan: 'Lớp học phần',
      duong_dan: '/lop-hoc-phan',
      icon: 'class',
      vai_tro: ['ADMIN', 'GIANG_VIEN', 'SINH_VIEN'],
    },
    {
      nhan: 'Đăng ký',
      duong_dan: '/dang-ky',
      icon: 'how_to_reg',
      vai_tro: ['ADMIN'],
    },
    {
      nhan: 'Đăng ký của tôi',
      duong_dan: '/dang-ky-cua-toi',
      icon: 'how_to_reg',
      vai_tro: ['SINH_VIEN'],
    },
    {
      nhan: 'Lịch học',
      duong_dan: '/lich-hoc',
      icon: 'calendar_month',
      vai_tro: ['ADMIN', 'GIANG_VIEN', 'SINH_VIEN'],
    },
    {
      nhan: 'Điểm danh',
      duong_dan: '/diem-danh',
      icon: 'fact_check',
      vai_tro: ['ADMIN', 'GIANG_VIEN'],
    },
    {
      nhan: 'Nhập điểm',
      duong_dan: '/diem',
      icon: 'grading',
      vai_tro: ['ADMIN', 'GIANG_VIEN'],
    },
    {
      nhan: 'Điểm của tôi',
      duong_dan: '/diem-cua-toi',
      icon: 'grade',
      vai_tro: ['SINH_VIEN'],
    },
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
