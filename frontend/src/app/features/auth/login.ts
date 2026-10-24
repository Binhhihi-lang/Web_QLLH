import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';

/**
 * Đăng nhập (SCR-01) — KHÔNG dùng layout chính.
 *
 * Trang auth đứng riêng toàn màn hình: chưa đăng nhập thì chưa được thấy
 * sidebar, menu, cấu trúc hệ thống. Đây là lý do route này khai ngoài
 * MainLayout trong app.routes.ts.
 *
 * Chưa nối backend: submit chỉ chuyển hướng. Khi có AuthService sẽ gọi
 * POST /api/auth/login rồi lưu token.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, AppAlert, AppButton],
  template: `
    <div class="trang">
      <!-- Cột trái: thương hiệu. Ẩn ở mobile để không chiếm chỗ. -->
      <aside class="gioi-thieu">
        <div class="thuong-hieu">
          <div class="logo">Q</div>
          <span>Hệ thống quản lý lớp học</span>
        </div>

        <div class="loi-ich">
          <h1>Quản lý học vụ<br />gọn trong một nơi</h1>
          <p>
            Hồ sơ sinh viên, lớp học phần, lịch học, điểm danh và điểm số —
            tất cả trên cùng một hệ thống.
          </p>
          <ul>
            <li><span class="material-icons">check</span> Phân quyền ba vai trò rõ ràng</li>
            <li><span class="material-icons">check</span> Kiểm tra trùng lịch tự động</li>
            <li><span class="material-icons">check</span> Thống kê chuyên cần theo lớp</li>
          </ul>
        </div>

        <p class="chan-trang">© 2026 Hệ thống quản lý lớp học</p>
      </aside>

      <!-- Cột phải: form -->
      <main class="form-vung">
        <div class="form-hop">
          <div class="dau">
            <h2>Đăng nhập</h2>
            <p>Dùng tài khoản được nhà trường cấp.</p>
          </div>

          @if (loi()) {
            <app-alert muc="danger" title="Đăng nhập không thành công">{{ loi() }}</app-alert>
          }

          <form (submit)="dangNhap($event)">
            <div class="o-nhap">
              <label for="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                autocomplete="username"
                placeholder="ten@university.edu.vn"
                [value]="email()"
                (input)="email.set($any($event.target).value)"
                required
              />
            </div>

            <div class="o-nhap">
              <div class="nhan-hang">
                <label for="mat-khau">Mật khẩu</label>
                <a routerLink="/quen-mat-khau">Quên mật khẩu?</a>
              </div>
              <div class="o-mat-khau">
                <input
                  id="mat-khau"
                  [type]="hienMatKhau() ? 'text' : 'password'"
                  name="mat-khau"
                  autocomplete="current-password"
                  placeholder="Nhập mật khẩu"
                  [value]="matKhau()"
                  (input)="matKhau.set($any($event.target).value)"
                  required
                />
                <button
                  type="button"
                  class="hien"
                  (click)="hienMatKhau.update((v) => !v)"
                  [attr.aria-label]="hienMatKhau() ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                >
                  <span class="material-icons">{{ hienMatKhau() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
            </div>

            <label class="ghi-nho">
              <input type="checkbox" [checked]="ghiNho()" (change)="ghiNho.update((v) => !v)" />
              Ghi nhớ đăng nhập
            </label>

            <app-button type="submit" variant="primary" [loading]="dangGui()">
              Đăng nhập
            </app-button>
          </form>

          <p class="ho-tro">
            Chưa có tài khoản? Liên hệ phòng đào tạo để được cấp.
          </p>
        </div>
      </main>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100vh;
    }

    .material-icons {
      font-size: 17px;
      line-height: 1;
    }

    .trang {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      height: 100%;
    }

    /* ---------- Cột trái ---------- */
    .gioi-thieu {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 38px 44px;
      background: linear-gradient(160deg, var(--color-sidebar-top) 0%, var(--color-sidebar-bottom) 100%);
      color: #ffffff;
    }

    .thuong-hieu {
      display: flex;
      align-items: center;
      gap: 11px;
      font-family: var(--font-heading);
      font-weight: 600;
      font-size: 14.5px;
    }

    .logo {
      width: 36px;
      height: 36px;
      border-radius: 9px;
      display: grid;
      place-items: center;
      background: var(--color-primary);
      color: var(--color-on-primary);
      font-weight: 700;
      font-size: 16px;
      flex: none;
    }

    .loi-ich h1 {
      font-size: 32px;
      font-weight: 700;
      line-height: 1.25;
      letter-spacing: -0.5px;
      margin-bottom: 14px;
    }

    .loi-ich p {
      font-size: 14px;
      line-height: 1.7;
      color: rgba(255, 255, 255, 0.72);
      max-width: 400px;
      margin: 0 0 22px;
    }

    .loi-ich ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 11px;
    }

    .loi-ich li {
      display: flex;
      align-items: center;
      gap: 9px;
      font-size: 13.5px;
      color: rgba(255, 255, 255, 0.85);
    }

    .loi-ich li .material-icons {
      font-size: 16px;
      color: #86efac;
      flex: none;
    }

    .chan-trang {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.45);
      margin: 0;
    }

    /* ---------- Cột phải ---------- */
    .form-vung {
      display: grid;
      place-items: center;
      padding: 32px 24px;
      background: var(--color-bg);
      overflow-y: auto;
    }

    .form-hop {
      width: 100%;
      max-width: 384px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .dau h2 {
      font-size: 25px;
      font-weight: 700;
      color: var(--color-ink);
    }

    .dau p {
      margin: 5px 0 0;
      font-size: var(--text-small);
      color: var(--color-ink-muted);
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .o-nhap {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .nhan-hang {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 10px;
    }

    label {
      font-size: var(--text-small);
      font-weight: 600;
      color: var(--color-ink);
    }

    .nhan-hang a {
      font-size: 12.5px;
      color: var(--color-primary);
      text-decoration: none;
    }

    .nhan-hang a:hover {
      text-decoration: underline;
    }

    input[type='email'],
    input[type='password'],
    input[type='text'] {
      font-family: var(--font-body);
      font-size: var(--text-body);
      padding: 10px 13px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
      outline: none;
      width: 100%;
      transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
    }

    input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    .o-mat-khau {
      position: relative;
    }

    .o-mat-khau input {
      padding-right: 40px;
    }

    .hien {
      position: absolute;
      top: 50%;
      right: 6px;
      transform: translateY(-50%);
      display: grid;
      place-items: center;
      width: 30px;
      height: 30px;
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-ink-subtle);
      cursor: pointer;
    }

    .hien:hover {
      background: var(--color-surface-alt);
      color: var(--color-ink);
    }

    .ghi-nho {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: var(--text-small);
      font-weight: 400;
      color: var(--color-ink-muted);
      cursor: pointer;
    }

    .ghi-nho input {
      width: 15px;
      height: 15px;
      accent-color: var(--color-primary);
      cursor: pointer;
    }

    app-button {
      display: block;
    }

    app-button ::ng-deep button {
      width: 100%;
    }

    .ho-tro {
      margin: 0;
      font-size: 12.5px;
      color: var(--color-ink-subtle);
      text-align: center;
    }

    /* ---------- Responsive ---------- */
    @media (max-width: 900px) {
      .trang {
        grid-template-columns: minmax(0, 1fr);
      }

      .gioi-thieu {
        display: none;
      }
    }
  `,
})
export class LoginPage {
  readonly email = signal('');
  readonly matKhau = signal('');
  readonly ghiNho = signal(false);
  readonly hienMatKhau = signal(false);
  readonly dangGui = signal(false);
  readonly loi = signal<string | null>(null);

  dangNhap(suKien: Event): void {
    suKien.preventDefault();
    // Chưa có AuthService: hiện thông báo để thấy rõ là chưa nối backend,
    // không giả vờ đăng nhập thành công.
    this.loi.set('Chưa nối Backend. Endpoint POST /api/auth/login sẽ được gọi ở tuần sau.');
  }
}
