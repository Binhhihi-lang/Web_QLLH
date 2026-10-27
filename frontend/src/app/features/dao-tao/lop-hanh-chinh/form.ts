import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { FormField } from '@shared/ui/form-field';
import { PageHeader } from '@shared/ui/page-header';
import { LopHanhChinhInput, LopHanhChinhService } from './lop-hanh-chinh.service';

@Component({
  selector: 'app-lop-hanh-chinh-form',
  standalone: true,
  imports: [AppAlert, AppButton, FormField, PageHeader, RouterLink],
  template: `
    <app-page-header
      [title]="laChinhSua ? 'Cập nhật lớp hành chính' : 'Tạo lớp hành chính'"
      [description]="
        laChinhSua
          ? 'Cập nhật thông tin lớp. Việc đổi lớp của sinh viên được thực hiện riêng ở trang chi tiết.'
          : 'Tạo lớp theo khóa và ngành để bắt đầu quản lý sinh viên.'
      "
    >
      <a class="nut-quay-lai" routerLink="/lop-hanh-chinh">
        <span class="material-icons" aria-hidden="true">arrow_back</span>
        Danh sách lớp
      </a>
    </app-page-header>

    @if (dangTai()) {
      <div class="dang-tai" role="status" aria-live="polite">Đang tải thông tin lớp…</div>
    } @else if (loiTai()) {
      <app-alert muc="danger" title="Không tải được lớp">
        {{ loiTai() }}
        <a routerLink="/lop-hanh-chinh">Quay lại danh sách</a>
      </app-alert>
    } @else {
      <form class="form" (submit)="gui($event)" novalidate>
        @if (loiChung()) {
          <app-alert muc="danger" title="Chưa thể lưu lớp">{{ loiChung() }}</app-alert>
        }

        <section class="nhom-truong" aria-labelledby="thong-tin-lop">
          <div class="dau-nhom">
            <div>
              <span class="nhan-muc">THÔNG TIN ĐÀO TẠO</span>
              <h2 id="thong-tin-lop">Thông tin lớp</h2>
            </div>
            <p><span aria-hidden="true">*</span> Trường bắt buộc</p>
          </div>

          <div class="luoi">
            <app-form-field
              id="ma-lop"
              nhan="Mã lớp"
              goiY="Ví dụ: CNTT-K68-01"
              [giaTri]="maLop()"
              [loi]="loiMaLop()"
              [daCham]="daCham()"
              [batBuoc]="true"
              (giaTriChange)="maLop.set($event)"
              (cham)="daCham.set(true)"
            />
            <app-form-field
              id="ten-lop"
              nhan="Tên lớp"
              goiY="Tên đầy đủ của lớp hành chính"
              [giaTri]="tenLop()"
              [loi]="loiTenLop()"
              [daCham]="daCham()"
              [batBuoc]="true"
              (giaTriChange)="tenLop.set($event)"
              (cham)="daCham.set(true)"
            />
            <app-form-field
              id="khoa-hoc"
              nhan="Khóa học"
              goiY="Ví dụ: K68"
              [giaTri]="khoaHoc()"
              [loi]="loiKhoaHoc()"
              [daCham]="daCham()"
              (giaTriChange)="khoaHoc.set($event)"
              (cham)="daCham.set(true)"
            />
            <app-form-field
              id="nganh"
              nhan="Ngành"
              goiY="Ví dụ: CNTT"
              [giaTri]="nganh()"
              [loi]="loiNganh()"
              [daCham]="daCham()"
              (giaTriChange)="nganh.set($event)"
              (cham)="daCham.set(true)"
            />
            <app-form-field
              id="nam-nhap-hoc"
              loai="number"
              nhan="Năm nhập học"
              goiY="Từ 1900 đến 2100"
              [min]="1900"
              [max]="2100"
              [giaTri]="namNhapHoc()"
              [loi]="loiNamNhapHoc()"
              [daCham]="daCham()"
              (giaTriChange)="namNhapHoc.set($event.toString())"
              (cham)="daCham.set(true)"
            />

            <label class="truong">
              <span>Trạng thái lớp</span>
              <select
                id="trang-thai"
                [value]="trangThai() ? 'true' : 'false'"
                (change)="doiTrangThai($event)"
              >
                <option value="true">Đang hoạt động</option>
                <option value="false">Đã khóa</option>
              </select>
              <small>Lớp đã khóa không được chọn khi tạo hồ sơ sinh viên.</small>
            </label>

            <app-form-field
              id="mo-ta"
              loai="textarea"
              nhan="Mô tả"
              goiY="Thông tin bổ sung về lớp (không bắt buộc)"
              [giaTri]="moTa()"
              [loi]="loiTruong('mo_ta')"
              [daCham]="daCham()"
              (giaTriChange)="moTa.set($event)"
              (cham)="daCham.set(true)"
            />
          </div>
        </section>

        <div class="hanh-dong">
          <a class="nut-huy" routerLink="/lop-hanh-chinh">Hủy</a>
          <app-button type="submit" [loading]="dangGui()">
            {{ laChinhSua ? 'Lưu thay đổi' : 'Tạo lớp' }}
          </app-button>
        </div>
      </form>
    }
  `,
  styles: `
    :host {
      display: block;
      width: min(100%, 980px);
      margin-inline: auto;
    }

    .form {
      display: grid;
      gap: 16px;
      padding-bottom: 28px;
    }

    .nhom-truong {
      padding: 24px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }

    .dau-nhom {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 22px;
    }

    .nhan-muc {
      color: var(--color-primary);
      font-size: var(--text-caption);
      font-weight: 700;
      letter-spacing: 0.08em;
    }

    .dau-nhom h2 {
      margin-top: 5px;
      color: var(--color-ink);
      font-size: var(--text-h2);
      font-weight: 650;
    }

    .dau-nhom p {
      margin: 0;
      color: var(--color-ink-subtle);
      font-size: var(--text-caption);
    }

    .dau-nhom p span {
      color: var(--color-danger);
    }

    .luoi {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px 20px;
    }

    .truong {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: 7px;
      color: var(--color-ink);
      font-size: var(--text-small);
      font-weight: 600;
    }

    .truong select {
      width: 100%;
      min-height: 40px;
      padding: 9px 11px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
      font: 400 var(--text-small) var(--font-body);
    }

    .truong select:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    .truong small {
      color: var(--color-ink-subtle);
      font-size: var(--text-caption);
      font-weight: 400;
      line-height: 1.5;
    }

    app-form-field:has(textarea) {
      grid-column: 1 / -1;
    }

    .hanh-dong {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 16px;
      padding: 0 2px;
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
      padding: 40px 16px;
      color: var(--color-ink-muted);
      text-align: center;
    }

    @media (max-width: 640px) {
      .nhom-truong {
        padding: 18px 16px;
      }

      .dau-nhom {
        align-items: flex-start;
        flex-direction: column;
      }

      .luoi {
        grid-template-columns: minmax(0, 1fr);
        gap: 12px;
      }

      app-form-field:has(textarea) {
        grid-column: auto;
      }

      .hanh-dong {
        justify-content: space-between;
      }
    }
  `,
})
export class LopHanhChinhForm {
  private readonly service = inject(LopHanhChinhService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly thamSoId = this.route.snapshot.paramMap.get('id');

  readonly id = this.layId(this.thamSoId);
  readonly laChinhSua = this.thamSoId !== null;
  readonly dangTai = signal(this.laChinhSua);
  readonly dangGui = signal(false);
  readonly daCham = signal(false);
  readonly loiTai = signal('');
  readonly loiChung = signal('');
  readonly loiApi = signal<Record<string, string[]>>({});

  readonly maLop = signal('');
  readonly tenLop = signal('');
  readonly khoaHoc = signal('');
  readonly nganh = signal('');
  readonly namNhapHoc = signal('');
  readonly moTa = signal('');
  readonly trangThai = signal(true);

  readonly loiMaLop = computed(() => {
    const maLop = this.maLop().trim();
    return (
      this.loiTruong('ma_lop') ||
      (!maLop ? 'Mã lớp là bắt buộc.' : maLop.length > 20 ? 'Mã lớp không được vượt quá 20 ký tự.' : '')
    );
  });
  readonly loiTenLop = computed(() => {
    const tenLop = this.tenLop().trim();
    return (
      this.loiTruong('ten_lop') ||
      (!tenLop ? 'Tên lớp là bắt buộc.' : tenLop.length > 255 ? 'Tên lớp không được vượt quá 255 ký tự.' : '')
    );
  });
  readonly loiNamNhapHoc = computed(() => {
    const value = this.namNhapHoc().trim();
    if (!value) return '';
    const year = Number(value);
    return Number.isInteger(year) && year >= 1900 && year <= 2100
      ? this.loiTruong('nam_nhap_hoc')
      : 'Năm nhập học phải là số nguyên từ 1900 đến 2100.';
  });

  constructor() {
    if (this.laChinhSua) this.tai();
  }

  gui(event: Event): void {
    event.preventDefault();
    if (this.dangGui()) return;

    this.daCham.set(true);
    this.loiChung.set('');
    this.loiApi.set({});
    if (
      this.loiMaLop() ||
      this.loiTenLop() ||
      this.loiKhoaHoc() ||
      this.loiNganh() ||
      this.loiNamNhapHoc()
    ) {
      this.loiChung.set('Vui lòng kiểm tra các trường được đánh dấu trước khi lưu.');
      return;
    }

    const input: LopHanhChinhInput = {
      ma_lop: this.maLop().trim(),
      ten_lop: this.tenLop().trim(),
      khoa_hoc: this.khoaHoc().trim() || null,
      nganh: this.nganh().trim() || null,
      nam_nhap_hoc: this.namNhapHoc().trim() ? Number(this.namNhapHoc()) : null,
      mo_ta: this.moTa().trim() || null,
      trang_thai: this.trangThai(),
    };

    this.dangGui.set(true);
    const request = this.laChinhSua
      ? this.service.capNhat(this.id!, input)
      : this.service.taoMoi(input);
    request.subscribe({
      next: (saved) => {
        this.dangGui.set(false);
        void this.router.navigate(['/lop-hanh-chinh', saved.id]);
      },
      error: (error: unknown) => {
        this.dangGui.set(false);
        if (error instanceof HttpErrorResponse && error.status === 422) {
          this.loiApi.set(error.error?.errors ?? {});
          this.loiChung.set(error.error?.message ?? 'Dữ liệu không hợp lệ.');
          return;
        }
        this.loiChung.set(
          error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
            ? error.error.message
            : 'Không thể lưu lớp. Kiểm tra kết nối rồi thử lại.',
        );
      },
    });
  }

  doiTrangThai(event: Event): void {
    this.trangThai.set((event.target as HTMLSelectElement).value === 'true');
  }

  loiKhoaHoc(): string {
    return this.loiTruong('khoa_hoc') ||
      (this.khoaHoc().trim().length > 20 ? 'Khóa học không được vượt quá 20 ký tự.' : '');
  }

  loiNganh(): string {
    return this.loiTruong('nganh') ||
      (this.nganh().trim().length > 20 ? 'Ngành không được vượt quá 20 ký tự.' : '');
  }

  loiTruong(field: string): string {
    return this.loiApi()[field]?.[0] ?? '';
  }

  private tai(): void {
    if (this.id === null) {
      this.loiTai.set('Mã lớp không hợp lệ.');
      this.dangTai.set(false);
      return;
    }

    this.service.layMot(this.id).subscribe({
      next: (lop) => {
        this.maLop.set(lop.ma_lop);
        this.tenLop.set(lop.ten_lop);
        this.khoaHoc.set(lop.khoa_hoc ?? '');
        this.nganh.set(lop.nganh ?? '');
        this.namNhapHoc.set(lop.nam_nhap_hoc?.toString() ?? '');
        this.moTa.set(lop.mo_ta ?? '');
        this.trangThai.set(lop.trang_thai);
        this.dangTai.set(false);
      },
      error: (error: unknown) => {
        this.loiTai.set(
          error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
            ? error.error.message
            : 'Không tải được thông tin lớp. Kiểm tra kết nối rồi thử lại.',
        );
        this.dangTai.set(false);
      },
    });
  }

  private layId(value: string | null): number | null {
    if (value === null) return null;
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
  }
}
