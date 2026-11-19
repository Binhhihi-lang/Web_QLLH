import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { DashboardService } from '@core/services/dashboard.service';
import { LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { DiemService } from '@features/hoc-vu/diem/diem.service';
import { DashboardSinhVien } from './dashboard.model';
import { DashboardSinhVienPage } from './dashboard-sinh-vien';

/**
 * SCR-05 — kiểm những chỗ hợp đồng hay bị hiểu sai:
 * - Dashboard KHÔNG còn phần chuyên cần (docs/11 V4): không thẻ, không card,
 *   không cột trong bảng học phần.
 * - Thẻ số liệu thứ tư là `buoi_tuan`, bấm vào điều hướng sang `/lich-hoc`.
 * - Bảng "Học phần đã đăng ký" đúng HAI cột: môn học/học phần + số tín chỉ.
 * - Đổi học kỳ gửi đúng `hoc_ky_id` tới CẢ dashboard và /me/grades.
 */
describe('DashboardSinhVienPage', () => {
  const duLieu: DashboardSinhVien = {
    hoc_ky: {
      id: 2,
      ma_hoc_ky: '2026-1',
      ten_hoc_ky: 'Học kỳ 1 năm học 2026-2027',
      trang_thai: 'ONGOING',
    },
    the_so_lieu: [
      {
        khoa: 'hoc_phan',
        label: 'Học phần đã đăng ký',
        gia_tri: 5,
        don_vi: 'học phần',
        phu_chu: 'Học kỳ 2026-1',
        xu_huong: 'bang',
      },
      {
        khoa: 'buoi_tuan',
        label: 'Buổi học tuần này',
        gia_tri: 12,
        don_vi: 'buổi',
        phu_chu: '1 buổi hôm nay',
        xu_huong: 'bang',
      },
    ],
    hoc_phan_da_dang_ky: [
      {
        dang_ky_hoc_phan_id: 151,
        lop_hoc_phan_id: 71,
        ma_lop_hp: 'INT3306-2026-1-71',
        ma_mon: 'INT3306',
        ten_mon: 'Lập trình web',
        so_tin_chi: 3,
      },
      {
        dang_ky_hoc_phan_id: 152,
        lop_hoc_phan_id: 72,
        ma_lop_hp: 'INT2204-2026-1-72',
        ma_mon: 'INT2204',
        ten_mon: 'Cơ sở dữ liệu',
        so_tin_chi: 3,
      },
    ],
    thoi_khoa_bieu_tuan: {
      tu_ngay: '2026-11-02',
      den_ngay: '2026-11-08',
      cac_buoi: [
        {
          id: 4075,
          ngay_hoc: '2026-11-02',
          thu: 2,
          tiet_bat_dau: 1,
          tiet_ket_thuc: 3,
          gio_bat_dau: '06:30',
          gio_ket_thuc: '09:10',
          trang_thai: 'DONE',
          hinh_thuc: 'LY_THUYET',
          ly_do_huy: null,
          ma_lop_hp: 'INT3306-2026-1-71',
          ma_mon: 'INT3306',
          ten_mon: 'Lập trình web',
          ma_phong: 'A101',
          ten_phong: 'Phòng A101',
        },
        {
          id: 4085,
          ngay_hoc: '2026-11-06',
          thu: 6,
          tiet_bat_dau: 7,
          tiet_ket_thuc: 9,
          gio_bat_dau: '12:30',
          gio_ket_thuc: '15:10',
          trang_thai: 'CANCELLED',
          hinh_thuc: 'THUC_HANH',
          ly_do_huy: 'Giảng viên ốm',
          ma_lop_hp: 'INT2203-2026-1-75',
          ma_mon: 'INT2203',
          ten_mon: 'Lập trình hướng đối tượng',
          ma_phong: 'C301',
          ten_phong: 'Phòng C301',
        },
      ],
    },
    gpa: {
      hoc_ky_hien_tai: {
        id: 2,
        ma_hoc_ky: '2026-1',
        ten_hoc_ky: 'Học kỳ 1 năm học 2026-2027',
        gpa_he_10: null,
        gpa_he_4: null,
        tong_tin_chi: 15,
      },
      tich_luy: {
        gpa_he_10: 7.21,
        gpa_he_4: 2.74,
        tong_tin_chi: 96,
        tin_chi_dat: 88,
        so_hoc_ky_da_tinh: 3,
      },
    },
  };

  const diemHocKy = {
    hoc_ky: { id: 2, ma_hoc_ky: '2026-1', ten_hoc_ky: 'Học kỳ 1 năm học 2026-2027' },
    mon_hoc: [
      {
        ma_mon: 'INT3306',
        ten_mon: 'Lập trình web',
        so_tin_chi: 3,
        diem_chuyen_can: 8.5,
        diem_giua_ky: 7,
        diem_cuoi_ky: 8,
        diem_tong_ket: 8.5,
        diem_chu: 'B',
        diem_he_4: 3,
        ket_qua: 'DAT' as const,
        diem_tb_lop: 7.9,
      },
      {
        ma_mon: 'MAT1001',
        ten_mon: 'Toán cơ sở',
        so_tin_chi: 2,
        diem_chuyen_can: null,
        diem_giua_ky: null,
        diem_cuoi_ky: null,
        diem_tong_ket: null,
        diem_chu: null,
        diem_he_4: null,
        ket_qua: null,
        diem_tb_lop: null,
      },
    ],
    gpa_he_10: 8.5,
    gpa_he_4: 3,
    tong_tin_chi: 5,
  };

  function tao(
    // Mock phải phản ánh ĐÚNG `hoc_ky_id` được hỏi: component đồng bộ ô chọn
    // theo `d.hoc_ky.id` backend trả. Mock trả cứng id=2 dù hỏi kỳ 1 sẽ khiến
    // "lần gọi cuối" đọc sai.
    layDashboard: (id?: number) => Observable<DashboardSinhVien> = (id) =>
      of(
        (id === undefined
          ? duLieu
          : { ...duLieu, hoc_ky: { ...duLieu.hoc_ky, id } }) as DashboardSinhVien,
      ),
    layDiem: (id?: number) => Observable<unknown> = (id) =>
      of(id === undefined ? diemHocKy : { ...diemHocKy, hoc_ky: { ...diemHocKy.hoc_ky, id } }),
  ) {
    const spyDashboard = vi.fn(layDashboard);
    const spyDiem = vi.fn(layDiem);
    TestBed.configureTestingModule({
      imports: [DashboardSinhVienPage],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: { layDashboardSinhVien: spyDashboard } },
        { provide: DiemService, useValue: { layDiemCuaToi: spyDiem } },
        {
          provide: LopHocPhanService,
          useValue: {
            layTuyChon: vi.fn(() =>
              of([
                {
                  id: 2,
                  label: 'Học kỳ 1 năm học 2026-2027',
                  trang_thai: 'ONGOING',
                },
                { id: 1, label: 'Học kỳ 2 năm học 2025-2026', trang_thai: 'CLOSED' },
              ]),
            ),
          },
        },
        { provide: AuthService, useValue: { nguoiDung: () => null, xoaPhien: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(DashboardSinhVienPage);
    fixture.detectChanges();
    return { fixture, layDashboard: spyDashboard, layDiem: spyDiem };
  }

  it('hiện chào, tên kỳ, thẻ số liệu và học phần từ một lần gọi dashboard', () => {
    const { fixture, layDashboard } = tao();
    // `hoc_ky_id` không truyền ở lần đầu: để backend chọn kỳ mặc định.
    expect(layDashboard).toHaveBeenCalledWith(undefined);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Học kỳ 1 năm học 2026-2027');
    expect(text).toContain('Học phần đã đăng ký');
    expect(text).toContain('Buổi học tuần này');
    expect(text).toContain('Lập trình web');
    expect(text).toContain('INT3306');
  });

  it('bảng học phần ĐÚNG hai cột: Môn học/học phần + Số tín chỉ', () => {
    const { fixture } = tao();
    const th = fixture.nativeElement.querySelectorAll(
      '.bang-hoc-phan thead th',
    ) as NodeListOf<HTMLElement>;
    expect(Array.from(th).map((o) => o.textContent?.trim())).toEqual([
      'Môn học/học phần',
      'Số tín chỉ',
    ]);

    const dong = fixture.nativeElement.querySelector(
      '.bang-hoc-phan tbody tr',
    ) as HTMLElement;
    const o = dong.querySelectorAll('td') as NodeListOf<HTMLElement>;
    expect(o).toHaveLength(2);
    // Cột 1: mã môn (mono, primary) ở trên + tên môn ở dưới.
    expect(o[0].querySelector('.ma-mon')?.textContent?.trim()).toBe('INT3306');
    expect(o[0].querySelector('.ten-mon')?.textContent?.trim()).toBe('Lập trình web');
    // Cột 2: số tín chỉ, căn phải.
    expect(o[1].textContent?.trim()).toBe('3');
    expect(o[1].classList).toContain('cot-tin-chi');
  });

  it('bảng học phần không còn cột Giảng viên / Chuyên cần / Điểm', () => {
    const { fixture } = tao();
    const th = Array.from(
      fixture.nativeElement.querySelectorAll('.bang-hoc-phan thead th') as NodeListOf<HTMLElement>,
    ).map((o) => o.textContent?.trim());
    expect(th).not.toContain('Giảng viên');
    expect(th).not.toContain('Chuyên cần');
    expect(th).not.toContain('Điểm');
    expect(fixture.nativeElement.querySelector('.o-chuyen-can')).toBeNull();
  });

  it('card "Chuyên cần & GPA" không còn trong DOM', () => {
    const { fixture } = tao();
    const html = fixture.nativeElement as HTMLElement;
    const text = html.textContent as string;
    expect(text).not.toContain('Chuyên cần & GPA');
    expect(text).not.toContain('Tỷ lệ chuyên cần');
    expect(html.querySelector('.o-ket-qua')).toBeNull();
    expect(html.querySelector('.canh-bao')).toBeNull();
    expect(html.querySelector('app-bieu-do-tron')).toBeNull();
  });

  it('thẻ số liệu thứ tư là buoi_tuan và bấm được, đi tới /lich-hoc', () => {
    const { fixture } = tao();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const the = Array.from(
      fixture.nativeElement.querySelectorAll('.the-so > *') as NodeListOf<HTMLElement>,
    );
    expect(the.length).toBe(2);
    const cuoi = the[the.length - 1];
    const nut = cuoi.querySelector('button') ?? cuoi;
    (nut as HTMLElement).click();
    expect(navigate).toHaveBeenCalledWith(['/lich-hoc']);
  });

  it('buổi đã huỷ mang lớp tam-ngung; buổi lý thuyết mang lớp ly-thuyet', () => {
    const { fixture } = tao();
    const khoi = fixture.nativeElement.querySelectorAll('.o-buoi') as NodeListOf<HTMLElement>;
    const lop = Array.from(khoi).map((k) => k.className);
    expect(lop.some((c) => c.includes('loai-tam-ngung'))).toBe(true);
    expect(lop.some((c) => c.includes('loai-ly-thuyet'))).toBe(true);
    // Cùng một bộ token --lich-*: không còn lớp cũ .huy/.thuc-hanh.
    expect(lop.some((c) => /\bhuy\b/.test(c))).toBe(false);
  });

  it('đổi học kỳ gửi đúng hoc_ky_id tới dashboard VÀ /me/grades', () => {
    // Mock trả đúng kỳ được hỏi, giống backend thật (docs/04 §14a: `hoc_ky`
    // trong response luôn là kỳ ĐÃ CHỌN). Nếu mock trả cứng id=2, component sẽ
    // đồng bộ ô chọn về 2 và "lần gọi cuối" đọc sai.
    const { fixture, layDashboard, layDiem } = tao();
    expect(layDiem).toHaveBeenCalledWith(2);

    fixture.componentInstance.chonKy(1);
    fixture.detectChanges();

    expect(layDashboard).toHaveBeenLastCalledWith(1);
    expect(layDiem).toHaveBeenLastCalledWith(1);
  });

  it('ô chọn kỳ hiện đủ lựa chọn và đang trỏ kỳ backend trả', () => {
    const { fixture } = tao();
    const chon = fixture.nativeElement.querySelector('app-chon-hoc-ky select') as HTMLSelectElement;
    expect(chon).toBeTruthy();
    expect(chon.options.length).toBe(2);
    expect(chon.value).toBe('2');
    expect(chon.options[0].textContent).toContain('đang diễn ra');
  });

  it('lỗi tải dashboard hiện thông báo + nút Thử lại, không hiện khối dữ liệu', () => {
    const { fixture } = tao(vi.fn(() => throwError(() => new Error('mạng hỏng'))));
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Không tải được dữ liệu');
    expect(text).toContain('Thử lại');
    expect(fixture.nativeElement.querySelector('.the-so')).toBeNull();
  });

  it('lỗi /me/grades chỉ hỏng khối điểm, phần còn lại vẫn hiện', () => {
    const { fixture } = tao(
      vi.fn(() => of(duLieu)),
      vi.fn(() => throwError(() => new Error('lỗi điểm'))),
    );
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Học phần đã đăng ký');
    expect(text).toContain('Không tải được điểm');
  });

  /**
   * Bảng học phần từng có `max-height: 250px; overflow-y: auto` (khung cao
   * 235px trong khi bảng 713px) → sinh ra khung cuộn thứ hai lồng trong
   * `main.noi-dung`, người dùng phải cuộn hai lần (đo trên trình duyệt thật
   * 2026-11-11). Test khoá hành vi DOM: khối `.bang-cuon` phải tồn tại và bảng
   * nằm trong đó — nếu ai thêm lại một khung cuộn dọc thứ hai, nó sẽ là một
   * tổ tiên khác của bảng và test này đỏ.
   *
   * Không đọc file CSS được: dự án không cài `@types/node`, và thêm nó là đổi
   * dependency ngoài phạm vi được phép.
   */
  it('bảng học phần chỉ có MỘT khung cuộn bọc ngoài', () => {
    const { fixture } = tao();
    const html = fixture.nativeElement as HTMLElement;
    const bang = html.querySelector('table');
    expect(bang).toBeTruthy();

    let soKhungCuon = 0;
    let el: HTMLElement | null = bang as HTMLElement;
    while (el && el !== html) {
      if ((el.className || '').toString().includes('bang-cuon')) soKhungCuon++;
      el = el.parentElement;
    }
    expect(soKhungCuon).toBe(1);
  });

  /**
   * Lưới hai cột KHÔNG được bọc thêm khung cuộn hay ép thẻ giãn.
   *
   * Hai lỗi đã sửa và khoá ở đây (đo trên trình duyệt thật 2026-11-11):
   * 1. `align-items: stretch` biến phần dư thành khoảng trắng trơ trong thẻ
   *    ngắn — thẻ "Kết quả học tập" trống 462px ở 390px (389px thật so với
   *    851px của thẻ bên cạnh), và 107/113px trên dashboard giảng viên.
   * 2. Lịch tuần ở 768px giữ 7 cột → mỗi ô buổi chỉ 78px trong khi nội dung
   *    cần 77px, chữ bị cắt và ô phình lên 145px.
   *
   * jsdom không tính bố cục và CSS nằm ở file `styleUrls` (không có trong DOM,
   * không đọc được từ metadata), nên test chỉ khoá cấu trúc: lưới tồn tại, mỗi
   * thẻ là con trực tiếp, và không có khung cuộn bọc ngoài thẻ.
   */
  it('lưới hai cột giữ thẻ là con trực tiếp, không bọc khung cuộn', () => {
    const { fixture } = tao();
    const html = fixture.nativeElement as HTMLElement;
    const luoi = html.querySelector('.luoi-hai');
    expect(luoi).toBeTruthy();
    expect(luoi!.children.length).toBeGreaterThan(0);
    // Không có khung cuộn nào chen giữa lưới và thẻ.
    Array.from(luoi!.children).forEach((con) => {
      const cls = (con.className || '').toString();
      expect(cls).not.toContain('bang-cuon');
    });
  });
});
