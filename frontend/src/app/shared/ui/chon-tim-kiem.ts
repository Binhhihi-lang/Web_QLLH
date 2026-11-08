import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

export interface LuaChonTimKiem {
  id: number;
  label: string;
  /** Mã hiển thị trước tên, ví dụ mã môn hoặc mã giảng viên. */
  ma?: string | null;
  /** Dòng phụ bên phải, ví dụ số tín chỉ. */
  phu?: string | null;
}

/**
 * Ô chọn có tìm kiếm — thay `<select>` khi danh mục dài.
 *
 * Vì sao không dùng `<select>`: 30 môn thì còn cuộn được, vài trăm giảng viên
 * thì gần như không tìm nổi. Ô này gọi `nguon()` theo từ khoá có debounce và
 * hiện cả mã lẫn tên để phân biệt hai mục trùng tên.
 */
@Component({
  selector: 'app-chon-tim-kiem',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="khung" [class.dang-mo]="mo()">
      <div class="hop" (click)="moLen()">
        <span class="material-icons ic" aria-hidden="true">{{
          daChon() ? 'check' : 'search'
        }}</span>
        @if (daChon() && !mo()) {
          <span class="da-chon">
            @if (daChon()!.ma) {
              <b>{{ daChon()!.ma }}</b>
            }
            {{ daChon()!.label }}
          </span>
        } @else {
          <input
            #o
            type="text"
            [id]="id()"
            [name]="id()"
            [placeholder]="placeholder()"
            [ngModel]="tuKhoa()"
            (ngModelChange)="khiGo($event)"
            (focus)="moLen()"
            (keydown)="khiNhanPhim($event)"
            [attr.aria-label]="placeholder()"
            [attr.aria-expanded]="mo()"
            role="combobox"
            aria-autocomplete="list"
          />
        }
        <button
          class="xoa"
          type="button"
          [attr.aria-label]="daChon() ? 'Bỏ chọn' : 'Mở danh sách'"
          (click)="daChon() ? boChon($event) : moLen()"
        >
          <span class="material-icons" aria-hidden="true">{{
            daChon() ? 'close' : 'expand_more'
          }}</span>
        </button>
      </div>

      @if (mo()) {
        <ul class="ds" role="listbox">
          @if (dangTai()) {
            <li class="trong">Đang tìm…</li>
          } @else if (ketQua().length === 0) {
            <li class="trong">Không tìm thấy. Thử mã hoặc tên khác.</li>
          } @else {
            @for (muc of ketQua(); track muc.id; let i = $index) {
              <li
                role="option"
                [attr.aria-selected]="i === chiSo()"
                [class.chon]="i === chiSo()"
                (mouseenter)="chiSo.set(i)"
                (click)="chon(muc)"
              >
                @if (muc.ma) {
                  <span class="ma">{{ muc.ma }}</span>
                }
                <span class="ten">{{ muc.label }}</span>
                @if (muc.phu) {
                  <span class="phu">{{ muc.phu }}</span>
                }
              </li>
            }
          }
        </ul>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .khung {
      position: relative;
    }
    .hop {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 0 10px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      cursor: text;
      transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
    }
    .khung.dang-mo .hop {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }
    .ic {
      font-size: 20px;
      line-height: 1;
      color: var(--color-ink-subtle);
      flex: none;
      user-select: none;
    }
    input {
      flex: 1;
      min-width: 0;
      border: none;
      outline: none;
      background: transparent;
      font: inherit;
      font-size: var(--text-body);
      color: var(--color-ink);
      padding: 10px 0;
    }
    input::placeholder {
      color: var(--color-ink-subtle);
    }
    .da-chon {
      flex: 1;
      min-width: 0;
      font-size: var(--text-body);
      color: var(--color-ink);
      overflow-wrap: anywhere;
      padding: 10px 0;
    }
    .da-chon b {
      font-family: var(--font-mono, monospace);
      font-size: var(--text-small);
      color: var(--color-primary);
      margin-right: 6px;
    }
    .xoa {
      display: inline-flex;
      align-items: center;
      border: none;
      background: transparent;
      color: var(--color-ink-subtle);
      cursor: pointer;
      padding: 2px;
      border-radius: var(--radius-sm);
      flex: none;
    }
    .xoa .material-icons {
      font-size: 20px;
    }
    .xoa:hover {
      color: var(--color-ink);
      background: var(--color-surface-alt);
    }
    .ds {
      position: absolute;
      z-index: 20;
      left: 0;
      right: 0;
      top: calc(100% + 4px);
      margin: 0;
      padding: 4px;
      list-style: none;
      max-height: 260px;
      overflow-y: auto;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-md, 0 8px 24px rgb(0 0 0 / 12%));
    }
    .ds li {
      display: flex;
      align-items: baseline;
      gap: 10px;
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      font-size: var(--text-small);
      cursor: pointer;
      color: var(--color-ink);
    }
    .ds li.chon {
      background: var(--color-primary-soft);
    }
    .ma {
      font-family: var(--font-mono, monospace);
      font-size: var(--text-caption, 12px);
      color: var(--color-primary);
      flex: none;
    }
    .ten {
      flex: 1;
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .phu {
      font-size: var(--text-caption, 12px);
      color: var(--color-ink-subtle);
      flex: none;
    }
    .trong {
      color: var(--color-ink-subtle);
      cursor: default;
      font-size: var(--text-small);
      padding: 10px;
    }
  `,
})
export class ChonTimKiem {
  /** Nguồn dữ liệu: nhận từ khoá, trả danh sách lựa chọn. */
  readonly nguon = input.required<(tuKhoa: string) => import('rxjs').Observable<LuaChonTimKiem[]>>();
  readonly id = input('chon-tim-kiem');
  readonly placeholder = input('Tìm theo mã hoặc tên…');
  readonly debounceMs = input(250);
  /** Giá trị đang chọn, để form cha điều khiển được. */
  readonly giaTri = input<number | null>(null);
  readonly nhanDaChon = input<string>('');

  readonly giaTriChange = output<number | null>();

  readonly mo = signal(false);
  readonly tuKhoa = signal('');
  readonly ketQua = signal<LuaChonTimKiem[]>([]);
  readonly chiSo = signal(0);
  readonly dangTai = signal(false);
  readonly daChon = signal<LuaChonTimKiem | null>(null);

  private readonly oNhap = viewChild<ElementRef<HTMLInputElement>>('o');
  private readonly host = inject(ElementRef<HTMLElement>);
  private henGio: ReturnType<typeof setTimeout> | null = null;
  private tai: Subscription | null = null;

  private readonly dongKhiBamRa = (su: Event) => {
    if (!this.host.nativeElement.contains(su.target as Node)) this.mo.set(false);
  };
  private readonly dongKhiEscape = (su: KeyboardEvent) => {
    if (su.key === 'Escape') this.mo.set(false);
  };

  constructor() {
    effect(() => {
      const id = this.giaTri();
      if (id === null) {
        this.daChon.set(null);
        return;
      }
      if (this.daChon()?.id !== id) {
        const co = this.ketQua().find((m) => m.id === id);
        this.daChon.set(co ?? { id, label: this.nhanDaChon() || `#${id}`, ma: null, phu: null });
      }
    });

    document.addEventListener('click', this.dongKhiBamRa);
    document.addEventListener('keydown', this.dongKhiEscape);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.dongKhiBamRa);
    document.removeEventListener('keydown', this.dongKhiEscape);
    this.tai?.unsubscribe();
    if (this.henGio) clearTimeout(this.henGio);
  }

  moLen(): void {
    this.mo.set(true);
    this.chiSo.set(0);
    if (this.ketQua().length === 0) this.tim('');
  }

  khiGo(giaTri: string): void {
    this.tuKhoa.set(giaTri);
    this.mo.set(true);
    if (this.henGio) clearTimeout(this.henGio);
    this.henGio = setTimeout(() => this.tim(giaTri), this.debounceMs());
  }

  khiNhanPhim(su: KeyboardEvent): void {
    const ds = this.ketQua();
    if (su.key === 'ArrowDown') {
      su.preventDefault();
      this.chiSo.set(Math.min(this.chiSo() + 1, ds.length - 1));
    } else if (su.key === 'ArrowUp') {
      su.preventDefault();
      this.chiSo.set(Math.max(this.chiSo() - 1, 0));
    } else if (su.key === 'Enter') {
      if (this.mo() && ds[this.chiSo()]) {
        su.preventDefault();
        this.chon(ds[this.chiSo()]);
      }
    } else if (su.key === 'Escape') {
      this.mo.set(false);
    }
  }

  chon(muc: LuaChonTimKiem): void {
    this.daChon.set(muc);
    this.tuKhoa.set('');
    this.mo.set(false);
    this.giaTriChange.emit(muc.id);
  }

  boChon(su: Event): void {
    su.stopPropagation();
    this.daChon.set(null);
    this.tuKhoa.set('');
    this.giaTriChange.emit(null);
    this.oNhap()?.nativeElement.focus();
  }

  private tim(tuKhoa: string): void {
    this.tai?.unsubscribe();
    this.dangTai.set(true);
    this.tai = this.nguon()(tuKhoa).subscribe({
      next: (ds) => {
        this.ketQua.set(ds);
        this.chiSo.set(0);
        this.dangTai.set(false);
      },
      error: () => {
        this.ketQua.set([]);
        this.dangTai.set(false);
      },
    });
  }
}

export const CHON_TIM_KIEM_IMPORTS = [ChonTimKiem] as const;
