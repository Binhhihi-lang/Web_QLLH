import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { GiangVienHoSo } from '@core/models/dao-tao.model';
import { GiangVienService } from '@core/services/giang-vien.service';
import { AppAlert } from '@shared/ui/app-alert';
import { LoadingState } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';
import { StatusBadge } from '@shared/ui/status-badge';

@Component({
  selector: 'app-giang-vien-chi-tiet',
  standalone: true,
  imports: [RouterLink, AppAlert, LoadingState, PageHeader, StatusBadge],
  template: `
    <app-page-header
      title="Chi tiết giảng viên"
      [description]="
        laAdmin() ? 'Thông tin hồ sơ và tài khoản giảng viên.' : 'Thông tin liên hệ của giảng viên.'
      "
    >
      <a class="nut-quay-lai" routerLink="/giang-vien">
        <span class="material-icons" aria-hidden="true">arrow_back</span>
        Danh sách giảng viên
      </a>
      @if (coTheSua() && giangVien(); as gv) {
        <a class="nut-sua" [routerLink]="['/giang-vien', gv.id, 'sua']">
          <span class="material-icons" aria-hidden="true">edit</span>
          Sửa hồ sơ
        </a>
      }
    </app-page-header>

    @if (dangTai()) {
      <app-loading-state label="Đang tải thông tin giảng viên…" />
    } @else if (loi()) {
      <app-alert muc="danger" title="Không tải được thông tin giảng viên">
        {{ loi() }}
        <a routerLink="/giang-vien">Quay lại danh sách</a>
      </app-alert>
    } @else if (giangVien(); as gv) {
      <section class="khung" aria-label="Hồ sơ giảng viên">
        <div class="dau">
          @if (gv.avatar_url) {
            <img class="anh" [src]="gv.avatar_url" alt="" />
          } @else {
            <div class="anh anh-chu" aria-hidden="true">{{ chuDau(gv.ho_ten) }}</div>
          }
          <div class="nhan-dien">
            <h2>{{ gv.ho_ten }}</h2>
            <p>{{ gv.ma_gv }}</p>
          </div>
          @if (gv.trang_thai !== undefined) {
            <app-status-badge
              [value]="gv.trang_thai ? 'ACTIVE' : 'INACTIVE'"
              [label]="gv.trang_thai ? 'Đang hoạt động' : 'Đã khóa'"
            />
          }
        </div>

        <div class="noi-dung">
          <section aria-labelledby="thong-tin-lien-he">
            <h3 id="thong-tin-lien-he">Thông tin liên hệ</h3>
            <dl>
              <dt>Email đăng nhập</dt>
              <dd>{{ gv.email }}</dd>
              <dt>Số điện thoại</dt>
              <dd>{{ gv.so_dien_thoai || 'Chưa cập nhật' }}</dd>
            </dl>
          </section>

          <!-- Sinh viên chỉ nhận khối liên hệ: không có ngành/trạng thái, ẩn cả mục. -->
          @if (gv.trang_thai !== undefined || gv.nganh !== undefined) {
            <section aria-labelledby="thong-tin-cong-tac">
              <h3 id="thong-tin-cong-tac">Thông tin công tác</h3>
              <dl>
                <dt>Ngành</dt>
                <dd>{{ gv.nganh?.ten_nganh || 'Chưa phân ngành' }}</dd>
                @if (gv.trang_thai !== undefined) {
                  <dt>Trạng thái tài khoản</dt>
                  <dd>{{ gv.trang_thai ? 'Đang hoạt động' : 'Đã khóa' }}</dd>
                }
              </dl>
            </section>
          }
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

    .nut-quay-lai {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
      font-weight: 600;
      text-decoration: none;
    }

    .nut-quay-lai:hover {
      color: var(--color-primary);
    }

    .nut-quay-lai .material-icons,
    .nut-sua .material-icons {
      font-size: 18px;
    }

    .nut-sua {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: var(--radius);
      background: var(--color-primary);
      color: var(--color-on-primary);
      font-size: var(--text-small);
      font-weight: 600;
      text-decoration: none;
    }

    .nut-sua:hover {
      filter: brightness(0.95);
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

    .anh {
      width: 56px;
      height: 56px;
      flex: none;
      border-radius: 50%;
      object-fit: cover;
    }

    .anh-chu {
      display: grid;
      place-items: center;
      background: var(--color-primary-soft);
      color: var(--color-on-primary-soft);
      font-size: var(--text-h2);
      font-weight: 700;
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

    .nhan-dien p {
      margin: 3px 0 0;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
      font-variant-numeric: tabular-nums;
    }

    .noi-dung {
      display: grid;
      gap: 22px;
      padding: 22px;
    }

    h3 {
      margin-bottom: 12px;
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
export class GiangVienChiTiet implements OnInit {
  private readonly service = inject(GiangVienService);
  private readonly auth = inject(AuthService);

  readonly id = input.required<number>();
  readonly dangTai = signal(true);
  readonly loi = signal<string | null>(null);
  readonly giangVien = signal<GiangVienHoSo | null>(null);

  readonly laAdmin = computed(() => this.auth.nguoiDung()?.vai_tro === 'ADMIN');

  /**
   * `withComponentInputBinding()` gắn tham số route vào input mà **không ép kiểu**,
   * nên `id` là chuỗi lúc chạy dù khai báo là `number`. So sánh trực tiếp với
   * `ho_so.id` (số) sẽ luôn sai — phải đổi về số trước.
   */
  private readonly idSo = computed(() => Number(this.id()));

  /**
   * Nút Sửa chỉ hiện với ADMIN, hoặc giảng viên đang xem hồ sơ của chính mình
   * (khớp `roleGuard` `ownTeacherProfile` của route `/giang-vien/:id/sua`).
   */
  readonly coTheSua = computed(() => {
    if (this.laAdmin()) return true;
    const toi = this.auth.nguoiDung();
    return (
      toi?.vai_tro === 'GIANG_VIEN' &&
      toi.ho_so?.loai === 'giang_vien' &&
      toi.ho_so.id === this.idSo()
    );
  });

  ngOnInit(): void {
    this.service.layMotLienHe(this.idSo()).subscribe({
      next: (gv) => {
        this.giangVien.set(gv);
        this.dangTai.set(false);
      },
      error: () => {
        this.loi.set('Không tải được thông tin giảng viên. Kiểm tra kết nối rồi thử lại.');
        this.dangTai.set(false);
      },
    });
  }

  chuDau(hoTen: string): string {
    const phan = hoTen.trim().split(/\s+/);
    return (phan[phan.length - 1]?.[0] ?? '?').toUpperCase();
  }
}
