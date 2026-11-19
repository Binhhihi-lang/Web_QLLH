import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import {
  ChuongTrinhDaoTao,
  ChuongTrinhMon,
  ChuongTrinhService,
} from '@core/services/chuong-trinh.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { EmptyState } from '@shared/ui/empty-state';
import { LoadingState } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';

interface NhomKySinhVien {
  kyThu: number | null;
  nhanKy: string;
  tongMon: number;
  tongTinChi: number;
  danhSachMon: ChuongTrinhMon[];
}

@Component({
  selector: 'app-chuong-trinh-khung',
  standalone: true,
  imports: [AppAlert, AppButton, EmptyState, FormsModule, LoadingState, PageHeader, RouterLink],
  template: `
    <app-page-header
      title="Chương trình học"
      description="Lộ trình các môn học theo từng học kỳ trong chương trình đào tạo của bạn."
    >
      <app-button variant="primary" routerLink="/dang-ky-hoc-phan">
        <span class="material-icons nut-ic" aria-hidden="true">how_to_reg</span>
        Đăng ký học phần
      </app-button>
      <app-button variant="secondary" routerLink="/dang-ky-cua-toi">
        <span class="material-icons nut-ic" aria-hidden="true">history</span>
        Lịch sử đăng ký
      </app-button>
    </app-page-header>

    @if (dangTai()) {
      <app-loading-state label="Đang tải chương trình học đào tạo…" />
    } @else if (loi()) {
      <app-alert muc="danger">{{ loi() }}</app-alert>
      <div class="nut-thu-lai">
        <app-button variant="secondary" (click)="taiChuongTrinh()">Thử lại</app-button>
      </div>
    } @else if (!ctdt()) {
      <app-empty-state
        icon="school"
        title="Chưa được gán chương trình học"
        description="Tài khoản của bạn hiện chưa được phân công chương trình đào tạo. Vui lòng liên hệ Phòng Đào tạo hoặc cố vấn học tập để được hỗ trợ."
      >
        <app-button variant="secondary" routerLink="/tai-khoan">
          Kiểm tra hồ sơ cá nhân
        </app-button>
      </app-empty-state>
    } @else {
      @if (ctdt(); as ct) {
        <!-- Khối thông tin định danh & số liệu tổng quan -->
        <section class="the-tong-quan" aria-label="Thông tin chương trình đào tạo">
          <div class="thong-tin-chinh">
            <div class="dong-ma">
              <span class="ma-ctdt">{{ ct.ma_ctdt }}</span>
              <span class="khoa-hoc">Khóa {{ ct.khoa_hoc }}</span>
              <span class="trang-thai-badge" [class.trang-thai-badge--active]="ct.trang_thai">
                {{ ct.trang_thai ? 'Đang áp dụng' : 'Tạm ngưng' }}
              </span>
            </div>
            <h2>{{ ct.ten }}</h2>
            <p class="nganh-khoa">
              <strong>Ngành:</strong> {{ ct.nganh?.ten_nganh ?? '—' }} ({{ ct.nganh?.ma_nganh ?? '—' }})
              @if (ct.nganh?.khoa; as kh) {
                · <strong>Khoa:</strong> {{ kh.ten_khoa }}
              }
            </p>
          </div>

          <div class="luoi-so-lieu">
            <div class="o-so-lieu">
              <span class="gia-tri">{{ ct.so_nam ?? 4 }} năm</span>
              <span class="nhan">Thời gian ({{ ct.so_ky ?? 8 }} kỳ)</span>
            </div>
            <div class="o-so-lieu">
              <span class="gia-tri gia-tri--primary">{{ ct.tong_tin_chi }}</span>
              <span class="nhan">Tổng tín chỉ</span>
            </div>
            <div class="o-so-lieu">
              <span class="gia-tri">{{ ct.so_mon }}</span>
              <span class="nhan">Tổng số môn</span>
            </div>
            <div class="o-so-lieu">
              <span class="gia-tri">{{ tongMonBatBuoc() }}/{{ tongMonTuChon() }}</span>
              <span class="nhan">Bắt buộc / Tự chọn</span>
            </div>
          </div>
        </section>

        <!-- Thanh tìm kiếm và bộ lọc -->
        <div class="thanh-bo-loc">
          <div class="o-tim-kiem">
            <span class="material-icons ic-tim" aria-hidden="true">search</span>
            <input
              type="text"
              placeholder="Tìm theo mã môn hoặc tên môn học..."
              [ngModel]="tuKhoa()"
              (ngModelChange)="tuKhoa.set($event)"
            />
            @if (tuKhoa()) {
              <button type="button" class="nut-xoa" (click)="tuKhoa.set('')" aria-label="Xóa từ khóa">
                <span class="material-icons" aria-hidden="true">close</span>
              </button>
            }
          </div>

          <div class="nhom-loc">
            <label class="nhan-loc">
              <span>Loại môn:</span>
              <select [ngModel]="loaiMonLoc()" (ngModelChange)="loaiMonLoc.set($event)">
                <option value="ALL">Tất cả loại</option>
                <option value="BAT_BUOC">Bắt buộc</option>
                <option value="TU_CHON">Tự chọn</option>
              </select>
            </label>

            <label class="nhan-loc">
              <span>Kỳ thứ:</span>
              <select [ngModel]="kyLoc()" (ngModelChange)="kyLoc.set($event)">
                <option value="ALL">Tất cả các kỳ</option>
                @for (k of danhSachKyThu(); track k) {
                  <option [value]="k">Kỳ {{ k }}</option>
                }
              </select>
            </label>
          </div>
        </div>

        @if (nhomKyHienThi().length === 0) {
          <app-empty-state
            icon="search_off"
            title="Không tìm thấy môn học nào"
            description="Không có môn học nào phù hợp với từ khóa hoặc bộ lọc đã chọn."
          >
            <app-button variant="secondary" (click)="datLaiBoLoc()">Đặt lại bộ lọc</app-button>
          </app-empty-state>
        } @else {
          <!-- Danh sách các kỳ -->
          <div class="danh-sach-ky">
            @for (nhom of nhomKyHienThi(); track nhom.kyThu) {
              <section class="the-ky" [attr.aria-label]="nhom.nhanKy">
                <header class="dau-ky">
                  <div class="tieu-de-ky">
                    <span class="material-icons ic-ky" aria-hidden="true">calendar_today</span>
                    <h3>{{ nhom.nhanKy }}</h3>
                  </div>
                  <div class="thong-ke-ky">
                    <span class="pill-thong-ke">{{ nhom.tongMon }} môn</span>
                    <span class="pill-thong-ke pill-thong-ke--tin-chi">{{ nhom.tongTinChi }} tín chỉ</span>
                  </div>
                </header>

                <div class="bang-cuon">
                  <table class="bang-mon">
                    <thead>
                      <tr>
                        <th class="cot-stt">STT</th>
                        <th class="cot-ma">Mã môn</th>
                        <th>Tên môn học / học phần</th>
                        <th class="can-phai cot-tc">Số tín chỉ</th>
                        <th class="cot-loai">Loại môn</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (m of nhom.danhSachMon; track m.id; let idx = $index) {
                        <tr>
                          <td class="cot-stt phu">{{ idx + 1 }}</td>
                          <td class="cot-ma">
                            <span class="ma-mon">{{ m.mon_hoc.ma_mon }}</span>
                          </td>
                          <td class="ten-mon">
                            <strong>{{ m.mon_hoc.ten_mon }}</strong>
                          </td>
                          <td class="can-phai cot-tc">
                            <span class="so-tc">{{ m.mon_hoc.so_tin_chi }}</span>
                          </td>
                          <td class="cot-loai">
                            <span
                              class="nhan-loai"
                              [class.nhan-loai--bat-buoc]="m.bat_buoc"
                              [class.nhan-loai--tu-chon]="!m.bat_buoc"
                            >
                              {{ m.bat_buoc ? 'Bắt buộc' : 'Tự chọn' }}
                            </span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </section>
            }
          </div>
        }
      }
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .nut-ic {
      font-size: 18px;
      margin-right: 4px;
      vertical-align: middle;
    }

    .nut-thu-lai {
      margin-top: 12px;
    }

    /* ---- Thẻ tổng quan ---- */
    .the-tong-quan {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: var(--shadow-sm);
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 24px;
      align-items: center;
    }

    .dong-ma {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .ma-ctdt {
      font-family: var(--font-mono, monospace);
      font-weight: 700;
      color: var(--color-primary);
      background: var(--color-primary-soft);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      font-size: var(--text-caption);
    }

    .khoa-hoc {
      font-size: var(--text-caption);
      color: var(--color-ink-muted);
      font-weight: 600;
    }

    .trang-thai-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: var(--text-caption);
      font-weight: 600;
      background: var(--color-surface-alt);
      color: var(--color-ink-muted);
    }

    .trang-thai-badge--active {
      background: var(--color-success-soft);
      color: var(--color-on-success-soft);
    }

    .the-tong-quan h2 {
      font-size: var(--text-h2);
      font-weight: 700;
      color: var(--color-ink);
      margin: 0 0 8px;
    }

    .nganh-khoa {
      margin: 0;
      font-size: var(--text-small);
      color: var(--color-ink-muted);
    }

    .luoi-so-lieu {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .o-so-lieu {
      background: var(--color-surface-alt);
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius);
      padding: 12px 18px;
      text-align: center;
      min-width: 120px;
    }

    .o-so-lieu .gia-tri {
      display: block;
      font-size: 20px;
      font-weight: 700;
      color: var(--color-ink);
      line-height: 1.2;
    }

    .o-so-lieu .gia-tri--primary {
      color: var(--color-primary);
    }

    .o-so-lieu .nhan {
      display: block;
      font-size: var(--text-caption);
      color: var(--color-ink-muted);
      margin-top: 4px;
    }

    /* ---- Thanh bộ lọc ---- */
    .thanh-bo-loc {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .o-tim-kiem {
      position: relative;
      flex: 1;
      min-width: 260px;
      max-width: 480px;
    }

    .ic-tim {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-ink-muted);
      font-size: 20px;
      pointer-events: none;
    }

    .o-tim-kiem input {
      width: 100%;
      font-family: inherit;
      font-size: var(--text-small);
      padding: 9px 36px 9px 40px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
    }

    .o-tim-kiem input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    .nut-xoa {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--color-ink-muted);
      cursor: pointer;
      display: flex;
      padding: 2px;
    }

    .nhom-loc {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .nhan-loc {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: var(--text-small);
      color: var(--color-ink-muted);
      font-weight: 500;
    }

    .nhan-loc select {
      font-family: inherit;
      font-size: var(--text-small);
      padding: 8px 12px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
    }

    /* ---- Danh sách kỳ ---- */
    .danh-sach-ky {
      display: grid;
      gap: 20px;
    }

    .the-ky {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .dau-ky {
      padding: 14px 20px;
      background: var(--color-surface-alt);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .tieu-de-ky {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .ic-ky {
      color: var(--color-primary);
      font-size: 20px;
    }

    .dau-ky h3 {
      font-size: var(--text-h3);
      font-weight: 700;
      color: var(--color-ink);
      margin: 0;
    }

    .thong-ke-ky {
      display: flex;
      gap: 8px;
    }

    .pill-thong-ke {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: var(--text-caption);
      font-weight: 600;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      color: var(--color-ink-muted);
    }

    .pill-thong-ke--tin-chi {
      background: var(--color-primary-soft);
      border-color: transparent;
      color: var(--color-primary);
    }

    /* Bảng môn */
    .bang-cuon {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--text-small);
    }

    thead th {
      text-align: left;
      font-weight: 600;
      font-size: var(--text-caption);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--color-ink-muted);
      background: var(--color-surface);
      padding: 10px 16px;
      border-bottom: 1px solid var(--color-border);
      white-space: nowrap;
    }

    tbody td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border-soft);
      color: var(--color-ink);
      vertical-align: middle;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    tbody tr:hover {
      background: var(--color-surface-alt);
    }

    .cot-stt {
      width: 60px;
      text-align: center;
    }

    .cot-ma {
      width: 120px;
    }

    .cot-tc {
      width: 110px;
    }

    .cot-loai {
      width: 120px;
    }

    .can-phai {
      text-align: right;
    }

    .phu {
      color: var(--color-ink-muted);
    }

    .ma-mon {
      font-family: var(--font-mono, monospace);
      font-weight: 700;
      color: var(--color-primary);
    }

    .so-tc {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    .nhan-loai {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: var(--text-caption);
      font-weight: 600;
    }

    .nhan-loai--bat-buoc {
      background: var(--color-primary-soft);
      color: var(--color-primary);
    }

    .nhan-loai--tu-chon {
      background: var(--color-surface-alt);
      color: var(--color-ink-muted);
      border: 1px solid var(--color-border);
    }

    @media (max-width: 768px) {
      .the-tong-quan {
        grid-template-columns: 1fr;
      }

      .luoi-so-lieu {
        grid-template-columns: repeat(2, 1fr);
      }

      .thanh-bo-loc {
        flex-direction: column;
        align-items: stretch;
      }

      .o-tim-kiem {
        max-width: none;
      }
    }
  `,
})
export class ChuongTrinhKhungSinhVien {
  private readonly chuongTrinh = inject(ChuongTrinhService);
  private readonly auth = inject(AuthService);

