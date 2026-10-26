import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TuyChonLopHanhChinh } from '@core/models/dao-tao.model';
import { SinhVienInput, SinhVienService } from '@core/services/sinh-vien.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { FormField } from '@shared/ui/form-field';
import { PageHeader } from '@shared/ui/page-header';

@Component({
  selector: 'app-sinh-vien-form',
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
          <h2 id="mat-khau-tieu-de" tabindex="-1" #tieuDeMatKhau>Đã tạo tài khoản sinh viên</h2>
          <p class="mo-ta">
            Hãy gửi mật khẩu này cho sinh viên. Mật khẩu chỉ được hiển thị một lần và cần đổi ở lần đăng nhập đầu.
          </p>
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
        [title]="laChinhSua ? 'Sửa sinh viên' : 'Thêm sinh viên'"
        [description]="
          laChinhSua
            ? 'Cập nhật hồ sơ sinh viên và thông tin tài khoản.'
            : 'Tạo hồ sơ và tài khoản đăng nhập cho sinh viên.'
        "
      >
        <a class="nut-quay-lai" routerLink="/sinh-vien">
          <span class="material-icons" aria-hidden="true">arrow_back</span>
          Danh sách sinh viên
        </a>
      </app-page-header>

      @if (dangTai()) {
        <div class="dang-tai" role="status" aria-live="polite">Đang tải thông tin sinh viên…</div>
      } @else if (!loiTai()) {
        <form class="form" (submit)="gui($event)" novalidate>
          @if (loiChung()) {
            <app-alert muc="danger" title="Chưa thể lưu hồ sơ">{{ loiChung() }}</app-alert>
          }
          @if (loiTaiLop()) {
            <app-alert muc="warning">{{ loiTaiLop() }} Có thể lưu hồ sơ mà không chọn lớp.</app-alert>
          }

          <section class="nhom-truong" aria-labelledby="thong-tin-ca-nhan">
            <div class="dau-nhom">
              <h2 id="thong-tin-ca-nhan">Thông tin cá nhân</h2>
              <p>Các trường có dấu * là bắt buộc.</p>
            </div>
            <div class="luoi">
              <app-form-field
                id="ma-sv"
                nhan="Mã sinh viên"
                goiY="Ví dụ: 2100001"
                [giaTri]="maSv()"
                [loi]="loiMaSv()"
                [daCham]="daCham()"
                [batBuoc]="true"
                (giaTriChange)="maSv.set($event)"
              />
              <app-form-field
                id="ho-ten"
                nhan="Họ và tên"
                goiY="Nhập họ tên đầy đủ"
                [giaTri]="hoTen()"
                [loi]="loiHoTen()"
                [daCham]="daCham()"
                [batBuoc]="true"
                (giaTriChange)="hoTen.set($event)"
              />
              <app-form-field
                id="email-sv"
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
                id="so-dien-thoai"
                loai="tel"
                nhan="Số điện thoại"
                goiY="Không bắt buộc"
                [giaTri]="soDienThoai()"
                [loi]="loiSoDienThoai()"
                [daCham]="daCham()"
                (giaTriChange)="soDienThoai.set($event)"
              />
              <app-form-field
                id="ngay-sinh"
                loai="date"
                nhan="Ngày sinh"
                [giaTri]="ngaySinh()"
                [loi]="loiTruong('ngay_sinh')"
                [daCham]="daCham()"
                (giaTriChange)="ngaySinh.set($event)"
              />
              <label class="truong">
                <span>Giới tính</span>
                <select
                  id="gioi-tinh"
                  [value]="gioiTinh() === null ? '' : gioiTinh() ? 'true' : 'false'"
                  (change)="doiGioiTinh($event)"
                >
                  <option value="">Chưa cung cấp</option>
                  <option value="true">Nam</option>
                  <option value="false">Nữ</option>
                </select>
              </label>
              <label class="truong">
                <span>Lớp hành chính</span>
                <select
                  id="lop-hanh-chinh"
                  (change)="doiLop($event)"
                >
                  <option value="" [selected]="lopId() === null">Chưa xếp lớp</option>
                  @for (lop of dsLop(); track lop.id) {
                    <option [value]="lop.id" [selected]="lop.id === lopId()">{{ lop.label }}</option>
                  }
                </select>
              </label>
              <label class="truong">
                <span>Trạng thái tài khoản</span>
                <select
                  id="trang-thai"
                  [value]="trangThai() ? 'true' : 'false'"
                  (change)="doiTrangThai($event)"
                >
                  <option value="true">Đang hoạt động</option>
                  <option value="false">Đã khóa</option>
                </select>
              </label>
              <app-form-field
                id="dia-chi"
                loai="textarea"
                nhan="Địa chỉ"
                goiY="Không bắt buộc"
                [giaTri]="diaChi()"
                [loi]="loiTruong('dia_chi')"
                [daCham]="daCham()"
                (giaTriChange)="diaChi.set($event)"
              />
            </div>
          </section>

          @if (!laChinhSua) {
            <app-alert muc="info">
              Hệ thống sẽ tạo mật khẩu ban đầu. Hãy lưu lại và gửi cho sinh viên sau khi tạo.
            </app-alert>
          }

          <div class="hanh-dong">
            <a class="nut-huy" routerLink="/sinh-vien">Huỷ</a>
            <app-button type="submit" [loading]="dangGui()">
              {{ laChinhSua ? 'Lưu thay đổi' : 'Tạo sinh viên' }}
            </app-button>
          </div>
        </form>
      } @else {
        <app-alert muc="danger" title="Không tải được sinh viên">
          {{ loiTai() }}
          <a routerLink="/sinh-vien">Quay lại danh sách</a>
        </app-alert>
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

    .hanh-dong {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
    }

    .nut-huy,
    .nut-quay-lai {
      display: inline-flex;
      align-items: center;
      gap: 6px;
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

    .mo-ta {
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
export class SinhVienForm {
  private readonly service = inject(SinhVienService);
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
  readonly loiTaiLop = signal('');
  readonly loiSaoChep = signal('');
  readonly daSaoChep = signal(false);
  readonly loiApi = signal<Record<string, string[]>>({});
  readonly dsLop = signal<TuyChonLopHanhChinh[]>([]);
  readonly matKhauBanDau = signal<string | null>(null);

  readonly maSv = signal('');
  readonly hoTen = signal('');
  readonly email = signal('');
  readonly ngaySinh = signal('');
  readonly gioiTinh = signal<boolean | null>(true);
  readonly soDienThoai = signal('');
  readonly diaChi = signal('');
  readonly lopId = signal<number | null>(null);
  readonly trangThai = signal(true);

  readonly loiMaSv = computed(
    () =>
      this.loiTruong('ma_sv') ||
      (this.daCham() && !this.maSv().trim() ? 'Mã sinh viên là bắt buộc.' : '') ||
      (this.maSv().trim().length > 50 ? 'Mã sinh viên không được vượt quá 50 ký tự.' : ''),
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
      this.loiTai.set('Mã sinh viên không hợp lệ.');
      return;
    }

    this.service.layTuyChonLop().subscribe({
      next: (ds) => this.dsLop.set(ds),
      error: () => this.loiTaiLop.set('Không tải được danh sách lớp hành chính.'),
    });

    if (this.id !== null) this.taiSinhVien(this.id);
  }

  loiTruong(truong: string): string {
    return this.loiApi()[truong]?.[0] ?? '';
  }

  doiGioiTinh(suKien: Event): void {
    const value = (suKien.target as HTMLSelectElement).value;
    this.gioiTinh.set(value === '' ? null : value === 'true');
  }

  doiLop(suKien: Event): void {
    const value = (suKien.target as HTMLSelectElement).value;
    this.lopId.set(value ? Number(value) : null);
  }

  doiTrangThai(suKien: Event): void {
    this.trangThai.set((suKien.target as HTMLSelectElement).value === 'true');
  }

  gui(suKien: Event): void {
    suKien.preventDefault();
    this.daCham.set(true);
    this.loiChung.set('');
    this.loiApi.set({});
    this.loiSaoChep.set('');
    this.daSaoChep.set(false);

    if (this.loiMaSv() || this.loiHoTen() || this.loiEmail() || this.loiSoDienThoai()) {
      return;
    }

    this.dangGui.set(true);
    const duLieu: SinhVienInput = {
      ma_sv: this.maSv().trim(),
      ho_ten: this.hoTen().trim(),
      email: this.email().trim(),
      ngay_sinh: this.ngaySinh() || null,
      gioi_tinh: this.gioiTinh(),
      so_dien_thoai: this.soDienThoai().trim() || null,
      dia_chi: this.diaChi().trim() || null,
      lop_hanh_chinh_id: this.lopId(),
      trang_thai: this.trangThai(),
    };

    if (this.id !== null) {
      this.service.capNhat(this.id, duLieu).subscribe({
        next: () => {
          this.dangGui.set(false);
          void this.router.navigate(['/sinh-vien']);
        },
        error: (error: unknown) => this.xuLyLoi(error),
      });
      return;
    }

    this.service.taoMoi(duLieu).subscribe({
      next: (sinhVien) => {
        this.dangGui.set(false);
        if (!sinhVien.mat_khau_ban_dau) {
          this.loiChung.set('Tạo tài khoản thành công nhưng API không trả mật khẩu ban đầu. Hãy liên hệ quản trị viên.');
          return;
        }
        this.matKhauBanDau.set(sinhVien.mat_khau_ban_dau);
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
    void this.router.navigate(['/sinh-vien']);
  }

  @HostListener('document:keydown', ['$event'])
  giuFocusTrongHop(suKien: KeyboardEvent): void {
    if (!this.matKhauBanDau() || suKien.key !== 'Tab') return;

    const hop = this.hopMatKhau()?.nativeElement;
    if (!hop) return;
    const nut = Array.from(
      hop.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled)'),
    );
    const dau = nut[0];
    const cuoi = nut[nut.length - 1];
    const dangFocus = document.activeElement;

    if (suKien.shiftKey && (dangFocus === dau || dangFocus === this.tieuDeMatKhau()?.nativeElement)) {
      suKien.preventDefault();
      cuoi?.focus();
    } else if (!suKien.shiftKey && dangFocus === cuoi) {
      suKien.preventDefault();
      dau?.focus();
    }
  }

  private layId(param: string | null): number | null {
    if (param === null) return null;
    const id = Number(param);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  private taiSinhVien(id: number): void {
    this.service.layMot(id).subscribe({
      next: (sv) => {
        this.maSv.set(sv.ma_sv);
        this.hoTen.set(sv.ho_ten);
        this.email.set(sv.email);
        this.ngaySinh.set(sv.ngay_sinh ?? '');
        this.gioiTinh.set(sv.gioi_tinh);
        this.soDienThoai.set(sv.so_dien_thoai ?? '');
        this.diaChi.set(sv.dia_chi ?? '');
        this.lopId.set(sv.lop_hanh_chinh?.id ?? null);
        this.trangThai.set(sv.trang_thai);
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
