import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { DiemDanhCuaToi } from './cua-toi';

describe('DiemDanhCuaToi — chọn học kỳ từ query param', () => {
  const hocKy = [
    { id: 9, label: 'Học kỳ 3 năm học 2026-2027 (tương lai)' },
    { id: 8, label: 'Học kỳ 2 năm học 2026-2027', trang_thai: 'ONGOING' },
    { id: 7, label: 'Học kỳ 1 năm học 2026-2027' },
  ];

  function taoTrang(hocKyQuery: string | null, dsHocKy = hocKy) {
    TestBed.configureTestingModule({
      imports: [DiemDanhCuaToi],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LopHocPhanService, useValue: { layTuyChon: () => of(dsHocKy) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => hocKyQuery } } },
        },
      ],
    });
    const fixture = TestBed.createComponent(DiemDanhCuaToi);
    fixture.detectChanges();
    return {
      fixture,
      httpMock: TestBed.inject(HttpTestingController),
    };
  }

  it('hoc_ky_id của lớp thắng kỳ ONGOING mặc định', () => {
    const { fixture, httpMock } = taoTrang('7');
    expect(fixture.componentInstance.hocKyId()).toBe(7);

    const request = httpMock.expectOne((req) => req.url.endsWith('/me/attendance-summary'));
    expect(request.request.params.get('hoc_ky_id')).toBe('7');
    request.flush({ success: true, message: 'OK', data: [] });
    httpMock.verify();
  });

  it('không có query thì giữ mặc định là kỳ ONGOING', () => {
    const { fixture, httpMock } = taoTrang(null);
    expect(fixture.componentInstance.hocKyId()).toBe(8);
    httpMock.expectOne((req) => req.url.endsWith('/me/attendance-summary')).flush({
      success: true,
      message: 'OK',
      data: [],
    });
    httpMock.verify();
  });

  it('hoc_ky_id rác thì bỏ qua, không gọi API với kỳ không tồn tại', () => {
    const { fixture, httpMock } = taoTrang('999');
    expect(fixture.componentInstance.hocKyId()).toBe(8);
    httpMock.expectOne((req) => req.url.endsWith('/me/attendance-summary')).flush({
      success: true,
      message: 'OK',
      data: [],
    });
    httpMock.verify();
  });

  it('danh sách kỳ rỗng thì không gọi API và thoát trạng thái tải', () => {
    const { fixture, httpMock } = taoTrang('7', []);
    expect(fixture.componentInstance.hocKyId()).toBe(0);
    expect(fixture.componentInstance.dangTai()).toBe(false);
    httpMock.expectNone((req) => req.url.endsWith('/me/attendance-summary'));
    httpMock.verify();
  });
});
