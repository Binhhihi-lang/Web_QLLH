import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  NguoiDungInput,
  NguoiDungService,
  VaiTroNguoiDung,
} from '@core/services/nguoi-dung.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { FormField } from '@shared/ui/form-field';
import { PageHeader } from '@shared/ui/page-header';

@Component({
  selector: 'app-nguoi-dung-form',
  standalone: true,
  imports: [AppAlert, AppButton, FormField, PageHeader, RouterLink],
  template: `
    @if (matKhauBanDau(); as matKhau) {
      <div class="lop-phu">
        <section
          #hopMatKhau
          class="hop-mat-khau"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mat-khau-title"
        >
          <span class="material-icons bieu-tuong" aria-hidden="true">verified_user</span>
          <h2 id="mat-khau-title" tabindex="-1" #tieuDeMatKhau>Đã tạo tài khoản</h2>
          <p>
            Mật khẩu chỉ hiển thị một lần. Hãy sao chép và gửi an toàn cho người dùng; họ cần đổi
            mật khẩu ở lần đăng nhập đầu tiên.
          </p>
          <code>{{ matKhau }}</code>
          @if (loiSaoChep()) {
            <app-alert muc="warning">{{ loiSaoChep() }}</app-alert>
          } @else if (daSaoChep()) {
            <app-alert muc="success">Đã sao chép mật khẩu.</app-alert>
          }
          <div class="hanh-dong">
            <app-button variant="secondary" (click)="saoChep(matKhau)"
              >Sao chép mật khẩu</app-button
            >
            <app-button variant="primary" (click)="veDanhSach()"
              >Đã ghi lại, về danh sách</app-button
            >
          </div>
        </section>
      </div>
    } @else {
      <app-page-header
        [title]="dangSua() ? 'Sửa người dùng' : 'Thêm người dùng'"
        [description]="
          dangSua()
            ? 'Cập nhật thông tin tài khoản.'
            : 'Tạo tài khoản quản trị, giảng viên hoặc sinh viên.'
        "
      >
        <a class="nut-quay-lai" routerLink="/nguoi-dung">
          <span class="material-icons" aria-hidden="true">arrow_back</span>
          Danh sách người dùng
        </a>
      </app-page-header>

      @if (dangTai()) {
        <div class="dang-tai" role="status">Đang tải thông tin người dùng…</div>
      } @else if (loiTai()) {
        <app-alert muc="danger" title="Không tải được người dùng">
          {{ loiTai() }}
          <a routerLink="/nguoi-dung">Quay lại danh sách</a>
        </app-alert>
      } @else {
        <form class="form" (submit)="luu($event)" novalidate>
          @if (loiChung()) {
            <app-alert muc="danger" title="Chưa thể lưu tài khoản">{{ loiChung() }}</app-alert>
          }

          <section class="nhom-truong" aria-labelledby="thong-tin-tai-khoan">
            <div class="dau-nhom">
              <h2 id="thong-tin-tai-khoan">Thông tin tài khoản</h2>
              <p>Các trường có dấu * là bắt buộc.</p>
            </div>
            <div class="luoi">
              <app-form-field
                id="nguoi-dung-name"
                nhan="Họ và tên"
                goiY="Nhập họ tên đầy đủ"
                [giaTri]="name()"
                [loi]="loiTruong('name')"
                [daCham]="daGui()"
                [batBuoc]="true"
                (giaTriChange)="name.set($event)"
              />
              <app-form-field
                id="nguoi-dung-email"
                loai="email"
                nhan="Email đăng nhập"
                goiY="ten@university.edu.vn"
                [giaTri]="email()"
                [loi]="loiTruong('email')"
                [daCham]="daGui()"
                [batBuoc]="true"
                (giaTriChange)="email.set($event)"
              />
              <label class="truong" for="nguoi-dung-role">
                <span>Vai trò <b aria-hidden="true">*</b></span>
                <select
                  id="nguoi-dung-role"
                  [value]="vaiTro()"
                  [disabled]="!!hoSo()"
                  [attr.aria-invalid]="daGui() && !vaiTro()"
                  (change)="doiVaiTro($event)"
                >
                  <option value="">Chọn vai trò</option>
                  <option value="ADMIN">Quản trị viên</option>
                  <option value="GIANG_VIEN">Giảng viên</option>
                  <option value="SINH_VIEN">Sinh viên</option>
                </select>
                @if (daGui() && !vaiTro()) {
                  <span class="loi-truong">Vui lòng chọn vai trò.</span>
                }
                @if (hoSo()) {
                  <small class="goi-y">Vai trò được giữ theo hồ sơ đã liên kết.</small>
                }
              </label>
              <label class="truong" for="nguoi-dung-status">
                <span>Trạng thái tài khoản</span>
                <select
                  id="nguoi-dung-status"
                  [value]="trangThai() ? 'true' : 'false'"
                  (change)="doiTrangThai($event)"
                >
                  <option value="true">Đang hoạt động</option>
                  <option value="false">Đã khóa</option>
                </select>
              </label>
            </div>
          </section>

          @if (hoSo()) {
            <app-alert muc="info">
              Tài khoản đang liên kết hồ sơ
              {{ hoSo()!.loai === 'sinh_vien' ? 'sinh viên' : 'giảng viên' }}
              <strong>{{ hoSo()!.ho_ten }}</strong>
              ({{ hoSo()!.ma_sv ?? hoSo()!.ma_gv }}). Việc sửa hồ sơ thực hiện tại màn hình tương
              ứng.
            </app-alert>
          }
          @if (!dangSua()) {
            <app-alert muc="info">
              Hệ thống tự tạo mật khẩu ban đầu và chỉ hiển thị một lần sau khi lưu.
            </app-alert>
          }
          <div class="hanh-dong">
            <a class="nut-huy" routerLink="/nguoi-dung">Hủy</a>
            <app-button type="submit" [loading]="dangLuu()">
              {{ dangSua() ? 'Lưu thay đổi' : 'Tạo người dùng' }}
            </app-button>
          </div>
        </form>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      max-width: 920px;
      margin: 0 auto;
    }
    .nut-quay-lai,
    .nut-huy {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--color-primary);
      text-decoration: none;
      font-size: var(--text-small);
    }
    .form {
      display: grid;
      gap: 16px;
    }
    .nhom-truong {
      padding: 18px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
    }
    .dau-nhom {
      margin-bottom: 16px;
    }
    .dau-nhom h2 {
      margin: 0;
      font-size: var(--text-h3);
    }
    .dau-nhom p {
      margin: 5px 0 0;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
    }
    .luoi {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    .truong {
      display: grid;
      align-content: start;
      gap: 5px;
      color: var(--color-ink);
      font-size: var(--text-small);
    }
    .truong b {
      color: var(--color-danger);
    }
    .truong select {
      min-height: 40px;
      padding: 8px 10px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
    }
    .truong select:focus {
      outline: 3px solid var(--color-primary-soft);
      border-color: var(--color-primary);
    }
    .loi-truong {
      color: var(--color-danger);
    }
    .goi-y {
      color: var(--color-ink-muted);
    }
    .hanh-dong {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
    }
    .dang-tai {
      padding: 24px;
      color: var(--color-ink-muted);
      text-align: center;
    }
    .lop-phu {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: grid;
      place-items: center;
      padding: 16px;
      background: rgb(0 0 0 / 45%);
    }
    .hop-mat-khau {
      display: grid;
      gap: 14px;
      width: min(100%, 520px);
      padding: 24px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
    }
    .hop-mat-khau h2,
    .hop-mat-khau p {
      margin: 0;
    }
    .hop-mat-khau p {
      color: var(--color-ink-muted);
      line-height: var(--leading-normal);
    }
    .hop-mat-khau code {
      overflow-wrap: anywhere;
      padding: 12px;
      border-radius: var(--radius);
      background: var(--color-surface-alt);
      font-size: 1.1rem;
    }
    .bieu-tuong {
      color: var(--color-success);
      font-size: 32px;
    }
    @media (max-width: 640px) {
      .luoi {
        grid-template-columns: 1fr;
      }
      .nhom-truong {
        padding: 14px;
      }
      .hanh-dong {
        align-items: stretch;
        flex-direction: column-reverse;
      }
      .hanh-dong > * {
        justify-content: center;
      }
    }
  `,
})
export class NguoiDungForm {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(NguoiDungService);

