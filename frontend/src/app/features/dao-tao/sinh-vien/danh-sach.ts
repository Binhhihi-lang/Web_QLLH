import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SinhVien, TuyChonLopHanhChinh } from '@core/models/dao-tao.model';
import { SinhVienService } from '@core/services/sinh-vien.service';
import { KetQuaHangLoat } from '@core/mock/mock-response';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { CotBang, DataTable, OTuyChinh, SapXep } from '@shared/ui/data-table';
import { DateInput } from '@shared/ui/date-input';
import { PageHeader } from '@shared/ui/page-header';
import { Pagination } from '@shared/ui/pagination';
import { NgayVnPipe } from '@shared/pipes/ngay-vn.pipe';
import { SearchInput } from '@shared/ui/search-input';
import { StatusBadge } from '@shared/ui/status-badge';
import { SinhVienChiTiet } from './chi-tiet';

/**
 * Danh sách sinh viên (SCR-10) — KHUÔN MẪU cho mọi màn danh sách.
 *
 * Chép file này rồi đổi tên là ra màn giảng viên, lớp hành chính, môn học…
 * Phần phải viết lại chỉ có: kiểu dữ liệu, các cột, và bộ lọc đặc thù.
 * Phần dùng chung (bảng, phân trang, tìm kiếm, 4 trạng thái) đã nằm trong
 * `shared/ui` nên không chép lại.
 *
 * Cấu trúc state: một `signal` cho tham số truy vấn, một `signal` cho kết quả.
 * Đổi tham số thì gọi lại API — không lọc/sắp xếp phía client, vì backend đã
 * làm việc đó và làm đúng hơn (phân trang phải tính trên toàn bộ dữ liệu).
 */
