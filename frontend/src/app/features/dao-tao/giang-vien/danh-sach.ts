import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GiangVien, ThamSoDanhSach } from '@core/models/dao-tao.model';
import { GiangVienService } from '@core/services/giang-vien.service';
import { KetQuaHangLoat, PageMeta } from '@core/mock/mock-response';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { CotBang, DataTable, OTuyChinh, SapXep } from '@shared/ui/data-table';
import { PageHeader } from '@shared/ui/page-header';
import { Pagination } from '@shared/ui/pagination';
import { SearchInput } from '@shared/ui/search-input';
import { StatusBadge } from '@shared/ui/status-badge';

@Component({
  selector: 'app-giang-vien-danh-sach',
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
      title="Giảng viên"
      description="Tìm kiếm và quản lý trạng thái tài khoản giảng viên toàn trường."
    >
      <app-button variant="primary" routerLink="/giang-vien/them">Thêm giảng viên</app-button>
    </app-page-header>

    <div class="thanh-loc">
      <app-search-input
        placeholder="Tìm theo mã giảng viên, họ tên, email…"
        [value]="tuKhoa()"
        (valueChange)="doiTuKhoa($event)"
      />

      <label class="loc">
        <span>Chuyên môn</span>
        <input
          type="search"
          name="chuyen_mon"
          placeholder="Nhập chuyên môn"
          [value]="locChuyenMon()"
          (input)="doiChuyenMon($event)"
        />
      </label>

      <label class="loc">
        <span>Trạng thái</span>
        <select [value]="locTrangThai()" (change)="doiTrangThai($event)">
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Đã khóa</option>
        </select>
      </label>

      <div class="cum-nut">
        <app-button variant="primary" size="sm" (click)="apDungLoc()">Áp dụng</app-button>
        @if (coLoc()) {
          <button type="button" class="xoa-loc" (click)="xoaLoc()">Xóa bộ lọc</button>
        }

      </div>
    </div>

    @if (ketQuaHangLoat(); as kq) {
      <div class="ket-qua-hang-loat" role="region" aria-label="Kết quả thao tác hàng loạt">
        <app-alert [muc]="kq.that_bai > 0 ? 'warning' : 'success'">
          Đã xử lý {{ kq.thanh_cong }}/{{ kq.chi_tiet.length }} giảng viên.
          @if (kq.that_bai > 0) {
            {{ kq.that_bai }} dòng không thực hiện được — xem lý do bên dưới.
          }
        </app-alert>
        @if (dongLoi().length > 0) {
          <ul class="ds-loi">
            @for (dong of dongLoi(); track dong.id) {
              <li><strong>#{{ dong.id }}</strong> {{ dong.message ?? 'Không xử lý được.' }}</li>
            }
          </ul>
        }
      </div>
    }

    @if (soDongDaChon() > 0) {
      <div class="thanh-hang-loat">
        <span>Đã chọn {{ soDongDaChon() }} giảng viên</span>
        <div class="nut">
          <app-button
            variant="secondary"
            size="sm"
            [loading]="dangHangLoat()"
            (click)="hangLoat(true)"
          >
            Kích hoạt
          </app-button>
          <app-button
            variant="secondary"
            size="sm"
            [loading]="dangHangLoat()"
            (click)="hangLoat(false)"
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
      </div>
    }

    <app-data-table
      [cot]="cot()"
      [rows]="rows()"
      [dangTai]="dangTai()"
      [loi]="loi()"
      [chonNhieu]="true"
      [daChon]="daChon()"
      [sortBy]="sapXepHienTai().sort_by"
      [sortDir]="sapXepHienTai().sort_dir"
      [bamDong]="true"
      tieuDeRong="Không tìm thấy giảng viên nào"
      [moTaRong]="coLoc() ? 'Thử thay đổi từ khóa hoặc xóa bộ lọc.' : 'Danh sách giảng viên hiện chưa có dữ liệu.'"
      (daChonChange)="daChon.set($event)"
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
        <div class="nhom-thao-tac">
          <button
            type="button"
            class="nut-sua"
            [attr.aria-label]="'Sửa giảng viên ' + row.ho_ten"
            (click)="sua(row)"
          >
            <span class="material-icons" aria-hidden="true">edit</span>
            Sửa
          </button>
          <button
            type="button"
            class="nut-sua nut-xoa"
            [attr.aria-label]="'Xóa giảng viên ' + row.ho_ten"
            (click)="hoiXoa(row)"
          >
            <span class="material-icons" aria-hidden="true">delete</span>
            Xóa
          </button>
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

    @if (canXoa(); as gv) {
      <app-confirm-dialog
        tieuDe="Xóa giảng viên"
        [moTa]="'Giảng viên ' + gv.ho_ten + ' (' + gv.ma_gv + ') sẽ được chuyển vào thùng rác. Có thể khôi phục sau.'"
        [dangXuLy]="dangXoa()"
        [lyDoChan]="lyDoChanXoa()"
        (dongY)="xacNhanXoa()"
        (huy)="canXoa.set(null)"
      />
    }

    @if (canXoaHangLoat()) {
      <app-confirm-dialog
        tieuDe="Xóa nhiều giảng viên"
        [moTa]="soDongDaChon() + ' giảng viên sẽ được chuyển vào thùng rác. Các giảng viên đang phụ trách lớp thuộc học kỳ chưa đóng sẽ không bị xóa.'"
        nhanDongY="Xóa tất cả"
        [dangXuLy]="dangHangLoat()"
        (dongY)="xacNhanXoaHangLoat()"
        (huy)="canXoaHangLoat.set(false)"
      />
    }
  `,
  styles: `
    .thanh-loc {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: flex-end;
      margin-bottom: 14px;
    }

    app-search-input {
      flex: 1 1 260px;
      min-width: 180px;
      max-width: 380px;
    }

    .loc {
      display: flex;
      flex-direction: column;
      gap: 5px;
      font-size: var(--text-caption);
      font-weight: 600;
      color: var(--color-ink-muted);
    }

    .loc select,
    .loc input {
      min-width: 170px;
      padding: 9px 11px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
      font: 400 var(--text-small) var(--font-body);
    }

    .loc select:focus,
    .loc input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    .cum-nut,
    .nut {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .cum-nut {
      margin-left: auto;
    }

    .nhom-thao-tac {
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }

    .nut-sua:hover {
      background: var(--color-primary-soft);
    }

    .nut-sua {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 9px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
      font-weight: 600;
      text-decoration: none;
      font-family: var(--font-body);
      cursor: pointer;
    }

    .nut-sua .material-icons {
      font-size: 15px;
    }

    .nut-xoa {
      background: var(--color-surface);
      color: var(--color-danger);
    }

    .nut-xoa:hover {
      border-color: var(--color-danger);
      background: var(--color-danger-soft);
    }

    .xoa-loc {
      border: 0;
      border-radius: var(--radius);
      padding: 9px 10px;
      background: transparent;
      color: var(--color-ink-muted);
      font: 600 var(--text-small) var(--font-body);
      cursor: pointer;
    }

    .xoa-loc:hover {
      color: var(--color-danger);
      background: var(--color-danger-soft);
    }

    .ket-qua-hang-loat {
      display: grid;
      gap: 8px;
      margin-bottom: 12px;
      padding: 10px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
    }

    .ds-loi {
      display: grid;
      gap: 6px;
      max-height: 200px;
      overflow-y: auto;
      margin: 0;
      padding: 0 4px;
      list-style: none;
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }

    .ds-loi li {
      display: flex;
      gap: 8px;
      padding: 6px 8px;
      overflow-wrap: anywhere;
      background: var(--color-surface-alt);
      border-radius: var(--radius-sm);
    }

    .ds-loi strong {
      flex: none;
      color: var(--color-ink);
    }

    .thanh-hang-loat {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      padding: 10px 14px;
      margin-bottom: 12px;
      border-radius: var(--radius);
      background: var(--color-primary-soft);
      color: var(--color-on-primary-soft);
      font-size: var(--text-small);
      font-weight: 600;
    }

    @media (max-width: 640px) {
      .cum-nut {
        width: 100%;
        margin-left: 0;
      }
    }
  `,
})
export class GiangVienDanhSach {
  private readonly service = inject(GiangVienService);
  private readonly router = inject(Router);

  readonly dangTai = signal(true);
  readonly loi = signal<string | null>(null);
  readonly rows = signal<GiangVien[]>([]);
  readonly meta = signal<PageMeta | null>(null);
  readonly tuKhoa = signal('');
  readonly locChuyenMon = signal('');
  readonly locTrangThai = signal('');
  readonly daChon = signal<Array<string | number>>([]);
  readonly dangHangLoat = signal(false);
  readonly canXoaHangLoat = signal(false);
  readonly ketQuaHangLoat = signal<KetQuaHangLoat | null>(null);
  readonly canXoa = signal<GiangVien | null>(null);
  readonly dangXoa = signal(false);
  readonly lyDoChanXoa = signal('');
  readonly sapXepHienTai = signal<SapXep>({ sort_by: 'ma_gv', sort_dir: 'asc' });

  private readonly boLoc = signal({ tuKhoa: '', chuyenMon: '', trangThai: '' });
  private trang = 1;
  private coTrang = 10;

  readonly cot = computed<CotBang<GiangVien>[]>(() => [
    { khoa: 'ma_gv', nhan: 'Mã giảng viên', sap_xep: true, rong: '150px' },
    { khoa: 'ho_ten', nhan: 'Họ tên', sap_xep: true },
    { khoa: 'email', nhan: 'Email' },
    { khoa: 'so_dien_thoai', nhan: 'Số điện thoại', rong: '150px' },
    { khoa: 'chuyen_mon', nhan: 'Chuyên môn' },
    { khoa: 'trang_thai', nhan: 'Trạng thái', rong: '150px' },
    { khoa: 'thao_tac', nhan: 'Thao tác', rong: '220px' },
  ]);

  readonly coLoc = computed(() => {
    const f = this.boLoc();
    return !!(f.tuKhoa || f.chuyenMon || f.trangThai);
  });
  readonly soDongDaChon = computed(() => this.daChon().length);
  readonly dongLoi = computed(() =>
    (this.ketQuaHangLoat()?.chi_tiet ?? []).filter((dong) => dong.ket_qua === 'THAT_BAI'),
  );

  constructor() {
    this.tai();
  }

  tai(): void {
    this.dangTai.set(true);
    this.loi.set(null);
    const sx = this.sapXepHienTai();
    const f = this.boLoc();
    const thamSo: ThamSoDanhSach & { chuyen_mon?: string; trang_thai?: boolean } = {
      page: this.trang,
      per_page: this.coTrang as 10 | 25 | 50 | 100,
      q: f.tuKhoa || undefined,
      sort_by: sx.sort_by,
      sort_dir: sx.sort_dir,
      chuyen_mon: f.chuyenMon || undefined,
      trang_thai: f.trangThai === '' ? undefined : f.trangThai === 'true',
    };

    this.service.layDanhSach(thamSo).subscribe({
      next: (r) => {
        this.rows.set(r.data);
        this.meta.set(r.meta);
        this.dangTai.set(false);
      },
      error: () => {
        this.loi.set('Không tải được danh sách giảng viên. Kiểm tra kết nối rồi thử lại.');
        this.dangTai.set(false);
      },
    });
  }

  doiTuKhoa(value: string): void {
    this.tuKhoa.set(value);
    this.boLoc.update((f) => ({ ...f, tuKhoa: value }));
    this.trang = 1;
    this.tai();
  }

  doiChuyenMon(event: Event): void {
    this.locChuyenMon.set((event.target as HTMLInputElement).value);
  }

  doiTrangThai(event: Event): void {
    this.locTrangThai.set((event.target as HTMLSelectElement).value);
  }

  apDungLoc(): void {
    this.boLoc.update((f) => ({
      ...f,
      chuyenMon: this.locChuyenMon(),
      trangThai: this.locTrangThai(),
    }));
    this.trang = 1;
    this.tai();
  }

  xoaLoc(): void {
    this.tuKhoa.set('');
    this.locChuyenMon.set('');
    this.locTrangThai.set('');
    this.boLoc.set({ tuKhoa: '', chuyenMon: '', trangThai: '' });
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
    this.coTrang = perPage;
    this.trang = 1;
    this.tai();
  }

  moChiTiet(gv: GiangVien): void {
    this.router.navigate(['/giang-vien', gv.id]);
  }

  sua(gv: GiangVien): void {
    this.router.navigate(['/giang-vien', gv.id, 'sua']);
  }

  hoiXoa(gv: GiangVien): void {
    this.lyDoChanXoa.set('');
    this.canXoa.set(gv);
  }

  xacNhanXoa(): void {
    const gv = this.canXoa();
    if (!gv || this.dangXoa()) return;

    this.dangXoa.set(true);
    this.service.xoa(gv.id).subscribe({
      next: () => {
        this.dangXoa.set(false);
        this.canXoa.set(null);
        this.daChon.set(this.daChon().filter((id) => Number(id) !== gv.id));
        this.tai();
      },
      error: (e) => {
        this.dangXoa.set(false);
        this.lyDoChanXoa.set(
          e?.error?.message ??
            'Không xóa được giảng viên. Kiểm tra kết nối rồi thử lại.',
        );
      },
    });
  }

  hangLoat(trangThai: boolean): void {
    const ids = this.idsDaChon();
    if (ids.length === 0 || this.dangHangLoat()) return;

    this.dangHangLoat.set(true);
    this.loi.set(null);
    this.service.doiTrangThaiHangLoat(ids, trangThai).subscribe({
      next: (result) => {
        this.xongHangLoat(result);
      },
      error: () => {
        this.loi.set('Không thể cập nhật trạng thái giảng viên. Vui lòng thử lại.');
        this.dangHangLoat.set(false);
      },
    });
  }

  hoiXoaHangLoat(): void {
    if (this.soDongDaChon() > 0) this.canXoaHangLoat.set(true);
  }

  xacNhanXoaHangLoat(): void {
    const ids = this.idsDaChon();
    if (ids.length === 0 || this.dangHangLoat()) return;

    this.dangHangLoat.set(true);
    this.loi.set(null);
    this.service.xoaHangLoat(ids).subscribe({
      next: (result) => {
        this.canXoaHangLoat.set(false);
        this.xongHangLoat(result);
      },
      error: () => {
        this.loi.set('Không thể xóa giảng viên đã chọn. Vui lòng thử lại.');
        this.dangHangLoat.set(false);
      },
    });
  }

  private idsDaChon(): number[] {
    return this.daChon().map(Number).filter((id) => Number.isInteger(id) && id > 0);
  }

  private xongHangLoat(result: KetQuaHangLoat): void {
    this.dangHangLoat.set(false);
    this.ketQuaHangLoat.set(result);
    this.daChon.set(
      result.chi_tiet.filter((dong) => dong.ket_qua === 'THAT_BAI').map((dong) => dong.id),
    );
    this.tai();
  }
}
