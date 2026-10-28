import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MonHocService, MonHocInput } from './mon-hoc.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { FormField } from '@shared/ui/form-field';
import { PageHeader } from '@shared/ui/page-header';

@Component({
  selector: 'app-mon-hoc-form',
  standalone: true,
  imports: [AppAlert, AppButton, FormField, PageHeader, RouterLink],
  template: `
    <app-page-header
      [title]="laChinhSua ? 'Sửa môn học' : 'Thêm môn học'"
      [description]="
        laChinhSua
          ? 'Cập nhật thông tin và trạng thái môn học.'
          : 'Tạo môn học mới trong danh mục đào tạo.'
      "
    >
      <a class="nut-quay-lai" routerLink="/mon-hoc">
        <span class="material-icons" aria-hidden="true">arrow_back</span>
        Danh sách môn học
      </a>
    </app-page-header>

    @if (dangTai()) {
      <div class="dang-tai" role="status" aria-live="polite">Đang tải thông tin môn học…</div>
    } @else if (loiTai()) {
      <app-alert muc="danger" title="Không tải được môn học">
        {{ loiTai() }}
        <a routerLink="/mon-hoc">Quay lại danh sách</a>
      </app-alert>
    } @else {
      <form class="form" (submit)="gui($event)" novalidate>
        @if (loiChung()) {
          <app-alert muc="danger" title="Chưa thể lưu môn học">{{ loiChung() }}</app-alert>
        }

        <section class="nhom-truong" aria-labelledby="thong-tin-mon-hoc">
          <div class="dau-nhom">
            <h2 id="thong-tin-mon-hoc">Thông tin môn học</h2>
            <p>Các trường có dấu * là bắt buộc.</p>
          </div>
          <div class="luoi">
            <app-form-field
              id="ma-mon"
              nhan="Mã môn"
              goiY="Ví dụ: INT2203"
              [giaTri]="maMon()"
              [loi]="loiMaMon()"
              [daCham]="daCham()"
              [batBuoc]="true"
              (giaTriChange)="maMon.set($event)"
            />
            <app-form-field
              id="ten-mon"
              nhan="Tên môn học"
              goiY="Nhập tên môn học"
              [giaTri]="tenMon()"
              [loi]="loiTenMon()"
              [daCham]="daCham()"
              [batBuoc]="true"
              (giaTriChange)="tenMon.set($event)"
            />
            <app-form-field
              id="so-tin-chi"
              loai="number"
              nhan="Số tín chỉ"
              goiY="Từ 1 đến 10"
              [giaTri]="soTinChi()"
              [loi]="loiSoTinChi()"
              [daCham]="daCham()"
              [batBuoc]="true"
              [min]="1"
              [max]="10"
              [buocNhay]="1"
              (giaTriChange)="soTinChi.set($event)"
            />
            <label class="truong">
              <span>Trạng thái</span>
              <select [value]="trangThai() ? 'true' : 'false'" (change)="doiTrangThai($event)">
                <option value="true">Đang hoạt động</option>
                <option value="false">Đã khóa</option>
              </select>
            </label>
            <app-form-field
              id="mo-ta"
              loai="textarea"
              nhan="Mô tả"
              goiY="Thông tin giới thiệu về môn học (không bắt buộc)"
              [giaTri]="moTa()"
              [loi]="loiTruong('mo_ta')"
              [daCham]="daCham()"
              [soDong]="4"
              (giaTriChange)="moTa.set($event)"
            />
          </div>
        </section>

        <div class="hanh-dong">
          <a class="nut-huy" routerLink="/mon-hoc">Huỷ</a>
          <app-button type="submit" [loading]="dangGui()">
            {{ laChinhSua ? 'Lưu thay đổi' : 'Tạo môn học' }}
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

    .truong select {
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

    app-form-field:last-child {
      grid-column: 1 / -1;
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
      min-height: 40px;
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
export class MonHocForm {
  private readonly service = inject(MonHocService);
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
  readonly maMon = signal('');
  readonly tenMon = signal('');
  readonly soTinChi = signal<string | number>(3);
  readonly moTa = signal('');
  readonly trangThai = signal(true);

  readonly loiMaMon = computed(
    () =>
      this.loiTruong('ma_mon') ||
      (this.daCham() && !this.maMon().trim() ? 'Mã môn là bắt buộc.' : '') ||
      (this.maMon().trim().length > 20 ? 'Mã môn không được vượt quá 20 ký tự.' : ''),
  );
  readonly loiTenMon = computed(
    () =>
      this.loiTruong('ten_mon') ||
      (this.daCham() && !this.tenMon().trim() ? 'Tên môn học là bắt buộc.' : '') ||
      (this.tenMon().trim().length > 255 ? 'Tên môn học không được vượt quá 255 ký tự.' : ''),
  );
  readonly loiSoTinChi = computed(() => {
    const credits = Number(this.soTinChi());
    return (
      this.loiTruong('so_tin_chi') ||
      (this.daCham() && this.soTinChi() === '' ? 'Số tín chỉ là bắt buộc.' : '') ||
      (!Number.isInteger(credits) || credits < 1 || credits > 10
        ? 'Số tín chỉ phải là số nguyên từ 1 đến 10.'
        : '')
    );
  });

  constructor() {
    if (this.laChinhSua && this.id === null) {
      this.dangTai.set(false);
      this.loiTai.set('Mã môn học không hợp lệ.');
      return;
    }
    if (this.id !== null) this.taiMonHoc(this.id);
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
    if (this.loiMaMon() || this.loiTenMon() || this.loiSoTinChi()) return;

    this.dangGui.set(true);
    const duLieu: MonHocInput = {
      ma_mon: this.maMon().trim(),
      ten_mon: this.tenMon().trim(),
      so_tin_chi: Number(this.soTinChi()),
      mo_ta: this.moTa().trim() || null,
      trang_thai: this.trangThai(),
    };

    const request =
      this.id === null ? this.service.taoMoi(duLieu) : this.service.capNhat(this.id, duLieu);
    request.subscribe({
      next: () => {
        this.dangGui.set(false);
        void this.router.navigate(['/mon-hoc']);
      },
      error: (error: unknown) => this.xuLyLoi(error),
    });
  }

  private layId(param: string | null): number | null {
    if (param === null) return null;
    const id = Number(param);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  private taiMonHoc(id: number): void {
    this.service.layMot(id).subscribe({
      next: (monHoc) => {
        this.maMon.set(monHoc.ma_mon);
        this.tenMon.set(monHoc.ten_mon);
        this.soTinChi.set(monHoc.so_tin_chi);
        this.moTa.set(monHoc.mo_ta ?? '');
        this.trangThai.set(monHoc.trang_thai);
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
