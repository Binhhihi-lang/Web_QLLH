import { HttpParams } from '@angular/common/http';
import { DASHBOARD_ADMIN_MOCK } from '@core/mock/data/dashboard.mock';
import { LOP_HOC_PHAN_MOCK } from '@core/mock/data/hoc-vu.mock';
import {
  GIANG_VIEN_MOCK,
  HOC_KY_MOCK,
  LOP_HANH_CHINH_MOCK,
  MON_HOC_MOCK,
  SINH_VIEN_MOCK,
} from '@core/mock/data/dao-tao.mock';
import {
  filterBy,
  loi,
  loiValidation,
  ok,
  paginate,
  searchBy,
  sortBy,
} from '@core/mock/mock-response';
import { LopHocPhan, TrangThaiLopHocPhan } from '@core/models/dao-tao.model';
import { SystemRegistry } from '@core/mock/registry/system.registry';
import type {
  DiemNhap,
  DongDiem,
  LopHocPhanInput,
  SinhVienLop,
} from '@core/services/lop-hoc-phan.service';
import type {
  DangKyHocPhan,
  KetQuaDangKyDong,
} from '@features/hoc-vu/dang-ky/dang-ky.service';
import type {
  BuoiHocDiemDanh,
  DongDiemDanh,
  DongDiemDanhInput,
  ThongKeChuyenCan,
  TrangThaiDiemDanh,
} from '@features/hoc-vu/diem-danh/diem-danh.service';

interface LichSuDiemMock {
  id: number;
  truong: string;
  gia_tri_cu: string | null;
  gia_tri_moi: string | null;
  nguoi_sua: string;
  ly_do: string | null;
  thoi_diem: string;
}

/**
 * Mock cho nhóm HỌC VỤ; cụm đăng ký SCR-30–33 do Đức Anh phụ trách theo phân công PM.
 *
 * Lớp học phần, lịch, đăng ký, điểm danh, điểm, dashboard. Thêm endpoint mới
 * thì thêm ở đây, không đụng registry đào tạo của Đức Anh.
 */
export class HocVuRegistry {
  private readonly lopHocPhan = LOP_HOC_PHAN_MOCK.map((row) => ({
    ...row,
    mon_hoc: { ...row.mon_hoc },
    hoc_ky: { ...row.hoc_ky },
    giang_vien: { ...row.giang_vien },
  }));
  private readonly diemDaLuu = new Map<number, DongDiem[]>();
  private readonly lichSuDiem = new Map<number, LichSuDiemMock[]>();
  private readonly dangKyDaHuy = new Set<number>();
  private soLichSu = 1;
  private readonly dangKyThem: Array<{ lop_hoc_phan_id: number; sinh_vien: SinhVienLop }> = [];
  private readonly lichSuDangKy = new Map<number, DangKyHocPhan>();
  private readonly buoiHoc = new Map<number, BuoiHocDiemDanh[]>();
  private readonly diemDanh = new Map<number, DongDiemDanh[]>();

  constructor(private readonly system: SystemRegistry) {}

