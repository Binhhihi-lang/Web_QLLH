import { Component, computed, input, output } from '@angular/core';

export type LoaiTruong = 'text' | 'email' | 'tel' | 'number' | 'date' | 'password' | 'textarea';

/**
 * Một ô trong form: nhãn + ô nhập + gợi ý + thông báo lỗi.
 *
 * Component này bọc phần TRÌNH BÀY, không giữ state và không validate — giá trị
 * và lỗi do form cha quyết định. Nhờ vậy cùng một ô dùng được cho `ngModel`,
 * FormControl, hay giá trị đọc từ API.
 *
 * Lỗi hiện ngay dưới ô và đổi viền sang màu danger. Dấu `*` chỉ hiện khi
 * `batBuoc` — không tự suy ra từ việc có validator hay không, vì dấu sao là
 * thông tin cho người dùng chứ không phải cho code.
 */
@Component({
  selector: 'app-form-field',
  standalone: true,
  template: `
    <div class="truong" [class.co-loi]="hienLoi()">
      @if (nhan()) {
        <label [attr.for]="id()">
          {{ nhan() }}
          @if (batBuoc()) {
            <span class="sao" aria-hidden="true">*</span>
          }
        </label>
      }

      @if (loai() === 'textarea') {
        <textarea
          [id]="id()"
          [rows]="soDong()"
          [placeholder]="goiY()"
          [value]="giaTri()"
          [disabled]="disabled()"
          [attr.aria-invalid]="hienLoi()"
          [attr.aria-describedby]="moTaId()"
          (input)="khiDoi($event)"
          (blur)="cham.emit()"
        ></textarea>
      } @else {
        <input
          [id]="id()"
          [type]="loai()"
          [placeholder]="goiY()"
          [value]="giaTri()"
          [disabled]="disabled()"
          [attr.min]="min()"
          [attr.max]="max()"
          [attr.step]="buocNhay()"
          [attr.aria-invalid]="hienLoi()"
          [attr.aria-describedby]="moTaId()"
          (input)="khiDoi($event)"
          (blur)="cham.emit()"
        />
      }

      <div [id]="moTaId()" class="duoi">
        @if (hienLoi()) {
          <span class="loi">{{ loi() }}</span>
        } @else if (goiYDuoi()) {
          <span class="goi-y">{{ goiYDuoi() }}</span>
        }
      </div>
    </div>
  `,
  styles: `
    .truong {
      display: flex;
      flex-direction: column;
      gap: 5px;
      min-width: 0;
    }

    label {
      font-size: var(--text-small);
      font-weight: 600;
      color: var(--color-ink);
    }

    .sao {
      color: var(--color-danger);
      margin-left: 2px;
    }

    input,
    textarea {
      width: 100%;
      font-family: var(--font-body);
      font-size: var(--text-small);
      color: var(--color-ink);
      background: var(--color-surface);
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      padding: 9px 11px;
      transition:
        border-color var(--dur) var(--ease),
        box-shadow var(--dur) var(--ease);
    }

    textarea {
      resize: vertical;
      min-height: 72px;
      line-height: var(--leading-normal);
    }

    input::placeholder,
    textarea::placeholder {
      color: var(--color-ink-subtle);
    }

    input:focus,
    textarea:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    input:disabled,
    textarea:disabled {
      background: var(--color-surface-alt);
      color: var(--color-ink-muted);
      cursor: not-allowed;
    }

    .co-loi input,
    .co-loi textarea {
      border-color: var(--color-danger);
    }

    .co-loi input:focus,
    .co-loi textarea:focus {
      box-shadow: 0 0 0 3px var(--color-danger-soft);
    }

    /* Giữ chỗ cho dòng lỗi/gợi ý để các ô trong cùng hàng không lệch đáy
       khi một ô có lỗi còn ô khác thì không. */
    .duoi {
      min-height: 17px;
      font-size: var(--text-caption);
      line-height: 1.4;
    }

    .loi {
      color: var(--color-danger);
    }

    .goi-y {
      color: var(--color-ink-subtle);
    }
  `,
})
export class FormField {
  /** Bắt buộc có để nhãn `<label for>` trỏ đúng ô — trùng id sẽ hỏng cả hai. */
  readonly id = input.required<string>();
  readonly nhan = input('');
  readonly loai = input<LoaiTruong>('text');
  readonly giaTri = input<string | number>('');
  readonly goiY = input('');
  readonly goiYDuoi = input('');
  readonly loi = input<string>('');
  /** Chỉ hiện lỗi sau khi người dùng đã chạm vào ô — tránh báo đỏ ngay khi mở form. */
  readonly daCham = input(false);
  readonly batBuoc = input(false);
  readonly disabled = input(false);
  readonly soDong = input(3);

  // Dùng cho `type="number"` — để trống thì trình duyệt tự quyết.
  readonly min = input<number | null>(null);
  readonly max = input<number | null>(null);
  readonly buocNhay = input<number | null>(null);

  readonly giaTriChange = output<string>();
  readonly cham = output<void>();

  readonly hienLoi = computed(() => this.daCham() && !!this.loi());

  readonly moTaId = computed(() => `${this.id()}-mo-ta`);

  khiDoi(suKien: Event): void {
    this.giaTriChange.emit((suKien.target as HTMLInputElement).value);
  }
}
