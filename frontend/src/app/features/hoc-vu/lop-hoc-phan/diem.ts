import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { DongDiem, LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { chuanHoaTimKiem } from '@core/utils/chuan-hoa-tim-kiem';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { PageHeader } from '@shared/ui/page-header';
import { SearchInput } from '@shared/ui/search-input';
import { DiemService, LichSuDiem } from '../diem/diem.service';

@Component({
  selector: 'app-lop-hoc-phan-diem',
  standalone: true,
  imports: [FormsModule, RouterLink, AppAlert, AppButton, PageHeader, SearchInput],
  template: `
    <app-page-header
      [title]="lop() ? 'Bảng điểm ' + lop()!.ma_lop_hp : 'Bảng điểm lớp'"
      [description]="lop() ? lop()!.mon_hoc.ten_mon + ' · ' + lop()!.hoc_ky.ten_hoc_ky : 'Nhập và theo dõi điểm học phần.'"
    >
      <a class="back" [routerLink]="['/lop-hoc-phan', id]">
        <span class="material-icons" aria-hidden="true">arrow_back</span>
        Quay lại lớp học phần
      </a>
    </app-page-header>
    @if (loi()) {
      <app-alert muc="danger">{{ loi() }}</app-alert>
    }
    @if (dangTai()) {
      <p class="loading" role="status">Đang tải bảng điểm…</p>
    } @else if (diem().length) {
      <section class="loc">
        <app-search-input
          class="tim"
          placeholder="Tìm theo mã SV hoặc họ tên…"
          (valueChange)="tuKhoa.set($event)"
        />
        @if (tuKhoa()) {
          <span class="dem">Khớp {{ diemHienThi().length }}/{{ diem().length }} sinh viên</span>
        }
      </section>
      <section class="toolbar">
        <span>
          {{
            daChot()
              ? 'Điểm đã chốt'
              : chiDoc()
                ? 'Chế độ chỉ xem'
                : 'Trọng số: chuyên cần 25%, giữa kỳ 25%, cuối kỳ 50%'
          }}
        </span>
        <div>
          @if (!chiDoc()) {
            <label class="ly-do">
              <span>Lý do cập nhật (không bắt buộc)</span>
              <input
                type="text"
                maxlength="500"
                [value]="lyDo()"
                (input)="doiLyDo($event)"
              />
            </label>
            <app-button variant="secondary" size="sm" (click)="tai()">Tải lại</app-button>
            <app-button
              variant="secondary"
              size="sm"
              (click)="luu()"
              [disabled]="!hopLe() || dangLuu()"
              [loading]="dangLuu()"
              >Lưu điểm</app-button
            >
            <app-button
              variant="primary"
              size="sm"
              (click)="chot()"
              [disabled]="!duDiem() || dangLuu()"
              [loading]="dangLuu()"
              >Chốt điểm</app-button
            >
          }
        </div>
      </section>
      @if (diemHienThi().length) {
        <div class="bang">
          <table>
            <thead>
              <tr>
                <th>Mã SV</th>
                <th>Họ và tên</th>
                <th>Chuyên cần</th>
                <th>Giữa kỳ</th>
                <th>Cuối kỳ</th>
                <th>Tổng kết</th>
                <th>Điểm chữ</th>
                <th>Hệ 4</th>
                <th>Kết quả</th>
                <th>Lịch sử</th>
              </tr>
            </thead>
            <tbody>
              @for (row of diemHienThi(); track row.dang_ky_hoc_phan_id) {
                <tr>
                  <td>{{ row.sinh_vien.ma_sv }}</td>
                  <td>{{ row.sinh_vien.ho_ten }}</td>
                  <td>
                    <input
                      aria-label="Điểm chuyên cần"
                      type="number"
                      min="0"
                      max="10"
                      step=".01"
                      [disabled]="chiDoc()"
                      [(ngModel)]="row.diem_chuyen_can"
                    />
                  </td>
                  <td>
                    <input
                      aria-label="Điểm giữa kỳ"
                      type="number"
                      min="0"
                      max="10"
                      step=".01"
                      [disabled]="chiDoc()"
                      [(ngModel)]="row.diem_giua_ky"
                    />
                  </td>
                  <td>
                    <input
                      aria-label="Điểm cuối kỳ"
                      type="number"
                      min="0"
                      max="10"
                      step=".01"
                      [disabled]="chiDoc()"
                      [(ngModel)]="row.diem_cuoi_ky"
                    />
                  </td>
                  <td>
                    <strong>{{ tong(row) }}</strong>
                  </td>
                  <td>
                    <span class="badge">{{ chu(row) }}</span>
                  </td>
                  <td>{{ he4(row) }}</td>
                  <td>
                    @if (tongSo(row) === null) {
                      <span class="chua-co-diem">Chưa đủ điểm</span>
                    } @else {
                      <span class="ket-qua" [class.dat]="tongSo(row)! >= 4">
                        {{ tongSo(row)! >= 4 ? 'Đạt' : 'Không đạt' }}
                      </span>
                    }
                  </td>
                  <td>
                    <button
                      type="button"
                      class="nut-lich-su"
                      [routerLink]="['/lop-hoc-phan', id, 'diem', 'lich-su']"
                      [queryParams]="{ dang_ky_hoc_phan_id: row.dang_ky_hoc_phan_id }"
                    >
                      <span class="material-icons" aria-hidden="true">history</span>
                      Xem
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <p class="empty">Không có sinh viên nào khớp "{{ tuKhoa() }}".</p>
      }
    } @else {
      <p class="empty">Lớp học phần chưa có sinh viên đăng ký.</p>
    }

    @if (dangMoLichSu()) {
      <div class="nen-dialog" (click)="dongLichSu()">
        <section
          class="dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tieu-de-lich-su"
          (click)="$event.stopPropagation()"
        >
          <div class="dau-dialog">
            <div>
              <p class="nhan-muc">SCR-43</p>
              <h2 id="tieu-de-lich-su">Lịch sử sửa điểm</h2>
            </div>
            <button type="button" class="nut-dong" aria-label="Đóng lịch sử" (click)="dongLichSu()">
              <span class="material-icons" aria-hidden="true">close</span>
            </button>
          </div>

          @if (loiLichSu()) {
            <app-alert muc="danger" title="Không tải được lịch sử">{{ loiLichSu() }}</app-alert>
          } @else if (dangTaiLichSu()) {
            <p class="loading" role="status">Đang tải lịch sử điểm…</p>
          } @else if (lichSu().length) {
            <div class="lich-su-cuon">
              <table>
                <thead>
                  <tr>
                    <th>Thời điểm</th>
                    <th>Trường điểm</th>
                    <th>Giá trị cũ</th>
                    <th>Giá trị mới</th>
                    <th>Người sửa</th>
                    <th>Lý do</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of lichSu(); track item.id) {
                    <tr>
                      <td>{{ hienThoiDiem(item.thoi_diem) }}</td>
                      <td>{{ nhanTruong(item.truong) }}</td>
                      <td>{{ item.gia_tri_cu ?? '—' }}</td>
                      <td>{{ item.gia_tri_moi ?? '—' }}</td>
                      <td>{{ item.nguoi_sua || '—' }}</td>
                      <td>{{ item.ly_do || 'Không ghi lý do' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="empty">Chưa có lịch sử thay đổi điểm cho sinh viên này.</p>
          }
        </section>
      </div>
    }
  `,
  styles: `
    .back {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--color-primary);
      font-weight: 600;
      text-decoration: none;
    }
    .back .material-icons {
      font-size: 18px;
    }
    .loc {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    /* Ô tìm kiếm không giãn hết hàng: bảng điểm là màn nhập liệu, chỗ đó để cho bảng. */
    .loc .tim {
      flex: 1 1 260px;
      max-width: 340px;
    }
    .dem {
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      padding: 12px 16px;
      margin-bottom: 12px;
      border-radius: var(--radius);
      background: var(--color-primary-soft);
      font-size: var(--text-small);
      font-weight: 600;
    }
    .toolbar div {
      display: flex;
      align-items: end;
      gap: 8px;
      flex-wrap: wrap;
    }
    .ly-do {
      display: grid;
      gap: 4px;
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }
    .ly-do input {
      width: min(250px, 100%);
      min-height: 34px;
      padding: 6px 8px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      color: var(--color-ink);
      font: inherit;
    }
    .bang {
      overflow: auto;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 980px;
      font-size: var(--text-small);
    }
    th {
      text-align: left;
      padding: 11px 14px;
      background: var(--color-surface-alt);
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }
    td {
      padding: 10px 14px;
      border-top: 1px solid var(--color-border-soft);
    }
    input {
      width: 70px;
      padding: 7px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font: inherit;
    }
    input:disabled {
      background: var(--color-surface-alt);
      color: var(--color-ink-muted);
    }
    .badge {
      padding: 3px 8px;
      border-radius: 999px;
      background: var(--color-primary-soft);
      color: var(--color-primary);
      font-weight: 700;
    }
    .ket-qua {
      color: var(--color-danger);
      font-weight: 650;
    }
    .ket-qua.dat {
      color: var(--color-success);
    }
    .chua-co-diem {
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }
    .nut-lich-su,
    .nut-dong {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      min-height: 34px;
      padding: 5px 8px;
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-primary);
      font: 600 var(--text-caption) var(--font-body);
      cursor: pointer;
    }
    .nut-lich-su:hover,
    .nut-dong:hover {
      background: var(--color-primary-soft);
    }
    .nut-lich-su:focus-visible,
    .nut-dong:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
    .nut-lich-su .material-icons,
    .nut-dong .material-icons {
      font-size: 18px;
    }
    .nen-dialog {
      position: fixed;
      z-index: 1000;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 20px;
      background: rgb(15 23 42 / 55%);
    }
    .dialog {
      width: min(100%, 980px);
      max-height: min(85vh, 720px);
      overflow: auto;
      padding: 20px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-lg);
    }
    .dau-dialog {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }
    .nhan-muc {
      margin: 0 0 4px;
      color: var(--color-primary);
      font-size: var(--text-caption);
      font-weight: 700;
    }
    .dau-dialog h2 {
      margin: 0;
      color: var(--color-ink);
      font-size: var(--text-h3);
    }
    .nut-dong {
      width: 40px;
      height: 40px;
      color: var(--color-ink-muted);
    }
    .lich-su-cuon {
      overflow: auto;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
    }
    .lich-su-cuon table {
      min-width: 760px;
    }
    .loading,
    .empty {
      color: var(--color-ink-muted);
    }
  `,
})
export class LopHocPhanDiem {
  private readonly service = inject(LopHocPhanService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly diemService = inject(DiemService);
  readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly lop = signal<import('@core/models/dao-tao.model').LopHocPhan | null>(null);
  readonly diem = signal<DongDiem[]>([]);
  readonly tuKhoa = signal('');
  readonly loi = signal('');
  readonly lyDo = signal('');
  readonly dangTai = signal(true);
  readonly dangLuu = signal(false);
  readonly daChot = signal(false);
  readonly dangMoLichSu = signal(false);
  readonly dangTaiLichSu = signal(false);
  readonly loiLichSu = signal('');
  readonly lichSu = signal<LichSuDiem[]>([]);
  readonly laGiangVien = computed(() => this.auth.nguoiDung()?.vai_tro === 'GIANG_VIEN');
  readonly chiDoc = computed(
    () =>
      !this.laGiangVien() ||
      this.daChot() ||
      this.lop()?.hoc_ky.trang_thai === 'CLOSED',
  );
  readonly hopLe = computed(() => this.diem().every((row) => this.diemHopLe(row)));
  readonly duDiem = computed(
    () => this.hopLe() && this.diem().length > 0 && this.diem().every((row) => this.diemDayDu(row)),
  );

  /**
   * Chỉ ảnh hưởng phần HIỂN THỊ. `hopLe`, `duDiem`, `luu`, `chot` vẫn đọc `diem()`
   * đầy đủ — chốt điểm phải kiểm tra cả lớp, không phải mỗi trang đang nhìn thấy.
   */
  readonly diemHienThi = computed(() => {
    const tuKhoa = chuanHoaTimKiem(this.tuKhoa());

    if (tuKhoa === '') {
      return this.diem();
    }

    return this.diem().filter((row) =>
      chuanHoaTimKiem(`${row.sinh_vien.ma_sv} ${row.sinh_vien.ho_ten}`).includes(tuKhoa),
    );
  });

  constructor() {
    this.tai();
    const rawEnrollmentId = this.route.snapshot.queryParamMap.get('dang_ky_hoc_phan_id');
    if (this.route.snapshot.routeConfig?.path?.endsWith('/lich-su')) {
      this.dangMoLichSu.set(true);
      const enrollmentId = Number(rawEnrollmentId);
      if (rawEnrollmentId && Number.isInteger(enrollmentId) && enrollmentId > 0) {
        this.taiLichSu(enrollmentId);
      } else {
        this.loiLichSu.set('Thiếu mã đăng ký học phần để xem lịch sử.');
      }
    }
  }

  tai(): void {
    this.dangTai.set(true);
    this.loi.set('');
    forkJoin({
      lop: this.service.layMot(this.id),
      diem: this.service.layDiem(this.id),
    }).subscribe({
      next: ({ lop, diem }) => {
        this.lop.set(lop);
        this.daChot.set(lop.da_chot_diem);
        this.diem.set(diem);
        this.dangTai.set(false);
      },
      error: (error: unknown) => {
        this.loi.set(
          error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
            ? error.error.message
            : 'Không tải được bảng điểm hoặc thông tin lớp học phần.',
        );
        this.dangTai.set(false);
      },
    });
  }

  tong(row: DongDiem): string {
    const total = this.tinhTong(row);
    return total === null ? '—' : total.toFixed(2);
  }

  chu(row: DongDiem): string {
    const total = this.tinhTong(row);
    if (total === null) return '—';
    return total >= 8.5 ? 'A' : total >= 7 ? 'B' : total >= 5.5 ? 'C' : total >= 4 ? 'D' : 'F';
  }

  tongSo(row: DongDiem): number | null {
    const total = this.tinhTong(row);
    return total;
  }

  he4(row: DongDiem): string {
    const total = this.tinhTong(row);
    if (total === null) return '—';
    return String(total >= 8.5 ? 4 : total >= 7 ? 3 : total >= 5.5 ? 2 : total >= 4 ? 1 : 0);
  }

  doiLyDo(event: Event): void {
    this.lyDo.set((event.target as HTMLInputElement).value);
  }

  luu(): void {
    if (!this.hopLe() || this.chiDoc() || this.dangLuu()) return;
    this.guiDiem();
  }

  chot(): void {
    if (!this.duDiem() || this.chiDoc() || this.dangLuu()) return;
    if (!confirm('Chốt điểm lớp này? Điểm sẽ không còn chỉnh sửa.')) return;

    this.dangLuu.set(true);
    this.loi.set('');
    this.service.capNhatDiem(this.id, this.diem(), this.lyDo().trim() || undefined).subscribe({
      next: (rows) => {
        this.diem.set(rows);
        this.service.chotDiem(this.id).subscribe({
          next: (lop) => {
            this.daChot.set(lop.da_chot_diem);
            this.dangLuu.set(false);
          },
          error: (error: { error?: { message?: string } }) => {
            this.loi.set(error.error?.message ?? 'Không chốt được điểm.');
            this.dangLuu.set(false);
          },
        });
      },
      error: (error: { error?: { message?: string } }) => {
        this.loi.set(error.error?.message ?? 'Không lưu được điểm trước khi chốt.');
        this.dangLuu.set(false);
      },
    });
  }

  private guiDiem(): void {
    this.dangLuu.set(true);
    this.loi.set('');
    this.service.capNhatDiem(this.id, this.diem(), this.lyDo().trim() || undefined).subscribe({
      next: (rows) => {
        this.diem.set(rows);
        this.dangLuu.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.loi.set(error.error?.message ?? 'Không lưu được điểm.');
        this.dangLuu.set(false);
      },
    });
  }

  private diemHopLe(row: DongDiem): boolean {
    return [row.diem_chuyen_can, row.diem_giua_ky, row.diem_cuoi_ky].every(
      (score) =>
        score === null ||
        (Number.isFinite(score) &&
          score >= 0 &&
          score <= 10 &&
          Math.round(score * 100) === score * 100),
    );
  }

  private diemDayDu(row: DongDiem): row is DongDiem & {
    diem_chuyen_can: number;
    diem_giua_ky: number;
    diem_cuoi_ky: number;
  } {
    return [row.diem_chuyen_can, row.diem_giua_ky, row.diem_cuoi_ky].every(
      (score) => score !== null && Number.isFinite(score),
    );
  }

  private tinhTong(row: DongDiem): number | null {
    if (!this.diemDayDu(row)) return null;
    return Number(
      (row.diem_chuyen_can * 0.25 + row.diem_giua_ky * 0.25 + row.diem_cuoi_ky * 0.5).toFixed(2),
    );
  }

  taiLichSu(enrollmentId: number): void {
    this.dangTaiLichSu.set(true);
    this.loiLichSu.set('');
    this.diemService.layLichSu(enrollmentId).subscribe({
      next: (history) => {
        this.lichSu.set(history);
        this.dangTaiLichSu.set(false);
      },
      error: (error: unknown) => {
        this.loiLichSu.set(
          error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
            ? error.error.message
            : 'Không tải được lịch sử sửa điểm.',
        );
        this.dangTaiLichSu.set(false);
      },
    });
  }

  dongLichSu(): void {
    void this.router.navigate(['/lop-hoc-phan', this.id, 'diem']);
  }

  nhanTruong(field: string): string {
    return {
      diem_chuyen_can: 'Chuyên cần',
      diem_giua_ky: 'Giữa kỳ',
      diem_cuoi_ky: 'Cuối kỳ',
      diem_tong_ket: 'Tổng kết',
      diem_chu: 'Điểm chữ',
      diem_he_4: 'Điểm hệ 4',
    }[field] ?? field;
  }

  hienThoiDiem(value: string): string {
    return value.replace('T', ' ').slice(0, 16);
  }
}