  resolve(
    method: string,
    path: string,
    params: HttpParams,
    body: unknown = null,
    vaiTro: string | null = null,
  ): object | undefined {
    if (path === '/me/grades' && method === 'GET') {
      return vaiTro === 'SINH_VIEN'
        ? ok(this.bangDiemSinhVien())
        : loi('FORBIDDEN', 'Chỉ sinh viên mới xem được điểm cá nhân.');
    }

    if (path === '/me/gpa' && method === 'GET') {
      return vaiTro === 'SINH_VIEN'
        ? ok(this.tongQuanGpa())
        : loi('FORBIDDEN', 'Chỉ sinh viên mới xem được GPA cá nhân.');
    }

    const gradeHistory = path.match(/^\/enrollments\/(\d+)\/grade-history$/);
    if (gradeHistory && method === 'GET') {
      const id = Number(gradeHistory[1]);
      return ok(this.lichSuDiem.get(id) ?? []);
    }

    if (path === '/enrollments' && method === 'GET') {
      if (vaiTro && vaiTro !== 'ADMIN' && vaiTro !== 'GIANG_VIEN') {
        return loi('FORBIDDEN', 'Bạn không có quyền xem danh sách đăng ký.');
      }
      return this.danhSachDangKy(params);
    }
    if (path === '/enrollments' && method === 'POST') {
      if (vaiTro && vaiTro !== 'ADMIN') return loi('FORBIDDEN', 'Chỉ quản trị viên được đăng ký hộ.');
      const data = this.bodyRecord(body);
      return this.taoDangKy(Number(data['sinh_vien_id']), Number(data['lop_hoc_phan_id']), vaiTro);
    }
    if (path === '/enrollments/bulk' && method === 'POST') {
      if (vaiTro && vaiTro !== 'ADMIN') return loi('FORBIDDEN', 'Chỉ quản trị viên được đăng ký hàng loạt.');
      return this.dangKyHangLoat(body);
    }
    if (path === '/me/enrollments' && method === 'GET') {
      if (vaiTro && vaiTro !== 'SINH_VIEN') return loi('FORBIDDEN', 'Chỉ sinh viên được xem đăng ký của mình.');
      return this.danhSachDangKy(params, 1);
    }
    if (path === '/me/enrollments' && method === 'POST') {
      if (vaiTro && vaiTro !== 'SINH_VIEN') return loi('FORBIDDEN', 'Chỉ sinh viên được tự đăng ký.');
      const data = this.bodyRecord(body);
      return this.taoDangKy(1, Number(data['lop_hoc_phan_id']), vaiTro);
    }
    const dangKyCuaToi = path.match(/^\/me\/enrollments\/(\d+)$/);
    if (dangKyCuaToi && method === 'DELETE') {
      if (vaiTro && vaiTro !== 'SINH_VIEN') return loi('FORBIDDEN', 'Chỉ sinh viên được hủy đăng ký của mình.');
      return this.huyDangKy(Number(dangKyCuaToi[1]), vaiTro);
    }

    const enrollment = path.match(/^\/enrollments\/(\d+)$/);
    if (enrollment && method === 'DELETE') {
      const id = Number(enrollment[1]);
      const lyDo = this.bodyRecord(body)['ly_do'];
      if (typeof lyDo !== 'string' || !lyDo.trim()) {
        return loiValidation({ ly_do: ['Lý do hủy đăng ký là bắt buộc.'] });
      }
      const section = this.lopHocPhan.find(
        (row) =>
          this.tim(row.id) &&
          this.sinhVienLop(row.id).some((student) => student.dang_ky_hoc_phan_id === id),
      );
      if (!section) return loi('NOT_FOUND', 'Không tìm thấy đăng ký học phần.');
      this.dangKyDaHuy.add(id);
      section.si_so_hien_tai = Math.max(0, section.si_so_hien_tai - 1);
      return ok(null, 'Đã hủy đăng ký học phần.');
    }

    if (path === '/sections' && method === 'GET') {
      let rows = searchBy(
        this.lopHocPhan.filter((row) => !row.da_xoa),
        params.get('q'),
        ['ma_lop_hp', 'mon_hoc.ten_mon', 'giang_vien.ho_ten'],
      );
      rows = this.locDanhSach(rows, params);
      rows = sortBy(rows, params, 'ma_lop_hp');
      return paginate(rows, params, '/api/sections');
    }
    if (path === '/sections' && method === 'POST') return this.luuLop(body);

    const section = path.match(/^\/sections\/(\d+)$/);
    if (section && method === 'GET') {
      const row = this.tim(Number(section[1]));
      return row ? ok(row) : loi('NOT_FOUND', 'Không tìm thấy lớp học phần.');
    }
    if (section && method === 'PUT') return this.luuLop(body, Number(section[1]));
    if (section && method === 'DELETE') {
      const row = this.tim(Number(section[1]));
      if (!row) return loi('NOT_FOUND', 'Không tìm thấy lớp học phần.');
      if (this.sinhVienLop(row.id).length > 0) {
        return loi('DELETE_BLOCKED', 'Lớp học phần còn sinh viên đăng ký đang hiệu lực.');
      }
      row.da_xoa = true;
      return ok(null, 'Đã xóa lớp học phần.');
    }

    const status = path.match(/^\/sections\/(\d+)\/status$/);
    if (status && method === 'PATCH') {
      const row = this.tim(Number(status[1]));
      if (!row) return loi('NOT_FOUND', 'Không tìm thấy lớp học phần.');
      const next = this.bodyRecord(body)['trang_thai'];
      if (next !== 'OPEN' && next !== 'CLOSED' && next !== 'CANCELLED') {
        return loiValidation({ trang_thai: ['Trạng thái lớp học phần không hợp lệ.'] });
      }
      if (next === 'CANCELLED' && row.da_chot_diem) {
        return loi('GRADE_LOCKED', 'Lớp đã chốt điểm, cần mở khóa trước khi hủy.');
      }
      row.trang_thai = next;
      if (next === 'CANCELLED') {
        this.sinhVienLop(row.id).forEach((student) =>
          this.dangKyDaHuy.add(student.dang_ky_hoc_phan_id),
        );
        row.si_so_hien_tai = 0;
      }
      return ok(row);
    }

    const students = path.match(/^\/sections\/(\d+)\/students$/);
    if (students && method === 'GET') {
      const id = Number(students[1]);
      return this.tim(id)
        ? ok(this.sinhVienLop(id))
        : loi('NOT_FOUND', 'Không tìm thấy lớp học phần.');
    }
    const sessions = path.match(/^\/sections\/(\d+)\/sessions$/);
    if (sessions && method === 'GET') {
      const id = Number(sessions[1]);
      return this.tim(id)
        ? ok(this.buoiHocCuaLop(id))
        : loi('NOT_FOUND', 'Không tìm thấy lớp học phần.');
    }
    const attendanceSummary = path.match(/^\/sections\/(\d+)\/attendance-summary$/);
    if (attendanceSummary && method === 'GET') {
      const id = Number(attendanceSummary[1]);
      return this.tim(id)
        ? ok(this.thongKeChuyenCan(id))
        : loi('NOT_FOUND', 'Không tìm thấy lớp học phần.');
    }
    const sessionAttendance = path.match(/^\/sessions\/(\d+)\/attendance$/);
    if (sessionAttendance && method === 'GET') {
      const id = Number(sessionAttendance[1]);
      const rows = this.dongDiemDanh(id);
      return rows
        ? ok({ buoi_hoc: this.buoiHocTomTat(id), danh_sach: rows })
        : loi('NOT_FOUND', 'Không tìm thấy buổi học.');
    }
    if (sessionAttendance && method === 'PUT') {
      const id = Number(sessionAttendance[1]);
      const rows = this.dongDiemDanh(id);
      if (!rows) return loi('NOT_FOUND', 'Không tìm thấy buổi học.');
      const input = this.bodyRecord(body)['diem_danh'];
      if (!Array.isArray(input))
        return loiValidation({ diem_danh: ['Danh sách điểm danh không hợp lệ.'] });
      const statusHopLe: TrangThaiDiemDanh[] = ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'];
      const errors: Record<string, string[]> = {};
      for (const [index, raw] of input.entries()) {
        const row = this.bodyRecord(raw);
        const student = rows.find(
          (item) => item.dang_ky_hoc_phan_id === Number(row['dang_ky_hoc_phan_id']),
        );
        if (!student)
          errors[`diem_danh.${index}.dang_ky_hoc_phan_id`] = ['Đăng ký học phần không hợp lệ.'];
        if (!statusHopLe.includes(row['trang_thai'] as TrangThaiDiemDanh)) {
          errors[`diem_danh.${index}.trang_thai`] = ['Trạng thái điểm danh không hợp lệ.'];
        }
        if (
          row['ghi_chu'] !== null &&
          row['ghi_chu'] !== undefined &&
          (typeof row['ghi_chu'] !== 'string' || row['ghi_chu'].length > 500)
        ) {
          errors[`diem_danh.${index}.ghi_chu`] = ['Ghi chú tối đa 500 ký tự.'];
        }
      }
      if (Object.keys(errors).length) return loiValidation(errors);
      const values = input as DongDiemDanhInput[];
      values.forEach((value) => {
        const row = rows.find((item) => item.dang_ky_hoc_phan_id === value.dang_ky_hoc_phan_id);
        if (row) {
          row.trang_thai = value.trang_thai;
          row.ghi_chu = value.ghi_chu;
        }
      });
      this.diemDanh.set(id, rows);
      return ok({ buoi_hoc_id: id, so_luong: values.length, trang_thai_buoi_hoc: 'DONE' });
    }
    const grades = path.match(/^\/sections\/(\d+)\/grades$/);
    if (grades && method === 'GET') {
      const id = Number(grades[1]);
      return this.tim(id)
        ? ok(this.diemDaLuu.get(id) ?? this.diemLop(id))
        : loi('NOT_FOUND', 'Không tìm thấy lớp học phần.');
    }
    if (grades && method === 'PUT') {
      const id = Number(grades[1]);
      const row = this.tim(id);
      if (!row) return loi('NOT_FOUND', 'Không tìm thấy lớp học phần.');
      if (row.da_chot_diem) return loi('GRADE_LOCKED', 'Lớp học phần đã chốt điểm.');
      const request = this.bodyRecord(body);
      const lyDo = request['ly_do'];
      if (lyDo !== undefined && (typeof lyDo !== 'string' || lyDo.length > 500)) {
        return loiValidation({ ly_do: ['Lý do tối đa 500 ký tự.'] });
      }
      const diem = request['diem'];
      if (!Array.isArray(diem)) return loiValidation({ diem: ['Danh sách điểm không hợp lệ.'] });
      const capNhat = this.capNhatBangDiem(
        id,
        diem,
        typeof lyDo === 'string' ? lyDo.trim() : null,
        vaiTro ?? 'Giảng viên demo',
      );
      if (!capNhat.ok) return loiValidation(capNhat.errors);
      this.diemDaLuu.set(id, capNhat.rows);
      return ok(capNhat.rows);
    }

    const finalize = path.match(/^\/sections\/(\d+)\/finalize$/);
    if (finalize && method === 'POST') {
      const row = this.tim(Number(finalize[1]));
      if (!row) return loi('NOT_FOUND', 'Không tìm thấy lớp học phần.');
      if (row.da_chot_diem) return loi('GRADE_LOCKED', 'Lớp học phần đã chốt điểm.');
      const scores = this.diemDaLuu.get(row.id) ?? this.diemLop(row.id);
      const dayDu = scores.every(
        (score) =>
          score.diem_chuyen_can !== null &&
          score.diem_giua_ky !== null &&
          score.diem_cuoi_ky !== null,
      );
      if (!dayDu) return loi('GRADE_INCOMPLETE', 'Chưa đủ điểm thành phần để chốt.');
      row.da_chot_diem = true;
      row.chot_diem_luc = new Date().toISOString();
      return ok(row, 'Đã chốt điểm.');
    }

    if (path === '/dashboard/admin' && method === 'GET') return ok(DASHBOARD_ADMIN_MOCK);

    if (path === '/options/sections' && method === 'GET') {
      return ok(
        this.lopHocPhan
          .filter((row) => !row.da_xoa && row.trang_thai === 'OPEN')
          .map((row) => ({
            id: row.id,
            label: `${row.ma_lop_hp} — ${row.mon_hoc.ten_mon}`,
            con_cho: Math.max(0, row.si_so_toi_da - row.si_so_hien_tai),
            nam_thu: row.nam_thu,
          })),
      );
    }
    if (path === '/options/rooms' && method === 'GET') return ok([]);

    return undefined;
  }

