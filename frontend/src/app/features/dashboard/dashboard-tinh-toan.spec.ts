import {
  CHUA_CO,
  DIEM_TOI_DA,
  THOI_LUONG_DEM,
  TRE_MOI_THE,
  chieuCaoCotDiem,
  dinhDangDemSo,
  doanDuongTrungBinh,
  easeOutCubic,
  giaTriDemSo,
  lopCaHoc,
  nhanDiemTrenCot,
  nhanThu,
  nhanThuNgan,
  soChuSoThapPhan,
  toaDoDiemCuaCot,
} from './dashboard-tinh-toan';

/**
 * Logic thuần của ba dashboard. Test ở đây khoá những chỗ SAI ÂM THẦM — số ra
 * sai định dạng, trục biểu đồ co theo dữ liệu, đường TB nối tắt qua môn chưa
 * chấm — chứ không test CSS.
 */
describe('Định dạng số kiểu tiếng Việt', () => {
  it('ngăn nghìn bằng dấu chấm, thập phân bằng dấu phẩy', () => {
    expect(dinhDangDemSo(7028, 0)).toBe('7.028');
    expect(dinhDangDemSo(90.7, 1)).toBe('90,7');
    expect(dinhDangDemSo(2.74, 2)).toBe('2,74');
  });

  it('số 0 vẫn hiện "0", không phải "—" — 0 và null khác nghĩa', () => {
    expect(dinhDangDemSo(0, 0)).toBe('0');
    expect(dinhDangSoNull()).toBe(CHUA_CO);
  });

  function dinhDangSoNull(): string {
    return nhanDiemTrenCot(null);
  }
});

describe('Số chữ số thập phân của giá trị đích', () => {
  it('giữ đúng số lẻ của dữ liệu, chặn ở 2', () => {
    expect(soChuSoThapPhan(2.74)).toBe(2);
    expect(soChuSoThapPhan(90.7)).toBe(1);
    expect(soChuSoThapPhan(15)).toBe(0);
    expect(soChuSoThapPhan(3.14159)).toBe(2);
    expect(soChuSoThapPhan(Number.NaN)).toBe(0);
  });
});

describe('Animation đếm số', () => {
  it('easeOutCubic: 0 → 0, 1 → 1, và tăng đơn điệu', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);

    let truoc = -1;
    for (let t = 0; t <= 1; t += 0.1) {
      const giaTri = easeOutCubic(t);
      expect(giaTri).toBeGreaterThanOrEqual(truoc);
      // easeOut vào nhanh: nửa thời gian đã đi hơn nửa quãng đường.
      truoc = giaTri;
    }
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });

  it('kẹp tiến độ ngoài khoảng 0–1 thay vì cho giá trị âm/vượt', () => {
    expect(easeOutCubic(-3)).toBe(0);
    expect(easeOutCubic(5)).toBe(1);
  });

  it('giá trị hiển thị: bắt đầu ở 0, kết thúc đúng giá trị thật', () => {
    expect(giaTriDemSo(0, 90.7, 0)).toBe(0);
    expect(giaTriDemSo(0, 90.7, 1)).toBe(90.7);
    // Điểm giữa nằm giữa hai đầu, không vọt ra ngoài.
    const giua = giaTriDemSo(0, 100, 0.5);
    expect(giua).toBeGreaterThan(0);
    expect(giua).toBeLessThan(100);
  });

  it('giá trị cuối khi đếm xong khớp định dạng hiển thị', () => {
    // Mô phỏng khung cuối của animation: component gán thẳng số đích.
    expect(dinhDangDemSo(giaTriDemSo(0, 2.74, 1), 2)).toBe('2,74');
    expect(dinhDangDemSo(giaTriDemSo(0, 90.7, 1), 1)).toBe('90,7');
  });

  it('tham số thời lượng và độ trễ so le đúng yêu cầu', () => {
    expect(THOI_LUONG_DEM).toBe(900);
    expect(TRE_MOI_THE).toBe(70);
  });
});

