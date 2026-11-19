import { DatePipe, JsonPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiResponse, PageMeta } from '@core/mock/mock-response';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { LoadingState } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';
import {
  NhatKy,
  NhatKyBoLoc,
  NhatKyService,
  NhatKyTuyChonBoLoc,
} from './nhat-ky.service';

@Component({
  selector: 'app-nhat-ky',
  standalone: true,
  imports: [AppAlert, AppButton, DatePipe, FormsModule, JsonPipe, LoadingState, PageHeader],
  template: `
    <app-page-header
      title="Nhật ký hệ thống"
      description="Theo dõi các thay đổi đã được ghi nhận trong hệ thống."
    />

    @if (loi()) {
      <app-alert muc="danger">{{ loi() }}</app-alert>
    }
    @if (loiTuyChon()) {
      <app-alert muc="warning">{{ loiTuyChon() }}</app-alert>
    }

    <section class="bo-loc" aria-label="Bộ lọc nhật ký">
      <label class="truong tu-khoa">
        <span>Tìm kiếm</span>
        <input
          type="search"
          placeholder="Ghi chú, người thực hiện hoặc mã đối tượng"
          [ngModel]="q()"
          (ngModelChange)="q.set($event)"
          (keydown.enter)="apDungLoc()"
        />
      </label>
      <label class="truong">
        <span>Đối tượng</span>
        <select [value]="doiTuongLoai()" (change)="doiDoiTuong($event)">
          <option value="">Tất cả đối tượng</option>
          @for (item of tuyChon()?.doi_tuong_loai ?? []; track item.value) {
            <option [value]="item.value">{{ item.label }}</option>
          }
        </select>
      </label>
      <label class="truong">
        <span>Hành động</span>
        <select [value]="hanhDong()" (change)="doiHanhDong($event)">
          <option value="">Tất cả hành động</option>
          @for (item of tuyChon()?.hanh_dong ?? []; track item.value) {
            <option [value]="item.value">{{ item.label }}</option>
          }
        </select>
      </label>
      <label class="truong">
        <span>Từ ngày</span>
        <input type="date" [value]="tuNgay()" (change)="doiTuNgay($event)" />
      </label>
      <label class="truong">
        <span>Đến ngày</span>
        <input type="date" [value]="denNgay()" (change)="doiDenNgay($event)" />
      </label>
      <div class="nut-loc">
        <app-button type="button" (click)="apDungLoc()">Tìm nhật ký</app-button>
        <app-button type="button" variant="secondary" (click)="xoaLoc()">Xóa lọc</app-button>
      </div>
    </section>

    <section class="khung-bang" aria-label="Danh sách nhật ký">
      @if (dangTai()) {
        <app-loading-state label="Đang tải nhật ký…" />
      } @else if (nhatKy().length) {
        <div class="bang-cuon">
          <table>
            <thead>
              <tr>
                <th>Thời điểm</th>
                <th>Người thực hiện</th>
                <th>Hành động</th>
                <th>Đối tượng</th>
                <th>Ghi chú</th>
                <th><span class="visually-hidden">Chi tiết</span></th>
              </tr>
            </thead>
            <tbody>
              @for (item of nhatKy(); track item.id) {
                <tr [class.dang-mo]="idDangMo() === item.id">
                  <td class="thoi-diem">
                    {{ item.thoi_diem ? (item.thoi_diem | date: 'dd/MM/yyyy HH:mm:ss') : '—' }}
                  </td>
                  <td>
                    @if (item.nguoi_thuc_hien; as nguoi) {
                      <strong>{{ nguoi.name }}</strong>
                      <small>{{ nguoi.email }}</small>
                    } @else {
                      <span class="muted">Tài khoản đã xóa</span>
                    }
                  </td>
                  <td><span class="hanh-dong">{{ item.hanh_dong_label }}</span></td>
                  <td>
                    <strong>{{ item.doi_tuong_loai_label }}</strong>
                    <small>Mã #{{ item.doi_tuong_id }}</small>
                  </td>
                  <td class="ghi-chu">{{ item.ghi_chu || '—' }}</td>
                  <td>
                    <button
                      class="nut-chi-tiet"
                      type="button"
                      [attr.aria-expanded]="idDangMo() === item.id"
                      (click)="moChiTiet(item)"
                    >
                      {{ idDangMo() === item.id ? 'Ẩn' : 'Xem' }}
                    </button>
                  </td>
                </tr>
                @if (idDangMo() === item.id) {
                  <tr class="dong-chi-tiet">
                    <td colspan="6">
                      @if (dangTaiChiTiet() === item.id) {
                        <span class="muted">Đang tải chi tiết…</span>
                      } @else if (loiChiTiet()) {
                        <span class="loi-chi-tiet">{{ loiChiTiet() }}</span>
                      } @else if (chiTiet(); as detail) {
                        <div class="chi-tiet-grid">
                          <div>
                            <h3>Dữ liệu trước</h3>
                            @if (detail.gia_tri_cu) {
                              <pre>{{ detail.gia_tri_cu | json }}</pre>
                            } @else {
                              <p class="muted">Không có dữ liệu trước.</p>
                            }
                          </div>
                          <div>
                            <h3>Dữ liệu sau</h3>
                            @if (detail.gia_tri_moi) {
                              <pre>{{ detail.gia_tri_moi | json }}</pre>
                            } @else {
                              <p class="muted">Không có dữ liệu sau.</p>
                            }
                          </div>
                        </div>
                      }
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
        @if (meta(); as page) {
          <footer class="phan-trang">
            <label>
              Hiển thị
              <select [value]="page.per_page" (change)="doiSoDong($event)">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              dòng · {{ page.total }} kết quả
            </label>
            <div class="nut-trang">
              <button type="button" [disabled]="page.current_page <= 1" (click)="tai(page.current_page - 1)">
                <span class="material-icons" aria-hidden="true">chevron_left</span> Trước
              </button>
              <span>Trang {{ page.current_page }} / {{ page.last_page }}</span>
              <button
                type="button"
                [disabled]="page.current_page >= page.last_page"
                (click)="tai(page.current_page + 1)"
              >
                Sau <span class="material-icons" aria-hidden="true">chevron_right</span>
              </button>
            </div>
          </footer>
        }
      } @else {
        <div class="rong">
          <span class="material-icons" aria-hidden="true">history</span>
          <strong>Chưa có nhật ký phù hợp</strong>
          <p>Thử đổi từ khóa hoặc bộ lọc để xem các hoạt động khác.</p>
        </div>
      }
    </section>
  `,
  styles: `
    :host { display: block; }
    .bo-loc, .khung-bang {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }
    .bo-loc {
      display: grid;
      grid-template-columns: minmax(220px, 2fr) repeat(4, minmax(130px, 1fr)) auto;
      align-items: end;
      gap: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .truong { display: grid; min-width: 0; gap: 6px; }
    .truong > span { color: var(--color-ink-muted); font-size: var(--text-caption); font-weight: 600; }
    .truong input, .truong select, .phan-trang select {
      width: 100%; min-width: 0; min-height: 40px; padding: 8px 10px;
      border: 1px solid var(--color-border); border-radius: var(--radius-sm);
      background: var(--color-surface); color: var(--color-ink); font: inherit; font-size: var(--text-small);
    }
    .nut-loc { display: flex; gap: 8px; }
    .khung-bang { overflow: hidden; }
    .bang-cuon { overflow: auto; }
    table { width: 100%; min-width: 900px; border-collapse: collapse; font-size: var(--text-small); }
    th { padding: 12px 14px; background: var(--color-surface-alt); color: var(--color-ink-muted); font-size: var(--text-caption); text-align: left; white-space: nowrap; }
    td { padding: 12px 14px; border-top: 1px solid var(--color-border-soft); vertical-align: top; }
    td strong, td small { display: block; }
    td small { margin-top: 3px; color: var(--color-ink-muted); font-size: var(--text-caption); }
    .thoi-diem { white-space: nowrap; font-variant-numeric: tabular-nums; }
    .hanh-dong { display: inline-flex; padding: 4px 8px; border-radius: 999px; background: var(--color-primary-soft); color: var(--color-on-primary-soft); font-size: var(--text-caption); font-weight: 650; }
    .ghi-chu { max-width: 300px; overflow-wrap: anywhere; }
    .nut-chi-tiet { border: 0; background: transparent; color: var(--color-primary); cursor: pointer; font: inherit; font-weight: 650; }
    .dang-mo > td { border-bottom: 0; }
    .dong-chi-tiet > td { padding-top: 0; background: var(--color-surface-alt); }
    .chi-tiet-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; padding: 8px 0 14px; }
    .chi-tiet-grid h3 { margin: 0 0 8px; color: var(--color-ink); font-size: var(--text-small); }
    pre { max-height: 320px; overflow: auto; margin: 0; padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius); background: var(--color-surface); color: var(--color-ink); font: 12px/1.55 ui-monospace, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
    .phan-trang { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 16px; border-top: 1px solid var(--color-border); color: var(--color-ink-muted); font-size: var(--text-caption); }
    .phan-trang label { display: flex; align-items: center; gap: 7px; }
    .phan-trang select { width: auto; min-height: 34px; padding-block: 4px; }
    .nut-trang { display: flex; align-items: center; gap: 12px; }
    .nut-trang button { display: inline-flex; align-items: center; gap: 4px; padding: 6px 8px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-surface); color: var(--color-primary); cursor: pointer; font: inherit; font-weight: 600; }
    .nut-trang button:disabled { color: var(--color-ink-subtle); cursor: not-allowed; opacity: .55; }
    .nut-trang .material-icons { font-size: 18px; }
    .rong { display: grid; justify-items: center; gap: 7px; padding: 42px 16px; color: var(--color-ink-muted); text-align: center; }
    .rong .material-icons { color: var(--color-primary); font-size: 30px; }
    .rong p { margin: 0; font-size: var(--text-small); }
    .muted { color: var(--color-ink-muted); }
    .loi-chi-tiet { color: var(--color-danger); }
    .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
    @media (max-width: 1100px) { .bo-loc { grid-template-columns: repeat(3, minmax(0, 1fr)); } .tu-khoa { grid-column: span 2; } }
    @media (max-width: 680px) { .bo-loc { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 12px; } .tu-khoa { grid-column: 1 / -1; } .nut-loc { grid-column: 1 / -1; } .nut-loc app-button { flex: 1; } .nut-loc app-button button { width: 100%; } .chi-tiet-grid { grid-template-columns: 1fr; } .phan-trang { align-items: stretch; flex-direction: column; } .nut-trang { justify-content: space-between; } }
  `,
})
export class NhatKyPage {
  private readonly service = inject(NhatKyService);

