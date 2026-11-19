import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '@core/auth/auth.service';
import { LopHocPhan } from '@core/models/dao-tao.model';
import { ChuongTrinhDaoTao, ChuongTrinhMon, ChuongTrinhService } from '@core/services/chuong-trinh.service';
import { BuoiLich, LichHocService } from '@core/services/lich-hoc.service';
import { LopHocPhanService, TuyChon } from '@core/services/lop-hoc-phan.service';
import { DangKyService } from '@features/hoc-vu/dang-ky/dang-ky.service';
import { DiemService } from '@features/hoc-vu/diem/diem.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { EmptyState } from '@shared/ui/empty-state';
import { LoadingState } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';
import { StatusBadge } from '@shared/ui/status-badge';

type Tab = 'moi' | 'nguyen-vong' | 'hoc-lai';
type TinhTrangTrung = 'trung' | 'khong' | 'chua-ro';

interface HocKyChon extends TuyChon {
  nam_hoc?: string;
  trang_thai?: string;
  ky_thu?: number;
  dang_mo_dang_ky?: boolean;
}

/**
 * Sinh viên đăng ký học phần — SCR-32.
 *
 * Đổi so với bản cũ: danh sách KHÔNG liệt kê lớp nữa mà liệt kê MÔN của kỳ
 * hiện tại trong chương trình đào tạo (mockup `docs/design/ctdt-va-quyen-buoi-hoc.html` §06).
 * Bấm một dòng môn mới mở ra các lớp đang mở của môn đó.
 *
 * Vì sao lọc theo chương trình: một học kỳ có hàng trăm lớp của mọi ngành và
 * mọi khóa. Liệt kê hết thì sinh viên phải tự tìm môn của mình giữa danh sách
 * không liên quan — và dễ đăng ký nhầm lớp của khóa khác.
 */
