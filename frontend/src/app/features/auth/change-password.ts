import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [AppAlert, AppButton],
  template: `
    <main class="pagina">
      <form class="card" (submit)="salvaMatKhau($event)">
        <div>
          <h1>Đổi mật khẩu</h1>
          <p>Hãy tạo mật khẩu mới để tiếp tục sử dụng hệ thống.</p>
        </div>

        @if (loi()) {
          <app-alert muc="danger" title="Không thể đổi mật khẩu">{{ loi() }}</app-alert>
        }
        @if (thanhCong()) {
          <app-alert muc="success" title="Đã đổi mật khẩu">
            Mật khẩu đã được cập nhật.
          </app-alert>
        }

        <label>
          Mật khẩu hiện tại
          <input
            type="password"
            name="mat-khau-cu"
            autocomplete="current-password"
            [value]="matKhauCu()"
            (input)="matKhauCu.set(giaTri($event))"
            required
          />
        </label>

        <label>
          Mật khẩu mới
          <input
            type="password"
            name="mat-khau-moi"
            autocomplete="new-password"
            minlength="8"
            [value]="matKhauMoi()"
            (input)="matKhauMoi.set(giaTri($event))"
            required
          />
          <small>Mật khẩu phải có ít nhất 8 ký tự.</small>
        </label>

        <label>
          Xác nhận mật khẩu mới
          <input
            type="password"
            name="xac-nhan-mat-khau"
            autocomplete="new-password"
            [value]="xacNhanMatKhau()"
            (input)="xacNhanMatKhau.set(giaTri($event))"
            required
          />
        </label>

        <app-button type="submit" variant="primary" [loading]="dangGui()">
          Cập nhật mật khẩu
        </app-button>
      </form>
    </main>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      background: var(--color-bg);
    }

    .pagina {
      display: grid;
      min-height: 100vh;
      place-items: center;
      padding: 24px;
    }

    .card {
      display: flex;
      width: min(100%, 420px);
      flex-direction: column;
      gap: 18px;
      padding: 28px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-md);
    }

    h1 {
      margin: 0;
      color: var(--color-ink);
      font-size: 23px;
    }

    p {
      margin: 6px 0 0;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
    }

    label {
      display: flex;
      flex-direction: column;
      gap: 7px;
      color: var(--color-ink);
      font-size: var(--text-small);
      font-weight: 600;
    }

    input {
      width: 100%;
      padding: 10px 12px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
      font: inherit;
    }

    input:focus {
      border-color: var(--color-primary);
      outline: 3px solid var(--color-primary-soft);
    }

    small {
      color: var(--color-ink-muted);
      font-weight: 400;
    }

    app-button ::ng-deep button {
      width: 100%;
    }
  `,
})
export class ChangePasswordPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly matKhauCu = signal('');
  readonly matKhauMoi = signal('');
  readonly xacNhanMatKhau = signal('');
  readonly dangGui = signal(false);
  readonly loi = signal<string | null>(null);
  readonly thanhCong = signal(false);

  giaTri(suKien: Event): string {
    return (suKien.target as HTMLInputElement).value;
  }

  salvaMatKhau(suKien: Event): void {
    suKien.preventDefault();
    if (this.dangGui()) return;
    if (this.matKhauMoi().length < 8) {
      this.loi.set('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (this.matKhauMoi() !== this.xacNhanMatKhau()) {
      this.loi.set('Mật khẩu xác nhận không khớp.');
      return;
    }

    this.loi.set(null);
    this.thanhCong.set(false);
    this.dangGui.set(true);
    this.auth
      .doiMatKhau(this.matKhauCu(), this.matKhauMoi(), this.xacNhanMatKhau())
      .pipe(finalize(() => this.dangGui.set(false)))
      .subscribe({
        next: () => {
          this.thanhCong.set(true);
          void this.router.navigateByUrl('/dashboard');
        },
        error: (loi: unknown) => this.loi.set(this.thongBaoLoi(loi)),
      });
  }

  private thongBaoLoi(loi: unknown): string {
    if (!(loi instanceof HttpErrorResponse)) return 'Không thể đổi mật khẩu lúc này. Vui lòng thử lại.';
    if (loi.status === 401) return 'Mật khẩu hiện tại không chính xác hoặc phiên đăng nhập đã hết hạn.';
    if (loi.status === 422) return loi.error?.message ?? 'Mật khẩu mới chưa đáp ứng yêu cầu.';
    return loi.error?.message ?? 'Không thể kết nối máy chủ. Vui lòng thử lại.';
  }
}
