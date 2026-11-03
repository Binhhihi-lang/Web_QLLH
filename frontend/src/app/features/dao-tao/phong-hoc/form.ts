import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { FormField } from '@shared/ui/form-field';
import { PageHeader } from '@shared/ui/page-header';
import { PhongHocInput, PhongHocService } from './phong-hoc.service';

@Component({
  selector: 'app-phong-hoc-form',
  standalone: true,
  imports: [AppAlert, AppButton, FormField, PageHeader, RouterLink],
  template: `
    <app-page-header
      [title]="laChinhSua ? 'Sửa phòng học' : 'Thêm phòng học'"
      [description]="
        laChinhSua
          ? 'Cập nhật mã phòng, tên hiển thị, sức chứa và trạng thái sử dụng.'
          : 'Bổ sung phòng học vào danh mục để sẵn sàng xếp lịch.'
      "
    >
      <a class="nut-quay-lai" routerLink="/phong-hoc">
        <span class="material-icons" aria-hidden="true">arrow_back</span>
        Danh sách phòng học
      </a>
    </app-page-header>

    @if (dangTai()) {
      <div class="dang-tai" role="status" aria-live="polite">Đang tải thông tin phòng học…</div>
    } @else if (loiTai()) {
      <app-alert muc="danger" title="Không tải được phòng học">
        {{ loiTai() }}
        <a routerLink="/phong-hoc">Quay lại danh sách</a>
      </app-alert>
    } @else {
      <form class="form" (submit)="gui($event)" novalidate>
        @if (loiChung()) {
          <app-alert muc="danger" title="Chưa thể lưu phòng học">{{ loiChung() }}</app-alert>
        }

        <section class="nhom-truong" aria-labelledby="thong-tin-phong-hoc">
          <div class="dau-nhom">
            <h2 id="thong-tin-phong-hoc">Thông tin phòng học</h2>
            <p>Các trường có dấu * là bắt buộc. Mã phòng cần duy nhất trong danh mục.</p>
          </div>
          <div class="luoi">
            <app-form-field
              id="ma-phong"
              nhan="Mã phòng"
              goiY="Ví dụ: A101"
              [giaTri]="maPhong()"
              [loi]="loiMaPhong()"
              [daCham]="daCham()"
              [batBuoc]="true"
              (giaTriChange)="maPhong.set($event)"
            />
            <app-form-field
              id="ten-phong"
              nhan="Tên phòng"
              goiY="Ví dụ: Phòng học A101"
              [giaTri]="tenPhong()"
              [loi]="loiTenPhong()"
              [daCham]="daCham()"
              [batBuoc]="true"
              (giaTriChange)="tenPhong.set($event)"
            />
            <app-form-field
              id="suc-chua"
              loai="number"
              nhan="Sức chứa"
              goiY="Nhập số chỗ ngồi"
              [giaTri]="sucChua()"
              [loi]="loiSucChua()"
              [daCham]="daCham()"
              [batBuoc]="true"
              [min]="1"
              [max]="65535"
              [buocNhay]="1"
              (giaTriChange)="sucChua.set($event)"
            />
            <label class="truong">
              <span>Trạng thái</span>
              <select [value]="trangThai() ? 'true' : 'false'" (change)="doiTrangThai($event)">
                <option value="true">Đang hoạt động</option>
                <option value="false">Đã khóa</option>
              </select>
              <small>Phòng đã khóa sẽ không dùng để xếp lịch mới.</small>
            </label>
          </div>
        </section>

        <div class="hanh-dong">
          <a class="nut-huy" routerLink="/phong-hoc">Hủy</a>
          <app-button type="submit" [loading]="dangGui()">
            {{ laChinhSua ? 'Lưu thay đổi' : 'Tạo phòng học' }}
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

    .truong small {
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
      font-weight: 400;
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
export class PhongHocForm {
  private readonly service = inject(PhongHocService);
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
  readonly maPhong = signal('');
  readonly tenPhong = signal('');
  readonly sucChua = signal<string | number>(40);
  readonly trangThai = signal(true);

  readonly loiMaPhong = computed(
    () =>
      this.loiTruong('ma_phong') ||
      (this.daCham() && !this.maPhong().trim() ? 'Mã phòng là bắt buộc.' : '') ||
      (this.maPhong().trim().length > 20 ? 'Mã phòng không được vượt quá 20 ký tự.' : ''),
  );
  readonly loiTenPhong = computed(
    () =>
      this.loiTruong('ten_phong') ||
      (this.daCham() && !this.tenPhong().trim() ? 'Tên phòng là bắt buộc.' : '') ||
      (this.tenPhong().trim().length > 255 ? 'Tên phòng không được vượt quá 255 ký tự.' : ''),
  );
  readonly loiSucChua = computed(() => {
    const capacity = Number(this.sucChua());
    return (
      this.loiTruong('suc_chua') ||
      (this.daCham() && this.sucChua() === '' ? 'Sức chứa là bắt buộc.' : '') ||
      (!Number.isInteger(capacity) || capacity < 1 || capacity > 65535
        ? 'Sức chứa phải là số nguyên từ 1 đến 65535.'
        : '')
    );
  });

  constructor() {
    if (this.laChinhSua && this.id === null) {
      this.dangTai.set(false);
      this.loiTai.set('Mã phòng học không hợp lệ.');
      return;
    }
    if (this.id !== null) this.taiPhongHoc(this.id);
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
    if (this.loiMaPhong() || this.loiTenPhong() || this.loiSucChua()) return;

    this.dangGui.set(true);
    const duLieu: PhongHocInput = {
      ma_phong: this.maPhong().trim(),
      ten_phong: this.tenPhong().trim(),
      suc_chua: Number(this.sucChua()),
      trang_thai: this.trangThai(),
    };
    const request =
      this.id === null ? this.service.taoMoi(duLieu) : this.service.capNhat(this.id, duLieu);
    request.subscribe({
      next: () => {
        this.dangGui.set(false);
        void this.router.navigate(['/phong-hoc']);
      },
      error: (error: unknown) => this.xuLyLoi(error),
    });
  }

  private layId(param: string | null): number | null {
    if (param === null) return null;
    const id = Number(param);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  private taiPhongHoc(id: number): void {
    this.service.layMot(id).subscribe({
      next: (phong) => {
        this.maPhong.set(phong.ma_phong);
        this.tenPhong.set(phong.ten_phong);
        this.sucChua.set(phong.suc_chua);
        this.trangThai.set(phong.trang_thai);
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
