import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ThungRacPage } from './thung-rac';
import { ThungRacService } from '@core/services/thung-rac.service';

describe('ThungRacPage (SCR-45)', () => {
  let component: ThungRacPage;
  let fixture: ComponentFixture<ThungRacPage>;
  let mockService: {
    layDanhSach: () => any;
    khoiPhuc: () => any;
  };

  const fakeData = {
    success: true,
    message: 'Thành công',
    data: [
      {
        id: 1,
        ten_mon: 'Lập trình hướng đối tượng',
        ma_mon: 'INT2204',
        deleted_at: '2026-10-25 10:00:00',
        xoa_boi: { id: 1, name: 'Admin Demo', email: 'admin@qllh.test' },
      },
    ],
    meta: {
      current_page: 1,
      from: 1,
      last_page: 1,
      per_page: 10,
      to: 1,
      total: 1,
    },
  };

  beforeEach(async () => {
    mockService = {
      layDanhSach: () => of(fakeData),
      khoiPhuc: () => of({ success: true, message: 'Khôi phục thành công.' }),
    };

    await TestBed.configureTestingModule({
      imports: [ThungRacPage],
      providers: [{ provide: ThungRacService, useValue: mockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ThungRacPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('khởi tạo thành công và tải dữ liệu mặc định', () => {
    expect(component).toBeTruthy();
    expect(component.danhSach().length).toBe(1);
    expect(component.tongSo()).toBe(1);
  });

  it('đổi loại thực thể cập nhật tiêu đề và loại hiện tại', () => {
    component.doiLoai('students');
    expect(component.loaiHienTai()).toBe('students');
    expect(component.tenLoaiHienTai()).toBe('Sinh viên');
  });

  it('mở dialog khôi phục và xác nhận khôi phục thành công', () => {
    component.moDialogKhoiPhuc(fakeData.data[0]);
    expect(component.banGhiKhoiPhuc()).not.toBeNull();

    component.xacNhanKhoiPhuc();
    expect(component.banGhiKhoiPhuc()).toBeNull();
    expect(component.thongBao()?.muc).toBe('success');
  });
});