@Component({
  selector: 'app-sinh-vien-danh-sach',
  standalone: true,
  imports: [
    RouterLink,
    AppAlert,
    AppButton,
    ConfirmDialog,
    DataTable,
    DateInput,
    OTuyChinh,
    PageHeader,
    Pagination,
    NgayVnPipe,
    SearchInput,
    SinhVienChiTiet,
    StatusBadge,
  ],
  template: `
    <app-page-header
      title="Sinh viên"
      description="Danh sách sinh viên toàn trường. Chọn nhiều dòng để thao tác hàng loạt."
    >
      <app-button variant="primary" routerLink="/sinh-vien/them">Thêm sinh viên</app-button>
    </app-page-header>

    <div class="thanh-loc">
      <app-search-input
        placeholder="Tìm theo mã SV, họ tên, email…"
        [value]="tuKhoa()"
        (valueChange)="doiTuKhoa($event)"
      />

      <label class="loc">
        <span>Khóa</span>
        <select id="loc-khoa" name="khoa_hoc" [value]="locKhoa()" (change)="doiLocKhoa($event)">
          <option value="">Tất cả khóa</option>
          @for (k of dsKhoa(); track k) {
            <option [value]="k" [selected]="k === locKhoa()">{{ k }}</option>
          }
        </select>
      </label>

      <label class="loc">
        <span>Lớp hành chính</span>
        <!-- Option render bằng @for nên phải chọn bằng "selected" trên từng
             option; đặt "value" trên thẻ select sẽ không khớp khi danh sách
             còn đang tải (lúc đó chưa có option nào). -->
        <select id="loc-lop" name="lop_hanh_chinh_id" (change)="doiLocLop($event)">
          <option value="" [selected]="locLop() === ''">Tất cả lớp</option>
          @for (l of dsLopHienThi(); track l.id) {
            <option [value]="l.id" [selected]="l.id.toString() === locLop()">{{ l.label }}</option>
          }
        </select>
      </label>

      <label class="loc">
        <span>Giới tính</span>
        <select id="loc-gioi-tinh" name="gioi_tinh" [value]="locGioiTinh()" (change)="doiLocGioiTinh($event)">
          <option value="">Tất cả</option>
          <option value="true">Nam</option>
          <option value="false">Nữ</option>
        </select>
      </label>

      <label class="loc">
        <span>Trạng thái</span>
        <select id="loc-trang-thai" name="trang_thai" [value]="locTrangThai()" (change)="doiTrangThai($event)">
          <option value="">Tất cả</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Đã khóa</option>
        </select>
      </label>

      <!-- Hai ô ngày nằm chung một nhóm: tách rời thì ô "Đến" hay bị đẩy
           xuống dòng một mình ở màn hẹp. -->
      <div class="loc">
        <span>Ngày sinh</span>
        <div class="cap-ngay">
          <app-date-input
            id="ngay-sinh-tu"
            nhan="Ngày sinh từ"
            [giaTri]="ngayTuNhap()"
            (giaTriChange)="ngayTuNhap.set($event)"
          />
          <span class="gach">–</span>
          <app-date-input
            id="ngay-sinh-den"
            nhan="Ngày sinh đến"
            [giaTri]="ngayDenNhap()"
            (giaTriChange)="ngayDenNhap.set($event)"
          />
        </div>
      </div>

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
    </div>

    @if (ketQuaHangLoat(); as kq) {
      <div class="ket-qua-hang-loat" role="region" aria-label="Kết quả thao tác hàng loạt">
        <div class="dau-kq">
          <app-alert [muc]="kq.that_bai > 0 ? 'warning' : 'success'">
            Đã xử lý {{ kq.thanh_cong }}/{{ kq.chi_tiet.length }} sinh viên.
            @if (kq.that_bai > 0) {
              {{ kq.that_bai }} dòng không thực hiện được — xem lý do bên dưới.
            }
          </app-alert>
          <button
            type="button"
            class="dong-thong-bao"
            (click)="ketQuaHangLoat.set(null)"
            aria-label="Đóng kết quả"
          >
            <span class="material-icons" aria-hidden="true">close</span>
          </button>
        </div>

        @if (dongLoi().length > 0) {
          <ul class="ds-loi">
            @for (d of dongLoi(); track d.id) {
              <li>
                <span class="ma-dong">#{{ d.id }}</span>
                <span class="ly-do">{{ d.message ?? 'Không xử lý được.' }}</span>
              </li>
            }
          </ul>
        }
      </div>
    }

    @if (soDongDaChon() > 0) {
      <div class="thanh-hang-loat">
        <span>Đã chọn {{ soDongDaChon() }} sinh viên</span>
        <div class="nut">
          <app-button variant="secondary" size="sm" [loading]="dangHangLoat()" (click)="hangLoat(true)">
            Kích hoạt
          </app-button>
          <app-button variant="secondary" size="sm" [loading]="dangHangLoat()" (click)="hangLoat(false)">
            Khóa
          </app-button>
          <app-button variant="danger" size="sm" [loading]="dangHangLoat()" (click)="hoiXoaHangLoat()">
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
      tieuDeRong="Không tìm thấy sinh viên nào"
      [moTaRong]="
        coLoc()
          ? 'Không có kết quả khớp bộ lọc. Thử xóa bộ lọc hoặc đổi từ khóa.'
          : 'Thêm sinh viên đầu tiên để bắt đầu.'
      "
      (daChonChange)="daChon.set($event)"
      (sapXep)="doiSapXep($event)"
      (dongDuocBam)="moChiTiet($event)"
      (thuLai)="tai()"
    >
      <ng-template appOTuyChinh="ho_ten" let-row>
        <div class="o-ten">
          <span class="ten">{{ row.ho_ten }}</span>
          <span class="phu">{{ row.email }}</span>
        </div>
      </ng-template>

      <ng-template appOTuyChinh="lop_hanh_chinh" let-row>
        @if (row.lop_hanh_chinh; as l) {
          <!-- Hiện mã lớp, không hiện tên đầy đủ: tên như "Công nghệ thông tin
               K65 - Lớp 01" dài gấp ba mã, làm bảng tràn ngang trên máy hẹp.
               Tên đầy đủ vẫn tra được qua tooltip và ở ngăn kéo chi tiết. -->
          <span class="ma-lop" [title]="l.ten_lop">{{ l.ma_lop }}</span>
        } @else {
          —
        }
      </ng-template>

      <ng-template appOTuyChinh="gioi_tinh" let-row>
        {{ row.gioi_tinh ? 'Nam' : 'Nữ' }}
      </ng-template>

      <ng-template appOTuyChinh="ngay_sinh" let-row>
        {{ row.ngay_sinh | ngayVn }}
      </ng-template>

      <ng-template appOTuyChinh="trang_thai" let-row>
        <app-status-badge
          [value]="row.trang_thai ? 'ACTIVE' : 'INACTIVE'"
          [label]="row.trang_thai ? 'Đang hoạt động' : 'Đã khóa'"
        />
      </ng-template>

      <ng-template appOTuyChinh="thao_tac" let-row>
        <div class="thao-tac">
          <button type="button" class="nut-nho" (click)="sua(row)">
            <span class="material-icons" aria-hidden="true">edit</span>
            Sửa
          </button>
          <button type="button" class="nut-nho nguy-hiem" (click)="hoiXoa(row)">
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

    @if (dangXem(); as id) {
      <app-sinh-vien-chi-tiet [id]="id" (dong)="dangXem.set(null)" />
    }

    @if (canXoa(); as sv) {
      <app-confirm-dialog
        tieuDe="Xóa sinh viên"
        [moTa]="'Sinh viên ' + sv.ho_ten + ' (' + sv.ma_sv + ') sẽ được chuyển vào thùng rác. Có thể khôi phục sau.'"
        [dangXuLy]="dangXoa()"
        [lyDoChan]="lyDoChanXoa()"
        (dongY)="xacNhanXoa()"
        (huy)="canXoa.set(null)"
      />
    }

    @if (canXoaHangLoat()) {
      <app-confirm-dialog
        tieuDe="Xóa nhiều sinh viên"
        [moTa]="soDongDaChon() + ' sinh viên sẽ được chuyển vào thùng rác. Có thể khôi phục sau.'"
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

    .loc select,
    .loc input {
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
    }

    .loc select {
      min-width: 150px;
    }

    .loc input:focus,
    .loc select:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    .cap-ngay {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .cap-ngay app-date-input {
      width: 124px;
    }

    .gach {
      color: var(--color-ink-subtle);
      font-weight: 400;
    }

    .cum-nut {
      display: flex;
      align-items: center;
      gap: 6px;
      /* Đẩy cụm nút sang phải, ngang hàng với đáy các ô lọc. */
      margin-left: auto;
    }

    .nut-ic {
      font-size: 15px;
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

    .thanh-hang-loat {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      padding: 10px 14px;
      margin-bottom: 12px;
      background: var(--color-primary-soft);
      border-radius: var(--radius);
      font-size: var(--text-small);
      font-weight: 600;
      color: var(--color-on-primary-soft);
    }

    /* Có thay đổi chưa áp dụng thì tô viền nút Áp dụng — người dùng hay quên
       bấm sau khi chọn xong bộ lọc. */
    .co-thay-doi {
      box-shadow: 0 0 0 3px var(--color-warning-soft);
    }

    .ket-qua-hang-loat {
      margin-bottom: 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      overflow: hidden;
    }

    .dau-kq {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px;
    }

    .dau-kq app-alert {
      flex: 1;
      min-width: 0;
    }

    .dong-thong-bao {
      display: inline-flex;
      border: none;
      background: transparent;
      color: var(--color-ink-subtle);
      cursor: pointer;
      padding: 6px;
      border-radius: var(--radius-sm);
      flex: none;
    }

    .dong-thong-bao:hover {
      background: var(--color-surface-alt);
      color: var(--color-ink);
    }

    .dong-thong-bao .material-icons {
      font-size: 18px;
    }

    .ds-loi {
      list-style: none;
      margin: 0;
      padding: 0 10px 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 200px;
      overflow-y: auto;
    }

    .ds-loi li {
      display: flex;
      gap: 8px;
      font-size: var(--text-caption);
      color: var(--color-ink-muted);
      padding: 6px 8px;
      background: var(--color-surface-alt);
      border-radius: var(--radius-sm);
    }

    .ma-dong {
      flex: none;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: var(--color-ink);
    }

    .ly-do {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .nut {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .o-ten {
      display: flex;
      flex-direction: column;
      line-height: 1.35;
    }

    .ma-lop {
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .ten {
      font-weight: 600;
    }

    .phu {
      font-size: var(--text-caption);
      color: var(--color-ink-subtle);
    }

    .thao-tac {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .nut-nho {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-family: inherit;
      font-size: var(--text-caption);
      font-weight: 600;
      padding: 4px 9px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-primary);
      cursor: pointer;
      white-space: nowrap;
      transition:
        background-color var(--dur) var(--ease),
        border-color var(--dur) var(--ease);
    }

    .nut-nho:hover {
      background: var(--color-primary-soft);
      border-color: var(--color-primary);
    }

    .nut-nho .material-icons {
      font-size: 13px;
    }

    .nut-nho.nguy-hiem {
      color: var(--color-danger);
    }

    .nut-nho.nguy-hiem:hover {
      background: var(--color-danger-soft);
      border-color: var(--color-danger);
    }

    /* Màn hẹp: bộ lọc chiếm trọn chiều ngang, hai ô ngày nằm cạnh nhau thay vì
       mỗi ô một dòng. */
    @media (max-width: 900px) {
      app-search-input {
        max-width: none;
        flex-basis: 100%;
      }

      .loc {
        flex: 1 1 140px;
      }

      .loc select {
        width: 100%;
        min-width: 0;
      }

      .cap-ngay {
        width: 100%;
      }

      .cap-ngay app-date-input {
        flex: 1;
        width: auto;
      }
    }

    @media (max-width: 600px) {
      .thanh-loc {
        gap: 8px;
      }

      .loc {
        flex-basis: calc(50% - 4px);
      }

      .xoa-loc {
        width: 100%;
        justify-content: center;
      }

      .thanh-hang-loat {
        justify-content: center;
        text-align: center;
      }

      .nut {
        width: 100%;
        justify-content: center;
      }
    }
  `,
})
export class SinhVienDanhSach {
  private readonly service = inject(SinhVienService);
  private readonly router = inject(Router);

