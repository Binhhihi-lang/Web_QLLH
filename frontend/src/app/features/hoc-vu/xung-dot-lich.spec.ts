import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { XungDotLichKhoi, docXungDotLich } from './xung-dot-lich';

/**
 * Hợp đồng 409 `SCHEDULE_CONFLICT` (docs/04-api-contract.md §ca thi) — đọc sai
 * shape này thì người dùng chỉ thấy một câu chung, mất toàn bộ chi tiết trùng
 * lịch mà backend đã gửi.
 */
describe('docXungDotLich — đọc lỗi 409 SCHEDULE_CONFLICT', () => {
  function loi409(errors: unknown, message = 'Ca thi trùng lịch của 12 sinh viên.') {
    return new HttpErrorResponse({
      status: 409,
      error: { success: false, message, ma_loi: 'SCHEDULE_CONFLICT', errors },
    });
  }

  it('trả null khi lỗi không phải trùng lịch', () => {
    const khac = new HttpErrorResponse({
      status: 422,
      error: { success: false, message: 'Dữ liệu không hợp lệ.', ma_loi: 'VALIDATION_ERROR' },
    });
    expect(docXungDotLich(khac)).toBeNull();
    expect(docXungDotLich(null)).toBeNull();
    expect(docXungDotLich('loi')).toBeNull();
  });

  it('đọc đúng danh sách dòng và tổng số vi phạm', () => {
    const ketQua = docXungDotLich(
      loi409({
        trung_lich: [
          {
            sinh_vien_id: 2,
            ma_sv: 'SV002',
            ho_ten: 'Nguyễn Văn A',
            ma_lop_hp: 'INT3306-01',
            ngay: '2026-11-20',
            gio_bat_dau: '07:30',
            gio_ket_thuc: '09:10',
            loai: 'buoi_hoc',
          },
        ],
        tong_so_vi_pham: 12,
      }),
    );

    expect(ketQua).not.toBeNull();
    expect(ketQua!.dong).toHaveLength(1);
    expect(ketQua!.dong[0].ma_sv).toBe('SV002');
    expect(ketQua!.tongSo).toBe(12);
    // 12 vi phạm nhưng chỉ trả 1 dòng → màn hình phải nói "… và 11 vi phạm khác".
    expect(ketQua!.conLai).toBe(11);
    expect(ketQua!.thongDiep).toContain('12 sinh viên');
  });

  it('không có tong_so_vi_pham thì lấy số dòng làm tổng, conLai = 0', () => {
    const ketQua = docXungDotLich(
      loi409({
        trung_lich: [
          { ngay_hoc: '2026-11-03', gio_bat_dau: '07:30', loai: 'phong_hoc', doi_tuong: 'A101' },
        ],
      }),
    );
    expect(ketQua!.tongSo).toBe(1);
    expect(ketQua!.conLai).toBe(0);
  });

  it('vẫn trả cấu trúc khi backend không kèm errors — màn hình hiện thông điệp chung', () => {
    const ketQua = docXungDotLich(loi409(null));
    expect(ketQua).not.toBeNull();
    expect(ketQua!.dong).toEqual([]);
    expect(ketQua!.conLai).toBe(0);
  });

  it('đọc được xung đột phòng: backend trả ngay_thi + mon_hoc, không có ma_sv', () => {
    const ketQua = docXungDotLich(
      loi409({
        trung_lich: [
          {
            lich_thi_id: 7,
            mon_hoc: 'Cơ sở dữ liệu',
            ngay_thi: '2026-11-20',
            gio_bat_dau: '07:30',
            gio_ket_thuc: '09:10',
            loai: 'phong_hoc',
            doi_tuong: 'A101',
          },
        ],
      }),
    );
    expect(ketQua!.dong[0].ngay_thi).toBe('2026-11-20');
    expect(ketQua!.dong[0].mon_hoc).toBe('Cơ sở dữ liệu');
  });

  it('loai lich_thi: doi_tuong là mã MÔN, không phải mã phòng', () => {
    const dong = docXungDotLich(
      loi409({
        trung_lich: [
          {
            lich_thi_id: 9,
            ngay_hoc: '2026-11-21',
            gio_bat_dau: '09:30',
            gio_ket_thuc: '11:10',
            loai: 'lich_thi',
            doi_tuong: 'MH004',
          },
        ],
      }),
    )!.dong[0];
    expect(dong.loai).toBe('lich_thi');
    expect(dong.doi_tuong).toBe('MH004');
  });

  it('loai giang_vien / sinh_vien: doi_tuong là mã GV / mã SV', () => {
    const ds = docXungDotLich(
      loi409({
        trung_lich: [
          { ngay_hoc: '2026-11-03', gio_bat_dau: '07:30', gio_ket_thuc: '09:10', loai: 'giang_vien', doi_tuong: 'GV0007' },
          { ngay_hoc: '2026-11-03', gio_bat_dau: '07:30', gio_ket_thuc: '09:10', loai: 'sinh_vien', doi_tuong: 'SV000012' },
        ],
      }),
    )!.dong;

    TestBed.configureTestingModule({ imports: [XungDotLichKhoi] });
    const fixture = TestBed.createComponent(XungDotLichKhoi);
    fixture.componentRef.setInput('duLieu', {
      thongDiep: 'Có buổi học bị trùng lịch.',
      dong: ds,
      tongSo: 2,
      conLai: 0,
    });
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Giảng viên GV0007');
    expect(text).toContain('Sinh viên SV000012');
  });

  it('bỏ qua phần tử rác trong trung_lich thay vì ném lỗi', () => {
    const ketQua = docXungDotLich(loi409({ trung_lich: [null, 3, { ma_sv: 'SV009' }] }));
    expect(ketQua!.dong).toHaveLength(1);
    expect(ketQua!.dong[0].ma_sv).toBe('SV009');
  });

  it('khối giao diện hiện đủ dòng, số còn lại và nhãn đúng từng loại xung đột', () => {
    const duLieu = docXungDotLich(
      loi409({
        trung_lich: [
          { ma_sv: 'SV002', ho_ten: 'Nguyễn Văn A', ma_lop_hp: 'INT3306-01', ngay: '2026-11-20', gio_bat_dau: '07:30', gio_ket_thuc: '09:10', loai: 'buoi_hoc' },
          { lich_thi_id: 7, mon_hoc: 'Cơ sở dữ liệu', ngay_thi: '2026-11-20', gio_bat_dau: '07:30', gio_ket_thuc: '09:10', loai: 'phong_hoc', doi_tuong: 'A101' },
          { lich_thi_id: 9, ngay_hoc: '2026-11-21', gio_bat_dau: '09:30', gio_ket_thuc: '11:10', loai: 'lich_thi', doi_tuong: 'MH004' },
        ],
        tong_so_vi_pham: 12,
      }),
    )!;

    TestBed.configureTestingModule({ imports: [XungDotLichKhoi] });
    const fixture = TestBed.createComponent(XungDotLichKhoi);
    fixture.componentRef.setInput('duLieu', duLieu);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    // Buổi học: mã SV + họ tên + lớp.
    expect(text).toContain('SV002 · Nguyễn Văn A — lớp INT3306-01');
    // Xung đột phòng: nhãn "Phòng" + tên môn đang chiếm phòng.
    expect(text).toContain('Phòng A101 — Cơ sở dữ liệu');
    // Xung đột ca thi: doi_tuong là mã MÔN, không được gọi là "Phòng".
    expect(text).toContain('Môn MH004');
    expect(text).not.toContain('Phòng MH004');
    // Ngày hiển thị dd/mm/yyyy và có câu đếm phần còn lại.
    expect(text).toContain('20/11/2026');
    expect(text).toContain('21/11/2026');
    expect(text).toContain('và 9 vi phạm khác');
  });
});
