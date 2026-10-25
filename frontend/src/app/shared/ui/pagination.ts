import { Component, computed, input, output } from '@angular/core';

/**
 * Phân trang theo đúng shape `meta` của API QLLH:
 * `{current_page, per_page, total, last_page}`.
 *
 * Vì sao không nhận `items` mà nhận meta: component chỉ cần con số để vẽ,
 * không cần biết dữ liệu là sinh viên hay lớp học phần.
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    <div class="phan-trang">
      <span class="tom-tat">
        Hiển thị {{ tuDong() }}–{{ denDong() }} trong {{ total() }}
      </span>

      <div class="ben-phai">
        <label class="co-chu">
          Số dòng
          <!-- Chọn theo từng option bằng "selected", không đặt "value" trên
               thẻ select: option được render bằng @for nên khi input perPage
               đổi, thẻ select chưa có option khớp để nhận giá trị, và trình
               duyệt rơi về option đầu tiên (10). -->
          <select id="so-dong" name="per_page" (change)="doiCoTrang($event)">
            @for (n of coTrang(); track n) {
              <option [value]="n" [selected]="n === perPage()">{{ n }}</option>
            }
          </select>
        </label>

        <div class="trang">
          <button type="button" [disabled]="currentPage() <= 1" (click)="chuyen(currentPage() - 1)" aria-label="Trang trước">‹</button>
          @for (p of cacTrang(); track $index) {
            @if (p === null) {
              <span class="cham">…</span>
            } @else {
              <button
                type="button"
                [class.chon]="p === currentPage()"
                [attr.aria-current]="p === currentPage() ? 'page' : null"
                (click)="chuyen(p)"
              >{{ p }}</button>
            }
          }
          <button type="button" [disabled]="currentPage() >= lastPage()" (click)="chuyen(currentPage() + 1)" aria-label="Trang sau">›</button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .phan-trang {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
      padding: 12px 16px;
      border-top: 1px solid var(--color-border);
      font-size: var(--text-small);
      color: var(--color-ink-muted);
    }

    @media (max-width: 640px) {
      .phan-trang {
        justify-content: center;
        gap: 10px;
      }

      .tom-tat {
        width: 100%;
        text-align: center;
      }
    }

    .ben-phai {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .co-chu {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    select {
      font-family: inherit;
      font-size: var(--text-small);
      padding: 4px 7px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      color: var(--color-ink);
    }

    .trang {
      display: flex;
      gap: 3px;
      align-items: center;
    }

    .trang button {
      min-width: 30px;
      height: 30px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-ink);
      font-family: inherit;
      font-size: var(--text-small);
      font-weight: 500;
      cursor: pointer;
      font-variant-numeric: tabular-nums;
    }

    .trang button:hover:not(:disabled):not(.chon) {
      background: var(--color-surface-alt);
    }

    .trang button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .trang button.chon {
      background: var(--color-primary);
      color: var(--color-on-primary);
      border-color: var(--color-primary);
      font-weight: 700;
    }

    .cham {
      color: var(--color-ink-subtle);
      padding: 0 3px;
    }
  `,
})
export class Pagination {
  readonly currentPage = input.required<number>();
  readonly perPage = input.required<number>();
  readonly total = input.required<number>();
  readonly lastPage = input.required<number>();

  readonly pageChange = output<number>();
  readonly perPageChange = output<number>();

  readonly coTrang = computed(() => [10, 25, 50, 100]);

  readonly tuDong = computed(() =>
    this.total() === 0 ? 0 : (this.currentPage() - 1) * this.perPage() + 1,
  );

  readonly denDong = computed(() =>
    Math.min(this.currentPage() * this.perPage(), this.total()),
  );

  /**
   * Sinh dãy số trang có dấu "…" — trả `null` cho chỗ rút gọn.
   *
   * Vì sao không liệt kê hết: với 63 trang thì hàng nút dài hơn cả bảng.
   * Luôn giữ trang đầu, cuối, và 1 trang quanh trang hiện tại.
   */
  readonly cacTrang = computed<(number | null)[]>(() => {
    const tong = this.lastPage();
    const hienTai = this.currentPage();
    if (tong <= 7) return Array.from({ length: tong }, (_, i) => i + 1);

    const ket: (number | null)[] = [1];
    const tu = Math.max(2, hienTai - 1);
    const den = Math.min(tong - 1, hienTai + 1);

    if (tu > 2) ket.push(null);
    for (let i = tu; i <= den; i++) ket.push(i);
    if (den < tong - 1) ket.push(null);
    ket.push(tong);

    return ket;
  });

  chuyen(trang: number): void {
    if (trang < 1 || trang > this.lastPage() || trang === this.currentPage()) return;
    this.pageChange.emit(trang);
  }

  doiCoTrang(suKien: Event): void {
    const giaTri = Number((suKien.target as HTMLSelectElement).value);
    this.perPageChange.emit(giaTri);
  }
}
