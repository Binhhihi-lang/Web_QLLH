import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CauHinhDiem } from '@core/models/he-thong.model';
import { CauHinhService } from '@core/services/cau-hinh.service';
import { CauHinhPage } from './cau-hinh';

describe('CauHinhPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<CauHinhPage>>;
  let service: {
    lay: ReturnType<typeof vi.fn>;
    capNhat: ReturnType<typeof vi.fn>;
  };

  const config: CauHinhDiem = {
    'diem.trong_so': { chuyen_can: 0.25, giua_ky: 0.25, cuoi_ky: 0.5 },
    'diem.bang_quy_doi': [
      { tu: 8.5, den: 10, chu: 'A', he_4: 4, dat: true },
      { tu: 7, den: 8.49, chu: 'B', he_4: 3, dat: true },
      { tu: 5.5, den: 6.99, chu: 'C', he_4: 2, dat: true },
      { tu: 4, den: 5.49, chu: 'D', he_4: 1, dat: true },
      { tu: 0, den: 3.99, chu: 'F', he_4: 0, dat: false },
    ],
    'diem.diem_danh.sua_trong_so_ngay': 7,
  };

  beforeEach(() => {
    service = {
      lay: vi.fn(() => of(config)),
      capNhat: vi.fn(() => of(config)),
    };
    TestBed.configureTestingModule({
      imports: [CauHinhPage],
      providers: [{ provide: CauHinhService, useValue: service }],
    });
    fixture = TestBed.createComponent(CauHinhPage);
    fixture.detectChanges();
  });

  it('loads all grading and attendance rules', () => {
    expect(service.lay).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('Trọng số điểm thành phần');
    expect(fixture.nativeElement.textContent).toContain('Thời hạn sửa điểm danh');
    expect(fixture.componentInstance.tongTrongSoHopLe()).toBe(true);
  });

  it('renders score-range actions as buttons rather than links', () => {
    const actions = fixture.nativeElement.querySelectorAll('tbody td:last-child button');

    expect(actions).toHaveLength(config['diem.bang_quy_doi'].length);
    expect(fixture.nativeElement.querySelectorAll('tbody td:last-child a')).toHaveLength(0);
    expect(
      Array.from(actions as NodeListOf<HTMLButtonElement>).every((button) =>
        button.classList.contains('nut-hanh-dong'),
      ),
    ).toBe(true);
  });

  it('blocks saving weights that do not total one', () => {
    fixture.componentInstance.doiTrongSo('cuoi_ky', {
      target: { value: '0.4' },
    } as unknown as Event);

    fixture.componentInstance.luu(new Event('submit'));

    expect(service.capNhat).not.toHaveBeenCalled();
    expect(fixture.componentInstance.loiValidation()['diem.trong_so']).toBeTruthy();
  });

  it('saves valid settings through the PUT service', () => {
    fixture.componentInstance.luu(new Event('submit'));

    expect(service.capNhat).toHaveBeenCalledWith(config);
    expect(fixture.componentInstance.thongBao()?.muc).toBe('success');
  });
});