  private readonly idParam = this.route.snapshot.paramMap.get('id');
  readonly id = this.layId(this.idParam);
  readonly dangSua = computed(() => this.idParam !== null);
  readonly name = signal('');
  readonly email = signal('');
  readonly vaiTro = signal<VaiTroNguoiDung | ''>('');
  readonly trangThai = signal(true);
  readonly hoSo = signal<{
    loai: 'sinh_vien' | 'giang_vien';
    ho_ten: string;
    ma_sv?: string;
    ma_gv?: string;
  } | null>(null);
  readonly dangTai = signal(false);
  readonly dangLuu = signal(false);
  readonly daGui = signal(false);
  readonly loiTai = signal<string | null>(null);
  readonly loiChung = signal<string | null>(null);
  readonly loiApi = signal<Record<string, string[]>>({});
  readonly matKhauBanDau = signal<string | null>(null);
  readonly daSaoChep = signal(false);
  readonly loiSaoChep = signal<string | null>(null);
  private readonly hopMatKhau = viewChild<ElementRef<HTMLElement>>('hopMatKhau');
  private readonly tieuDeMatKhau = viewChild<ElementRef<HTMLHeadingElement>>('tieuDeMatKhau');

  constructor() {
    effect(() => {
      if (this.matKhauBanDau()) this.tieuDeMatKhau()?.nativeElement.focus();
    });
    if (this.idParam !== null && this.id === null) {
      this.loiTai.set('Mã người dùng không hợp lệ.');
    } else if (this.id !== null) {
      this.taiThongTin();
    }
  }

