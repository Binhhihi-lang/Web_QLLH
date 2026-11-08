import {
  Component,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/auth/auth.service';
import { LichThi, LichThiInput, LichThiService } from '@core/services/lich-thi.service';
import { LopHocPhanService, TuyChon } from '@core/services/lop-hoc-phan.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { AppToastService } from '@shared/ui/app-toast.service';
import { ChonTimKiem, LuaChonTimKiem } from '@shared/ui/chon-tim-kiem';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { DateInput } from '@shared/ui/date-input';
import { EmptyState } from '@shared/ui/empty-state';
import { LoadingState } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';
import { NgayVnPipe } from '@shared/pipes/ngay-vn.pipe';
import { XungDotLich, XungDotLichKhoi, docXungDotLich } from '@features/hoc-vu/xung-dot-lich';
import { Observable, map } from 'rxjs';

/** Dữ liệu form ca thi. `id` khác `null` nghĩa là đang sửa ca đã có. */
interface FormCaThi {
  id: number | null;
  mon_hoc_id: number;
  ngay_thi: string;
  tiet_bat_dau: number;
  tiet_ket_thuc: number;
  phong_hoc_id: number;
  dot_thi: string;
  ghi_chu: string;
}

/**
 * Lịch thi: ADMIN xếp ca thi, hai vai trò còn lại chỉ xem.
 * Ca thi theo môn, dùng chung khung tiết với buổi học.
 *
 * Bấm một dòng mở ngăn kéo chi tiết thay vì chuyển trang: người dùng thường
 * liếc qua nhiều ca liên tiếp, chuyển trang rồi quay lại sẽ mất bộ lọc học kỳ.
 */
@Component({
  selector: 'app-lich-thi',
  standalone: true,
  imports: [
    FormsModule,
    AppAlert,
    AppButton,
    ChonTimKiem,
    ConfirmDialog,
    DateInput,
    EmptyState,
    LoadingState,
    PageHeader,
    NgayVnPipe,
    XungDotLichKhoi,
  ],
  template: `
    <app-page-header
      title="Lịch thi"
      description="Ca thi theo môn trong học kỳ. Bấm một dòng để xem chi tiết; màu vàng là khối lịch thi trên lịch tuần."
    />

    @if (loi()) {
      <app-alert muc="danger">{{ loi() }}</app-alert>
    }

    <section class="bo-loc">
      <label>
        <span>Học kỳ</span>
        <select [ngModel]="hocKyId()" (ngModelChange)="chonHocKy($event)">
          @for (k of hocKy(); track k.id) {
            <option [ngValue]="k.id">{{ k.label }}</option>
          }
        </select>
      </label>
      @if (laAdmin()) {
        <app-button variant="primary" (click)="moForm()">
          <span class="material-icons" aria-hidden="true">add</span>
          Thêm ca thi
        </app-button>
      }
    </section>

    @if (dangMoForm()) {
      <div class="khung-them">
        <h3>{{ form().id === null ? 'Thêm ca thi' : 'Sửa ca thi' }}</h3>
        <div class="luoi">
          <div class="rong">
            <span class="nhan">Môn học *</span>
            <app-chon-tim-kiem
              id="mon-thi"
              placeholder="Gõ mã hoặc tên môn…"
              [nguon]="nguonMon"
              [giaTri]="form().mon_hoc_id || null"
              [nhanDaChon]="tenMonDangSua()"
              (giaTriChange)="datMonHoc($event)"
            />
          </div>
          <label>
            Ngày thi
            <app-date-input
              id="ngay-thi"
              nhan="Ngày thi"
              [giaTri]="form().ngay_thi"
              (giaTriChange)="datNgayThi($event)"
            />
          </label>
          <label>
            Từ tiết
            <select name="tu-tiet" [ngModel]="form().tiet_bat_dau" (ngModelChange)="datTuTiet($event)">
              @for (t of tiet(); track t.id) {
                <option [ngValue]="t.so_tiet">{{ t.label }}</option>
              }
            </select>
          </label>
          <label>
            Đến tiết
            <select name="den-tiet" [ngModel]="form().tiet_ket_thuc" (ngModelChange)="datDenTiet($event)">
              @for (t of tiet(); track t.id) {
                <option [ngValue]="t.so_tiet">{{ t.label }}</option>
              }
            </select>
          </label>
          <label>
            Phòng thi
            <select name="phong" [ngModel]="form().phong_hoc_id" (ngModelChange)="datPhong($event)">
              <option [ngValue]="0">Chọn phòng</option>
              @for (p of phong(); track p.id) {
                <option [ngValue]="p.id">{{ p.label }}</option>
              }
            </select>
          </label>
          <label>
            Đợt thi
            <input
              name="dot-thi"
              maxlength="50"
              [ngModel]="form().dot_thi"
              (ngModelChange)="datDotThi($event)"
              placeholder="Giữa kỳ / Cuối kỳ"
            />
          </label>
          <label class="rong">
            Ghi chú
            <input
              name="ghi-chu"
              maxlength="500"
              [ngModel]="form().ghi_chu"
              (ngModelChange)="datGhiChu($event)"
              placeholder="Ví dụ: sinh viên mang máy tính"
            />
          </label>
        </div>

        @if (xungDotForm(); as xd) {
          <app-xung-dot-lich [duLieu]="xd" />
        }

        <div class="nut-phu">
          <app-button variant="secondary" (click)="dongForm()">Hủy</app-button>
          <app-button variant="primary" [disabled]="!hopLe()" [loading]="dangLuu()" (click)="luu()">
            {{ form().id === null ? 'Thêm ca thi' : 'Lưu thay đổi' }}
          </app-button>
        </div>
      </div>
    }

    <div class="dem-ket-qua">{{ danhSach().length }} ca thi</div>

    @if (dangTai()) {
      <app-loading-state label="Đang tải lịch thi…" />
    } @else if (danhSach().length === 0) {
      <app-empty-state
        icon="event_note"
        title="Chưa có ca thi nào"
        description="Học kỳ này chưa được xếp ca thi. Dùng “Thêm ca thi” để tạo ca đầu tiên."
      />
    } @else {
      <div class="cuon">
        <table>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Môn</th>
              <th>Tiết</th>
              <th>Giờ</th>
              <th>Phòng</th>
              <th>Đợt</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (t of danhSach(); track t.id) {
              <tr
                class="dong-thi"
                tabindex="0"
                role="button"
                [attr.aria-label]="'Xem chi tiết ca thi ' + tenMon(t)"
                (click)="moChiTiet(t)"
                (keydown.enter)="moChiTiet(t)"
                (keydown.space)="moChiTiet(t); $event.preventDefault()"
              >
                <td>{{ t.ngay_thi | ngayVn }}</td>
                <td>
                  @if (t.mon_hoc) {
                    <b>{{ t.mon_hoc.ma_mon }}</b>
                    <span>{{ t.mon_hoc.ten_mon }}</span>
                  }
                </td>
                <td>{{ t.tiet_bat_dau }}–{{ t.tiet_ket_thuc }}</td>
                <td>{{ t.gio_bat_dau }}–{{ t.gio_ket_thuc }}</td>
                <td>{{ t.phong_hoc?.ma_phong ?? '—' }}</td>
                <td>{{ t.dot_thi ?? '—' }}</td>
                <td class="thao-tac">
                  @if (laAdmin()) {
                    <button
                      type="button"
                      class="nut-thao-tac nut-sua"
                      [attr.aria-label]="'Sửa ca thi ' + tenMon(t)"
                      (click)="moSua(t); $event.stopPropagation()"
                    >
                      <span class="material-icons" aria-hidden="true">edit</span>
                      Sửa
                    </button>
                    <button
                      type="button"
                      class="nut-thao-tac nut-xoa"
                      [attr.aria-label]="'Xóa ca thi ' + tenMon(t)"
                      (click)="hoiXoa(t); $event.stopPropagation()"
                    >
                      <span class="material-icons" aria-hidden="true">delete</span>
                      Xóa
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (dangHoiXoa(); as t) {
      <app-confirm-dialog
        tieuDe="Xóa ca thi?"
        [moTa]="'Ca thi ' + tenMon(t) + ' ngày ' + (t.ngay_thi | ngayVn) + ' (' + t.gio_bat_dau + '–' + t.gio_ket_thuc + ') sẽ bị xóa khỏi lịch.'"
        nhanDongY="Xóa"
        [nguyHiem]="true"
        (dongY)="xacNhanXoa()"
        (huy)="dongHoiXoa()"
      />
    }

    @if (dangXem(); as t) {
      <div class="nen-chi-tiet" (click)="dongChiTiet()" aria-hidden="true"></div>
      <aside
        #nganKeo
        class="ngan-keo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="td-chi-tiet-thi"
        tabindex="-1"
      >
        <header>
          <h2 id="td-chi-tiet-thi">Chi tiết ca thi</h2>
          <button type="button" class="dong-nut" (click)="dongChiTiet()" aria-label="Đóng">
            <span class="material-icons" aria-hidden="true">close</span>
          </button>
        </header>

        <div class="than">
          <div class="dau">
            @if (t.mon_hoc) {
              <p class="ma-mon">{{ t.mon_hoc.ma_mon }}</p>
              <h3>{{ t.mon_hoc.ten_mon }}</h3>
            } @else {
              <h3>Ca thi</h3>
            }
            <span class="nhan-thi">Lịch thi</span>
          </div>

          <dl>
            <dt>Ngày thi</dt>
            <dd>{{ t.ngay_thi | ngayVn }}</dd>

            <dt>Tiết</dt>
            <dd>{{ t.tiet_bat_dau }}–{{ t.tiet_ket_thuc }}</dd>

            <dt>Giờ</dt>
            <dd>{{ t.gio_bat_dau }}–{{ t.gio_ket_thuc }}</dd>

            <dt>Phòng</dt>
            <dd>
              @if (t.phong_hoc) {
                {{ t.phong_hoc.ma_phong }} — {{ t.phong_hoc.ten_phong }}
              } @else {
                —
              }
            </dd>

            <dt>Đợt thi</dt>
            <dd>{{ t.dot_thi || '—' }}</dd>

            <dt>Ghi chú</dt>
            <dd>{{ t.ghi_chu || '—' }}</dd>
          </dl>
        </div>

        <footer>
          <app-button variant="secondary" (click)="dongChiTiet()">Đóng</app-button>
          @if (laAdmin()) {
            <app-button variant="primary" (click)="moSua(t)">
              <span class="material-icons" aria-hidden="true">edit</span>
              Sửa
            </app-button>
          }
        </footer>
      </aside>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .bo-loc {
      display: flex;
      align-items: end;
      gap: 14px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
    label,
    .rong {
      display: grid;
      gap: 6px;
      font-size: var(--text-small);
      font-weight: 600;
      color: var(--color-ink-muted);
      min-width: 0;
    }
    .nhan {
      font-weight: 600;
    }
    select,
    input {
      padding: 9px 10px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font: inherit;
      font-size: var(--text-small);
      background: var(--color-surface);
      color: var(--color-ink);
    }
    app-date-input {
      min-width: 160px;
    }
    .bo-loc select {
      min-width: 240px;
    }
    .khung-them {
      padding: 16px;
      margin-bottom: 16px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
    }
    .khung-them h3 {
      margin: 0 0 12px;
      font-size: var(--text-body);
    }
    .luoi {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .nut-phu {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 14px;
    }
    .dem-ket-qua {
      font-size: var(--text-small);
      color: var(--color-ink-muted);
      margin-bottom: 8px;
    }
    .cuon {
      overflow-x: auto;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--text-small);
    }
    th,
    td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid var(--color-border);
      white-space: nowrap;
    }
    th {
      font-size: var(--text-small);
      font-weight: 650;
      color: var(--color-ink-muted);
      background: var(--color-surface-alt);
    }
    tr:last-child td {
      border-bottom: 0;
    }
    tbody tr.dong-thi {
      cursor: pointer;
    }
    tbody tr.dong-thi:hover {
      background: var(--color-surface-alt);
    }
    tbody tr.dong-thi:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: -2px;
    }
    /* Môn là nội dung chính — đậm và cỡ body, không phải chữ nhỏ. */
    td b {
      font-family: var(--font-mono, monospace);
      font-size: var(--text-small);
      color: var(--color-on-warning-soft);
      margin-right: 6px;
    }
    td span {
      color: var(--color-ink);
      font-size: var(--text-body);
      font-weight: 600;
    }
    .thao-tac {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      white-space: nowrap;
    }
    .nut-thao-tac {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      border: 1px solid var(--color-primary);
      background: var(--color-surface);
      color: var(--color-primary);
      font: inherit;
      font-size: var(--text-small);
      font-weight: 500;
      cursor: pointer;
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      transition: all 0.15s ease-in-out;
    }
    .nut-thao-tac .material-icons {
      font-size: 16px;
      line-height: 1;
      color: inherit;
    }
    .nut-sua .material-icons {
      color: var(--color-primary);
    }
    .nut-thao-tac:hover {
      background: var(--color-primary-soft);
    }
    .nut-xoa {
      border-color: var(--color-danger);
      color: var(--color-danger);
      background: var(--color-surface);
    }
    .nut-xoa .material-icons {
      color: var(--color-danger);
    }
    .nut-xoa:hover {
      background: var(--color-danger-soft);
    }

    /* ---- Ngăn kéo chi tiết ---- */
    .nen-chi-tiet {
      position: fixed;
      inset: 0;
      z-index: 90;
      background: rgb(15 23 42 / 40%);
    }
    .ngan-keo {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 91;
      width: min(440px, 100%);
      display: flex;
      flex-direction: column;
      background: var(--color-surface);
      color: var(--color-ink);
      box-shadow: -12px 0 40px rgb(15 23 42 / 18%);
    }
    .ngan-keo:focus {
      outline: none;
    }
    .ngan-keo header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-bottom: 1px solid var(--color-border);
    }
    .ngan-keo h2 {
      margin: 0;
      font-size: var(--text-h3);
      font-weight: 600;
    }
    .dong-nut {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: var(--color-ink-subtle);
      cursor: pointer;
      padding: 4px;
      border-radius: var(--radius-sm);
    }
    .dong-nut .material-icons {
      font-size: 18px;
    }
    .dong-nut:hover {
      background: var(--color-surface-alt);
      color: var(--color-ink);
    }
    .than {
      flex: 1;
      overflow-y: auto;
      padding: 18px;
    }
    .dau {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 10px;
      padding-bottom: 14px;
      margin-bottom: 14px;
      border-bottom: 1px solid var(--color-border-soft);
    }
    .dau h3 {
      margin: 0;
      font-size: var(--text-h3);
      font-weight: 650;
    }
    .dau .ma-mon {
      width: 100%;
      margin: 0;
      font-family: var(--font-mono, monospace);
      font-size: var(--text-caption);
      color: var(--color-ink-subtle);
    }
    .dau .nhan-thi {
      margin-left: auto;
      padding: 2px 9px;
      border-radius: 999px;
      font-size: var(--text-caption);
      font-weight: 700;
      background: var(--lich-thi-bg);
      color: var(--lich-thi-fg);
      border: 1px solid var(--lich-thi-vien);
    }
    .ngan-keo dl {
      display: grid;
      grid-template-columns: 100px 1fr;
      gap: 11px 14px;
      margin: 0;
      font-size: var(--text-small);
    }
    .ngan-keo dt {
      color: var(--color-ink-muted);
    }
    .ngan-keo dd {
      margin: 0;
      color: var(--color-ink);
      overflow-wrap: anywhere;
    }
    .ngan-keo footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 18px;
      border-top: 1px solid var(--color-border);
    }

    @media (max-width: 900px) {
      .luoi {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .bo-loc select {
        min-width: 180px;
      }
    }
    @media (max-width: 640px) {
      .luoi {
        grid-template-columns: 1fr;
      }
      .bo-loc {
        align-items: stretch;
      }
    }
    @media (max-width: 600px) {
      .ngan-keo {
        width: 100%;
      }
      .ngan-keo dl {
        grid-template-columns: 1fr;
        gap: 2px;
      }
      .ngan-keo dd {
        margin-bottom: 8px;
      }
    }
  `,
})
export class LichThiTrang {
  private readonly service = inject(LichThiService);
  private readonly lopHocPhan = inject(LopHocPhanService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(AppToastService);
  private readonly injector = inject(Injector);

  readonly hocKy = signal<TuyChon[]>([]);
  readonly hocKyId = signal(0);
  readonly danhSach = signal<LichThi[]>([]);
  readonly phong = signal<TuyChon[]>([]);
  readonly tiet = signal<{ id: number; so_tiet: number; label: string }[]>([]);
  readonly dangTai = signal(true);
  readonly dangMoForm = signal(false);
  readonly dangLuu = signal(false);
  readonly loi = signal('');

  readonly dangXem = signal<LichThi | null>(null);
  readonly dangHoiXoa = signal<LichThi | null>(null);
  readonly xungDotForm = signal<XungDotLich | null>(null);
  /** Tên/mã môn đang gắn với `mon_hoc_id` khi mở form sửa — ô tìm kiếm cần để hiện đúng. */
  readonly tenMonDangSua = signal('');

  readonly form = signal<FormCaThi>(this.formRong());

  readonly laAdmin = () => this.auth.nguoiDung()?.vai_tro === 'ADMIN';

  private readonly nganKeo = viewChild<ElementRef<HTMLElement>>('nganKeo');

  readonly nguonMon = (tuKhoa: string): Observable<LuaChonTimKiem[]> =>
    this.lopHocPhan
      .timMonHoc(tuKhoa)
      .pipe(map((ds) => ds.map((m) => ({ id: m.id, label: m.ten_mon, ma: m.ma_mon, phu: `${m.so_tin_chi} TC` }))));

  constructor() {
    this.lopHocPhan.layTuyChon('semesters').subscribe({
      next: (rows) => {
        this.hocKy.set(rows);
        // Kỳ đang diễn ra thay vì kỳ mới nhất — học kỳ tương lai thường chưa
        // có ca thi nên mặc định vào đó sẽ ra bảng rỗng.
        const macDinh =
          rows.find((k) => (k as TuyChon & { trang_thai?: string }).trang_thai === 'ONGOING') ??
          rows[0];
        if (macDinh) {
          this.hocKyId.set(macDinh.id);
          this.tai();
        } else {
          this.dangTai.set(false);
        }
      },
      error: () => {
        this.loi.set('Không tải được danh sách học kỳ.');
        this.dangTai.set(false);
      },
    });
    this.lopHocPhan.layTuyChon('rooms').subscribe({ next: (r) => this.phong.set(r) });
    this.lopHocPhan.layTiet().subscribe({ next: (r) => this.tiet.set(r) });
  }

  /**
   * Escape đóng được cả ngăn kéo chi tiết lẫn hộp thoại xác nhận.
   * `ConfirmDialog` đã tự nghe Escape cho riêng nó; ở đây chỉ xử lý ngăn kéo,
   * và bỏ qua khi hộp thoại đang mở để một phím không đóng hai lớp.
   */
  @HostListener('document:keydown.escape')
  khiNhanEscape(): void {
    if (this.dangHoiXoa()) return;
    this.dongChiTiet();
  }

  chonHocKy(id: number): void {
    this.hocKyId.set(id);
    this.tai();
  }

  tenMon(t: LichThi): string {
    return t.mon_hoc ? `${t.mon_hoc.ma_mon} — ${t.mon_hoc.ten_mon}` : `ca thi #${t.id}`;
  }

  hopLe(): boolean {
    const f = this.form();
    return (
      f.mon_hoc_id > 0 &&
      !!f.ngay_thi &&
      f.phong_hoc_id > 0 &&
      f.tiet_ket_thuc >= f.tiet_bat_dau
    );
  }

  // ---- Form: mỗi setter tạo object mới để signal phát thay đổi ----
  datMonHoc(id: number | null): void {
    this.form.update((f) => ({ ...f, mon_hoc_id: id ?? 0 }));
  }
  datNgayThi(iso: string): void {
    this.form.update((f) => ({ ...f, ngay_thi: iso }));
  }
  datTuTiet(soTiet: number): void {
    this.form.update((f) => ({ ...f, tiet_bat_dau: soTiet }));
  }
  datDenTiet(soTiet: number): void {
    this.form.update((f) => ({ ...f, tiet_ket_thuc: soTiet }));
  }
  datPhong(id: number): void {
    this.form.update((f) => ({ ...f, phong_hoc_id: id }));
  }
  datDotThi(value: string): void {
    this.form.update((f) => ({ ...f, dot_thi: value }));
  }
  datGhiChu(value: string): void {
    this.form.update((f) => ({ ...f, ghi_chu: value }));
  }

  moForm(): void {
    this.tenMonDangSua.set('');
    this.form.set({ ...this.formRong(), phong_hoc_id: this.phong()[0]?.id ?? 0 });
    this.xungDotForm.set(null);
    this.dangMoForm.set(true);
  }

  /** Mở form với dữ liệu ca đã có. `capNhat` giữ nguyên id để `luu()` biết là sửa. */
  moSua(t: LichThi): void {
    this.dongChiTiet();
    this.tenMonDangSua.set(
      t.mon_hoc ? `${t.mon_hoc.ma_mon} ${t.mon_hoc.ten_mon}` : this.tenMon(t),
    );
    this.form.set({
      id: t.id,
      mon_hoc_id: t.mon_hoc_id,
      ngay_thi: t.ngay_thi,
      tiet_bat_dau: t.tiet_bat_dau,
      tiet_ket_thuc: t.tiet_ket_thuc,
      phong_hoc_id: t.phong_hoc?.id ?? 0,
      dot_thi: t.dot_thi ?? '',
      ghi_chu: t.ghi_chu ?? '',
    });
    this.xungDotForm.set(null);
    this.dangMoForm.set(true);
  }

  dongForm(): void {
    this.dangMoForm.set(false);
    this.xungDotForm.set(null);
  }

  luu(): void {
    const f = this.form();
    if (!this.hopLe() || this.dangLuu()) return;
    this.dangLuu.set(true);
    this.loi.set('');
    this.xungDotForm.set(null);

    const duLieu: LichThiInput = {
      hoc_ky_id: this.hocKyId(),
      mon_hoc_id: f.mon_hoc_id,
      ngay_thi: f.ngay_thi,
      tiet_bat_dau: f.tiet_bat_dau,
      tiet_ket_thuc: f.tiet_ket_thuc,
      phong_hoc_id: f.phong_hoc_id,
      dot_thi: f.dot_thi.trim() || null,
      ghi_chu: f.ghi_chu.trim() || null,
    };

    const goi = f.id === null ? this.service.tao(duLieu) : this.service.capNhat(f.id, duLieu);
    goi.subscribe({
      next: () => {
        this.dangLuu.set(false);
        this.dangMoForm.set(false);
        this.toast.hien(f.id === null ? 'Đã thêm ca thi.' : 'Đã cập nhật ca thi.', 'success');
        this.tai();
      },
      error: (error: unknown) => {
        this.dangLuu.set(false);
        // 409 SCHEDULE_CONFLICT kèm danh sách xung đột — hiện đủ thì người dùng
        // mới biết đổi phòng hay đổi giờ, một câu chung không hành động được.
        const xungDot = docXungDotLich(error);
        this.xungDotForm.set(xungDot);
        if (!xungDot) {
          this.toast.hien(this.thongDiepLoi(error, 'Không lưu được ca thi.'), 'danger');
        }
      },
    });
  }

  moChiTiet(t: LichThi): void {
    this.dangXem.set(t);
    afterNextRender(() => this.nganKeo()?.nativeElement.focus(), { injector: this.injector });
  }

  dongChiTiet(): void {
    this.dangXem.set(null);
  }

  hoiXoa(t: LichThi): void {
    this.dangHoiXoa.set(t);
  }

  dongHoiXoa(): void {
    this.dangHoiXoa.set(null);
  }

  xacNhanXoa(): void {
    const t = this.dangHoiXoa();
    if (!t) return;
    this.dangHoiXoa.set(null);
    this.service.xoa(t.id).subscribe({
      next: () => {
        this.toast.hien('Đã xóa ca thi.', 'success');
        this.tai();
      },
      error: (error: unknown) =>
        this.toast.hien(this.thongDiepLoi(error, 'Không xóa được ca thi.'), 'danger'),
    });
  }

  private thongDiepLoi(error: unknown, macDinh: string): string {
    const than = (error as { error?: { message?: string } } | null)?.error;
    return than?.message ?? macDinh;
  }

  private formRong(): FormCaThi {
    return {
      id: null,
      mon_hoc_id: 0,
      ngay_thi: '',
      tiet_bat_dau: 1,
      tiet_ket_thuc: 3,
      phong_hoc_id: 0,
      dot_thi: '',
      ghi_chu: '',
    };
  }

  private tai(): void {
    this.dangTai.set(true);
    this.service.layDanhSach({ hoc_ky_id: this.hocKyId() }).subscribe({
      next: (rows) => {
        this.danhSach.set(rows);
        this.dangTai.set(false);
      },
      error: () => {
        this.loi.set('Không tải được lịch thi.');
        this.dangTai.set(false);
      },
    });
  }
}
