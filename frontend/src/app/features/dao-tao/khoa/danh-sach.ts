import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { Khoa } from '@core/models/dao-tao.model';
import { PageMeta } from '@core/mock/mock-response';
import {
  KhoaNganhService,
  ThamSoDanhSachKhoa,
} from '@core/services/khoa-nganh.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { CotBang, DataTable, OTuyChinh, SapXep } from '@shared/ui/data-table';
import { PageHeader } from '@shared/ui/page-header';
import { Pagination } from '@shared/ui/pagination';
import { SearchInput } from '@shared/ui/search-input';
import { StatusBadge } from '@shared/ui/status-badge';

@Component({
  selector: 'app-khoa-danh-sach',
  standalone: true,
  imports: [
    AppButton,
    ConfirmDialog,
    DataTable,
    OTuyChinh,
    PageHeader,
    Pagination,
    RouterLink,
    SearchInput,
    StatusBadge,
  ],
  template: `
    <app-page-header
      title="Quản lý Khoa"
      description="Quản lý các khoa và ngành trực thuộc trong danh mục đào tạo."
    >
      @if (laAdmin()) {
        <app-button variant="primary" routerLink="/khoa/them">
          <span class="material-icons" aria-hidden="true">add</span>
          Thêm khoa
        </app-button>
      }
    </app-page-header>

    <section class="bang-dieu-khien" aria-label="Tìm kiếm và lọc khoa">
      <div class="dau-bang">
        <div>
          <h2>Danh mục khoa</h2>
          <p>{{ meta()?.total ?? '—' }} khoa trong hệ thống</p>
        </div>
        <span class="chi-bao">
          <span class="material-icons" aria-hidden="true">account_balance</span>
          {{ meta()?.total ?? '—' }} khoa
        </span>
      </div>

      <div class="thanh-loc">
        <app-search-input
          placeholder="Tìm theo mã hoặc tên khoa…"
          [value]="tuKhoa()"
          (valueChange)="doiTuKhoa($event)"
        />
        <label class="loc">
          <span>Trạng thái</span>
          <select aria-label="Lọc khoa theo trạng thái" [value]="locTrangThai()" (change)="doiLocTrangThai($event)">
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã khóa</option>
          </select>
        </label>
        <div class="cum-nut">
          <app-button variant="primary" size="sm" (click)="apDungLoc()">
            <span class="material-icons nut-ic" aria-hidden="true">filter_alt</span>
            Áp dụng
          </app-button>
          @if (coLoc()) {
            <button type="button" class="xoa-loc" (click)="xoaLoc()">Xóa bộ lọc</button>
          }
        </div>
      </div>
    </section>

    <app-data-table
      [cot]="cot()"
      [rows]="rows()"
      [dangTai]="dangTai()"
      [loi]="loi()"
      [bamDong]="true"
      tieuDeRong="Chưa có khoa phù hợp"
      [moTaRong]="coLoc() ? 'Thử thay đổi từ khóa hoặc bộ lọc.' : 'Danh mục khoa hiện chưa có dữ liệu.'"
      (sapXep)="doiSapXep($event)"
      (dongDuocBam)="moChiTiet($event)"
      (thuLai)="tai()"
    >
      <ng-template appOTuyChinh="trang_thai" let-row>
        <app-status-badge
          [value]="row.trang_thai ? 'ACTIVE' : 'INACTIVE'"
          [label]="row.trang_thai ? 'Đang hoạt động' : 'Đã khóa'"
        />
      </ng-template>
      <ng-template appOTuyChinh="thao_tac" let-row>
        @if (laAdmin()) {
          <div class="nhom-thao-tac">
            <a class="nut-sua" [routerLink]="['/khoa', row.id, 'sua']" [attr.aria-label]="'Sửa khoa ' + row.ma_khoa">
              <span class="material-icons" aria-hidden="true">edit</span>
              Sửa
            </a>
            <button
              type="button"
              class="nut-sua nut-xoa"
              [disabled]="dangXoa()"
              [attr.aria-label]="'Xóa khoa ' + row.ma_khoa"
              (click)="hoiXoa(row)"
            >
              <span class="material-icons" aria-hidden="true">delete</span>
              Xóa
            </button>
          </div>
        }
      </ng-template>
      @if (laAdmin()) {
        <a emptyAction class="nut-rong" routerLink="/khoa/them">Thêm khoa</a>
      }
    </app-data-table>

    @if (meta(); as m) {
      <app-pagination
        [currentPage]="m.current_page"
        [perPage]="m.per_page"
        [total]="m.total"
        [lastPage]="m.last_page"
        (pageChange)="doiTrang($event)"
        (perPageChange)="doiCoTrang($event)"
      />
    }

    @if (khoaChoXoa(); as khoa) {
      <app-confirm-dialog
        tieuDe="Xóa khoa"
        [moTa]="'Khoa ' + khoa.ten_khoa + ' (' + khoa.ma_khoa + ') sẽ được chuyển vào thùng rác.'"
        [dangXuLy]="dangXoa()"
        [lyDoChan]="lyDoChanXoa()"
        (dongY)="xacNhanXoa()"
        (huy)="khoaChoXoa.set(null)"
      />
    }
  `,
  styles: `
    .bang-dieu-khien {
      margin-bottom: 14px;
      padding: 18px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }
    .dau-bang, .thanh-loc, .cum-nut, .nhom-thao-tac, .chi-bao {
      display: flex;
      align-items: center;
    }
    .dau-bang { justify-content: space-between; gap: 16px; margin-bottom: 16px; }
    .dau-bang h2 { color: var(--color-ink); font-size: var(--text-h3); font-weight: 650; }
    .dau-bang p { margin: 5px 0 0; color: var(--color-ink-muted); font-size: var(--text-small); }
    .chi-bao {
      gap: 7px; padding: 7px 11px; border: 1px solid var(--color-primary-soft);
      border-radius: 999px; background: var(--color-primary-soft);
      color: var(--color-on-primary-soft); font-size: var(--text-small); font-weight: 650;
      white-space: nowrap;
    }
    .chi-bao .material-icons, .nut-ic { font-size: 18px; }
    .thanh-loc { gap: 10px; flex-wrap: wrap; align-items: flex-end; }
    app-search-input { flex: 1 1 260px; min-width: 190px; max-width: 400px; }
    .loc {
      display: flex; flex: 0 1 190px; flex-direction: column; gap: 5px;
      color: var(--color-ink-muted); font-size: var(--text-caption); font-weight: 650;
    }
    .loc select {
      min-height: 38px; padding: 8px 10px; border: 1.5px solid var(--color-border);
      border-radius: var(--radius); background: var(--color-surface); color: var(--color-ink);
      font: 400 var(--text-small) var(--font-body);
    }
    .loc select:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
    .cum-nut { gap: 8px; flex-wrap: wrap; margin-left: auto; }
    .xoa-loc {
      min-height: 36px; padding: 7px 9px; border: 0; border-radius: var(--radius);
      background: transparent; color: var(--color-ink-muted); font: 600 var(--text-small) var(--font-body);
      cursor: pointer;
    }
    .xoa-loc:hover { background: var(--color-danger-soft); color: var(--color-danger); }
    .nhom-thao-tac { gap: 5px; flex-wrap: wrap; min-width: 150px; }
    .nut-sua {
      display: inline-flex; align-items: center; gap: 4px; min-height: 32px; padding: 4px 7px;
      border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--color-primary);
      font: 600 var(--text-caption) var(--font-body); text-decoration: none; cursor: pointer;
    }
    .nut-sua:hover:not(:disabled) { background: var(--color-primary-soft); }
    .nut-sua:focus-visible, .nut-rong:focus-visible, .xoa-loc:focus-visible {
      outline: 2px solid var(--color-primary); outline-offset: 2px;
    }
    .nut-sua .material-icons { font-size: 17px; }
    .nut-sua:disabled { cursor: wait; opacity: .6; }
    .nut-xoa { color: var(--color-danger); }
    .nut-xoa:hover:not(:disabled) { background: var(--color-danger-soft); }
    .nut-rong {
      display: inline-flex; margin-top: 12px; padding: 8px 12px; border-radius: var(--radius);
      background: var(--color-primary); color: var(--color-on-primary);
      font-size: var(--text-small); font-weight: 600; text-decoration: none;
    }
    @media (max-width: 700px) {
      .bang-dieu-khien { padding: 14px; }
      .dau-bang { align-items: flex-start; }
      app-search-input, .loc { flex: 1 1 100%; max-width: none; }
      .cum-nut { width: 100%; margin-left: 0; }
    }
  `,
})
export class KhoaDanhSach {
  private readonly service = inject(KhoaNganhService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly laAdmin = computed(() => this.auth.nguoiDung()?.vai_tro === 'ADMIN');
  readonly dangTai = signal(true);
  readonly loi = signal<string | null>(null);
  readonly rows = signal<Khoa[]>([]);
  readonly meta = signal<PageMeta | null>(null);
  readonly tuKhoa = signal('');
  readonly locTrangThai = signal('');
  readonly khoaChoXoa = signal<Khoa | null>(null);
  readonly dangXoa = signal(false);
  readonly lyDoChanXoa = signal('');
  readonly sapXepHienTai = signal<SapXep>({ sort_by: 'ma_khoa', sort_dir: 'asc' });

  private readonly boLoc = signal({ tuKhoa: '', trangThai: '' });
  private trang = 1;
  private coTrang: 10 | 25 | 50 | 100 = 10;

  readonly cot = computed<CotBang<Khoa>[]>(() => [
    { khoa: 'ma_khoa', nhan: 'Mã khoa', sap_xep: true, rong: '140px' },
    { khoa: 'ten_khoa', nhan: 'Tên khoa', sap_xep: true },
    { khoa: 'so_nganh', nhan: 'Số ngành', can_phai: true, rong: '120px' },
    { khoa: 'trang_thai', nhan: 'Trạng thái', rong: '150px' },
    ...(this.laAdmin() ? [{ khoa: 'thao_tac', nhan: 'Thao tác', rong: '150px' }] : []),
  ]);
  readonly coLoc = computed(() => {
    const filter = this.boLoc();
    return Boolean(filter.tuKhoa || filter.trangThai);
  });

  constructor() {
    this.tai();
  }

  moChiTiet(khoa: Khoa): void {
    void this.router.navigate(['/khoa', khoa.id]);
  }

  tai(): void {
    this.dangTai.set(true);
    this.loi.set(null);
    const sort = this.sapXepHienTai();
    const filter = this.boLoc();
    const params: ThamSoDanhSachKhoa = {
      page: this.trang,
      per_page: this.coTrang,
      q: filter.tuKhoa || undefined,
      sort_by: sort.sort_by,
      sort_dir: sort.sort_dir,
      trang_thai: filter.trangThai === '' ? undefined : filter.trangThai === 'true',
    };
    this.service.layDanhSachKhoa(params).subscribe({
      next: (response) => {
        this.rows.set(response.data);
        this.meta.set(response.meta);
        this.dangTai.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loi.set(error.error?.message ?? 'Không tải được danh sách khoa. Hãy thử lại.');
        this.dangTai.set(false);
      },
    });
  }

  doiTuKhoa(value: string): void {
    this.tuKhoa.set(value);
    this.boLoc.update((filter) => ({ ...filter, tuKhoa: value }));
    this.trang = 1;
    this.tai();
  }

  doiLocTrangThai(event: Event): void {
    this.locTrangThai.set((event.target as HTMLSelectElement).value);
  }

  apDungLoc(): void {
    this.boLoc.update((filter) => ({ ...filter, trangThai: this.locTrangThai() }));
    this.trang = 1;
    this.tai();
  }

  xoaLoc(): void {
    this.tuKhoa.set('');
    this.locTrangThai.set('');
    this.boLoc.set({ tuKhoa: '', trangThai: '' });
    this.trang = 1;
    this.tai();
  }

  doiSapXep(sort: SapXep): void {
    this.sapXepHienTai.set(sort);
    this.trang = 1;
    this.tai();
  }

  doiTrang(page: number): void {
    this.trang = page;
    this.tai();
  }

  doiCoTrang(perPage: number): void {
    if (![10, 25, 50, 100].includes(perPage)) return;
    this.coTrang = perPage as 10 | 25 | 50 | 100;
    this.trang = 1;
    this.tai();
  }

  hoiXoa(khoa: Khoa): void {
    this.lyDoChanXoa.set('');
    this.khoaChoXoa.set(khoa);
  }

  xacNhanXoa(): void {
    const khoa = this.khoaChoXoa();
    if (!khoa || this.dangXoa()) return;

    this.dangXoa.set(true);
    this.service.xoaKhoa(khoa.id).subscribe({
      next: () => {
        this.dangXoa.set(false);
        this.khoaChoXoa.set(null);
        if (this.rows().length === 1 && this.trang > 1) this.trang -= 1;
        this.tai();
      },
      error: (error: HttpErrorResponse) => {
        this.dangXoa.set(false);
        this.lyDoChanXoa.set(error.error?.message ?? 'Không thể xóa khoa. Hãy thử lại.');
      },
    });
  }
}
