import { TestBed } from '@angular/core/testing';
import { TheSoLieu } from './dashboard.model';
import { TheSoLieuCard } from './the-so-lieu';

/**
 * Thẻ số liệu — kiểm phần DỄ SAI: số phải chạy từ 0 tới đúng giá trị và dừng
 * đúng số cuối, định dạng tiếng Việt, `don_vi` giữ nguyên, và thẻ bấm được thì
 * phát sự kiện.
 *
 * `requestAnimationFrame` được THAY bằng hàng đợi do test điều khiển: jsdom
 * chạy rAF bằng timer thật nên test sẽ phải chờ 900ms mỗi thẻ, chậm và dễ
 * nhấp nháy. Ở đây từng khung hình được gọi tay với mốc thời gian ta chọn.
 */
describe('TheSoLieuCard', () => {
  const theGpa: TheSoLieu = {
    khoa: 'gpa_he_4',
    label: 'GPA tích lũy',
    gia_tri: 2.74,
    don_vi: 'hệ 4',
    phu_chu: '3 học kỳ đã đóng, 96 tín chỉ',
    xu_huong: 'bang',
  };

  const thePhanTram: TheSoLieu = {
    khoa: 'chuyen_can',
    label: 'Tỷ lệ chuyên cần',
    gia_tri: 90.7,
    don_vi: '%',
    phu_chu: '39/43 buổi có mặt hoặc đi muộn',
    xu_huong: 'bang',
  };

  const theDem: TheSoLieu = {
    khoa: 'dang_ky',
    label: 'Lượt đăng ký học phần',
    gia_tri: 7028,
    don_vi: null,
    phu_chu: 'Trung bình 14.0 lớp mỗi sinh viên',
    xu_huong: 'len',
  };

  let hangDoi: FrameRequestCallback[];
  /**
   * Đồng hồ do test điều khiển.
   *
   * Component lấy mốc bắt đầu bằng `performance.now()` lúc `setTimeout` bắn,
   * rồi so với mốc mà `requestAnimationFrame` truyền vào. Nếu test chỉ tự tăng
   * mốc rAF mà không đụng `performance.now()`, hai mốc lệch gốc và tiến độ ra
   * sai (đã tái hiện: đứng ở 6951 thay vì 7028). Stub cả hai về cùng một biến
   * thì tiến độ tính được chính xác.
   */
  let dongHo: number;

  beforeEach(() => {
    hangDoi = [];
    dongHo = 1000;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      hangDoi.push(cb);
      return hangDoi.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {
      hangDoi = [];
    });
    vi.spyOn(performance, 'now').mockImplementation(() => dongHo);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function tao(the: TheSoLieu, chiSo = 0, bamDuoc = false) {
    TestBed.configureTestingModule({ imports: [TheSoLieuCard] });
    const fixture = TestBed.createComponent(TheSoLieuCard);
    fixture.componentRef.setInput('the', the);
    fixture.componentRef.setInput('chiSo', chiSo);
    fixture.componentRef.setInput('bamDuoc', bamDuoc);
    fixture.detectChanges();
    return fixture;
  }

  /** Chạy hết các khung hình đã xếp hàng, mỗi khung cách nhau 100ms. */
  async function chayHetAnimation(fixture: ReturnType<typeof tao>): Promise<void> {
    // Chờ hẹn giờ so le (chiSo × 70ms) bắn rồi mới có khung hình đầu tiên.
    await new Promise((r) => setTimeout(r, 250));
    fixture.detectChanges();

    for (let vong = 0; vong < 40 && hangDoi.length > 0; vong++) {
      const cuaVong = hangDoi;
      hangDoi = [];
      dongHo += 100;
      for (const cb of cuaVong) cb(dongHo);
      fixture.detectChanges();
    }
  }

  function soDangHien(fixture: ReturnType<typeof tao>): string {
    return (
      (fixture.nativeElement.querySelector('.the-so-lieu [aria-hidden="true"]')
        ?.textContent ?? '') as string
    ).trim();
  }

  it('đếm tới đúng giá trị cuối, định dạng 2 chữ số thập phân kiểu vi-VN', async () => {
    const fixture = tao(theGpa);
    await chayHetAnimation(fixture);
    expect(soDangHien(fixture)).toBe('2,74');
  });

  it('giá trị 1 chữ số thập phân giữ đúng 1 chữ số (90,7 không thành 90,70)', async () => {
    const fixture = tao(thePhanTram);
    await chayHetAnimation(fixture);
    expect(soDangHien(fixture)).toBe('90,7');
  });

  it('số nguyên lớn có dấu chấm ngăn nghìn', async () => {
    const fixture = tao(theDem);
    await chayHetAnimation(fixture);
    expect(soDangHien(fixture)).toBe('7.028');
  });

  it('bắt đầu từ 0 chứ không nhá số thật rồi mới đếm', () => {
    const fixture = tao(theDem);
    expect(soDangHien(fixture)).toBe('0');
  });

  it('số đang chạy tăng dần và không vọt quá giá trị đích', async () => {
    const fixture = tao(theDem);
    await new Promise((r) => setTimeout(r, 250));
    fixture.detectChanges();

    const doc = (): number => Number(soDangHien(fixture).replace(/\./g, ''));

    // Chạy nửa thời lượng: phải ra một số DƯƠNG nhưng nhỏ hơn 7028.
    const khungDau = hangDoi;
    hangDoi = [];
    dongHo += 450;
    for (const cb of khungDau) cb(dongHo);
    fixture.detectChanges();

    const giua = doc();
    expect(giua).toBeGreaterThan(0);
    expect(giua).toBeLessThan(7028);

    // Chạy tiếp cho tới hết: đúng 7028, không vượt.
    for (let vong = 0; vong < 40 && hangDoi.length > 0; vong++) {
      const cuaVong = hangDoi;
      hangDoi = [];
      dongHo += 200;
      for (const cb of cuaVong) cb(dongHo);
      fixture.detectChanges();
    }
    expect(doc()).toBe(7028);
  });

  it('đơn vị nằm trong <small>, tách khỏi số đang đếm', () => {
    const fixture = tao(thePhanTram);
    const donVi = fixture.nativeElement.querySelector('.the-so-lieu small') as HTMLElement;
    expect(donVi.textContent?.trim()).toBe('%');
  });

  it('số cuối cũng có trong .sr-only cho trình đọc màn hình', () => {
    const fixture = tao(theGpa);
    const sr = fixture.nativeElement.querySelector('.the-so-lieu .sr-only') as HTMLElement;
    expect(sr.textContent).toContain('2,74');
  });

  it('thẻ bấm được phát sự kiện `bam` với đúng thẻ', () => {
    const fixture = tao(thePhanTram, 0, true);
    const phat: TheSoLieu[] = [];
    fixture.componentInstance.bam.subscribe((t) => phat.push(t));

    const nut = fixture.nativeElement.querySelector('button.the') as HTMLButtonElement;
    expect(nut).toBeTruthy();
    nut.click();

    expect(phat).toHaveLength(1);
    expect(phat[0].khoa).toBe('chuyen_can');
  });

  it('thẻ không bấm được thì không render <button>', () => {
    const fixture = tao(theGpa, 0, false);
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(fixture.nativeElement.querySelector('.the')).toBeTruthy();
  });

  it('màu và icon gắn theo `khoa`, không theo vị trí', () => {
    const fixture = tao(theGpa);
    const the = fixture.nativeElement.querySelector('.the') as HTMLElement;
    expect(the.classList).toContain('the-chart-2');
    const icon = fixture.nativeElement.querySelector('.the-icon .material-icons') as HTMLElement;
    expect(icon.textContent?.trim()).toBe('workspace_premium');
  });

  it('huỷ animation khi component bị destroy — không setState trên component đã chết', async () => {
    const fixture = tao(theDem);
    // Huỷ trước khi hẹn giờ so le kịp bắn.
    fixture.destroy();
    const loi: unknown[] = [];
    const goc = console.error;
    console.error = (...a: unknown[]) => loi.push(a);

    await new Promise((r) => setTimeout(r, 300));

    console.error = goc;
    expect(loi).toHaveLength(0);
  });
});
