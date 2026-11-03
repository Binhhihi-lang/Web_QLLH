import {
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  BoLocNguoiDung,
  NguoiDungQuanTri,
  NguoiDungService,
  VaiTroNguoiDung,
} from '@core/services/nguoi-dung.service';
import { AuthService } from '@core/auth/auth.service';
import { KetQuaDong, PageMeta } from '@core/mock/mock-response';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { CotBang, DataTable, OTuyChinh, SapXep } from '@shared/ui/data-table';
import { PageHeader } from '@shared/ui/page-header';
import { Pagination } from '@shared/ui/pagination';
import { SearchInput } from '@shared/ui/search-input';
import { StatusBadge } from '@shared/ui/status-badge';

@Component({
  selector: 'app-nguoi-dung-danh-sach',
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
      title="Người dùng"
      description="Quản lý tài khoản quản trị, giảng viên và sinh viên. Chỉ xóa được tài khoản quản trị khác; tài khoản giảng viên/sinh viên được xóa ở màn hồ sơ tương ứng."
    >
      <app-button variant="primary" routerLink="/nguoi-dung/them">Thêm người dùng</app-button>
    </app-page-header>

    @if (thongBao()) {
      <app-alert [muc]="thongBao()!.muc">{{ thongBao()!.noiDung }}</app-alert>
    }
    @if (loiHangLoat().length > 0) {
      <ul class="ds-loi" aria-label="Tài khoản không cập nhật được">
        @for (dong of loiHangLoat(); track dong.id) {
          <li>
            <strong>#{{ dong.id }}</strong>
            {{ dong.message ?? dong.ma_loi ?? 'Không cập nhật được.' }}
          </li>
        }
      </ul>
    }

    <div class="thanh-loc">
      <label class="loc loc-tim-kiem">
        <span>Tìm kiếm</span>
        <app-search-input
          placeholder="Tìm theo họ tên hoặc email…"
          [value]="boLoc().q ?? ''"
          (valueChange)="doiLoc({ q: $event })"
        />
      </label>
      <label class="loc">
        <span>Vai trò</span>
        <select [value]="boLoc().vai_tro ?? ''" (change)="doiVaiTro($event)">
          <option value="">Tất cả vai trò</option>
          <option value="ADMIN">Quản trị viên</option>
          <option value="GIANG_VIEN">Giảng viên</option>
          <option value="SINH_VIEN">Sinh viên</option>
        </select>
      </label>
      <label class="loc">
        <span>Trạng thái</span>
        <select [value]="trangThaiLoc()" (change)="doiTrangThaiLoc($event)">
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Đã khóa</option>
        </select>
      </label>
      <app-button variant="secondary" size="sm" (click)="xoaLoc()">Xóa bộ lọc</app-button>
    </div>

    @if (soDongDaChon() > 0) {
      <div class="thanh-hang-loat">
        <span>Đã chọn {{ soDongDaChon() }} tài khoản</span>
        <div class="nhom-nut">
          <app-button
            variant="secondary"
            size="sm"
            [loading]="dangHangLoat()"
            (click)="capNhatTrangThaiHangLoat(true)"
          >
            Kích hoạt
          </app-button>
          <app-button
            variant="secondary"
            size="sm"
            [loading]="dangHangLoat()"
            (click)="capNhatTrangThaiHangLoat(false)"
          >
            Khóa
          </app-button>
        </div>
      </div>
    }

    <app-data-table
      [cot]="cacCot"
      [rows]="danhSach()"
      [dangTai]="dangTai()"
      [loi]="loi()"
      [chonNhieu]="true"
      [daChon]="daChon()"
      [bamDong]="true"
      [sortBy]="boLoc().sort_by ?? null"
      [sortDir]="boLoc().sort_dir ?? 'asc'"
      [tieuDeRong]="'Không tìm thấy người dùng nào'"
      [moTaRong]="
        coLoc() ? 'Thử thay đổi từ khóa hoặc bộ lọc.' : 'Danh sách tài khoản hiện chưa có dữ liệu.'
      "
      (daChonChange)="daChon.set($event)"
      (sapXep)="doiSapXep($event)"
      (dongDuocBam)="moChinhSua($event)"
      (thuLai)="taiDanhSach()"
    >
      <ng-template appOTuyChinh="vai_tro" let-row>
        {{ tenVaiTro(row.vai_tro) }}
      </ng-template>
      <ng-template appOTuyChinh="trang_thai" let-row>
        <app-status-badge
          [value]="row.trang_thai ? 'ACTIVE' : 'INACTIVE'"
          [label]="row.trang_thai ? 'Đang hoạt động' : 'Đã khóa'"
        />
      </ng-template>
      <ng-template appOTuyChinh="ho_so" let-row>
        @if (row.ho_so) {
          {{ row.ho_so.ho_ten }}
          <span class="ma-ho-so">{{ row.ho_so.ma_sv ?? row.ho_so.ma_gv ?? '' }}</span>
        } @else {
          <span class="mo-nhat">—</span>
        }
      </ng-template>
      <ng-template appOTuyChinh="thao_tac" let-row>
        <div class="nhom-thao-tac">
          <button type="button" class="nut-hanh-dong" (click)="moChinhSua(row)">Sửa</button>
          <button type="button" class="nut-hanh-dong" (click)="hoiDatLaiMatKhau(row)">
            Đặt lại mật khẩu
          </button>
          @if (row.vai_tro === 'ADMIN' && row.id !== currentUserId()) {
            <button type="button" class="nut-hanh-dong nut-xoa" (click)="hoiXoa(row)">Xóa</button>
          }
        </div>
      </ng-template>
    </app-data-table>

    @if (meta(); as phanTrang) {
      <app-pagination
        [currentPage]="phanTrang.current_page"
        [perPage]="phanTrang.per_page"
        [total]="phanTrang.total"
        [lastPage]="phanTrang.last_page"
        (pageChange)="doiLoc({ page: $event })"
        (perPageChange)="doiLoc({ per_page: $event })"
      />
    }

    @if (taiKhoanCanXoa(); as taiKhoan) {
      <app-confirm-dialog
        tieuDe="Xóa tài khoản"
        [moTa]="'Tài khoản ' + taiKhoan.email + ' sẽ được chuyển vào thùng rác.'"
        [dangXuLy]="dangXoa()"
        (dongY)="xacNhanXoa()"
        (huy)="taiKhoanCanXoa.set(null)"
      />
    }

    @if (taiKhoanCanDatLai(); as taiKhoan) {
      <app-confirm-dialog
        tieuDe="Đặt lại mật khẩu"
        [moTa]="
          'Hệ thống sẽ tạo mật khẩu tạm thời mới cho ' +
          taiKhoan.email +
          '. Mật khẩu hiện tại sẽ không còn sử dụng được.'
        "
        nhanDongY="Đặt lại mật khẩu"
        [dangXuLy]="dangDatLai()"
        (dongY)="xacNhanDatLaiMatKhau()"
        (huy)="taiKhoanCanDatLai.set(null)"
      />
    }

    @if (matKhauTam(); as matKhau) {
      <div class="lop-phu">
        <section
          #hopMatKhau
          class="hop-mat-khau"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mat-khau-title"
        >
          <h2 id="mat-khau-title" tabindex="-1" #tieuDeMatKhau>Mật khẩu tạm thời</h2>
          <p>Chỉ hiển thị lần này. Hãy sao chép và gửi an toàn cho người dùng.</p>
          <code>{{ matKhau }}</code>
          @if (loiSaoChep()) {
            <app-alert muc="warning">{{ loiSaoChep() }}</app-alert>
          } @else if (daSaoChep()) {
            <app-alert muc="success">Đã sao chép mật khẩu.</app-alert>
          }
          <div class="nhom-nut">
            <app-button variant="secondary" (click)="saoChepMatKhau(matKhau)">Sao chép</app-button>
            <app-button variant="primary" (click)="matKhauTam.set(null)">Đóng</app-button>
          </div>
        </section>
      </div>
    }
  `,
  styles: `
    .thanh-loc,
    .thanh-hang-loat,
    .nhom-nut,
    .nhom-thao-tac {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .thanh-loc {
      align-items: flex-end;
      margin: 0 0 14px;
    }
    .loc-tim-kiem {
      flex: 1 1 250px;
      max-width: 380px;
    }
    .loc-tim-kiem app-search-input {
      width: 100%;
      max-width: none;
    }
    .loc {
      display: grid;
      gap: 4px;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
    }
    .loc select {
      min-width: 150px;
      min-height: 44px;
      padding: 8px 10px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      color: var(--color-ink);
      background: var(--color-surface);
    }
    .thanh-hang-loat {
      justify-content: space-between;
      padding: 10px 12px;
      margin-bottom: 10px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface-alt);
      font-size: var(--text-small);
    }
    .ma-ho-so,
    .mo-nhat {
      display: block;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
    }
    .ds-loi {
      margin: 8px 0;
      padding: 10px 12px 10px 32px;
      border: 1px solid var(--color-danger);
      border-radius: var(--radius);
      color: var(--color-danger);
    }
    .nhom-thao-tac {
      gap: 8px;
    }
    .nut-hanh-dong {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 32px;
      padding: 5px 9px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-primary);
      cursor: pointer;
      font: inherit;
      font-size: var(--text-caption);
      font-weight: 600;
      white-space: nowrap;
      transition:
        background-color var(--dur) var(--ease),
        border-color var(--dur) var(--ease),
        color var(--dur) var(--ease);
    }
    .nut-hanh-dong:hover {
      border-color: var(--color-primary);
      background: var(--color-primary-soft);
    }
    .nut-hanh-dong:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
    .nut-xoa {
      color: var(--color-danger);
      border-color: var(--color-danger);
    }
    .nut-xoa:hover {
      background: var(--color-danger-soft);
    }
    .lop-phu {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: grid;
      place-items: center;
      padding: 16px;
      background: rgb(0 0 0 / 45%);
    }
    .hop-mat-khau {
      display: grid;
      gap: 14px;
      width: min(100%, 480px);
      padding: 24px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
    }
    .hop-mat-khau h2,
    .hop-mat-khau p {
      margin: 0;
    }
    .hop-mat-khau code {
      overflow-wrap: anywhere;
      padding: 12px;
      border-radius: var(--radius);
      background: var(--color-surface-alt);
      font-size: 1.1rem;
    }
    @media (max-width: 600px) {
      .thanh-loc {
        align-items: stretch;
      }
      .loc,
      .loc select,
      .loc-tim-kiem,
      .loc-tim-kiem app-search-input {
        width: 100%;
        max-width: none;
      }
      .nhom-thao-tac {
        align-items: flex-start;
        flex-direction: column;
        gap: 2px;
      }
      .hop-mat-khau {
        padding: 18px;
      }
    }
  `,
})
export class NguoiDungDanhSach {
  private readonly service = inject(NguoiDungService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly hopMatKhau = viewChild<ElementRef<HTMLElement>>('hopMatKhau');
  private readonly tieuDeMatKhau = viewChild<ElementRef<HTMLHeadingElement>>('tieuDeMatKhau');

  readonly boLoc = signal<BoLocNguoiDung>({
    page: 1,
    per_page: 10,
    sort_by: 'id',
    sort_dir: 'asc',
  });
  readonly danhSach = signal<NguoiDungQuanTri[]>([]);
  readonly meta = signal<PageMeta | null>(null);
  readonly daChon = signal<Array<string | number>>([]);
  readonly dangTai = signal(false);
  readonly dangHangLoat = signal(false);
  readonly dangXoa = signal(false);
  readonly dangDatLai = signal(false);
  readonly loi = signal<string | null>(null);
  readonly thongBao = signal<{ muc: 'success' | 'warning' | 'danger'; noiDung: string } | null>(
    null,
  );
  readonly loiHangLoat = signal<KetQuaDong[]>([]);
  readonly taiKhoanCanXoa = signal<NguoiDungQuanTri | null>(null);
  readonly taiKhoanCanDatLai = signal<NguoiDungQuanTri | null>(null);
  readonly matKhauTam = signal<string | null>(null);
  readonly daSaoChep = signal(false);
  readonly loiSaoChep = signal<string | null>(null);
  readonly soDongDaChon = computed(() => this.daChon().length);
  readonly currentUserId = computed(() => this.auth.nguoiDung()?.id ?? null);
  readonly trangThaiLoc = computed(() => {
    const status = this.boLoc().trang_thai;
    return status === undefined ? '' : String(status);
  });
  readonly coLoc = computed(() =>
    Boolean(this.boLoc().q || this.boLoc().vai_tro || this.boLoc().trang_thai !== undefined),
  );

  readonly cacCot: CotBang<NguoiDungQuanTri>[] = [
    { khoa: 'name', nhan: 'Họ tên', sap_xep: true },
    { khoa: 'email', nhan: 'Email', sap_xep: true },
    { khoa: 'ho_so', nhan: 'Hồ sơ', sap_xep: false },
    { khoa: 'vai_tro', nhan: 'Vai trò', rong: '130px', sap_xep: true },
    { khoa: 'trang_thai', nhan: 'Trạng thái', rong: '140px', sap_xep: true },
    { khoa: 'thao_tac', nhan: 'Thao tác', rong: '310px', sap_xep: false },
  ];

  constructor() {
    effect(() => {
      if (this.matKhauTam()) this.tieuDeMatKhau()?.nativeElement.focus();
    });
    this.taiDanhSach();
  }

  doiLoc(thayDoi: Partial<BoLocNguoiDung>): void {
    this.boLoc.update((boLoc) => ({ ...boLoc, ...thayDoi, page: thayDoi.page ?? 1 }));
    this.daChon.set([]);
    this.taiDanhSach();
  }

  doiVaiTro(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as VaiTroNguoiDung | '';
    this.doiLoc({ vai_tro: value || undefined });
  }

  doiTrangThaiLoc(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.doiLoc({ trang_thai: value === '' ? undefined : value === 'true' });
  }

  doiSapXep(sapXep: SapXep): void {
    switch (sapXep.sort_by) {
      case 'name':
      case 'email':
      case 'vai_tro':
      case 'trang_thai':
        this.doiLoc({ sort_by: sapXep.sort_by, sort_dir: sapXep.sort_dir });
        break;
      default:
        return;
    }
  }

  xoaLoc(): void {
    this.boLoc.set({ page: 1, per_page: 10, sort_by: 'id', sort_dir: 'asc' });
    this.daChon.set([]);
    this.taiDanhSach();
  }

  tenVaiTro(vaiTro: VaiTroNguoiDung): string {
    return { ADMIN: 'Quản trị viên', GIANG_VIEN: 'Giảng viên', SINH_VIEN: 'Sinh viên' }[vaiTro];
  }

  moChinhSua(user: NguoiDungQuanTri): void {
    void this.router.navigate(['/nguoi-dung', user.id, 'sua']);
  }

  taiDanhSach(): void {
    this.dangTai.set(true);
    this.loi.set(null);
    this.service.layDanhSach(this.boLoc()).subscribe({
      next: (response) => {
        this.danhSach.set(response.data);
        this.meta.set(response.meta);
        this.dangTai.set(false);
      },
      error: (error) => {
        this.loi.set(error?.error?.message ?? 'Không tải được danh sách người dùng.');
        this.dangTai.set(false);
      },
    });
  }

  capNhatTrangThaiHangLoat(trangThai: boolean): void {
    const ids = this.daChon().map(Number);
    if (ids.length === 0) return;

    this.loiHangLoat.set([]);
    this.dangHangLoat.set(true);
    this.service.doiTrangThaiHangLoat(ids, trangThai).subscribe({
      next: (result) => {
        this.thongBao.set({
          muc: result.that_bai > 0 ? 'warning' : 'success',
          noiDung: `Đã cập nhật ${result.thanh_cong}/${result.chi_tiet.length} tài khoản${result.that_bai > 0 ? `; ${result.that_bai} tài khoản không thể cập nhật.` : '.'}`,
        });
        this.loiHangLoat.set(result.chi_tiet.filter((dong) => dong.ket_qua === 'THAT_BAI'));
        this.daChon.set([]);
        this.dangHangLoat.set(false);
        this.taiDanhSach();
      },
      error: (error) => {
        this.thongBao.set({
          muc: 'danger',
          noiDung: error?.error?.message ?? 'Không cập nhật được trạng thái.',
        });
        this.loiHangLoat.set([]);
        this.dangHangLoat.set(false);
      },
    });
  }

  hoiXoa(user: NguoiDungQuanTri): void {
    this.taiKhoanCanXoa.set(user);
  }

  xacNhanXoa(): void {
    const user = this.taiKhoanCanXoa();
    if (!user) return;
    this.dangXoa.set(true);
    this.service.xoa(user.id).subscribe({
      next: () => {
        this.taiKhoanCanXoa.set(null);
        this.dangXoa.set(false);
        this.thongBao.set({ muc: 'success', noiDung: `Đã xóa tài khoản ${user.email}.` });
        this.taiDanhSach();
      },
      error: (error) => {
        this.taiKhoanCanXoa.set(null);
        this.dangXoa.set(false);
        this.thongBao.set({
          muc: 'danger',
          noiDung: error?.error?.message ?? 'Không xóa được tài khoản.',
        });
      },
    });
  }

  hoiDatLaiMatKhau(user: NguoiDungQuanTri): void {
    this.taiKhoanCanDatLai.set(user);
  }

  xacNhanDatLaiMatKhau(): void {
    const user = this.taiKhoanCanDatLai();
    if (!user) return;
    this.dangDatLai.set(true);
    this.service.datLaiMatKhau(user.id).subscribe({
      next: (response) => {
        this.taiKhoanCanDatLai.set(null);
        this.dangDatLai.set(false);
        this.matKhauTam.set(response.mat_khau_moi);
        this.daSaoChep.set(false);
        this.loiSaoChep.set(null);
      },
      error: (error) => {
        this.taiKhoanCanDatLai.set(null);
        this.dangDatLai.set(false);
        this.thongBao.set({
          muc: 'danger',
          noiDung: error?.error?.message ?? 'Không đặt lại được mật khẩu.',
        });
      },
    });
  }

  async saoChepMatKhau(matKhau: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(matKhau);
      this.daSaoChep.set(true);
      this.loiSaoChep.set(null);
    } catch {
      this.daSaoChep.set(false);
      this.loiSaoChep.set(
        'Trình duyệt không cho phép sao chép. Hãy chọn và sao chép mật khẩu thủ công.',
      );
    }
  }

  @HostListener('document:keydown', ['$event'])
  giuFocusTrongHop(event: KeyboardEvent): void {
    if (!this.matKhauTam() || event.key !== 'Tab') return;
    const dialog = this.hopMatKhau()?.nativeElement;
    if (!dialog) return;
    const buttons = Array.from(
      dialog.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled)'),
    );
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === this.tieuDeMatKhau()?.nativeElement)) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first?.focus();
    }
  }
}
