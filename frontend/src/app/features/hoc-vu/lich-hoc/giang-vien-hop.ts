import {
  Component,
  ElementRef,
  HostListener,
  afterNextRender,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

/**
 * Hộp thoại thông tin giảng viên — mở khi bấm một khối lịch trên lịch tuần.
 *
 * Tách khỏi `tuan.ts` vì lưới lịch đã dày đặc style; để chung thì vượt ngưỡng
 * 6 kB style của một component (budget trong angular.json) và không ai đọc nổi.
 *
 * Nạp tên ngay từ dữ liệu đã có trên khối rồi bù email/điện thoại sau: chậm
 * mạng thì người dùng vẫn thấy đúng người mình vừa bấm.
 */
@Component({
  selector: 'app-giang-vien-hop',
  standalone: true,
  template: `
    <div class="nen" (click)="dong.emit()" aria-hidden="true"></div>
    <div
      #hop
      class="hop-thoai"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ten-gv"
      tabindex="-1"
      (click)="$event.stopPropagation()"
    >
      <h2 id="ten-gv">{{ giangVien().ho_ten }}</h2>
      @if (giangVien().ma_gv) {
        <p class="ma-gv">{{ giangVien().ma_gv }}</p>
      }
      <dl>
        <dt>Email</dt>
        <dd>
          @if (giangVien().email) {
            <a [href]="'mailto:' + giangVien().email">{{ giangVien().email }}</a>
          } @else {
            —
          }
        </dd>
        <dt>Điện thoại</dt>
        <dd>{{ giangVien().so_dien_thoai || '—' }}</dd>
      </dl>
      <div class="nut-hop">
        <button type="button" (click)="dong.emit()">Đóng</button>
      </div>
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 60;
      display: grid;
      place-items: center;
      padding: 16px;
    }
    .nen {
      position: absolute;
      inset: 0;
      background: rgb(15 23 42 / 45%);
    }
    .hop-thoai {
      position: relative;
      width: min(360px, 100%);
      padding: 20px;
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      color: var(--color-ink);
      box-shadow: var(--shadow-lg);
    }
    .hop-thoai:focus {
      outline: none;
    }
    h2 {
      margin: 0;
      font-size: var(--text-h3);
      font-weight: 650;
    }
    .ma-gv {
      margin: 2px 0 14px;
      font-family: var(--font-mono, monospace);
      font-size: var(--text-small);
      color: var(--color-ink-muted);
    }
    dl {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 8px 14px;
      margin: 0 0 16px;
      font-size: var(--text-small);
    }
    dt {
      color: var(--color-ink-muted);
      font-size: var(--text-small);
    }
    dd {
      margin: 0;
      overflow-wrap: anywhere;
    }
    a {
      color: var(--color-primary);
    }
    .nut-hop {
      display: flex;
      justify-content: flex-end;
    }
    .nut-hop button {
      padding: 6px 14px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
      font: inherit;
      font-size: var(--text-small);
      font-weight: 600;
      cursor: pointer;
    }
    .nut-hop button:hover {
      background: var(--color-surface-alt);
    }
  `,
})
export class GiangVienHop {
  /** Id giảng viên; `null` thì không mở (khối ca thi không có giảng viên). */
  readonly id = input<number | null>(null);
  /** Tên đã có sẵn trên khối — hiện ngay, không chờ API. */
  readonly ten = input('');

  readonly dong = output<void>();

  readonly giangVien = signal<{
    ho_ten: string;
    ma_gv: string;
    email: string;
    so_dien_thoai: string | null;
  }>({ ho_ten: '', ma_gv: '', email: '', so_dien_thoai: null });

  private readonly http = inject(HttpClient);
  private readonly goc = environment.apiBaseUrl;
  private readonly hop = viewChild.required<ElementRef<HTMLElement>>('hop');
  private idDangXem = 0;

  constructor() {
    afterNextRender(() => this.hop().nativeElement.focus());
    // effect() không cần: input chỉ gán một lần khi component được tạo (mỗi
    // lần mở là một instance mới do @if), nên constructor là đủ.
    queueMicrotask(() => this.tai());
  }

  @HostListener('document:keydown.escape')
  khiNhanEscape(): void {
    this.dong.emit();
  }

  private tai(): void {
    const id = this.id();
    if (!id) return;
    this.idDangXem = id;
    this.giangVien.set({ ho_ten: this.ten(), ma_gv: '', email: '', so_dien_thoai: null });
    this.http
      .get<{
        data: { ho_ten: string; ma_gv: string; email: string; so_dien_thoai: string | null };
      }>(`${this.goc}/teachers/${id}`)
      .subscribe({
        next: ({ data }) => {
          if (this.idDangXem !== id) return;
          this.giangVien.set({
            ho_ten: data.ho_ten,
            ma_gv: data.ma_gv,
            email: data.email,
            so_dien_thoai: data.so_dien_thoai ?? null,
          });
        },
        error: () => {
          /* Giữ tên đã hiện; lỗi tải chi tiết không nên chặn người dùng. */
        },
      });
  }
}
