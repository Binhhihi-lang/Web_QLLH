import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { KhoaNganhService, NganhInput } from '@core/services/khoa-nganh.service';
import { TuyChonKhoa } from '@core/models/dao-tao.model';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { FormField } from '@shared/ui/form-field';
import { PageHeader } from '@shared/ui/page-header';

@Component({
  selector: 'app-nganh-form',
  standalone: true,
  imports: [AppAlert, AppButton, FormField, PageHeader, RouterLink],
  template: `
    <app-page-header
      [title]="laChinhSua ? 'Cập nhật ngành' : 'Thêm ngành'"
      [description]="laChinhSua ? 'Chỉnh sửa thông tin ngành và khoa trực thuộc.' : 'Tạo ngành thuộc một khoa trong danh mục đào tạo.'"
    >
      <a class="nut-quay-lai" routerLink="/nganh">
        <span class="material-icons" aria-hidden="true">arrow_back</span>
        Danh sách ngành
      </a>
    </app-page-header>

    @if (dangTai()) {
      <div class="dang-tai" role="status" aria-live="polite">Đang tải thông tin ngành…</div>
    } @else if (loiTai()) {
      <app-alert muc="danger" title="Không tải được ngành">
        {{ loiTai() }} <a routerLink="/nganh">Quay lại danh sách</a>
      </app-alert>
    } @else {
      <form class="form" (submit)="gui($event)" novalidate>
        @if (loiChung()) {
          <app-alert muc="danger" title="Chưa thể lưu ngành">{{ loiChung() }}</app-alert>
        }
        @if (loiTaiKhoa()) {
          <app-alert muc="danger" title="Không tải được danh sách khoa">
            {{ loiTaiKhoa() }}
            <button type="button" class="thu-lai" (click)="taiKhoa()">Thử lại</button>
          </app-alert>
        }
        <section class="nhom-truong" aria-labelledby="thong-tin-nganh">
          <div class="dau-nhom">
            <div>
              <span class="nhan-muc">DANH MỤC ĐÀO TẠO</span>
              <h2 id="thong-tin-nganh">Thông tin ngành</h2>
            </div>
            <p><span aria-hidden="true">*</span> Trường bắt buộc</p>
          </div>
          <div class="luoi">
            <label class="truong">
              <span>Khoa <span aria-hidden="true">*</span></span>
              <select
                id="khoa-nganh"
                [value]="khoaId() ?? ''"
                [disabled]="dangTaiKhoa()"
                [attr.aria-invalid]="!!loiKhoa()"
                aria-describedby="loi-khoa-nganh"
                (change)="doiKhoa($event)"
              >
                <option value="">Chọn khoa</option>
                @for (khoa of dsKhoa(); track khoa.id) {
                  <option [value]="khoa.id">{{ khoa.label }}</option>
                }
              </select>
              @if (loiKhoa()) {
                <small id="loi-khoa-nganh" class="loi-truong">{{ loiKhoa() }}</small>
              }
            </label>
            <app-form-field
              id="ma-nganh"
              nhan="Mã ngành"
              goiY="Ví dụ: KTPM"
              [giaTri]="maNganh()"
              [loi]="loiMaNganh()"
              [daCham]="daCham()"
              [batBuoc]="true"
              (giaTriChange)="maNganh.set($event)"
              (cham)="daCham.set(true)"
            />
            <app-form-field
              id="ten-nganh"
              nhan="Tên ngành"
              goiY="Tên đầy đủ của ngành"
              [giaTri]="tenNganh()"
              [loi]="loiTenNganh()"
              [daCham]="daCham()"
              [batBuoc]="true"
              (giaTriChange)="tenNganh.set($event)"
              (cham)="daCham.set(true)"
            />
            <label class="truong">
              <span>Trạng thái</span>
              <select id="trang-thai-nganh" [value]="trangThai() ? 'true' : 'false'" (change)="doiTrangThai($event)">
                <option value="true">Đang hoạt động</option>
                <option value="false">Đã khóa</option>
              </select>
              <small>Ngành bị khóa không xuất hiện trong các ô chọn danh mục.</small>
            </label>
            <app-form-field
              id="mo-ta-nganh"
              loai="textarea"
              nhan="Mô tả"
              goiY="Thông tin giới thiệu về ngành (không bắt buộc)"
              [giaTri]="moTa()"
              [loi]="loiTruong('mo_ta')"
              [daCham]="daCham()"
              [soDong]="4"
              (giaTriChange)="moTa.set($event)"
              (cham)="daCham.set(true)"
            />
          </div>
        </section>
        <div class="hanh-dong">
          <a class="nut-huy" routerLink="/nganh">Hủy</a>
          <app-button type="submit" [loading]="dangGui()">
            {{ laChinhSua ? 'Lưu thay đổi' : 'Tạo ngành' }}
          </app-button>
        </div>
      </form>
    }
  `,
  styles: `
    :host { display: block; width: min(100%, 980px); margin-inline: auto; }
    .form { display: grid; gap: 16px; padding-bottom: 28px; }
    .nhom-truong { padding: 20px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); }
    .dau-nhom { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
    .nhan-muc { color: var(--color-primary); font-size: var(--text-caption); font-weight: 700; letter-spacing: .06em; }
    .dau-nhom h2 { margin-top: 4px; color: var(--color-ink); font-size: var(--text-h2); font-weight: 600; }
    .dau-nhom p { color: var(--color-ink-muted); font-size: var(--text-small); }
    .luoi { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .truong { display: flex; min-width: 0; flex-direction: column; gap: 5px; color: var(--color-ink); font-size: var(--text-small); font-weight: 600; }
    .truong select { min-height: 40px; padding: 9px 11px; border: 1.5px solid var(--color-border); border-radius: var(--radius); background: var(--color-surface); color: var(--color-ink); font: 400 var(--text-small) var(--font-body); }
    .truong select:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
    .truong select:disabled { cursor: wait; opacity: .7; }
    .truong .loi-truong { color: var(--color-danger); font-size: var(--text-caption); font-weight: 400; }
    .truong small:not(.loi-truong) { color: var(--color-ink-muted); font-size: var(--text-caption); font-weight: 400; }
    app-form-field:last-child { grid-column: 1 / -1; }
    .hanh-dong { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
    .nut-huy, .nut-quay-lai { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 8px 12px; border-radius: var(--radius); color: var(--color-ink-muted); font-size: var(--text-small); font-weight: 600; text-decoration: none; }
    .nut-huy:hover, .nut-quay-lai:hover { background: var(--color-surface-alt); color: var(--color-ink); }
    .nut-huy:focus-visible, .nut-quay-lai:focus-visible, .thu-lai:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
    .nut-quay-lai .material-icons { font-size: 18px; }
    .dang-tai { padding: 24px; color: var(--color-ink-muted); text-align: center; }
    .thu-lai { border: 0; background: transparent; color: var(--color-primary); font: inherit; text-decoration: underline; cursor: pointer; }
    @media (max-width: 640px) {
      .nhom-truong { padding: 16px; }
      .luoi { grid-template-columns: minmax(0, 1fr); gap: 12px; }
      .hanh-dong { position: sticky; bottom: 0; z-index: 1; margin: 0 -12px; padding: 12px; background: var(--color-surface); border-top: 1px solid var(--color-border); }
    }
  `,
})
export class NganhForm {
  private readonly service = inject(KhoaNganhService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly thamSoId = this.route.snapshot.paramMap.get('id');

  readonly id = this.layId(this.thamSoId);
  readonly laChinhSua = this.thamSoId !== null;
  readonly dangTai = signal(this.laChinhSua);
  readonly dangGui = signal(false);
  readonly dangTaiKhoa = signal(true);
  readonly daCham = signal(false);
  readonly loiChung = signal('');
  readonly loiTai = signal('');
  readonly loiTaiKhoa = signal('');
  readonly loiApi = signal<Record<string, string[]>>({});
  readonly dsKhoa = signal<TuyChonKhoa[]>([]);
  readonly khoaId = signal<number | null>(null);
  readonly maNganh = signal('');
  readonly tenNganh = signal('');
  readonly moTa = signal('');
  readonly trangThai = signal(true);

  readonly loiKhoa = computed(
    () =>
      this.loiTruong('khoa_id') ||
      (this.daCham() && this.khoaId() === null ? 'Vui lòng chọn khoa.' : ''),
  );
  readonly loiMaNganh = computed(
    () =>
      this.loiTruong('ma_nganh') ||
      (this.daCham() && !this.maNganh().trim() ? 'Mã ngành là bắt buộc.' : '') ||
      (this.maNganh().trim().length > 20 ? 'Mã ngành không được vượt quá 20 ký tự.' : ''),
  );
  readonly loiTenNganh = computed(
    () =>
      this.loiTruong('ten_nganh') ||
      (this.daCham() && !this.tenNganh().trim() ? 'Tên ngành là bắt buộc.' : '') ||
      (this.tenNganh().trim().length > 255 ? 'Tên ngành không được vượt quá 255 ký tự.' : ''),
  );

  constructor() {
    if (this.laChinhSua && this.id === null) {
      this.dangTai.set(false);
      this.loiTai.set('Mã ngành không hợp lệ.');
      return;
    }
    this.taiKhoa();
    if (this.id !== null) this.taiNganh(this.id);
  }

  loiTruong(field: string): string {
    return this.loiApi()[field]?.[0] ?? '';
  }

  taiKhoa(): void {
    this.dangTaiKhoa.set(true);
    this.loiTaiKhoa.set('');
    this.service.layTuyChonKhoa().subscribe({
      next: (khoa) => {
        this.dsKhoa.set(this.themKhoaHienTai(khoa));
        this.dangTaiKhoa.set(false);
      },
      error: (error: unknown) => {
        this.dangTaiKhoa.set(false);
        this.loiTaiKhoa.set(this.thongBaoLoi(error));
      },
    });
  }

  doiKhoa(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.khoaId.set(value === '' ? null : Number(value));
  }

  doiTrangThai(event: Event): void {
    this.trangThai.set((event.target as HTMLSelectElement).value === 'true');
  }

  gui(event: Event): void {
    event.preventDefault();
    if (this.dangGui()) return;

    this.daCham.set(true);
    this.loiChung.set('');
    this.loiApi.set({});
    if (this.loiKhoa() || this.loiMaNganh() || this.loiTenNganh()) return;
    const khoaId = this.khoaId();
    if (khoaId === null) return;

    this.dangGui.set(true);
    const input: NganhInput = {
      khoa_id: khoaId,
      ma_nganh: this.maNganh().trim(),
      ten_nganh: this.tenNganh().trim(),
      mo_ta: this.moTa().trim() || null,
      trang_thai: this.trangThai(),
    };
    const request =
      this.id === null ? this.service.taoNganh(input) : this.service.capNhatNganh(this.id, input);
    request.subscribe({
      next: () => {
        this.dangGui.set(false);
        void this.router.navigate(['/nganh']);
      },
      error: (error: unknown) => this.xuLyLoi(error),
    });
  }

  private themKhoaHienTai(options: TuyChonKhoa[]): TuyChonKhoa[] {
    const current = this.dsKhoa().find((khoa) => khoa.id === this.khoaId());
    if (!current || options.some((khoa) => khoa.id === current.id)) return options;
    const label = current.label.endsWith(' (đã khóa)')
      ? current.label
      : `${current.label} (đã khóa)`;
    return [...options, { ...current, label }];
  }

  private layId(param: string | null): number | null {
    if (param === null) return null;
    const id = Number(param);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  private taiNganh(id: number): void {
    this.service.layNganh(id).subscribe({
      next: (nganh) => {
        this.khoaId.set(nganh.khoa_id);
        this.maNganh.set(nganh.ma_nganh);
        this.tenNganh.set(nganh.ten_nganh);
        this.moTa.set(nganh.mo_ta ?? '');
        this.trangThai.set(nganh.trang_thai);
        const khoa = nganh.khoa;
        if (khoa && !this.dsKhoa().some((option) => option.id === nganh.khoa_id)) {
          this.dsKhoa.update((options) => [
            ...options,
            {
              id: nganh.khoa_id,
              label: `${khoa.ten_khoa} (đã khóa)`,
              ma_khoa: khoa.ma_khoa,
            },
          ]);
        }
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
    if (error instanceof HttpErrorResponse && laDoiTuong(error.error?.['errors'])) {
      this.loiApi.set(
        Object.fromEntries(
          Object.entries(error.error['errors']).filter(
            (entry): entry is [string, string[]] =>
              Array.isArray(entry[1]) && entry[1].every((value) => typeof value === 'string'),
          ),
        ),
      );
    }
    this.loiChung.set(this.thongBaoLoi(error));
  }

  private thongBaoLoi(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return 'Không thể hoàn thành thao tác. Kiểm tra kết nối rồi thử lại.';
  }
}

function laDoiTuong(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
