import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LopHocPhan } from '@core/models/dao-tao.model';
import { LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { chuanHoaTimKiem } from '@core/utils/chuan-hoa-tim-kiem';
import { AppAlert } from '@shared/ui/app-alert';
import { LoadingState } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';
import { SearchInput } from '@shared/ui/search-input';
import { StatusBadge } from '@shared/ui/status-badge';

@Component({
  selector: 'app-diem-danh-sach-lop',
  standalone: true,
  imports: [AppAlert, LoadingState, PageHeader, RouterLink, SearchInput, StatusBadge],
  template: `
    <app-page-header
      title="Nhập điểm"
      description="Chọn lớp học phần để xem, nhập hoặc chốt bảng điểm."
    />

    @if (loi()) {
      <app-alert muc="danger" title="Không tải được danh sách lớp học phần">
        {{ loi() }}
        <button type="button" class="nut-thu-lai" (click)="tai()">Thử lại</button>
      </app-alert>
    }

    @if (dangTai()) {
      <app-loading-state label="Đang tải các lớp học phần…" />
    } @else {
      <section class="bang-dieu-khien" aria-label="Tìm lớp học phần">
        <div>
          <h2>Các lớp học phần</h2>
          <p>{{ lopHienThi().length }} lớp phù hợp</p>
        </div>
        <app-search-input
          placeholder="Tìm mã lớp, môn học hoặc giảng viên…"
          [value]="tuKhoa()"
          (valueChange)="tuKhoa.set($event)"
        />
      </section>

      @if (lopHienThi().length) {
        <section class="danh-sach" aria-label="Chọn lớp học phần để nhập điểm">
          @for (lop of lopHienThi(); track lop.id) {
            <article class="lop">
              <div class="dau-lop">
                <div class="bieu-tuong" aria-hidden="true">
                  <span class="material-icons">grading</span>
                </div>
                <div class="thong-tin">
                  <span class="ma-lop">{{ lop.ma_lop_hp }}</span>
                  <h3>{{ lop.mon_hoc.ten_mon }}</h3>
                  <p>{{ lop.mon_hoc.ma_mon }} · {{ lop.hoc_ky.ten_hoc_ky }}</p>
                </div>
                <app-status-badge
                  [value]="lop.da_chot_diem ? 'CLOSED' : lop.trang_thai"
                  [label]="lop.da_chot_diem ? 'Đã chốt điểm' : nhanTrangThai(lop.trang_thai)"
                />
              </div>
              <div class="chan-lop">
                <span>
                  <span class="material-icons" aria-hidden="true">person</span>
                  {{ lop.giang_vien.ho_ten }}
                </span>
                <span>
                  <span class="material-icons" aria-hidden="true">groups</span>
                  {{ lop.si_so_hien_tai }} sinh viên
                </span>
                <a [routerLink]="['/lop-hoc-phan', lop.id, 'diem']">
                  Xem bảng điểm
                  <span class="material-icons" aria-hidden="true">arrow_forward</span>
                </a>
              </div>
            </article>
          }
        </section>
      } @else {
        <section class="rong">
          <span class="material-icons" aria-hidden="true">search_off</span>
          <strong>{{ tuKhoa() ? 'Không tìm thấy lớp phù hợp' : 'Chưa có lớp học phần' }}</strong>
          <p>
            {{
              tuKhoa()
                ? 'Thử từ khóa khác để tìm lớp học phần.'
                : 'Các lớp bạn được phép xem sẽ xuất hiện tại đây.'
            }}
          </p>
        </section>
      }
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .bang-dieu-khien {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 14px;
      padding: 18px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
    }

    h2,
    h3,
    p {
      margin: 0;
    }

    h2 {
      color: var(--color-ink);
      font-size: var(--text-h3);
      font-weight: 650;
    }

    .bang-dieu-khien p,
    .thong-tin p {
      margin-top: 5px;
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }

    app-search-input {
      width: min(100%, 380px);
    }

    .danh-sach {
      display: grid;
      gap: 12px;
    }

    .lop {
      overflow: hidden;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }

    .dau-lop {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px;
    }

    .bieu-tuong {
      display: grid;
      width: 46px;
      height: 46px;
      flex: none;
      place-items: center;
      border-radius: var(--radius);
      background: var(--color-primary-soft);
      color: var(--color-on-primary-soft);
    }

    .bieu-tuong .material-icons {
      font-size: 23px;
    }

    .thong-tin {
      min-width: 0;
      flex: 1;
    }

    .ma-lop {
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
      font-variant-numeric: tabular-nums;
    }

    h3 {
      margin-top: 2px;
      overflow-wrap: anywhere;
      color: var(--color-ink);
      font-size: var(--text-small);
      font-weight: 650;
    }

    .chan-lop {
      display: flex;
      align-items: center;
      gap: 18px;
      flex-wrap: wrap;
      padding: 12px 18px 12px 78px;
      border-top: 1px solid var(--color-border-soft);
      background: var(--color-surface-alt);
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }

    .chan-lop > span,
    .chan-lop a {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .chan-lop .material-icons {
      font-size: 17px;
    }

    .chan-lop a {
      margin-left: auto;
      color: var(--color-primary);
      font-weight: 650;
      text-decoration: none;
    }

    .chan-lop a:hover {
      text-decoration: underline;
    }

    .chan-lop a:focus-visible,
    .nut-thu-lai:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 3px;
    }

    .rong {
      display: grid;
      justify-items: center;
      gap: 8px;
      padding: 48px 20px;
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-lg);
      color: var(--color-ink-muted);
      text-align: center;
    }

    .rong .material-icons {
      color: var(--color-primary);
      font-size: 32px;
    }

    .rong strong {
      color: var(--color-ink);
    }

    .rong p {
      font-size: var(--text-small);
    }

    .nut-thu-lai {
      margin-left: 8px;
      padding: 5px 8px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      color: var(--color-primary);
      cursor: pointer;
    }

    @media (max-width: 640px) {
      .bang-dieu-khien {
        align-items: stretch;
        flex-direction: column;
      }

      app-search-input {
        width: 100%;
      }

      .dau-lop {
        align-items: flex-start;
        flex-wrap: wrap;
      }

      .dau-lop app-status-badge {
        margin-left: 60px;
      }

      .chan-lop {
        padding-left: 16px;
      }

      .chan-lop a {
        width: 100%;
        margin-left: 0;
      }
    }
  `,
})
export class DanhSachLopNhapDiem {
  private readonly service = inject(LopHocPhanService);

  readonly lop = signal<LopHocPhan[]>([]);
  readonly dangTai = signal(true);
  readonly loi = signal('');
  readonly tuKhoa = signal('');
  readonly lopHienThi = computed(() => {
    const tuKhoa = chuanHoaTimKiem(this.tuKhoa());
    if (!tuKhoa) return this.lop();
    return this.lop().filter((lop) =>
      chuanHoaTimKiem(
        `${lop.ma_lop_hp} ${lop.mon_hoc.ma_mon} ${lop.mon_hoc.ten_mon} ${lop.giang_vien.ho_ten}`,
      ).includes(tuKhoa),
    );
  });

  constructor() {
    this.tai();
  }

  tai(): void {
    this.dangTai.set(true);
    this.loi.set('');
    this.service.layDanhSach({ page: 1, per_page: 100 }).subscribe({
      next: (response) => {
        this.lop.set(response.data);
        this.dangTai.set(false);
      },
      error: (error: unknown) => {
        this.loi.set(
          error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
            ? error.error.message
            : 'Không tải được các lớp học phần. Kiểm tra kết nối rồi thử lại.',
        );
        this.dangTai.set(false);
      },
    });
  }

  nhanTrangThai(trangThai: LopHocPhan['trang_thai']): string {
    switch (trangThai) {
      case 'OPEN':
        return 'Đang mở';
      case 'CLOSED':
        return 'Đã đóng';
      case 'CANCELLED':
        return 'Đã hủy';
    }
  }
}
