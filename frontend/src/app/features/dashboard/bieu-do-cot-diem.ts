import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  CotDiemMon,
  DIEM_TOI_DA,
  VACH_TRUC_DIEM,
  chieuCaoCotDiem,
  chuoiDiemSvg,
  doanDuongTrungBinh,
  moTaBieuDoCot,
  nhanDiemTrenCot,
  toaDoDiemCuaCot,
} from './dashboard-tinh-toan';

/**
 * Một cột của biểu đồ cột điểm: nhãn môn + điểm của nó + (tuỳ chọn) điểm TB lớp.
 * `null` ở bất kỳ trường điểm nào nghĩa là "chưa chấm" — hiện "—", không vẽ.
 */
export interface DuLieuCotDiem extends CotDiemMon {
  diem_tb_lop?: number | null;
}

/**
 * Biểu đồ cột điểm thang 10 — dùng cho SCR-05 (điểm từng môn + đường TB lớp)
 * và SCR-04 (chỉ cột điểm TB lớp phụ trách).
 *
 * Vẽ bằng HTML + SVG chứ KHÔNG dùng Chart.js:
 * - Trục dọc phải CỐ ĐỊNH 0–10 (không co theo dữ liệu). Chart.js mặc định co
 *   trục theo min/max dữ liệu, và ép cố định thì vẫn phải tự viết plugin cho
 *   đường "có quầng" — nhiều code hơn là vẽ tay.
 * - Đường TB cần hai polyline chồng (quầng rộng vẽ dưới, nét mảnh vẽ trên) để
 *   không chìm vào cột. SVG làm việc này trong ba dòng.
 * - Nhãn môn 2 dòng + ellipsis dưới cột là việc của CSS, không phải canvas.
 *
 * Biểu đồ doughnut (bieu-do-tron.ts) vẫn dùng Chart.js vì cung tròn + chú giải
 * tự động ở đó đáng giá.
 */