  readonly dangTai = signal(true);
  readonly loi = signal<string | null>(null);
  readonly rows = signal<SinhVien[]>([]);
  readonly meta = signal<PaginatedResponseMeta | null>(null);

  // ---- Bộ lọc: giá trị ĐANG CHỌN trên thanh lọc ----
  // Tách khỏi giá trị đã áp dụng vì có khoảng ngày: người dùng chọn ngày từ rồi
  // ngày đến, áp dụng ngay giữa hai lần chọn sẽ ra kết quả của một nửa bộ lọc.
  readonly tuKhoa = signal('');
  readonly locKhoa = signal('');
  readonly locLop = signal('');
  readonly locGioiTinh = signal('');
  readonly locTrangThai = signal('');
  readonly ngayTuNhap = signal('');
  readonly ngayDenNhap = signal('');

  // ---- Bộ lọc ĐÃ ÁP DỤNG: cái thực sự đi vào truy vấn ----
  private readonly daApDung = signal({
    tuKhoa: '',
    khoa: '',
    lop: '',
    gioiTinh: '',
    trangThai: '',
    ngayTu: '',
    ngayDen: '',
  });

  readonly dsLop = signal<TuyChonLopHanhChinh[]>([]);
  readonly daChon = signal<Array<string | number>>([]);
  readonly sapXepHienTai = signal<SapXep>({ sort_by: 'ma_sv', sort_dir: 'asc' });

