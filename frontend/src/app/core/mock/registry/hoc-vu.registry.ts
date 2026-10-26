import { HttpParams } from '@angular/common/http';
import { DASHBOARD_ADMIN_MOCK } from '@core/mock/data/dashboard.mock';
import { LOP_HOC_PHAN_MOCK } from '@core/mock/data/hoc-vu.mock';
import {
  GIANG_VIEN_MOCK,
  HOC_KY_MOCK,
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
import type {
  DiemNhap,
  DongDiem,
  LopHocPhanInput,
  SinhVienLop,
} from '@core/services/lop-hoc-phan.service';

/**
 * Mock cho nhóm HỌC VỤ — thuộc Đạt.
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
  private readonly dangKyDaHuy = new Set<number>();

  resolve(
    method: string,
    path: string,
    params: HttpParams,
    body: unknown = null,
  ): object | undefined {
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
      const diem = this.bodyRecord(body)['diem'];
      if (!Array.isArray(diem)) return loiValidation({ diem: ['Danh sách điểm không hợp lệ.'] });
      const capNhat = this.capNhatBangDiem(id, diem);
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
    const start = (id - 1) % SINH_VIEN_MOCK.length;
    return SINH_VIEN_MOCK.slice(start, start + 10)
      .map((student, index) => ({
        id: student.id,
        ma_sv: student.ma_sv,
        ho_ten: student.ho_ten,
        email: student.email,
        lop: student.lop_hanh_chinh?.ma_lop ?? null,
        dang_ky_hoc_phan_id: id * 100 + index + 1,
      }))
      .filter((student) => !this.dangKyDaHuy.has(student.dang_ky_hoc_phan_id));
  }

  private diemLop(id: number): DongDiem[] {
    return this.sinhVienLop(id).map((student, index) => {
      const diemChuyenCan = 7 + (index % 3);
      const diemGiuaKy = 6 + (index % 4);
      const diemCuoiKy = 6.5 + (index % 4) * 0.5;
      const tongKet = Number(
        (diemChuyenCan * 0.25 + diemGiuaKy * 0.25 + diemCuoiKy * 0.5).toFixed(2),
      );
      return {
        dang_ky_hoc_phan_id: student.dang_ky_hoc_phan_id,
        sinh_vien: student,
        diem_chuyen_can: diemChuyenCan,
        diem_giua_ky: diemGiuaKy,
        diem_cuoi_ky: diemCuoiKy,
        diem_tong_ket: tongKet,
        diem_chu:
          tongKet >= 8.5
            ? 'A'
            : tongKet >= 7
              ? 'B'
              : tongKet >= 5.5
                ? 'C'
                : tongKet >= 4
                  ? 'D'
                  : 'F',
        diem_he_4:
          tongKet >= 8.5 ? 4 : tongKet >= 7 ? 3 : tongKet >= 5.5 ? 2 : tongKet >= 4 ? 1 : 0,
      };
    });
  }

  private capNhatBangDiem(
    id: number,
    submissions: unknown[],
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

      const updated: DongDiem = {
        ...row,
        diem_chuyen_can: submission.diem_chuyen_can ?? null,
        diem_giua_ky: submission.diem_giua_ky ?? null,
        diem_cuoi_ky: submission.diem_cuoi_ky ?? null,
        diem_tong_ket: null,
        diem_chu: null,
        diem_he_4: null,
      };
      if (
        updated.diem_chuyen_can !== null &&
        updated.diem_giua_ky !== null &&
        updated.diem_cuoi_ky !== null
      ) {
        const total = Number(
          (
            updated.diem_chuyen_can * 0.25 +
            updated.diem_giua_ky * 0.25 +
            updated.diem_cuoi_ky * 0.5
          ).toFixed(2),
        );
        updated.diem_tong_ket = total;
        updated.diem_chu =
          total >= 8.5 ? 'A' : total >= 7 ? 'B' : total >= 5.5 ? 'C' : total >= 4 ? 'D' : 'F';
        updated.diem_he_4 =
          total >= 8.5 ? 4 : total >= 7 ? 3 : total >= 5.5 ? 2 : total >= 4 ? 1 : 0;
      }
      rows[rowIndex] = updated;
    });

    return Object.keys(errors).length ? { ok: false, errors } : { ok: true, rows };
  }

  private bodyRecord(body: unknown): Record<string, unknown> {
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  }
}