  private buoiHocCuaLop(id: number): BuoiHocDiemDanh[] {
    const stored = this.buoiHoc.get(id);
    if (stored) return stored;
    const lop = this.tim(id);
    if (!lop) return [];

    const dates = ['2026-10-28', '2026-11-03', '2026-11-10'];
    const rows: BuoiHocDiemDanh[] = dates.map((ngay_hoc, index) => ({
      id: id * 10 + index + 1,
      ngay_hoc,
      gio_bat_dau: '08:00',
      gio_ket_thuc: '10:00',
      trang_thai: (index < 2 ? 'DONE' : 'SCHEDULED') as BuoiHocDiemDanh['trang_thai'],
      da_diem_danh: index < 2,
      so_diem_danh: index < 2 ? 3 : 0,
    }));
    this.buoiHoc.set(id, rows);
    return rows;
  }

  private buoiHocTomTat(buoiHocId: number) {
    const lopId = Math.floor(buoiHocId / 10);
    const lop = this.tim(lopId);
    const buoi = this.buoiHocCuaLop(lopId).find((row) => row.id === buoiHocId);
    return {
      id: buoiHocId,
      ngay_hoc: buoi?.ngay_hoc ?? '',
      gio_bat_dau: buoi?.gio_bat_dau ?? '',
      gio_ket_thuc: buoi?.gio_ket_thuc ?? '',
      trang_thai: buoi?.trang_thai ?? 'SCHEDULED',
      ly_do_huy: null,
      phong_hoc: null,
      lop_hoc_phan: {
        id: lopId,
        ma_lop_hp: lop?.ma_lop_hp ?? '',
        ten_mon_hoc: lop?.mon_hoc.ten_mon ?? null,
        hoc_ky: null,
      },
      co_the_sua: true,
    };
  }