  /** Các khóa có trong danh sách lớp — suy ra từ dữ liệu, không khai cứng. */
  readonly dsKhoa = computed(() => {
    const tap = new Set<string>();
    for (const l of this.dsLop()) if (l.khoa_hoc) tap.add(l.khoa_hoc);
    return [...tap].sort((a, b) => a.localeCompare(b, 'vi'));
  });

  /** Chọn khóa thì ô lớp chỉ còn lớp thuộc khóa đó — tránh chọn ra tổ hợp rỗng. */
  readonly dsLopHienThi = computed(() => {
    const khoa = this.locKhoa();
    return khoa ? this.dsLop().filter((l) => l.khoa_hoc === khoa) : this.dsLop();
  });

  /** Có bộ lọc nào đã áp dụng — dùng để hiện nút xoá lọc và đổi câu thông báo rỗng. */
  readonly coLoc = computed(() => {
    const f = this.daApDung();
    return !!(f.tuKhoa || f.khoa || f.lop || f.gioiTinh || f.trangThai || f.ngayTu || f.ngayDen);
  });

  /** Có thay đổi chưa áp dụng — để tô sáng nút Áp dụng khi người dùng quên bấm. */
  readonly coThayDoi = computed(() => {
    const f = this.daApDung();
    return (
      this.tuKhoa() !== f.tuKhoa ||
      this.locKhoa() !== f.khoa ||
      this.locLop() !== f.lop ||
      this.locGioiTinh() !== f.gioiTinh ||
      this.locTrangThai() !== f.trangThai ||
      this.ngayTuNhap() !== f.ngayTu ||
      this.ngayDenNhap() !== f.ngayDen
    );
  });

