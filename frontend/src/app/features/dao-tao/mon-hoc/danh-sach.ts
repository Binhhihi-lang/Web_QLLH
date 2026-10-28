import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { MonHoc } from '@core/models/dao-tao.model';
import { KetQuaHangLoat, PageMeta } from '@core/mock/mock-response';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { CotBang, DataTable, OTuyChinh, SapXep } from '@shared/ui/data-table';
import { PageHeader } from '@shared/ui/page-header';
import { Pagination } from '@shared/ui/pagination';
import { SearchInput } from '@shared/ui/search-input';
import { StatusBadge } from '@shared/ui/status-badge';
import { MonHocService, ThamSoDanhSachMonHoc } from './mon-hoc.service';

type HanhDongHangLoat = { loai: 'trang-thai'; trangThai: boolean } | { loai: 'xoa' };

@Component({
  selector: 'app-mon-hoc-danh-sach',
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
      title="Môn học"
      description="Tra cứu danh mục môn học và trạng thái triển khai trong chương trình đào tạo."
    >
      @if (laAdmin()) {
        <app-button variant="primary" routerLink="/mon-hoc/them">
          <span class="material-icons" aria-hidden="true">add</span>
          Thêm môn học
        </app-button>
      }
    </app-page-header>

    <section class="bang-dieu-khien" aria-label="Tìm kiếm và lọc môn học">
      <div class="dau-bang">
        <div>
          <h2>Danh mục môn học</h2>
          @if (meta(); as m) {
            <p>{{ m.total }} môn học trong danh mục</p>
          } @else {
            <p>Tìm theo mã hoặc tên môn, lọc theo trạng thái và số tín chỉ.</p>
          }
        </div>
        <div class="chi-bao">
          <span class="material-icons" aria-hidden="true">menu_book</span>
          <span>{{ meta()?.total ?? '—' }} môn</span>
        </div>
      </div>

      <div class="thanh-loc">
        <app-search-input
          placeholder="Tìm theo mã hoặc tên môn học…"
          [value]="tuKhoa()"
          (valueChange)="doiTuKhoa($event)"
        />
        <label class="loc">
          <span>Trạng thái</span>
          <select
            id="loc-trang-thai-mon"
            [value]="locTrangThai()"
            (change)="doiLocTrangThai($event)"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã khóa</option>
          </select>
        </label>
        <label class="loc">
          <span>Số tín chỉ</span>
          <select id="loc-so-tin-chi-mon" [value]="locSoTinChi()" (change)="doiLocSoTinChi($event)">
            <option value="">Tất cả số tín chỉ</option>
            @for (soTinChi of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; track soTinChi) {
              <option [value]="soTinChi">{{ soTinChi }} tín chỉ</option>
            }
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

    @if (ketQuaHangLoat(); as ketQua) {
      <section class="ket-qua" aria-label="Kết quả thao tác hàng loạt">
        <div class="dau-ket-qua">
          <app-alert [muc]="ketQua.that_bai > 0 ? 'warning' : 'success'">
            Đã xử lý {{ ketQua.thanh_cong }}/{{ ketQua.chi_tiet.length }} môn học.
            @if (ketQua.that_bai > 0) {
              {{ ketQua.that_bai }} môn chưa thực hiện được; các môn lỗi vẫn được giữ lựa chọn.
            }
          </app-alert>
          <button
            class="dong-ket-qua"
            type="button"
            aria-label="Đóng kết quả thao tác"
            (click)="ketQuaHangLoat.set(null)"
          >
            <span class="material-icons" aria-hidden="true">close</span>
          </button>
        </div>
        @if (dongLoi().length > 0) {
          <ul class="ds-loi">
            @for (dong of dongLoi(); track dong.id) {
              <li>
                <strong>#{{ dong.id }}</strong> {{ dong.message ?? 'Không xử lý được.' }}
              </li>
            }
          </ul>
        }
      </section>
    }

    @if (laAdmin() && soDongDaChon() > 0) {
      <section class="thanh-hang-loat" aria-label="Thao tác trên môn học đã chọn">
        <span>Đã chọn {{ soDongDaChon() }} môn học</span>
        <div class="nut-hang-loat">
          <app-button
            variant="secondary"
            size="sm"
            [loading]="dangHangLoat()"
            (click)="hoiDoiTrangThaiHangLoat(true)"
          >
            Kích hoạt
          </app-button>
          <app-button
            variant="secondary"
            size="sm"
            [loading]="dangHangLoat()"
            (click)="hoiDoiTrangThaiHangLoat(false)"
          >
            Khóa
          </app-button>
          <app-button
            variant="danger"
            size="sm"
            [loading]="dangHangLoat()"
            (click)="hoiXoaHangLoat()"
          >
            Xóa
          </app-button>
        </div>
      </section>
    }

    <app-data-table
      [cot]="cot()"
      [rows]="rows()"
      [dangTai]="dangTai()"
      [loi]="loi()"
      [chonNhieu]="laAdmin()"
      [daChon]="daChon()"
      [sortBy]="sapXepHienTai().sort_by"
      [sortDir]="sapXepHienTai().sort_dir"
      [bamDong]="true"
      tieuDeRong="Chưa có môn học phù hợp"
      [moTaRong]="
        coLoc() ? 'Thử thay đổi từ khóa hoặc bộ lọc.' : 'Danh mục môn học hiện chưa có dữ liệu.'
      "
      (daChonChange)="daChon.set($event)"
      (sapXep)="doiSapXep($event)"
      (dongDuocBam)="moChiTiet($event)"
      (thuLai)="tai()"
    >
      <ng-template appOTuyChinh="so_tin_chi" let-row>
        <span class="tin-chi">{{ row.so_tin_chi }} tín chỉ</span>
      </ng-template>
      <ng-template appOTuyChinh="mo_ta" let-row>
        <span class="mo-ta" [title]="row.mo_ta ?? ''">{{ row.mo_ta || 'Chưa có mô tả' }}</span>
      </ng-template>
      <ng-template appOTuyChinh="trang_thai" let-row>
        <app-status-badge
          [value]="row.trang_thai ? 'ACTIVE' : 'INACTIVE'"
          [label]="row.trang_thai ? 'Đang hoạt động' : 'Đã khóa'"
        />
      </ng-template>
      <ng-template appOTuyChinh="thao_tac" let-row>
        @if (laAdmin()) {
          <div class="nhom-thao-tac">
            <a
              class="nut-sua"
              [routerLink]="['/mon-hoc', row.id, 'sua']"
              [attr.aria-label]="'Sửa môn học ' + row.ma_mon"
            >
              <span class="material-icons" aria-hidden="true">edit</span>
              Sửa
            </a>
            <button
              type="button"
              class="nut-sua nut-xoa"
              [disabled]="dangXoa()"
              [attr.aria-label]="'Xóa môn học ' + row.ma_mon"
              (click)="hoiXoa(row)"
            >
              <span class="material-icons" aria-hidden="true">delete</span>
              Xóa
            </button>
          </div>
        } @else {
          <span class="chi-xem">Chỉ xem</span>
        }
      </ng-template>
      @if (laAdmin()) {
        <a emptyAction class="nut-rong" routerLink="/mon-hoc/them">Thêm môn học</a>
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

    @if (monChoXoa(); as mon) {
      <app-confirm-dialog
        tieuDe="Xóa môn học"
        [moTa]="'Môn ' + mon.ten_mon + ' (' + mon.ma_mon + ') sẽ được chuyển vào thùng rác.'"
        [dangXuLy]="dangXoa()"
        [lyDoChan]="lyDoChanXoa()"
        (dongY)="xacNhanXoa()"
        (huy)="monChoXoa.set(null)"
      />
    }

    @if (hanhDongChoXacNhan(); as hanhDong) {
      <app-confirm-dialog
        [tieuDe]="hanhDong.loai === 'xoa' ? 'Xóa nhiều môn học' : 'Xác nhận đổi trạng thái'"
        [moTa]="moTaHanhDongHangLoat(hanhDong)"
        [nhanDongY]="
          hanhDong.loai === 'xoa' ? 'Xóa tất cả' : hanhDong.trangThai ? 'Kích hoạt' : 'Khóa'
        "
        [nguyHiem]="hanhDong.loai === 'xoa' || !hanhDong.trangThai"
        [dangXuLy]="dangHangLoat()"
        (dongY)="xacNhanHanhDongHangLoat()"
        (huy)="hanhDongChoXacNhan.set(null)"
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
      flex: 1 1 260px;
      min-width: 190px;
      max-width: 400px;
    }

    .loc {
      display: flex;
      flex: 0 1 190px;
      flex-direction: column;
      gap: 5px;
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
      font-weight: 650;
    }

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

    .loc select:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    .cum-nut,
    .nut-hang-loat {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .cum-nut {
      margin-left: auto;
    }

    .nut-ic {
      margin-right: 3px;
      font-size: 17px;
      vertical-align: middle;
    }

    .xoa-loc,
    .dong-ket-qua {
      min-height: 36px;
      border: 0;
      border-radius: var(--radius);
      background: transparent;
      color: var(--color-ink-muted);
      font: 600 var(--text-small) var(--font-body);
      cursor: pointer;
    }

    .xoa-loc {
      padding: 7px 9px;
    }

    .xoa-loc:hover {
      background: var(--color-danger-soft);
      color: var(--color-danger);
    }

    .ket-qua {
      margin-bottom: 14px;
      padding: 12px 14px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
    }

    .dau-ket-qua {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .dau-ket-qua app-alert {
      flex: 1;
    }

    .dong-ket-qua {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      padding: 0;
    }

    .dong-ket-qua:hover {
      background: var(--color-surface-alt);
      color: var(--color-ink);
    }

    .ds-loi {
      display: grid;
      gap: 6px;
      margin: 10px 0 0;
      padding-left: 22px;
      color: var(--color-danger);
      font-size: var(--text-small);
    }

    .thanh-hang-loat {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 12px;
      padding: 10px 14px;
      border: 1px solid var(--color-primary-soft);
      border-radius: var(--radius);
      background: var(--color-primary-soft);
      color: var(--color-on-primary-soft);
      font-size: var(--text-small);
      font-weight: 650;
    }

    .tin-chi {
      display: inline-flex;
      padding: 4px 9px;
      border-radius: 999px;
      background: var(--color-surface-alt);
      color: var(--color-ink);
      font-size: var(--text-caption);
      font-weight: 650;
      white-space: nowrap;
    }

    .mo-ta {
      display: block;
      max-width: 280px;
      overflow: hidden;
      color: var(--color-ink-muted);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .nhom-thao-tac {
      display: flex;
      align-items: center;
      gap: 5px;
      flex-wrap: wrap;
      min-width: 310px;
    }

    .nut-sua {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      min-height: 32px;
      padding: 4px 7px;
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-primary);
      font: 600 var(--text-caption) var(--font-body);
      text-decoration: none;
      cursor: pointer;
    }

    .nut-sua:hover:not(:disabled) {
      background: var(--color-primary-soft);
    }

    .nut-sua:focus-visible,
    .nut-rong:focus-visible,
    .xoa-loc:focus-visible,
    .dong-ket-qua:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .nut-sua .material-icons {
      font-size: 17px;
    }

    .nut-sua:disabled {
      cursor: wait;
      opacity: 0.6;
    }

    .nut-xoa {
      color: var(--color-danger);
    }

    .nut-xoa:hover:not(:disabled) {
      background: var(--color-danger-soft);
    }

    .chi-xem {
      color: var(--color-ink-subtle);
      font-size: var(--text-caption);
    }

    .nut-rong {
      display: inline-flex;
      margin-top: 12px;
      padding: 8px 12px;
      border-radius: var(--radius);
      background: var(--color-primary);
      color: var(--color-on-primary);
      font-size: var(--text-small);
      font-weight: 600;
      text-decoration: none;
    }

    @media (max-width: 700px) {
      .bang-dieu-khien {
        padding: 14px;
      }

      .dau-bang {
        align-items: flex-start;
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

      .thanh-hang-loat {
        align-items: flex-start;
      }

      .nut-hang-loat {
        width: 100%;
      }
    }
  `,
})
export class MonHocDanhSach {
  private readonly service = inject(MonHocService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly laAdmin = computed(() => this.auth.nguoiDung()?.vai_tro === 'ADMIN');
  readonly dangTai = signal(true);
  readonly loi = signal<string | null>(null);
  readonly rows = signal<MonHoc[]>([]);
  readonly meta = signal<PageMeta | null>(null);
  readonly tuKhoa = signal('');
  readonly locTrangThai = signal('');
  readonly locSoTinChi = signal('');
  readonly daChon = signal<Array<string | number>>([]);
  readonly ketQuaHangLoat = signal<KetQuaHangLoat | null>(null);
  readonly monChoXoa = signal<MonHoc | null>(null);
  readonly hanhDongChoXacNhan = signal<HanhDongHangLoat | null>(null);
  readonly dangXoa = signal(false);
  readonly dangHangLoat = signal(false);
  readonly lyDoChanXoa = signal('');
  readonly sapXepHienTai = signal<SapXep>({ sort_by: 'ma_mon', sort_dir: 'asc' });

  private readonly boLoc = signal({ tuKhoa: '', trangThai: '', soTinChi: '' });
  private trang = 1;
  private coTrang: 10 | 25 | 50 | 100 = 10;

  readonly cot = computed<CotBang<MonHoc>[]>(() => [
    { khoa: 'ma_mon', nhan: 'Mã môn', sap_xep: true, rong: '125px' },
    { khoa: 'ten_mon', nhan: 'Tên môn học', sap_xep: true, rong: '250px' },
    {
      khoa: 'so_tin_chi',
      nhan: 'Tín chỉ',
      sap_xep: true,
      can_phai: true,
      rong: '100px',
    },
    { khoa: 'mo_ta', nhan: 'Mô tả', rong: '240px' },
    { khoa: 'trang_thai', nhan: 'Trạng thái', rong: '150px' },
    ...(this.laAdmin() ? [{ khoa: 'thao_tac', nhan: 'Thao tác', rong: '180px' }] : []),
  ]);
  readonly soDongDaChon = computed(() => this.daChon().length);
  readonly dongLoi = computed(() =>
    (this.ketQuaHangLoat()?.chi_tiet ?? []).filter((row) => row.ket_qua === 'THAT_BAI'),
  );
  readonly coLoc = computed(() => {
    const filter = this.boLoc();
    return Boolean(filter.tuKhoa || filter.trangThai || filter.soTinChi);
  });

  constructor() {
    this.tai();
  }

  tai(): void {
    this.dangTai.set(true);
    this.loi.set(null);
    const sort = this.sapXepHienTai();
    const filter = this.boLoc();
    const thamSo: ThamSoDanhSachMonHoc = {
      page: this.trang,
      per_page: this.coTrang,
      q: filter.tuKhoa || undefined,
      sort_by: sort.sort_by,
      sort_dir: sort.sort_dir,
      trang_thai: filter.trangThai === '' ? undefined : filter.trangThai === 'true',
      so_tin_chi: filter.soTinChi === '' ? undefined : Number(filter.soTinChi),
    };

    this.service.layDanhSach(thamSo).subscribe({
      next: (response) => {
        this.rows.set(response.data);
        this.meta.set(response.meta);
        this.dangTai.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loi.set(
          error.error?.message ?? 'Không tải được danh sách môn học. Kiểm tra kết nối rồi thử lại.',
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

  doiLocTrangThai(event: Event): void {
    this.locTrangThai.set((event.target as HTMLSelectElement).value);
  }

  doiLocSoTinChi(event: Event): void {
    this.locSoTinChi.set((event.target as HTMLSelectElement).value);
  }

  apDungLoc(): void {
    this.boLoc.update((filter) => ({
      ...filter,
      trangThai: this.locTrangThai(),
      soTinChi: this.locSoTinChi(),
    }));
    this.trang = 1;
    this.tai();
  }

  xoaLoc(): void {
    this.tuKhoa.set('');
    this.locTrangThai.set('');
    this.locSoTinChi.set('');
    this.boLoc.set({ tuKhoa: '', trangThai: '', soTinChi: '' });
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

  sua(monHoc: MonHoc): void {
    void this.router.navigate(['/mon-hoc', monHoc.id, 'sua']);
  }

  moChiTiet(monHoc: MonHoc): void {
    void this.router.navigate(['/mon-hoc', monHoc.id]);
  }

  hoiXoa(monHoc: MonHoc): void {
    this.lyDoChanXoa.set('');
    this.monChoXoa.set(monHoc);
  }

  xacNhanXoa(): void {
    const monHoc = this.monChoXoa();
    if (!monHoc || this.dangXoa()) return;

    this.dangXoa.set(true);
    this.service.xoa(monHoc.id).subscribe({
      next: () => {
        this.dangXoa.set(false);
        this.monChoXoa.set(null);
        this.daChon.update((ids) => ids.filter((id) => Number(id) !== monHoc.id));
        if (this.rows().length === 1 && this.trang > 1) this.trang -= 1;
        this.tai();
      },
      error: (error: HttpErrorResponse) => {
        this.dangXoa.set(false);
        this.lyDoChanXoa.set(
          error.error?.message ?? 'Không xóa được môn học. Kiểm tra kết nối rồi thử lại.',
        );
      },
    });
  }

  hoiDoiTrangThaiHangLoat(trangThai: boolean): void {
    if (this.soDongDaChon() > 0 && !this.dangHangLoat()) {
      this.hanhDongChoXacNhan.set({ loai: 'trang-thai', trangThai });
    }
  }

  hoiXoaHangLoat(): void {
    if (this.soDongDaChon() > 0 && !this.dangHangLoat()) {
      this.hanhDongChoXacNhan.set({ loai: 'xoa' });
    }
  }

  moTaHanhDongHangLoat(hanhDong: HanhDongHangLoat): string {
    if (hanhDong.loai === 'xoa') {
      return `${this.soDongDaChon()} môn học sẽ được chuyển vào thùng rác. Môn còn lớp học phần thuộc học kỳ chưa đóng sẽ bị từ chối riêng.`;
    }
    const trangThai = hanhDong.trangThai ? 'kích hoạt' : 'khóa';
    return `${this.soDongDaChon()} môn học đã chọn sẽ được ${trangThai}.`;
  }

  xacNhanHanhDongHangLoat(): void {
    const action = this.hanhDongChoXacNhan();
    const ids = this.idsDaChon();
    if (!action || ids.length === 0 || this.dangHangLoat()) return;

    this.dangHangLoat.set(true);
    this.loi.set(null);
    const request =
      action.loai === 'xoa'
        ? this.service.xoaHangLoat(ids)
        : this.service.doiTrangThaiHangLoat(ids, action.trangThai);
    request.subscribe({
      next: (result) => {
        this.hanhDongChoXacNhan.set(null);
        this.xongHangLoat(result);
      },
      error: (error: HttpErrorResponse) => {
        this.dangHangLoat.set(false);
        this.loi.set(
          error.error?.message ?? 'Không thể hoàn thành thao tác hàng loạt. Vui lòng thử lại.',
        );
      },
    });
  }

  private idsDaChon(): number[] {
    return this.daChon()
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0);
  }

  private xongHangLoat(result: KetQuaHangLoat): void {
    this.dangHangLoat.set(false);
    this.ketQuaHangLoat.set(result);
    this.daChon.set(
      result.chi_tiet.filter((row) => row.ket_qua === 'THAT_BAI').map((row) => row.id),
    );
    this.tai();
  }
}
