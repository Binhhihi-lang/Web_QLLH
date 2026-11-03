import { chuanHoaTimKiem } from './chuan-hoa-tim-kiem';

describe('chuanHoaTimKiem', () => {
  it('bỏ dấu và hạ chữ thường', () => {
    expect(chuanHoaTimKiem('Nguyễn Văn An')).toBe('nguyen van an');
  });

  it('xử lý được đ/Đ — chúng không nằm trong khối dấu tổ hợp', () => {
    expect(chuanHoaTimKiem('Đặng Thị Đào')).toBe('dang thi dao');
  });

  it('cắt khoảng trắng đầu cuối', () => {
    expect(chuanHoaTimKiem('   Trần Thị B   ')).toBe('tran thi b');
  });

  it('giữ nguyên mã sinh viên không dấu', () => {
    expect(chuanHoaTimKiem('SV000001')).toBe('sv000001');
  });

  it('chuỗi rỗng trả về chuỗi rỗng', () => {
    expect(chuanHoaTimKiem('')).toBe('');
  });

  it('hai chuỗi chỉ khác dấu thì chuẩn hoá ra cùng kết quả', () => {
    expect(chuanHoaTimKiem('Lê Văn C')).toBe(chuanHoaTimKiem('le van c'));
  });
});