  /** id sinh viên đang mở ngăn kéo chi tiết; null = đóng. */
  readonly dangXem = signal<number | null>(null);
  /** Sinh viên đang chờ xác nhận xoá; null = không hiện hộp thoại. */
  readonly canXoa = signal<SinhVien | null>(null);
  readonly dangXoa = signal(false);
  readonly lyDoChanXoa = signal('');

  /** Đang chạy một thao tác hàng loạt — khoá cả ba nút để không bấm chồng. */
  readonly dangHangLoat = signal(false);
  /** Đang chờ xác nhận xoá nhiều dòng. */
  readonly canXoaHangLoat = signal(false);
  /** Kết quả hàng loạt để báo lại sau khi xong; null = không hiện. */
  readonly ketQuaHangLoat = signal<KetQuaHangLoat | null>(null);

  /** Các dòng lỗi trong lần hàng loạt gần nhất — hiện kèm lý do từng dòng. */
  readonly dongLoi = computed(() =>
    (this.ketQuaHangLoat()?.chi_tiet ?? []).filter((c) => c.ket_qua === 'THAT_BAI'),
  );

  readonly soDongDaChon = computed(() => this.daChon().length);

  readonly cot = computed<CotBang<SinhVien>[]>(() => [
    { khoa: 'ma_sv', nhan: 'Mã SV', sap_xep: true, rong: '120px' },
    { khoa: 'ho_ten', nhan: 'Họ tên' },
    { khoa: 'lop_hanh_chinh', nhan: 'Lớp', rong: '130px' },
    { khoa: 'gioi_tinh', nhan: 'Giới tính', rong: '100px' },
    { khoa: 'ngay_sinh', nhan: 'Ngày sinh', sap_xep: true, rong: '130px' },
    { khoa: 'trang_thai', nhan: 'Trạng thái', rong: '150px' },
    { khoa: 'thao_tac', nhan: '', rong: '70px' },
  ]);

  private trang = 1;
  private coTrang = 25;

  constructor() {
    this.tai();
    this.taiDsLop();
  }

