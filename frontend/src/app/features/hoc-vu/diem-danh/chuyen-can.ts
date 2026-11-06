import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { chuanHoaTimKiem } from '@core/utils/chuan-hoa-tim-kiem';
import { AppAlert } from '@shared/ui/app-alert';
import { LoadingState } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';
import { SearchInput } from '@shared/ui/search-input';
import { DiemDanhService, ThongKeChuyenCan } from './diem-danh.service';

@Component({
  selector: 'app-diem-danh-chuyen-can',
  standalone: true,
  imports: [AppAlert, LoadingState, PageHeader, RouterLink, SearchInput],
  template: `
    <app-page-header
      title="Thống kê chuyên cần"
      description="Tổng hợp có mặt, đi muộn, vắng và tỷ lệ chuyên cần của lớp."
    >
      <a class="quay-lai" [routerLink]="['/lop-hoc-phan', lopHocPhanId]">
        <span class="material-icons" aria-hidden="true">arrow_back</span>
        Chi tiết lớp học phần
      </a>
      @if (thongKe(); as data) {
        <button class="xuat" type="button" (click)="xuatCsv(data)">
          <span class="material-icons" aria-hidden="true">download</span>
          Xuất CSV
        </button>
      }
    </app-page-header>

    @if (loi()) {
      <app-alert muc="danger" title="Không tải được thống kê">
        {{ loi() }}
        <button class="thu-lai" type="button" (click)="tai()">Thử lại</button>
      </app-alert>
    }
    @if (dangTai()) {
      <app-loading-state label="Đang tổng hợp chuyên cần…" />
    } @else if (thongKe(); as data) {
      <section class="tong-quan" aria-label="Tổng quan lớp học phần">
        <div class="thong-tin-lop">
          <span class="nhan">Lớp học phần</span>
          <strong>{{ data.ma_lop_hp }}</strong>
        </div>
        <div class="thong-tin-lop">
          <span class="nhan">Tổng số buổi</span>
          <strong>{{ data.tong_buoi }}</strong>
        </div>
        <div class="thong-tin-lop">
          <span class="nhan">Sinh viên</span>
          <strong>{{ data.sinh_vien.length }}</strong>
        </div>
      </section>

      <section class="loc">
        <app-search-input
          placeholder="Tìm theo mã sinh viên hoặc họ tên…"
          [value]="tuKhoa()"
          (valueChange)="tuKhoa.set($event)"
        />
        <span>{{ rowsHienThi().length }} / {{ data.sinh_vien.length }} sinh viên</span>
      </section>

      @if (rowsHienThi().length) {
        <div class="bang">
          <table>
            <thead>
              <tr>
                <th>Mã sinh viên</th>
                <th>Họ và tên</th>
                <th class="so">Có mặt</th>
                <th class="so">Đi muộn</th>
                <th class="so">Vắng</th>
                <th class="so">Có phép</th>
                <th>Tỷ lệ chuyên cần</th>
              </tr>
            </thead>
            <tbody>
              @for (row of rowsHienThi(); track row.dang_ky_hoc_phan_id) {
                <tr>
                  <td class="ma">{{ row.sinh_vien.ma_sv }}</td>
                  <td>
                    <strong>{{ row.sinh_vien.ho_ten }}</strong>
                    <small>{{ row.sinh_vien.lop || row.sinh_vien.email }}</small>
                  </td>
                  <td class="so">{{ row.co_mat }}</td>
                  <td class="so">{{ row.di_muon }}</td>
                  <td class="so">{{ row.vang }}</td>
                  <td class="so">{{ row.co_phep }}</td>
                  <td>
                    @if (row.ty_le === null) {
                      <span class="chua-co">Chưa có dữ liệu</span>
                    } @else {
                      <div class="ti-le">
                        <strong>{{ dinhDangTyLe(row.ty_le) }}</strong>
                        <div
                          class="thanh"
                          role="progressbar"
                          [attr.aria-valuenow]="row.ty_le * 100"
                          aria-valuemin="0"
                          aria-valuemax="100"
                          [attr.aria-label]="'Tỷ lệ chuyên cần của ' + row.sinh_vien.ho_ten"
                        >
                          <span [style.width.%]="row.ty_le * 100"></span>
                        </div>
                      </div>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <p class="rong">
          {{
            data.sinh_vien.length
              ? 'Không tìm thấy sinh viên phù hợp.'
              : 'Lớp học phần chưa có sinh viên đăng ký.'
          }}
        </p>
      }
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .quay-lai,
    .xuat {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font: inherit;
      font-size: var(--text-small);
      font-weight: 600;
      text-decoration: none;
    }
    .quay-lai {
      color: var(--color-primary);
    }
    .xuat {
      padding: 8px 11px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
      cursor: pointer;
    }
    .quay-lai .material-icons,
    .xuat .material-icons {
      font-size: 18px;
    }
    .tong-quan {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    .thong-tin-lop {
      display: grid;
      gap: 5px;
      padding: 16px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
    }
    .nhan,
    small {
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }
    .thong-tin-lop strong {
      color: var(--color-ink);
      font-size: var(--text-small);
    }
    .loc {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 12px;
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }
    app-search-input {
      width: min(100%, 340px);
    }
    .bang {
      overflow: auto;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }
    table {
      width: 100%;
      min-width: 860px;
      border-collapse: collapse;
      font-size: var(--text-small);
    }
    th {
      padding: 11px 14px;
      background: var(--color-surface-alt);
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
      text-align: left;
      white-space: nowrap;
    }
    td {
      padding: 12px 14px;
      border-top: 1px solid var(--color-border-soft);
    }
    td strong,
    td small {
      display: block;
    }
    td small {
      margin-top: 3px;
    }
    .so {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .ma {
      color: var(--color-ink-muted);
      white-space: nowrap;
    }
    .ti-le {
      display: grid;
      min-width: 140px;
      gap: 6px;
    }
    .thanh {
      height: 7px;
      overflow: hidden;
      border-radius: 999px;
      background: var(--color-surface-alt);
    }
    .thanh span {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--color-success);
    }
    .chua-co {
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }
    .rong {
      padding: 32px 16px;
      color: var(--color-ink-muted);
      text-align: center;
    }
    .thu-lai {
      margin-left: 8px;
      border: 0;
      background: none;
      color: var(--color-primary);
      cursor: pointer;
      font: inherit;
      font-weight: 600;
    }
    @media (max-width: 640px) {
      .tong-quan {
        grid-template-columns: 1fr;
      }
      app-search-input {
        width: 100%;
      }
    }
  `,
})
export class DiemDanhChuyenCan {
  private readonly service = inject(DiemDanhService);
  readonly lopHocPhanId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  readonly thongKe = signal<ThongKeChuyenCan | null>(null);
  readonly tuKhoa = signal('');
  readonly dangTai = signal(true);
  readonly loi = signal('');
  readonly rowsHienThi = computed(() => {
    const rows = this.thongKe()?.sinh_vien ?? [];
    const tuKhoa = chuanHoaTimKiem(this.tuKhoa());
    if (!tuKhoa) return rows;
    return rows.filter((row) =>
      chuanHoaTimKiem(
        `${row.sinh_vien.ma_sv} ${row.sinh_vien.ho_ten} ${row.sinh_vien.email}`,
      ).includes(tuKhoa),
    );
  });