@Component({
  selector: 'app-dang-ky-hoc-phan',
  standalone: true,
  imports: [AppAlert, AppButton, EmptyState, LoadingState, PageHeader, RouterLink, StatusBadge],
  template: `
    <app-page-header
      title="Đăng ký học phần"
      description="Chọn môn của kỳ hiện tại trong chương trình, rồi chọn lớp để đăng ký."
    >
      @if (kyDangChon(); as ky) {
        <div class="nhan-ky-hien-tai">
          <span class="cham-xanh"></span>
          <span>Đợt đăng ký: <b>{{ ky.label }}</b></span>
        </div>
      }
    </app-page-header>

    @if (sinhVien()) {
      <p class="sinh-vien">{{ sinhVien() }}</p>
    }

    @if (loi()) {
      <app-alert muc="danger">{{ loi() }}</app-alert>
    }
    @if (thongBao()) {
      <app-alert muc="success">{{ thongBao() }}</app-alert>
    }

    @if (!dangTaiHocKy() && !coDotDangKy()) {
      <app-empty-state
        icon="event_busy"
        title="Hiện chưa có đợt đăng ký học phần nào đang mở"
        description="Đợt đăng ký học phần chưa bắt đầu hoặc đã kết thúc. Bạn có thể xem lại danh sách các học phần đã đăng ký."
      >
        <app-button variant="primary" routerLink="/dang-ky-cua-toi">
          <span class="material-icons" aria-hidden="true">list_alt</span>
          Xem học phần đã đăng ký
        </app-button>
      </app-empty-state>
    } @else {
      @if (ctdt(); as ct) {
        <app-alert muc="info">
          Bạn thuộc chương trình <b>{{ tenChuongTrinh(ct) }}</b> — đang ở
          <b>học kỳ thứ {{ kyThuCt() }}</b> của chương trình.
          @if (kyDangChon(); as ky) {
            @if (ky.trang_thai === 'UPCOMING') {
              Đợt đăng ký đang mở nếu còn trong thời hạn.
            } @else {
              Học kỳ đã bắt đầu — chỉ xem lại.
            }
          }
        </app-alert>
      } @else if (!dangTaiCt()) {
        <app-alert muc="warning">
          Tài khoản của bạn chưa được gán chương trình đào tạo, nên chưa có danh sách môn gợi ý.
          Liên hệ phòng đào tạo để được xếp chương trình.
        </app-alert>
      }

      <div class="thanh-tab" role="tablist" aria-label="Hình thức đăng ký">
        @if (kyDangChon()?.ky_thu !== 3) {
          <button
            type="button"
            role="tab"
            [class.chon]="tab() === 'moi'"
            [attr.aria-selected]="tab() === 'moi'"
            (click)="doiTab('moi')"
          >
            Theo tiến độ (Kỳ {{ kyThuCt() }})
          </button>
        }
        <button
          type="button"
          role="tab"
          [class.chon]="tab() === 'nguyen-vong'"
          [attr.aria-selected]="tab() === 'nguyen-vong'"
          (click)="doiTab('nguyen-vong')"
        >
          Môn nguyện vọng {{ kyDangChon()?.ky_thu === 3 ? '(Kỳ hè)' : '' }}
        </button>
        <button
          type="button"
          role="tab"
          [class.chon]="tab() === 'hoc-lai'"
          [attr.aria-selected]="tab() === 'hoc-lai'"
          (click)="doiTab('hoc-lai')"
        >
          Học lại
        </button>
      </div>

    @if (dangTaiCt()) {
      <app-loading-state label="Đang tải chương trình đào tạo…" />
    } @else if (tab() === 'moi') {
      <div class="dau-bang">
        <h3>Môn của kỳ {{ kyThuCt() }} — chọn môn để xem lớp</h3>
      </div>

      @if (monCuaKy().length === 0) {
        <app-empty-state
          icon="menu_book"
          title="Kỳ này chưa có môn trong chương trình"
          description="Chương trình của bạn chưa được gán môn cho kỳ này. Liên hệ phòng đào tạo nếu bạn thấy thiếu."
        />
      } @else {
        <div class="bang-cuon">
          <table class="bang-mon">
            <thead>
              <tr>
                <th>Môn học/học phần</th>
                <th class="can-phai">Số tín chỉ</th>
              </tr>
            </thead>
            <tbody>
              @for (m of monCuaKy(); track m.mon_hoc.id) {
                <tr
                  class="dong-chon"
                  [class.dang-chon]="monDangChon()?.mon_hoc?.id === m.mon_hoc.id"
                  tabindex="0"
                  (click)="chonMon(m)"
                  (keydown.enter)="chonMon(m)"
                >
                  <td>
                    <span class="ma-mon">{{ m.mon_hoc.ma_mon }}</span>
                    <span class="ten-mon">{{ m.mon_hoc.ten_mon }}</span>
                  </td>
                  <td class="can-phai">{{ m.mon_hoc.so_tin_chi }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    } @else if (tab() === 'nguyen-vong') {
      <div class="dau-bang">
        <h3>Môn mở theo nguyện vọng trong học kỳ này</h3>
      </div>

      @if (dangTaiNguyenVong()) {
        <app-loading-state label="Đang tải danh sách môn mở theo nguyện vọng…" />
      } @else if (monNguyenVong().length === 0) {
        <app-empty-state
          icon="menu_book"
          title="Học kỳ này chưa có môn mở theo nguyện vọng"
          description="Nhà trường chưa mở lớp môn học theo nguyện vọng nào cho học kỳ này."
        />
      } @else {
        <p class="goi-y">
          Danh sách các môn học nhà trường đang mở lớp trong học kỳ này (bao gồm các lớp mở lẻ LOPNV). Chọn môn để xem lớp và đăng ký.
        </p>
        <div class="bang-cuon">
          <table class="bang-mon">
            <thead>
              <tr>
                <th>Môn học/học phần</th>
                <th class="can-phai">Số tín chỉ</th>
              </tr>
            </thead>
            <tbody>
              @for (m of monNguyenVong(); track m.mon_hoc.id) {
                <tr
                  class="dong-chon"
                  [class.dang-chon]="monDangChon()?.mon_hoc?.id === m.mon_hoc.id"
                  tabindex="0"
                  (click)="chonMon(m)"
                  (keydown.enter)="chonMon(m)"
                >
                  <td>
                    <span class="ma-mon">{{ m.mon_hoc.ma_mon }}</span>
                    <span class="ten-mon">{{ m.mon_hoc.ten_mon }}</span>
                  </td>
                  <td class="can-phai">{{ m.mon_hoc.so_tin_chi }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    } @else {
      @if (dangTaiDiem()) {
        <app-loading-state label="Đang tải kết quả học tập…" />
      } @else if (monHocLai().length === 0) {
        <app-empty-state
          icon="task_alt"
          title="Không có môn nào chưa đạt"
          description="Bạn không có môn nào cần học lại trong các học kỳ đã kết thúc."
        />
      } @else {
        <p class="goi-y">
          Các môn dưới đây bạn chưa đạt. Chọn một môn để xem lớp đang mở trong học kỳ này.
        </p>
        <div class="bang-cuon">
          <table class="bang-mon">
            <thead>
              <tr>
                <th>Môn học/học phần</th>
                <th class="can-phai">Số tín chỉ</th>
              </tr>
            </thead>
            <tbody>
              @for (m of monHocLai(); track m.mon_hoc.id) {
                <tr
                  class="dong-chon"
                  [class.dang-chon]="monDangChon()?.mon_hoc?.id === m.mon_hoc.id"
                  tabindex="0"
                  (click)="chonMon(m)"
                  (keydown.enter)="chonMon(m)"
                >
                  <td>
                    <span class="ma-mon">{{ m.mon_hoc.ma_mon }}</span>
                    <span class="ten-mon">{{ m.mon_hoc.ten_mon }}</span>
                  </td>
                  <td class="can-phai">{{ m.mon_hoc.so_tin_chi }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    }
  }

    @if (monDangChon(); as m) {
      <section class="panel" aria-label="Các lớp của môn đang chọn">
        <div class="panel-dau">
          <div>
            <b>{{ m.mon_hoc.ten_mon }}</b>
            <span class="mono">
              {{ m.mon_hoc.ma_mon }} · {{ m.mon_hoc.so_tin_chi }} tín chỉ ·
              {{ m.bat_buoc ? 'bắt buộc' : 'tự chọn' }}
            </span>
          </div>
          <app-button variant="secondary" size="sm" (click)="dongPanel()">Đóng</app-button>
        </div>

        <div class="panel-than">
          <h4>Các lớp của môn này trong {{ kyDangChon()?.label || 'học kỳ đã chọn' }}</h4>

          @if (dangTaiLop()) {
            <app-loading-state label="Đang tải lớp…" padding="20px 0" />
          } @else if (lopCuaMon().length === 0) {
            <p class="trong">Học kỳ này chưa có lớp nào cho môn này.</p>
          } @else {
            <div class="bang-cuon">
              <table class="bang-lop">
                <thead>
                  <tr>
                    <th>Lớp</th>
                    <th>Giảng viên</th>
                    <th class="can-phai">Sĩ số</th>
                    <th>Lịch</th>
                    <th>Trùng</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (l of lopCuaMon(); track l.id) {
                    <tr>
                      <td class="mono">{{ l.ma_lop_hp }}</td>
                      <td>{{ l.giang_vien ? l.giang_vien.ho_ten : 'Chưa phân công' }}</td>
                      <td class="can-phai">{{ l.si_so_hien_tai }}/{{ l.si_so_toi_da }}</td>
                      <td class="mono nowrap">{{ moTaLich(l.id) }}</td>
                      <td>
                        @switch (tinhTrangTrung(l.id)) {
                          @case ('trung') {
                            <app-status-badge value="CANCELLED" label="Trùng lịch" />
                          }
                          @case ('khong') {
                            <app-status-badge value="ACTIVE" label="Không trùng" />
                          }
                          @default {
                            <span class="chua-ro">—</span>
                          }
                        }
                      </td>
                      <td class="cuoi">
                        @if (daDangKy(l)) {
                          <span class="da-dang-ky">Đã đăng ký</span>
                        } @else {
                          <app-button
                            size="sm"
                            [variant]="coTheDangKy(l) ? 'primary' : 'secondary'"
                            [disabled]="!coTheDangKy(l)"
                            [loading]="dangGui() === l.id"
                            (click)="dangKyLop(l)"
                          >
                            {{ conCho(l) > 0 ? 'Đăng ký' : 'Đã đầy' }}
                          </app-button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <p class="chu-thich">
              Cột <b>Trùng</b> so lịch lớp với các lớp bạn đã đăng ký trong học kỳ này.
              <span class="chua-ro">—</span> nghĩa là chưa tải được lịch học.
            </p>
          }
        </div>
      </section>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .nhan-ky-hien-tai {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      font-size: var(--text-small);
      color: var(--color-ink);
    }

    .cham-xanh {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-success);
    }

    .chon-ky-thu select {
      font-family: inherit;
      font-size: var(--text-small);
      font-weight: 400;
      padding: 8px 11px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
      min-width: 200px;
    }

    .chon-ky select:focus,
    .chon-ky-thu select:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    .sinh-vien {
      margin: -6px 0 12px;
      font-size: var(--text-small);
      color: var(--color-ink-muted);
    }

    app-alert {
      display: block;
      margin-bottom: 12px;
    }

    .thanh-tab {
      display: flex;
      gap: 4px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--color-border);
    }

    .thanh-tab button {
      font-family: inherit;
      font-size: var(--text-small);
      font-weight: 600;
      color: var(--color-ink-muted);
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      padding: 9px 14px;
      cursor: pointer;
    }

    .thanh-tab button:hover {
      color: var(--color-ink);
    }

    .thanh-tab button.chon {
      color: var(--color-primary);
      border-bottom-color: var(--color-primary);
    }

    .dau-bang {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }

    .dau-bang h3 {
      font-size: var(--text-h3);
      font-weight: 600;
      color: var(--color-ink);
    }

    .chon-ky-thu {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: var(--text-caption);
      font-weight: 600;
      color: var(--color-ink-muted);
    }

    .chon-ky-thu select {
      min-width: 110px;
    }

    .goi-y {
      margin: 0 0 8px;
      font-size: var(--text-small);
      color: var(--color-ink-muted);
    }

    /* Bảng rộng hơn màn 390px: cuộn trong khung, không đẩy cả trang. */
    .bang-cuon {
      overflow-x: auto;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--text-small);
    }

    .bang-mon {
      min-width: 320px;
    }

    .bang-lop {
      min-width: 640px;
    }

    thead th {
      text-align: left;
      font-weight: 600;
      font-size: var(--text-caption);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--color-ink-muted);
      background: var(--color-surface-alt);
      padding: 10px 14px;
      white-space: nowrap;
      border-bottom: 1px solid var(--color-border);
    }

    tbody td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--color-border-soft);
      color: var(--color-ink);
      vertical-align: middle;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    .can-phai {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .mono {
      font-family: var(--font-mono, monospace);
    }

    .nowrap {
      white-space: nowrap;
    }

    .cuoi {
      text-align: right;
    }

    .dong-chon {
      cursor: pointer;
    }

    .dong-chon:hover,
    .dong-chon:focus-visible {
      background: var(--color-surface-alt);
      outline: none;
    }

    .dong-chon.dang-chon {
      background: var(--color-primary-soft);
    }

    .ma-mon {
      display: inline-block;
      min-width: 78px;
      font-family: var(--font-mono, monospace);
      font-weight: 600;
      color: var(--color-primary);
    }

    .ten-mon {
      color: var(--color-ink);
    }

    /* ---- Panel lớp của môn ---- */
    .panel {
      margin-top: 16px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .panel-dau {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-surface-alt);
    }

    .panel-dau > div {
      display: grid;
      gap: 2px;
      min-width: 0;
    }

    .panel-than {
      padding: 14px 16px 16px;
    }

    .panel-than h4 {
      font-size: var(--text-small);
      font-weight: 600;
      color: var(--color-ink-muted);
      margin-bottom: 8px;
    }

    .da-dang-ky {
      font-size: var(--text-caption);
      font-weight: 600;
      color: var(--color-on-success-soft);
    }

    .chua-ro {
      color: var(--color-ink-subtle);
    }

    .trong {
      margin: 0;
      padding: 20px;
      text-align: center;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius);
    }

    .chu-thich {
      margin: 8px 0 0;
      font-size: var(--text-caption);
      color: var(--color-ink-subtle);
    }

    @media (max-width: 640px) {
      .dau-bang {
        align-items: flex-start;
      }

      .chon-ky select {
        min-width: 160px;
      }

      .panel-than {
        padding: 12px;
      }
    }
  `,
})
export class DangKyHocPhanSinhVien {
  private readonly lopHocPhan = inject(LopHocPhanService);
  private readonly dangKy = inject(DangKyService);
  private readonly chuongTrinh = inject(ChuongTrinhService);
  private readonly lichHoc = inject(LichHocService);
  private readonly diem = inject(DiemService);
  private readonly auth = inject(AuthService);