  doiVaiTro(event: Event): void {
    this.vaiTro.set((event.target as HTMLSelectElement).value as VaiTroNguoiDung | '');
  }

  doiTrangThai(event: Event): void {
    this.trangThai.set((event.target as HTMLSelectElement).value === 'true');
  }

  loiTruong(truong: string): string {
    if (!this.daGui()) return '';
    const loiApi = this.loiApi()[truong]?.[0];
    if (loiApi) return loiApi;
    if (truong === 'name' && !this.name().trim()) return 'Vui lòng nhập họ tên.';
    if (truong === 'name' && this.name().trim().length > 255) {
      return 'Họ tên không được vượt quá 255 ký tự.';
    }
    if (truong === 'email') {
      if (!this.email().trim()) return 'Vui lòng nhập email.';
      if (this.email().trim().length > 255) return 'Email không được vượt quá 255 ký tự.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email())) return 'Email không hợp lệ.';
    }
    return '';
  }

  luu(event: Event): void {
    event.preventDefault();
    this.daGui.set(true);
    this.loiApi.set({});
    this.loiChung.set(null);
    if (this.loiTruong('name') || this.loiTruong('email') || !this.vaiTro()) return;

    const duLieu: NguoiDungInput = {
      name: this.name().trim(),
      email: this.email().trim(),
      vai_tro: this.vaiTro() as VaiTroNguoiDung,
      trang_thai: this.trangThai(),
    };
    this.dangLuu.set(true);
    if (this.id) {
      this.service.capNhat(this.id, duLieu).subscribe({
        next: () => {
          this.dangLuu.set(false);
          void this.router.navigate(['/nguoi-dung']);
        },
        error: (error: HttpErrorResponse) => this.xuLyLoiLuu(error),
      });
    } else {
      this.service.taoMoi(duLieu).subscribe({
        next: (user) => {
          this.dangLuu.set(false);
          this.matKhauBanDau.set(user.mat_khau_ban_dau);
        },
        error: (error: HttpErrorResponse) => this.xuLyLoiLuu(error),
      });
    }
  }

  veDanhSach(): void {
    void this.router.navigate(['/nguoi-dung']);
  }

  async saoChep(matKhau: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(matKhau);
      this.daSaoChep.set(true);
      this.loiSaoChep.set(null);
    } catch {
      this.daSaoChep.set(false);
      this.loiSaoChep.set(
        'Trình duyệt không cho phép sao chép. Hãy chọn và sao chép mật khẩu thủ công.',
      );
    }
  }

  @HostListener('document:keydown', ['$event'])
  giuFocusTrongHop(event: KeyboardEvent): void {
    if (!this.matKhauBanDau() || event.key !== 'Tab') return;
    const dialog = this.hopMatKhau()?.nativeElement;
    if (!dialog) return;
    const buttons = Array.from(
      dialog.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled)'),
    );
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === this.tieuDeMatKhau()?.nativeElement)) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  private layId(param: string | null): number | null {
    if (param === null) return null;
    const id = Number(param);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  private taiThongTin(): void {
    if (!this.id) return;
    this.dangTai.set(true);
    this.service.layMot(this.id).subscribe({
      next: (user) => {
        this.name.set(user.name);
        this.email.set(user.email);
        this.vaiTro.set(user.vai_tro);
        this.trangThai.set(user.trang_thai);
        this.hoSo.set(user.ho_so);
        this.dangTai.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loiTai.set(error.error?.message ?? 'Không tải được thông tin người dùng.');
        this.dangTai.set(false);
      },
    });
  }

  private xuLyLoiLuu(error: HttpErrorResponse): void {
    this.dangLuu.set(false);
    this.loiApi.set(error.error?.errors ?? {});
    this.loiChung.set(error.error?.message ?? 'Không lưu được tài khoản.');
  }
}
