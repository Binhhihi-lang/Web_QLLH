import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService, CapNhatHoSoInput } from '@core/auth/auth.service';
import { GiangVien, NguoiDung, SinhVien } from '@core/models/dao-tao.model';
import { GiangVienService } from '@core/services/giang-vien.service';
import { SinhVienService } from '@core/services/sinh-vien.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';

@Component({
  selector: 'app-tai-khoan',
  standalone: true,
  imports: [AppAlert, AppButton, RouterLink],
  template: `
    <main class="trang">
      <header class="dau-trang">
        <div>
          <p class="nhan-trang">HỒ SƠ CÁ NHÂN</p>
          <h1>Tài khoản của tôi</h1>
          <p class="mo-ta">Quản lý thông tin liên hệ và thông tin tài khoản của bạn.</p>
        </div>
        <a class="doi-mat-khau" routerLink="/doi-mat-khau">
          <span class="material-icons" aria-hidden="true">lock_reset</span>
          Đổi mật khẩu
        </a>
      </header>

      @if (loi()) {
        <app-alert muc="danger" title="Không thể hoàn tất thao tác">{{ loi() }}</app-alert>
      }
      @if (thanhCong()) {
        <app-alert muc="success" title="Đã lưu thay đổi">{{ thanhCong() }}</app-alert>
      }

      @if (dangTai()) {
        <section class="the trang-thai" aria-live="polite">
          <span class="vong-xoay" aria-hidden="true"></span>
          <span>Đang tải thông tin tài khoản...</span>
        </section>
      } @else if (nguoiDung(); as user) {
        <section class="the tom-tat" aria-label="Thông tin tài khoản">
          <div class="anh-dai-dien">
            @if (user.avatar_url) {
              <img [src]="user.avatar_url" alt="" />
            } @else {
              <span>{{ chuVietTat() }}</span>
            }
          </div>
          <div class="nhan-dien">
            <h2>{{ tenHienThi() }}</h2>
            <p>{{ tenVaiTro() }}</p>
          </div>
          <span class="trang-thai-tk" [class.bi-khoa]="!user.trang_thai">
            <span class="cham-trang-thai" aria-hidden="true"></span>
            {{ user.trang_thai ? 'Đang hoạt động' : 'Đã khóa' }}
          </span>
        </section>

        @if (user.vai_tro === 'ADMIN' || giangVien() || sinhVien()) {
          <form class="the form-ho-so" (submit)="luuHoSo($event)">
            <div class="tieu-de-the">
              <div>
                <h2>Thông tin cá nhân</h2>
                <p>Các thông tin có thể chỉnh sửa phụ thuộc vào vai trò của bạn.</p>
              </div>
              <span class="huy-hieu-vai-tro">{{ tenVaiTro() }}</span>
            </div>

            @if (user.vai_tro === 'ADMIN') {
              <div class="luoi-truong">
                <label>
                  Họ và tên
                  <input
                    type="text"
                    name="name"
                    autocomplete="name"
                    maxlength="255"
                    required
                    [value]="ten()"
                    (input)="ten.set(giaTri($event))"
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    autocomplete="email"
                    maxlength="255"
                    required
                    [value]="email()"
                    (input)="email.set(giaTri($event))"
                  />
                </label>
              </div>
            } @else if (user.vai_tro === 'GIANG_VIEN') {
              @if (giangVien(); as gv) {
                <div class="luoi-truong">
                  <div class="truong-chi-doc">
                    <span>Mã giảng viên</span>
                    <strong>{{ gv.ma_gv }}</strong>
                  </div>
                  <div class="truong-chi-doc">
                    <span>Họ và tên</span>
                    <strong>{{ gv.ho_ten }}</strong>
                  </div>
                  <div class="truong-chi-doc">
                    <span>Email</span>
                    <strong>{{ gv.email }}</strong>
                  </div>
                  <label>
                    Số điện thoại
                    <input
                      type="tel"
                      name="so-dien-thoai"
                      autocomplete="tel"
                      maxlength="20"
                      [value]="soDienThoai()"
                      (input)="soDienThoai.set(giaTri($event))"
                    />
                  </label>
                </div>
              } @else if (!loi()) {
                <p class="dang-tai-ho-so">Đang tải thông tin giảng viên...</p>
              }
            } @else if (user.vai_tro === 'SINH_VIEN') {
              @if (sinhVien(); as sv) {
                <div class="luoi-truong">
                  <div class="truong-chi-doc">
                    <span>Mã sinh viên</span>
                    <strong>{{ sv.ma_sv }}</strong>
                  </div>
                  <div class="truong-chi-doc">
                    <span>Họ và tên</span>
                    <strong>{{ sv.ho_ten }}</strong>
                  </div>
                  <div class="truong-chi-doc">
                    <span>Email</span>
                    <strong>{{ sv.email }}</strong>
                  </div>
                  <div class="truong-chi-doc">
                    <span>Lớp hành chính</span>
                    <strong>{{ sv.lop_hanh_chinh?.ten_lop ?? 'Chưa xếp lớp' }}</strong>
                  </div>
                  <label>
                    Số điện thoại
                    <input
                      type="tel"
                      name="so-dien-thoai"
                      autocomplete="tel"
                      maxlength="20"
                      [value]="soDienThoai()"
                      (input)="soDienThoai.set(giaTri($event))"
                    />
                  </label>
                  <label class="truong-rong">
                    Địa chỉ
                    <textarea
                      name="dia-chi"
                      autocomplete="street-address"
                      rows="3"
                      [value]="diaChi()"
                      (input)="diaChi.set(giaTri($event))"
                    ></textarea>
                  </label>
                </div>
              } @else if (!loi()) {
                <p class="dang-tai-ho-so">Đang tải thông tin sinh viên...</p>
              }
            }

            <footer class="chan-form">
              <p>Thông tin định danh do nhà trường quản lý không thể chỉnh sửa tại đây.</p>
              <app-button type="submit" variant="primary" [loading]="dangLuu()">
                Lưu thay đổi
              </app-button>
            </footer>
          </form>
        }
      }
    </main>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }

    .trang {
      display: grid;
      gap: 20px;
      width: min(100%, 1050px);
      margin: 0 auto;
      padding: 8px 0 32px;
    }

    .dau-trang {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 4px;
    }

    .nhan-trang {
      margin: 0 0 7px;
      color: var(--color-primary);
      font-size: 11px;
      font-weight: 750;
      letter-spacing: 0.11em;
    }

    h1,
    h2,
    p {
      margin-top: 0;
    }

    h1 {
      margin-bottom: 6px;
      color: var(--color-ink);
      font-size: clamp(24px, 3vw, 30px);
      letter-spacing: -0.035em;
    }

    .mo-ta,
    .tieu-de-the p {
      margin-bottom: 0;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
    }

    .doi-mat-khau {
      display: inline-flex;
      min-height: 40px;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 0 14px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
      font-size: var(--text-small);
      font-weight: 650;
      text-decoration: none;
      white-space: nowrap;
    }

    .doi-mat-khau:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    .doi-mat-khau .material-icons {
      font-size: 19px;
    }

    .the {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }

    .tom-tat {
      display: flex;
      min-width: 0;
      align-items: center;
      gap: 16px;
      padding: 22px 24px;
    }

    .anh-dai-dien {
      display: grid;
      width: 68px;
      height: 68px;
      flex: 0 0 auto;
      place-items: center;
      overflow: hidden;
      border: 3px solid var(--color-primary-soft);
      border-radius: 50%;
      background: var(--color-primary-soft);
      color: var(--color-primary);
      font-size: 21px;
      font-weight: 750;
    }

    .anh-dai-dien img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .nhan-dien {
      min-width: 0;
      flex: 1;
    }

    .nhan-dien h2 {
      overflow-wrap: anywhere;
      margin: 0 0 4px;
      color: var(--color-ink);
      font-size: 18px;
    }

    .nhan-dien p {
      margin: 0;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
    }

    .trang-thai-tk {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 6px 10px;
      border-radius: 999px;
      background: var(--color-success-soft);
      color: var(--color-success);
      font-size: 12px;
      font-weight: 650;
      white-space: nowrap;
    }

    .trang-thai-tk.bi-khoa {
      background: var(--color-danger-soft);
      color: var(--color-danger);
    }

    .cham-trang-thai {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
    }

    .form-ho-so {
      padding: 24px;
    }

    .tieu-de-the {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 22px;
    }

    .tieu-de-the h2 {
      margin-bottom: 5px;
      color: var(--color-ink);
      font-size: 17px;
    }

    .huy-hieu-vai-tro {
      padding: 6px 10px;
      border-radius: 999px;
      background: var(--color-primary-soft);
      color: var(--color-primary);
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }

    .luoi-truong {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px 20px;
    }

    label,
    .truong-chi-doc {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: 7px;
      color: var(--color-ink);
      font-size: var(--text-small);
      font-weight: 650;
    }

    input,
    textarea {
      width: 100%;
      min-width: 0;
      padding: 11px 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
      font: inherit;
      font-weight: 400;
    }

    textarea {
      min-height: 88px;
      resize: vertical;
    }

    input:focus,
    textarea:focus {
      border-color: var(--color-primary);
      outline: 3px solid var(--color-primary-soft);
    }

    .truong-chi-doc {
      min-height: 68px;
      justify-content: center;
      padding: 10px 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-bg);
    }

    .truong-chi-doc span {
      color: var(--color-ink-muted);
      font-size: 12px;
      font-weight: 500;
    }

    .truong-chi-doc strong {
      overflow-wrap: anywhere;
      color: var(--color-ink);
      font-size: var(--text-small);
      font-weight: 650;
    }

    .truong-rong {
      grid-column: 1 / -1;
    }

    .chan-form {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid var(--color-border);
    }

    .chan-form p {
      max-width: 500px;
      margin: 0;
      color: var(--color-ink-muted);
      font-size: 12px;
      line-height: 1.5;
    }

    app-button ::ng-deep button {
      min-width: 150px;
    }

    .trang-thai {
      display: flex;
      min-height: 120px;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
    }

    .vong-xoay {
      width: 20px;
      height: 20px;
      border: 2px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: xoay 0.8s linear infinite;
    }

    .dang-tai-ho-so {
      margin: 0;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
    }

    @keyframes xoay {
      to {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 640px) {
      .trang {
        gap: 14px;
      }

      .dau-trang {
        align-items: flex-start;
      }

      .doi-mat-khau {
        width: 40px;
        min-width: 40px;
        padding: 0;
        font-size: 0;
      }

      .doi-mat-khau .material-icons {
        font-size: 21px;
      }

      .tom-tat,
      .form-ho-so {
        padding: 18px;
      }

      .tom-tat {
        flex-wrap: wrap;
        gap: 12px;
      }

      .anh-dai-dien {
        width: 56px;
        height: 56px;
      }

      .trang-thai-tk {
        margin-left: 68px;
      }

      .luoi-truong {
        grid-template-columns: minmax(0, 1fr);
        gap: 14px;
      }

      .truong-rong {
        grid-column: auto;
      }

      .chan-form {
        align-items: stretch;
        flex-direction: column;
      }

      app-button ::ng-deep button {
        width: 100%;
      }
    }
  `,
})
export class TaiKhoanPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly giangVienService = inject(GiangVienService);
  private readonly sinhVienService = inject(SinhVienService);

  readonly nguoiDung = this.auth.nguoiDung;
  readonly giangVien = signal<GiangVien | null>(null);
  readonly sinhVien = signal<SinhVien | null>(null);
  readonly ten = signal('');
  readonly email = signal('');
  readonly soDienThoai = signal('');
  readonly diaChi = signal('');
  readonly dangTai = signal(true);
  readonly dangLuu = signal(false);
  readonly loi = signal<string | null>(null);
  readonly thanhCong = signal<string | null>(null);
  readonly tenHienThi = computed(() => {
    const user = this.nguoiDung();
    return user?.ho_so?.ho_ten ?? user?.name ?? '';
  });
  readonly tenVaiTro = computed(() => {
    switch (this.nguoiDung()?.vai_tro) {
      case 'ADMIN':
        return 'Quản trị viên';
      case 'GIANG_VIEN':
        return 'Giảng viên';
      case 'SINH_VIEN':
        return 'Sinh viên';
      default:
        return '';
    }
  });
  readonly chuVietTat = computed(() => {
    const tu = this.tenHienThi().trim().split(/\s+/).filter(Boolean);
    if (tu.length === 0) return '?';
    if (tu.length === 1) return tu[0].slice(0, 2).toUpperCase();
    return `${tu[tu.length - 2][0]}${tu[tu.length - 1][0]}`.toUpperCase();
  });

  ngOnInit(): void {
    const user = this.nguoiDung();
    if (user) {
      this.chuanBiHoSo(user);
      return;
    }

    this.auth.layNguoiDung().subscribe({
      next: (nguoiDung) => this.chuanBiHoSo(nguoiDung),
      error: (loi: unknown) => {
        this.loi.set(this.thongBaoLoi(loi));
        this.dangTai.set(false);
      },
    });
  }

  giaTri(suKien: Event): string {
    return (suKien.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  luuHoSo(suKien: Event): void {
    suKien.preventDefault();
    if (this.dangLuu()) return;

    const user = this.nguoiDung();
    if (!user) {
      this.loi.set('Phiên đăng nhập không còn hợp lệ. Vui lòng tải lại trang.');
      return;
    }

    const duLieu = this.duLieuCapNhat(user);
    this.loi.set(null);
    this.thanhCong.set(null);
    this.dangLuu.set(true);
    this.auth
      .capNhatHoSo(duLieu)
      .pipe(finalize(() => this.dangLuu.set(false)))
      .subscribe({
        next: () => {
          this.capNhatHoSoHienThi(duLieu);
          this.thanhCong.set('Thông tin tài khoản đã được cập nhật.');
        },
        error: (loi: unknown) => this.loi.set(this.thongBaoLoi(loi)),
      });
  }

  private chuanBiHoSo(user: NguoiDung): void {
    this.ten.set(user.name);
    this.email.set(user.email);

    if (user.vai_tro === 'ADMIN') {
      this.dangTai.set(false);
      return;
    }

    const hoSoId = user.ho_so?.id;
    if (hoSoId === undefined) {
      this.loi.set('Không tìm thấy hồ sơ gắn với tài khoản này.');
      this.dangTai.set(false);
      return;
    }

    if (user.vai_tro === 'GIANG_VIEN') {
      this.giangVienService.layMot(hoSoId).subscribe({
        next: (giangVien) => {
          this.giangVien.set(giangVien);
          this.soDienThoai.set(giangVien.so_dien_thoai ?? '');
          this.dangTai.set(false);
        },
        error: (loi: unknown) => {
          this.loi.set(this.thongBaoLoi(loi));
          this.dangTai.set(false);
        },
      });
      return;
    }

    this.sinhVienService.layMot(hoSoId).subscribe({
      next: (sinhVien) => {
        this.sinhVien.set(sinhVien);
        this.soDienThoai.set(sinhVien.so_dien_thoai ?? '');
        this.diaChi.set(sinhVien.dia_chi ?? '');
        this.dangTai.set(false);
      },
      error: (loi: unknown) => {
        this.loi.set(this.thongBaoLoi(loi));
        this.dangTai.set(false);
      },
    });
  }

  private duLieuCapNhat(user: NguoiDung): CapNhatHoSoInput {
    if (user.vai_tro === 'ADMIN') return { name: this.ten(), email: this.email() };
    if (user.vai_tro === 'GIANG_VIEN') return { so_dien_thoai: this.soDienThoai() || null };
    return { so_dien_thoai: this.soDienThoai() || null, dia_chi: this.diaChi() || null };
  }

  private capNhatHoSoHienThi(duLieu: CapNhatHoSoInput): void {
    if (duLieu.so_dien_thoai !== undefined) {
      this.giangVien.update((gv) =>
        gv ? { ...gv, so_dien_thoai: duLieu.so_dien_thoai ?? null } : gv,
      );
      this.sinhVien.update((sv) =>
        sv ? { ...sv, so_dien_thoai: duLieu.so_dien_thoai ?? null } : sv,
      );
    }
    if (duLieu.dia_chi !== undefined) {
      this.sinhVien.update((sv) => (sv ? { ...sv, dia_chi: duLieu.dia_chi ?? null } : sv));
    }
  }

  private thongBaoLoi(loi: unknown): string {
    if (!(loi instanceof HttpErrorResponse)) {
      return 'Không thể cập nhật thông tin lúc này. Vui lòng thử lại.';
    }

    const errors = (loi.error as { errors?: Record<string, string[]> } | null)?.errors;
    const loiTruong = Object.values(errors ?? {}).flat()[0];
    if (loiTruong) return loiTruong;
    return loi.error?.message ?? 'Không thể kết nối máy chủ. Vui lòng thử lại.';
  }
}
