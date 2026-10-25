import { Component, computed, input, output, signal } from '@angular/core';

/**
 * Ô chọn ngày: gõ `dd/mm/yyyy` hoặc bấm lịch để chọn. Giá trị ra là `YYYY-MM-DD`.
 *
 * Vì sao không dùng thẳng `<input type="date">`: trình duyệt vẽ định dạng theo
 * locale của HỆ ĐIỀU HÀNH, không theo `lang` của trang. Máy cài Windows tiếng
 * Anh sẽ hiện `mm/dd/yyyy` dù trang là `lang="vi"` — người dùng đọc 03/12 thành
 * 12/3 và lọc sai ngày.
 *
 * Cách làm: ô chữ để hiển thị/gõ, và một `<input type="date">` trong suốt phủ
 * lên icon lịch. Bấm icon là mở bảng chọn ngày gốc của trình duyệt (quen thuộc,
 * có bàn phím điều hướng), nhưng chữ hiển thị vẫn do ta kiểm soát.
 */
@Component({
  selector: 'app-date-input',
  standalone: true,
  template: `
    <div class="o-ngay" [class.co-loi]="loi()">
      <input
        class="go"
        type="text"
        inputmode="numeric"
        maxlength="10"
        [id]="id()"
        [name]="id()"
        [placeholder]="goiY()"
        [value]="hienThi()"
        [disabled]="disabled()"
        [attr.aria-label]="nhan()"
        [attr.aria-invalid]="!!loi()"
        (input)="khiGo($event)"
        (blur)="khiRoi()"
      />

      <span class="boc-lich">
        <span class="material-icons lich" aria-hidden="true">calendar_today</span>
        <input
          class="chon-ngay"
          type="date"
          tabindex="-1"
          [id]="id() + '-lich'"
          [name]="id() + '-lich'"
          [value]="giaTri()"
          [disabled]="disabled()"
          [attr.aria-label]="nhan() + ' — mở lịch chọn'"
          (change)="khiChonLich($event)"
        />
      </span>
    </div>
    @if (loi()) {
      <span class="thong-bao-loi">{{ loi() }}</span>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .o-ngay {
      display: flex;
      align-items: center;
      gap: 6px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      padding: 0 10px;
      transition:
        border-color var(--dur) var(--ease),
        box-shadow var(--dur) var(--ease);
    }

    .o-ngay:focus-within {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    .co-loi {
      border-color: var(--color-danger);
    }

    .go {
      flex: 1;
      min-width: 0;
      border: none;
      outline: none;
      background: transparent;
      font-family: var(--font-body);
      font-size: var(--text-small);
      color: var(--color-ink);
      padding: 9px 0;
      font-variant-numeric: tabular-nums;
    }

    .go::placeholder {
      color: var(--color-ink-subtle);
    }

    .go:disabled {
      color: var(--color-ink-muted);
    }

    /* Bọc icon + input date: input date phủ kín và trong suốt, nên bấm vào icon
       là mở bảng chọn ngày của trình duyệt mà không thấy ô date thứ hai. */
    .boc-lich {
      position: relative;
      display: inline-flex;
      align-items: center;
      flex: none;
    }

    .lich {
      font-size: 16px;
      color: var(--color-ink-subtle);
      user-select: none;
      pointer-events: none;
    }

    .boc-lich:hover .lich {
      color: var(--color-primary);
    }

    .chon-ngay {
      position: absolute;
      inset: -4px;
      width: calc(100% + 8px);
      height: calc(100% + 8px);
      opacity: 0;
      cursor: pointer;
      border: none;
      padding: 0;
    }

    .chon-ngay::-webkit-calendar-picker-indicator {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      cursor: pointer;
    }

    .thong-bao-loi {
      display: block;
      margin-top: 4px;
      font-size: var(--text-caption);
      color: var(--color-danger);
    }
  `,
})
export class DateInput {
  /** Bắt buộc để mỗi ô có id/name riêng — hai ô ngày cạnh nhau trùng id sẽ hỏng cả hai. */
  readonly id = input.required<string>();
  /** Nhãn cho trình đọc màn hình — ô này không có `<label>` bọc ngoài. */
  readonly nhan = input('');
  /** Giá trị đang giữ, dạng `YYYY-MM-DD`. */
  readonly giaTri = input('');
  readonly goiY = input('dd/mm/yyyy');
  readonly disabled = input(false);

  readonly giaTriChange = output<string>();

  /** Chuỗi người dùng đang gõ, chưa chắc hợp lệ. */
  private readonly dangGo = signal<string | null>(null);

  readonly loi = signal('');

  readonly hienThi = computed(() => this.dangGo() ?? this.sangVn(this.giaTri()));

  khiGo(suKien: Event): void {
    const tho = (suKien.target as HTMLInputElement).value;

    // Tự chèn dấu "/" khi gõ liền 8 chữ số, để không phải bấm dấu phân cách.
    const so = tho.replace(/\D/g, '').slice(0, 8);
    const coDau = tho.includes('/');
    const daDinhDang =
      !coDau && so.length >= 5
        ? `${so.slice(0, 2)}/${so.slice(2, 4)}${so.length > 4 ? '/' + so.slice(4) : ''}`
        : tho;

    this.dangGo.set(daDinhDang);
    this.loi.set('');

    const iso = this.sangIso(daDinhDang);
    if (iso !== null) this.giaTriChange.emit(iso);
  }

  khiRoi(): void {
    const tho = this.dangGo();
    this.dangGo.set(null);

    // Rời ô mà chuỗi dở dang thì báo lỗi và không phát giá trị — thà trống còn
    // hơn lọc theo một ngày người dùng không định nhập.
    if (tho && this.sangIso(tho) === null) {
      this.loi.set('Ngày không hợp lệ, cần dạng dd/mm/yyyy.');
    }
  }

  /** Chọn từ bảng lịch: trình duyệt luôn trả `YYYY-MM-DD`. */
  khiChonLich(suKien: Event): void {
    const iso = (suKien.target as HTMLInputElement).value;
    this.dangGo.set(null);
    this.loi.set('');
    this.giaTriChange.emit(iso);
  }

  private sangVn(iso: string): string {
    if (!iso) return '';
    const [nam, thang, ngay] = iso.split('-');
    if (!nam || !thang || !ngay) return iso;
    return `${ngay}/${thang}/${nam}`;
  }

  /** Trả `null` khi chuỗi chưa đủ hoặc không phải ngày có thật. */
  private sangIso(vn: string): string | null {
    const m = vn.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;

    const [, ngay, thang, nam] = m;
    const d = new Date(Number(nam), Number(thang) - 1, Number(ngay));

    // Chặn 31/02: Date tự tràn sang tháng sau, nên phải đối chiếu lại.
    if (
      d.getFullYear() !== Number(nam) ||
      d.getMonth() !== Number(thang) - 1 ||
      d.getDate() !== Number(ngay)
    ) {
      return null;
    }

    return `${nam}-${thang}-${ngay}`;
  }
}