  tai(): void {
    this.dangTai.set(true);
    this.loi.set(null);

    const sx = this.sapXepHienTai();
    const f = this.daApDung();

    this.service
      .layDanhSach({
        page: this.trang,
        per_page: this.coTrang as 10 | 25 | 50 | 100,
        q: f.tuKhoa || undefined,
        sort_by: sx.sort_by,
        sort_dir: sx.sort_dir,
        lop_hanh_chinh_id: f.lop ? Number(f.lop) : undefined,
        khoa_hoc: f.khoa || undefined,
        gioi_tinh: f.gioiTinh === '' ? undefined : f.gioiTinh === 'true',
        trang_thai: f.trangThai === '' ? undefined : f.trangThai === 'true',
        ngay_sinh_tu: f.ngayTu || undefined,
        ngay_sinh_den: f.ngayDen || undefined,
      })
      .subscribe({
        next: (r) => {
          this.rows.set(r.data);
          this.meta.set(r.meta);
          this.dangTai.set(false);
        },
        error: () => {
          this.loi.set('Không tải được danh sách sinh viên. Kiểm tra kết nối rồi thử lại.');
          this.dangTai.set(false);
        },
      });
  }

  /** Nạp danh sách lớp cho ô lọc — một lần khi mở màn, không nạp lại mỗi lần lọc. */
  private taiDsLop(): void {
    this.service.layTuyChonLop().subscribe({
      next: (ds) => this.dsLop.set(ds),
      // Lỗi nạp danh sách lớp không được chặn màn chính: ô lọc rỗng vẫn dùng được.
      error: () => this.dsLop.set([]),
    });
  }

  /**
   * Tìm kiếm áp dụng NGAY (đã có debounce 300ms trong ô tìm), các ô còn lại chờ
   * bấm Áp dụng. Lý do: khoảng ngày cần hai lần chọn mới đủ ý, áp dụng ngay giữa
   * hai lần sẽ ra kết quả của một nửa bộ lọc.
   */
  doiTuKhoa(v: string): void {
    this.tuKhoa.set(v);
    this.daApDung.update((f) => ({ ...f, tuKhoa: v }));
    this.trang = 1;
    this.tai();
  }

  doiLocKhoa(suKien: Event): void {
    this.locKhoa.set((suKien.target as HTMLSelectElement).value);
    // Đổi khóa thì bỏ lớp đang chọn nếu lớp đó không thuộc khóa mới — giữ lại
    // sẽ ra kết quả rỗng mà người dùng không hiểu vì sao.
    const lopDangChon = this.dsLop().find((l) => String(l.id) === this.locLop());
    if (lopDangChon && this.locKhoa() && lopDangChon.khoa_hoc !== this.locKhoa()) {
      this.locLop.set('');
    }
  }

  doiLocLop(suKien: Event): void {
    this.locLop.set((suKien.target as HTMLSelectElement).value);
  }

  doiLocGioiTinh(suKien: Event): void {
    this.locGioiTinh.set((suKien.target as HTMLSelectElement).value);
  }

  doiTrangThai(suKien: Event): void {
    this.locTrangThai.set((suKien.target as HTMLSelectElement).value);
  }

  /** Chuyển các ô đang chọn thành bộ lọc thực sự đi vào truy vấn. */
  apDungLoc(): void {
    this.daApDung.set({
      tuKhoa: this.tuKhoa(),
      khoa: this.locKhoa(),
      lop: this.locLop(),
      gioiTinh: this.locGioiTinh(),
      trangThai: this.locTrangThai(),
      ngayTu: this.ngayTuNhap(),
      ngayDen: this.ngayDenNhap(),
    });
    this.trang = 1;
    this.tai();
  }

  xoaLoc(): void {
    this.tuKhoa.set('');
    this.locKhoa.set('');
    this.locLop.set('');
    this.locGioiTinh.set('');
    this.locTrangThai.set('');
    this.ngayTuNhap.set('');
    this.ngayDenNhap.set('');
    this.daApDung.set({
      tuKhoa: '',
      khoa: '',
      lop: '',
      gioiTinh: '',
      trangThai: '',
      ngayTu: '',
      ngayDen: '',
    });
    this.trang = 1;
    this.tai();
  }