  readonly tab = signal<Tab>('moi');

  readonly hocKy = signal<HocKyChon[]>([]);
  readonly hocKyId = signal(0);
  readonly dangTaiHocKy = signal(true);
  readonly ctdt = signal<ChuongTrinhDaoTao | null>(null);
  readonly dangTaiCt = signal(true);

  readonly kyThuCt = signal<number | null>(null);

  readonly monDangChon = signal<ChuongTrinhMon | null>(null);
  readonly lopCuaMon = signal<LopHocPhan[]>([]);
  readonly dangTaiLop = signal(false);

  readonly monNguyenVong = signal<ChuongTrinhMon[]>([]);
  readonly dangTaiNguyenVong = signal(false);

  readonly dangTaiDiem = signal(false);
  /** Mã môn có kết quả KHÔNG_DAT ở bất kỳ học kỳ đã kết thúc nào. */
  private readonly monKhongDat = signal<Set<string>>(new Set());
  private daTaiDiem = false;

  readonly daDangKyIds = signal<Set<number>>(new Set());

  readonly dangGui = signal(0);
  readonly loi = signal('');
  readonly thongBao = signal('');

  /** Buổi học của cả học kỳ, nhóm theo lớp — dùng cho cột Lịch và Trùng. */
  private readonly lichTheoLop = signal<Map<number, BuoiLich[]>>(new Map());
  private lichDaTaiChoKy: number | null = null;
  private readonly daTaiLich = signal(false);

