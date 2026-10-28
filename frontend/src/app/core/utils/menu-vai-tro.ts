import { MenuApi } from '@core/services/menu.service';

/**
 * Vai trò hiện tại có được thấy một mục menu không.
 *
 * `vai_tro` là MẢNG vai trò được thấy mục; `null` (hoặc mảng rỗng) = mọi vai
 * trò. Không có ngoại lệ dành riêng cho ADMIN: mục nào ADMIN không được thấy
 * thì đừng ghi ADMIN vào mảng.
 *
 * Trước đây cột chỉ chứa MỘT giá trị nên không diễn đạt được "ADMIN và
 * GIANG_VIEN" cùng thấy một mục. Cách chữa tạm khi đó là cho ADMIN thấy tất cả,
 * nhưng như vậy ADMIN lại thấy cả `/dang-ky-cua-toi` và `/diem-cua-toi` — hai
 * trang chỉ có nghĩa với sinh viên, bấm vào thì `roleGuard` đá về dashboard.
 *
 * `Menu::scopeHienThiCho` phía backend lọc y hệt — sửa bên này thì sửa bên kia.
 * Khi làm SCR-52 (xem theo vai trò), truyền vào đây vai trò ĐANG XEM chứ không
 * phải vai trò thật của tài khoản.
 */
export function vaiTroDuocThayMenu(
  vaiTroHienTai: string,
  vaiTroMenu: MenuApi['vai_tro'],
): boolean {
  if (!vaiTroMenu || vaiTroMenu.length === 0) return true;
  return vaiTroMenu.includes(vaiTroHienTai as never);
}