  doiSapXep(sx: SapXep): void {
    this.sapXepHienTai.set(sx);
    this.tai();
  }

  moChiTiet(sv: SinhVien): void {
    this.dangXem.set(sv.id);
  }

  sua(sv: SinhVien): void {
    this.router.navigate(['/sinh-vien', sv.id, 'sua']);
  }

  hoiXoa(sv: SinhVien): void {
    this.lyDoChanXoa.set('');
    this.canXoa.set(sv);
  }

  xacNhanXoa(): void {
    const sv = this.canXoa();
    if (!sv) return;

    this.dangXoa.set(true);
    this.service.xoa(sv.id).subscribe({
      next: () => {
        this.dangXoa.set(false);
        this.canXoa.set(null);
        // Đóng chi tiết nếu đang mở đúng sinh viên vừa xoá.
        if (this.dangXem() === sv.id) this.dangXem.set(null);
        this.daChon.set(this.daChon().filter((k) => k !== sv.id));
        this.tai();
      },
      error: (e) => {
        this.dangXoa.set(false);
        // Backend chặn xoá thì giải thích ngay trong hộp thoại, không đóng nó:
        // đóng đi thì người dùng không biết vì sao không xoá được.
        this.lyDoChanXoa.set(
          e?.error?.message ?? 'Không xoá được sinh viên. Kiểm tra kết nối rồi thử lại.',
        );
      },
    });
  }

  doiTrang(p: number): void {
    this.trang = p;
    this.tai();
  }

  doiCoTrang(n: number): void {
    this.coTrang = n;
    this.trang = 1;
    this.tai();
  }

  // ---------------- Thao tác hàng loạt (BR-31) ----------------

  /** `trangThai = true` là Kích hoạt, `false` là Khóa. */
  hangLoat(trangThai: boolean): void {
    const ids = this.daChon().map(Number);
    if (ids.length === 0) return;

    this.dangHangLoat.set(true);
    this.ketQuaHangLoat.set(null);

    this.service.doiTrangThaiHangLoat(ids, trangThai).subscribe({
      next: (kq) => this.xongHangLoat(kq),
      error: () => {
        this.dangHangLoat.set(false);
        this.loi.set('Không thực hiện được thao tác hàng loạt. Thử lại sau.');
      },
    });
  }

  hoiXoaHangLoat(): void {
    this.canXoaHangLoat.set(true);
  }

  xacNhanXoaHangLoat(): void {
    const ids = this.daChon().map(Number);
    if (ids.length === 0) return;

    this.dangHangLoat.set(true);
    this.service.xoaHangLoat(ids).subscribe({
      next: (kq) => {
        this.canXoaHangLoat.set(false);
        this.xongHangLoat(kq);
      },
      error: () => {
        this.dangHangLoat.set(false);
        this.canXoaHangLoat.set(false);
        this.loi.set('Không thực hiện được thao tác hàng loạt. Thử lại sau.');
      },
    });
  }

  /**
   * Dọn trạng thái sau khi hàng loạt xong.
   *
   * Backend trả 200 kể cả khi mọi dòng lỗi, nên phải đọc `that_bai` để biết có
   * gì không làm được — bỏ qua bước này thì người dùng tưởng đã xong hết.
   * Bỏ chọn cả những dòng đã xử lý xong, giữ lại dòng lỗi để họ xử lý tiếp.
   */
  private xongHangLoat(kq: KetQuaHangLoat): void {
    this.dangHangLoat.set(false);
    this.ketQuaHangLoat.set(kq);

    const loiIds = kq.chi_tiet.filter((c) => c.ket_qua === 'THAT_BAI').map((c) => c.id);
    this.daChon.set(loiIds);

    this.tai();
  }
}

/** Chỉ cần phần `meta` — không kéo cả `PaginatedResponse` vào màn hình. */
interface PaginatedResponseMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}