  private dongDiemDanh(buoiHocId: number): DongDiemDanh[] | null {
    const lopId = Math.floor(buoiHocId / 10);
    const buoi = this.buoiHocCuaLop(lopId).find((row) => row.id === buoiHocId);
    if (!buoi) return null;

    const stored = this.diemDanh.get(buoiHocId);
    if (stored) return stored;
    const roster = this.sinhVienLop(lopId).map((sinhVien, index) => ({
      dang_ky_hoc_phan_id: sinhVien.dang_ky_hoc_phan_id,
      sinh_vien: sinhVien,
      trang_thai:
        buoiHocId % 10 === 1
          ? (['PRESENT', 'PRESENT', 'LATE', 'EXCUSED'][index % 4] as TrangThaiDiemDanh)
          : null,
      ghi_chu: null,
    }));
    this.diemDanh.set(buoiHocId, roster);
    return roster;
  }

  private thongKeChuyenCan(lopId: number): ThongKeChuyenCan {
    const lop = this.tim(lopId)!;
    const buoi = this.buoiHocCuaLop(lopId);
    const students = this.sinhVienLop(lopId).map((sinhVien) => {
      const attendance = buoi.flatMap(
        (session) =>
          this.dongDiemDanh(session.id)?.filter(
            (row) => row.dang_ky_hoc_phan_id === sinhVien.dang_ky_hoc_phan_id,
          ) ?? [],
      );
      const coMat = attendance.filter((row) => row.trang_thai === 'PRESENT').length;
      const diMuon = attendance.filter((row) => row.trang_thai === 'LATE').length;
      const vang = attendance.filter((row) => row.trang_thai === 'ABSENT').length;
      const coPhep = attendance.filter((row) => row.trang_thai === 'EXCUSED').length;
      const mauSo = coMat + diMuon + vang;
      return {
        dang_ky_hoc_phan_id: sinhVien.dang_ky_hoc_phan_id,
        sinh_vien: sinhVien,
        co_mat: coMat,
        di_muon: diMuon,
        vang,
        co_phep: coPhep,
        ty_le: mauSo ? Number(((coMat + diMuon) / mauSo).toFixed(4)) : null,
      };
    });

    return {
      lop_hoc_phan_id: lop.id,
      ma_lop_hp: lop.ma_lop_hp,
      tong_buoi: buoi.length,
      sinh_vien: students,
    };
  }

  private locDanhSach(rows: LopHocPhan[], params: HttpParams): LopHocPhan[] {
    const hocKyId = params.get('hoc_ky_id');
    const monHocId = params.get('mon_hoc_id');
    const giangVienId = params.get('giang_vien_id');
    let result = rows;
    if (hocKyId) result = result.filter((row) => row.hoc_ky.id === Number(hocKyId));
    if (monHocId) result = result.filter((row) => row.mon_hoc.id === Number(monHocId));
    if (giangVienId) result = result.filter((row) => row.giang_vien.id === Number(giangVienId));
    result = filterBy(result, params, ['nam_thu', 'trang_thai']);
    if (params.get('con_cho') === 'true') {
      result = result.filter((row) => row.si_so_hien_tai < row.si_so_toi_da);
    }
    return result;
  }

  private tim(id: number): LopHocPhan | undefined {
    return this.lopHocPhan.find((row) => row.id === id && !row.da_xoa);
  }

  private luuLop(body: unknown, id?: number): object {
    const data = this.bodyRecord(body);
    const current = id === undefined ? undefined : this.tim(id);
    if (id !== undefined && !current) return loi('NOT_FOUND', 'Không tìm thấy lớp học phần.');

    const input: LopHocPhanInput = {
      ma_lop_hp: String(data['ma_lop_hp'] ?? '').trim(),
      mon_hoc_id: Number(data['mon_hoc_id']),
      hoc_ky_id: Number(data['hoc_ky_id']),
      giang_vien_id: Number(data['giang_vien_id']),
      si_so_toi_da: Number(data['si_so_toi_da']),
      nam_thu: data['nam_thu'] === null ? null : Number(data['nam_thu']),
      trang_thai: data['trang_thai'] as TrangThaiLopHocPhan,
    };
    const mon = MON_HOC_MOCK.find((row) => row.id === input.mon_hoc_id && row.trang_thai);
    const hocKy = HOC_KY_MOCK.find((row) => row.id === input.hoc_ky_id);
    const giangVien = GIANG_VIEN_MOCK.find(
      (row) => row.id === input.giang_vien_id && row.trang_thai,
    );
    const errors: Record<string, string[]> = {};

    if (!input.ma_lop_hp) errors['ma_lop_hp'] = ['Mã lớp học phần là bắt buộc.'];
    if (!mon) errors['mon_hoc_id'] = ['Môn học không tồn tại hoặc đã bị khóa.'];
    if (!hocKy || hocKy.trang_thai === 'CLOSED') errors['hoc_ky_id'] = ['Học kỳ không hợp lệ.'];
    if (!giangVien) errors['giang_vien_id'] = ['Giảng viên không tồn tại hoặc đã bị khóa.'];
    if (
      !Number.isInteger(input.si_so_toi_da) ||
      input.si_so_toi_da < 1 ||
      input.si_so_toi_da > 500
    ) {
      errors['si_so_toi_da'] = ['Sĩ số tối đa phải từ 1 đến 500.'];
    } else if (current && input.si_so_toi_da < current.si_so_hien_tai) {
      errors['si_so_toi_da'] = ['Sĩ số tối đa không được nhỏ hơn sĩ số hiện tại.'];
    }
    if (
      input.nam_thu !== null &&
      (!Number.isInteger(input.nam_thu) || input.nam_thu < 1 || input.nam_thu > 6)
    ) {
      errors['nam_thu'] = ['Năm thứ phải từ 1 đến 6.'];
    }
    if (!['OPEN', 'CLOSED', 'CANCELLED'].includes(input.trang_thai)) {
      errors['trang_thai'] = ['Trạng thái lớp học phần không hợp lệ.'];
    }
    const duplicate = this.lopHocPhan.some(
      (row) =>
        row.id !== id && row.ma_lop_hp === input.ma_lop_hp && row.hoc_ky.id === input.hoc_ky_id,
    );
    if (duplicate) errors['ma_lop_hp'] = ['Mã lớp đã được sử dụng trong học kỳ này.'];
    if (Object.keys(errors).length) return loiValidation(errors);
    if (!mon || !hocKy || !giangVien) {
      return loiValidation({ data: ['Thông tin môn học, học kỳ hoặc giảng viên không hợp lệ.'] });
    }

    const row: LopHocPhan = {
      id: id ?? Math.max(...this.lopHocPhan.map((item) => item.id), 0) + 1,
      ma_lop_hp: input.ma_lop_hp,
      mon_hoc: {
        id: mon.id,
        ma_mon: mon.ma_mon,
        ten_mon: mon.ten_mon,
        so_tin_chi: mon.so_tin_chi,
      },
      hoc_ky: {
        id: hocKy.id,
        ma_hoc_ky: hocKy.ma_hoc_ky,
        ten_hoc_ky: hocKy.ten_hoc_ky,
        nam_hoc: hocKy.nam_hoc,
        ky_thu: hocKy.ky_thu,
        trang_thai: hocKy.trang_thai,
      },
      giang_vien: { id: giangVien.id, ma_gv: giangVien.ma_gv, ho_ten: giangVien.ho_ten },
      si_so_toi_da: input.si_so_toi_da,
      si_so_hien_tai: current?.si_so_hien_tai ?? 0,
      nam_thu: input.nam_thu,
      trang_thai: current?.trang_thai ?? input.trang_thai,
      da_chot_diem: current?.da_chot_diem ?? false,
      chot_diem_luc: current?.chot_diem_luc ?? null,
      da_xoa: false,
    };

    if (current) {
      this.lopHocPhan[this.lopHocPhan.indexOf(current)] = row;
    } else {
      this.lopHocPhan.push(row);
    }
    return ok(row);
  }

