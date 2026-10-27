import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { LopHanhChinh, ThamSoDanhSach } from '@core/models/dao-tao.model';
import { PageMeta } from '@core/mock/mock-response';
import { AppButton } from '@shared/ui/app-button';
import { CotBang, DataTable, OTuyChinh, SapXep } from '@shared/ui/data-table';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { PageHeader } from '@shared/ui/page-header';
import { Pagination } from '@shared/ui/pagination';
import { SearchInput } from '@shared/ui/search-input';
import { StatusBadge } from '@shared/ui/status-badge';
import { LopHanhChinhService } from './lop-hanh-chinh.service';

@Component({
  selector: 'app-lop-hanh-chinh-danh-sach',
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
      title="Lớp hành chính"
      description="Theo dõi các lớp theo khóa học và ngành đào tạo."
    >
      @if (laAdmin()) {
        <app-button routerLink="/lop-hanh-chinh/them">
          <span class="material-icons" aria-hidden="true">add</span>
          Tạo lớp
        </app-button>
      }
    </app-page-header>

    <section class="bang-dieu-khien" aria-label="Tìm kiếm và lọc lớp hành chính">
      <div class="dau-bang">
        <div>
          <h2>Danh sách lớp</h2>
          @if (meta(); as m) {
            <p>{{ m.total }} lớp · {{ tongSiSo() }} sinh viên trong trang hiện tại</p>
          } @else {
            <p>Tìm theo mã hoặc tên lớp, sau đó thu hẹp theo khóa học và ngành.</p>
          }
        </div>
        <div class="chi-bao">
          <span class="material-icons" aria-hidden="true">groups</span>
          <span>{{ meta()?.total ?? '—' }} lớp</span>
        </div>
      </div>

      <div class="thanh-loc">
        <app-search-input
          placeholder="Tìm mã lớp hoặc tên lớp…"
          [value]="tuKhoa()"
          (valueChange)="doiTuKhoa($event)"
        />

        <label class="loc">
          <span>Khóa học</span>
          <input
            type="search"
            name="khoa_hoc"
            placeholder="Ví dụ: K65"
            [value]="locKhoa()"
            (input)="doiLocKhoa($event)"
          />
        </label>

        <label class="loc">
          <span>Ngành</span>
          <input
            type="search"
            name="nganh"
            placeholder="Ví dụ: CNTT"
            [value]="locNganh()"
            (input)="doiLocNganh($event)"
          />
        </label>

        <label class="loc loc-trang-thai">
          <span>Trạng thái</span>
          <select [value]="locTrangThai()" (change)="doiTrangThai($event)">
            <option value="">Tất cả</option>
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
            <button type="button" class="xoa-loc" (click)="xoaLoc()">
              Xóa bộ lọc
            </button>
          }
        </div>
      </div>
    </section>

    <app-data-table
      [cot]="cot()"
      [rows]="rows()"
      [dangTai]="dangTai()"
      [loi]="loi()"
      [sortBy]="sapXepHienTai().sort_by"
      [sortDir]="sapXepHienTai().sort_dir"
      tieuDeRong="Chưa có lớp hành chính phù hợp"
      [moTaRong]="
        coLoc()
          ? 'Thử thay đổi từ khóa hoặc bộ lọc để tìm lớp cần xem.'
          : 'Danh sách sẽ hiển thị các lớp hành chính đã được tạo.'
      "
      (sapXep)="doiSapXep($event)"
      (thuLai)="tai()"
    >
      <ng-template appOTuyChinh="ma_lop" let-row>
        @if (laAdmin()) {
          <a class="link-lop" [routerLink]="['/lop-hanh-chinh', row.id]">{{ row.ma_lop }}</a>
        } @else {
          <span>{{ row.ma_lop }}</span>
        }
      </ng-template>
      <ng-template appOTuyChinh="khoa_hoc" let-row>
        @if (row.khoa_hoc) {
          <span class="nhan-khoa">{{ row.khoa_hoc }}</span>
        } @else {
          <span class="khong-co-du-lieu">Chưa phân khóa</span>
        }
      </ng-template>
      <ng-template appOTuyChinh="nganh" let-row>
        @if (row.nganh) {
          <span class="ma-nganh">{{ row.nganh }}</span>
        } @else {
          <span class="khong-co-du-lieu">—</span>
        }
      </ng-template>
      <ng-template appOTuyChinh="si_so" let-row>
        <span class="si-so tabular">{{ row.si_so }}</span>
      </ng-template>
      <ng-template appOTuyChinh="trang_thai" let-row>
        <app-status-badge
          [value]="row.trang_thai ? 'ACTIVE' : 'INACTIVE'"
          [label]="row.trang_thai ? 'Đang hoạt động' : 'Đã khóa'"
        />
      </ng-template>
      <ng-template appOTuyChinh="thao_tac" let-row>
        <button
          type="button"
          class="nut-xoa"
          [disabled]="dangXoa()"
          [attr.aria-label]="'Xóa lớp ' + row.ma_lop"
          (click)="hoiXoa(row)"
        >
          <span class="material-icons" aria-hidden="true">delete</span>
          Xóa
        </button>
      </ng-template>
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

    @if (lopChoXoa(); as lop) {
      <app-confirm-dialog
        tieuDe="Xóa lớp hành chính"
        [moTa]="'Lớp ' + lop.ten_lop + ' (' + lop.ma_lop + ') sẽ bị xóa mềm. Không thể xóa lớp còn sinh viên chưa xóa.'"
        [dangXuLy]="dangXoa()"
        [lyDoChan]="lyDoChanXoa()"
        (dongY)="xacNhanXoa()"
        (huy)="lopChoXoa.set(null)"
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

    .dau-bang {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }

    .dau-bang h2 {
      font-size: var(--text-h3);
      font-weight: 650;
      color: var(--color-ink);
    }

    .dau-bang p {
      margin: 5px 0 0;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
    }

    .chi-bao {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 7px 11px;
      border: 1px solid var(--color-primary-soft);
      border-radius: 999px;
      background: var(--color-primary-soft);
      color: var(--color-on-primary-soft);
      font-size: var(--text-small);
      font-weight: 650;
      white-space: nowrap;
    }

    .chi-bao .material-icons {
      font-size: 18px;
    }

    .thanh-loc {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      flex-wrap: wrap;
    }

    app-search-input {
      flex: 1 1 240px;
      min-width: 190px;
      max-width: 380px;
    }

    .loc {
      display: flex;
      flex: 1 1 140px;
      flex-direction: column;
      gap: 5px;
      min-width: 125px;
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
      font-weight: 650;
    }

    .loc-trang-thai {
      flex-basis: 155px;
    }

    .loc input,
    .loc select {
      width: 100%;
      min-height: 38px;
      padding: 8px 10px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
      font: 400 var(--text-small) var(--font-body);
    }

    .loc input:focus,
    .loc select:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    .cum-nut {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-left: auto;
    }

    .nut-ic {
      margin-right: 3px;
      font-size: 17px;
      vertical-align: middle;
    }

    .xoa-loc {
      min-height: 36px;
      padding: 7px 9px;
      border: 0;
      border-radius: var(--radius);
      background: transparent;
      color: var(--color-ink-muted);
      font: 600 var(--text-small) var(--font-body);
      cursor: pointer;
    }

    .xoa-loc:hover {
      background: var(--color-danger-soft);
      color: var(--color-danger);
    }

    .nhan-khoa,
    .ma-nganh {
      display: inline-flex;
      align-items: center;
      min-height: 25px;
      padding: 3px 9px;
      border-radius: 999px;
      background: var(--color-surface-alt);
      color: var(--color-ink);
      font-size: var(--text-caption);
      font-weight: 650;
    }

    .ma-nganh {
      color: var(--color-on-primary-soft);
      background: var(--color-primary-soft);
    }

    .khong-co-du-lieu {
      color: var(--color-ink-subtle);
      font-size: var(--text-caption);
    }

    .si-so {
      display: inline-block;
      min-width: 34px;
      text-align: right;
      font-weight: 650;
      color: var(--color-ink);
    }

    .link-lop {
      color: var(--color-primary);
      font-weight: 650;
      text-decoration: none;
    }

    .link-lop:hover {
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .link-lop:focus-visible {
      border-radius: 3px;
      outline: 2px solid var(--color-primary);
      outline-offset: 3px;
    }

    .nut-xoa {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      min-height: 34px;
      padding: 5px 9px;
      border: 1px solid var(--color-danger);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-danger);
      font: 600 var(--text-small) var(--font-body);
      cursor: pointer;
    }

    .nut-xoa:hover:not(:disabled) {
      background: var(--color-danger-soft);
    }

    .nut-xoa:focus-visible {
      outline: 2px solid var(--color-danger);
      outline-offset: 2px;
    }

    .nut-xoa:disabled {
      cursor: wait;
      opacity: 0.6;
    }

    .nut-xoa .material-icons {
      font-size: 17px;
    }

    @media (max-width: 700px) {
      .bang-dieu-khien {
        padding: 14px;
      }

      .dau-bang {
        align-items: flex-start;
      }

      .cum-nut {
        width: 100%;
        margin-left: 0;
      }

      app-search-input {
        flex-basis: 100%;
        max-width: none;
      }
    }
  `,
})
export class LopHanhChinhDanhSach {
  private readonly service = inject(LopHanhChinhService);
  private readonly auth = inject(AuthService);

  readonly dangTai = signal(true);
  readonly loi = signal<string | null>(null);
  readonly rows = signal<LopHanhChinh[]>([]);
  readonly meta = signal<PageMeta | null>(null);
  readonly lopChoXoa = signal<LopHanhChinh | null>(null);
  readonly dangXoa = signal(false);
  readonly lyDoChanXoa = signal('');
  readonly laAdmin = computed(() => this.auth.nguoiDung()?.vai_tro === 'ADMIN');
  readonly tuKhoa = signal('');
  readonly locKhoa = signal('');
  readonly locNganh = signal('');
  readonly locTrangThai = signal('');
  readonly sapXepHienTai = signal<SapXep>({ sort_by: 'ma_lop', sort_dir: 'asc' });

  private readonly boLoc = signal({ tuKhoa: '', khoa: '', nganh: '', trangThai: '' });
  private trang = 1;
  private coTrang: 10 | 25 | 50 | 100 = 10;

  readonly cot = computed<CotBang<LopHanhChinh>[]>(() => [
    { khoa: 'ma_lop', nhan: 'Mã lớp', sap_xep: true, rong: '150px' },
    { khoa: 'ten_lop', nhan: 'Tên lớp', sap_xep: true, rong: '280px' },
    { khoa: 'khoa_hoc', nhan: 'Khóa học', rong: '125px' },
    { khoa: 'nganh', nhan: 'Ngành', rong: '115px' },
    {
      khoa: 'si_so',
      nhan: 'Sĩ số',
      sap_xep: true,
      can_phai: true,
      rong: '90px',
      hienThi: (row) => row.si_so.toLocaleString('vi-VN'),
    },
    { khoa: 'trang_thai', nhan: 'Trạng thái', rong: '155px' },
    ...(this.laAdmin() ? [{ khoa: 'thao_tac', nhan: 'Thao tác', rong: '100px' }] : []),
  ]);

  readonly coLoc = computed(() => {
    const filter = this.boLoc();
    return Boolean(filter.tuKhoa || filter.khoa || filter.nganh || filter.trangThai);
  });
  readonly tongSiSo = computed(() => this.rows().reduce((total, row) => total + row.si_so, 0));

  constructor() {
    this.tai();
  }

  tai(): void {
    this.dangTai.set(true);
    this.loi.set(null);
    const sort = this.sapXepHienTai();
    const filter = this.boLoc();
    const thamSo: ThamSoDanhSach & { khoa_hoc?: string; nganh?: string; trang_thai?: boolean } = {
      page: this.trang,
      per_page: this.coTrang,
      q: filter.tuKhoa || undefined,
      sort_by: sort.sort_by,
      sort_dir: sort.sort_dir,
      khoa_hoc: filter.khoa || undefined,
      nganh: filter.nganh || undefined,
      trang_thai:
        filter.trangThai === '' ? undefined : filter.trangThai === 'true',
    };

    this.service.layDanhSach(thamSo).subscribe({
      next: (response) => {
        this.rows.set(response.data);
        this.meta.set(response.meta);
        this.dangTai.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loi.set(
          error.error?.message ??
            'Không tải được danh sách lớp hành chính. Kiểm tra kết nối rồi thử lại.',
        );
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
    this.locKhoa.set((event.target as HTMLInputElement).value);
  }

  doiLocNganh(event: Event): void {
    this.locNganh.set((event.target as HTMLInputElement).value);
  }

  doiTrangThai(event: Event): void {
    this.locTrangThai.set((event.target as HTMLSelectElement).value);
  }

  apDungLoc(): void {
    this.boLoc.update((filter) => ({
      ...filter,
      khoa: this.locKhoa().trim(),
      nganh: this.locNganh().trim(),
      trangThai: this.locTrangThai(),
    }));
    this.trang = 1;
    this.tai();
  }

  xoaLoc(): void {
    this.tuKhoa.set('');
    this.locKhoa.set('');
    this.locNganh.set('');
    this.locTrangThai.set('');
    this.boLoc.set({ tuKhoa: '', khoa: '', nganh: '', trangThai: '' });
    this.trang = 1;
    this.tai();
  }

  hoiXoa(lop: LopHanhChinh): void {
    this.lyDoChanXoa.set('');
    this.lopChoXoa.set(lop);
  }

  xacNhanXoa(): void {
    const lop = this.lopChoXoa();
    if (!lop || this.dangXoa()) return;

    this.dangXoa.set(true);
    this.service.xoa(lop.id).subscribe({
      next: () => {
        this.dangXoa.set(false);
        this.lopChoXoa.set(null);
        if (this.rows().length === 1 && this.trang > 1) this.trang -= 1;
        this.tai();
      },
      error: (error: HttpErrorResponse) => {
        this.dangXoa.set(false);
        this.lyDoChanXoa.set(
          error.error?.message ?? 'Không xóa được lớp. Kiểm tra kết nối rồi thử lại.',
        );
      },
    });
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
}