@Component({
  selector: 'app-bieu-do-cot-diem',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bieu-do">
      <div class="cot-diem">
        <div class="truc-y" aria-hidden="true">
          @for (v of vach(); track v) {
            <span>{{ v }}</span>
          }
        </div>

        <!-- Vùng cuộn ngang khi quá 8 cột. Bề rộng tối thiểu tính từ số cột ×
             56px (quy ước: cột không nhỏ hơn 56px); ít cột thì lấp đầy khung. -->
        <div class="khung-cuon">
          <div class="khung-cot" [style.min-width.px]="beRongToiThieu()">
            <div class="luoi-ngang" aria-hidden="true">
              @for (v of vach(); track v; let cuoi = $last) {
                <div [class.vach-day]="cuoi" [style.top.%]="viTriVach(v)"></div>
              }
            </div>

            @if (duongTrungBinh().length > 0) {
              <svg
                class="duong-tb"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
                focusable="false"
              >
                @for (doan of duongTrungBinh(); track $index) {
                  <!-- Quầng vẽ TRƯỚC để nằm dưới: nét màu đường trên quầng sáng
                       luôn đọc được dù cột bên dưới là màu gì. -->
                  <polyline class="quang" [attr.points]="chuoi(doan)" />
                  <polyline class="net" [attr.points]="chuoi(doan)" />
                }
              </svg>
            }

            @if (chamTrenDuong().length > 0) {
              <div class="diem-tb" aria-hidden="true">
                @for (toaDo of chamTrenDuong(); track $index) {
                  <span [style.left.%]="toaDo.x" [style.top.%]="toaDo.y"></span>
                }
              </div>
            }

            <div class="cac-cot">
              @for (c of cot(); track $index; let i = $index) {
                <div
                  class="nhom-cot"
                  [style.--cao.%]="cao(c)"
                  [style.--cao-nhan.%]="caoNhan(c)"
                  tabindex="0"
                >
                  @if (c.gia_tri !== null) {
                    <span class="diem-tren">{{ nhan(c) }}</span>
                  }
                  @if (c.gia_tri !== null) {
                    <div class="thanh-cot" [style.animation-delay.ms]="60 + i * 80"></div>
                  } @else {
                    <span class="chua-cham">—</span>
                  }
                  <span class="ten-mon" [title]="c.ten_day_du">{{ c.nhan }}</span>

                  <!-- Khối tooltip khi trỏ con trỏ vào điểm -->
                  <div class="khoi-tooltip" role="tooltip">
                    <div class="tt-ten-mon">{{ c.ten_day_du || c.nhan }}</div>
                    <div class="tt-dong">
                      <span class="cham cham-ban"></span>
                      <span class="tt-nhan">{{
                        hienTrungBinh() ? 'Điểm của bạn:' : 'Điểm TB lớp học phần:'
                      }}</span>
                      <strong class="tt-gia-tri">{{
                        c.gia_tri !== null ? nhan(c) : 'Chưa có'
                      }}</strong>
                    </div>
                    @if (hienTrungBinh() && c.diem_tb_lop !== undefined) {
                      <div class="tt-dong">
                        <span class="cham cham-lop"></span>
                        <span class="tt-nhan">Điểm TB lớp học phần:</span>
                        <strong class="tt-gia-tri">{{
                          c.diem_tb_lop !== null ? nhanTb(c.diem_tb_lop) : 'Chưa có'
                        }}</strong>
                      </div>
                    }
                    <div class="tt-tam-giac"></div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <p class="sr-only">{{ moTa() }}</p>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .bieu-do {
      --cao-vung: 175px;
      margin-top: 4px;
    }

    /* Hai cột: nhãn trục (hẹp) + vùng vẽ. Chiều cao hai phần phải bằng nhau —
       cùng nhận từ --cao-vung. */
    .cot-diem {
      display: grid;
      grid-template-columns: 26px minmax(0, 1fr);
      gap: 0 8px;
    }

    .truc-y {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: var(--cao-vung);
      font-size: var(--text-caption);
      color: var(--color-ink-subtle);
      font-variant-numeric: tabular-nums;
      text-align: right;
    }

    /* Quá 8 cột thì cuộn ngang TRONG khối, không đẩy cả trang tràn.
       overflow-y: visible KHÔNG có tác dụng khi trục x là auto — trình duyệt
       ép nó thành auto, biến khung thành vùng cắt cả hai trục. Tooltip vì thế
       phải tự chặn toạ độ dọc, xem .khoi-tooltip bên dưới. */
    .khung-cuon {
      overflow-x: auto;
      overflow-y: clip;
      min-width: 0;
      /* Đệm trên giữ nhãn số của cột cao 100% (nằm ở toạ độ -20px so với đỉnh
         vùng vẽ) không bị cắt; đệm dưới giữ nhãn môn 2 dòng. */
      padding-top: 24px;
      padding-bottom: 44px;
    }

    .khung-cot {
      position: relative;
      height: var(--cao-vung);
      min-width: 0;
    }

    .luoi-ngang {
      position: absolute;
      inset: 0;
      z-index: 0;
    }

    .luoi-ngang > div {
      position: absolute;
      left: 0;
      right: 0;
      border-top: 1px solid var(--color-border-soft);
    }

    .luoi-ngang > div.vach-day {
      border-top-color: var(--color-border);
    }

    /* Đường trung bình & các chấm trung bình có z-index > .thanh-cot (z-index: 1)
       để luôn nổi trên thân cột điểm, không bao giờ bị cột điểm che khuất. */
    .duong-tb {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 3;
      pointer-events: none;
      overflow: visible;
    }

    .duong-tb polyline {
      fill: none;
      stroke-linejoin: round;
      stroke-linecap: round;
      /* Toạ độ SVG là 0–100 kéo giãn theo khung; nếu không có dòng này nét
         cũng bị kéo giãn và dày mỏng khác nhau ở cột đầu và cột cuối. */
      vector-effect: non-scaling-stroke;
    }

    .duong-tb .quang {
      stroke: var(--color-diem-quang);
      stroke-width: 9;
    }

    .duong-tb .net {
      stroke: var(--color-diem-duong);
      stroke-width: 2.5;
    }

    .diem-tb {
      position: absolute;
      inset: 0;
      z-index: 4;
      pointer-events: none;
    }

    .diem-tb span {
      position: absolute;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--color-diem-duong);
      border: 2px solid var(--color-diem-quang);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
      transform: translate(-50%, -50%);
    }

    /* .cac-cot và .nhom-cot KHÔNG đặt z-index để các con (.thanh-cot z-index: 1,
       .diem-tren z-index: 5, .khoi-tooltip z-index: 50) xếp tầng trực tiếp cùng
       .duong-tb (z-index: 3) và .diem-tb (z-index: 4).
       gap: 0; padding: 0 để tâm cột thứ i khớp tuyệt đối với ((i + 0.5) / N) * 100%. */
    .cac-cot {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      gap: 0;
      padding: 0;
    }

    .nhom-cot {
      position: relative;
      flex: 1;
      /* Quy ước: quá 8 cột thì cột không nhỏ hơn 56px và khối cuộn ngang —
         cột hẹp hơn nữa thì nhãn môn thành một cột chữ dọc không đọc được. */
      min-width: 56px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      cursor: pointer;
    }

    .nhom-cot:hover .thanh-cot,
    .nhom-cot:focus-visible .thanh-cot {
      filter: brightness(1.12);
      transform: scaleY(1.02);
      transform-origin: bottom;
    }

    /* ---- Tooltip con trỏ trỏ tới điểm ---- */
    /*
     * '.khung-cuon' buộc phải cuộn ngang khi > 8 cột, và trình duyệt biến nó
     * thành vùng CẮT cả hai trục. Tooltip neo theo 'bottom' của cột nên cột
     * cao (điểm 10) đẩy nó lên trên mép khung và bị cắt (đo 2026-11-11: mất
     * 11px, cột cao hơn mất nhiều hơn).
     *
     * Cách chữa: chặn 'bottom' bằng 'min(...)'. '100%' là chiều cao '.nhom-cot'
     * (175px, hoặc 160px ở ≤ 640px); trừ đi '--tt-cao' (chiều cao dự phòng lớn
     * nhất của khối) để mép TRÊN của tooltip không bao giờ vượt mép trên cột.
     * Nhờ vậy tooltip luôn nằm trọn trong khung, không phụ thuộc số dòng.
     */
    .khoi-tooltip {
      /* Chiều cao LỚN NHẤT đo được của khối (tên 2 dòng + 2 dòng số, 2026-11-11)
         là 88px; lấy 92px để chừa 4px. Tên môn bị kẹp 2 dòng qua tt-ten-mon
         nên đây là chặn trên thật, không phải ước lượng. */
      --tt-cao: 92px;
      --tt-x: translateX(-50%);
      position: absolute;
      bottom: min(
        calc(var(--cao-nhan, var(--cao)) + 24px),
        calc(100% - var(--tt-cao))
      );
      left: 50%;
      transform: var(--tt-x) translateY(4px);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      padding: 8px 12px;
      min-width: 175px;
      max-width: 210px;
      white-space: nowrap;
      z-index: 50;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s;
    }

    /*
     * Hai cột SÁT MÉP và hai cột KỀ MÉP: dán tooltip vào mép cột thay vì căn
     * giữa. Căn giữa đẩy nửa tooltip (~105px) ra ngoài khung: ở 390px đó là
     * tràn viewport, ở 1440px nó làm 'scrollWidth' của khung-cuon lớn hơn
     * 'clientWidth' → sinh thanh cuộn ngang vô nghĩa dù không có cột nào bị
     * che. Cột giữa có hàng xóm hai bên nên căn giữa vẫn nằm trọn trong khung.
     * Thứ tự quan trọng: quy tắc mép PHẢI đặt sau mép TRÁI để thắng khi lưới
     * chỉ có 1–2 cột.
     */
    .nhom-cot:first-child .khoi-tooltip,
    .nhom-cot:nth-child(2) .khoi-tooltip {
      left: 0;
      right: auto;
      --tt-x: translateX(0);
    }

    .nhom-cot:last-child .khoi-tooltip,
    .nhom-cot:nth-last-child(2) .khoi-tooltip {
      left: auto;
      right: 0;
      --tt-x: translateX(0);
    }

    /* Chỉ một cột: không mép nào để bám, căn giữa vẫn vừa khung. */
    .nhom-cot:only-child .khoi-tooltip {
      left: 50%;
      right: auto;
      --tt-x: translateX(-50%);
    }

    /* Đuôi nhọn trỏ về đúng tâm cột khi tooltip đã dán mép. */
    .nhom-cot:first-child .tt-tam-giac,
    .nhom-cot:nth-child(2) .tt-tam-giac {
      left: 30px;
    }

    .nhom-cot:last-child .tt-tam-giac,
    .nhom-cot:nth-last-child(2) .tt-tam-giac {
      left: auto;
      right: 30px;
    }

    .nhom-cot:only-child .tt-tam-giac {
      left: 50%;
      right: auto;
    }

    .nhom-cot:hover .khoi-tooltip,
    .nhom-cot:focus-visible .khoi-tooltip {
      opacity: 1;
      visibility: visible;
      transform: var(--tt-x) translateY(0);
    }

    .tt-ten-mon {
      font-size: var(--text-caption);
      font-weight: 700;
      color: var(--color-ink);
      margin-bottom: 5px;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--color-border-soft);
      white-space: normal;
      max-width: 186px;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .tt-dong {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: var(--text-caption);
      color: var(--color-ink-muted);
      line-height: 1.45;
    }

    .tt-dong + .tt-dong {
      margin-top: 3px;
    }

    .cham-ban {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-diem-cot);
      flex: none;
    }

    .cham-lop {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-diem-duong);
      flex: none;
    }

    .tt-gia-tri {
      margin-left: auto;
      font-variant-numeric: tabular-nums;
      color: var(--color-ink);
      font-weight: 700;
    }

    .tt-tam-giac {
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border-width: 5px;
      border-style: solid;
      border-color: var(--color-border) transparent transparent transparent;
    }
    .diem-tren {
      position: absolute;
      top: calc((100% - var(--cao-nhan, var(--cao))) - 20px);
      z-index: 5;
      padding: 0 3px;
      border-radius: 3px;
      background: color-mix(in srgb, var(--color-surface) 85%, transparent);
      font-size: var(--text-caption);
      font-weight: 700;
      color: var(--color-ink);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      pointer-events: none;
    }

    .thanh-cot {
      position: relative;
      z-index: 1;
      width: calc(100% - 14px);
      max-width: 52px;
      height: 0;
      background: var(--color-diem-cot);
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      animation: cot-moc-diem 900ms var(--ease-out) forwards;
    }

    @keyframes cot-moc-diem {
      from {
        height: 0;
      }
      to {
        height: var(--cao);
      }
    }

    .chua-cham {
      font-size: var(--text-caption);
      color: var(--color-ink-subtle);
    }

    /* Nhãn môn: 2 dòng rồi ellipsis, tên đầy đủ ở title. Đặt tuyệt đối dưới
       đáy cột để không chen vào chiều cao cột. */
    .ten-mon {
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 6px);
      max-width: 96px;
      margin-top: 7px;
      font-size: var(--text-caption);
      font-weight: 600;
      line-height: 1.25;
      color: var(--color-ink);
      text-align: center;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      overflow-wrap: anywhere;
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

    /* Người dùng bật giảm chuyển động: cột hiện thẳng ở chiều cao cuối. */
    @media (prefers-reduced-motion: reduce) {
      .thanh-cot {
        animation: none;
        height: var(--cao);
      }
    }

    @media (max-width: 640px) {
      .bieu-do {
        --cao-vung: 160px;
      }
    }
  `,
})
export class BieuDoCotDiem {
  readonly cot = input.required<DuLieuCotDiem[]>();
  /**
   * Hiện đường nối điểm TB lớp. SCR-04 (điểm TB lớp phụ trách) không có chuỗi
   * thứ hai nên không bật.
   */
  readonly hienTrungBinh = input(false);

  readonly vach = () => VACH_TRUC_DIEM;

  readonly duongTrungBinh = computed(() =>
    this.hienTrungBinh()
      ? doanDuongTrungBinh(this.cot().map((c) => c.diem_tb_lop ?? null))
      : [],
  );

  /**
   * Tọa độ mọi chấm điểm TB lớp có giá trị (kể cả khi môn kế bên chưa có điểm
   * nên chưa nối thành đoạn thẳng).
   */
  readonly chamTrenDuong = computed(() => {
    if (!this.hienTrungBinh()) return [];
    const ds = this.cot();
    return ds
      .map((c, i) => toaDoDiemCuaCot(i, ds.length, c.diem_tb_lop ?? null))
      .filter((d): d is { x: number; y: number } => d !== null);
  });

  /** Quá 8 cột thì mỗi cột giữ tối thiểu 56px và khối cuộn ngang. */
  readonly beRongToiThieu = computed(() => Math.max(0, this.cot().length) * 56);

  viTriVach(v: number): number {
    return ((DIEM_TOI_DA - v) / DIEM_TOI_DA) * 100;
  }

  cao(c: DuLieuCotDiem): number {
    return chieuCaoCotDiem(c.gia_tri);
  }

  /**
   * Đẩy nhãn số trên đầu cột lên trên chấm TB lớp nếu hai điểm gần nhau,
   * tránh chữ đè lên chấm tròn của đường trung bình.
   */
  caoNhan(c: DuLieuCotDiem): number {
    const caoCot = chieuCaoCotDiem(c.gia_tri);
    if (!this.hienTrungBinh() || c.diem_tb_lop === null || c.diem_tb_lop === undefined) {
      return caoCot;
    }
    const caoTb = chieuCaoCotDiem(c.diem_tb_lop);
    if (caoTb >= caoCot - 4 && caoTb <= caoCot + 14) {
      return Math.min(100, Math.max(caoCot, caoTb + 5));
    }
    return caoCot;
  }

  nhan(c: DuLieuCotDiem): string {
    return nhanDiemTrenCot(c.gia_tri);
  }

  nhanTb(diem: number | null | undefined): string {
    return nhanDiemTrenCot(diem);
  }

  chuoi(diem: Array<{ x: number; y: number }>): string {
    return chuoiDiemSvg(diem);
  }

  readonly moTa = computed(() => moTaBieuDoCot(this.cot()));
}