  private sinhVienLop(id: number): SinhVienLop[] {
    const banDau = this.sinhVienLopBanDau(id);
    const themMoi = this.dangKyThem
      .filter((row) => row.lop_hoc_phan_id === id)
      .map((row) => row.sinh_vien);
    return [...banDau, ...themMoi].filter(
      (student) => !this.dangKyDaHuy.has(student.dang_ky_hoc_phan_id),
    );
  }

  private sinhVienLopBanDau(id: number): SinhVienLop[] {
    const start = (id - 1) % SINH_VIEN_MOCK.length;
    return SINH_VIEN_MOCK.slice(start, start + 10)
      .map((student, index) => ({
        id: student.id,
        ma_sv: student.ma_sv,
        ho_ten: student.ho_ten,
        email: student.email,
        lop: student.lop_hanh_chinh?.ma_lop ?? null,
        dang_ky_hoc_phan_id: id * 100 + index + 1,
      }));
  }

  private danhSachDangKy(params: HttpParams, sinhVienId?: number): object {
    let rows = this.lopHocPhan.flatMap((section) =>
      this.tatCaSinhVienLop(section.id).map((student) =>
        this.dangKyTheoDong(section.id, student),
      ),
    );
    if (sinhVienId !== undefined) rows = rows.filter((row) => row.sinh_vien.id === sinhVienId);
    const hocKyId = params.get('hoc_ky_id');
    const sectionId = params.get('lop_hoc_phan_id');
    const studentId = params.get('sinh_vien_id');
    const status = params.get('trang_thai');
    if (hocKyId) rows = rows.filter((row) => row.lop_hoc_phan.hoc_ky?.id === Number(hocKyId));
    if (sectionId) rows = rows.filter((row) => row.lop_hoc_phan.id === Number(sectionId));
    if (studentId) rows = rows.filter((row) => row.sinh_vien.id === Number(studentId));
    if (status) rows = rows.filter((row) => row.trang_thai === status);
    rows = searchBy(rows, params.get('q'), [
      'sinh_vien.ma_sv',
      'sinh_vien.ho_ten',
      'lop_hoc_phan.ma_lop_hp',
      'lop_hoc_phan.mon_hoc',
    ]);
    rows = sortBy(rows, params, 'dang_ky_luc');
    return paginate(rows, params, '/api/enrollments');
  }

  private tatCaSinhVienLop(id: number): SinhVienLop[] {
    return [
      ...this.sinhVienLopBanDau(id),
      ...this.dangKyThem
        .filter((row) => row.lop_hoc_phan_id === id)
        .map((row) => row.sinh_vien),
    ];
  }

  private dangKyTheoDong(sectionId: number, student: SinhVienLop): DangKyHocPhan {
    const cached = this.lichSuDangKy.get(student.dang_ky_hoc_phan_id);
    if (cached) {
      return {
        ...cached,
        trang_thai: this.dangKyDaHuy.has(cached.id) ? 'CANCELLED' : 'ACTIVE',
        huy_luc: this.dangKyDaHuy.has(cached.id) ? cached.huy_luc : null,
      };
    }

    const section = this.lopHocPhan.find((row) => row.id === sectionId)!;
    const studentRecord = SINH_VIEN_MOCK.find((row) => row.id === student.id);
    const enrollment: DangKyHocPhan = {
      id: student.dang_ky_hoc_phan_id,
      sinh_vien: { id: student.id, ma_sv: student.ma_sv, ho_ten: student.ho_ten },
      lop_hoc_phan: {
        id: section.id,
        ma_lop_hp: section.ma_lop_hp,
        mon_hoc: section.mon_hoc.ten_mon,
        hoc_ky: {
          id: section.hoc_ky.id,
          ma_hoc_ky: section.hoc_ky.ma_hoc_ky,
          ten_hoc_ky: section.hoc_ky.ten_hoc_ky,
        },
      },
      trang_thai: this.dangKyDaHuy.has(student.dang_ky_hoc_phan_id) ? 'CANCELLED' : 'ACTIVE',
      dang_ky_boi: { id: 1, name: 'Quản trị viên' },
      dang_ky_luc: '2026-08-20 09:00:00',
      huy_boi: null,
      huy_luc: this.dangKyDaHuy.has(student.dang_ky_hoc_phan_id)
        ? '2026-08-25 10:00:00'
        : null,
    };
    if (studentRecord?.id === 1) this.lichSuDangKy.set(enrollment.id, enrollment);
    return enrollment;
  }