  readonly kyDangChon = computed(() => this.hocKy().find((k) => k.id === this.hocKyId()));

  readonly coDotDangKy = computed(() => {
    const id = this.hocKyId();
    if (id <= 0) return false;
    const ky = this.kyDangChon();
    if (!ky) return false;
    return ky.dang_mo_dang_ky === true || ky.trang_thai === 'UPCOMING';
  });

  readonly cacKyThuCt = computed(() => {
    const ds = (this.ctdt()?.mon ?? [])
      .map((m) => m.ky_thu)
      .filter((k): k is number => k !== null);
    return [...new Set(ds)].sort((a, b) => a - b);
  });

  readonly monCuaKy = computed(() => {
    const ky = this.kyThuCt();
    if (ky === null) return [];
    return (this.ctdt()?.mon ?? [])
      .filter((m) => m.ky_thu === ky)
      .sort((a, b) => a.mon_hoc.ma_mon.localeCompare(b.mon_hoc.ma_mon, 'vi'));
  });

  readonly monHocLai = computed(() => {
    const khongDat = this.monKhongDat();
    return (this.ctdt()?.mon ?? [])
      .filter((m) => khongDat.has(m.mon_hoc.ma_mon))
      .sort((a, b) => a.mon_hoc.ma_mon.localeCompare(b.mon_hoc.ma_mon, 'vi'));
  });