  constructor() {
    this.tai();
  }

  tai(): void {
    this.dangTai.set(true);
    this.loi.set('');
    this.service.layThongKe(this.lopHocPhanId).subscribe({
      next: (data) => {
        this.thongKe.set(data);
        this.dangTai.set(false);
      },
      error: () => {
        this.loi.set('Không tải được thống kê chuyên cần. Vui lòng thử lại.');
        this.dangTai.set(false);
      },
    });
  }

  dinhDangTyLe(tyLe: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 1 }).format(
      tyLe,
    );
  }

  xuatCsv(data: ThongKeChuyenCan): void {
    const cot = [
      'Mã sinh viên',
      'Họ và tên',
      'Có mặt',
      'Đi muộn',
      'Vắng',
      'Có phép',
      'Tỷ lệ chuyên cần',
    ];
    const dong = data.sinh_vien.map((row) =>
      [
        row.sinh_vien.ma_sv,
        row.sinh_vien.ho_ten,
        row.co_mat,
        row.di_muon,
        row.vang,
        row.co_phep,
        row.ty_le === null ? '' : this.dinhDangTyLe(row.ty_le),
      ]
        .map((value) => this.trichDan(String(value)))
        .join(','),
    );
    const file = new Blob(['\uFEFF', [cot.join(','), ...dong].join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${data.ma_lop_hp}-chuyen-can.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private trichDan(value: string): string {
    return `"${value.replaceAll('"', '""')}"`;
  }
}
