import { Component, HostListener, ElementRef, afterNextRender, inject, input, output, viewChild } from '@angular/core';
import { AppButton } from '@shared/ui/app-button';

/**
 * Hộp thoại xác nhận — dùng cho mọi thao tác xoá.
 *
 * Vì sao không dùng `window.confirm`: hộp thoại trình duyệt không đổi được nhãn
 * nút, không hiện được lý do chặn, và bị chặn ở một số chế độ nhúng. Ở đây nút
 * "Xoá" nói rõ xoá cái gì, và `lyDoChan` cho phép backend giải thích tại sao
 * không xoá được (ví dụ sinh viên còn đăng ký học phần).
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [AppButton],
  template: `
    <div class="nen" (click)="huy.emit()" aria-hidden="true"></div>
    <div
      #hop
      class="hop"
      role="alertdialog"
      aria-modal="true"
      tabindex="-1"
      [attr.aria-labelledby]="'td-' + tieuDe()"
    >
      <h3 [id]="'td-' + tieuDe()">{{ tieuDe() }}</h3>
      <p>{{ moTa() }}</p>

      @if (lyDoChan()) {
        <div class="chan">
          <span class="material-icons ic" aria-hidden="true">warning</span>
          <span>{{ lyDoChan() }}</span>
        </div>
      }

      <div class="nut">
        <app-button variant="secondary" (click)="huy.emit()">Huỷ</app-button>
        <app-button
          [variant]="nguyHiem() ? 'danger' : 'primary'"
          [loading]="dangXuLy()"
          (click)="dongY.emit()"
        >
          {{ nhanDongY() }}
        </app-button>
      </div>
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .nen {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
    }

    .hop {
      position: relative;
      width: 100%;
      max-width: 420px;
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      box-shadow: 0 20px 48px rgba(15, 23, 42, 0.22);
      padding: 22px;
    }

    /* Hộp nhận focus bằng script, không phải để người dùng Tab tới — bỏ viền
       focus mặc định nhưng vẫn giữ viền cho điều hướng bàn phím. */
    .hop:focus {
      outline: none;
    }

    h3 {
      font-size: var(--text-h3);
      font-weight: 600;
      color: var(--color-ink);
      margin-bottom: 8px;
    }

    p {
      margin: 0;
      font-size: var(--text-small);
      line-height: 1.6;
      color: var(--color-ink-muted);
    }

    .chan {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      margin-top: 14px;
      padding: 10px 12px;
      background: var(--color-warning-soft);
      color: var(--color-on-warning-soft);
      border-radius: var(--radius);
      font-size: var(--text-small);
      line-height: 1.5;
    }

    .ic {
      flex: none;
      font-size: 18px;
    }

    .nut {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 20px;
    }
  `,
})
export class ConfirmDialog {
  readonly tieuDe = input('Xác nhận xoá');
  readonly moTa = input('');
  readonly nhanDongY = input('Xoá');
  readonly nguyHiem = input(true);
  readonly dangXuLy = input(false);
  /** Lý do backend từ chối xoá — hiện thành khối cảnh báo. */
  readonly lyDoChan = input<string>('');

  readonly dongY = output<void>();
  readonly huy = output<void>();

  private readonly hop = viewChild.required<ElementRef<HTMLElement>>('hop');

  constructor() {
    // Đưa focus vào hộp thoại ngay khi mở: vừa để trình đọc màn hình đọc được
    // nội dung, vừa là điều kiện để phím Escape có chỗ nhận sự kiện.
    afterNextRender(() => this.hop().nativeElement.focus());
  }

  /**
   * Đóng bằng Escape. Nghe ở `document` chứ không gắn `(keydown.escape)` lên
   * một div: div không tự nhận focus nên sự kiện bàn phím không bao giờ tới.
   */
  @HostListener('document:keydown.escape')
  khiNhanEscape(): void {
    this.huy.emit();
  }
}
