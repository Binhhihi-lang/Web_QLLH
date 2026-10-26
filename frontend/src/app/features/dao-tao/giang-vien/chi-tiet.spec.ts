import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { GiangVienService } from '@core/services/giang-vien.service';
import { GiangVienChiTiet } from './chi-tiet';

describe('GiangVienChiTiet', () => {
  it('loads and displays the teacher profile and offers an edit route', () => {
    const teacher = {
      id: 1,
      ma_gv: 'GV0001',
      ho_ten: 'Nguyễn Minh An',
      email: 'an@example.edu.vn',
      so_dien_thoai: '0912345678',
      chuyen_mon: 'Công nghệ phần mềm',
      trang_thai: true,
      avatar_url: null,
      da_xoa: false,
    };
    const service = { layMot: vi.fn(() => of(teacher)) };
    TestBed.configureTestingModule({
      imports: [GiangVienChiTiet],
      providers: [provideRouter([]), { provide: GiangVienService, useValue: service }],
    });
    const fixture = TestBed.createComponent(GiangVienChiTiet);
    fixture.componentRef.setInput('id', 1);
    fixture.detectChanges();

    expect(service.layMot).toHaveBeenCalledWith(1);
    expect(fixture.nativeElement.textContent).toContain('GV0001');
    expect(fixture.nativeElement.textContent).toContain('an@example.edu.vn');
    expect(fixture.nativeElement.textContent).toContain('Công nghệ phần mềm');
    expect(fixture.nativeElement.querySelector('a[href="/giang-vien/1/sua"]')).toBeTruthy();
  });

  it('shows an error when the teacher cannot be loaded', () => {
    const service = { layMot: vi.fn(() => ({ subscribe: ({ error }: { error: () => void }) => error() })) };
    TestBed.configureTestingModule({
      imports: [GiangVienChiTiet],
      providers: [provideRouter([]), { provide: GiangVienService, useValue: service }],
    });
    const fixture = TestBed.createComponent(GiangVienChiTiet);
    fixture.componentRef.setInput('id', 999);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Không tải được thông tin giảng viên.');
  });
});
