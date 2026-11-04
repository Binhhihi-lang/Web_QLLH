import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { PhongHoc } from '@core/models/dao-tao.model';
import { AppAlert } from '@shared/ui/app-alert';
import { LoadingState } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';
import { StatusBadge } from '@shared/ui/status-badge';
import { PhongHocService } from './phong-hoc.service';

@Component({
  selector: 'app-phong-hoc-chi-tiet',
  standalone: true,
  imports: [RouterLink, AppAlert, LoadingState, PageHeader, StatusBadge],
  template: `
    <app-page-header
      [title]="phongHoc()?.ten_phong ?? 'Chi tiết phòng học'"
      description="Thông tin chi tiết trong danh mục phòng học."
    >
      <a class="nut-quay-lai" routerLink="/phong-hoc">
        <span class="material-icons" aria-hidden="true">arrow_back</span>
        Danh sách phòng học
      </a>
      @if (phongHoc(); as phong) {
        @if (laAdmin()) {
          <a class="nut-sua" [routerLink]="['/phong-hoc', phong.id, 'sua']">
            <span class="material-icons" aria-hidden="true">edit</span>
            Sửa phòng học
          </a>
        }
      }
    </app-page-header>

    @if (dangTai()) {
      <app-loading-state label="Đang tải thông tin phòng học…" />
    } @else if (loi()) {
      <app-alert muc="danger" title="Không tải được thông tin phòng học">
        {{ loi() }}
        <a routerLink="/phong-hoc">Quay lại danh sách</a>
      </app-alert>
    } @else if (phongHoc(); as phong) {
      <section class="khung" aria-label="Thông tin phòng học">
        <div class="dau">
          <div class="bieu-tuong" aria-hidden="true">
            <span class="material-icons">meeting_room</span>
          </div>
          <div class="nhan-dien">
            <p class="ma-phong">{{ phong.ma_phong }}</p>
            <h2>{{ phong.ten_phong }}</h2>
          </div>
          <app-status-badge
            [value]="phong.trang_thai ? 'ACTIVE' : 'INACTIVE'"
            [label]="phong.trang_thai ? 'Đang hoạt động' : 'Đã khóa'"
          />
        </div>

        <div class="noi-dung">
          <section aria-labelledby="thong-tin-chung-phong">
            <h3 id="thong-tin-chung-phong">Thông tin chung</h3>
            <dl>
              <dt>Mã phòng</dt>
              <dd>{{ phong.ma_phong }}</dd>
              <dt>Tên phòng</dt>
              <dd>{{ phong.ten_phong }}</dd>
              <dt>Sức chứa</dt>
              <dd>{{ phong.suc_chua }} chỗ</dd>
              <dt>Trạng thái</dt>
              <dd>{{ phong.trang_thai ? 'Đang hoạt động' : 'Đã khóa' }}</dd>
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

    .ma-phong {
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

    dd {
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
export class PhongHocChiTiet implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(PhongHocService);
  private readonly auth = inject(AuthService);

  readonly phongHoc = signal<PhongHoc | null>(null);
  readonly dangTai = signal(true);
  readonly loi = signal<string | null>(null);
  readonly laAdmin = computed(() => this.auth.nguoiDung()?.vai_tro === 'ADMIN');

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    const id = Number(rawId);
    if (!rawId || !Number.isInteger(id) || id < 1) {
      this.loi.set('Mã phòng học không hợp lệ.');
      this.dangTai.set(false);
      return;
    }

    this.service.layMot(id).subscribe({
      next: (phong) => {
        this.phongHoc.set(phong);
        this.dangTai.set(false);
      },
      error: (error: unknown) => {
        this.loi.set(
          error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
            ? error.error.message
            : 'Không tải được thông tin phòng học. Kiểm tra kết nối rồi thử lại.',
        );
        this.dangTai.set(false);
      },
    });
  }
}
