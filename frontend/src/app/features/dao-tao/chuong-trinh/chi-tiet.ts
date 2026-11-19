import { Component, HostListener, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { EmptyState } from '@shared/ui/empty-state';
import { LoadingState } from '@shared/ui/loading';
import {
  ChuongTrinhDaoTao,
  ChuongTrinhMon,
  ChuongTrinhService,
  DongImportChuongTrinh,
  KetQuaImportChuongTrinh,
} from '@core/services/chuong-trinh.service';
import { LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { TuyChonMonHoc } from '@core/models/dao-tao.model';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { PageHeader } from '@shared/ui/page-header';
import { SearchInput } from '@shared/ui/search-input';
import { StatusBadge } from '@shared/ui/status-badge';

interface NhomKy {
  /** Khoá ổn định cho `track` — `'chua-gan'` hoặc `'k1'`. */
  khoa: string;
  nhan: string;
  mon: ChuongTrinhMon[];
}

const KY_THU_TOI_DA = 10;

/**
 * Chi tiết chương trình đào tạo — SCR mới (mockup `docs/design/ctdt-va-quyen-buoi-hoc.html` §05).
 *
 * Bảng nhóm theo kỳ thứ bằng `rowspan`: nhìn một màn thấy cả bốn năm, thay vì
 * lọc từng kỳ. Môn chưa gán kỳ nằm ở nhóm cuối và có cảnh báo riêng, vì sinh
 * viên không thấy chúng khi đăng ký.
 */
@Component({
  selector: 'app-chuong-trinh-chi-tiet',
  standalone: true,
  imports: [
    AppAlert,
    AppButton,
    ConfirmDialog,
    EmptyState,
    LoadingState,
    PageHeader,
    SearchInput,
    StatusBadge,
  ],
  template: `
    @if (dangTai()) {
      <app-loading-state label="Đang tải chương trình đào tạo…" />
    } @else if (loi()) {
      <app-alert muc="danger">{{ loi() }}</app-alert>
      <app-button variant="secondary" (click)="taiLai()">Thử lại</app-button>
    } @else if (ctdt(); as ct) {
      <p class="duong-dan">
        {{ ct.ma_ctdt }}
        @if (ct.nganh) {
          · {{ ct.nganh.ma_nganh }} — {{ ct.nganh.ten_nganh }}
        }
        · {{ ct.khoa_hoc }}
        <app-status-badge
          [value]="ct.trang_thai ? 'ACTIVE' : 'INACTIVE'"
          [label]="ct.trang_thai ? 'Đang áp dụng' : 'Ngừng áp dụng'"
        />
      </p>

      <app-page-header [title]="ct.ten" [description]="tomTat()">
        <app-button variant="secondary" (click)="moImport()">
          <span class="material-icons nut-ic" aria-hidden="true">upload_file</span>
          Import CSV
        </app-button>
        <app-button variant="primary" (click)="moThemMon()">
          <span class="material-icons nut-ic" aria-hidden="true">add</span>
          Thêm môn
        </app-button>
      </app-page-header>

      @if (thongBao()) {
        <app-alert [muc]="thongBaoMuc()">{{ thongBao() }}</app-alert>
      }

      @if (soMonChuaGanKy() > 0) {
        <app-alert muc="warning" [title]="soMonChuaGanKy() + ' môn chưa gán kỳ thứ.'">
          Sinh viên không thấy các môn này khi đăng ký cho tới khi gán kỳ.
        </app-alert>
      }

      @if (nhomMon().length === 0) {
        <app-empty-state
          icon="library_books"
          title="Chương trình chưa có môn"
          description="Thêm môn và gán kỳ thứ để sinh viên thấy môn khi đăng ký."
        >
          <app-button variant="primary" (click)="moThemMon()">Thêm môn đầu tiên</app-button>
        </app-empty-state>
      } @else {
        <div class="bang-cuon">
          <table class="bang-mon">
            <thead>
              <tr>
                <th class="cot-ky">Kỳ thứ</th>
                <th>Mã môn</th>
                <th>Tên môn</th>
                <th class="can-phai">TC</th>
                <th>Loại</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              @for (nhom of nhomMon(); track nhom.khoa) {
                @for (m of nhom.mon; track m.id; let i = $index) {
                  <tr [class.chua-gan]="m.ky_thu === null">
                    @if (i === 0) {
                      <td [attr.rowspan]="nhom.mon.length" class="cot-ky">{{ nhom.nhan }}</td>
                    }
                    <td class="ma">{{ m.mon_hoc.ma_mon }}</td>
                    <td>{{ m.mon_hoc.ten_mon }}</td>
                    <td class="can-phai">{{ m.mon_hoc.so_tin_chi }}</td>
                    <td>
                      <app-status-badge
                        [value]="m.bat_buoc ? 'ACTIVE' : 'INACTIVE'"
                        [label]="m.bat_buoc ? 'Bắt buộc' : 'Tự chọn'"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        class="nut-thao-tac"
                        aria-haspopup="menu"
                        [attr.aria-expanded]="menuMo()?.id === m.id"
                        (click)="moMenu(m, $event)"
                      >
                        Thao tác
                        <span class="material-icons" aria-hidden="true">expand_more</span>
                      </button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      }

      @if (menuMo(); as m) {
        <ul
          class="menu-noi"
          role="menu"
          [style.top.px]="m.top"
          [style.left.px]="m.left"
          aria-label="Thao tác môn trong chương trình"
        >
          <li><button type="button" role="menuitem" (click)="moSuaKy(m.mon)">Gán kỳ thứ</button></li>
          <li><button type="button" role="menuitem" (click)="doiLoai(m.mon)">Đổi loại</button></li>
          <li>
            <button type="button" role="menuitem" class="nguy-hiem" (click)="hoiXoaMon(m.mon)">
              Xóa khỏi chương trình
            </button>
          </li>
        </ul>
      }

      @if (dangThemMon()) {
        <div class="lop-phu">
          <div class="nen" (click)="dongThemMon()" aria-hidden="true"></div>
          <div class="hop hop--rong" role="dialog" aria-modal="true" aria-labelledby="td-them-mon">
            <h2 id="td-them-mon">Thêm môn vào chương trình</h2>
            <p class="phu-hop">
              Chọn một hoặc nhiều môn, sau đó gán kỳ thứ và loại cho cả lô.
            </p>

            <div class="luoi">
              <label class="truong">
                <span>Kỳ thứ</span>
                <select [value]="kyThuLo() ?? ''" (change)="doiKyThuLo($event)">
                  <option value="">Chưa gán kỳ</option>
                  @for (k of cacKyThu; track k) {
                    <option [value]="k" [selected]="kyThuLo() === k">Kỳ {{ k }}</option>
                  }
                </select>
              </label>

              <label class="truong">
                <span>Loại môn</span>
                <select [value]="batBuocLo() ? 'true' : 'false'" (change)="doiLoaiLo($event)">
                  <option value="true" [selected]="batBuocLo()">Bắt buộc</option>
                  <option value="false" [selected]="!batBuocLo()">Tự chọn</option>
                </select>
              </label>
            </div>

            <app-search-input
              id="tim-mon"
              placeholder="Tìm môn theo mã hoặc tên…"
              [value]="tuKhoaMon()"
              (valueChange)="timMon($event)"
            />

            @if (dangTaiMon()) {
              <app-loading-state label="Đang tải danh sách môn…" padding="20px 0" />
            } @else if (dsMonHienThi().length === 0) {
              <p class="trong">Không còn môn nào phù hợp để thêm.</p>
            } @else {
              <div class="ds-mon">
                @for (m of dsMonHienThi(); track m.id) {
                  <label class="mon-chon">
                    <input
                      type="checkbox"
                      [checked]="daChon().has(m.id)"
                      (change)="doiChonMon(m.id, $event)"
                    />
                    <span class="ma">{{ m.ma_mon }}</span>
                    <span class="ten">{{ m.ten_mon }}</span>
                    <span class="tc">{{ m.so_tin_chi }} TC</span>
                  </label>
                }
              </div>
            }

            @if (loiThemMon()) {
              <p class="loi" role="alert">{{ loiThemMon() }}</p>
            }

            <div class="chan-hop">
              <span class="dem">{{ daChon().size }} môn đã chọn</span>
              <app-button variant="secondary" (click)="dongThemMon()">Hủy</app-button>
              <app-button
                variant="primary"
                [disabled]="daChon().size === 0"
                [loading]="dangLuuMon()"
                (click)="luuThemMon()"
              >
                Thêm vào chương trình
              </app-button>
            </div>
          </div>
        </div>
      }

      @if (dangImport()) {
        <div class="lop-phu">
          <div class="nen" (click)="dongImport()" aria-hidden="true"></div>
          <div class="hop hop--rong" role="dialog" aria-modal="true" aria-labelledby="td-import">
            <h2 id="td-import">Import môn từ CSV</h2>
            <p class="phu-hop">
              Mỗi dòng một môn: <code>ma_mon,ky_thu,bat_buoc</code>. Ví dụ
              <code>MATH101,1,1</code>. Cột <code>ky_thu</code> để trống nghĩa là chưa gán kỳ.
            </p>

            <label class="truong">
              <span>Tệp CSV</span>
              <input type="file" accept=".csv,text/csv,text/plain" (change)="docTep($event)" />
            </label>

            <label class="truong">
              <span>Hoặc dán nội dung</span>
              <textarea
                rows="6"
                placeholder="ma_mon,ky_thu,bat_buoc&#10;MATH101,1,1&#10;ENG101,1,1"
                [value]="noiDungCsv()"
                (input)="doiNoiDungCsv($event)"
              ></textarea>
            </label>

            <p class="dem-dong">{{ dongCsv().length }} dòng hợp lệ sẽ được gửi.</p>

            @if (ketQuaImport(); as kq) {
              <div class="ket-qua">
                <app-alert [muc]="kq.that_bai > 0 ? 'warning' : 'success'">
                  {{ kq.thanh_cong }}/{{ kq.chi_tiet.length }} dòng thành công.
                  @if (kq.that_bai > 0) {
                    {{ kq.that_bai }} dòng lỗi — xem chi tiết bên dưới.
                  }
                </app-alert>
                <ul class="ds-kq">
                  @for (d of kq.chi_tiet; track $index) {
                    <li [class.loi-dong]="d.ket_qua === 'THAT_BAI'">
                      <span class="ma">{{ d.ma_mon }}</span>
                      @if (d.ket_qua === 'THAT_BAI') {
                        <span class="ly-do">{{ d.message || d.ma_loi || 'Không thêm được.' }}</span>
                        @if (d.ma_loi) {
                          <code class="ma-loi">{{ d.ma_loi }}</code>
                        }
                      } @else {
                        <span class="ok">Đã thêm</span>
                      }
                    </li>
                  }
                </ul>
              </div>
            }

            @if (loiImport()) {
              <p class="loi" role="alert">{{ loiImport() }}</p>
            }

            <div class="chan-hop">
              <app-button variant="secondary" (click)="dongImport()">Đóng</app-button>
              <app-button
                variant="primary"
                [disabled]="dongCsv().length === 0"
                [loading]="dangGuiImport()"
                (click)="guiImport()"
              >
                Import
              </app-button>
            </div>
          </div>
        </div>
      }

      @if (dangSuaKy(); as m) {
        <div class="lop-phu">
          <div class="nen" (click)="dongSuaKy()" aria-hidden="true"></div>
          <div class="hop" role="dialog" aria-modal="true" aria-labelledby="td-sua-ky">
            <h2 id="td-sua-ky">Gán kỳ thứ</h2>
            <p class="phu-hop">
              <span class="ma">{{ m.mon_hoc.ma_mon }}</span> — {{ m.mon_hoc.ten_mon }}
            </p>

            <div class="luoi">
              <label class="truong">
                <span>Kỳ thứ</span>
                <select autofocus [value]="kyMoi() ?? ''" (change)="doiKyMoi($event)">
                  <option value="">Chưa gán kỳ</option>
                  @for (k of cacKyThu; track k) {
                    <option [value]="k" [selected]="kyMoi() === k">Kỳ {{ k }}</option>
                  }
                </select>
              </label>

              <label class="truong">
                <span>Loại môn</span>
                <select [value]="loaiMoi() ? 'true' : 'false'" (change)="doiLoaiMoi($event)">
                  <option value="true" [selected]="loaiMoi()">Bắt buộc</option>
                  <option value="false" [selected]="!loaiMoi()">Tự chọn</option>
                </select>
              </label>
            </div>

            @if (loiSuaKy()) {
              <p class="loi" role="alert">{{ loiSuaKy() }}</p>
            }

            <div class="chan-hop">
              <app-button variant="secondary" (click)="dongSuaKy()">Hủy</app-button>
              <app-button variant="primary" [loading]="dangLuuKy()" (click)="luuSuaKy()">Lưu</app-button>
            </div>
          </div>
        </div>
      }

      @if (dangXoaMon(); as m) {
        <app-confirm-dialog
          tieuDe="Xóa môn khỏi chương trình"
          [moTa]="
            'Môn ' + m.mon_hoc.ma_mon + ' — ' + m.mon_hoc.ten_mon + ' sẽ bị bỏ khỏi chương trình này. Môn học vẫn còn trong danh mục.'
          "
          [dangXuLy]="dangXoa()"
          [lyDoChan]="lyDoChan()"
          (dongY)="xacNhanXoaMon()"
          (huy)="dangXoaMon.set(null)"
        />
      }
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .nut-ic {
      font-size: 17px;
    }

    .duong-dan {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 8px;
      font-family: var(--font-mono, monospace);
      font-size: var(--text-caption);
      color: var(--color-ink-muted);
    }

    app-alert {
      display: block;
      margin-bottom: 12px;
    }

    /* Bảng rộng hơn màn 390px: cuộn trong khung, không đẩy cả trang. */
    .bang-cuon {
      overflow-x: auto;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }

    .bang-mon {
      width: 100%;
      min-width: 560px;
      border-collapse: collapse;
      font-size: var(--text-small);
    }

    .bang-mon thead th {
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

    .bang-mon tbody td {
      padding: 9px 14px;
      border-bottom: 1px solid var(--color-border-soft);
      color: var(--color-ink);
      vertical-align: middle;
    }

    .bang-mon tbody tr:hover {
      background: var(--color-surface-alt);
    }

    /* Nhóm chưa gán kỳ nằm cuối bảng — tô nền để không lẫn với các kỳ thật. */
    .bang-mon tbody tr.chua-gan {
      background: var(--color-warning-soft);
    }

    .bang-mon tbody tr.chua-gan:hover {
      background: var(--color-warning-soft);
    }

    .cot-ky {
      width: 96px;
      font-weight: 600;
      white-space: nowrap;
      vertical-align: top;
    }

    .bang-mon thead th.cot-ky {
      vertical-align: middle;
    }

    .can-phai {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .ma {
      font-family: var(--font-mono, monospace);
      font-size: var(--text-small);
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
      min-width: 210px;
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

    /* ---- Hộp thoại ---- */
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
      max-width: 520px;
      max-height: calc(100vh - 40px);
      overflow-y: auto;
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: 22px;
    }

    .hop--rong {
      max-width: 640px;
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
      line-height: 1.55;
    }

    .phu-hop code {
      font-family: var(--font-mono, monospace);
      font-size: var(--text-caption);
      padding: 1px 4px;
      border-radius: var(--radius-sm);
      background: var(--color-surface-alt);
    }

    .luoi {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }

    .truong {
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin-bottom: 12px;
      font-size: var(--text-small);
      font-weight: 600;
      color: var(--color-ink-muted);
    }

    .luoi .truong {
      margin-bottom: 0;
    }

    .truong input[type='text'],
    .truong input[type='file'],
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
      font-family: var(--font-mono, monospace);
    }

    .truong input:focus,
    .truong select:focus,
    .truong textarea:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    .ds-mon {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-height: 260px;
      overflow-y: auto;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      padding: 6px;
      margin-top: 10px;
    }

    .mon-chon {
      display: flex;
      align-items: baseline;
      gap: 8px;
      padding: 7px 8px;
      border-radius: var(--radius-sm);
      font-size: var(--text-small);
      color: var(--color-ink);
      cursor: pointer;
    }

    .mon-chon:hover {
      background: var(--color-surface-alt);
    }

    .mon-chon input {
      width: 15px;
      height: 15px;
      accent-color: var(--color-primary);
      flex: none;
    }

    .mon-chon .ten {
      flex: 1;
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .mon-chon .tc {
      flex: none;
      font-size: var(--text-caption);
      color: var(--color-ink-subtle);
    }

    .trong,
    .dem-dong {
      margin: 10px 0 0;
      font-size: var(--text-small);
      color: var(--color-ink-muted);
    }

    .loi {
      margin: 10px 0 0;
      padding: 9px 12px;
      border-radius: var(--radius);
      background: var(--color-danger-soft);
      color: var(--color-on-danger-soft);
      font-size: var(--text-small);
    }

    .ket-qua {
      margin-top: 12px;
    }

    .ds-kq {
      list-style: none;
      margin: 8px 0 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 200px;
      overflow-y: auto;
    }

    .ds-kq li {
      display: flex;
      align-items: baseline;
      gap: 8px;
      padding: 6px 8px;
      border-radius: var(--radius-sm);
      background: var(--color-surface-alt);
      font-size: var(--text-caption);
      color: var(--color-ink-muted);
    }

    .ds-kq li.loi-dong {
      background: var(--color-danger-soft);
      color: var(--color-on-danger-soft);
    }

    .ds-kq .ly-do {
      flex: 1;
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .ds-kq .ma-loi {
      flex: none;
      font-family: var(--font-mono, monospace);
    }

    .ds-kq .ok {
      color: var(--color-on-success-soft);
      font-weight: 600;
    }

    .chan-hop {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 18px;
      flex-wrap: wrap;
    }

    .dem {
      margin-right: auto;
      font-size: var(--text-small);
      color: var(--color-ink-muted);
    }

    @media (max-width: 640px) {
      .luoi {
        grid-template-columns: 1fr;
      }

      .hop {
        padding: 16px;
      }

      .chan-hop {
        justify-content: flex-end;
      }

      .dem {
        width: 100%;
        margin: 0 0 4px;
      }
    }
  `,
})
export class ChuongTrinhChiTiet {
  /** Tham số route `:id` — `withComponentInputBinding` gán tự động. */
  readonly id = input.required<string>();

  private readonly service = inject(ChuongTrinhService);
  private readonly lopHocPhan = inject(LopHocPhanService);

  readonly dangTai = signal(true);
  readonly loi = signal<string | null>(null);
  readonly ctdt = signal<ChuongTrinhDaoTao | null>(null);

  readonly thongBao = signal<string | null>(null);
  readonly thongBaoMuc = signal<'success' | 'danger'>('success');

  readonly menuMo = signal<{ id: number; mon: ChuongTrinhMon; top: number; left: number } | null>(null);

  // ---- Dialog thêm môn ----
  readonly dangThemMon = signal(false);
  readonly tuKhoaMon = signal('');
  readonly dsMon = signal<TuyChonMonHoc[]>([]);
  readonly daChon = signal<Set<number>>(new Set());
  readonly dangTaiMon = signal(false);
  readonly kyThuLo = signal<number | null>(null);
  readonly batBuocLo = signal(true);
  readonly dangLuuMon = signal(false);
  readonly loiThemMon = signal('');

  // ---- Dialog import ----
  readonly dangImport = signal(false);
  readonly noiDungCsv = signal('');
  readonly dangGuiImport = signal(false);
  readonly ketQuaImport = signal<KetQuaImportChuongTrinh | null>(null);
  readonly loiImport = signal('');

  // ---- Dialog gán kỳ thứ ----
  readonly dangSuaKy = signal<ChuongTrinhMon | null>(null);
  readonly kyMoi = signal<number | null>(null);
  readonly loaiMoi = signal(true);
  readonly dangLuuKy = signal(false);
  readonly loiSuaKy = signal('');

  // ---- Xóa môn ----
  readonly dangXoaMon = signal<ChuongTrinhMon | null>(null);
  readonly dangXoa = signal(false);
  readonly lyDoChan = signal('');

  readonly cacKyThu = Array.from({ length: KY_THU_TOI_DA }, (_, i) => i + 1);

  readonly nhomMon = computed<NhomKy[]>(() => {
    const mon = [...(this.ctdt()?.mon ?? [])];
    if (mon.length === 0) return [];

    mon.sort((a, b) => {
      const ka = a.ky_thu ?? Number.MAX_SAFE_INTEGER;
      const kb = b.ky_thu ?? Number.MAX_SAFE_INTEGER;
      if (ka !== kb) return ka - kb;
      return a.mon_hoc.ma_mon.localeCompare(b.mon_hoc.ma_mon, 'vi');
    });

    const nhom: NhomKy[] = [];
    for (const m of mon) {
      const khoa = m.ky_thu === null ? 'chua-gan' : `k${m.ky_thu}`;
      const cuoi = nhom[nhom.length - 1];
      if (cuoi && cuoi.khoa === khoa) {
        cuoi.mon.push(m);
      } else {
        nhom.push({
          khoa,
          nhan: m.ky_thu === null ? 'Chưa gán' : `Kỳ ${m.ky_thu}`,
          mon: [m],
        });
      }
    }
    return nhom;
  });

  readonly soBatBuoc = computed(() => (this.ctdt()?.mon ?? []).filter((m) => m.bat_buoc).length);
  readonly soTuChon = computed(() => (this.ctdt()?.mon ?? []).filter((m) => !m.bat_buoc).length);
  readonly soMonChuaGanKy = computed(() => this.ctdt()?.so_mon_chua_gan_ky ?? 0);

  readonly tomTat = computed(() => {
    const ct = this.ctdt();
    if (!ct) return '';
    return `${ct.so_nam ?? 4} năm (${ct.so_ky ?? 8} kỳ) · ${ct.so_mon} môn · ${ct.tong_tin_chi} tín chỉ · ${this.soBatBuoc()} bắt buộc · ${this.soTuChon()} tự chọn · ${ct.sinh_vien_ap_dung} sinh viên áp dụng`;
  });

  /** Môn chưa có trong chương trình — tránh thêm trùng (backend cũng chặn). */
  readonly dsMonHienThi = computed(() => {
    const daCo = new Set((this.ctdt()?.mon ?? []).map((m) => m.mon_hoc.id));
    return this.dsMon().filter((m) => !daCo.has(m.id));
  });

  readonly dongCsv = computed(() => this.docCsv(this.noiDungCsv()));

  constructor() {
    // Effect thay cho ngOnInit: route có thể đổi `:id` mà không tạo lại
    // component (điều hướng giữa hai chương trình), khi đó phải tải lại.
    effect(() => {
      const id = Number(this.id());
      if (!Number.isFinite(id) || id <= 0) {
        this.loi.set('Chương trình đào tạo không hợp lệ.');
        this.dangTai.set(false);
        return;
      }
      untracked(() => this.tai(id));
    });
  }

  taiLai(): void {
    const id = Number(this.id());
    if (Number.isFinite(id) && id > 0) this.tai(id);
  }

  private tai(id: number): void {
    this.dangTai.set(true);
    this.loi.set(null);

    this.service.layMot(id).subscribe({
      next: (ct) => {
        this.ctdt.set(ct);
        this.dangTai.set(false);
      },
      error: () => {
        this.loi.set('Không tải được chương trình đào tạo. Kiểm tra kết nối rồi thử lại.');
        this.dangTai.set(false);
      },
    });
  }

  // ---------------- Menu thao tác ----------------

  moMenu(m: ChuongTrinhMon, su: Event): void {
    su.stopPropagation();
    if (this.menuMo()?.id === m.id) {
      this.menuMo.set(null);
      return;
    }
    const nut = su.currentTarget as HTMLElement;
    const r = nut.getBoundingClientRect();
    this.menuMo.set({ id: m.id, mon: m, top: r.bottom + 4, left: Math.max(8, r.right - 210) });
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
    if (this.dangThemMon()) this.dongThemMon();
    if (this.dangImport()) this.dongImport();
    if (this.dangSuaKy()) this.dongSuaKy();
  }

  @HostListener('window:scroll')
  dongMenuKhiCuon(): void {
    if (this.menuMo()) this.menuMo.set(null);
  }

  // ---------------- Thêm môn ----------------

  moThemMon(): void {
    this.loiThemMon.set('');
    this.tuKhoaMon.set('');
    this.daChon.set(new Set());
    const ct = this.ctdt();
    const kyDau = ct?.mon?.find((m) => m.ky_thu !== null)?.ky_thu ?? null;
    this.kyThuLo.set(kyDau);
    this.batBuocLo.set(true);
    this.dangThemMon.set(true);
    this.timMon('');
  }

  dongThemMon(): void {
    if (this.dangLuuMon()) return;
    this.dangThemMon.set(false);
    this.loiThemMon.set('');
  }

  timMon(q: string): void {
    this.tuKhoaMon.set(q);
    this.dangTaiMon.set(true);
    this.lopHocPhan.timMonHoc(q, 50).subscribe({
      next: (ds) => {
        this.dsMon.set(ds);
        this.dangTaiMon.set(false);
      },
      error: () => {
        this.dsMon.set([]);
        this.dangTaiMon.set(false);
        this.loiThemMon.set('Không tải được danh sách môn học.');
      },
    });
  }

  doiChonMon(id: number, su: Event): void {
    const chon = (su.target as HTMLInputElement).checked;
    this.daChon.update((tap) => {
      const moi = new Set(tap);
      if (chon) moi.add(id);
      else moi.delete(id);
      return moi;
    });
  }

  doiKyThuLo(su: Event): void {
    const value = (su.target as HTMLSelectElement).value;
    this.kyThuLo.set(value ? Number(value) : null);
  }

  doiLoaiLo(su: Event): void {
    this.batBuocLo.set((su.target as HTMLSelectElement).value === 'true');
  }

  luuThemMon(): void {
    const id = Number(this.id());
    const ids = [...this.daChon()];
    if (!Number.isFinite(id) || ids.length === 0 || this.dangLuuMon()) return;

    this.dangLuuMon.set(true);
    this.loiThemMon.set('');

    this.service
      .themMon(id, { mon_hoc_ids: ids, ky_thu: this.kyThuLo(), bat_buoc: this.batBuocLo() })
      .subscribe({
        next: () => {
          this.dangLuuMon.set(false);
          this.dangThemMon.set(false);
          this.baoThanhCong(`Đã thêm ${ids.length} môn vào chương trình.`);
          this.tai(id);
        },
        error: (e: { error?: { message?: string } }) => {
          this.dangLuuMon.set(false);
          this.loiThemMon.set(e?.error?.message ?? 'Không thêm được môn. Kiểm tra kết nối rồi thử lại.');
        },
      });
  }

  // ---------------- Import CSV ----------------

  moImport(): void {
    this.noiDungCsv.set('');
    this.ketQuaImport.set(null);
    this.loiImport.set('');
    this.dangImport.set(true);
  }

  dongImport(): void {
    if (this.dangGuiImport()) return;
    this.dangImport.set(false);
  }

  doiNoiDungCsv(su: Event): void {
    this.noiDungCsv.set((su.target as HTMLTextAreaElement).value);
    this.ketQuaImport.set(null);
  }

  docTep(su: Event): void {
    const tep = (su.target as HTMLInputElement).files?.[0];
    if (!tep) return;
    const doc = new FileReader();
    doc.onload = () => {
      this.noiDungCsv.set(String(doc.result ?? ''));
      this.ketQuaImport.set(null);
    };
    doc.readAsText(tep, 'utf-8');
  }

  guiImport(): void {
    const id = Number(this.id());
    const rows = this.dongCsv();
    if (!Number.isFinite(id) || rows.length === 0 || this.dangGuiImport()) return;

    this.dangGuiImport.set(true);
    this.loiImport.set('');
    this.ketQuaImport.set(null);

    this.service.importCsv(id, rows).subscribe({
      next: (kq) => {
        this.dangGuiImport.set(false);
        this.ketQuaImport.set(kq);
        if (kq.thanh_cong > 0) this.tai(id);
      },
      error: (e: { error?: { message?: string } }) => {
        this.dangGuiImport.set(false);
        this.loiImport.set(e?.error?.message ?? 'Không import được tệp. Kiểm tra lại nội dung.');
      },
    });
  }

  /**
   * Đọc CSV: mỗi dòng `ma_mon,ky_thu,bat_buoc`, chấp nhận dấu phẩy, chấm phẩy
   * hoặc tab. Bỏ dòng tiêu đề và dòng trống để người dùng dán cả tệp có header.
   */
  private docCsv(text: string): DongImportChuongTrinh[] {
    return text
      .split(/\r?\n/)
      .map((dong) => dong.trim())
      .filter((dong) => dong.length > 0 && !dong.startsWith('#'))
      .map((dong) => dong.split(/[,;\t]/).map((o) => o.trim()))
      .filter((o) => o[0] && o[0].toLowerCase() !== 'ma_mon')
      .map((o) => ({
        ma_mon: o[0],
        ky_thu: o[1] ? Number(o[1]) || null : null,
        bat_buoc: this.docBatBuoc(o[2]),
      }));
  }

  private docBatBuoc(o: string | undefined): boolean | undefined {
    if (o === undefined || o === '') return undefined;
    const giaTri = o.toLowerCase();
    return !['0', 'false', 'tu_chon', 'tu chon', 'tự chọn'].includes(giaTri);
  }

  // ---------------- Gán kỳ thứ / đổi loại ----------------

  moSuaKy(m: ChuongTrinhMon): void {
    this.menuMo.set(null);
    this.loiSuaKy.set('');
    this.kyMoi.set(m.ky_thu);
    this.loaiMoi.set(m.bat_buoc);
    this.dangSuaKy.set(m);
  }

  dongSuaKy(): void {
    if (this.dangLuuKy()) return;
    this.dangSuaKy.set(null);
    this.loiSuaKy.set('');
  }

  doiKyMoi(su: Event): void {
    const value = (su.target as HTMLSelectElement).value;
    this.kyMoi.set(value ? Number(value) : null);
  }

  doiLoaiMoi(su: Event): void {
    this.loaiMoi.set((su.target as HTMLSelectElement).value === 'true');
  }

  luuSuaKy(): void {
    const id = Number(this.id());
    const m = this.dangSuaKy();
    if (!Number.isFinite(id) || !m || this.dangLuuKy()) return;

    this.dangLuuKy.set(true);
    this.loiSuaKy.set('');

    this.service.capNhatMon(id, m.id, { ky_thu: this.kyMoi(), bat_buoc: this.loaiMoi() }).subscribe({
      next: () => {
        this.dangLuuKy.set(false);
        this.dangSuaKy.set(null);
        this.baoThanhCong(`Đã cập nhật môn ${m.mon_hoc.ma_mon}.`);
        this.tai(id);
      },
      error: (e: { error?: { message?: string } }) => {
        this.dangLuuKy.set(false);
        this.loiSuaKy.set(e?.error?.message ?? 'Không cập nhật được môn. Kiểm tra kết nối rồi thử lại.');
      },
    });
  }

  /** Đổi bắt buộc ↔ tự chọn một chạm, giữ nguyên kỳ thứ hiện tại. */
  doiLoai(m: ChuongTrinhMon): void {
    const id = Number(this.id());
    this.menuMo.set(null);
    if (!Number.isFinite(id)) return;

    this.service.capNhatMon(id, m.id, { ky_thu: m.ky_thu, bat_buoc: !m.bat_buoc }).subscribe({
      next: () => {
        this.baoThanhCong(
          `Môn ${m.mon_hoc.ma_mon} đã đổi thành ${m.bat_buoc ? 'tự chọn' : 'bắt buộc'}.`,
        );
        this.tai(id);
      },
      error: (e: { error?: { message?: string } }) => {
        this.thongBaoMuc.set('danger');
        this.thongBao.set(e?.error?.message ?? 'Không đổi được loại môn.');
      },
    });
  }

  // ---------------- Xóa môn ----------------

  hoiXoaMon(m: ChuongTrinhMon): void {
    this.menuMo.set(null);
    this.lyDoChan.set('');
    this.dangXoaMon.set(m);
  }

  xacNhanXoaMon(): void {
    const id = Number(this.id());
    const m = this.dangXoaMon();
    if (!Number.isFinite(id) || !m || this.dangXoa()) return;

    this.dangXoa.set(true);
    this.service.xoaMon(id, m.id).subscribe({
      next: () => {
        this.dangXoa.set(false);
        this.dangXoaMon.set(null);
        this.baoThanhCong(`Đã xóa môn ${m.mon_hoc.ma_mon} khỏi chương trình.`);
        this.tai(id);
      },
      error: (e: { error?: { message?: string } }) => {
        this.dangXoa.set(false);
        this.lyDoChan.set(
          e?.error?.message ?? 'Không xóa được môn. Kiểm tra kết nối rồi thử lại.',
        );
      },
    });
  }

  private baoThanhCong(message: string): void {
    this.thongBaoMuc.set('success');
    this.thongBao.set(message);
    setTimeout(() => this.thongBao.set(null), 6000);
  }
}
