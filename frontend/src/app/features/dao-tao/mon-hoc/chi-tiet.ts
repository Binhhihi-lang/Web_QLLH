import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { MonHoc } from '@core/models/dao-tao.model';
import { AppAlert } from '@shared/ui/app-alert';
import { LoadingState } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';
import { StatusBadge } from '@shared/ui/status-badge';
import { MonHocService } from './mon-hoc.service';

@Component({
  selector: 'app-mon-hoc-chi-tiet',
  standalone: true,
  imports: [RouterLink, AppAlert, LoadingState, PageHeader, StatusBadge],
  template: `
    <app-page-header
      [title]="monHoc()?.ten_mon ?? 'Chi tiết môn học'"
      description="Thông tin chi tiết trong danh mục môn học."
    >
      <a class="nut-quay-lai" routerLink="/mon-hoc">
        <span class="material-icons" aria-hidden="true">arrow_back</span>
        Danh sách môn học
      </a>
      @if (monHoc(); as mon) {
        @if (laAdmin()) {
          <a class="nut-sua" [routerLink]="['/mon-hoc', mon.id, 'sua']">
            <span class="material-icons" aria-hidden="true">edit</span>
            Sửa môn học
          </a>
        }
      }
    </app-page-header>

    @if (dangTai()) {
      <app-loading-state label="Đang tải thông tin môn học…" />
    } @else if (loi()) {
      <app-alert muc="danger" title="Không tải được thông tin môn học">
        {{ loi() }}
        <a routerLink="/mon-hoc">Quay lại danh sách</a>
      </app-alert>
    } @else if (monHoc(); as mon) {
      <section class="khung" aria-label="Thông tin môn học">
        <div class="dau">
          <div class="bieu-tuong" aria-hidden="true">
            <span class="material-icons">menu_book</span>
          </div>
          <div class="nhan-dien">
            <p class="ma-mon">{{ mon.ma_mon }}</p>
            <h2>{{ mon.ten_mon }}</h2>
          </div>
          <app-status-badge
            [value]="mon.trang_thai ? 'ACTIVE' : 'INACTIVE'"
            [label]="mon.trang_thai ? 'Đang hoạt động' : 'Đã khóa'"
          />
        </div>

        <div class="noi-dung">
          <section aria-labelledby="thong-tin-chung">
            <h3 id="thong-tin-chung">Thông tin chung</h3>
            <dl>
              <dt>Mã môn</dt>
              <dd>{{ mon.ma_mon }}</dd>
              <dt>Tên môn học</dt>
              <dd>{{ mon.ten_mon }}</dd>
              <dt>Số tín chỉ</dt>
              <dd>{{ mon.so_tin_chi }} tín chỉ</dd>
              <dt>Trạng thái</dt>
              <dd>{{ mon.trang_thai ? 'Đang hoạt động' : 'Đã khóa' }}</dd>
            </dl>
          </section>

          <section aria-labelledby="mo-ta-mon-hoc">
            <h3 id="mo-ta-mon-hoc">Mô tả</h3>
            <p class="mo-ta">{{ mon.mo_ta || 'Môn học chưa có mô tả.' }}</p>
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

    .ma-mon {
      margin: 0 0 3px;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
      font-variant-numeric: tabular-nums;
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

    dd,
    .mo-ta {
      min-width: 0;
      margin: 0;
      overflow-wrap: anywhere;
      color: var(--color-ink);
      font-size: var(--text-small);
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
export class MonHocChiTiet implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(MonHocService);
  private readonly auth = inject(AuthService);

  readonly monHoc = signal<MonHoc | null>(null);
  readonly dangTai = signal(true);
  readonly loi = signal<string | null>(null);
  readonly laAdmin = computed(() => this.auth.nguoiDung()?.vai_tro === 'ADMIN');

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    const id = Number(rawId);
    if (!rawId || !Number.isInteger(id) || id < 1) {
      this.loi.set('Mã môn học không hợp lệ.');
      this.dangTai.set(false);
      return;
    }

    this.service.layMot(id).subscribe({
      next: (mon) => {
        this.monHoc.set(mon);
        this.dangTai.set(false);
      },
      error: (error: unknown) => {
        this.loi.set(
          error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
            ? error.error.message
            : 'Không tải được thông tin môn học. Kiểm tra kết nối rồi thử lại.',
        );
        this.dangTai.set(false);
      },
    });
  }
}
