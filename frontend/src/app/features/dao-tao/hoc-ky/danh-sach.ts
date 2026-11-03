import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { HocKy, TrangThaiHocKy } from '@core/models/dao-tao.model';
import { PageMeta } from '@core/mock/mock-response';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { CotBang, DataTable, OTuyChinh, SapXep } from '@shared/ui/data-table';
import { NgayVnPipe } from '@shared/pipes/ngay-vn.pipe';
import { PageHeader } from '@shared/ui/page-header';
import { Pagination } from '@shared/ui/pagination';
import { SearchInput } from '@shared/ui/search-input';
import { StatusBadge } from '@shared/ui/status-badge';
import { HocKyService } from './hoc-ky.service';

type HanhDong = { loai: 'trang-thai'; hocKy: HocKy; trangThai: TrangThaiHocKy } | {
  loai: 'xoa';
  hocKy: HocKy;
};

@Component({
  selector: 'app-hoc-ky-danh-sach',
  standalone: true,
  imports: [
    AppAlert,
    AppButton,
    ConfirmDialog,
    DataTable,
    NgayVnPipe,
    OTuyChinh,
    PageHeader,
    Pagination,
    RouterLink,
    SearchInput,
    StatusBadge,
  ],
  template: `
    <app-page-header
      title="Học kỳ"
      description="Theo dõi thời gian đào tạo, đợt đăng ký và vòng đời từng học kỳ."
    >
      @if (laAdmin()) {
        <app-button routerLink="/hoc-ky/them">
          <span class="material-icons" aria-hidden="true">add</span>
          Thêm học kỳ
        </app-button>
      }
    </app-page-header>

    <section class="bang-dieu-khien" aria-label="Tìm kiếm và lọc học kỳ">
      <div class="dau-bang">
        <div>
          <h2>Danh sách học kỳ</h2>
          @if (meta(); as m) {
            <p>{{ m.total }} học kỳ trong danh sách</p>
          } @else {
            <p>Tìm theo mã hoặc tên, lọc theo năm học, kỳ thứ và trạng thái.</p>
          }
        </div>
        <div class="chi-bao">
          <span class="material-icons" aria-hidden="true">date_range</span>
          <span>{{ meta()?.total ?? '—' }} kỳ</span>
        </div>
      </div>

      <div class="thanh-loc">
        <app-search-input
          placeholder="Tìm mã hoặc tên học kỳ…"
          [value]="tuKhoa()"
          (valueChange)="doiTuKhoa($event)"
        />
        <label class="loc">
          <span>Năm học</span>
          <input
            type="text"
            placeholder="Ví dụ: 2026-2027"
            [value]="locNamHoc()"
            (input)="doiNamHoc($event)"
          />
        </label>
        <label class="loc loc-ngan">
          <span>Kỳ thứ</span>
          <select [value]="locKyThu()" (change)="doiKyThu($event)">
            <option value="">Tất cả</option>
            <option value="1">Kỳ 1</option>
            <option value="2">Kỳ 2</option>
            <option value="3">Kỳ hè</option>
          </select>
        </label>
        <label class="loc">
          <span>Trạng thái</span>
          <select [value]="locTrangThai()" (change)="doiTrangThai($event)">
            <option value="">Tất cả trạng thái</option>
            <option value="UPCOMING">Sắp diễn ra</option>
            <option value="ONGOING">Đang diễn ra</option>
            <option value="CLOSED">Đã đóng</option>
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

    @if (loiThaoTac()) {
      <app-alert class="loi-thao-tac" muc="danger" title="Thao tác chưa hoàn thành">
        {{ loiThaoTac() }}
      </app-alert>
    }

    <app-data-table
      [cot]="cot()"
      [rows]="rows()"
      [bamDong]="true"
      [dangTai]="dangTai()"
      [loi]="loi()"
      [sortBy]="sapXepHienTai().sort_by"
      [sortDir]="sapXepHienTai().sort_dir"
      tieuDeRong="Chưa có học kỳ phù hợp"
      [moTaRong]="coLoc() ? 'Thử thay đổi từ khóa hoặc bộ lọc.' : 'Danh sách học kỳ hiện chưa có dữ liệu.'"
      (sapXep)="doiSapXep($event)"
      (dongDuocBam)="moChiTiet($event)"
      (thuLai)="tai()"
    >
      <ng-template appOTuyChinh="ky_thu" let-row>
        <span>{{ nhanKyThu(row.ky_thu) }}</span>
      </ng-template>
      <ng-template appOTuyChinh="khoang_ngay" let-row>
        <span class="khoang-ngay">
          {{ row.ngay_bat_dau | ngayVn }}<span> đến </span>{{ row.ngay_ket_thuc | ngayVn }}
        </span>
      </ng-template>
      <ng-template appOTuyChinh="dot_dang_ky" let-row>
        <span class="dot-dang-ky">
          {{ hienThoiGian(row.mo_dang_ky_luc) }}<span> đến </span>{{ hienThoiGian(row.dong_dang_ky_luc) }}
        </span>
      </ng-template>
      <ng-template appOTuyChinh="trang_thai" let-row>
        <app-status-badge [value]="row.trang_thai" [label]="nhanTrangThai(row.trang_thai)" />
      </ng-template>
      <ng-template appOTuyChinh="thao_tac" let-row>
        <div class="nhom-thao-tac">
          @if (row.trang_thai !== 'CLOSED') {
            <a class="nut-sua" [routerLink]="['/hoc-ky', row.id, 'sua']">
              <span class="material-icons" aria-hidden="true">edit</span>
              Sửa
            </a>
          }
          @if (row.trang_thai === 'UPCOMING') {
            <button
              type="button"
              class="nut-trang-thai"
              [disabled]="dangXuLy()"
              (click)="hoiChuyenTrangThai(row, 'ONGOING')"
            >
              <span class="material-icons" aria-hidden="true">play_arrow</span>
              Bắt đầu kỳ
            </button>
            <button
              type="button"
              class="nut-xoa"
              [disabled]="dangXuLy()"
              (click)="hoiXoa(row)"
            >
              <span class="material-icons" aria-hidden="true">delete</span>
              Xóa
            </button>
          } @else if (row.trang_thai === 'ONGOING') {
            <button
              type="button"
              class="nut-trang-thai nut-dong-ky"
              [disabled]="dangXuLy()"
              (click)="hoiChuyenTrangThai(row, 'CLOSED')"
            >
              <span class="material-icons" aria-hidden="true">lock</span>
              Đóng kỳ
            </button>
          }
        </div>
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

    @if (hanhDong(); as action) {
      <app-confirm-dialog
        [tieuDe]="tieuDeXacNhan(action)"
        [moTa]="moTaXacNhan(action)"
        [nhanDongY]="action.loai === 'xoa' ? 'Xóa học kỳ' : action.trangThai === 'ONGOING' ? 'Bắt đầu kỳ' : 'Đóng kỳ'"
        [nguyHiem]="action.loai === 'xoa' || action.trangThai === 'CLOSED'"
        [dangXuLy]="dangXuLy()"
        [lyDoChan]="loiXacNhan()"
        (dongY)="xacNhan()"
        (huy)="dongXacNhan()"
      />
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .bang-dieu-khien {
      margin-bottom: 14px;
      padding: 18px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
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
      color: var(--color-ink);
      font-size: var(--text-h3);
      font-weight: 650;
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
      flex: 1 1 230px;
      min-width: 190px;
      max-width: 360px;
    }

    .loc {
      display: flex;
      flex: 1 1 155px;
      min-width: 130px;
      flex-direction: column;
      gap: 5px;
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
      font-weight: 650;
    }

    .loc-ngan {
      flex: 0 1 120px;
      min-width: 100px;
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
      gap: 8px;
      flex-wrap: wrap;
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

    .loi-thao-tac {
      display: block;
      margin-bottom: 12px;
    }

    .khoang-ngay,
    .dot-dang-ky {
      color: var(--color-ink);
      font-size: var(--text-caption);
      white-space: nowrap;
    }

    .khoang-ngay span,
    .dot-dang-ky span {
      color: var(--color-ink-muted);
    }

    .nhom-thao-tac {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
      min-width: 145px;
    }

    .nut-sua,
    .nut-trang-thai,
    .nut-xoa {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      min-height: 32px;
      padding: 4px 7px;
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      font: 600 var(--text-caption) var(--font-body);
      text-decoration: none;
      cursor: pointer;
    }

    .nut-sua,
    .nut-trang-thai {
      color: var(--color-primary);
    }

    .nut-xoa {
      color: var(--color-danger);
    }

    .nut-sua:hover,
    .nut-trang-thai:hover {
      background: var(--color-primary-soft);
    }

    .nut-xoa:hover {
      background: var(--color-danger-soft);
    }

    .nut-sua:focus-visible,
    .nut-trang-thai:focus-visible,
    .nut-xoa:focus-visible,
    .xoa-loc:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .nut-sua .material-icons,
    .nut-trang-thai .material-icons,
    .nut-xoa .material-icons {
      font-size: 17px;
    }

    .nut-sua:disabled,
    .nut-trang-thai:disabled,
    .nut-xoa:disabled {
      cursor: wait;
      opacity: 0.6;
    }

    @media (max-width: 760px) {
      .bang-dieu-khien {
        padding: 14px;
      }

      app-search-input,
      .loc {
        flex: 1 1 100%;
        max-width: none;
      }

      .cum-nut {
        width: 100%;
        margin-left: 0;
      }
    }
  `,
})
export class HocKyDanhSach {
  private readonly service = inject(HocKyService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly laAdmin = computed(() => this.auth.nguoiDung()?.vai_tro === 'ADMIN');
  readonly dangTai = signal(true);
  readonly dangXuLy = signal(false);
  readonly loi = signal<string | null>(null);
  readonly loiThaoTac = signal('');
  readonly loiXacNhan = signal('');
  readonly rows = signal<HocKy[]>([]);
  readonly meta = signal<PageMeta | null>(null);
  readonly tuKhoa = signal('');
  readonly locNamHoc = signal('');
  readonly locKyThu = signal('');
  readonly locTrangThai = signal('');
  readonly hanhDong = signal<HanhDong | null>(null);
  readonly sapXepHienTai = signal<SapXep>({ sort_by: 'ma_hoc_ky', sort_dir: 'asc' });

  private readonly boLoc = signal({ tuKhoa: '', namHoc: '', kyThu: '', trangThai: '' });
  private trang = 1;
  private coTrang: 10 | 25 | 50 | 100 = 10;

  readonly cot = computed<CotBang<HocKy>[]>(() => [
    { khoa: 'ma_hoc_ky', nhan: 'Mã học kỳ', sap_xep: true, rong: '125px' },
    { khoa: 'ten_hoc_ky', nhan: 'Tên học kỳ', sap_xep: true, rong: '250px' },
    { khoa: 'nam_hoc', nhan: 'Năm học', sap_xep: true, rong: '115px' },
    { khoa: 'ky_thu', nhan: 'Kỳ thứ', rong: '90px' },
    { khoa: 'khoang_ngay', nhan: 'Thời gian học', rong: '185px' },
    { khoa: 'dot_dang_ky', nhan: 'Đợt đăng ký', rong: '245px' },
    { khoa: 'trang_thai', nhan: 'Trạng thái', rong: '130px' },
    ...(this.laAdmin() ? [{ khoa: 'thao_tac', nhan: 'Thao tác', rong: '255px' }] : []),
  ]);
  readonly coLoc = computed(() => {
    const filter = this.boLoc();
    return Boolean(filter.tuKhoa || filter.namHoc || filter.kyThu || filter.trangThai);
  });

  constructor() {
    this.tai();
  }

  tai(): void {
    this.dangTai.set(true);
    this.loi.set(null);
    this.loiThaoTac.set('');
    const sort = this.sapXepHienTai();
    const filter = this.boLoc();
    this.service
      .layDanhSach({
        page: this.trang,
        per_page: this.coTrang,
        q: filter.tuKhoa || undefined,
        nam_hoc: filter.namHoc || undefined,
        ky_thu: filter.kyThu ? Number(filter.kyThu) : undefined,
        trang_thai: filter.trangThai
          ? (filter.trangThai as TrangThaiHocKy)
          : undefined,
        sort_by: sort.sort_by,
        sort_dir: sort.sort_dir,
      })
      .subscribe({
        next: (response) => {
          this.rows.set(response.data);
          this.meta.set(response.meta);
          this.dangTai.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.loi.set(
            error.error?.message ?? 'Không tải được danh sách học kỳ. Kiểm tra kết nối rồi thử lại.',
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

  doiNamHoc(event: Event): void {
    this.locNamHoc.set((event.target as HTMLInputElement).value);
  }

  doiKyThu(event: Event): void {
    this.locKyThu.set((event.target as HTMLSelectElement).value);
  }

  doiTrangThai(event: Event): void {
    this.locTrangThai.set((event.target as HTMLSelectElement).value);
  }

  apDungLoc(): void {
    this.boLoc.update((filter) => ({
      ...filter,
      namHoc: this.locNamHoc().trim(),
      kyThu: this.locKyThu(),
      trangThai: this.locTrangThai(),
    }));
    this.trang = 1;
    this.tai();
  }

  xoaLoc(): void {
    this.tuKhoa.set('');
    this.locNamHoc.set('');
    this.locKyThu.set('');
    this.locTrangThai.set('');
    this.boLoc.set({ tuKhoa: '', namHoc: '', kyThu: '', trangThai: '' });
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

  moChiTiet(hocKy: HocKy): void {
    void this.router.navigate(['/hoc-ky', hocKy.id]);
  }

  doiCoTrang(perPage: number): void {
    if (![10, 25, 50, 100].includes(perPage)) return;
    this.coTrang = perPage as 10 | 25 | 50 | 100;
    this.trang = 1;
    this.tai();
  }

  nhanKyThu(kyThu: number): string {
    return kyThu === 3 ? 'Học kỳ hè' : `Học kỳ ${kyThu}`;
  }

  nhanTrangThai(trangThai: TrangThaiHocKy): string {
    return {
      UPCOMING: 'Sắp diễn ra',
      ONGOING: 'Đang diễn ra',
      CLOSED: 'Đã đóng',
    }[trangThai];
  }

  hienThoiGian(value: string): string {
    const [date, time] = value.split(' ');
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year} ${time?.slice(0, 5) ?? ''}`;
  }

  hoiChuyenTrangThai(hocKy: HocKy, trangThai: TrangThaiHocKy): void {
    this.loiXacNhan.set('');
    this.hanhDong.set({ loai: 'trang-thai', hocKy, trangThai });
  }

  hoiXoa(hocKy: HocKy): void {
    this.loiXacNhan.set('');
    this.hanhDong.set({ loai: 'xoa', hocKy });
  }

  tieuDeXacNhan(action: HanhDong): string {
    if (action.loai === 'xoa') return 'Xóa học kỳ';
    return action.trangThai === 'ONGOING' ? 'Bắt đầu học kỳ' : 'Đóng học kỳ';
  }

  moTaXacNhan(action: HanhDong): string {
    if (action.loai === 'xoa') {
      return `Học kỳ ${action.hocKy.ten_hoc_ky} sẽ được chuyển vào thùng rác. Chỉ xóa được kỳ sắp diễn ra chưa có lớp học phần.`;
    }
    return action.trangThai === 'ONGOING'
      ? `Bắt đầu học kỳ ${action.hocKy.ten_hoc_ky}? Tại một thời điểm chỉ có một học kỳ đang diễn ra.`
      : `Đóng học kỳ ${action.hocKy.ten_hoc_ky}? Học kỳ đã đóng sẽ chỉ đọc và không thể mở lại.`;
  }

  dongXacNhan(): void {
    if (this.dangXuLy()) return;
    this.hanhDong.set(null);
    this.loiXacNhan.set('');
  }

  xacNhan(): void {
    const action = this.hanhDong();
    if (!action || this.dangXuLy()) return;
    this.dangXuLy.set(true);
    this.loiXacNhan.set('');

    const xuLyXong = () => {
      this.dangXuLy.set(false);
      this.hanhDong.set(null);
      if (action.loai === 'xoa' && this.rows().length === 1 && this.trang > 1) {
        this.trang -= 1;
      }
      this.tai();
    };
    const xuLyLoi = (error: HttpErrorResponse) => {
      this.dangXuLy.set(false);
      const message =
        error.error?.message ?? 'Không thể hoàn thành thao tác. Vui lòng kiểm tra và thử lại.';
      this.loiXacNhan.set(message);
      this.loiThaoTac.set(message);
    };

    if (action.loai === 'xoa') {
      this.service.xoa(action.hocKy.id).subscribe({ next: xuLyXong, error: xuLyLoi });
    } else {
      this.service
        .doiTrangThai(action.hocKy.id, action.trangThai)
        .subscribe({ next: xuLyXong, error: xuLyLoi });
    }
  }
}
