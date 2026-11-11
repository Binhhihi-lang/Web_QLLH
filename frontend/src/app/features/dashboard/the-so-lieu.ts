import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { TheSoLieu } from './dashboard.model';
import {
  THOI_LUONG_DEM,
  TRE_MOI_THE,
  dinhDangDemSo,
  giamChuyenDong,
  giaTriDemSo,
  iconTheSoLieu,
  iconXuHuong,
  sacTheSoLieu,
  soChuSoThapPhan,
} from './dashboard-tinh-toan';

/**
 * Một thẻ số liệu của dashboard — dùng CHUNG cho SCR-03/04/05.
 *
 * Vì sao là component riêng chứ không chép markup vào ba màn: hợp đồng buộc ba
 * dashboard dùng cùng shape `the_so_lieu[]` để "trông như một hệ thống"; markup
 * chép ba lần thì chỉ vài tuần là cỡ chữ và khoảng cách lệch nhau, và logic
 * đếm số dưới đây sẽ phải sửa ba chỗ.
 *
 * Icon và màu gắn theo `khoa` (do backend quyết định nghĩa), không theo vị
 * trí — backend đổi thứ tự thẻ thì nghĩa màu vẫn đúng.
 */
@Component({
  selector: 'app-the-so-lieu',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (bamDuoc()) {
      <button type="button" class="the the-bam" [class]="'the-' + sac()" (click)="bam.emit(the())">
        <ng-container *ngTemplateOutlet="than" />
      </button>
    } @else {
      <div class="the" [class]="'the-' + sac()">
        <ng-container *ngTemplateOutlet="than" />
      </div>
    }

    <ng-template #than>
      <div class="the-dau">
        <span class="the-nhan">{{ the().label }}</span>
        <span class="the-icon" aria-hidden="true">
          <span class="material-icons">{{ icon() }}</span>
        </span>
      </div>
      <div class="the-so-lieu">
        <!-- Phần số do hàm vẽ số ghi TRỰC TIẾP vào DOM (xem viewChild oSo).
             aria-hidden vì nó đổi từng khung hình; số cuối nằm ở .sr-only. -->
        <span #oSo aria-hidden="true">{{ hienThi() }}</span>
        @if (the().don_vi) {
          <small>{{ the().don_vi }}</small>
        }
        <span class="sr-only">{{ soCuoi() }} {{ the().don_vi ?? '' }}</span>
      </div>
      <div class="the-phu" [class]="'huong-' + the().xu_huong">
        <span class="material-icons">{{ iconHuong() }}</span>
        {{ the().phu_chu }}
      </div>
    </ng-template>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .material-icons {
      font-size: 18px;
      line-height: 1;
    }

    .the {
      display: block;
      text-align: left;
      font: inherit;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 10px 14px;
      box-shadow: var(--shadow-sm);
      min-width: 0;
      width: 100%;
      height: 100%;
      color: inherit;
    }

    .the-bam {
      cursor: pointer;
      transition:
        border-color var(--dur) var(--ease),
        box-shadow var(--dur) var(--ease),
        transform var(--dur) var(--ease);
    }

    .the-bam:hover {
      border-color: var(--color-primary);
      box-shadow: var(--shadow);
    }

    .the-bam:active {
      transform: translateY(1px);
    }

    .the-bam:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .the-dau {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }

    .the-nhan {
      font-size: var(--text-small);
      font-weight: 500;
      color: var(--color-ink-muted);
    }

    .the-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: var(--radius);
      flex: none;
    }

    .the-icon .material-icons {
      font-size: 19px;
    }

    .the-primary .the-icon {
      background: var(--color-primary-soft);
      color: var(--color-on-primary-soft);
    }

    .the-chart-1 .the-icon {
      background: var(--color-chart-1-soft);
      color: var(--color-on-chart-1-soft);
    }

    .the-chart-2 .the-icon {
      background: var(--color-chart-2-soft);
      color: var(--color-on-chart-2-soft);
    }

    .the-danger .the-icon {
      background: var(--color-danger-soft);
      color: var(--color-on-danger-soft);
    }

    .the-info .the-icon {
      background: var(--color-info-soft);
      color: var(--color-on-info-soft);
    }

    .the-so-lieu {
      font-family: var(--font-heading);
      font-size: 22px;
      font-weight: 700;
      color: var(--color-ink);
      line-height: 1.2;
      margin-top: 4px;
      /* Số chạy từng khung hình: chữ số phải rộng bằng nhau, nếu không cả thẻ
         rung ngang trong lúc đếm. */
      font-variant-numeric: tabular-nums;
    }

    .the-so-lieu small {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-ink-subtle);
      margin-left: 3px;
    }

    .the-phu {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 5px;
      font-size: var(--text-caption);
      font-weight: 600;
      color: var(--color-ink-muted);
    }

    .the-phu .material-icons {
      font-size: 14px;
    }

    .the-phu.huong-len {
      color: var(--color-on-success-soft);
    }

    .the-phu.huong-xuong {
      color: var(--color-on-danger-soft);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
      border: 0;
    }

    @media (max-width: 640px) {
      .the {
        padding: 12px 13px;
      }

      .the-so-lieu {
        font-size: 23px;
      }
    }
  `,
})
export class TheSoLieuCard {
  readonly the = input.required<TheSoLieu>();
  /** Vị trí trong lưới — dùng để trễ so le, không phải để chọn màu. */
  readonly chiSo = input(0, { alias: 'chiSo' });
  /** Thẻ này có bấm được không (theo bảng "Hành vi bấm" của từng vai trò). */
  readonly bamDuoc = input(false);
  readonly bam = output<TheSoLieu>();

  private readonly destroyRef = inject(DestroyRef);

  /** Chuỗi đang hiển thị — chỉ dùng cho trạng thái đầu và trình đọc màn hình. */
  readonly hienThi = signal('0');
  /** Số cuối đã định dạng, cho trình đọc màn hình. */
  readonly soCuoi = signal('0');

  /**
   * Phần tử hiển thị số, ghi TRỰC TIẾP bằng `textContent` trong lúc đếm.
   *
   * Vì sao không ghi vào signal: mỗi khung hình một lần `signal.set` nghĩa là
   * 60 lượt change detection mỗi giây cho MỖI thẻ (4 thẻ = 240 lượt/giây), và
   * mỗi lần ghi lại làm effect chạy lại — effect ấy gọi `huy()`, xoá đúng
   * khung hình vừa xếp. Đã tái hiện: queue có khung, `detectChanges` xoá sạch,
   * số đứng ở 0. Ghi DOM thì không có vòng phản hồi nào để tự huỷ.
   *
   * Chỉ ghi signal ở khung CUỐI (một lần) để giá trị cuối vẫn đi qua change
   * detection và trình đọc màn hình đọc được.
   */
  private readonly oSo = viewChild<ElementRef<HTMLElement>>('oSo');

  private khungHinh: number | null = null;
  private henGio: ReturnType<typeof setTimeout> | null = null;
  /** Giá trị + vị trí lần đếm trước — chặn đếm lại khi input không đổi. */
  private lanCuoi: { giaTri: number; chiSo: number } | null = null;

  readonly sac = () => sacTheSoLieu(this.the().khoa);
  readonly icon = () => iconTheSoLieu(this.the().khoa);
  readonly iconHuong = () => iconXuHuong(this.the());

  constructor() {
    // `effect` + `untracked`: effect chỉ THEO DÕI `the()` và `chiSo()`; mọi lần
    // ghi trong `dem()` nằm ngoài phạm vi theo dõi nên không kích lại chính nó.
    effect(() => {
      const the = this.the();
      const chiSo = this.chiSo();

      if (this.lanCuoi?.giaTri === the.gia_tri && this.lanCuoi.chiSo === chiSo) {
        return;
      }
      this.lanCuoi = { giaTri: the.gia_tri, chiSo };

      untracked(() => this.dem(the.gia_tri, chiSo));
    });

    // Lần render đầu chưa có phần tử DOM; đếm sau khi Angular vẽ xong.
    afterNextRender(() => {
      const the = this.the();
      this.lanCuoi = { giaTri: the.gia_tri, chiSo: this.chiSo() };
      this.dem(the.gia_tri, this.chiSo());
    });

    this.destroyRef.onDestroy(() => this.huy());
  }

  private dem(dich: number, chiSo: number): void {
    this.huy();

    const soLe = soChuSoThapPhan(dich);
    this.soCuoi.set(dinhDangDemSo(dich, soLe));

    const veSo = (chuoi: string) => {
      const el = this.oSo()?.nativeElement;
      if (el) {
        el.textContent = chuoi;
      }
    };

    // Tôn trọng `prefers-reduced-motion`: gán thẳng, không chạy animation.
    if (giamChuyenDong() || typeof requestAnimationFrame !== 'function') {
      this.hienThi.set(this.soCuoi());
      veSo(this.soCuoi());
      return;
    }

    const soKhong = dinhDangDemSo(0, soLe);
    this.hienThi.set(soKhong);
    veSo(soKhong);

    const batDau = () => {
      // `performance.now()` cùng gốc thời gian với mốc `rAF`, nên độ trễ so le
      // tính bằng ms cộng vào mốc bắt đầu là đủ.
      const mocBatDau = performance.now();
      const buoc = (luc: number) => {
        const tienDo = Math.min(1, (luc - mocBatDau) / THOI_LUONG_DEM);

        if (tienDo < 1) {
          // Ghi DOM, KHÔNG ghi signal — xem chú thích ở `oSo`.
          veSo(dinhDangDemSo(giaTriDemSo(0, dich, tienDo), soLe));
          this.khungHinh = requestAnimationFrame(buoc);
          return;
        }
        // Khung cuối có thể lệch làm tròn — gán đích danh giá trị thật, và
        // đồng bộ signal một lần để template/ARIA khớp với DOM.
        veSo(this.soCuoi());
        this.hienThi.set(this.soCuoi());
        this.khungHinh = null;
      };
      this.khungHinh = requestAnimationFrame(buoc);
    };

    this.henGio = setTimeout(batDau, chiSo * TRE_MOI_THE);
  }

  /** Huỷ cả hẹn giờ lẫn khung hình — nếu không, callback chạy trên component đã chết. */
  private huy(): void {
    if (this.henGio !== null) {
      clearTimeout(this.henGio);
      this.henGio = null;
    }
    if (this.khungHinh !== null) {
      cancelAnimationFrame(this.khungHinh);
      this.khungHinh = null;
    }
  }
}
