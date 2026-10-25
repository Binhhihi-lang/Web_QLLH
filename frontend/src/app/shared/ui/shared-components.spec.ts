import { TestBed } from '@angular/core/testing';
import { CotBang, DataTable } from '@shared/ui/data-table';
import { FormField } from '@shared/ui/form-field';

/**
 * Test cho hai component dùng chung mà hai bạn FE sẽ chạm vào nhiều nhất.
 *
 * Trọng tâm là những chỗ sai âm thầm: đường dẫn lồng đọc sai, chọn-tất-cả tính
 * nhầm, đảo chiều sắp xếp, và dấu * bắt buộc hiện sai lúc.
 */
describe('DataTable', () => {
  type Dong = Record<string, unknown>;

  function tao(cot: CotBang<Dong>[], rows: Dong[], them: Partial<Record<string, unknown>> = {}) {
    const fixture = TestBed.createComponent(DataTable<Dong>);
    fixture.componentRef.setInput('cot', cot);
    fixture.componentRef.setInput('rows', rows);
    for (const [k, v] of Object.entries(them)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  const COT: CotBang<Dong>[] = [
    { khoa: 'ma_sv', nhan: 'Mã SV', sap_xep: true },
    { khoa: 'ho_ten', nhan: 'Họ tên' },
    { khoa: 'lop_hanh_chinh.ten_lop', nhan: 'Lớp' },
  ];

  const ROWS: Dong[] = [
    { id: 1, ma_sv: 'SV01', ho_ten: 'An', lop_hanh_chinh: { ten_lop: 'CNTT-01' } },
    { id: 2, ma_sv: 'SV02', ho_ten: 'Bình', lop_hanh_chinh: null },
  ];

  it('đọc được trường lồng như lop_hanh_chinh.ten_lop', () => {
    const c = tao(COT, ROWS);
    expect(c.giaTri(ROWS[0], COT[2])).toBe('CNTT-01');
  });

  it('giá trị null hiện gạch ngang thay vì chữ "null"', () => {
    const c = tao(COT, ROWS);
    expect(c.giaTri(ROWS[1], COT[2])).toBe('—');
  });

  it('lấy khoá dòng theo trường id mặc định', () => {
    const c = tao(COT, ROWS);
    expect(c.khoaDong(ROWS[1])).toBe(2);
  });

  it('chọn tất cả chỉ tính trên các dòng đang hiển thị', () => {
    const c = tao(COT, ROWS, { chonNhieu: true, daChon: [1, 2, 999] });
    expect(c.chonTatCa()).toBe(true);
  });

  it('chọn một phần thì không phải chọn tất cả', () => {
    const c = tao(COT, ROWS, { chonNhieu: true, daChon: [1] });
    expect(c.chonMotPhan()).toBe(true);
    expect(c.chonTatCa()).toBe(false);
  });

  it('bấm cột khác thì sắp xếp tăng dần từ đầu', () => {
    const c = tao(COT, ROWS, { sortBy: 'ho_ten', sortDir: 'desc' });
    const phat: unknown[] = [];
    c.sapXep.subscribe((v) => phat.push(v));
    c.doiSapXep(COT[0]);
    expect(phat).toEqual([{ sort_by: 'ma_sv', sort_dir: 'asc' }]);
  });

  it('bấm lại cột đang tăng dần thì đảo sang giảm dần', () => {
    const c = tao(COT, ROWS, { sortBy: 'ma_sv', sortDir: 'asc' });
    const phat: unknown[] = [];
    c.sapXep.subscribe((v) => phat.push(v));
    c.doiSapXep(COT[0]);
    expect(phat).toEqual([{ sort_by: 'ma_sv', sort_dir: 'desc' }]);
  });

  it('cột không cho sắp xếp thì bấm không phát sự kiện', () => {
    const c = tao(COT, ROWS);
    const phat: unknown[] = [];
    c.sapXep.subscribe((v) => phat.push(v));
    c.doiSapXep(COT[1]);
    expect(phat.length).toBe(0);
  });

  it('chọn tất cả phát đúng danh sách khoá của các dòng hiện có', () => {
    const c = tao(COT, ROWS, { chonNhieu: true });
    const phat: unknown[] = [];
    c.daChonChange.subscribe((v) => phat.push(v));
    c.doiChonTatCa({ target: { checked: true } } as unknown as Event);
    expect(phat).toEqual([[1, 2]]);
  });
});

describe('FormField', () => {
  function tao(them: Partial<Record<string, unknown>> = {}) {
    const fixture = TestBed.createComponent(FormField);
    fixture.componentRef.setInput('id', 'ho-ten');
    for (const [k, v] of Object.entries(them)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('chưa chạm vào ô thì chưa báo lỗi dù đã có lỗi', () => {
    const c = tao({ loi: 'Bắt buộc', daCham: false });
    expect(c.hienLoi()).toBe(false);
  });

  it('đã chạm và có lỗi thì mới hiện', () => {
    const c = tao({ loi: 'Bắt buộc', daCham: true });
    expect(c.hienLoi()).toBe(true);
  });

  it('đã chạm nhưng không có lỗi thì không hiện', () => {
    const c = tao({ loi: '', daCham: true });
    expect(c.hienLoi()).toBe(false);
  });

  it('id mô tả tách khỏi id ô để aria-describedby không trỏ vào chính ô', () => {
    const c = tao();
    expect(c.moTaId()).toBe('ho-ten-mo-ta');
  });

  it('gõ vào ô thì phát đúng giá trị thô', () => {
    const c = tao();
    const phat: string[] = [];
    c.giaTriChange.subscribe((v) => phat.push(v));
    c.khiDoi({ target: { value: 'Nguyễn Văn An' } } as unknown as Event);
    expect(phat).toEqual(['Nguyễn Văn An']);
  });
});