  /** Buổi đã bị các lớp đang đăng ký chiếm — khoá `ngày|tiết`. */
  private readonly oDaChiem = computed(() => {
    const tap = new Set<string>();
    const daDangKy = this.daDangKyIds();
    for (const [lopId, ds] of this.lichTheoLop()) {
      if (!daDangKy.has(lopId)) continue;
      for (const b of ds) {
        if (b.trang_thai === 'CANCELLED') continue;
        for (let t = b.tiet_bat_dau ?? 0; t <= (b.tiet_ket_thuc ?? 0); t++) {
          tap.add(`${b.ngay_hoc}|${t}`);
        }
      }
    }
    return tap;
  });

  readonly sinhVien = computed(() => {
    const hoSo = this.auth.nguoiDung()?.ho_so;
    if (!hoSo) return '';
    const ct = this.ctdt();
    const lop = hoSo.ma_lop || hoSo.ten_lop || '';
    const nganh = hoSo.ma_nganh || ct?.nganh?.ma_nganh || '';
    const khoa = hoSo.khoa_hoc || ct?.khoa_hoc || '';
    return [hoSo.ho_ten, hoSo.ma_sv, lop, nganh, khoa].filter(Boolean).join(' · ');
  });

  constructor() {
    this.taiHocKy();
  }

  // ---------------- Tải dữ liệu ----------------

  private taiHocKy(): void {
    this.lopHocPhan.layTuyChon('semesters').subscribe({
      next: (rows) => {
        const ds = rows as HocKyChon[];
        this.hocKy.set(ds);
        this.dangTaiHocKy.set(false);
        const dangMo = ds.find((k) => k.dang_mo_dang_ky) ?? ds.find((k) => k.trang_thai === 'UPCOMING');
        if (dangMo) {
          this.hocKyId.set(dangMo.id);
          this.taiDuLieuHocKy();
        } else {
          this.hocKyId.set(0);
        }
        if (this.tab() === 'hoc-lai') this.taiDiemMonKhongDat();
        this.taiChuongTrinh();
      },
      error: () => {
        this.loi.set('Không tải được danh sách học kỳ.');
        this.dangTaiHocKy.set(false);
        this.dangTaiCt.set(false);
        this.taiChuongTrinh();
      },
    });
  }

