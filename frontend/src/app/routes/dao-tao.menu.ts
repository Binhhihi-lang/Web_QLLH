/** Một mục trong menu điều hướng. */
export interface MucMenu {
  nhan: string;
  duong_dan: string;
  icon: string;
  /** Vai trò được thấy mục này. Rỗng = mọi vai trò. */
  vai_tro?: string[];
}

export interface NhomMenu {
  tieu_de: string;
  muc: MucMenu[];
}

/**
 * Nhóm menu ĐÀO TẠO — thuộc Đức Anh.
 *
 * Tách khỏi `sidebar.ts` để hai bạn FE không sửa cùng một file. Thêm màn mới
 * thì thêm một dòng ở đây; `sidebar.ts` tự hiển thị.
 *
 * Đường dẫn là URL giao diện (tiếng Việt), khác đường dẫn API (tiếng Anh).
 */
export const DAO_TAO_MENU: NhomMenu = {
  tieu_de: 'Đào tạo',
  muc: [
    {
      nhan: 'Sinh viên',
      duong_dan: '/sinh-vien',
      icon: 'school',
      vai_tro: ['ADMIN', 'GIANG_VIEN'],
    },
    {
      nhan: 'Giảng viên',
      duong_dan: '/giang-vien',
      icon: 'person',
      vai_tro: ['ADMIN', 'GIANG_VIEN', 'SINH_VIEN'],
    },
    {
      nhan: 'Lớp hành chính',
      duong_dan: '/lop-hanh-chinh',
      icon: 'groups',
      vai_tro: ['ADMIN', 'GIANG_VIEN'],
    },
    {
      nhan: 'Môn học',
      duong_dan: '/mon-hoc',
      icon: 'menu_book',
      vai_tro: ['ADMIN', 'GIANG_VIEN', 'SINH_VIEN'],
    },
    {
      nhan: 'Học kỳ',
      duong_dan: '/hoc-ky',
      icon: 'date_range',
      vai_tro: ['ADMIN', 'GIANG_VIEN', 'SINH_VIEN'],
    },
    {
      nhan: 'Phòng học',
      duong_dan: '/phong-hoc',
      icon: 'meeting_room',
      vai_tro: ['ADMIN', 'GIANG_VIEN'],
    },
  ],
};