  readonly ctdt = signal<ChuongTrinhDaoTao | null>(null);
  readonly dangTai = signal(true);
  readonly loi = signal('');

  readonly tuKhoa = signal('');
  readonly loaiMonLoc = signal<'ALL' | 'BAT_BUOC' | 'TU_CHON'>('ALL');
  readonly kyLoc = signal<string>('ALL');

  readonly tongMonBatBuoc = computed(() => {
    const ds = this.ctdt()?.mon ?? [];
    return ds.filter((m) => m.bat_buoc).length;
  });

  readonly tongMonTuChon = computed(() => {
    const ds = this.ctdt()?.mon ?? [];
    return ds.filter((m) => !m.bat_buoc).length;
  });

  readonly danhSachKyThu = computed(() => {
    const ds = this.ctdt()?.mon ?? [];
    const cacKy = ds
      .map((m) => m.ky_thu)
      .filter((k): k is number => k !== null && k !== undefined);
    return [...new Set(cacKy)].sort((a, b) => a - b);
  });

  readonly nhomKyHienThi = computed<NhomKySinhVien[]>(() => {
    const dsMon = this.ctdt()?.mon ?? [];
    if (dsMon.length === 0) return [];

    const q = this.tuKhoa().trim().toLowerCase();
    const loai = this.loaiMonLoc();
    const ky = this.kyLoc();

    // 1. Lọc theo từ khóa và điều kiện loại môn, kỳ
    const monDaLoc = dsMon.filter((m) => {
      if (q) {
        const ma = m.mon_hoc.ma_mon.toLowerCase();
        const ten = m.mon_hoc.ten_mon.toLowerCase();
        if (!ma.includes(q) && !ten.includes(q)) return false;
      }
      if (loai === 'BAT_BUOC' && !m.bat_buoc) return false;
      if (loai === 'TU_CHON' && m.bat_buoc) return false;
      if (ky !== 'ALL') {
        const kyNum = parseInt(ky, 10);
        if (m.ky_thu !== kyNum) return false;
      }
      return true;
    });

    // 2. Nhóm theo kỳ thứ
    const banDoKy = new Map<number | null, ChuongTrinhMon[]>();
    for (const m of monDaLoc) {
      const k = m.ky_thu ?? null;
      if (!banDoKy.has(k)) {
        banDoKy.set(k, []);
      }
      banDoKy.get(k)!.push(m);
    }

    // 3. Xếp thứ tự các nhóm (kỳ 1, 2, ... null ở cuối)
    const cacKy = Array.from(banDoKy.keys()).sort((a, b) => {
      if (a === null) return 1;
      if (b === null) return -1;
      return a - b;
    });

    return cacKy.map((k) => {
      const ds = banDoKy.get(k)!.sort((x, y) =>
        x.mon_hoc.ma_mon.localeCompare(y.mon_hoc.ma_mon, 'vi'),
      );
      const tongTinChi = ds.reduce((sum, item) => sum + (item.mon_hoc.so_tin_chi ?? 0), 0);
      return {
        kyThu: k,
        nhanKy: k !== null ? `Học kỳ ${k}` : 'Chưa phân kỳ',
        tongMon: ds.length,
        tongTinChi,
        danhSachMon: ds,
      };
    });
  });

  constructor() {
    this.taiChuongTrinh();
  }

  taiChuongTrinh(): void {
    this.dangTai.set(true);
    this.loi.set('');
    this.chuongTrinh.layCuaToi().subscribe({
      next: (ct) => {
        this.ctdt.set(ct);
        this.dangTai.set(false);
      },
      error: () => {
        this.loi.set('Không tải được chương trình khung đào tạo. Vui lòng thử lại sau.');
        this.dangTai.set(false);
      },
    });
  }

  datLaiBoLoc(): void {
    this.tuKhoa.set('');
    this.loaiMonLoc.set('ALL');
    this.kyLoc.set('ALL');
  }
}