  private taoDangKy(sinhVienId: number, sectionId: number, vaiTro: string | null): object {
    const student = SINH_VIEN_MOCK.find((row) => row.id === sinhVienId && !row.da_xoa);
    if (!student) return loi('NOT_FOUND', 'Không tìm thấy sinh viên.');
    if (!student.trang_thai) return loi('STUDENT_INACTIVE', 'Sinh viên không hoạt động.');

    const section = this.tim(sectionId);
    if (!section) return loi('NOT_FOUND', 'Không tìm thấy lớp học phần.');
    if (section.trang_thai !== 'OPEN') return loi('SECTION_NOT_OPEN', 'Lớp không nhận đăng ký.');
    if (section.hoc_ky.trang_thai === 'CLOSED') {
      return loi('SEMESTER_CLOSED', 'Học kỳ đã đóng.');
    }
    if (vaiTro === 'SINH_VIEN' && !this.dangTrongDotDangKy(section.hoc_ky.id)) {
      return loi('OUTSIDE_REGISTRATION', 'Ngoài thời gian đăng ký của học kỳ.');
    }
    if (section.si_so_hien_tai >= section.si_so_toi_da) {
      return loi('SECTION_FULL', 'Lớp học phần đã đủ sĩ số.');
    }

    const enrollments = this.tatCaSinhVienLop(sectionId);
    const existing = enrollments.find((row) => row.id === sinhVienId);
    const oldEnrollment = existing
      ? this.dangKyTheoDong(sectionId, existing)
      : undefined;
    if (oldEnrollment?.trang_thai === 'ACTIVE') {
      return loi('DUPLICATE_ENROLLMENT', 'Đã đăng ký lớp học phần này.');
    }
    const sameSubject = this.lopHocPhan.some(
      (other) =>
        other.id !== sectionId &&
        other.hoc_ky.id === section.hoc_ky.id &&
        other.mon_hoc.id === section.mon_hoc.id &&
        this.tatCaSinhVienLop(other.id).some(
          (row) =>
            row.id === sinhVienId && !this.dangKyDaHuy.has(row.dang_ky_hoc_phan_id),
        ),
    );
    if (sameSubject) {
      return loi('DUPLICATE_SUBJECT_IN_SEMESTER', 'Đã đăng ký lớp khác cùng môn trong học kỳ.');
    }

    if (oldEnrollment) {
      this.dangKyDaHuy.delete(oldEnrollment.id);
      oldEnrollment.trang_thai = 'ACTIVE';
      oldEnrollment.dang_ky_luc = new Date().toISOString().replace('T', ' ').slice(0, 19);
      oldEnrollment.huy_luc = null;
      this.lichSuDangKy.set(oldEnrollment.id, oldEnrollment);
      section.si_so_hien_tai += 1;
      return ok(oldEnrollment, 'Đã đăng ký học phần.');
    }

    const id = Math.max(
      0,
      ...this.lopHocPhan.flatMap((row) =>
        this.tatCaSinhVienLop(row.id).map((item) => item.dang_ky_hoc_phan_id),
      ),
    ) + 1;
    const studentRow: SinhVienLop = {
      id: student.id,
      ma_sv: student.ma_sv,
      ho_ten: student.ho_ten,
      email: student.email,
      lop: student.lop_hanh_chinh?.ma_lop ?? null,
      dang_ky_hoc_phan_id: id,
    };
    this.dangKyThem.push({ lop_hoc_phan_id: sectionId, sinh_vien: studentRow });
    section.si_so_hien_tai += 1;
    const enrollment = this.dangKyTheoDong(sectionId, studentRow);
    enrollment.dang_ky_boi = {
      id: vaiTro === 'SINH_VIEN' ? 3 : 1,
      name: vaiTro === 'SINH_VIEN' ? student.ho_ten : 'Quản trị viên',
    };
    enrollment.dang_ky_luc = new Date().toISOString().replace('T', ' ').slice(0, 19);
    this.lichSuDangKy.set(enrollment.id, enrollment);
    return ok(enrollment, 'Đã đăng ký học phần.');
  }

  private dangKyHangLoat(body: unknown): object {
    const data = this.bodyRecord(body);
    const sectionId = Number(data['lop_hoc_phan_id']);
    const section = this.tim(sectionId);
    if (!section) return loiValidation({ lop_hoc_phan_id: ['Lớp học phần không hợp lệ.'] });

    let studentIds: number[];
    if (Array.isArray(data['sinh_vien_ids'])) {
      studentIds = data['sinh_vien_ids'].map(Number);
    } else if (data['lop_hanh_chinh_id'] !== undefined) {
      const classId = Number(data['lop_hanh_chinh_id']);
      if (!LOP_HANH_CHINH_MOCK.some((row) => row.id === classId && !row.da_xoa)) {
        return loiValidation({ lop_hanh_chinh_id: ['Lớp hành chính không hợp lệ.'] });
      }
      studentIds = SINH_VIEN_MOCK.filter(
        (row) =>
          row.lop_hanh_chinh?.id === classId && row.trang_thai && !row.da_xoa,
      ).map((row) => row.id);
    } else {
      return loiValidation({
        sinh_vien_ids: ['Cần chọn sinh viên hoặc lớp hành chính để đăng ký hàng loạt.'],
      });
    }

    const chiTiet: KetQuaDangKyDong[] = studentIds.map((studentId) => {
      const student = SINH_VIEN_MOCK.find((row) => row.id === studentId);
      const result = this.taoDangKy(studentId, sectionId, 'ADMIN') as {
        success: boolean;
        data?: DangKyHocPhan;
        ma_loi?: string;
        message?: string;
      };
      return {
        sinh_vien_id: studentId,
        ma_sv: student?.ma_sv ?? '',
        ket_qua: result.success ? 'THANH_CONG' : 'THAT_BAI',
        ...(!result.success
          ? { ma_loi: result.ma_loi, message: result.message }
          : {}),
      };
    });
    const thanhCong = chiTiet.filter((row) => row.ket_qua === 'THANH_CONG').length;
    return ok(
      {
        thanh_cong: thanhCong,
        that_bai: chiTiet.length - thanhCong,
        chi_tiet: chiTiet,
      },
      `Đã xử lý ${chiTiet.length} sinh viên.`,
    );
  }

