import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { FormField } from '@shared/ui/form-field';
import { PageHeader } from '@shared/ui/page-header';
import { KhoaInput, KhoaNganhService } from '@core/services/khoa-nganh.service';

@Component({
  selector: 'app-khoa-form',
  standalone: true,
  imports: [AppAlert, AppButton, FormField, PageHeader, RouterLink],
  template: `
    <app-page-header
      [title]="laChinhSua ? 'Cập nhật khoa' : 'Thêm khoa'"
      [description]="laChinhSua ? 'Chỉnh sửa thông tin khoa trong danh mục đào tạo.' : 'Tạo khoa để quản lý các ngành và môn học trực thuộc.'"
    >
      <a class="nut-quay-lai" routerLink="/khoa">
        <span class="material-icons" aria-hidden="true">arrow_back</span>
        Danh sách khoa
      </a>
    </app-page-header>

    @if (dangTai()) {
      <div class="dang-tai" role="status" aria-live="polite">Đang tải thông tin khoa…</div>
    } @else if (loiTai()) {
      <app-alert muc="danger" title="Không tải được khoa">
        {{ loiTai() }} <a routerLink="/khoa">Quay lại danh sách</a>
      </app-alert>
    } @else {
      <form class="form" (submit)="gui($event)" novalidate>
        @if (loiChung()) {
          <app-alert muc="danger" title="Chưa thể lưu khoa">{{ loiChung() }}</app-alert>
        }
        <section class="nhom-truong" aria-labelledby="thong-tin-khoa">
          <div class="dau-nhom">
            <div>
              <span class="nhan-muc">DANH MỤC ĐÀO TẠO</span>
              <h2 id="thong-tin-khoa">Thông tin khoa</h2>
            </div>
            <p><span aria-hidden="true">*</span> Trường bắt buộc</p>
          </div>
          <div class="luoi">
            <app-form-field
              id="ma-khoa"
              nhan="Mã khoa"
              goiY="Ví dụ: CNTT"
              [giaTri]="maKhoa()"
              [loi]="loiMaKhoa()"
              [daCham]="daCham()"
              [batBuoc]="true"
              (giaTriChange)="maKhoa.set($event)"
              (cham)="daCham.set(true)"
            />
            <app-form-field
              id="ten-khoa"
              nhan="Tên khoa"
              goiY="Tên đầy đủ của khoa"
              [giaTri]="tenKhoa()"
              [loi]="loiTenKhoa()"
              [daCham]="daCham()"
              [batBuoc]="true"
              (giaTriChange)="tenKhoa.set($event)"
              (cham)="daCham.set(true)"
            />
            <label class="truong">
              <span>Trạng thái</span>
              <select id="trang-thai-khoa" [value]="trangThai() ? 'true' : 'false'" (change)="doiTrangThai($event)">
                <option value="true">Đang hoạt động</option>
                <option value="false">Đã khóa</option>
              </select>
              <small>Khoa bị khóa không xuất hiện trong các ô chọn danh mục.</small>
            </label>
            <app-form-field
              id="mo-ta-khoa"
              loai="textarea"
              nhan="Mô tả"
              goiY="Thông tin giới thiệu về khoa (không bắt buộc)"
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
          <a class="nut-huy" routerLink="/khoa">Hủy</a>
          <app-button type="submit" [loading]="dangGui()">
            {{ laChinhSua ? 'Lưu thay đổi' : 'Tạo khoa' }}
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
    .truong small { color: var(--color-ink-muted); font-size: var(--text-caption); font-weight: 400; }
    app-form-field:last-child { grid-column: 1 / -1; }
    .hanh-dong { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
    .nut-huy, .nut-quay-lai { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 8px 12px; border-radius: var(--radius); color: var(--color-ink-muted); font-size: var(--text-small); font-weight: 600; text-decoration: none; }
    .nut-huy:hover, .nut-quay-lai:hover { background: var(--color-surface-alt); color: var(--color-ink); }
    .nut-huy:focus-visible, .nut-quay-lai:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
    .nut-quay-lai .material-icons { font-size: 18px; }
    .dang-tai { padding: 24px; color: var(--color-ink-muted); text-align: center; }
    @media (max-width: 640px) {
      .nhom-truong { padding: 16px; }
      .luoi { grid-template-columns: minmax(0, 1fr); gap: 12px; }
      .hanh-dong { position: sticky; bottom: 0; z-index: 1; margin: 0 -12px; padding: 12px; background: var(--color-surface); border-top: 1px solid var(--color-border); }
    }
  `,
})
export class KhoaForm {
  private readonly service = inject(KhoaNganhService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly thamSoId = this.route.snapshot.paramMap.get('id');

  readonly id = this.layId(this.thamSoId);
  readonly laChinhSua = this.thamSoId !== null;
  readonly dangTai = signal(this.laChinhSua);
  readonly dangGui = signal(false);
  readonly daCham = signal(false);
  readonly loiChung = signal('');
  readonly loiTai = signal('');
  readonly loiApi = signal<Record<string, string[]>>({});
  readonly maKhoa = signal('');
  readonly tenKhoa = signal('');
  readonly moTa = signal('');
  readonly trangThai = signal(true);

  readonly loiMaKhoa = computed(
    () =>
      this.loiTruong('ma_khoa') ||
      (this.daCham() && !this.maKhoa().trim() ? 'Mã khoa là bắt buộc.' : '') ||
      (this.maKhoa().trim().length > 20 ? 'Mã khoa không được vượt quá 20 ký tự.' : ''),
  );
  readonly loiTenKhoa = computed(
    () =>
      this.loiTruong('ten_khoa') ||
      (this.daCham() && !this.tenKhoa().trim() ? 'Tên khoa là bắt buộc.' : '') ||
      (this.tenKhoa().trim().length > 255 ? 'Tên khoa không được vượt quá 255 ký tự.' : ''),
  );

  constructor() {
    if (this.laChinhSua && this.id === null) {
      this.dangTai.set(false);
      this.loiTai.set('Mã khoa không hợp lệ.');
    } else if (this.id !== null) {
      this.taiKhoa(this.id);
    }
  }

  loiTruong(field: string): string {
    return this.loiApi()[field]?.[0] ?? '';
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
    if (this.loiMaKhoa() || this.loiTenKhoa()) return;

    this.dangGui.set(true);
    const input: KhoaInput = {
      ma_khoa: this.maKhoa().trim(),
      ten_khoa: this.tenKhoa().trim(),
      mo_ta: this.moTa().trim() || null,
      trang_thai: this.trangThai(),
    };
    const request =
      this.id === null ? this.service.taoKhoa(input) : this.service.capNhatKhoa(this.id, input);
    request.subscribe({
      next: () => {
        this.dangGui.set(false);
        void this.router.navigate(['/khoa']);
      },
      error: (error: unknown) => this.xuLyLoi(error),
    });
  }

  private layId(param: string | null): number | null {
    if (param === null) return null;
    const id = Number(param);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  private taiKhoa(id: number): void {
    this.service.layKhoa(id).subscribe({
      next: (khoa) => {
        this.maKhoa.set(khoa.ma_khoa);
        this.tenKhoa.set(khoa.ten_khoa);
        this.moTa.set(khoa.mo_ta ?? '');
        this.trangThai.set(khoa.trang_thai);
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
