import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  Directive,
  TemplateRef,
  computed,
  contentChildren,
  inject,
  input,
  output,
} from '@angular/core';
import { EmptyState } from '@shared/ui/empty-state';
import { SkeletonBlock } from '@shared/ui/loading';

/** Một cột trong bảng. */
export interface CotBang<T = object> {
  /** Tên trường trong dữ liệu. Hỗ trợ đường dẫn lồng: `mon_hoc.ten_mon`. */
  khoa: string;
  /** Tiêu đề cột. */
  nhan: string;
  /** Cho phép bấm tiêu đề để sắp xếp. */
  sap_xep?: boolean;
  /** Căn phải — dùng cho cột số để dấu hàng nghìn thẳng hàng. */
  can_phai?: boolean;
  /** Độ rộng cố định, ví dụ `120px`. Bỏ trống thì chia đều. */
  rong?: string;
  /**
   * Tự dựng nội dung ô bằng chuỗi. Cần component (badge, nút) thì dùng
   * `ng-template appOTuyChinh` — xem `features/dao-tao/sinh-vien/danh-sach.ts`.
   */
  hienThi?(row: T): string;
}

export interface SapXep {
  sort_by: string;
  sort_dir: 'asc' | 'desc';
}

/**
 * Khai một ô đặc biệt cho bảng — badge trạng thái, nút thao tác.
 *
 * Cách dùng:
 * ```
 * <app-data-table [cot]="cot()" [rows]="rows()">
 *   <ng-template appOTuyChinh="trang_thai" let-row>
 *     <app-status-badge [value]="row.trang_thai" />
 *   </ng-template>
 * </app-data-table>
 * ```
 */
@Directive({ selector: '[appOTuyChinh]', standalone: true })
export class OTuyChinh {
  readonly khoa = input.required<string>({ alias: 'appOTuyChinh' });
  readonly mau = inject(TemplateRef<unknown>);
}

