import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, map } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { VaiTro } from '@core/models/dao-tao.model';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';

interface CongDangNhap {
  vaiTro: VaiTro;
  tenVaiTro: string;
  tieuDe: string;
  moTa: string;
  nhanTaiKhoan: string;
  placeholder: string;
  loaiTaiKhoan: 'email' | 'ma_sv';
  gioiThieu: string;
  diemNoiBat: string;
}

const CONG_DANG_NHAP: Record<VaiTro, CongDangNhap> = {
  ADMIN: {
    vaiTro: 'ADMIN',
    tenVaiTro: 'Quản trị viên',
    tieuDe: 'Quản lý toàn hệ thống',
    moTa: 'Truy cập khu vực quản trị, dữ liệu đào tạo và cấu hình vận hành.',
    nhanTaiKhoan: 'Email quản trị viên',
    placeholder: 'admin@university.edu.vn',
    loaiTaiKhoan: 'email',
    gioiThieu: 'Không gian quản trị',
    diemNoiBat: 'Điều hành và quản lý dữ liệu nhà trường',
  },
  GIANG_VIEN: {
    vaiTro: 'GIANG_VIEN',
    tenVaiTro: 'Giảng viên',
    tieuDe: 'Dành cho giảng viên',
    moTa: 'Theo dõi lớp giảng dạy, lịch học, điểm danh và kết quả học tập.',
    nhanTaiKhoan: 'Email giảng viên',
    placeholder: 'ten@university.edu.vn',
    loaiTaiKhoan: 'email',
    gioiThieu: 'Không gian giảng dạy',
    diemNoiBat: 'Lịch dạy và lớp học của bạn trong một nơi',
  },
  SINH_VIEN: {
    vaiTro: 'SINH_VIEN',
    tenVaiTro: 'Sinh viên',
    tieuDe: 'Cổng thông tin sinh viên',
    moTa: 'Xem lịch học, đăng ký học phần và theo dõi kết quả của bạn.',
    nhanTaiKhoan: 'Mã sinh viên',
    placeholder: 'Ví dụ: SV2026001',
    loaiTaiKhoan: 'ma_sv',
    gioiThieu: 'Cổng thông tin sinh viên',
    diemNoiBat: 'Lịch học, đăng ký và kết quả học tập',
  },
};

