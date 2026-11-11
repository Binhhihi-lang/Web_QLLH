import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {
  ArcElement,
  Chart,
  DoughnutController,
  Legend,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { LatBieuDo } from './dashboard-tinh-toan';

// Đăng ký ĐÚNG phần cần dùng, không `import 'chart.js/auto'`: bản auto kéo cả
// bộ điều khiển (bar, line, radar, bubble…) vào bundle dù dashboard chỉ vẽ
// doughnut. Biểu đồ cột của SCR-03 là CSS thuần nên không cần BarController.
Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

/** Đọc giá trị token màu đang áp dụng (tự đúng ở cả chế độ sáng và tối). */
function docToken(ten: string, duPhong: string): string {
  if (typeof getComputedStyle !== 'function') return duPhong;
  const giaTri = getComputedStyle(document.documentElement).getPropertyValue(ten).trim();
  return giaTri || duPhong;
}

/**
 * Biểu đồ tròn (doughnut) dùng chung cho dashboard.
 *
 * Vì sao bọc Chart.js trong một component: Chart.js thao tác DOM bằng tay,
 * nên nó phải nằm sau khi Angular render xong (`afterRenderEffect`) và phải
 * được huỷ khi component chết — nếu để từng màn tự làm, chín trên mười chỗ
 * quên `destroy()` và canvas rò rỉ sau mỗi lần điều hướng.
 *
 * Màu lấy từ `_tokens.scss` bằng `var(--color-…)` tại thời điểm vẽ. Chart.js
 * không đọc được `var()` nên phải giải mã sang giá trị thật; đổi chế độ
 * sáng/tối thì observer vẽ lại màu, không phải tải lại trang.
 */
@Component({
  selector: 'app-bieu-do-tron',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="khung" [style.height]="chieuCao()">
      <canvas #canvas role="img" [attr.aria-label]="moTa()"></canvas>

      @if (nhanGiua()) {
        <div class="giua" aria-hidden="true">
          <strong>{{ nhanGiua() }}</strong>
          @if (phuGiua()) {
            <small>{{ phuGiua() }}</small>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .khung {
      position: relative;
      width: 100%;
      min-width: 0;
    }

    canvas {
      width: 100% !important;
      height: 100% !important;
    }

    /* Nhãn giữa vòng doughnut — đặt bằng HTML thay vì plugin vẽ canvas để
       chữ theo đúng font và cỡ của design system. */
    .giua {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      /* Chừa chỗ cho chú giải ở đáy để chữ không đè lên chú giải. */
      padding-bottom: 34px;
      text-align: center;
      line-height: 1.2;
    }

    .giua strong {
      font-family: var(--font-heading);
      font-size: 22px;
      font-weight: 700;
      color: var(--color-ink);
      font-variant-numeric: tabular-nums;
    }

    .giua small {
      font-size: var(--text-caption);
      color: var(--color-ink-muted);
      margin-top: 2px;
    }
  `,
})
export class BieuDoTron {
  /** Các lát cần vẽ — đã tính sẵn ở nơi gọi, component không tự suy ra số liệu. */
  readonly lat = input.required<LatBieuDo[]>();
  readonly nhanGiua = input<string>('');
  readonly phuGiua = input<string>('');
  readonly chieuCao = input('220px');
  readonly moTa = input<string>('Biểu đồ tròn');

  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly destroyRef = inject(DestroyRef);
  private bieuDo: Chart<'doughnut'> | null = null;
  private observer: MutationObserver | null = null;

  constructor() {
    // Hình dạng cố định, chỉ dữ liệu và màu đổi → tạo chart một lần rồi cập
    // nhật. Tạo lại mỗi lần dữ liệu về sẽ nháy và mất animation.
    afterRenderEffect(() => {
      const lat = this.lat();
      const canvas = this.canvas()?.nativeElement;
      if (!canvas || lat.length === 0) return;

      // jsdom (môi trường test) không có context 2d — bỏ qua thay vì để
      // Chart.js ném lỗi làm đỏ cả bộ test.
      if (!canvas.getContext('2d')) return;

      if (!this.bieuDo) this.tao(canvas, lat);
      else this.capNhat(lat);
    });

    // Đổi sáng/tối thì token đổi giá trị — vẽ lại màu cho khớp.
    if (typeof MutationObserver !== 'undefined') {
      this.observer = new MutationObserver(() => {
        if (this.bieuDo) this.capNhat(this.lat());
      });
      this.observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    }

    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      this.observer = null;
      this.bieuDo?.destroy();
      this.bieuDo = null;
    });
  }

  private mau(): string[] {
    return this.lat().map((l) => docToken(l.mau, '#366ef2'));
  }

  private tuyChon(): ChartOptions<'doughnut'> {
    const mauChu = docToken('--color-ink-muted', '#475569');

    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '64%',
      animation: { duration: 320 },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: mauChu,
            boxWidth: 9,
            boxHeight: 9,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 12,
            font: { size: 11 },
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const tatCa = ctx.dataset.data as number[];
              const tong = tatCa.reduce((a, b) => a + b, 0);
              const giaTri = Number(ctx.parsed ?? 0);
              const phanTram = tong === 0 ? 0 : Math.round((giaTri / tong) * 1000) / 10;
              return ` ${ctx.label}: ${giaTri} (${phanTram}%)`;
            },
          },
        },
      },
    };
  }

  private tao(canvas: HTMLCanvasElement, lat: LatBieuDo[]): void {
    this.bieuDo = new Chart<'doughnut'>(canvas, {
      type: 'doughnut',
      data: {
        labels: lat.map((l) => l.nhan),
        datasets: [
          {
            data: lat.map((l) => l.gia_tri),
            backgroundColor: this.mau(),
            // Viền cùng màu bề mặt để hai lát cạnh nhau không dính thành
            // một mảng — đổi chế độ tối thì `mau()` cũng đọc lại token.
            borderColor: docToken('--color-surface', '#ffffff'),
            borderWidth: 2,
          },
        ],
      },
      options: this.tuyChon(),
    });
  }

  private capNhat(lat: LatBieuDo[]): void {
    const bieuDo = this.bieuDo;
    if (!bieuDo) return;

    bieuDo.data.labels = lat.map((l) => l.nhan);
    bieuDo.data.datasets[0].data = lat.map((l) => l.gia_tri);
    bieuDo.data.datasets[0].backgroundColor = this.mau();
    bieuDo.options = this.tuyChon();
    bieuDo.update();
  }
}
