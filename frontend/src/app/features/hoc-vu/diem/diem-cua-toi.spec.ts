import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { BangDiemHocKy, DiemService, TongQuanGpa } from './diem.service';
import { DiemCuaToi } from './diem-cua-toi';

describe('DiemCuaToi', () => {
  const grades: BangDiemHocKy = {
    hoc_ky: { id: 2, ma_hoc_ky: '2026-1', ten_hoc_ky: 'Học kỳ 1 năm học 2026-2027' },
    mon_hoc: [
      {
        ma_mon: 'INT3306',
        ten_mon: 'Lập trình web',
        so_tin_chi: 3,
        diem_chuyen_can: 8.5,
        diem_giua_ky: 7,
        diem_cuoi_ky: 8,
        diem_tong_ket: 7.88,
        diem_chu: 'B',
        diem_he_4: 3,
        ket_qua: 'DAT',
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
      },
    ],
    gpa_he_10: 7.88,
    gpa_he_4: 3,
    tong_tin_chi: 5,
  };
  const gpa: TongQuanGpa = {
    hoc_ky_hien_tai: {
      ...grades.hoc_ky,
      gpa_he_10: 7.88,
      gpa_he_4: 3,
      tong_tin_chi: 5,
    },
    tich_luy: {
      gpa_he_10: 7.42,
      gpa_he_4: 2.87,
      tong_tin_chi: 96,
      tin_chi_dat: 88,
      so_hoc_ky_da_tinh: 5,
    },
  };

  function taoFixture(
    layDiemCuaToi = vi.fn(() => of(grades)),
    layGpa = vi.fn(() => of(gpa)),
    hocKyQuery: string | null = null,
    dsHocKy = [{ id: 2, label: 'Học kỳ 1 năm học 2026-2027' }],
  ) {
    TestBed.configureTestingModule({
      imports: [DiemCuaToi],
      providers: [
        { provide: DiemService, useValue: { layDiemCuaToi, layGpa } },
        {
          provide: LopHocPhanService,
          useValue: { layTuyChon: vi.fn(() => of(dsHocKy)) },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => hocKyQuery } } },
        },
      ],
    });
    const fixture = TestBed.createComponent(DiemCuaToi);
    fixture.detectChanges();
    return { fixture, layDiemCuaToi, layGpa };
  }

  it('shows semester results, grade scales and cumulative GPA', () => {
    const { fixture, layDiemCuaToi, layGpa } = taoFixture();
    const text = fixture.nativeElement.textContent as string;

    expect(layDiemCuaToi).toHaveBeenCalledOnce();
    // Màn điểm lọc theo học kỳ: lần đầu gọi với kỳ đang chọn.
    expect(layDiemCuaToi).toHaveBeenCalledWith(2);
    expect(layGpa).toHaveBeenCalledOnce();
    expect(text).toContain('Lập trình web');
    expect(text).toContain('7.88');
    expect(text).toContain('2.87');
    expect(text).toContain('Đạt');
    expect(text).toContain('Chưa có điểm');
  });

  it('shows an explicit error and retry action when an API request fails', () => {
    const error = new HttpErrorResponse({
      status: 503,
      error: { message: 'Dịch vụ điểm chưa sẵn sàng.' },
    });
    const { fixture, layDiemCuaToi } = taoFixture(
      vi.fn(() => throwError(() => error)),
      vi.fn(() => of(gpa)),
    );

    expect(fixture.nativeElement.textContent).toContain('Dịch vụ điểm chưa sẵn sàng.');
    fixture.nativeElement.querySelector('button').click();
    expect(layDiemCuaToi).toHaveBeenCalledTimes(2);
  });

  it('mở từ lớp học phần thì dùng hoc_ky_id trên query để chọn đúng kỳ', () => {
    const dsHocKy = [
      { id: 3, label: 'Học kỳ 2 năm học 2026-2027' },
      { id: 2, label: 'Học kỳ 1 năm học 2026-2027', trang_thai: 'ONGOING' },
    ];
    const layDiemCuaToi = vi.fn(() => of(grades));
    const { fixture } = taoFixture(layDiemCuaToi, vi.fn(() => of(gpa)), '3', dsHocKy);

    // Mặc định theo kỳ ONGOING là 2; query của lớp là 3 nên phải thắng.
    expect(fixture.componentInstance.hocKyId()).toBe(3);
    expect(layDiemCuaToi).toHaveBeenCalledOnce();
    expect(layDiemCuaToi).toHaveBeenCalledWith(3);
  });

  it('hoc_ky_id không có trong danh sách kỳ thì bỏ qua, giữ kỳ mặc định', () => {
    const dsHocKy = [
      { id: 2, label: 'Học kỳ 1 năm học 2026-2027' },
      { id: 1, label: 'Học kỳ 2 năm học 2025-2026' },
    ];
    const layDiemCuaToi = vi.fn(() => of(grades));
    const { fixture } = taoFixture(layDiemCuaToi, vi.fn(() => of(gpa)), '999', dsHocKy);

    expect(fixture.componentInstance.hocKyId()).toBe(2);
    expect(layDiemCuaToi).toHaveBeenCalledWith(2);
  });

  it('không có query thì giữ nguyên hành vi cũ: chọn kỳ ONGOING', () => {
    const dsHocKy = [
      { id: 9, label: 'Học kỳ 3 năm học 2026-2027 (tương lai)' },
      { id: 8, label: 'Học kỳ 2 năm học 2026-2027', trang_thai: 'ONGOING' },
    ];
    const layDiemCuaToi = vi.fn(() => of(grades));
    const { fixture } = taoFixture(layDiemCuaToi, vi.fn(() => of(gpa)), null, dsHocKy);

    expect(fixture.componentInstance.hocKyId()).toBe(8);
    expect(layDiemCuaToi).toHaveBeenCalledWith(8);
  });
});
