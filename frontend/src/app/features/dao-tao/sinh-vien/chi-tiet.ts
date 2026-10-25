import { Component, ElementRef, HostListener, OnInit, afterNextRender, inject, input, output, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SinhVien } from '@core/models/dao-tao.model';
import { SinhVienService } from '@core/services/sinh-vien.service';
import { AppButton } from '@shared/ui/app-button';
import { NgayVnPipe } from '@shared/pipes/ngay-vn.pipe';
import { LoadingState } from '@shared/ui/loading';
import { StatusBadge } from '@shared/ui/status-badge';

/**
 * Ngăn kéo chi tiết sinh viên (SCR-12) — mở khi bấm một dòng ở danh sách.
 *
 * Vì sao dùng ngăn kéo chứ không chuyển trang: người dùng thường liếc nhanh
 * nhiều dòng liên tiếp. Chuyển trang rồi bấm back làm mất vị trí cuộn và mất
 * bộ lọc. Ngăn kéo giữ nguyên danh sách phía sau.
 *
 * Dữ liệu lấy lại từ API theo `id` chứ không dùng dòng đang có: dòng trong bảng
 * là bản rút gọn, có thể thiếu trường mà chi tiết cần.
 */
@Component({
  selector: 'app-sinh-vien-chi-tiet',
  standalone: true,
  imports: [RouterLink, AppButton, LoadingState, NgayVnPipe, StatusBadge],
  template: `
    <div class="nen" (click)="dong.emit()" aria-hidden="true"></div>

    <aside
      #nganKeo
      class="ngan-keo"
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết sinh viên"
      tabindex="-1"
    >
      <header>
        <h2>Chi tiết sinh viên</h2>
        <button type="button" class="dong-nut" (click)="dong.emit()" aria-label="Đóng">
          <span class="material-icons" aria-hidden="true">close</span>
        </button>
      </header>

      <div class="than">
        @if (dangTai()) {
          <app-loading-state label="Đang tải thông tin…" />
        } @else if (loi()) {
          <p class="loi">{{ loi() }}</p>
        } @else if (sv(); as s) {
          <div class="dau">
            <div class="anh" aria-hidden="true">{{ chuDau(s.ho_ten) }}</div>
            <div>
              <h3>{{ s.ho_ten }}</h3>
              <p class="ma">{{ s.ma_sv }}</p>
            </div>
            <app-status-badge
              [value]="s.trang_thai ? 'ACTIVE' : 'INACTIVE'"
              [label]="s.trang_thai ? 'Đang hoạt động' : 'Đã khóa'"
            />
          </div>

          <dl>
            <dt>Email</dt>
            <dd>{{ s.email }}</dd>

            <dt>Điện thoại</dt>
            <dd>{{ s.so_dien_thoai || '—' }}</dd>

            <dt>Ngày sinh</dt>
            <dd>{{ s.ngay_sinh | ngayVn }}</dd>

            <dt>Giới tính</dt>
            <dd>{{ s.gioi_tinh ? 'Nam' : 'Nữ' }}</dd>

            <dt>Lớp hành chính</dt>
            <dd>
              @if (s.lop_hanh_chinh) {
                <a [routerLink]="['/lop-hanh-chinh', s.lop_hanh_chinh.id]">
                  {{ s.lop_hanh_chinh.ten_lop }}
                </a>
              } @else {
                —
              }
            </dd>

            <dt>Địa chỉ</dt>
            <dd>{{ s.dia_chi || '—' }}</dd>
          </dl>
        }
      </div>

      <footer>
        <app-button variant="secondary" (click)="dong.emit()">Đóng</app-button>
        @if (sv(); as s) {
          <app-button variant="primary" [routerLink]="['/sinh-vien', s.id, 'sua']">
            Sửa
          </app-button>
        }
      </footer>
    </aside>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 90;
      display: flex;
      justify-content: flex-end;
    }

    .nen {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.4);
    }

    .ngan-keo {
      position: relative;
      width: 100%;
      max-width: 440px;
      height: 100%;
      background: var(--color-surface);
      box-shadow: -12px 0 40px rgba(15, 23, 42, 0.18);
      display: flex;
      flex-direction: column;
    }

    .ngan-keo:focus {
      outline: none;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-bottom: 1px solid var(--color-border);
    }

    h2 {
      font-size: var(--text-h3);
      font-weight: 600;
      color: var(--color-ink);
    }

    .dong-nut {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: var(--color-ink-subtle);
      cursor: pointer;
      padding: 4px;
      border-radius: var(--radius-sm);
    }

    .dong-nut .material-icons {
      font-size: 18px;
    }

    .dong-nut:hover {
      background: var(--color-surface-alt);
      color: var(--color-ink);
    }

    .than {
      flex: 1;
      overflow-y: auto;
      padding: 18px;
    }

    .dau {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 16px;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--color-border-soft);
    }

    .anh {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: var(--color-primary-soft);
      color: var(--color-on-primary-soft);
      display: grid;
      place-items: center;
      font-weight: 700;
      font-size: 17px;
      flex: none;
    }

    .dau h3 {
      font-size: var(--text-h3);
      font-weight: 600;
      color: var(--color-ink);
    }

    .ma {
      margin: 2px 0 0;
      font-size: var(--text-caption);
      color: var(--color-ink-subtle);
      font-variant-numeric: tabular-nums;
    }

    .dau app-status-badge {
      margin-left: auto;
    }

    dl {
      display: grid;
      grid-template-columns: 128px 1fr;
      gap: 11px 14px;
      margin: 0;
      font-size: var(--text-small);
    }

    dt {
      color: var(--color-ink-muted);
    }

    dd {
      margin: 0;
      color: var(--color-ink);
      overflow-wrap: anywhere;
    }

    dd a {
      color: var(--color-primary);
      text-decoration: none;
    }

    dd a:hover {
      text-decoration: underline;
    }

    .loi {
      color: var(--color-danger);
      font-size: var(--text-small);
    }

    footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 18px;
      border-top: 1px solid var(--color-border);
    }
  `,
})
export class SinhVienChiTiet implements OnInit {
  private readonly service = inject(SinhVienService);

  readonly id = input.required<number>();
  readonly dong = output<void>();

  readonly dangTai = signal(true);
  readonly loi = signal<string | null>(null);
  readonly sv = signal<SinhVien | null>(null);

  private readonly nganKeo = viewChild.required<ElementRef<HTMLElement>>('nganKeo');

  constructor() {
    // Focus vào ngăn kéo khi mở: cần cho trình đọc màn hình và để Escape có chỗ nhận.
    afterNextRender(() => this.nganKeo().nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  khiNhanEscape(): void {
    this.dong.emit();
  }

  chuDau(hoTen: string): string {
    const phan = hoTen.trim().split(/\s+/);
    return (phan[phan.length - 1]?.[0] ?? '?').toUpperCase();
  }

  // Tải trong ngOnInit, KHÔNG trong constructor: constructor chạy trước khi
  // Angular gán input `id`, đọc ở đó sẽ ném NG0950.
  ngOnInit(): void {
    this.tai();
  }

  private tai(): void {
    this.dangTai.set(true);
    this.service.layMot(this.id()).subscribe({
      next: (s) => {
        this.sv.set(s);
        this.dangTai.set(false);
      },
      error: () => {
        this.loi.set('Không tải được thông tin sinh viên.');
        this.dangTai.set(false);
      },
    });
  }
}