  readonly nhatKy = signal<NhatKy[]>([]);
  readonly meta = signal<PageMeta | null>(null);
  readonly tuyChon = signal<NhatKyTuyChonBoLoc | null>(null);
  readonly dangTai = signal(true);
  readonly loi = signal('');
  readonly loiTuyChon = signal('');
  readonly q = signal('');
  readonly doiTuongLoai = signal('');
  readonly hanhDong = signal('');
  readonly tuNgay = signal('');
  readonly denNgay = signal('');
  readonly soDong = signal<10 | 25 | 50 | 100>(10);
  readonly idDangMo = signal<number | null>(null);
  readonly chiTiet = signal<NhatKy | null>(null);
  readonly dangTaiChiTiet = signal<number | null>(null);
  readonly loiChiTiet = signal('');

  constructor() {
    this.service.layTuyChon().subscribe({
      next: (options) => this.tuyChon.set(options),
      error: () => this.loiTuyChon.set('Không tải được danh mục bộ lọc. Có thể tiếp tục tìm kiếm bằng từ khóa và thời gian.'),
    });
    this.tai();
  }

  tai(page = 1): void {
    this.dangTai.set(true);
    this.loi.set('');
    this.idDangMo.set(null);
    this.chiTiet.set(null);
    const boloc: NhatKyBoLoc = {
      q: this.q().trim() || undefined,
      doi_tuong_loai: this.doiTuongLoai() || undefined,
      hanh_dong: this.hanhDong() || undefined,
      tu_ngay: this.tuNgay() || undefined,
      den_ngay: this.denNgay() || undefined,
      page,
      per_page: this.soDong(),
      sort_by: 'thoi_diem',
      sort_dir: 'desc',
    };
    this.service.layDanhSach(boloc).subscribe({
      next: (response) => {
        this.nhatKy.set(response.data);
        this.meta.set(response.meta);
        this.dangTai.set(false);
      },
      error: (error: { error?: ApiResponse<unknown> }) => {
        this.loi.set(error.error?.message ?? 'Không tải được nhật ký. Vui lòng thử lại.');
        this.nhatKy.set([]);
        this.meta.set(null);
        this.dangTai.set(false);
      },
    });
  }