/**
 * Cổng đăng nhập theo vai trò (SCR-01) — KHÔNG dùng layout chính.
 *
 * Trang auth đứng riêng toàn màn hình: chưa đăng nhập thì chưa được thấy
 * sidebar, menu, cấu trúc hệ thống. Đây là lý do route này khai ngoài
 * MainLayout trong app.routes.ts.
 *
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [AppAlert, AppButton, RouterLink],
  template: `
    <div
      class="trang"
      [class.admin]="cong().vaiTro === 'ADMIN'"
      [class.giang-vien]="cong().vaiTro === 'GIANG_VIEN'"
      [class.sinh-vien]="cong().vaiTro === 'SINH_VIEN'"
    >
      <!-- Cột trái: nhận diện riêng theo vai trò. -->
      <aside class="gioi-thieu">
        <div class="thuong-hieu">
          <div class="logo" aria-hidden="true">
            {{ cong().vaiTro === 'SINH_VIEN' ? 'SV' : cong().vaiTro === 'GIANG_VIEN' ? 'GV' : 'Q' }}
          </div>
          <span>Hệ thống quản lý lớp học</span>
        </div>

        <div class="loi-ich">
          <p class="nhan-khu-vuc">{{ cong().gioiThieu }}</p>
          <h2>{{ cong().tieuDe }}</h2>
          <p>{{ cong().moTa }}</p>
          <ul>
            <li>{{ cong().diemNoiBat }}</li>
            <li>Đăng nhập an toàn theo vai trò</li>
          </ul>
        </div>

        <p class="chan-trang">© 2026 Hệ thống quản lý lớp học</p>
      </aside>

      <!-- Cột phải: form -->
      <main class="form-vung">
        <div class="form-hop">
          <div class="dau">
            <span class="nhan-vai-tro">{{ cong().tenVaiTro }}</span>
            <h1>Đăng nhập</h1>
            <p>{{ cong().moTa }}</p>
          </div>

          @if (loi()) {
            <app-alert muc="danger" title="Đăng nhập không thành công">{{ loi() }}</app-alert>
          }

          <form (submit)="dangNhap($event)">
            <div class="o-nhap">
              <label for="tai-khoan">{{ cong().nhanTaiKhoan }}</label>
              <input
                id="tai-khoan"
                [type]="cong().loaiTaiKhoan === 'email' ? 'email' : 'text'"
                name="tai-khoan"
                autocomplete="username"
                [placeholder]="cong().placeholder"
                [value]="taiKhoan()"
                (input)="taiKhoan.set($any($event.target).value)"
                required
              />
            </div>

            <div class="o-nhap">
              <div class="nhan-hang">
                <label for="mat-khau">Mật khẩu</label>
                <span class="ho-tro-mat-khau">Quên mật khẩu? Liên hệ quản trị viên.</span>
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
                  {{ hienMatKhau() ? 'Ẩn' : 'Hiện' }}
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

          <p class="ho-tro">Chưa có tài khoản? Liên hệ quản trị viên để được cấp.</p>

          <nav class="doi-cong" aria-label="Chọn cổng đăng nhập">
            <span>Đăng nhập với tư cách</span>
            <div>
              <a
                routerLink="/dang-nhap/admin"
                [attr.aria-current]="cong().vaiTro === 'ADMIN' ? 'page' : null"
                >Quản trị</a
              >
              <a
                routerLink="/dang-nhap/giang-vien"
                [attr.aria-current]="cong().vaiTro === 'GIANG_VIEN' ? 'page' : null"
                >Giảng viên</a
              >
              <a
                routerLink="/dang-nhap/sinh-vien"
                [attr.aria-current]="cong().vaiTro === 'SINH_VIEN' ? 'page' : null"
                >Sinh viên</a
              >
            </div>
          </nav>
        </div>
      </main>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100vh;
    }

    .trang {
      --portal-primary: var(--color-primary);
      --portal-soft: var(--color-primary-soft);
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      height: 100%;
    }

    .trang.giang-vien {
      --portal-primary: var(--color-info);
      --portal-soft: var(--color-info-soft);
    }

    .trang.sinh-vien {
      --portal-primary: var(--color-warning);
      --portal-soft: var(--color-warning-soft);
    }

    /* ---------- Cột trái ---------- */
    .gioi-thieu {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 38px 44px;
      background: linear-gradient(
        160deg,
        var(--color-sidebar-top) 0%,
        var(--color-sidebar-bottom) 100%
      );
      color: #ffffff;
    }

    .giang-vien .gioi-thieu {
      background: linear-gradient(155deg, #123d4f 0%, #102a3a 100%);
    }

    .sinh-vien .gioi-thieu {
      background: linear-gradient(155deg, #594019 0%, #302717 100%);
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

    .giang-vien .logo {
      background: var(--color-info);
    }

    .sinh-vien .logo {
      background: var(--color-warning);
    }

    .nhan-khu-vuc {
      color: rgba(255, 255, 255, 0.75);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin: 0 0 12px;
    }

    .loi-ich h2 {
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

    .loi-ich li::before {
      content: '';
      width: 6px;
      height: 10px;
      border-right: 2px solid #86efac;
      border-bottom: 2px solid #86efac;
      transform: rotate(45deg);
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

    .dau h1 {
      font-size: 25px;
      font-weight: 700;
      color: var(--color-ink);
      margin: 8px 0 0;
    }

    .nhan-vai-tro {
      display: inline-flex;
      padding: 5px 10px;
      border-radius: 999px;
      background: var(--portal-soft);
      color: var(--portal-primary);
      font-size: 12px;
      font-weight: 700;
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
      color: var(--portal-primary);
      text-decoration: none;
    }

    .ho-tro-mat-khau {
      font-size: 12.5px;
      color: var(--color-ink-muted);
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
      transition:
        border-color var(--dur) var(--ease),
        box-shadow var(--dur) var(--ease);
    }

    input:focus {
      border-color: var(--portal-primary);
      box-shadow: 0 0 0 3px var(--portal-soft);
    }

    .o-mat-khau {
      position: relative;
    }

    .o-mat-khau input {
      padding-right: 56px;
    }

    .hien {
      position: absolute;
      top: 50%;
      right: 6px;
      transform: translateY(-50%);
      display: grid;
      place-items: center;
      min-width: 42px;
      height: 30px;
      padding: 0 4px;
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--portal-primary);
      font-size: 12px;
      font-weight: 600;
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
      accent-color: var(--portal-primary);
      cursor: pointer;
    }

    app-button {
      display: block;
    }

    app-button ::ng-deep button {
      width: 100%;
    }

    .trang.giang-vien app-button ::ng-deep button.bt-primary {
      background: var(--portal-primary);
    }

    .trang.giang-vien app-button ::ng-deep button.bt-primary:hover:not(:disabled) {
      background: var(--color-info-hover);
    }

    .trang.sinh-vien app-button ::ng-deep button.bt-primary {
      background: var(--portal-primary);
    }

    .trang.sinh-vien app-button ::ng-deep button.bt-primary:hover:not(:disabled) {
      background: var(--color-warning-hover);
    }

    .ho-tro {
      margin: 0;
      font-size: 12.5px;
      color: var(--color-ink-subtle);
      text-align: center;
    }

    .doi-cong {
      border-top: 1px solid var(--color-border);
      padding-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 9px;
      text-align: center;
      color: var(--color-ink-subtle);
      font-size: 12px;
    }

    .doi-cong div {
      display: flex;
      justify-content: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .doi-cong a {
      color: var(--portal-primary);
      border-radius: var(--radius-sm);
      padding: 5px 8px;
      text-decoration: none;
    }

    .doi-cong a[aria-current='page'] {
      background: var(--portal-soft);
      font-weight: 700;
    }

    /* ---------- Responsive ---------- */
    @media (max-width: 900px) {
      .trang {
        grid-template-columns: minmax(0, 1fr);
      }

      .gioi-thieu {
        gap: 20px;
        padding: 20px 24px;
      }

      .loi-ich {
        display: none;
      }

      .chan-trang {
        display: none;
      }

      .form-vung {
        align-items: start;
      }
    }

    @media (max-width: 480px) {
      .thuong-hieu {
        font-size: 13px;
      }

      .gioi-thieu {
        padding: 16px;
      }

      .form-vung {
        padding: 28px 20px;
      }
    }
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly cong = toSignal(
    this.route.data.pipe(map((data) => this.layCongDangNhap(data['vaiTroDangNhap']))),
    { initialValue: CONG_DANG_NHAP.ADMIN },
  );

  readonly taiKhoan = signal('');
  readonly matKhau = signal('');
  readonly ghiNho = signal(false);
  readonly hienMatKhau = signal(false);
  readonly dangGui = signal(false);
  readonly loi = signal<string | null>(null);

  private layCongDangNhap(vaiTro: unknown): CongDangNhap {
    if (vaiTro === 'ADMIN' || vaiTro === 'GIANG_VIEN' || vaiTro === 'SINH_VIEN') {
      return CONG_DANG_NHAP[vaiTro];
    }
    throw new Error('Cổng đăng nhập chưa được cấu hình vai trò hợp lệ.');
  }

  dangNhap(suKien: Event): void {
    suKien.preventDefault();
    if (this.dangGui()) return;

    this.loi.set(null);
    this.dangGui.set(true);
    this.auth
      .dangNhap(this.taiKhoan().trim(), this.matKhau(), this.ghiNho(), this.cong().loaiTaiKhoan)
      .pipe(finalize(() => this.dangGui.set(false)))
      .subscribe({
        next: (nguoiDung) => {
          if (nguoiDung.vai_tro !== this.cong().vaiTro) {
            this.auth.xoaPhien();
            this.loi.set(`Tài khoản này không thuộc cổng ${this.cong().tenVaiTro}.`);
            return;
          }

          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          const den = nguoiDung.must_change_password
            ? '/doi-mat-khau'
            : this.laDuongDanNoiBo(returnUrl)
              ? returnUrl
              : '/dashboard';
          void this.router.navigateByUrl(den);
        },
        error: (loi: unknown) => this.loi.set(this.thongBaoLoi(loi)),
      });
  }

  private laDuongDanNoiBo(duongDan: string | null): duongDan is string {
    return (
      !!duongDan &&
      duongDan.startsWith('/') &&
      !duongDan.startsWith('//') &&
      duongDan !== '/dang-nhap'
    );
  }

  private thongBaoLoi(loi: unknown): string {
    if (!(loi instanceof HttpErrorResponse))
      return 'Không thể đăng nhập lúc này. Vui lòng thử lại.';
    if (loi.status === 401) return 'Thông tin đăng nhập hoặc mật khẩu không chính xác.';
    if (loi.status === 403) return 'Tài khoản đang bị khóa hoặc không được phép đăng nhập.';
    if (loi.status === 429) return 'Bạn đã thử quá nhiều lần. Vui lòng chờ rồi thử lại.';

    const message = loi.error?.message;
    return typeof message === 'string' && message.trim()
      ? message
      : 'Không thể kết nối máy chủ. Vui lòng thử lại.';
  }
}
