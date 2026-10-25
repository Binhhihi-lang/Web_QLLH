import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Ô tìm kiếm có debounce.
 *
 * Vì sao debounce: gõ "Nguyễn Văn An" mà gọi API theo từng ký tự là 12 request
 * cho một lần tìm. Debounce 300ms gộp lại còn 1.
 */
@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="o-tim">
      <span class="material-icons ic" aria-hidden="true">search</span>
      <input
        type="search"
        [id]="id()"
        [name]="id()"
        [placeholder]="placeholder()"
        [ngModel]="value()"
        (ngModelChange)="khiGo($event)"
        [attr.aria-label]="placeholder()"
      />
      @if (value()) {
        <button class="xoa" type="button" (click)="xoa()" aria-label="Xoá tìm kiếm">
          <span class="material-icons" aria-hidden="true">close</span>
        </button>
      }
    </div>
  `,
  styles: `
    .o-tim {
      display: flex;
      align-items: center;
      gap: 9px;
      background: var(--color-surface);
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      padding: 0 12px;
      transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
    }

    .o-tim:focus-within {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    /* Icon phải cùng cỡ với chữ trong ô, không phải icon 14px như nút phụ —
       icon nhỏ hơn chữ trông như bị lỗi font. */
    .ic {
      color: var(--color-ink-subtle);
      font-size: 20px;
      line-height: 1;
      flex: none;
      user-select: none;
    }

    input {
      flex: 1;
      min-width: 0;
      border: none;
      outline: none;
      background: transparent;
      font-family: var(--font-body);
      font-size: var(--text-body);
      color: var(--color-ink);
      padding: 10px 0;
    }

    input::placeholder {
      color: var(--color-ink-subtle);
    }

    /* Ẩn nút xoá mặc định của trình duyệt để chỉ còn một nút của ta. */
    input::-webkit-search-cancel-button {
      display: none;
    }

    .xoa {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: var(--color-ink-subtle);
      cursor: pointer;
      padding: 2px;
      border-radius: var(--radius-sm);
      flex: none;
    }

    .xoa .material-icons {
      font-size: 18px;
    }

    .xoa:hover {
      color: var(--color-ink);
      background: var(--color-surface-alt);
    }
  `,
})
export class SearchInput {
  /** Mặc định `q` — đúng tên tham số tìm kiếm của mọi endpoint danh sách (§1.6). */
  readonly id = input('q');
  readonly placeholder = input('Tìm kiếm…');
  readonly value = input('');
  readonly debounceMs = input(300);

  readonly valueChange = output<string>();

  private henGio: ReturnType<typeof setTimeout> | null = null;

  khiGo(giaTri: string): void {
    if (this.henGio) clearTimeout(this.henGio);
    this.henGio = setTimeout(() => this.valueChange.emit(giaTri), this.debounceMs());
  }

  /** Xoá thì phát ngay, không chờ debounce — người dùng cần thấy kết quả tức thì. */
  xoa(): void {
    if (this.henGio) clearTimeout(this.henGio);
    this.valueChange.emit('');
  }
}
