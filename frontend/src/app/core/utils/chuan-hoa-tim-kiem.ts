/**
 * Chuẩn hoá một chuỗi để so khớp tìm kiếm: bỏ dấu, hạ chữ thường, cắt khoảng trắng.
 *
 * Phải thay `đ`/`Đ` riêng: chúng không nằm trong khối dấu tổ hợp
 * (U+0300–U+036F) mà `normalize('NFD')` tách ra, nên nếu chỉ normalize thì gõ
 * "dang" sẽ không tìm ra "Đặng" — lỗi rất khó thấy vì mọi chữ có dấu khác vẫn chạy.
 */
export function chuanHoaTimKiem(giaTri: string): string {
  return giaTri
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}
