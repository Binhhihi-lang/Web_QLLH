import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HocKy } from '@core/models/dao-tao.model';
import { AppAlert } from '@shared/ui/app-alert';
import { AppToastService } from '@shared/ui/app-toast.service';
import { AppButton } from '@shared/ui/app-button';
import { DateInput } from '@shared/ui/date-input';
import { FormField } from '@shared/ui/form-field';
import { PageHeader } from '@shared/ui/page-header';
import { HocKyInput, HocKyService } from './hoc-ky.service';

@Component({
  selector: 'app-hoc-ky-form',
  standalone: true,
  imports: [AppAlert, AppButton, DateInput, FormField, PageHeader, RouterLink],
  template: `
    <app-page-header
      [title]="laChinhSua ? 'Sửa học kỳ' : 'Thêm học kỳ'"
      [description]="
        laChinhSua
          ? 'Cập nhật thông tin và thời gian đăng ký của học kỳ.'
          : 'Tạo học kỳ mới với thời gian đào tạo và đợt đăng ký cụ thể.'
      "
    >
      <a class="nut-quay-lai" routerLink="/hoc-ky">
        <span class="material-icons" aria-hidden="true">arrow_back</span>
        Danh sách học kỳ
      </a>
    </app-page-header>

    @if (dangTai()) {
      <div class="dang-tai" role="status" aria-live="polite">Đang tải thông tin học kỳ…</div>
    } @else if (loiTai()) {
      <app-alert muc="danger" title="Không tải được học kỳ">
        {{ loiTai() }}
        <a routerLink="/hoc-ky">Quay lại danh sách</a>
      </app-alert>
    } @else if (chiDoc()) {
      <app-alert muc="warning" title="Học kỳ đã đóng">
        Học kỳ đã đóng chỉ được xem, không thể chỉnh sửa.
        <a routerLink="/hoc-ky">Quay lại danh sách</a>
      </app-alert>
    } @else {
      <form class="form" (submit)="gui($event)" novalidate>
        <section class="nhom-truong" aria-labelledby="thong-tin-hoc-ky">
          <div class="dau-nhom">
            <h2 id="thong-tin-hoc-ky">Thông tin học kỳ</h2>
            <p>Các trường có dấu * là bắt buộc. Mỗi năm học có tối đa ba học kỳ.</p>
          </div>
          <div class="luoi">
            <app-form-field
              id="ma-hoc-ky"
              nhan="Mã học kỳ"
              goiY="Ví dụ: 2027-1"
              [giaTri]="maHocKy()"
              [loi]="loiTruong('ma_hoc_ky') || (daCham() && !maHocKy().trim() ? 'Mã học kỳ là bắt buộc.' : '')"
              [daCham]="daCham()"
              [batBuoc]="true"
              (giaTriChange)="maHocKy.set($event)"
            />
            <app-form-field
              id="ten-hoc-ky"
              nhan="Tên học kỳ"
              goiY="Ví dụ: Học kỳ 1 năm học 2027-2028"
              [giaTri]="tenHocKy()"
              [loi]="loiTruong('ten_hoc_ky') || (daCham() && !tenHocKy().trim() ? 'Tên học kỳ là bắt buộc.' : '')"
              [daCham]="daCham()"
              [batBuoc]="true"
              (giaTriChange)="tenHocKy.set($event)"
            />
            <app-form-field
              id="nam-hoc"
              nhan="Năm học"
              goiY="YYYY-YYYY, ví dụ 2027-2028"
              [giaTri]="namHoc()"
              [loi]="loiTruong('nam_hoc') || loiNamHoc()"
              [daCham]="daCham()"
              [batBuoc]="true"
              (giaTriChange)="namHoc.set($event)"
            />
            <label class="truong">
              <span>Kỳ thứ <span class="sao" aria-hidden="true">*</span></span>
              <select
                id="ky-thu"
                [value]="kyThu()"
                [attr.aria-invalid]="!!loiTruong('ky_thu')"
                (change)="doiKyThu($event)"
              >
                <option value="1">Học kỳ 1</option>
                <option value="2">Học kỳ 2</option>
                <option value="3">Học kỳ hè</option>
              </select>
              @if (loiTruong('ky_thu')) {
                <small class="loi">{{ loiTruong('ky_thu') }}</small>
              } @else {
                <small>Kỳ thứ 3 dành cho học kỳ hè.</small>
              }
            </label>
          </div>
        </section>

        <section class="nhom-truong" aria-labelledby="thoi-gian-hoc">
          <div class="dau-nhom">
            <h2 id="thoi-gian-hoc">Thời gian học kỳ</h2>
            <p>Khoảng thời gian của các học kỳ không được chồng lấn.</p>
          </div>
          <div class="luoi">
            <label class="truong">
              <span>Ngày bắt đầu <span class="sao" aria-hidden="true">*</span></span>
              <app-date-input
                id="ngay-bat-dau"
                nhan="Ngày bắt đầu học kỳ"
                [giaTri]="ngayBatDau()"
                (giaTriChange)="ngayBatDau.set($event)"
              />
              @if (loiTruong('ngay_bat_dau')) {
                <small class="loi">{{ loiTruong('ngay_bat_dau') }}</small>
              }
            </label>
            <label class="truong">
              <span>Ngày kết thúc <span class="sao" aria-hidden="true">*</span></span>
              <app-date-input
                id="ngay-ket-thuc"
                nhan="Ngày kết thúc học kỳ"
                [giaTri]="ngayKetThuc()"
                (giaTriChange)="ngayKetThuc.set($event)"
              />
              @if (loiTruong('ngay_ket_thuc') || loiNgayKetThuc()) {
                <small class="loi">{{ loiTruong('ngay_ket_thuc') || loiNgayKetThuc() }}</small>
              }
            </label>
          </div>
        </section>

        <section class="nhom-truong" aria-labelledby="thoi-gian-dang-ky">
          <div class="dau-nhom">
            <h2 id="thoi-gian-dang-ky">Đợt đăng ký học phần</h2>
            <p>Có thể mở đăng ký trước ngày bắt đầu học kỳ; đợt đăng ký phải đóng trước hoặc đúng ngày học kỳ bắt đầu.</p>
          </div>
          <div class="luoi">
            <label class="truong">
              <span>Mở đăng ký lúc <span class="sao" aria-hidden="true">*</span></span>
              <input
                id="mo-dang-ky-luc"
                type="datetime-local"
                [value]="moDangKyLuc()"
                [attr.aria-invalid]="!!loiTruong('mo_dang_ky_luc')"
                (input)="doiThoiGianDangKy('mo', $event)"
              />
              @if (loiTruong('mo_dang_ky_luc')) {
                <small class="loi">{{ loiTruong('mo_dang_ky_luc') }}</small>
              }
            </label>
            <label class="truong">
              <span>Đóng đăng ký lúc <span class="sao" aria-hidden="true">*</span></span>
              <input
                id="dong-dang-ky-luc"
                type="datetime-local"
                [value]="dongDangKyLuc()"
                [attr.aria-invalid]="!!loiTruong('dong_dang_ky_luc')"
                (input)="doiThoiGianDangKy('dong', $event)"
              />
              @if (loiTruong('dong_dang_ky_luc') || loiDongDangKy()) {
                <small class="loi">{{ loiTruong('dong_dang_ky_luc') || loiDongDangKy() }}</small>
              }
            </label>
          </div>
        </section>

        @if (laChinhSua && hocKy(); as current) {
          <section class="trang-thai-hien-tai" aria-label="Trạng thái hiện tại">
            <span>Trạng thái hiện tại</span>
            <strong>{{ nhanTrangThai(current.trang_thai) }}</strong>
            <small>Trạng thái chỉ được chuyển riêng theo đúng vòng đời học kỳ.</small>
          </section>
        }

        <div class="hanh-dong">
          <a class="nut-huy" routerLink="/hoc-ky">Hủy</a>
          <app-button type="submit" [loading]="dangGui()">
            {{ laChinhSua ? 'Lưu thay đổi' : 'Tạo học kỳ' }}
          </app-button>
        </div>
      </form>
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
      max-width: 900px;
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

    .truong select,
    .truong input {
      width: 100%;
      min-height: 40px;
      padding: 9px 11px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
      font: 400 var(--text-small) var(--font-body);
    }

    .truong select:focus,
    .truong input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    .truong small {
      min-height: 17px;
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
      font-weight: 400;
    }

    .sao,
    .loi {
      color: var(--color-danger) !important;
    }

    .trang-thai-hien-tai {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      padding: 12px 16px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface-alt);
      color: var(--color-ink);
      font-size: var(--text-small);
    }

    .trang-thai-hien-tai small {
      flex-basis: 100%;
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
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
      min-height: 40px;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: var(--radius);
      color: var(--color-ink-muted);
      font-size: var(--text-small);
      font-weight: 600;
      text-decoration: none;
    }

    .nut-huy:hover,
    .nut-quay-lai:hover {
      background: var(--color-surface-alt);
      color: var(--color-ink);
    }

    .nut-huy:focus-visible,
    .nut-quay-lai:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .nut-quay-lai .material-icons {
      font-size: 18px;
    }

    .dang-tai {
      padding: 24px;
      color: var(--color-ink-muted);
      text-align: center;
    }

    @media (max-width: 640px) {
      .nhom-truong {
        padding: 16px;
      }

      .luoi {
        grid-template-columns: minmax(0, 1fr);
        gap: 12px;
      }

      .hanh-dong {
        position: sticky;
        bottom: 0;
        z-index: 1;
        margin: 0 -12px;
        padding: 12px;
        background: var(--color-surface);
        border-top: 1px solid var(--color-border);
      }
    }
  `,
})
export class HocKyForm {
  private readonly service = inject(HocKyService);
  private readonly toast = inject(AppToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly thamSoId = this.route.snapshot.paramMap.get('id');

  readonly id = this.layId(this.thamSoId);
  readonly laChinhSua = this.thamSoId !== null;
  readonly dangTai = signal(this.laChinhSua);
  readonly dangGui = signal(false);
  readonly daCham = signal(false);
  readonly chiDoc = signal(false);
  readonly loiChung = signal('');
  readonly loiTai = signal('');
  readonly loiApi = signal<Record<string, string[]>>({});
  readonly hocKy = signal<HocKy | null>(null);
  readonly maHocKy = signal('');
  readonly tenHocKy = signal('');
  readonly namHoc = signal('');
  readonly kyThu = signal(1);
  readonly ngayBatDau = signal('');
  readonly ngayKetThuc = signal('');
  readonly moDangKyLuc = signal('');
  readonly dongDangKyLuc = signal('');

  readonly loiNamHoc = computed(() => {
    if (!this.daCham() || !this.namHoc()) return '';
    const match = this.namHoc().trim().match(/^(\d{4})-(\d{4})$/);
    if (!match || Number(match[2]) !== Number(match[1]) + 1) {
      return 'Năm học cần theo dạng YYYY-YYYY và hai năm liên tiếp.';
    }
    return '';
  });
  readonly loiNgayKetThuc = computed(() => {
    if (!this.daCham() || !this.ngayBatDau() || !this.ngayKetThuc()) return '';
    return this.ngayKetThuc() <= this.ngayBatDau()
      ? 'Ngày kết thúc phải sau ngày bắt đầu.'
      : '';
  });
  readonly loiDongDangKy = computed(() => {
    if (!this.daCham() || !this.moDangKyLuc() || !this.dongDangKyLuc()) return '';
    if (this.dongDangKyLuc() <= this.moDangKyLuc()) {
      return 'Thời gian đóng đăng ký phải sau thời gian mở.';
    }
    return '';
  });

  constructor() {
    if (this.laChinhSua && this.id === null) {
      this.dangTai.set(false);
      this.loiTai.set('Mã học kỳ không hợp lệ.');
      return;
    }
    if (this.id !== null) this.taiHocKy(this.id);
  }

  loiTruong(field: string): string {
    return this.loiApi()[field]?.[0] ?? '';
  }

  doiKyThu(event: Event): void {
    this.kyThu.set(Number((event.target as HTMLSelectElement).value));
  }

  doiThoiGianDangKy(loai: 'mo' | 'dong', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (loai === 'mo') this.moDangKyLuc.set(value);
    else this.dongDangKyLuc.set(value);
  }

  nhanTrangThai(trangThai: HocKy['trang_thai']): string {
    return { UPCOMING: 'Sắp diễn ra', ONGOING: 'Đang diễn ra', CLOSED: 'Đã đóng' }[trangThai];
  }

  gui(event: Event): void {
    event.preventDefault();
    if (this.dangGui()) return;

    this.daCham.set(true);
    this.loiChung.set('');
    this.loiApi.set({});
    if (!this.hopLe()) return;

    this.dangGui.set(true);
    const duLieu: HocKyInput = {
      ma_hoc_ky: this.maHocKy().trim(),
      ten_hoc_ky: this.tenHocKy().trim(),
      nam_hoc: this.namHoc().trim(),
      ky_thu: this.kyThu(),
      ngay_bat_dau: this.ngayBatDau(),
      ngay_ket_thuc: this.ngayKetThuc(),
      mo_dang_ky_luc: this.sangApiDateTime(this.moDangKyLuc()),
      dong_dang_ky_luc: this.sangApiDateTime(this.dongDangKyLuc()),
    };
    const request =
      this.id === null ? this.service.taoMoi(duLieu) : this.service.capNhat(this.id, duLieu);
    request.subscribe({
      next: () => {
        this.dangGui.set(false);
        this.toast.hien(this.laChinhSua ? 'Cập nhật học kỳ thành công.' : 'Tạo học kỳ thành công.', 'success');
        void this.router.navigate(['/hoc-ky']);
      },
      error: (error: unknown) => this.xuLyLoi(error),
    });
  }

  private hopLe(): boolean {
    const errors: Record<string, string[]> = {};
    if (!this.maHocKy().trim()) errors['ma_hoc_ky'] = ['Mã học kỳ là bắt buộc.'];
    if (this.maHocKy().trim().length > 20) errors['ma_hoc_ky'] = ['Mã học kỳ không được vượt quá 20 ký tự.'];
    if (!this.tenHocKy().trim()) errors['ten_hoc_ky'] = ['Tên học kỳ là bắt buộc.'];
    if (this.tenHocKy().trim().length > 255) errors['ten_hoc_ky'] = ['Tên học kỳ không được vượt quá 255 ký tự.'];

    const nam = this.namHoc().trim().match(/^(\d{4})-(\d{4})$/);
    if (!nam || Number(nam[2]) !== Number(nam[1]) + 1) {
      errors['nam_hoc'] = ['Năm học cần theo dạng YYYY-YYYY và hai năm liên tiếp.'];
    }
    if (![1, 2, 3].includes(this.kyThu())) {
      errors['ky_thu'] = ['Kỳ thứ phải là 1, 2 hoặc 3.'];
    }
    if (!this.laNgayIso(this.ngayBatDau())) {
      errors['ngay_bat_dau'] = ['Ngày bắt đầu không hợp lệ.'];
    }
    if (!this.laNgayIso(this.ngayKetThuc())) {
      errors['ngay_ket_thuc'] = ['Ngày kết thúc không hợp lệ.'];
    } else if (this.ngayBatDau() && this.ngayKetThuc() <= this.ngayBatDau()) {
      errors['ngay_ket_thuc'] = ['Ngày kết thúc phải sau ngày bắt đầu.'];
    }

    if (!this.laDateTime(this.moDangKyLuc())) {
      errors['mo_dang_ky_luc'] = ['Thời gian mở đăng ký là bắt buộc.'];
    }
    if (!this.laDateTime(this.dongDangKyLuc())) {
      errors['dong_dang_ky_luc'] = ['Thời gian đóng đăng ký là bắt buộc.'];
    } else if (this.moDangKyLuc() && this.dongDangKyLuc() <= this.moDangKyLuc()) {
      errors['dong_dang_ky_luc'] = ['Thời gian đóng đăng ký phải sau thời gian mở.'];
    }

    if (
      this.laNgayIso(this.ngayBatDau()) &&
      this.laDateTime(this.moDangKyLuc()) &&
      this.laDateTime(this.dongDangKyLuc())
    ) {
      if (this.dongDangKyLuc().slice(0, 10) > this.ngayBatDau()) {
        errors['dong_dang_ky_luc'] = ['Đợt đăng ký phải đóng trước hoặc đúng ngày bắt đầu học kỳ.'];
      }
    }
    this.loiApi.set(errors);
    return Object.keys(errors).length === 0;
  }

  private laNgayIso(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }

  private laDateTime(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
    return this.laNgayIso(value.slice(0, 10)) && !Number.isNaN(Date.parse(value));
  }

  private sangApiDateTime(value: string): string {
    return `${value.replace('T', ' ')}:00`;
  }

  private layId(param: string | null): number | null {
    if (param === null) return null;
    const id = Number(param);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  private taiHocKy(id: number): void {
    this.service.layMot(id).subscribe({
      next: (hocKy) => {
        this.hocKy.set(hocKy);
        this.maHocKy.set(hocKy.ma_hoc_ky);
        this.tenHocKy.set(hocKy.ten_hoc_ky);
        this.namHoc.set(hocKy.nam_hoc);
        this.kyThu.set(hocKy.ky_thu);
        this.ngayBatDau.set(hocKy.ngay_bat_dau);
        this.ngayKetThuc.set(hocKy.ngay_ket_thuc);
        this.moDangKyLuc.set(this.sangDateTimeInput(hocKy.mo_dang_ky_luc));
        this.dongDangKyLuc.set(this.sangDateTimeInput(hocKy.dong_dang_ky_luc));
        this.chiDoc.set(hocKy.trang_thai === 'CLOSED');
        this.dangTai.set(false);
      },
      error: (error: unknown) => {
        this.dangTai.set(false);
        this.loiTai.set(this.thongBaoLoi(error));
      },
    });
  }

  private sangDateTimeInput(value: string): string {
    return value.replace(' ', 'T').slice(0, 16);
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
    const hasFieldErrors = Object.keys(this.loiApi()).length > 0;
    if (!hasFieldErrors) this.toast.hien(this.thongBaoLoi(error), 'danger');
    this.loiChung.set('');
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