  private huyDangKy(id: number, vaiTro: string | null): object {
    const row = this.tatCaDangKy().find((item) => item.id === id);
    if (!row || row.trang_thai !== 'ACTIVE') {
      return loi('NOT_FOUND', 'Không tìm thấy đăng ký đang hiệu lực.');
    }
    if (vaiTro === 'SINH_VIEN' && row.sinh_vien.id !== 1) {
      return loi('FORBIDDEN', 'Bạn không có quyền hủy đăng ký của sinh viên khác.');
    }
    const section = this.tim(row.lop_hoc_phan.id);
    if (!section) return loi('NOT_FOUND', 'Không tìm thấy lớp học phần.');
    if (vaiTro === 'SINH_VIEN' && !this.dangTrongDotDangKy(section.hoc_ky.id)) {
      return loi('OUTSIDE_REGISTRATION', 'Ngoài thời gian đăng ký của học kỳ.');
    }
    this.dangKyDaHuy.add(id);
    section.si_so_hien_tai = Math.max(0, section.si_so_hien_tai - 1);
    const updated = {
      ...row,
      trang_thai: 'CANCELLED' as const,
      huy_boi: { id: vaiTro === 'SINH_VIEN' ? 3 : 1, name: 'Người dùng hiện tại' },
      huy_luc: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    this.lichSuDangKy.set(id, updated);
    return ok(null, 'Đã hủy đăng ký học phần.');
  }

  private tatCaDangKy(): DangKyHocPhan[] {
    return this.lopHocPhan.flatMap((section) =>
      this.tatCaSinhVienLop(section.id).map((student) =>
        this.dangKyTheoDong(section.id, student),
      ),
    );
  }

  private dangTrongDotDangKy(hocKyId: number): boolean {
    const semester = HOC_KY_MOCK.find((row) => row.id === hocKyId);
    if (!semester) return false;
    const now = new Date();
    const opens = new Date(semester.mo_dang_ky_luc.replace(' ', 'T'));
    const closes = new Date(semester.dong_dang_ky_luc.replace(' ', 'T'));
    return now >= opens && now <= closes && semester.dang_mo_dang_ky;
  }

  private diemLop(id: number): DongDiem[] {
    return this.sinhVienLop(id).map((student, index) => {
      const diemChuyenCan = 7 + (index % 3);
      const diemGiuaKy = 6 + (index % 4);
      const diemCuoiKy = 6.5 + (index % 4) * 0.5;
      const ketQua = this.tinhKetQuaDiem(id, diemChuyenCan, diemGiuaKy, diemCuoiKy);
      return {
        dang_ky_hoc_phan_id: student.dang_ky_hoc_phan_id,
        sinh_vien: student,
        diem_chuyen_can: diemChuyenCan,
        diem_giua_ky: diemGiuaKy,
        diem_cuoi_ky: diemCuoiKy,
        ...ketQua,
      };
    });
  }

  private bangDiemSinhVien() {
    const hocKy = this.lopHocPhan[0]?.hoc_ky;
    const lopCungKy = this.lopHocPhan.filter((lop) => lop.hoc_ky.id === hocKy?.id).slice(0, 5);
    const monHoc = lopCungKy.flatMap((lop) => {
      const row = this.diemDaLuu.get(lop.id)?.[0] ?? this.diemLop(lop.id)[0];
      if (!row) return [];
      return [
        {
          ma_mon: lop.mon_hoc.ma_mon,
          ten_mon: lop.mon_hoc.ten_mon,
          so_tin_chi: lop.mon_hoc.so_tin_chi,
          diem_chuyen_can: row.diem_chuyen_can,
          diem_giua_ky: row.diem_giua_ky,
          diem_cuoi_ky: row.diem_cuoi_ky,
          diem_tong_ket: row.diem_tong_ket,
          diem_chu: row.diem_chu,
          diem_he_4: row.diem_he_4,
          ket_qua:
            row.diem_tong_ket === null ? null : row.diem_tong_ket >= 4 ? 'DAT' : 'KHONG_DAT',
        },
      ];
    });
    const tongTinChi = monHoc.reduce((sum, mon) => sum + mon.so_tin_chi, 0);
    const gpaHe10 =
      tongTinChi > 0
        ? Number(
            (
              monHoc.reduce((sum, mon) => sum + (mon.diem_tong_ket ?? 0) * mon.so_tin_chi, 0) /
              tongTinChi
            ).toFixed(2),
          )
        : null;
    const gpaHe4 =
      tongTinChi > 0
        ? Number(
            (
              monHoc.reduce((sum, mon) => sum + (mon.diem_he_4 ?? 0) * mon.so_tin_chi, 0) /
              tongTinChi
            ).toFixed(2),
          )
        : null;

    return {
      hoc_ky: hocKy
        ? {
            id: hocKy.id,
            ma_hoc_ky: hocKy.ma_hoc_ky,
            ten_hoc_ky: hocKy.ten_hoc_ky,
          }
        : { id: 1, ma_hoc_ky: 'DEMO-1', ten_hoc_ky: 'Học kỳ demo' },
      mon_hoc: monHoc,
      gpa_he_10: gpaHe10,
      gpa_he_4: gpaHe4,
      tong_tin_chi: tongTinChi,
    };
  }

  private tongQuanGpa() {
    const bangDiem = this.bangDiemSinhVien();
    return {
      hoc_ky_hien_tai: {
        ...bangDiem.hoc_ky,
        gpa_he_10: bangDiem.gpa_he_10,
        gpa_he_4: bangDiem.gpa_he_4,
        tong_tin_chi: bangDiem.tong_tin_chi,
      },
      tich_luy: {
        gpa_he_10: 7.42,
        gpa_he_4: 2.87,
        tong_tin_chi: 96,
        tin_chi_dat: 88,
        so_hoc_ky_da_tinh: 5,
      },
    };
  }

  private capNhatBangDiem(
    id: number,
    submissions: unknown[],
    lyDo: string | null = null,
    nguoiSua = 'Giảng viên demo',
  ): { ok: true; rows: DongDiem[] } | { ok: false; errors: Record<string, string[]> } {
    const current = this.diemDaLuu.get(id) ?? this.diemLop(id);
    const indexById = new Map(current.map((row, index) => [row.dang_ky_hoc_phan_id, index]));
    const rows = [...current];
    const errors: Record<string, string[]> = {};
    const seenIds = new Set<number>();

    submissions.forEach((entry, index) => {
      const submission = this.bodyRecord(entry) as Partial<DiemNhap>;
      const enrollmentId = Number(submission.dang_ky_hoc_phan_id);
      const rowIndex = indexById.get(enrollmentId);
      const row = rowIndex === undefined ? undefined : rows[rowIndex];
      const fields = [submission.diem_chuyen_can, submission.diem_giua_ky, submission.diem_cuoi_ky];
      if (!row) errors[`diem.${index}.dang_ky_hoc_phan_id`] = ['Đăng ký không thuộc lớp này.'];
      if (seenIds.has(enrollmentId)) {
        errors[`diem.${index}.dang_ky_hoc_phan_id`] = ['Đăng ký bị lặp trong danh sách điểm.'];
      }
      seenIds.add(enrollmentId);
      if (
        fields.some(
          (score) =>
            score !== null &&
            (typeof score !== 'number' ||
              !Number.isFinite(score) ||
              score < 0 ||
              score > 10 ||
              Math.abs(score * 100 - Math.round(score * 100)) > 1e-8),
        )
      ) {
        errors[`diem.${index}`] = ['Điểm phải từ 0 đến 10 và tối đa 2 chữ số thập phân.'];
      }
      if (
        !row ||
        rowIndex === undefined ||
        Object.keys(errors).some((key) => key.startsWith(`diem.${index}`))
      ) {
        return;
      }
      if (
        row.diem_chuyen_can === submission.diem_chuyen_can &&
        row.diem_giua_ky === submission.diem_giua_ky &&
        row.diem_cuoi_ky === submission.diem_cuoi_ky
      ) {
        return;
      }

      const updated: DongDiem = {
        ...row,
        diem_chuyen_can: submission.diem_chuyen_can ?? null,
        diem_giua_ky: submission.diem_giua_ky ?? null,
        diem_cuoi_ky: submission.diem_cuoi_ky ?? null,
        diem_tong_ket: null,
        diem_chu: null,
        xep_loai: null,
        diem_he_4: null,
      };
      if (
        updated.diem_chuyen_can !== null &&
        updated.diem_giua_ky !== null &&
        updated.diem_cuoi_ky !== null
      ) {
        Object.assign(
          updated,
          this.tinhKetQuaDiem(
            id,
            updated.diem_chuyen_can,
            updated.diem_giua_ky,
            updated.diem_cuoi_ky,
          ),
        );
      }
      for (const field of ['diem_chuyen_can', 'diem_giua_ky', 'diem_cuoi_ky'] as const) {
        if (row[field] === updated[field]) continue;
        const history = this.lichSuDiem.get(enrollmentId) ?? [];
        history.unshift({
          id: this.soLichSu++,
          truong: field,
          gia_tri_cu: row[field] === null ? null : String(row[field]),
          gia_tri_moi: updated[field] === null ? null : String(updated[field]),
          nguoi_sua: nguoiSua,
          ly_do: lyDo,
          thoi_diem: new Date().toISOString(),
        });
        this.lichSuDiem.set(enrollmentId, history);
      }
      rows[rowIndex] = updated;
    });

    return Object.keys(errors).length ? { ok: false, errors } : { ok: true, rows };
  }

  private tinhKetQuaDiem(
    lopHocPhanId: number,
    diemChuyenCan: number,
    diemGiuaKy: number,
    diemCuoiKy: number,
  ): Pick<DongDiem, 'diem_tong_ket' | 'diem_chu' | 'xep_loai' | 'diem_he_4'> {
    const hocKyId = this.tim(lopHocPhanId)?.hoc_ky.id;
    const config = this.system.layCauHinhDiem(hocKyId);
    const weights = config['diem.trong_so'];
    const total =
      diemChuyenCan * weights.chuyen_can +
      diemGiuaKy * weights.giua_ky +
      diemCuoiKy * weights.cuoi_ky;
    const tongKet = Math.round((total + Number.EPSILON) * 100) / 100;
    const range = config['diem.bang_quy_doi'].find(
      (row) => tongKet >= row.tu && tongKet <= row.den,
    );

    if (!range) throw new Error('Bảng quy đổi điểm mock không bao phủ điểm tổng kết.');

    return {
      diem_tong_ket: tongKet,
      diem_chu: range.chu,
      xep_loai: range.xep_loai,
      diem_he_4: range.he_4,
    };
  }

  private bodyRecord(body: unknown): Record<string, unknown> {
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  }
}
