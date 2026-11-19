import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ChuongTrinhDaoTao, ChuongTrinhInput, ChuongTrinhService } from '@core/services/chuong-trinh.service';
import { KhoaNganhService } from '@core/services/khoa-nganh.service';
import { TuyChonNganh } from '@core/models/dao-tao.model';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { CotBang, DataTable, OTuyChinh } from '@shared/ui/data-table';
import { PageHeader } from '@shared/ui/page-header';
import { Pagination } from '@shared/ui/pagination';
import { SearchInput } from '@shared/ui/search-input';
import { StatusBadge } from '@shared/ui/status-badge';

/** Giá trị đang chọn trên thanh lọc — chưa chắc đã áp dụng. */
interface GiaTriLoc {
  nganh: string;
  khoaHoc: string;
  trangThai: string;
}

interface TrangThaiForm {
  id: number | null;
  nganh_id: number | null;
  khoa_hoc: string;
  ma_ctdt: string;
  ten: string;
  so_nam: number;
  so_ky: number;
  mo_ta: string;
  trang_thai: boolean;
  /** Mã còn tự sinh theo ngành + khóa hay người dùng đã sửa tay. */
  maTuDong: boolean;
}

interface MetaTrang {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

const LOC_RONG: GiaTriLoc = { nganh: '', khoaHoc: '', trangThai: '' };

/**
 * Danh sách chương trình đào tạo — SCR mới (mockup `docs/design/ctdt-va-quyen-buoi-hoc.html` §04).
 *
 * Một CTĐT là một ngành × một khóa. Màn này chỉ quản lý phần "khung": mã,
 * ngành, khóa, trạng thái. Danh sách môn từng kỳ nằm ở màn chi tiết.
 */
@Component({
  selector: 'app-chuong-trinh-danh-sach',
  standalone: true,
  imports: [
    AppAlert,
    AppButton,
    ConfirmDialog,
    DataTable,
    OTuyChinh,
    PageHeader,
    Pagination,
    SearchInput,
    StatusBadge,
  ],
  template: `
    <app-page-header
      title="Chương trình đào tạo"
      description="Mỗi chương trình là một ngành và một khóa. Trường đổi chương trình cho khóa mới thì tạo bản mới, khóa cũ giữ nguyên."
    >
      <app-button variant="primary" (click)="moTao()">
        <span class="material-icons nut-ic" aria-hidden="true">add</span>
        Tạo chương trình
      </app-button>
    </app-page-header>

    @if (thongBao()) {
      <app-alert [muc]="thongBaoMuc()">{{ thongBao() }}</app-alert>
    }

    <section class="thanh-loc" aria-label="Bộ lọc chương trình đào tạo">
      <app-search-input
        placeholder="Tìm mã chương trình hoặc tên ngành…"
        [value]="tuKhoa()"
        (valueChange)="doiTuKhoa($event)"
      />

      <label class="loc">
        <span>Ngành</span>
        <select id="loc-nganh" name="nganh_id" [value]="locTam().nganh" (change)="doiLoc('nganh', $event)">
          <option value="">Tất cả ngành</option>
          @for (n of dsNganh(); track n.id) {
            <option [value]="n.id" [selected]="locTam().nganh === n.id.toString()">{{ n.label }}</option>
          }
        </select>
      </label>

      <label class="loc">
        <span>Khóa</span>
        <select id="loc-khoa" name="khoa_hoc" [value]="locTam().khoaHoc" (change)="doiLoc('khoaHoc', $event)">
          <option value="">Tất cả khóa</option>
          @for (k of dsKhoa(); track k) {
            <option [value]="k" [selected]="locTam().khoaHoc === k">{{ k }}</option>
          }
        </select>
      </label>

      <label class="loc">
        <span>Trạng thái</span>
        <select id="loc-trang-thai" name="trang_thai" [value]="locTam().trangThai" (change)="doiLoc('trangThai', $event)">
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang áp dụng</option>
          <option value="false">Ngừng áp dụng</option>
        </select>
      </label>

      <div class="cum-nut">
        <app-button variant="primary" size="sm" [class.co-thay-doi]="coThayDoi()" (click)="apDungLoc()">
          <span class="material-icons nut-ic" aria-hidden="true">filter_alt</span>
          Áp dụng
        </app-button>
        @if (coLoc()) {
          <button type="button" class="xoa-loc" (click)="xoaLoc()">
            <span class="material-icons" aria-hidden="true">filter_alt_off</span>
            Xóa bộ lọc
          </button>
        }
      </div>
    </section>

    <app-data-table
      [cot]="cot()"
      [rows]="rows()"
      [dangTai]="dangTai()"
      [loi]="loi()"
      [bamDong]="true"
      tieuDeRong="Không tìm thấy chương trình nào"
      [moTaRong]="
        coLoc()
          ? 'Không có chương trình khớp bộ lọc. Thử xóa bộ lọc hoặc đổi từ khóa.'
          : 'Tạo chương trình đầu tiên cho một ngành và khóa.'
      "
      (dongDuocBam)="xem($event)"
      (thuLai)="tai()"
    >
      <ng-template appOTuyChinh="ma_ctdt" let-row>
        <span class="ma">{{ row.ma_ctdt }}</span>
      </ng-template>

      <ng-template appOTuyChinh="nganh" let-row>
        @if (row.nganh; as nganh) {
          <span class="cat" [title]="nganh.ten_nganh">{{ nganh.ma_nganh }}</span>
        } @else {
          —
        }
      </ng-template>

      <ng-template appOTuyChinh="khoa" let-row>
        <span class="cat" [title]="row.nganh?.khoa?.ten_khoa || ''">
          {{ row.nganh?.khoa?.ten_khoa || '—' }}
        </span>
      </ng-template>

      <ng-template appOTuyChinh="thoi_gian" let-row>
        <span>{{ row.so_nam ?? 4 }} năm ({{ row.so_ky ?? 8 }} kỳ)</span>
      </ng-template>

      <ng-template appOTuyChinh="trang_thai" let-row>
        <app-status-badge [value]="nhanTrangThai(row).value" [label]="nhanTrangThai(row).label" />
      </ng-template>

      <ng-template appOTuyChinh="thao_tac" let-row>
        <button
          type="button"
          class="nut-thao-tac"
          [attr.aria-expanded]="menuMo()?.id === row.id"
          aria-haspopup="menu"
          (click)="moMenu(row, $event)"
        >
          Thao tác
          <span class="material-icons" aria-hidden="true">expand_more</span>
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

    <!-- Menu thao tác nằm NGOÀI bảng: bảng cuộn ngang trong khung
         overflow nên menu tuyệt đối bên trong ô sẽ bị cắt mất. -->
    @if (menuMo(); as m) {
      <ul
        class="menu-noi"
        role="menu"
        [style.top.px]="m.top"
        [style.left.px]="m.left"
        aria-label="Thao tác chương trình đào tạo"
      >
        <li><button type="button" role="menuitem" (click)="xem(m.ctdt)">Xem chi tiết</button></li>
        <li><button type="button" role="menuitem" (click)="moSua(m.ctdt)">Sửa</button></li>
        <li>
          <button type="button" role="menuitem" class="nguy-hiem" (click)="hoiXoa(m.ctdt)">Xóa</button>
        </li>
      </ul>
    }

    @if (form(); as f) {
      <div class="lop-phu">
        <div class="nen" (click)="dongForm()" aria-hidden="true"></div>
        <div class="hop" role="dialog" aria-modal="true" aria-labelledby="tieu-de-form">
          <h2 id="tieu-de-form">
            {{ f.id === null ? 'Tạo chương trình đào tạo' : 'Sửa chương trình đào tạo' }}
          </h2>
          <p class="phu-hop">Mỗi cặp ngành — khóa chỉ có một chương trình.</p>

          <div class="luoi">
            <label class="truong">
              <span>Ngành <b aria-hidden="true">*</b></span>
              <select autofocus [value]="f.nganh_id ?? ''" (change)="doiNganh($event)">
                <option value="">Chọn ngành</option>
                @for (n of dsNganh(); track n.id) {
                  <option [value]="n.id" [selected]="f.nganh_id === n.id">{{ n.label }}</option>
                }
              </select>
            </label>

            <label class="truong">
              <span>Khóa <b aria-hidden="true">*</b></span>
              <input
                type="text"
                placeholder="K69"
                [value]="f.khoa_hoc"
                (input)="doiKhoaHoc($event)"
                autocomplete="off"
              />
            </label>

            <label class="truong">
              <span>Mã chương trình <b aria-hidden="true">*</b></span>
              <input
                type="text"
                placeholder="CT-KTPM-K69"
                [value]="f.ma_ctdt"
                (input)="doiMa($event)"
                autocomplete="off"
              />
              <small>Tự sinh từ ngành và khóa, sửa được.</small>
            </label>

            <label class="truong">
              <span>Tên chương trình <b aria-hidden="true">*</b></span>
              <input
                type="text"
                placeholder="Kỹ thuật phần mềm — Khóa K69"
                [value]="f.ten"
                (input)="doiTen($event)"
                autocomplete="off"
              />
            </label>

            <label class="truong">
              <span>Số năm đào tạo <b aria-hidden="true">*</b></span>
              <input
                type="number"
                step="0.5"
                min="1"
                max="10"
                [value]="f.so_nam"
                (input)="doiSoNam($event)"
              />
            </label>

            <label class="truong">
              <span>Số kỳ đào tạo <b aria-hidden="true">*</b></span>
              <input
                type="number"
                min="1"
                max="20"
                [value]="f.so_ky"
                (input)="doiSoKy($event)"
              />
            </label>

            <label class="truong truong--rong">
              <span>Mô tả</span>
              <textarea rows="3" [value]="f.mo_ta" (input)="doiMoTa($event)"></textarea>
            </label>

            <label class="truong truong--rong check">
              <input type="checkbox" [checked]="f.trang_thai" (change)="doiTrangThaiForm($event)" />
              Đang áp dụng
            </label>
          </div>

          @if (loiForm()) {
            <p class="loi" role="alert">{{ loiForm() }}</p>
          }

          <div class="chan-hop">
            <app-button variant="secondary" (click)="dongForm()">Hủy</app-button>
            <app-button variant="primary" [loading]="dangLuu()" (click)="luu()">
              {{ f.id === null ? 'Tạo chương trình' : 'Lưu thay đổi' }}
            </app-button>
          </div>
        </div>
      </div>
    }

    @if (canXoa(); as ct) {
      <app-confirm-dialog
        tieuDe="Xóa chương trình đào tạo"
        [moTa]="
          'Chương trình ' +
          ct.ma_ctdt +
          ' sẽ được chuyển vào thùng rác. Sinh viên khóa cũ không mất lịch sử, chỉ không còn thấy môn gợi ý.'
        "
        [dangXuLy]="dangXoa()"
        [lyDoChan]="lyDoChan()"
        (dongY)="xacNhanXoa()"
        (huy)="canXoa.set(null)"
      />
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .nut-ic {
      font-size: 17px;
    }

    .thanh-loc {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: flex-end;
      margin-bottom: 14px;
    }

    app-search-input {
      flex: 1 1 240px;
      min-width: 180px;
      max-width: 340px;
    }

    .loc {
      display: flex;
      flex-direction: column;
      gap: 5px;
      font-size: var(--text-caption);
      font-weight: 600;
      color: var(--color-ink-muted);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .loc select {
      font-family: inherit;
      font-size: var(--text-small);
      font-weight: 400;
      text-transform: none;
      letter-spacing: normal;
      padding: 9px 11px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
      min-width: 150px;
    }

    .loc select:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    .cum-nut {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
    }

    .xoa-loc {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-family: inherit;
      font-size: var(--text-small);
      font-weight: 600;
      color: var(--color-ink-muted);
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius);
      padding: 9px 10px;
      cursor: pointer;
    }

    .xoa-loc:hover {
      color: var(--color-danger);
      background: var(--color-danger-soft);
    }

    .xoa-loc .material-icons {
      font-size: 17px;
    }

    .co-thay-doi {
      box-shadow: 0 0 0 3px var(--color-warning-soft);
    }

    .ma {
      font-family: var(--font-mono, monospace);
      font-size: var(--text-small);
      font-weight: 600;
      white-space: nowrap;
    }

    /* Tên ngành và tên khoa dài — cắt một dòng, tên đầy đủ ở tooltip. */
    .cat {
      display: block;
      max-width: 170px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .nut-thao-tac {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-family: inherit;
      font-size: var(--text-caption);
      font-weight: 600;
      padding: 5px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-primary);
      cursor: pointer;
      white-space: nowrap;
    }

    .nut-thao-tac:hover {
      background: var(--color-primary-soft);
      border-color: var(--color-primary);
    }

    .nut-thao-tac .material-icons {
      font-size: 16px;
    }

    .menu-noi {
      position: fixed;
      z-index: 60;
      min-width: 190px;
      margin: 0;
      padding: 4px;
      list-style: none;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-lg);
    }

    .menu-noi button {
      display: block;
      width: 100%;
      text-align: left;
      border: none;
      background: transparent;
      font-family: inherit;
      font-size: var(--text-small);
      color: var(--color-ink);
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }

    .menu-noi button:hover {
      background: var(--color-surface-alt);
    }

    .menu-noi button.nguy-hiem {
      color: var(--color-danger);
    }

    .menu-noi button.nguy-hiem:hover {
      background: var(--color-danger-soft);
    }

    /* ---- Hộp thoại tạo / sửa ---- */
    .lop-phu {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .nen {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
    }

    .hop {
      position: relative;
      width: 100%;
      max-width: 560px;
      max-height: calc(100vh - 40px);
      overflow-y: auto;
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: 22px;
    }

    .hop h2 {
      font-size: var(--text-h3);
      font-weight: 600;
      color: var(--color-ink);
      margin-bottom: 4px;
    }

    .phu-hop {
      margin: 0 0 16px;
      font-size: var(--text-small);
      color: var(--color-ink-muted);
    }

    .luoi {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .truong {
      display: flex;
      flex-direction: column;
      gap: 5px;
      font-size: var(--text-small);
      font-weight: 600;
      color: var(--color-ink-muted);
    }

    .truong b {
      color: var(--color-danger);
      font-weight: 700;
    }

    .truong--rong {
      grid-column: 1 / -1;
    }

    .truong input[type='text'],
    .truong select,
    .truong textarea {
      font-family: inherit;
      font-size: var(--text-small);
      font-weight: 400;
      padding: 9px 11px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
    }

    .truong textarea {
      resize: vertical;
      min-height: 70px;
    }

    .truong input:focus,
    .truong select:focus,
    .truong textarea:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    .truong small {
      font-weight: 400;
      color: var(--color-ink-subtle);
      font-size: var(--text-caption);
    }

    .truong.check {
      flex-direction: row;
      align-items: center;
      gap: 8px;
      color: var(--color-ink);
    }

    .check input {
      width: 16px;
      height: 16px;
      accent-color: var(--color-primary);
    }

    .loi {
      margin: 12px 0 0;
      padding: 9px 12px;
      border-radius: var(--radius);
      background: var(--color-danger-soft);
      color: var(--color-on-danger-soft);
      font-size: var(--text-small);
    }

    .chan-hop {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 18px;
    }

    @media (max-width: 900px) {
      app-search-input {
        max-width: none;
        flex-basis: 100%;
      }

      .loc {
        flex: 1 1 150px;
      }

      .loc select {
        width: 100%;
        min-width: 0;
      }
    }

    @media (max-width: 640px) {
      .loc {
        flex-basis: calc(50% - 5px);
      }

      .cum-nut {
        width: 100%;
        margin-left: 0;
      }

      .xoa-loc {
        justify-content: center;
      }

      .luoi {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class ChuongTrinhDanhSach {
  private readonly service = inject(ChuongTrinhService);
  private readonly khoaNganh = inject(KhoaNganhService);
  private readonly router = inject(Router);

  readonly dangTai = signal(true);
  readonly loi = signal<string | null>(null);
  readonly rows = signal<ChuongTrinhDaoTao[]>([]);
  readonly meta = signal<MetaTrang | null>(null);

  readonly tuKhoa = signal('');
  readonly locTam = signal<GiaTriLoc>({ ...LOC_RONG });
  readonly loc = signal<GiaTriLoc>({ ...LOC_RONG });

  readonly dsNganh = signal<TuyChonNganh[]>([]);
  /** Danh sách khóa có trong dữ liệu — nạp một lần từ trang đầu, đủ lớn (100). */
  readonly dsKhoa = signal<string[]>([]);

  readonly thongBao = signal<string | null>(null);
  readonly thongBaoMuc = signal<'success' | 'danger'>('success');

  readonly form = signal<TrangThaiForm | null>(null);
  readonly dangLuu = signal(false);
  readonly loiForm = signal('');

  readonly canXoa = signal<ChuongTrinhDaoTao | null>(null);
  readonly dangXoa = signal(false);
  readonly lyDoChan = signal('');

  /** Menu thao tác đang mở, kèm toạ độ để neo dưới nút bấm. */
  readonly menuMo = signal<{ id: number; ctdt: ChuongTrinhDaoTao; top: number; left: number } | null>(
    null,
  );

  readonly coLoc = computed(() => {
    const f = this.loc();
    return !!(this.tuKhoa() || f.nganh || f.khoaHoc || f.trangThai);
  });

  readonly coThayDoi = computed(() => {
    const daApDung = this.loc();
    const dangChon = this.locTam();
    return (
      daApDung.nganh !== dangChon.nganh ||
      daApDung.khoaHoc !== dangChon.khoaHoc ||
      daApDung.trangThai !== dangChon.trangThai
    );
  });

  readonly cot = computed<CotBang<ChuongTrinhDaoTao>[]>(() => [
    { khoa: 'ma_ctdt', nhan: 'Mã', rong: '170px' },
    { khoa: 'nganh', nhan: 'Ngành', rong: '150px' },
    { khoa: 'khoa', nhan: 'Khoa', rong: '160px' },
    { khoa: 'khoa_hoc', nhan: 'Khóa', rong: '85px' },
    { khoa: 'thoi_gian', nhan: 'Thời gian', rong: '120px' },
    { khoa: 'so_mon', nhan: 'Số môn', can_phai: true, rong: '90px' },
    { khoa: 'tong_tin_chi', nhan: 'Tín chỉ', can_phai: true, rong: '90px' },
    { khoa: 'sinh_vien_ap_dung', nhan: 'SV áp dụng', can_phai: true, rong: '110px' },
    { khoa: 'trang_thai', nhan: 'Trạng thái', rong: '150px' },
    { khoa: 'thao_tac', nhan: 'Thao tác', rong: '120px' },
  ]);

  private trang = 1;
  private coTrang = 25;

  constructor() {
    this.tai();
    this.taiDsNganh();
    this.taiDsKhoa();
  }

  // ---------------- Bộ lọc ----------------

  /** Ô tìm kiếm áp dụng ngay (đã debounce 300ms); các ô chọn chờ bấm Áp dụng. */
  doiTuKhoa(value: string): void {
    this.tuKhoa.set(value);
    this.trang = 1;
    this.tai();
  }

  doiLoc(khoa: keyof GiaTriLoc, su: Event): void {
    const value = (su.target as HTMLSelectElement).value;
    this.locTam.update((f) => ({ ...f, [khoa]: value }));
  }

  apDungLoc(): void {
    this.loc.set({ ...this.locTam() });
    this.trang = 1;
    this.tai();
  }

  xoaLoc(): void {
    this.tuKhoa.set('');
    this.locTam.set({ ...LOC_RONG });
    this.loc.set({ ...LOC_RONG });
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

  // ---------------- Tải dữ liệu ----------------

  tai(): void {
    this.dangTai.set(true);
    this.loi.set(null);

    const f = this.loc();

    this.service
      .layDanhSach({
        page: this.trang,
        per_page: this.coTrang as 10 | 25 | 50 | 100,
        q: this.tuKhoa() || undefined,
        nganh_id: f.nganh ? Number(f.nganh) : undefined,
        khoa_hoc: f.khoaHoc || undefined,
        trang_thai: f.trangThai === '' ? undefined : f.trangThai === 'true',
      })
      .subscribe({
        next: (r) => {
          this.rows.set(r.data);
          this.meta.set(r.meta);
          this.dangTai.set(false);
        },
        error: () => {
          this.loi.set('Không tải được danh sách chương trình đào tạo. Kiểm tra kết nối rồi thử lại.');
          this.dangTai.set(false);
        },
      });
  }

  private taiDsNganh(): void {
    this.khoaNganh.layTuyChonNganh().subscribe({
      next: (ds) => this.dsNganh.set(ds),
      error: () => this.dsNganh.set([]),
    });
  }

  /** Lỗi nạp khóa không chặn màn chính — ô lọc rỗng vẫn dùng được. */
  private taiDsKhoa(): void {
    this.service.layDanhSach({ page: 1, per_page: 100 }).subscribe({
      next: (r) =>
        this.dsKhoa.set([...new Set(r.data.map((c) => c.khoa_hoc))].sort((a, b) => a.localeCompare(b, 'vi'))),
      error: () => this.dsKhoa.set([]),
    });
  }

  // ---------------- Điều hướng + menu thao tác ----------------

  xem(ct: ChuongTrinhDaoTao): void {
    this.menuMo.set(null);
    this.router.navigate(['/chuong-trinh-dao-tao', ct.id]);
  }

  moMenu(ct: ChuongTrinhDaoTao, su: Event): void {
    su.stopPropagation();
    if (this.menuMo()?.id === ct.id) {
      this.menuMo.set(null);
      return;
    }
    const nut = su.currentTarget as HTMLElement;
    const r = nut.getBoundingClientRect();
    this.menuMo.set({ id: ct.id, ctdt: ct, top: r.bottom + 4, left: Math.max(8, r.right - 190) });
  }

  @HostListener('document:click', ['$event'])
  dongMenuKhiBamRa(su: Event): void {
    if (!this.menuMo()) return;
    if ((su.target as HTMLElement).closest('.menu-noi, .nut-thao-tac')) return;
    this.menuMo.set(null);
  }

  @HostListener('document:keydown.escape')
  khiNhanEscape(): void {
    this.menuMo.set(null);
    if (this.form()) this.dongForm();
  }

  @HostListener('window:scroll')
  dongMenuKhiCuon(): void {
    if (this.menuMo()) this.menuMo.set(null);
  }

  // ---------------- Tạo / sửa ----------------

  moTao(): void {
    this.loiForm.set('');
    this.form.set({
      id: null,
      nganh_id: null,
      khoa_hoc: '',
      ma_ctdt: '',
      ten: '',
      so_nam: 4.0,
      so_ky: 8,
      mo_ta: '',
      trang_thai: true,
      maTuDong: true,
    });
  }

  moSua(ct: ChuongTrinhDaoTao): void {
    this.menuMo.set(null);
    this.loiForm.set('');
    this.form.set({
      id: ct.id,
      nganh_id: ct.nganh?.id ?? null,
      khoa_hoc: ct.khoa_hoc,
      ma_ctdt: ct.ma_ctdt,
      ten: ct.ten,
      so_nam: ct.so_nam ?? 4.0,
      so_ky: ct.so_ky ?? 8,
      mo_ta: ct.mo_ta ?? '',
      trang_thai: ct.trang_thai,
      maTuDong: false,
    });
  }

  dongForm(): void {
    if (this.dangLuu()) return;
    this.form.set(null);
    this.loiForm.set('');
  }

  doiNganh(su: Event): void {
    const value = (su.target as HTMLSelectElement).value;
    this.form.update((f) =>
      f ? { ...f, nganh_id: value ? Number(value) : null } : f,
    );
    this.capNhatMaTuDong();
  }

  doiKhoaHoc(su: Event): void {
    const value = (su.target as HTMLInputElement).value.toUpperCase();
    this.form.update((f) => (f ? { ...f, khoa_hoc: value } : f));
    this.capNhatMaTuDong();
  }

  doiMa(su: Event): void {
    const value = (su.target as HTMLInputElement).value;
    this.form.update((f) => (f ? { ...f, ma_ctdt: value, maTuDong: false } : f));
  }

  doiTen(su: Event): void {
    const value = (su.target as HTMLInputElement).value;
    this.form.update((f) => (f ? { ...f, ten: value } : f));
  }

  doiSoNam(su: Event): void {
    const value = Number((su.target as HTMLInputElement).value);
    this.form.update((f) => (f ? { ...f, so_nam: value } : f));
  }

  doiSoKy(su: Event): void {
    const value = Number((su.target as HTMLInputElement).value);
    this.form.update((f) => (f ? { ...f, so_ky: value } : f));
  }

  doiMoTa(su: Event): void {
    const value = (su.target as HTMLTextAreaElement).value;
    this.form.update((f) => (f ? { ...f, mo_ta: value } : f));
  }

  doiTrangThaiForm(su: Event): void {
    const value = (su.target as HTMLInputElement).checked;
    this.form.update((f) => (f ? { ...f, trang_thai: value } : f));
  }

  luu(): void {
    const f = this.form();
    if (!f || this.dangLuu()) return;

    if (f.nganh_id === null) return this.loiForm.set('Chọn ngành cho chương trình.');
    if (!f.khoa_hoc.trim()) return this.loiForm.set('Nhập khóa, ví dụ K69.');
    if (!f.ma_ctdt.trim()) return this.loiForm.set('Nhập mã chương trình.');
    if (!f.ten.trim()) return this.loiForm.set('Nhập tên chương trình.');

    const payload: ChuongTrinhInput = {
      ma_ctdt: f.ma_ctdt.trim(),
      nganh_id: f.nganh_id,
      khoa_hoc: f.khoa_hoc.trim(),
      ten: f.ten.trim(),
      so_nam: f.so_nam,
      so_ky: f.so_ky,
      mo_ta: f.mo_ta.trim() || null,
      trang_thai: f.trang_thai,
    };

    this.dangLuu.set(true);
    this.loiForm.set('');

    const luu$ = f.id === null ? this.service.tao(payload) : this.service.capNhat(f.id, payload);

    luu$.subscribe({
      next: (ct) => {
        this.dangLuu.set(false);
        this.form.set(null);
        this.baoThanhCong(
          f.id === null ? `Đã tạo chương trình ${ct.ma_ctdt}.` : `Đã cập nhật chương trình ${ct.ma_ctdt}.`,
        );
        this.tai();
        this.taiDsKhoa();
      },
      error: (e: { error?: { message?: string; ma_loi?: string } }) => {
        this.dangLuu.set(false);
        this.loiForm.set(
          e?.error?.ma_loi === 'DUPLICATE_CODE'
            ? 'Mã chương trình đã tồn tại. Chọn mã khác.'
            : (e?.error?.message ?? 'Không lưu được chương trình. Kiểm tra kết nối rồi thử lại.'),
        );
      },
    });
  }

  /** Tự sinh mã theo ngành + khóa cho tới khi người dùng sửa tay vào ô mã. */
  private capNhatMaTuDong(): void {
    const f = this.form();
    if (!f || !f.maTuDong) return;

    const nganh = this.dsNganh().find((n) => n.id === f.nganh_id);
    const ma = nganh && f.khoa_hoc ? `CT-${nganh.ma_nganh}-${f.khoa_hoc}` : '';
    this.form.set({ ...f, ma_ctdt: ma });
  }

  // ---------------- Xóa ----------------

  hoiXoa(ct: ChuongTrinhDaoTao): void {
    this.menuMo.set(null);
    this.lyDoChan.set('');
    this.canXoa.set(ct);
  }

  xacNhanXoa(): void {
    const ct = this.canXoa();
    if (!ct || this.dangXoa()) return;

    this.dangXoa.set(true);
    this.service.xoa(ct.id).subscribe({
      next: () => {
        this.dangXoa.set(false);
        this.canXoa.set(null);
        this.baoThanhCong(`Đã xóa chương trình ${ct.ma_ctdt}.`);
        this.tai();
      },
      error: (e: { error?: { message?: string } }) => {
        this.dangXoa.set(false);
        this.lyDoChan.set(
          e?.error?.message ?? 'Không xóa được chương trình. Kiểm tra kết nối rồi thử lại.',
        );
      },
    });
  }

  // ---------------- Hiển thị ----------------

  nhanTrangThai(ct: ChuongTrinhDaoTao): { value: string; label: string } {
    if (!ct.trang_thai) return { value: 'INACTIVE', label: 'Ngừng áp dụng' };
    if (ct.so_mon === 0) return { value: 'EMPTY', label: 'Chưa có môn' };
    return { value: 'ACTIVE', label: 'Đang áp dụng' };
  }

  private baoThanhCong(message: string): void {
    this.thongBaoMuc.set('success');
    this.thongBao.set(message);
    setTimeout(() => this.thongBao.set(null), 6000);
  }
}