describe('Biểu đồ cột điểm — trục cố định 0–10', () => {
  it('chiều cao cột tính trên thang 10 cố định, không co theo điểm cao nhất', () => {
    expect(chieuCaoCotDiem(10)).toBe(100);
    expect(chieuCaoCotDiem(5)).toBe(50);
    expect(chieuCaoCotDiem(7.5)).toBe(75);
    // Điểm 8 phải cao 80% dù kỳ này cao nhất chỉ 8 — trục không tự co.
    expect(chieuCaoCotDiem(8)).toBe(80);
  });

  it('điểm ngoài thang bị kẹp, null → 0 (không vẽ cột)', () => {
    expect(chieuCaoCotDiem(12)).toBe(100);
    expect(chieuCaoCotDiem(-1)).toBe(0);
    expect(chieuCaoCotDiem(null)).toBe(0);
  });

  it('nhãn trên cột: số theo vi-VN, chưa chấm hiện "—"', () => {
    expect(nhanDiemTrenCot(8.5)).toBe('8,5');
    expect(nhanDiemTrenCot(7)).toBe('7');
    expect(nhanDiemTrenCot(null)).toBe('—');
  });

  it('toạ độ tâm cột nằm giữa ô thứ i và đúng thang dọc', () => {
    // 4 cột: tâm ở 12.5, 37.5, 62.5, 87.5 (%).
    expect(toaDoDiemCuaCot(0, 4, 10)?.x).toBeCloseTo(12.5);
    expect(toaDoDiemCuaCot(3, 4, 10)?.x).toBeCloseTo(87.5);
    // Điểm 10 ở đỉnh (y=0), điểm 0 ở đáy (y=100), điểm 5 ở giữa.
    expect(toaDoDiemCuaCot(0, 4, 10)?.y).toBeCloseTo(0);
    expect(toaDoDiemCuaCot(0, 4, 0)?.y).toBeCloseTo(100);
    expect(toaDoDiemCuaCot(0, 4, 5)?.y).toBeCloseTo(50);
  });

  it('môn chưa chấm có toạ độ null nên không có chấm trên đường', () => {
    expect(toaDoDiemCuaCot(1, 3, null)).toBeNull();
    expect(toaDoDiemCuaCot(0, 0, 8)).toBeNull();
  });
});

describe('Đường trung bình lớp học phần', () => {
  it('nối liền các môn có điểm TB', () => {
    const doan = doanDuongTrungBinh([7.5, 8, 6.5]);
    expect(doan).toHaveLength(1);
    expect(doan[0]).toHaveLength(3);
  });

  it('CẮT đường tại môn chưa có TB — không nối tắt qua chỗ trống', () => {
    const doan = doanDuongTrungBinh([7.5, null, 8, 9]);
    // Đoạn 1 chỉ có một điểm (7.5) → không vẽ; đoạn 2 là [8, 9].
    expect(doan).toHaveLength(1);
    expect(doan[0]).toHaveLength(2);
  });

  it('một điểm lẻ không đủ vẽ đường', () => {
    expect(doanDuongTrungBinh([7.5])).toHaveLength(0);
    expect(doanDuongTrungBinh([null, null])).toHaveLength(0);
  });

  it('giữ đúng thứ tự cột khi có nhiều đoạn', () => {
    const doan = doanDuongTrungBinh([8, 9, null, 7, 6]);
    expect(doan).toHaveLength(2);
    expect(doan[0][0].x).toBeLessThan(doan[0][1].x);
    expect(doan[1][0].x).toBeGreaterThan(doan[0][1].x);
  });
});

describe('Màu khối ca học — cùng bộ token với lịch tuần', () => {
  it('gán lớp theo hình thức học', () => {
    expect(lopCaHoc('LY_THUYET', 'SCHEDULED')).toBe('ly-thuyet');
    expect(lopCaHoc('THUC_HANH', 'SCHEDULED')).toBe('thuc-hanh');
    expect(lopCaHoc('TRUC_TUYEN', 'SCHEDULED')).toBe('truc-tuyen');
  });

  it('buổi đã huỷ thắng mọi hình thức', () => {
    expect(lopCaHoc('LY_THUYET', 'CANCELLED')).toBe('tam-ngung');
    expect(lopCaHoc('THUC_HANH', 'CANCELLED')).toBe('tam-ngung');
  });

  it('hình thức lạ mặc định về lý thuyết, không vỡ màu', () => {
    expect(lopCaHoc('KHONG_BIET', 'SCHEDULED')).toBe('ly-thuyet');
  });
});

describe('Hằng số biểu đồ', () => {
  it('trần thang điểm là 10', () => {
    expect(DIEM_TOI_DA).toBe(10);
  });
});

describe('Nhãn thứ — dài cho danh sách, ngắn cho ô bảng', () => {
  it('dạng dài dùng trong danh sách dọc', () => {
    expect(nhanThu(2)).toBe('Thứ 2');
    expect(nhanThu(7)).toBe('Thứ 7');
    expect(nhanThu(8)).toBe('Chủ nhật');
    expect(nhanThu(1)).toBe('');
  });

  it('dạng ngắn "T2…T7, CN" cho cột Ngày của bảng', () => {
    expect(nhanThuNgan(2)).toBe('T2');
    expect(nhanThuNgan(7)).toBe('T7');
    expect(nhanThuNgan(8)).toBe('CN');
    expect(nhanThuNgan(1)).toBe('');
    expect(nhanThuNgan(0)).toBe('');
  });
});
