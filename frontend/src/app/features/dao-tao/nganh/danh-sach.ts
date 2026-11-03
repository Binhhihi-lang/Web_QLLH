import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { Nganh, TuyChonKhoa } from '@core/models/dao-tao.model';
import { PageMeta } from '@core/mock/mock-response';
import {
  KhoaNganhService,
  ThamSoDanhSachNganh,
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
  selector: 'app-nganh-danh-sach',
  standalone: true,
  imports: [
    AppAlert,
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
      title="Quản lý Ngành"
      description="Quản lý ngành theo khoa; lớp hành chính và giảng viên tham chiếu danh mục này."
    >
      @if (laAdmin()) {
        <app-button variant="primary" routerLink="/nganh/them">
          <span class="material-icons" aria-hidden="true">add</span>
          Thêm ngành
        </app-button>
      }
    </app-page-header>

    @if (loiTaiKhoa()) {
      <app-alert muc="warning" title="Không tải được danh sách khoa">
        {{ loiTaiKhoa() }}
        <button type="button" class="thu-lai" (click)="taiKhoa()">Thử lại</button>
      </app-alert>
    }

    <section class="bang-dieu-khien" aria-label="Tìm kiếm và lọc ngành">
      <div class="dau-bang">
        <div>
          <h2>Danh mục ngành</h2>
          <p>{{ meta()?.total ?? '—' }} ngành trong hệ thống</p>
        </div>
        <span class="chi-bao">
          <span class="material-icons" aria-hidden="true">account_tree</span>
          {{ meta()?.total ?? '—' }} ngành
        </span>
      </div>

      <div class="thanh-loc">
        <app-search-input
          placeholder="Tìm theo mã hoặc tên ngành…"
          [value]="tuKhoa()"
          (valueChange)="doiTuKhoa($event)"
        />
        <label class="loc">
          <span>Khoa</span>
          <select aria-label="Lọc ngành theo khoa" [value]="locKhoa()" (change)="doiLocKhoa($event)">
            <option value="">Tất cả khoa</option>
            @for (khoa of dsKhoa(); track khoa.id) {
              <option [value]="khoa.id">{{ khoa.label }}</option>
            }
          </select>
        </label>
        <label class="loc">
          <span>Trạng thái</span>
          <select aria-label="Lọc ngành theo trạng thái" [value]="locTrangThai()" (change)="doiLocTrangThai($event)">
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
      tieuDeRong="Chưa có ngành phù hợp"
      [moTaRong]="coLoc() ? 'Thử thay đổi từ khóa hoặc bộ lọc.' : 'Danh mục ngành hiện chưa có dữ liệu.'"
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
            <a class="nut-sua" [routerLink]="['/nganh', row.id, 'sua']" [attr.aria-label]="'Sửa ngành ' + row.ma_nganh">
              <span class="material-icons" aria-hidden="true">edit</span>
              Sửa
            </a>
            <button
              type="button"
              class="nut-sua nut-xoa"
              [disabled]="dangXoa()"
              [attr.aria-label]="'Xóa ngành ' + row.ma_nganh"
              (click)="hoiXoa(row)"
            >
              <span class="material-icons" aria-hidden="true">delete</span>
              Xóa
            </button>
          </div>
        }
      </ng-template>
      @if (laAdmin()) {
        <a emptyAction class="nut-rong" routerLink="/nganh/them">Thêm ngành</a>
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

    @if (nganhChoXoa(); as nganh) {
      <app-confirm-dialog
        tieuDe="Xóa ngành"
        [moTa]="'Ngành ' + nganh.ten_nganh + ' (' + nganh.ma_nganh + ') sẽ được chuyển vào thùng rác.'"
        [dangXuLy]="dangXoa()"
        [lyDoChan]="lyDoChanXoa()"
        (dongY)="xacNhanXoa()"
        (huy)="nganhChoXoa.set(null)"
      />
    }
  `,
  styles: `
    .bang-dieu-khien {
      margin: 14px 0;
      padding: 18px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }
    .dau-bang, .thanh-loc, .cum-nut, .nhom-thao-tac, .chi-bao { display: flex; align-items: center; }
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
    app-search-input { flex: 1 1 240px; min-width: 190px; max-width: 360px; }
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
    .xoa-loc, .thu-lai {
      min-height: 36px; padding: 7px 9px; border: 0; border-radius: var(--radius);
      background: transparent; color: var(--color-ink-muted); font: 600 var(--text-small) var(--font-body);
      cursor: pointer;
    }
    .xoa-loc:hover, .thu-lai:hover { background: var(--color-primary-soft); color: var(--color-primary); }
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
export class NganhDanhSach {
  private readonly service = inject(KhoaNganhService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly laAdmin = computed(() => this.auth.nguoiDung()?.vai_tro === 'ADMIN');
  readonly dangTai = signal(true);
  readonly dangTaiKhoa = signal(true);
  readonly loi = signal<string | null>(null);
  readonly loiTaiKhoa = signal<string | null>(null);
  readonly rows = signal<Nganh[]>([]);
  readonly dsKhoa = signal<TuyChonKhoa[]>([]);
  readonly meta = signal<PageMeta | null>(null);
  readonly tuKhoa = signal('');
  readonly locKhoa = signal('');
  readonly locTrangThai = signal('');
  readonly nganhChoXoa = signal<Nganh | null>(null);
  readonly dangXoa = signal(false);
  readonly lyDoChanXoa = signal('');
  readonly sapXepHienTai = signal<SapXep>({ sort_by: 'ma_nganh', sort_dir: 'asc' });

  private readonly boLoc = signal({ tuKhoa: '', khoaId: '', trangThai: '' });
  private trang = 1;
  private coTrang: 10 | 25 | 50 | 100 = 10;

  readonly cot = computed<CotBang<Nganh>[]>(() => [
    { khoa: 'ma_nganh', nhan: 'Mã ngành', sap_xep: true, rong: '140px' },
    { khoa: 'ten_nganh', nhan: 'Tên ngành', sap_xep: true },
    { khoa: 'khoa.ten_khoa', nhan: 'Khoa', rong: '230px' },
    { khoa: 'trang_thai', nhan: 'Trạng thái', rong: '150px' },
    ...(this.laAdmin() ? [{ khoa: 'thao_tac', nhan: 'Thao tác', rong: '150px' }] : []),
  ]);
  readonly coLoc = computed(() => {
    const filter = this.boLoc();
    return Boolean(filter.tuKhoa || filter.khoaId || filter.trangThai);
  });

  constructor() {
    this.taiKhoa();
    this.tai();
  }

  moChiTiet(nganh: Nganh): void {
    void this.router.navigate(['/nganh', nganh.id]);
  }

  taiKhoa(): void {
    this.dangTaiKhoa.set(true);
    this.loiTaiKhoa.set(null);
    this.service.layTuyChonKhoa().subscribe({
      next: (khoa) => {
        this.dsKhoa.set(khoa);
        this.dangTaiKhoa.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loiTaiKhoa.set(error.error?.message ?? 'Không tải được danh sách khoa.');
        this.dangTaiKhoa.set(false);
      },
    });
  }

  tai(): void {
    this.dangTai.set(true);
    this.loi.set(null);
    const sort = this.sapXepHienTai();
    const filter = this.boLoc();
    const params: ThamSoDanhSachNganh = {
      page: this.trang,
      per_page: this.coTrang,
      q: filter.tuKhoa || undefined,
      sort_by: sort.sort_by,
      sort_dir: sort.sort_dir,
      khoa_id: filter.khoaId === '' ? undefined : Number(filter.khoaId),
      trang_thai: filter.trangThai === '' ? undefined : filter.trangThai === 'true',
    };
    this.service.layDanhSachNganh(params).subscribe({
      next: (response) => {
        this.rows.set(response.data);
        this.meta.set(response.meta);
        this.dangTai.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loi.set(error.error?.message ?? 'Không tải được danh sách ngành. Hãy thử lại.');
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

  doiLocKhoa(event: Event): void {
    this.locKhoa.set((event.target as HTMLSelectElement).value);
  }

  doiLocTrangThai(event: Event): void {
    this.locTrangThai.set((event.target as HTMLSelectElement).value);
  }

  apDungLoc(): void {
    this.boLoc.update((filter) => ({
      ...filter,
      khoaId: this.locKhoa(),
      trangThai: this.locTrangThai(),
    }));
    this.trang = 1;
    this.tai();
  }

  xoaLoc(): void {
    this.tuKhoa.set('');
    this.locKhoa.set('');
    this.locTrangThai.set('');
    this.boLoc.set({ tuKhoa: '', khoaId: '', trangThai: '' });
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

  hoiXoa(nganh: Nganh): void {
    this.lyDoChanXoa.set('');
    this.nganhChoXoa.set(nganh);
  }

  xacNhanXoa(): void {
    const nganh = this.nganhChoXoa();
    if (!nganh || this.dangXoa()) return;

    this.dangXoa.set(true);
    this.service.xoaNganh(nganh.id).subscribe({
      next: () => {
        this.dangXoa.set(false);
        this.nganhChoXoa.set(null);
        if (this.rows().length === 1 && this.trang > 1) this.trang -= 1;
        this.tai();
      },
      error: (error: HttpErrorResponse) => {
        this.dangXoa.set(false);
        this.lyDoChanXoa.set(error.error?.message ?? 'Không thể xóa ngành. Hãy thử lại.');
      },
    });
  }
}
