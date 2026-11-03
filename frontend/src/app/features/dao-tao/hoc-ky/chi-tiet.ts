import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { HocKy } from '@core/models/dao-tao.model';
import { AppAlert } from '@shared/ui/app-alert';
import { LoadingState } from '@shared/ui/loading';
import { NgayVnPipe } from '@shared/pipes/ngay-vn.pipe';
import { PageHeader } from '@shared/ui/page-header';
import { StatusBadge } from '@shared/ui/status-badge';
import { HocKyService } from './hoc-ky.service';

@Component({
  selector: 'app-hoc-ky-chi-tiet',
  standalone: true,
  imports: [AppAlert, LoadingState, NgayVnPipe, PageHeader, RouterLink, StatusBadge],
  template: `
    @if (dangTai()) {
      <app-loading-state label="Đang tải thông tin học kỳ…" />
    } @else if (loi()) {
      <app-alert muc="danger" title="Không tải được thông tin học kỳ">
        {{ loi() }}
        <a routerLink="/hoc-ky">Quay lại danh sách</a>
      </app-alert>
    } @else if (hocKy(); as hocKyHienTai) {
      <app-page-header
        [title]="hocKyHienTai.ten_hoc_ky"
        [description]="'Chi tiết học kỳ ' + hocKyHienTai.ma_hoc_ky"
      >
        <a class="nut-quay-lai" routerLink="/hoc-ky">
          <span class="material-icons" aria-hidden="true">arrow_back</span>
          Danh sách học kỳ
        </a>
        @if (laAdmin() && hocKyHienTai.trang_thai !== 'CLOSED') {
          <a class="nut-sua" [routerLink]="['/hoc-ky', hocKyHienTai.id, 'sua']">
            <span class="material-icons" aria-hidden="true">edit</span>
            Sửa học kỳ
          </a>
        }
      </app-page-header>

      <section class="khung" aria-label="Thông tin chi tiết học kỳ">
        <div class="dau">
          <div class="bieu-tuong" aria-hidden="true">
            <span class="material-icons">date_range</span>
          </div>
          <div class="nhan-dien">
            <p class="ma-hoc-ky">{{ hocKyHienTai.ma_hoc_ky }}</p>
            <h2>{{ hocKyHienTai.ten_hoc_ky }}</h2>
            <p class="nam-hoc">{{ hocKyHienTai.nam_hoc }} · {{ nhanKyThu(hocKyHienTai.ky_thu) }}</p>
          </div>
          <app-status-badge
            [value]="hocKyHienTai.trang_thai"
            [label]="nhanTrangThai(hocKyHienTai.trang_thai)"
          />
        </div>

        <div class="noi-dung">
          <section aria-labelledby="thong-tin-chung">
            <h3 id="thong-tin-chung">Thông tin chung</h3>
            <dl>
              <dt>Mã học kỳ</dt>
              <dd>{{ hocKyHienTai.ma_hoc_ky }}</dd>
              <dt>Tên học kỳ</dt>
              <dd>{{ hocKyHienTai.ten_hoc_ky }}</dd>
              <dt>Năm học</dt>
              <dd>{{ hocKyHienTai.nam_hoc }}</dd>
              <dt>Kỳ thứ</dt>
              <dd>{{ nhanKyThu(hocKyHienTai.ky_thu) }}</dd>
              <dt>Trạng thái</dt>
              <dd>{{ nhanTrangThai(hocKyHienTai.trang_thai) }}</dd>
            </dl>
          </section>

          <section aria-labelledby="thoi-gian-hoc">
            <h3 id="thoi-gian-hoc">Thời gian học kỳ</h3>
            <dl>
              <dt>Ngày bắt đầu</dt>
              <dd>{{ hocKyHienTai.ngay_bat_dau | ngayVn }}</dd>
              <dt>Ngày kết thúc</dt>
              <dd>{{ hocKyHienTai.ngay_ket_thuc | ngayVn }}</dd>
            </dl>
          </section>

          <section aria-labelledby="dot-dang-ky">
            <h3 id="dot-dang-ky">Đợt đăng ký học phần</h3>
            <dl>
              <dt>Mở đăng ký</dt>
              <dd>{{ hienThoiGian(hocKyHienTai.mo_dang_ky_luc) }}</dd>
              <dt>Đóng đăng ký</dt>
              <dd>{{ hienThoiGian(hocKyHienTai.dong_dang_ky_luc) }}</dd>
              <dt>Tình trạng đăng ký</dt>
              <dd>{{ hocKyHienTai.dang_mo_dang_ky ? 'Đang mở đăng ký' : 'Chưa mở đăng ký' }}</dd>
            </dl>
          </section>
        </div>
      </section>
    }
  `,
  styles: `
    :host {
      display: block;
      max-width: 1040px;
      margin: 0 auto;
    }

    .nut-quay-lai,
    .nut-sua {
      display: inline-flex;
      min-height: 40px;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: var(--radius);
      font-size: var(--text-small);
      font-weight: 600;
      text-decoration: none;
    }

    .nut-quay-lai {
      color: var(--color-ink-muted);
    }

    .nut-quay-lai:hover {
      background: var(--color-surface-alt);
      color: var(--color-ink);
    }

    .nut-sua {
      background: var(--color-primary);
      color: var(--color-on-primary);
    }

    .nut-sua:hover {
      filter: brightness(0.95);
    }

    .nut-quay-lai:focus-visible,
    .nut-sua:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .nut-quay-lai .material-icons,
    .nut-sua .material-icons {
      font-size: 18px;
    }

    .khung {
      max-width: 880px;
      overflow: hidden;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
    }

    .dau {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 22px;
      border-bottom: 1px solid var(--color-border);
    }

    .bieu-tuong {
      display: grid;
      width: 56px;
      height: 56px;
      flex: none;
      place-items: center;
      border-radius: var(--radius-lg);
      background: var(--color-primary-soft);
      color: var(--color-on-primary-soft);
    }

    .bieu-tuong .material-icons {
      font-size: 28px;
    }

    .nhan-dien {
      min-width: 0;
      flex: 1;
    }

    .nhan-dien h2 {
      overflow-wrap: anywhere;
      color: var(--color-ink);
      font-size: var(--text-h2);
      font-weight: 600;
    }

    .ma-hoc-ky,
    .nam-hoc {
      margin: 0 0 3px;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
      font-variant-numeric: tabular-nums;
    }

    .nam-hoc {
      margin: 4px 0 0;
    }

    .noi-dung {
      display: grid;
      gap: 24px;
      padding: 22px;
    }

    h3 {
      margin: 0 0 12px;
      color: var(--color-ink);
      font-size: var(--text-h3);
      font-weight: 600;
    }

    dl {
      display: grid;
      grid-template-columns: minmax(140px, 0.7fr) minmax(0, 1.3fr);
      gap: 12px 18px;
      margin: 0;
      font-size: var(--text-small);
    }

    dt {
      color: var(--color-ink-muted);
    }

    dd {
      min-width: 0;
      margin: 0;
      overflow-wrap: anywhere;
      color: var(--color-ink);
    }

    @media (max-width: 640px) {
      .dau,
      .noi-dung {
        padding: 16px;
      }

      .dau {
        flex-wrap: wrap;
      }

      .dau app-status-badge {
        margin-left: 70px;
      }

      dl {
        grid-template-columns: 1fr;
        gap: 4px;
      }

      dd {
        margin-bottom: 8px;
      }
    }
  `,
})
export class HocKyChiTiet implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(HocKyService);
  private readonly auth = inject(AuthService);

  readonly hocKy = signal<HocKy | null>(null);
  readonly dangTai = signal(true);
  readonly loi = signal<string | null>(null);
  readonly laAdmin = computed(() => this.auth.nguoiDung()?.vai_tro === 'ADMIN');

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    const id = Number(rawId);
    if (!rawId || !Number.isInteger(id) || id < 1) {
      this.loi.set('Mã học kỳ không hợp lệ.');
      this.dangTai.set(false);
      return;
    }

    this.service.layMot(id).subscribe({
      next: (hocKy) => {
        this.hocKy.set(hocKy);
        this.dangTai.set(false);
      },
      error: (error: unknown) => {
        this.loi.set(
          error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
            ? error.error.message
            : 'Không tải được thông tin học kỳ. Kiểm tra kết nối rồi thử lại.',
        );
        this.dangTai.set(false);
      },
    });
  }

  nhanKyThu(kyThu: number): string {
    return kyThu === 3 ? 'Học kỳ hè' : `Học kỳ ${kyThu}`;
  }

  nhanTrangThai(trangThai: HocKy['trang_thai']): string {
    switch (trangThai) {
      case 'UPCOMING':
        return 'Sắp diễn ra';
      case 'ONGOING':
        return 'Đang diễn ra';
      case 'CLOSED':
        return 'Đã đóng';
    }
  }

  hienThoiGian(value: string): string {
    const [date, time] = value.split(' ');
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year} ${time?.slice(0, 5) ?? ''}`;
  }
}