  private taiChuongTrinh(): void {
    this.chuongTrinh.layCuaToi().subscribe({
      next: (ct) => {
        this.ctdt.set(ct);
        this.dangTaiCt.set(false);
        this.tinhKyThuTuDong();
      },
      error: () => {
        this.ctdt.set(null);
        this.dangTaiCt.set(false);
        this.loi.set('Không tải được chương trình đào tạo của bạn.');
      },
    });
  }

  /**
   * Tính kỳ thứ của sinh viên theo công thức toán học tất định:
   * Kỳ thứ = ((Năm học kỳ - Năm nhập học) * 2) + Kỳ trong năm.
   * Khóa kỳ thứ chuẩn, không cho sinh viên chọn kỳ khác (ví dụ sinh viên năm 1 chọn kỳ 9).
   * Nếu là kỳ hè (kỳ 3) -> chuyển sang chế độ Môn mở theo nguyện vọng.
   */
  private tinhKyThuTuDong(): void {
    const hk = this.kyDangChon();
    const hoSo = this.auth.nguoiDung()?.ho_so;
    const ct = this.ctdt();

    if (!hk) return;

    if (hk.ky_thu === 3) {
      this.tab.set('nguyen-vong');
      this.kyThuCt.set(null);
      this.taiMonNguyenVong();
      return;
    }

    const namNhapHoc =
      (hoSo as { nam_nhap_hoc?: number } | undefined)?.nam_nhap_hoc ??
      this.layNamNhapHoc(hoSo?.khoa_hoc || ct?.khoa_hoc || '');
    const namHocKy = this.layNamHocKy(hk.nam_hoc);
    const kyTrongNam = hk.ky_thu ?? 1;

    if (namNhapHoc && namHocKy && namHocKy >= namNhapHoc) {
      const ky = (namHocKy - namNhapHoc) * 2 + kyTrongNam;
      this.kyThuCt.set(ky);
      return;
    }

    // Dự phòng khi chưa có năm học / năm nhập học
    const daKetThuc = this.hocKy().filter((k) => k.trang_thai === 'CLOSED').length;
    const goiY = daKetThuc + 1;
    const co = this.cacKyThuCt();

    if (co.length === 0) {
      this.kyThuCt.set(goiY);
      return;
    }
    this.kyThuCt.set(co.reduce((a, b) => (Math.abs(b - goiY) < Math.abs(a - goiY) ? b : a)));
  }

  private layNamNhapHoc(khoaHoc: string): number | null {
    const match = khoaHoc.match(/K?(\d+)/i);
    if (!match) return null;
    const k = parseInt(match[1], 10);
    return 1956 + k;
  }

  private layNamHocKy(namHoc: string | undefined): number | null {
    if (!namHoc) return null;
    const match = namHoc.match(/^(\d{4})/);
    return match ? parseInt(match[1], 10) : null;
  }

  chonHocKy(su: Event): void {
    this.hocKyId.set(Number((su.target as HTMLSelectElement).value));
    this.thongBao.set('');
    this.dongPanel();
    this.lichDaTaiChoKy = null;
    this.lichTheoLop.set(new Map());
    this.daTaiLich.set(false);
    this.tinhKyThuTuDong();
    this.taiDuLieuHocKy();
    if (this.tab() === 'nguyen-vong') {
      this.taiMonNguyenVong();
    }
  }

  private taiDuLieuHocKy(): void {
    this.taiDangKyCuaToi();
  }

  private taiDangKyCuaToi(): void {
    this.dangKy.layCuaToi({ hoc_ky_id: this.hocKyId(), per_page: 100 }).subscribe({
      next: (trang) =>
        this.daDangKyIds.set(
          new Set(trang.data.filter((d) => d.trang_thai === 'ACTIVE').map((d) => d.lop_hoc_phan.id)),
        ),
      error: () => this.daDangKyIds.set(new Set()),
    });
  }

  // ---------------- Tab + chọn môn ----------------

  doiTab(tab: Tab): void {
    this.tab.set(tab);
    if (tab === 'hoc-lai') this.taiDiemMonKhongDat();
    if (tab === 'nguyen-vong') this.taiMonNguyenVong();
  }

