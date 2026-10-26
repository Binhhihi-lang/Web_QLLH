import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DongDiem, LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { PageHeader } from '@shared/ui/page-header';

@Component({
  selector: 'app-lop-hoc-phan-diem',
  standalone: true,
  imports: [FormsModule, RouterLink, AppAlert, AppButton, PageHeader],
  template: `
    <app-page-header
      title="Bảng điểm lớp"
      description="Trọng số: chuyên cần 25%, giữa kỳ 25%, cuối kỳ 50%."
    >
      <a class="back" [routerLink]="['/lop-hoc-phan', id]">Quay lại lớp học phần</a>
    </app-page-header>
    @if (loi()) {
      <app-alert muc="danger">{{ loi() }}</app-alert>
    }
    @if (dangTai()) {
      <p class="loading" role="status">Đang tải bảng điểm…</p>
    } @else if (diem().length) {
      <section class="toolbar">
        <span>{{ daChot() ? 'Điểm đã chốt' : 'Có thể chỉnh sửa điểm' }}</span>
        <div>
          @if (!daChot()) {
            <app-button variant="secondary" size="sm" (click)="tai()">Khôi phục</app-button>
            <app-button
              variant="secondary"
              size="sm"
              (click)="luu()"
              [disabled]="!hopLe()"
              [loading]="dangLuu()"
              >Lưu điểm</app-button
            >
            <app-button
              variant="primary"
              size="sm"
              (click)="chot()"
              [disabled]="!duDiem()"
              [loading]="dangLuu()"
              >Chốt điểm</app-button
            >
          }
        </div>
      </section>
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
            </tr>
          </thead>
          <tbody>
            @for (row of diem(); track row.dang_ky_hoc_phan_id) {
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
                    [disabled]="daChot()"
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
                    [disabled]="daChot()"
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
                    [disabled]="daChot()"
                    [(ngModel)]="row.diem_cuoi_ky"
                  />
                </td>
                <td>
                  <strong>{{ tong(row) }}</strong>
                </td>
                <td>
                  <span class="badge">{{ chu(row) }}</span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <p class="empty">Lớp học phần chưa có sinh viên đăng ký.</p>
    }
  `,
  styles: `
    .back {
      color: var(--color-primary);
      font-weight: 600;
      text-decoration: none;
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
      gap: 8px;
      flex-wrap: wrap;
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
      min-width: 760px;
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
    .loading,
    .empty {
      color: var(--color-ink-muted);
    }
  `,
})
export class LopHocPhanDiem {
  private readonly service = inject(LopHocPhanService);
  readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  readonly diem = signal<DongDiem[]>([]);
  readonly loi = signal('');
  readonly dangTai = signal(true);
  readonly dangLuu = signal(false);
  readonly daChot = signal(false);
  readonly hopLe = computed(() => this.diem().every((row) => this.diemHopLe(row)));
  readonly duDiem = computed(
    () => this.hopLe() && this.diem().length > 0 && this.diem().every((row) => this.diemDayDu(row)),
  );

  constructor() {
    this.tai();
  }

  tai(): void {
    this.dangTai.set(true);
    this.loi.set('');
    forkJoin({
      lop: this.service.layMot(this.id),
      diem: this.service.layDiem(this.id),
    }).subscribe({
      next: ({ lop, diem }) => {
        this.daChot.set(lop.da_chot_diem);
        this.diem.set(diem);
        this.dangTai.set(false);
      },
      error: () => {
        this.loi.set('Không tải được bảng điểm hoặc thông tin lớp học phần.');
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

  luu(): void {
    if (!this.hopLe() || this.daChot() || this.dangLuu()) return;
    this.guiDiem();
  }

  chot(): void {
    if (!this.duDiem() || this.daChot() || this.dangLuu()) return;
    if (!confirm('Chốt điểm lớp này? Điểm sẽ không còn chỉnh sửa.')) return;

    this.dangLuu.set(true);
    this.loi.set('');
    this.service.capNhatDiem(this.id, this.diem()).subscribe({
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
    this.service.capNhatDiem(this.id, this.diem()).subscribe({
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
}
