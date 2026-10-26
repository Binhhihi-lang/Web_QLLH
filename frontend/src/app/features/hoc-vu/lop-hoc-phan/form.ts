import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LopHocPhanInput, LopHocPhanService, TuyChon } from '@core/services/lop-hoc-phan.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { PageHeader } from '@shared/ui/page-header';

@Component({
  selector: 'app-lop-hoc-phan-form',
  standalone: true,
  imports: [FormsModule, RouterLink, AppAlert, AppButton, PageHeader],
  template: `
    <app-page-header
      [title]="laSua() ? 'Sửa lớp học phần' : 'Mở lớp học phần'"
      description="Gán môn học, học kỳ, giảng viên và giới hạn sĩ số."
    />
    @if (loi()) {
      <app-alert muc="danger">{{ loi() }}</app-alert>
    }
    @if (dangTai()) {
      <p class="loading" role="status">Đang tải lớp học phần…</p>
    } @else {
      <form class="form" (ngSubmit)="luu()" #f="ngForm">
        <div class="luoi">
          <label>
            Mã lớp học phần *
            <input
              name="ma"
              required
              maxlength="50"
              [(ngModel)]="data.ma_lop_hp"
              placeholder="VD: INT2203-HK1-2026-01"
            />
          </label>
          <label>
            Môn học *
            <select name="mon" required [(ngModel)]="data.mon_hoc_id">
              <option [ngValue]="0">Chọn môn học</option>
              @for (item of mon(); track item.id) {
                <option [ngValue]="item.id">{{ item.label }}</option>
              }
            </select>
          </label>
          <label>
            Học kỳ *
            <select name="hoc-ky" required [(ngModel)]="data.hoc_ky_id">
              <option [ngValue]="0">Chọn học kỳ</option>
              @for (item of hk(); track item.id) {
                <option [ngValue]="item.id">{{ item.label }}</option>
              }
            </select>
          </label>
          <label>
            Giảng viên *
            <select name="giang-vien" required [(ngModel)]="data.giang_vien_id">
              <option [ngValue]="0">Chọn giảng viên</option>
              @for (item of gv(); track item.id) {
                <option [ngValue]="item.id">{{ item.label }}</option>
              }
            </select>
          </label>
          <label>
            Sĩ số tối đa *
            <input
              name="si-so"
              required
              type="number"
              min="1"
              max="500"
              step="1"
              [(ngModel)]="data.si_so_toi_da"
            />
          </label>
          <label>
            Năm thứ
            <select name="nam-thu" [(ngModel)]="data.nam_thu">
              <option [ngValue]="null">Mọi năm</option>
              @for (year of [1, 2, 3, 4, 5, 6]; track year) {
                <option [ngValue]="year">Năm {{ year }}</option>
              }
            </select>
          </label>
        </div>
        <div class="nut">
          <a routerLink="/lop-hoc-phan">Hủy</a>
          <app-button
            variant="primary"
            type="submit"
            [disabled]="!!f.invalid || !hopLe() || dangLuu()"
            [loading]="dangLuu()"
          >
            {{ laSua() ? 'Lưu thay đổi' : 'Mở lớp' }}
          </app-button>
        </div>
      </form>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .form {
      max-width: 880px;
      padding: 24px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }
    .luoi {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }
    label {
      display: grid;
      gap: 7px;
      font-size: var(--text-small);
      font-weight: 600;
      color: var(--color-ink);
    }
    input,
    select {
      width: 100%;
      box-sizing: border-box;
      padding: 11px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      font: inherit;
      background: var(--color-surface);
      color: var(--color-ink);
    }
    .nut {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 18px;
      margin-top: 24px;
    }
    .nut a {
      color: var(--color-ink-muted);
      text-decoration: none;
      font-weight: 600;
    }
    .loading {
      color: var(--color-ink-muted);
    }
    @media (max-width: 640px) {
      .form {
        padding: 16px;
      }
      .luoi {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class LopHocPhanForm {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(LopHocPhanService);
  readonly id = Number(this.route.snapshot.paramMap.get('id')) || null;
  readonly laSua = computed(() => this.id !== null);
  readonly dangTai = signal(this.id !== null);
  readonly dangLuu = signal(false);
  readonly loi = signal('');
  readonly mon = signal<TuyChon[]>([]);
  readonly hk = signal<TuyChon[]>([]);
  readonly gv = signal<TuyChon[]>([]);
  readonly data: LopHocPhanInput = {
    ma_lop_hp: '',
    mon_hoc_id: 0,
    hoc_ky_id: 0,
    giang_vien_id: 0,
    si_so_toi_da: 40,
    nam_thu: null,
    trang_thai: 'OPEN',
  };

  constructor() {
    this.taiTuyChon('subjects', this.mon);
    this.taiTuyChon('semesters', this.hk);
    this.taiTuyChon('teachers', this.gv);
    if (this.id !== null) this.taiLop(this.id);
  }

  hopLe(): boolean {
    return (
      !!this.data.ma_lop_hp.trim() &&
      this.data.mon_hoc_id > 0 &&
      this.data.hoc_ky_id > 0 &&
      this.data.giang_vien_id > 0 &&
      Number.isInteger(this.data.si_so_toi_da) &&
      this.data.si_so_toi_da >= 1 &&
      this.data.si_so_toi_da <= 500 &&
      (this.data.nam_thu === null ||
        (Number.isInteger(this.data.nam_thu) && this.data.nam_thu >= 1 && this.data.nam_thu <= 6))
    );
  }

  luu(): void {
    if (!this.hopLe() || this.dangLuu() || this.dangTai()) return;
    this.dangLuu.set(true);
    this.loi.set('');
    const request =
      this.id === null ? this.service.tao(this.data) : this.service.capNhat(this.id, this.data);
    request.subscribe({
      next: (row) => this.router.navigate(['/lop-hoc-phan', row.id]),
      error: (error: { error?: { message?: string } }) => {
        this.loi.set(error.error?.message ?? 'Không lưu được lớp học phần.');
        this.dangLuu.set(false);
      },
    });
  }

  private taiTuyChon(path: 'semesters' | 'subjects' | 'teachers', target: typeof this.mon): void {
    this.service.layTuyChon(path).subscribe({
      next: (rows) => target.set(rows),
      error: () => this.loi.set('Không tải được dữ liệu lựa chọn. Vui lòng thử tải lại trang.'),
    });
  }

  private taiLop(id: number): void {
    this.service.layMot(id).subscribe({
      next: (row) => {
        this.data.ma_lop_hp = row.ma_lop_hp;
        this.data.mon_hoc_id = row.mon_hoc.id;
        this.data.hoc_ky_id = row.hoc_ky.id;
        this.data.giang_vien_id = row.giang_vien.id;
        this.data.si_so_toi_da = row.si_so_toi_da;
        this.data.nam_thu = row.nam_thu;
        this.data.trang_thai = row.trang_thai;
        this.dangTai.set(false);
      },
      error: () => {
        this.loi.set('Không tìm thấy lớp học phần.');
        this.dangTai.set(false);
      },
    });
  }
}