/**
 * Bảng dữ liệu dùng chung cho mọi màn danh sách.
 *
 * Component này KHÔNG gọi API và KHÔNG giữ state nghiệp vụ: nó nhận dữ liệu đã
 * tải xong và phát sự kiện ra ngoài. Nhờ vậy mỗi màn chỉ viết phần gọi service,
 * còn bảng, phân trang, chọn dòng, bốn trạng thái hiển thị thì dùng chung.
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [EmptyState, SkeletonBlock, NgTemplateOutlet],
  template: `
    <div class="khung">
      @if (dangTai()) {
        <!-- Skeleton giữ đúng chiều cao bảng để trang không nhảy khi dữ liệu về. -->
        <div class="dang-tai">
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <app-skeleton-block height="40px" radius="var(--radius-sm)" />
          }
        </div>
      } @else if (loi()) {
        <div class="loi">
          <app-empty-state icon="cloud_off" title="Không tải được dữ liệu" [description]="loi()!">
            <button type="button" class="thu-lai" (click)="thuLai.emit()">Thử lại</button>
          </app-empty-state>
        </div>
      } @else if (rows().length === 0) {
        <div class="rong">
          <app-empty-state [icon]="iconRong()" [title]="tieuDeRong()" [description]="moTaRong()">
            <ng-content select="[emptyAction]" />
          </app-empty-state>
        </div>
      } @else {
        <div class="cuon">
          <table>
            <thead>
              <tr>
                @if (chonNhieu()) {
                  <th class="cot-chon">
                    <input
                      type="checkbox"
                      [checked]="chonTatCa()"
                      [indeterminate]="chonMotPhan()"
                      (change)="doiChonTatCa($event)"
                      aria-label="Chọn tất cả dòng"
                    />
                  </th>
                }
                @for (c of cot(); track c.khoa) {
                  <th
                    [style.width]="c.rong"
                    [class.can-phai]="c.can_phai"
                    [class.bam-duoc]="c.sap_xep"
                    [attr.aria-sort]="ariaSort(c)"
                  >
                    @if (c.sap_xep) {
                      <button type="button" class="tieu-de-cot" (click)="doiSapXep(c)">
                        {{ c.nhan }}
                        <span class="material-icons mui-ten" aria-hidden="true">{{ muiTen(c) }}</span>
                      </button>
                    } @else {
                      {{ c.nhan }}
                    }
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track khoaDong(row)) {
                <tr
                  [class.da-chon]="laDaChon(row)"
                  [class.bam-duoc]="bamDong()"
                  [attr.tabindex]="bamDong() ? 0 : null"
                  (click)="khiBamDong(row, $event)"
                  (keydown.enter)="khiBamDong(row, $event)"
                >
                  @if (chonNhieu()) {
                    <td class="cot-chon">
                      <input
                        type="checkbox"
                        [checked]="laDaChon(row)"
                        (change)="doiChonDong(row, $event)"
                        [attr.aria-label]="'Chọn dòng ' + khoaDong(row)"
                      />
                    </td>
                  }
                  @for (c of cot(); track c.khoa) {
                    <td [class.can-phai]="c.can_phai">
                      @if (mauOTuDung(c.khoa); as tmpl) {
                        <ng-container
                          [ngTemplateOutlet]="tmpl"
                          [ngTemplateOutletContext]="{ $implicit: row, row: row }"
                        />
                      } @else {
                        {{ giaTri(row, c) }}
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: `
    .khung {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .cuon {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--text-small);
    }

    thead th {
      text-align: left;
      font-weight: 600;
      color: var(--color-ink-muted);
      background: var(--color-surface-alt);
      padding: 10px 14px;
      white-space: nowrap;
      border-bottom: 1px solid var(--color-border);
      font-size: var(--text-caption);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    thead th.can-phai,
    tbody td.can-phai {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .tieu-de-cot {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border: none;
      background: transparent;
      padding: 0;
      font: inherit;
      color: inherit;
      text-transform: inherit;
      letter-spacing: inherit;
      cursor: pointer;
    }

    .tieu-de-cot:hover {
      color: var(--color-primary);
    }

    .mui-ten {
      font-size: 15px;
      opacity: 0.5;
    }

    .bam-duoc .mui-ten {
      opacity: 0.8;
    }

    tbody td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--color-border-soft);
      color: var(--color-ink);
      vertical-align: middle;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    tbody tr:hover {
      background: var(--color-surface-alt);
    }

    tbody tr.da-chon,
    tbody tr.da-chon:hover {
      background: var(--color-primary-soft);
    }

    tbody tr.bam-duoc {
      cursor: pointer;
    }

    tbody tr.bam-duoc:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: -2px;
    }

    .cot-chon {
      width: 40px;
      padding-right: 0;
    }

    input[type='checkbox'] {
      width: 15px;
      height: 15px;
      accent-color: var(--color-primary);
      cursor: pointer;
      vertical-align: middle;
    }

    .dang-tai {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 14px;
    }

    .loi,
    .rong {
      padding: 8px;
    }

    .thu-lai {
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-ink);
      font-family: inherit;
      font-size: var(--text-small);
      font-weight: 600;
      padding: 7px 14px;
      border-radius: var(--radius);
      cursor: pointer;
    }

    .thu-lai:hover {
      background: var(--color-surface-alt);
    }
  `,
})
export class DataTable<T = object> {
  readonly cot = input.required<CotBang<T>[]>();
  readonly rows = input.required<T[]>();
  /** Tên trường làm khoá duy nhất của dòng — mặc định `id`. */
  readonly khoa = input('id');

  readonly dangTai = input(false);
  readonly loi = input<string | null>(null);

  readonly tieuDeRong = input('Không có dữ liệu');
  readonly moTaRong = input('');
  readonly iconRong = input('inbox');

  // ---- Sắp xếp: component chỉ phát ý định, màn hình tự gọi lại API ----
  readonly sortBy = input<string | null>(null);
  readonly sortDir = input<'asc' | 'desc'>('asc');
  readonly sapXep = output<SapXep>();

  // ---- Chọn nhiều dòng ----
  readonly chonNhieu = input(false);
  readonly daChon = input<Array<string | number>>([]);
  readonly daChonChange = output<Array<string | number>>();

  readonly thuLai = output<void>();

  /** Bật để bấm vào dòng mở chi tiết. Cột có nút bên trong vẫn bấm được riêng. */
  readonly bamDong = input(false);
  readonly dongDuocBam = output<T>();

  khiBamDong(row: T, suKien: Event): void {
    if (!this.bamDong()) return;
    // Bấm vào checkbox hoặc nút/link trong ô thì không mở chi tiết — nếu không
    // người dùng vừa tick chọn vừa bị đẩy sang trang khác.
    const dich = suKien.target as HTMLElement;
    if (dich.closest('input, button, a, select, textarea')) return;
    this.dongDuocBam.emit(row);
  }

  private readonly cacOTuDung = contentChildren(OTuyChinh);

  private readonly bangOTuDung = computed(() => {
    const bang = new Map<string, TemplateRef<unknown>>();
    for (const o of this.cacOTuDung()) bang.set(o.khoa(), o.mau);
    return bang;
  });

  mauOTuDung(khoa: string): TemplateRef<unknown> | null {
    return this.bangOTuDung().get(khoa) ?? null;
  }

  private readonly tapDaChon = computed(() => new Set(this.daChon()));

  khoaDong(row: T): string | number {
    return this.doc(row, this.khoa()) as string | number;
  }

  readonly chonTatCa = computed(
    () =>
      this.rows().length > 0 &&
      this.rows().every((r) => this.tapDaChon().has(this.khoaDong(r))),
  );

  readonly chonMotPhan = computed(
    () => !this.chonTatCa() && this.rows().some((r) => this.tapDaChon().has(this.khoaDong(r))),
  );

  laDaChon(row: T): boolean {
    return this.tapDaChon().has(this.khoaDong(row));
  }

  giaTri(row: T, cot: CotBang<T>): string {
    if (cot.hienThi) return cot.hienThi(row);
    const v = this.doc(row, cot.khoa);
    return v === null || v === undefined ? '—' : String(v);
  }

  muiTen(cot: CotBang<T>): string {
    if (this.sortBy() !== cot.khoa) return 'unfold_more';
    return this.sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  ariaSort(cot: CotBang<T>): 'ascending' | 'descending' | 'none' | null {
    if (!cot.sap_xep) return null;
    if (this.sortBy() !== cot.khoa) return 'none';
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  doiSapXep(cot: CotBang<T>): void {
    if (!cot.sap_xep) return;
    // Bấm lại cột đang sắp xếp thì đảo chiều; bấm cột khác thì bắt đầu tăng dần.
    const cungCot = this.sortBy() === cot.khoa;
    this.sapXep.emit({
      sort_by: cot.khoa,
      sort_dir: cungCot && this.sortDir() === 'asc' ? 'desc' : 'asc',
    });
  }

  doiChonDong(row: T, suKien: Event): void {
    const chon = (suKien.target as HTMLInputElement).checked;
    const khoa = this.khoaDong(row);
    const hienTai = this.daChon();
    this.daChonChange.emit(chon ? [...hienTai, khoa] : hienTai.filter((k) => k !== khoa));
  }

  doiChonTatCa(suKien: Event): void {
    const chon = (suKien.target as HTMLInputElement).checked;
    this.daChonChange.emit(chon ? this.rows().map((r) => this.khoaDong(r)) : []);
  }

  /** Đọc trường theo đường dẫn lồng: `mon_hoc.ten_mon`. */
  private doc(row: T, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, key) => {
      if (acc === null || acc === undefined || typeof acc !== 'object') return undefined;
      return (acc as Record<string, unknown>)[key];
    }, row);
  }
}
