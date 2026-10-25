import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, HostListener, computed, effect, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GiangVien } from '@core/models/dao-tao.model';
import { GiangVienInput, GiangVienService } from '@core/services/giang-vien.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { FormField } from '@shared/ui/form-field';
import { PageHeader } from '@shared/ui/page-header';

@Component({
  selector: 'app-giang-vien-form',
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
          aria-labelledby="mat-khau-tieu-de"
        >
          <span class="material-icons bieu-tuong" aria-hidden="true">verified_user</span>
          <h2 id="mat-khau-tieu-de" tabindex="-1" #tieuDeMatKhau>Đã tạo tài khoản giảng viên</h2>
          <p>Mật khẩu chỉ hiển thị một lần. Giảng viên cần đổi mật khẩu ở lần đăng nhập đầu tiên.</p>
          <div class="mat-khau" aria-label="Mật khẩu ban đầu">{{ matKhau }}</div>
          @if (loiSaoChep()) {
            <app-alert muc="warning">{{ loiSaoChep() }}</app-alert>
          } @else if (daSaoChep()) {
            <app-alert muc="success">Đã sao chép mật khẩu.</app-alert>
          }
          <div class="nut-hop">
            <app-button variant="secondary" (click)="saoChep(matKhau)">
              <span class="material-icons" aria-hidden="true">content_copy</span>
              Sao chép mật khẩu
            </app-button>
            <app-button variant="primary" (click)="veDanhSach()">Đã ghi lại, về danh sách</app-button>
          </div>
        </section>
      </div>
    } @else {
      <app-page-header
        [title]="laChinhSua ? 'Sửa giảng viên' : 'Thêm giảng viên'"
        [description]="laChinhSua ? 'Cập nhật hồ sơ và thông tin tài khoản giảng viên.' : 'Tạo hồ sơ và tài khoản đăng nhập cho giảng viên.'"
      >
        <a class="nut-quay-lai" routerLink="/giang-vien">
          <span class="material-icons" aria-hidden="true">arrow_back</span>
          Danh sách giảng viên
        </a>
      </app-page-header>

      @if (dangTai()) {
        <div class="dang-tai" role="status" aria-live="polite">Đang tải thông tin giảng viên…</div>
      } @else if (loiTai()) {
        <app-alert muc="danger" title="Không tải được giảng viên">
          {{ loiTai() }}
          <a routerLink="/giang-vien">Quay lại danh sách</a>
        </app-alert>
      } @else {
        <form class="form" (submit)="gui($event)" novalidate>
          @if (loiChung()) {
            <app-alert muc="danger" title="Chưa thể lưu hồ sơ">{{ loiChung() }}</app-alert>
          }

          <section class="nhom-truong" aria-labelledby="thong-tin-giang-vien">
            <div class="dau-nhom">
              <h2 id="thong-tin-giang-vien">Thông tin giảng viên</h2>
              <p>Các trường có dấu * là bắt buộc.</p>
            </div>
            <div class="luoi">
              <app-form-field
                id="ma-gv"
                nhan="Mã giảng viên"
                goiY="Ví dụ: GV0001"
                [giaTri]="maGv()"
                [loi]="loiMaGv()"
                [daCham]="daCham()"
                [batBuoc]="true"
                (giaTriChange)="maGv.set($event)"
              />
              <app-form-field
                id="ho-ten-gv"
                nhan="Họ và tên"
                goiY="Nhập họ tên đầy đủ"
                [giaTri]="hoTen()"
                [loi]="loiHoTen()"
                [daCham]="daCham()"
                [batBuoc]="true"
                (giaTriChange)="hoTen.set($event)"
              />
              <app-form-field
                id="email-gv"
                loai="email"
                nhan="Email đăng nhập"
                goiY="ten@university.edu.vn"
                [giaTri]="email()"
                [loi]="loiEmail()"
                [daCham]="daCham()"
                [batBuoc]="true"
                (giaTriChange)="email.set($event)"
              />
              <app-form-field
                id="dien-thoai-gv"
                loai="tel"
                nhan="Số điện thoại"
                goiY="Không bắt buộc"
                [giaTri]="soDienThoai()"
                [loi]="loiSoDienThoai()"
                [daCham]="daCham()"
                (giaTriChange)="soDienThoai.set($event)"
              />
              <app-form-field
                id="chuyen-mon-gv"
                nhan="Chuyên môn"
                goiY="Ví dụ: Công nghệ phần mềm"
                [giaTri]="chuyenMon()"
                [loi]="loiTruong('chuyen_mon')"
                [daCham]="daCham()"
                (giaTriChange)="chuyenMon.set($event)"
              />
              <label class="truong">
                <span>Trạng thái tài khoản</span>
                <select [value]="trangThai() ? 'true' : 'false'" (change)="doiTrangThai($event)">
                  <option value="true">Đang hoạt động</option>
                  <option value="false">Đã khóa</option>
                </select>
              </label>
            </div>
          </section>

          @if (!laChinhSua) {
            <app-alert muc="info">
              Hệ thống tạo mật khẩu ban đầu. Hãy lưu lại và gửi riêng cho giảng viên sau khi tạo.
            </app-alert>
          }

          <div class="hanh-dong">
            <a class="nut-huy" routerLink="/giang-vien">Huỷ</a>
            <app-button type="submit" [loading]="dangGui()">
              {{ laChinhSua ? 'Lưu thay đổi' : 'Tạo giảng viên' }}
            </app-button>
          </div>
        </form>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      max-width: 1040px;
      margin: 0 auto;
    }

    .form {
      display: grid;
      gap: 16px;
      max-width: 880px;
      padding-bottom: 24px;
    }

    .nhom-truong {
      padding: 20px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
    }

    .dau-nhom {
      margin-bottom: 18px;
    }

    .dau-nhom h2 {
      color: var(--color-ink);
      font-size: var(--text-h2);
      font-weight: 600;
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
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: 5px;
      color: var(--color-ink);
      font-size: var(--text-small);
      font-weight: 600;
    }

    select {
      width: 100%;
      min-height: 38px;
      padding: 8px 11px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
      font: 400 var(--text-small) var(--font-body);
    }

    select:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    .hanh-dong,
    .nut-huy,
    .nut-quay-lai {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .hanh-dong {
      justify-content: flex-end;
      gap: 12px;
    }

    .nut-huy,
    .nut-quay-lai {
      color: var(--color-ink-muted);
      font-size: var(--text-small);
      font-weight: 600;
      text-decoration: none;
    }

    .nut-huy:hover,
    .nut-quay-lai:hover {
      color: var(--color-primary);
    }

    .nut-quay-lai .material-icons {
      font-size: 18px;
    }

    .dang-tai {
      padding: 32px 16px;
      color: var(--color-ink-muted);
      text-align: center;
    }

    .lop-phu {
      position: fixed;
      inset: 0;
      z-index: 110;
      display: grid;
      place-items: center;
      overflow-y: auto;
      padding: 20px;
      background: rgba(15, 23, 42, 0.55);
    }

    .hop-mat-khau {
      display: grid;
      width: min(100%, 480px);
      gap: 14px;
      padding: 28px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-lg);
      text-align: center;
    }

    .bieu-tuong {
      color: var(--color-success);
      font-size: 36px;
    }

    .hop-mat-khau h2 {
      color: var(--color-ink);
      font-size: var(--text-h2);
      font-weight: 600;
    }

    .hop-mat-khau p {
      margin: 0;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
      line-height: var(--leading-normal);
    }

    .mat-khau {
      padding: 12px;
      border: 1px dashed var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface-alt);
      color: var(--color-ink);
      font-family: ui-monospace, monospace;
      font-size: var(--text-h2);
      font-weight: 700;
      letter-spacing: 0.06em;
      user-select: all;
    }

    .nut-hop {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
    }

    @media (max-width: 640px) {
      .luoi {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .nhom-truong {
        padding: 16px;
      }

      .nut-hop {
        flex-direction: column;
      }

      .nut-hop app-button {
        justify-content: center;
      }
    }
  `,
})
export class GiangVienForm {
  private readonly service = inject(GiangVienService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly hopMatKhau = viewChild<ElementRef<HTMLElement>>('hopMatKhau');
  private readonly tieuDeMatKhau = viewChild<ElementRef<HTMLHeadingElement>>('tieuDeMatKhau');
  private readonly thamSoId = this.route.snapshot.paramMap.get('id');

  readonly id = this.layId(this.thamSoId);
  readonly laChinhSua = this.thamSoId !== null;
  readonly dangTai = signal(this.laChinhSua);
  readonly dangGui = signal(false);
  readonly daCham = signal(false);
  readonly loiChung = signal('');
  readonly loiTai = signal('');
  readonly loiSaoChep = signal('');
  readonly daSaoChep = signal(false);
  readonly loiApi = signal<Record<string, string[]>>({});
  readonly matKhauBanDau = signal<string | null>(null);
  readonly maGv = signal('');
  readonly hoTen = signal('');
  readonly email = signal('');
  readonly soDienThoai = signal('');
  readonly chuyenMon = signal('');
  readonly trangThai = signal(true);

  readonly loiMaGv = computed(
    () =>
      this.loiTruong('ma_gv') ||
      (this.daCham() && !this.maGv().trim() ? 'Mã giảng viên là bắt buộc.' : '') ||
      (this.maGv().trim().length > 50 ? 'Mã giảng viên không được vượt quá 50 ký tự.' : ''),
  );
  readonly loiHoTen = computed(
    () =>
      this.loiTruong('ho_ten') ||
      (this.daCham() && !this.hoTen().trim() ? 'Họ tên là bắt buộc.' : '') ||
      (this.hoTen().trim().length > 255 ? 'Họ tên không được vượt quá 255 ký tự.' : ''),
  );
  readonly loiEmail = computed(() => {
    const value = this.email().trim();
    return (
      this.loiTruong('email') ||
      (this.daCham() && !value ? 'Email là bắt buộc.' : '') ||
      (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Email không hợp lệ.' : '')
    );
  });
  readonly loiSoDienThoai = computed(
    () =>
      this.loiTruong('so_dien_thoai') ||
      (this.soDienThoai().length > 20 ? 'Số điện thoại không được vượt quá 20 ký tự.' : ''),
  );

  constructor() {
    effect(() => {
      if (this.matKhauBanDau()) this.tieuDeMatKhau()?.nativeElement.focus();
    });

    if (this.laChinhSua && this.id === null) {
      this.dangTai.set(false);
      this.loiTai.set('Mã giảng viên không hợp lệ.');
      return;
    }
    if (this.id !== null) this.taiGiangVien(this.id);
  }

  loiTruong(field: string): string {
    return this.loiApi()[field]?.[0] ?? '';
  }

  doiTrangThai(event: Event): void {
    this.trangThai.set((event.target as HTMLSelectElement).value === 'true');
  }

  gui(event: Event): void {
    event.preventDefault();
    this.daCham.set(true);
    this.loiChung.set('');
    this.loiApi.set({});
    this.loiSaoChep.set('');
    this.daSaoChep.set(false);

    if (this.loiMaGv() || this.loiHoTen() || this.loiEmail() || this.loiSoDienThoai()) return;

    this.dangGui.set(true);
    const duLieu: GiangVienInput = {
      ma_gv: this.maGv().trim(),
      ho_ten: this.hoTen().trim(),
      email: this.email().trim(),
      so_dien_thoai: this.soDienThoai().trim() || null,
      chuyen_mon: this.chuyenMon().trim() || null,
      trang_thai: this.trangThai(),
    };

    if (this.id !== null) {
      this.service.capNhat(this.id, duLieu).subscribe({
        next: () => {
          this.dangGui.set(false);
          void this.router.navigate(['/giang-vien', this.id]);
        },
        error: (error: unknown) => this.xuLyLoi(error),
      });
      return;
    }

    this.service.taoMoi(duLieu).subscribe({
      next: (giangVien) => {
        this.dangGui.set(false);
        if (!giangVien.mat_khau_ban_dau) {
          this.loiChung.set(
            'Tạo tài khoản thành công nhưng API không trả mật khẩu ban đầu. Hãy liên hệ quản trị viên.',
          );
          return;
        }
        this.matKhauBanDau.set(giangVien.mat_khau_ban_dau);
      },
      error: (error: unknown) => this.xuLyLoi(error),
    });
  }

  async saoChep(matKhau: string): Promise<void> {
    this.loiSaoChep.set('');
    this.daSaoChep.set(false);
    try {
      await navigator.clipboard.writeText(matKhau);
      this.daSaoChep.set(true);
    } catch {
      this.loiSaoChep.set('Không thể truy cập clipboard. Hãy chọn và sao chép mật khẩu đang hiển thị.');
    }
  }

  veDanhSach(): void {
    void this.router.navigate(['/giang-vien']);
  }

  @HostListener('document:keydown', ['$event'])
  giuFocusTrongHop(event: KeyboardEvent): void {
    if (!this.matKhauBanDau() || event.key !== 'Tab') return;
    const dialog = this.hopMatKhau()?.nativeElement;
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]'));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && (document.activeElement === first || document.activeElement === this.tieuDeMatKhau()?.nativeElement)) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  private layId(param: string | null): number | null {
    if (param === null) return null;
    const id = Number(param);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  private taiGiangVien(id: number): void {
    this.service.layMot(id).subscribe({
      next: (gv) => {
        this.maGv.set(gv.ma_gv);
        this.hoTen.set(gv.ho_ten);
        this.email.set(gv.email);
        this.soDienThoai.set(gv.so_dien_thoai ?? '');
        this.chuyenMon.set(gv.chuyen_mon ?? '');
        this.trangThai.set(gv.trang_thai);
        this.dangTai.set(false);
      },
      error: (error: unknown) => {
        this.dangTai.set(false);
        this.loiTai.set(this.thongBaoLoi(error));
      },
    });
  }

  private xuLyLoi(error: unknown): void {
    this.dangGui.set(false);
    if (error instanceof HttpErrorResponse && laDoiTuong(error.error)) {
      const errors = error.error['errors'];
      if (laDoiTuong(errors)) {
        this.loiApi.set(
          Object.fromEntries(
            Object.entries(errors).filter(
              (entry): entry is [string, string[]] =>
                Array.isArray(entry[1]) && entry[1].every((value) => typeof value === 'string'),
            ),
          ),
        );
      }
    }
    this.loiChung.set(this.thongBaoLoi(error));
  }

  private thongBaoLoi(error: unknown): string {
    if (error instanceof HttpErrorResponse && laDoiTuong(error.error)) {
      const message = error.error['message'];
      if (typeof message === 'string' && message) return message;
    }
    return 'Không thể hoàn thành thao tác. Kiểm tra kết nối rồi thử lại.';
  }
}

function laDoiTuong(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
