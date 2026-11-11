import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TuyChon } from '@core/services/lop-hoc-phan.service';

/** Mục của ô chọn kỳ — `/api/options/semesters` trả thêm `trang_thai`. */
export interface KyTrongODChon extends TuyChon {
  trang_thai?: string;
}

/** `trang_thai` → hậu tố hiển thị, để người dùng biết kỳ nào đang diễn ra. */
const HAU_TO: Record<string, string> = {
  ONGOING: ' · đang diễn ra',
  REGISTERING: ' · đang mở đăng ký',
  UPCOMING: ' · sắp tới',
};

/**
 * Ô chọn học kỳ của dashboard — MỘT ô cho cả màn, đặt góc phải `page-header`.
 *
 * Vì sao chỉ một ô: mọi con số của dashboard thuộc cùng một kỳ. Cho mỗi khối
 * một ô riêng thì người dùng so GPA kỳ này với chuyên cần kỳ khác mà không
 * nhận ra, và mỗi khối thành một request (đặc tả §3.2 quy ước dùng chung).
 *
 * Đây là `<select>` gốc chứ không `mat-select`: ba màn đã dùng `<select>` cho
 * bộ lọc kỳ ở chỗ khác (`diem-cua-toi`), và ô này chỉ có vài mục — kéo
 * Material vào chỉ để đổi hình dáng là trả giá thừa.
 */
@Component({
  selector: 'app-chon-hoc-ky',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (dsKy().length > 0) {
      <label class="chon-ky">
        <span class="nhan">Học kỳ</span>
        <select
          [value]="dangChon() ?? ''"
          [disabled]="dangTai()"
          (change)="doiKy($event)"
          aria-label="Chọn học kỳ để xem số liệu"
        >
          @for (k of dsKy(); track k.id) {
            <option [value]="k.id">{{ k.label }}{{ hauTo(k) }}</option>
          }
        </select>
      </label>
    }
  `,
  styles: `
    .chon-ky {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .nhan {
      font-size: var(--text-small);
      font-weight: 600;
      color: var(--color-ink-muted);
      white-space: nowrap;
    }

    select {
      font-family: inherit;
      font-size: var(--text-small);
      font-weight: 600;
      color: var(--color-ink);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      padding: 7px 10px;
      cursor: pointer;
      max-width: 260px;
    }

    select:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    select:disabled {
      opacity: 0.6;
      cursor: progress;
    }

    @media (max-width: 640px) {
      .nhan {
        display: none;
      }

      select {
        max-width: none;
        width: 100%;
      }
    }
  `,
})
export class ChonHocKy {
  readonly dsKy = input.required<KyTrongODChon[]>();
  /** `id` kỳ đang xem; `null` = chưa có (ẩn lựa chọn). */
  readonly dangChon = input<number | null>(null);
  /** Đang tải số liệu của kỳ mới — khoá ô chọn để không bắn request chồng. */
  readonly dangTai = input(false);
  readonly chon = output<number>();

  hauTo(k: KyTrongODChon): string {
    return (k.trang_thai && HAU_TO[k.trang_thai]) ?? '';
  }

  doiKy(suKien: Event): void {
    const giaTri = Number((suKien.target as HTMLSelectElement).value);
    if (Number.isFinite(giaTri) && giaTri > 0) this.chon.emit(giaTri);
  }
}