  private taiMonNguyenVong(): void {
    const hkId = this.hocKyId();
    if (hkId <= 0) return;
    this.dangTaiNguyenVong.set(true);
    this.lopHocPhan.layDanhSach({ hoc_ky_id: hkId, per_page: 100 }).subscribe({
      next: (trang) => {
        const monMap = new Map<number, ChuongTrinhMon>();
        for (const lop of trang.data) {
          if (lop.mon_hoc && !monMap.has(lop.mon_hoc.id)) {
            monMap.set(lop.mon_hoc.id, {
              id: lop.mon_hoc.id,
              ky_thu: null,
              bat_buoc: false,
              mon_hoc: lop.mon_hoc,
            });
          }
        }
        const ds = Array.from(monMap.values()).sort((a, b) =>
          a.mon_hoc.ma_mon.localeCompare(b.mon_hoc.ma_mon, 'vi'),
        );
        this.monNguyenVong.set(ds);
        this.dangTaiNguyenVong.set(false);
      },
      error: () => {
        this.monNguyenVong.set([]);
        this.dangTaiNguyenVong.set(false);
      },
    });
  }

  chonMon(m: ChuongTrinhMon): void {
    this.monDangChon.set(m);
    this.taiLopCuaMon(m);
    this.taiLichNeuCan();
  }

  dongPanel(): void {
    this.monDangChon.set(null);
    this.lopCuaMon.set([]);
  }

  private taiLopCuaMon(m: ChuongTrinhMon): void {
    this.dangTaiLop.set(true);
    this.lopHocPhan
      .layDanhSach({ hoc_ky_id: this.hocKyId(), mon_hoc_id: m.mon_hoc.id, per_page: 100 })
      .subscribe({
        next: (trang) => {
          this.lopCuaMon.set(trang.data);
          this.dangTaiLop.set(false);
        },
        error: () => {
          this.lopCuaMon.set([]);
          this.dangTaiLop.set(false);
          this.loi.set('Không tải được danh sách lớp của môn này.');
        },
      });
  }

  // ---------------- Học lại ----------------

  private taiDiemMonKhongDat(): void {
    if (this.daTaiDiem || this.dangTaiDiem()) return;

    const daKetThuc = this.hocKy().filter((k) => k.trang_thai === 'CLOSED');
    if (daKetThuc.length === 0) {
      // Chưa có học kỳ nào đã đóng (hoặc danh sách học kỳ chưa về): để lần mở
      // tab sau thử lại, KHÔNG đánh dấu đã tải.
      this.monKhongDat.set(new Set());
      return;
    }

    this.dangTaiDiem.set(true);
    forkJoin(
      daKetThuc.map((k) => this.diem.layDiemCuaToi(k.id).pipe(catchError(() => of(null)))),
    ).subscribe({
      next: (ds) => {
        const tap = new Set<string>();
        for (const bang of ds) {
          for (const mon of bang?.mon_hoc ?? []) {
            if (mon.ket_qua === 'KHONG_DAT') tap.add(mon.ma_mon);
          }
        }
        this.monKhongDat.set(tap);
        this.daTaiDiem = true;
        this.dangTaiDiem.set(false);
      },
      error: () => {
        this.monKhongDat.set(new Set());
        this.daTaiDiem = true;
        this.dangTaiDiem.set(false);
      },
    });
  }

  // ---------------- Đăng ký lớp ----------------

  conCho(l: LopHocPhan): number {
    return Math.max(0, l.si_so_toi_da - l.si_so_hien_tai);
  }

  daDangKy(l: LopHocPhan): boolean {
    return this.daDangKyIds().has(l.id);
  }

  coTheDangKy(l: LopHocPhan): boolean {
    return (
      this.kyDangChon()?.trang_thai === 'UPCOMING' &&
      l.trang_thai === 'OPEN' &&
      this.conCho(l) > 0 &&
      !this.daDangKy(l)
    );
  }

  dangKyLop(l: LopHocPhan): void {
    if (!this.coTheDangKy(l) || this.dangGui()) return;

    this.dangGui.set(l.id);
    this.loi.set('');
    this.thongBao.set('');

    this.dangKy.dangKyCuaToi(l.id).subscribe({
      next: () => {
        this.dangGui.set(0);
        this.thongBao.set(`Đã đăng ký lớp ${l.ma_lop_hp}.`);
        this.daDangKyIds.update((s) => new Set([...s, l.id]));
      },
      error: (error: { error?: { message?: string; ma_loi?: string } }) => {
        this.dangGui.set(0);
        this.loi.set(this.thongDiepLoi(error));
        // Trùng lịch có thể do lớp vừa được xếp buổi — tải lại lịch để cột Trùng đúng.
        if (error?.error?.ma_loi === 'SCHEDULE_CONFLICT') this.lichDaTaiChoKy = null;
      },
    });
  }

