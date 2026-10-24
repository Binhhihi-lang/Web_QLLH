import { TestBed } from '@angular/core/testing';
import { Pagination } from '@shared/ui/pagination';
import { StatusBadge } from '@shared/ui/status-badge';

/**
 * Test cho phần LOGIC của design system.
 *
 * Vì sao cần: build pass chỉ chứng minh code biên dịch được, không chứng minh
 * nó chạy đúng. Hai chỗ dưới đây có logic thật dễ sai âm thầm — dãy số trang
 * (lỗi off-by-one) và ánh xạ trạng thái sang màu (thiếu key thì badge mất màu).
 */
describe('Pagination', () => {
  function tao(currentPage: number, lastPage: number) {
    const fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('currentPage', currentPage);
    fixture.componentRef.setInput('perPage', 10);
    fixture.componentRef.setInput('total', lastPage * 10);
    fixture.componentRef.setInput('lastPage', lastPage);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('liệt kê hết khi tổng số trang <= 7', () => {
    const c = tao(3, 5);
    expect(c.cacTrang()).toEqual([1, 2, 3, 4, 5]);
  });

  it('rút gọn bằng dấu ... khi nhiều trang', () => {
    const c = tao(3, 51);
    // Trang 1 liền kề cửa sổ 2–4 nên không cần dấu ... ở đầu.
    expect(c.cacTrang()).toEqual([1, 2, 3, 4, null, 51]);
  });

  it('giữ đúng cửa sổ quanh trang hiện tại ở giữa dải', () => {
    const c = tao(25, 51);
    expect(c.cacTrang()).toEqual([1, null, 24, 25, 26, null, 51]);
  });

  it('không rút gọn khi đang ở trang đầu', () => {
    const c = tao(1, 51);
    expect(c.cacTrang()).toEqual([1, 2, null, 51]);
  });

  it('không rút gọn khi đang ở trang cuối', () => {
    const c = tao(51, 51);
    expect(c.cacTrang()).toEqual([1, null, 50, 51]);
  });

  it('tính đúng khoảng dòng đang hiển thị', () => {
    const c = tao(3, 51);
    expect(c.tuDong()).toBe(21);
    expect(c.denDong()).toBe(30);
  });

  it('danh sách rỗng thì hiển thị 0–0', () => {
    const fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('perPage', 10);
    fixture.componentRef.setInput('total', 0);
    fixture.componentRef.setInput('lastPage', 1);
    fixture.detectChanges();
    expect(fixture.componentInstance.tuDong()).toBe(0);
    expect(fixture.componentInstance.denDong()).toBe(0);
  });

  it('không phát sự kiện khi bấm trang hiện tại hoặc vượt biên', () => {
    const c = tao(3, 51);
    const daPhat: number[] = [];
    c.pageChange.subscribe((p) => daPhat.push(p));

    c.chuyen(3); // trang hiện tại
    c.chuyen(0); // dưới biên
    c.chuyen(99); // trên biên
    expect(daPhat).toEqual([]);

    c.chuyen(4);
    expect(daPhat).toEqual([4]);
  });
});

describe('StatusBadge', () => {
  function mau(value: string) {
    const fixture = TestBed.createComponent(StatusBadge);
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
    return fixture.componentInstance.mau();
  }

  it('ánh xạ đúng trạng thái hoạt động', () => {
    expect(mau('ACTIVE')).toBe('success');
    expect(mau('INACTIVE')).toBe('neutral');
  });

  it('ánh xạ đúng trạng thái lớp học phần', () => {
    expect(mau('OPEN')).toBe('success');
    expect(mau('CLOSED')).toBe('neutral');
    expect(mau('CANCELLED')).toBe('danger');
  });

  it('ánh xạ đúng trạng thái điểm danh', () => {
    expect(mau('CO_MAT')).toBe('success');
    expect(mau('VANG_CO_PHEP')).toBe('warning');
    expect(mau('VANG_KHONG_PHEP')).toBe('danger');
  });

  it('ánh xạ đúng trạng thái điểm', () => {
    expect(mau('DAT')).toBe('success');
    expect(mau('KHONG_DAT')).toBe('danger');
  });

  it('giá trị lạ thì rơi về neutral, không vỡ giao diện', () => {
    expect(mau('GIA_TRI_KHONG_BIET')).toBe('neutral');
  });

  it('ép màu thủ công thì thắng ánh xạ tự động', () => {
    const fixture = TestBed.createComponent(StatusBadge);
    fixture.componentRef.setInput('value', 'ACTIVE');
    fixture.componentRef.setInput('mau', 'danger');
    fixture.detectChanges();
    expect(fixture.componentInstance.mau()).toBe('danger');
  });
});
