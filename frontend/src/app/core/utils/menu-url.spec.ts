import { routes } from '../../app.routes';
import { danhGiaDuongDanMenu, laDuongDanMenuHopLe, menuKhopDuongDan } from './menu-url';

describe('laDuongDanMenuHopLe', () => {
  it('accepts registered app paths, including parameterized routes', () => {
    expect(laDuongDanMenuHopLe('/lop-hoc-phan', routes)).toBe(true);
    expect(laDuongDanMenuHopLe('/lop-hoc-phan/42', routes)).toBe(true);
  });

  it('rejects unknown app paths rather than treating the wildcard as valid', () => {
    expect(laDuongDanMenuHopLe('/lop-hoc-phan-khong-ton-tai', routes)).toBe(false);
  });

  it('accepts HTTP and HTTPS external links', () => {
    expect(laDuongDanMenuHopLe('https://example.com', routes)).toBe(true);
    expect(laDuongDanMenuHopLe('http://example.com', routes)).toBe(true);
  });

  it('rejects malformed or unsupported external links', () => {
    expect(laDuongDanMenuHopLe('gioi-thieu', routes)).toBe(false);
    expect(laDuongDanMenuHopLe('javascript:alert(1)', routes)).toBe(false);
  });
});

describe('danhGiaDuongDanMenu', () => {
  it('marks a registered route as hợp lệ', () => {
    expect(danhGiaDuongDanMenu('/lop-hoc-phan', routes)).toBe('hop-le');
  });

  it('allows a well-formed internal path that has no page yet', () => {
    expect(danhGiaDuongDanMenu('/bao-cao-thong-ke', routes)).toBe('chua-co-trang');
  });

  it('rejects paths that cannot be a page URL at all', () => {
    expect(danhGiaDuongDanMenu('bao-cao', routes)).toBe('khong-hop-le');
    expect(danhGiaDuongDanMenu('//evil.example.com', routes)).toBe('khong-hop-le');
    expect(danhGiaDuongDanMenu('/co khoang trang', routes)).toBe('khong-hop-le');
  });
});

describe('menuKhopDuongDan', () => {
  it('ignores query strings and trailing slashes', () => {
    expect(menuKhopDuongDan('/gioi-thieu', '/gioi-thieu')).toBe(true);
    expect(menuKhopDuongDan('/gioi-thieu', '/gioi-thieu/')).toBe(true);
    expect(menuKhopDuongDan('/gioi-thieu', '/gioi-thieu?utm=email')).toBe(true);
  });

  it('compares the whole path, not a prefix', () => {
    expect(menuKhopDuongDan('/gioi-thieu', '/gioi-thieu/them')).toBe(false);
    expect(menuKhopDuongDan('/gioi-thieu/them', '/gioi-thieu')).toBe(false);
  });

  it('never matches external links, which have no route', () => {
    expect(menuKhopDuongDan('https://example.com', '/https://example.com')).toBe(false);
  });
});