  private thongDiepLoi(error: { error?: { message?: string; ma_loi?: string } }): string {
    switch (error?.error?.ma_loi) {
      case 'SECTION_FULL':
        return 'Lớp đã đầy. Chọn lớp khác.';
      case 'DUPLICATE_ENROLLMENT':
        return 'Bạn đã đăng ký lớp này.';
      case 'SCHEDULE_CONFLICT':
        return 'Lớp trùng lịch với lớp bạn đã đăng ký.';
      case 'OUTSIDE_REGISTRATION':
        return 'Ngoài thời gian đăng ký của học kỳ này.';
      case 'SEMESTER_CLOSED':
        return 'Học kỳ đã đóng, không đăng ký được nữa.';
      default:
        return error?.error?.message ?? 'Không đăng ký được lớp này.';
    }
  }

  // ---------------- Lịch học ----------------

  /**
   * Tải buổi học của cả học kỳ để dựng cột Lịch và Trùng.
   *
   * Chỉ tải khi người dùng thực sự mở một môn — màn đăng ký mở lên không cần
   * lịch. Lỗi API lịch không chặn đăng ký: cột Trùng hiện "—" thay vì đoán bừa.
   */
  private taiLichNeuCan(): void {
    const hocKyId = this.hocKyId();
    if (!hocKyId || this.lichDaTaiChoKy === hocKyId) return;

    this.lichDaTaiChoKy = hocKyId;
    this.lichHoc.layTatCa({ hoc_ky_id: hocKyId }).subscribe({
      next: (ds) => {
        const bang = new Map<number, BuoiLich[]>();
        for (const b of ds) {
          const lopId = b.lop_hoc_phan?.id;
          if (!lopId) continue;
          const cu = bang.get(lopId) ?? [];
          cu.push(b);
          bang.set(lopId, cu);
        }
        this.lichTheoLop.set(bang);
        this.daTaiLich.set(true);
      },
      error: () => {
        this.lichTheoLop.set(new Map());
        this.daTaiLich.set(false);
      },
    });
  }

  moTaLich(lopId: number): string {
    const ds = this.lichTheoLop().get(lopId) ?? [];
    const nhom = new Map<string, string>();

    for (const b of ds) {
      if (b.trang_thai === 'CANCELLED') continue;
      const thu = this.thuTrongTuan(b.ngay_hoc);
      const tiet =
        b.tiet_bat_dau && b.tiet_ket_thuc
          ? `${b.tiet_bat_dau}–${b.tiet_ket_thuc}`
          : `${b.gio_bat_dau}–${b.gio_ket_thuc}`;
      nhom.set(`${thu} ${tiet}`, `${thu} ${tiet}`);
    }

    return [...nhom.values()].slice(0, 3).join(' · ') || '—';
  }

  tinhTrangTrung(lopId: number): TinhTrangTrung {
    if (!this.daTaiLich()) return 'chua-ro';

    const daChiem = this.oDaChiem();
    const ds = this.lichTheoLop().get(lopId) ?? [];

    for (const b of ds) {
      if (b.trang_thai === 'CANCELLED') continue;
      for (let t = b.tiet_bat_dau ?? 0; t <= (b.tiet_ket_thuc ?? 0); t++) {
        if (daChiem.has(`${b.ngay_hoc}|${t}`)) return 'trung';
      }
    }
    return 'khong';
  }

  /** `2026-11-16` → `T2` … `CN`. Tạo Date theo giờ địa phương để không lệch ngày. */
  private thuTrongTuan(ngay: string): string {
    const [nam, thang, ngayTrong] = ngay.split(' ')[0].split('-').map(Number);
    if (!nam || !thang || !ngayTrong) return '';
    const thu = new Date(nam, thang - 1, ngayTrong).getDay();
    return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][thu] ?? '';
  }

  tenChuongTrinh(ct: ChuongTrinhDaoTao): string {
    const nganh = ct.nganh?.ten_nganh ?? ct.ten;
    return `${nganh} khóa ${ct.khoa_hoc}`;
  }
}
