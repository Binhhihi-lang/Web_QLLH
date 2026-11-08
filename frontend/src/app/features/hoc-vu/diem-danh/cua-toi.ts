import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import { LopHocPhanService, TuyChon } from '@core/services/lop-hoc-phan.service';
import { environment } from '@env/environment';
import { AppAlert } from '@shared/ui/app-alert';
import { LoadingState } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';

interface DongChuyenCan {
  dang_ky_hoc_phan_id: number;
  lop_hoc_phan: {
    id: number;
    ma_lop_hp: string;
    ten_mon: string | null;
    ma_mon: string | null;
    so_tin_chi: number | null;
    giang_vien: string | null;
  };
  tong_so_buoi: number;
  so_buoi_da_hoc: number;
  co_mat: number;
  di_muon: number;
  vang: number;
  co_phep: number;
  ty_le: number | null;
}

/**
 * Chuyên cần của sinh viên: chọn học kỳ, xem từng môn đã đăng ký.
 * Đếm theo buổi (công thức FR-11.05), không theo tiết.
 */
@Component({
  selector: 'app-diem-danh-cua-toi',
  standalone: true,
  imports: [DecimalPipe, FormsModule, AppAlert, LoadingState, PageHeader],
  template: `
    <app-page-header
      title="Điểm danh"
      description="Số buổi có mặt, đi muộn, vắng có phép và không phép theo từng môn."
    />

    @if (loi()) {
      <app-alert muc="danger">{{ loi() }}</app-alert>
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
      <span class="ghi-chu">Tỉ lệ = (có mặt + đi muộn) / (số buổi đã điểm danh − vắng có phép)</span>
    </section>

    @if (dangTai()) {
      <app-loading-state label="Đang tải dữ liệu điểm danh…" />
    } @else if (dong().length === 0) {
      <p class="trong">
        Bạn chưa đăng ký học phần nào trong học kỳ này. Sau khi đăng ký, chuyên cần sẽ hiện ở đây.
      </p>
    } @else {
      <div class="cuon">
        <table>
          <thead>
            <tr>
              <th>Môn học</th>
              <th>Lớp</th>
              <th>Giảng viên</th>
              <th>Đã học</th>
              <th>Có mặt</th>
              <th>Đi muộn</th>
              <th>Vắng có phép</th>
              <th>Vắng không phép</th>
              <th>Tỉ lệ</th>
            </tr>
          </thead>
          <tbody>
            @for (d of dong(); track d.dang_ky_hoc_phan_id) {
              <tr>
                <td>
                  @if (d.lop_hoc_phan.ma_mon) {
                    <b>{{ d.lop_hoc_phan.ma_mon }}</b>
                  }
                  {{ d.lop_hoc_phan.ten_mon ?? '—' }}
                </td>
                <td>{{ d.lop_hoc_phan.ma_lop_hp }}</td>
                <td>{{ d.lop_hoc_phan.giang_vien ?? '—' }}</td>
                <td>{{ d.so_buoi_da_hoc }}/{{ d.tong_so_buoi }}</td>
                <td>{{ d.co_mat }}</td>
                <td>{{ d.di_muon }}</td>
                <td>{{ d.co_phep }}</td>
                <td>{{ d.vang }}</td>
                <td>
                  <b>{{ d.ty_le === null ? '—' : (d.ty_le * 100 | number: '1.0-0') + '%' }}</b>
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
    .ghi-chu {
      font-size: var(--text-caption);
      color: var(--color-ink-subtle);
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
    td b {
      font-family: var(--font-mono, monospace);
      font-size: var(--text-caption);
      color: var(--color-primary);
      margin-right: 4px;
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
export class DiemDanhCuaToi {
  private readonly http = inject(HttpClient);
  private readonly lopHocPhan = inject(LopHocPhanService);
  private readonly goc = environment.apiBaseUrl;

  readonly hocKy = signal<TuyChon[]>([]);
  readonly hocKyId = signal(0);
  readonly dong = signal<DongChuyenCan[]>([]);
  readonly dangTai = signal(true);
  readonly loi = signal('');

  constructor() {
    this.lopHocPhan.layTuyChon('semesters').subscribe({
      next: (rows) => {
        this.hocKy.set(rows);
        // Mặc định về kỳ đang diễn ra, không phải kỳ mới nhất: danh sách sắp
        // giảm dần nên rows[0] thường là kỳ tương lai chưa có lớp — mở trang
        // là thấy bảng rỗng dù học kỳ hiện tại có đủ dữ liệu.
        const macDinh =
          rows.find((k) => (k as TuyChon & { trang_thai?: string }).trang_thai === 'ONGOING') ??
          rows[0];
        if (macDinh) {
          this.hocKyId.set(macDinh.id);
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
    this.tai();
  }

  private tai(): void {
    this.dangTai.set(true);
    this.loi.set('');

    let params = new HttpParams();
    if (this.hocKyId()) params = params.set('hoc_ky_id', this.hocKyId());

    this.http
      .get<{ data: DongChuyenCan[] }>(`${this.goc}/me/attendance-summary`, { params })
      .pipe(map((r) => r.data))
      .subscribe({
        next: (rows) => {
          this.dong.set(rows);
          this.dangTai.set(false);
        },
        error: () => {
          this.loi.set('Không tải được dữ liệu điểm danh.');
          this.dangTai.set(false);
        },
      });
  }
}
