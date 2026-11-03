import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Khoa } from '@core/models/dao-tao.model';
import { KhoaNganhService } from '@core/services/khoa-nganh.service';
import { AppAlert } from '@shared/ui/app-alert';
import { LoadingState } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';
import { StatusBadge } from '@shared/ui/status-badge';

@Component({
  selector: 'app-khoa-chi-tiet',
  standalone: true,
  imports: [AppAlert, LoadingState, PageHeader, RouterLink, StatusBadge],
  template: `
    <app-page-header
      [title]="khoa()?.ten_khoa ?? 'Chi tiết khoa'"
      description="Thông tin chi tiết trong danh mục khoa."
    >
      <a class="nut nut-phu" routerLink="/khoa">
        <span class="material-icons" aria-hidden="true">arrow_back</span>
        Danh sách khoa
      </a>
      @if (khoa(); as item) {
        <a class="nut nut-chinh" [routerLink]="['/khoa', item.id, 'sua']">
          <span class="material-icons" aria-hidden="true">edit</span>
          Sửa khoa
        </a>
      }
    </app-page-header>

    @if (dangTai()) {
      <app-loading-state label="Đang tải thông tin khoa…" />
    } @else if (loi()) {
      <app-alert muc="danger" title="Không tải được thông tin khoa">
        {{ loi() }}
        <a routerLink="/khoa">Quay lại danh sách</a>
      </app-alert>
    } @else if (khoa(); as item) {
      <section class="khung" aria-label="Thông tin khoa">
        <div class="dau">
          <div class="bieu-tuong" aria-hidden="true">
            <span class="material-icons">account_balance</span>
          </div>
          <div class="nhan-dien">
            <p class="ma">{{ item.ma_khoa }}</p>
            <h2>{{ item.ten_khoa }}</h2>
          </div>
          <app-status-badge
            [value]="item.trang_thai ? 'ACTIVE' : 'INACTIVE'"
            [label]="item.trang_thai ? 'Đang hoạt động' : 'Đã khóa'"
          />
        </div>

        <div class="noi-dung">
          <section aria-labelledby="thong-tin-chung">
            <h3 id="thong-tin-chung">Thông tin chung</h3>
            <dl>
              <dt>Mã khoa</dt>
              <dd>{{ item.ma_khoa }}</dd>
              <dt>Tên khoa</dt>
              <dd>{{ item.ten_khoa }}</dd>
              <dt>Số ngành trực thuộc</dt>
              <dd>{{ item.so_nganh }}</dd>
              <dt>Trạng thái</dt>
              <dd>{{ item.trang_thai ? 'Đang hoạt động' : 'Đã khóa' }}</dd>
            </dl>
          </section>

          <section aria-labelledby="mo-ta-khoa">
            <h3 id="mo-ta-khoa">Mô tả</h3>
            <p class="mo-ta">{{ item.mo_ta || 'Khoa chưa có mô tả.' }}</p>
          </section>
        </div>
      </section>
    }
  `,
  styles: `
    :host { display: block; max-width: 1040px; margin: 0 auto; }
    .nut {
      display: inline-flex; min-height: 40px; align-items: center; gap: 6px;
      padding: 8px 12px; border-radius: var(--radius); font-size: var(--text-small);
      font-weight: 600; text-decoration: none;
    }
    .nut-phu { color: var(--color-ink-muted); }
    .nut-phu:hover { background: var(--color-surface-alt); color: var(--color-ink); }
    .nut-chinh { background: var(--color-primary); color: var(--color-on-primary); }
    .nut-chinh:hover { filter: brightness(.95); }
    .nut:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
    .nut .material-icons { font-size: 18px; }
    .khung {
      max-width: 880px; overflow: hidden; border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); background: var(--color-surface);
    }
    .dau { display: flex; align-items: center; gap: 14px; padding: 22px; border-bottom: 1px solid var(--color-border); }
    .bieu-tuong {
      display: grid; width: 56px; height: 56px; flex: none; place-items: center;
      border-radius: var(--radius-lg); background: var(--color-primary-soft); color: var(--color-on-primary-soft);
    }
    .bieu-tuong .material-icons { font-size: 28px; }
    .nhan-dien { min-width: 0; flex: 1; }
    .nhan-dien h2 { overflow-wrap: anywhere; color: var(--color-ink); font-size: var(--text-h2); font-weight: 600; }
    .ma { margin: 0 0 3px; color: var(--color-ink-muted); font-size: var(--text-small); font-variant-numeric: tabular-nums; }
    .noi-dung { display: grid; gap: 24px; padding: 22px; }
    h3 { margin: 0 0 12px; color: var(--color-ink); font-size: var(--text-h3); font-weight: 600; }
    dl { display: grid; grid-template-columns: minmax(140px, .7fr) minmax(0, 1.3fr); gap: 12px 18px; margin: 0; font-size: var(--text-small); }
    dt { color: var(--color-ink-muted); }
    dd, .mo-ta { min-width: 0; margin: 0; overflow-wrap: anywhere; color: var(--color-ink); }
    .mo-ta { line-height: 1.7; white-space: pre-wrap; }
    @media (max-width: 600px) {
      .dau, .noi-dung { padding: 16px; }
      .dau { flex-wrap: wrap; }
      dl { grid-template-columns: minmax(0, 1fr); gap: 5px; }
      dd { margin-bottom: 9px; }
    }
  `,
})
export class KhoaChiTiet {
  private readonly service = inject(KhoaNganhService);
  private readonly route = inject(ActivatedRoute);

  readonly dangTai = signal(true);
  readonly loi = signal('');
  readonly khoa = signal<Khoa | null>(null);

  constructor() {
    const rawId = this.route.snapshot.paramMap.get('id');
    const id = rawId === null ? NaN : Number(rawId);
    if (!Number.isInteger(id) || id < 1) {
      this.dangTai.set(false);
      this.loi.set('Mã khoa không hợp lệ.');
      return;
    }

    this.service.layKhoa(id).subscribe({
      next: (khoa) => {
        this.khoa.set(khoa);
        this.dangTai.set(false);
      },
      error: (error: unknown) => {
        this.loi.set(this.thongBaoLoi(error));
        this.dangTai.set(false);
      },
    });
  }

  private thongBaoLoi(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return 'Không thể tải thông tin khoa. Kiểm tra kết nối rồi thử lại.';
  }
}