  apDungLoc(): void { this.tai(1); }

  xoaLoc(): void {
    this.q.set('');
    this.doiTuongLoai.set('');
    this.hanhDong.set('');
    this.tuNgay.set('');
    this.denNgay.set('');
    this.tai(1);
  }

  doiDoiTuong(event: Event): void { this.doiBoLoc(this.doiTuongLoai, event); }
  doiHanhDong(event: Event): void { this.doiBoLoc(this.hanhDong, event); }
  doiTuNgay(event: Event): void { this.doiBoLoc(this.tuNgay, event); }
  doiDenNgay(event: Event): void { this.doiBoLoc(this.denNgay, event); }

  private doiBoLoc(truong: ReturnType<typeof signal<string>>, event: Event): void {
    truong.set((event.target as HTMLInputElement).value);
    this.tai(1);
  }

  doiSoDong(event: Event): void {
    this.soDong.set(Number((event.target as HTMLSelectElement).value) as 10 | 25 | 50 | 100);
    this.tai(1);
  }

  moChiTiet(item: NhatKy): void {
    if (this.idDangMo() === item.id) {
      this.idDangMo.set(null);
      return;
    }
    this.idDangMo.set(item.id);
    this.chiTiet.set(null);
    this.loiChiTiet.set('');
    this.dangTaiChiTiet.set(item.id);
    this.service.layChiTiet(item.id).subscribe({
      next: (detail) => {
        if (this.idDangMo() === item.id) this.chiTiet.set(detail);
        this.dangTaiChiTiet.set(null);
      },
      error: () => {
        if (this.idDangMo() === item.id) this.loiChiTiet.set('Không tải được chi tiết bản ghi này.');
        this.dangTaiChiTiet.set(null);
      },
    });
  }
}
