import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LopHocPhanService, TuyChon } from '@core/services/lop-hoc-phan.service';
import { LopHocPhan } from '@core/models/dao-tao.model';
import { DangKyService } from '@features/hoc-vu/dang-ky/dang-ky.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { LoadingState } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';
import { StatusBadge } from '@shared/ui/status-badge';

/**
 * Sinh viên chọn học kỳ rồi đăng ký các lớp đang mở của kỳ đó.
 * Kỳ đã qua thì chỉ xem; backend chặn bằng OUTSIDE_REGISTRATION / SEMESTER_CLOSED.
 */
@Component({
  selector: 'app-dang-ky-hoc-phan',
  standalone: true,
  imports: [FormsModule, AppAlert, AppButton, LoadingState, PageHeader, StatusBadge],
  template: `
    <app-page-header
      title="Đăng ký học phần"
      description="Chọn học kỳ, sau đó đăng ký các lớp đang mở. Học kỳ đã qua chỉ xem lại."
    />

    @if (loi()) {
      <app-alert muc="danger">{{ loi() }}</app-alert>
    }
    @if (thongBao()) {
      <app-alert muc="success">{{ thongBao() }}</app-alert>
    }

    <section class="bo-loc">
      <label>
        <span>Học kỳ</span>
        <select [ngModel]="hocKyId()" (ngModelChange)="chonHocKy($event)">
          @for (k of hocKy(); track k.id) {
            <option [ngValue]="k.id">{{ k.label }}</option>
          }
        </select>
      </label>
      @if (kyDangChon(); as ky) {
        <span class="trang-thai">
          @if (ky.trang_thai === 'UPCOMING') {
            Đang mở đăng ký nếu còn trong đợt
          } @else {
            Học kỳ đã bắt đầu — chỉ xem lại
          }
        </span>
      }
    </section>

    @if (dangTai()) {
      <app-loading-state label="Đang tải lớp học phần…" />
    } @else if (lop().length === 0) {
      <p class="trong">Học kỳ này chưa có lớp đang mở.</p>
    } @else {
      <div class="cuon">
        <table>
          <thead>
            <tr>
              <th>Mã lớp</th>
              <th>Môn học</th>
              <th>Giảng viên</th>
              <th>Năm thứ</th>
              <th>Còn chỗ</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (l of lop(); track l.id) {
              <tr>
                <td>{{ l.ma_lop_hp }}</td>
                <td>{{ l.mon_hoc.ma_mon }} · {{ l.mon_hoc.ten_mon }}</td>
                <td>{{ l.giang_vien.ho_ten }}</td>
                <td>{{ l.nam_thu ? 'Năm ' + l.nam_thu : 'Mọi năm' }}</td>
                <td>{{ conCho(l) }}</td>
                <td><app-status-badge [value]="l.trang_thai" /></td>
                <td class="thao-tac">
                  @if (coTheDangKy(l)) {
                    <app-button variant="primary" (click)="dangKyLop(l)" [loading]="dangGui() === l.id">
                      Đăng ký
                    </app-button>
                  } @else if (daDangKy(l)) {
                    <span class="da-dang-ky">Đã đăng ký</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .bo-loc {
      display: flex;
      align-items: end;
      gap: 14px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
    label {
      display: grid;
      gap: 6px;
      font-size: var(--text-caption);
      font-weight: 600;
      color: var(--color-ink-muted);
    }
    select {
      padding: 9px 10px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font: inherit;
      font-size: var(--text-small);
      background: var(--color-surface);
      color: var(--color-ink);
      min-width: 240px;
    }
    .trang-thai {
      font-size: var(--text-caption);
      color: var(--color-ink-muted);
      padding-bottom: 10px;
    }
    .cuon {
      overflow-x: auto;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--text-small);
    }
    th,
    td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid var(--color-border);
      white-space: nowrap;
    }
    th {
      font-size: var(--text-caption);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-ink-muted);
    }
    tr:last-child td {
      border-bottom: 0;
    }
    .thao-tac {
      text-align: right;
    }
    .da-dang-ky {
      font-size: var(--text-caption);
      color: var(--color-success, #1b7f4b);
      font-weight: 600;
    }
    .trong {
      padding: 24px;
      text-align: center;
      color: var(--color-ink-muted);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius);
    }
  `,
})
export class DangKyHocPhanSinhVien {
  private readonly lopHocPhan = inject(LopHocPhanService);
  private readonly dangKy = inject(DangKyService);

  readonly hocKy = signal<(TuyChon & { trang_thai?: string })[]>([]);
  readonly hocKyId = signal(0);
  readonly lop = signal<LopHocPhan[]>([]);
  readonly dangTai = signal(true);
  readonly dangGui = signal(0);
  readonly loi = signal('');
  readonly thongBao = signal('');
  readonly daDangKyIds = signal<Set<number>>(new Set());

  readonly kyDangChon = computed(() => this.hocKy().find((k) => k.id === this.hocKyId()));

  constructor() {
    this.lopHocPhan.layTuyChon('semesters').subscribe({
      next: (rows) => {
        const ds = rows as (TuyChon & { trang_thai?: string })[];
        this.hocKy.set(ds);
        const dangDienRa = ds.find((k) => k.trang_thai === 'ONGOING') ?? ds[0];
        if (dangDienRa) {
          this.hocKyId.set(dangDienRa.id);
          this.tai();
        } else {
          this.dangTai.set(false);
        }
      },
      error: () => {
        this.loi.set('Không tải được danh sách học kỳ.');
        this.dangTai.set(false);
      },
    });
  }

  chonHocKy(id: number): void {
    this.hocKyId.set(id);
    this.thongBao.set('');
    this.tai();
  }

  conCho(l: LopHocPhan): number {
    return Math.max(0, l.si_so_toi_da - l.si_so_hien_tai);
  }

  daDangKy(l: LopHocPhan): boolean {
    return this.daDangKyIds().has(l.id);
  }

  coTheDangKy(l: LopHocPhan): boolean {
    return (
      this.kyDangChon()?.trang_thai === 'UPCOMING' &&
      l.trang_thai === 'OPEN' &&
      this.conCho(l) > 0 &&
      !this.daDangKy(l)
    );
  }

  dangKyLop(l: LopHocPhan): void {
    if (this.dangGui()) return;
    this.dangGui.set(l.id);
    this.loi.set('');
    this.dangKy.dangKyCuaToi(l.id).subscribe({
      next: () => {
        this.dangGui.set(0);
        this.thongBao.set(`Đã đăng ký ${l.ma_lop_hp}.`);
        this.daDangKyIds.update((s) => new Set([...s, l.id]));
      },
      error: (error: { error?: { message?: string } }) => {
        this.dangGui.set(0);
        this.loi.set(error.error?.message ?? 'Không đăng ký được lớp này.');
      },
    });
  }

  private tai(): void {
    this.dangTai.set(true);
    this.lopHocPhan.layDanhSach({ hoc_ky_id: this.hocKyId(), per_page: 100 }).subscribe({
      next: (trang) => {
        this.lop.set(trang.data);
        this.dangTai.set(false);
      },
      error: () => {
        this.loi.set('Không tải được danh sách lớp học phần.');
        this.dangTai.set(false);
      },
    });

    this.dangKy.layCuaToi({ hoc_ky_id: this.hocKyId(), per_page: 100 }).subscribe({
      next: (trang) => {
        this.daDangKyIds.set(
          new Set(trang.data.filter((d) => d.trang_thai === 'ACTIVE').map((d) => d.lop_hoc_phan.id)),
        );
      },
      error: () => this.daDangKyIds.set(new Set()),
    });
  }
}
