import { TestBed } from '@angular/core/testing';
import { BieuDoCotDiem, DuLieuCotDiem } from './bieu-do-cot-diem';

/**
 * SCR-04/SCR-05 — biểu đồ cột điểm.
 *
 * Khoá ba hành vi từng sai và gây lỗi nhìn thấy được (đo trên trình duyệt thật
 * 2026-11-11):
 * 1. Tooltip bị khung cuộn cắt — `overflow-y: visible` trên `.khung-cuon` bị
 *    trình duyệt ép thành `auto`, khung thành vùng cắt cả hai trục.
 * 2. Tooltip cột sát mép tràn ra ngoài viewport ở 390px vì căn giữa
 *    `translateX(-50%)` đẩy nửa khối ra ngoài.
 * 3. Đường TB chỉ vẽ khi được bật — SCR-04 không có chuỗi thứ hai.
 *
 * jsdom không tính bố cục nên không đo được vị trí thật; test đọc đúng khai báo
 * CSS mà Angular nhét vào `<style>` của document.
 */
describe('BieuDoCotDiem', () => {
  /**
   * Angular gắn scope vào selector: `.khung-cuon` thành `.khung-cuon[_ngcontent-x]`.
   * Bỏ phần ngoặc vuông rồi gộp khoảng trắng — sau khi bỏ scope Angular để lại
   * nhiều dấu cách liền nhau (`.nhom-cot:first-child   .khoi-tooltip`).
   */
  const docCss = (): string =>
    Array.from(document.querySelectorAll('style'))
      .map((o) => o.textContent ?? '')
      .join('\n')
      .replace(/\[_ng(content|host)-[^\]]*\]/g, '')
      .replace(/\s+/g, ' ');

  /** Cắt khối CSS bắt đầu ở `selector` tới dấu `}` đầu tiên. */
  const layKhoi = (css: string, selector: string): string => {
    const i = css.indexOf(selector);
    if (i < 0) return '';
    const j = css.indexOf('}', i);
    return j < 0 ? '' : css.slice(i, j + 1);
  };

  const cot = (n: number): DuLieuCotDiem[] =>
    Array.from({ length: n }, (_, i) => ({
      nhan: `Môn ${i + 1}`,
      ten_day_du: `Môn học số ${i + 1}`,
      gia_tri: 7 + (i % 3),
      diem_tb_lop: 6.5 + (i % 2),
    }));

  function tao(soCot: number, hienTrungBinh = true) {
    const fixture = TestBed.createComponent(BieuDoCotDiem);
    fixture.componentRef.setInput('cot', cot(soCot));
    fixture.componentRef.setInput('hienTrungBinh', hienTrungBinh);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [BieuDoCotDiem] });
  });

  it('khung cuộn khai clip ở trục dọc để không cắt tooltip', () => {
    // Để trống thì trình duyệt tự đổi `visible` thành `auto` và cắt tooltip
    // (đo được: mất 11px mép trên).
    tao(3);
    const khoi = layKhoi(docCss(), '.khung-cuon {');
    expect(khoi).toContain('overflow-x: auto');
    expect(khoi).toContain('overflow-y: clip');
  });

  it('tooltip chặn toạ độ dọc bằng min() để không vượt mép trên cột', () => {
    tao(3);
    const khoi = layKhoi(docCss(), '.khoi-tooltip {');
    expect(khoi).toContain('bottom: min(');
    expect(khoi).toContain('calc(100% - var(--tt-cao))');
  });

  it('cột sát mép dán tooltip vào mép thay vì căn giữa', () => {
    tao(3);
    const css = docCss();
    // Quy tắc gộp hai selector, nên tìm theo TẬP selector chứ không theo một.
    const dau = layKhoi(css, '.nhom-cot:first-child .khoi-tooltip,');
    const cuoi = layKhoi(css, '.nhom-cot:last-child .khoi-tooltip,');
    expect(dau).toContain('left: 0');
    expect(cuoi).toContain('right: 0');
    // Căn giữa bị gỡ ở cả hai phía, nếu không nửa tooltip vẫn tràn viewport.
    expect(dau).toContain('translateX(0)');
    expect(cuoi).toContain('translateX(0)');
  });

  it('vẽ đủ số cột theo dữ liệu và giữ bề rộng tối thiểu 56px mỗi cột', () => {
    const fixture = tao(8);
    expect(fixture.nativeElement.querySelectorAll('.nhom-cot').length).toBe(8);
    expect(fixture.componentInstance.beRongToiThieu()).toBe(8 * 56);
  });

  it('chỉ vẽ đường TB khi được bật — dashboard giảng viên không có chuỗi thứ hai', () => {
    const co = tao(5, true);
    expect(co.nativeElement.querySelector('.duong-tb')).toBeTruthy();

    const khong = tao(5, false);
    expect(khong.nativeElement.querySelector('.duong-tb')).toBeNull();
  });
});
