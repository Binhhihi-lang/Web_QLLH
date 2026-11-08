import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/auth/auth.service';
import { LichThi, LichThiService } from '@core/services/lich-thi.service';
import { LopHocPhanService, TuyChon } from '@core/services/lop-hoc-phan.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { AppToastService } from '@shared/ui/app-toast.service';
import { ChonTimKiem, LuaChonTimKiem } from '@shared/ui/chon-tim-kiem';
import { DateInput } from '@shared/ui/date-input';
import { LoadingState } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';
import { NgayVnPipe } from '@shared/pipes/ngay-vn.pipe';
import { Observable, map } from 'rxjs';

/**
 * Lịch thi: ADMIN xếp ca thi, hai vai trò còn lại chỉ xem.
 * Ca thi theo môn, dùng chung khung tiết với buổi học.
 */
@Component({
  selector: 'app-lich-thi',
  standalone: true,
  imports: [
    FormsModule,
    AppAlert,
    AppButton,
    ChonTimKiem,
    DateInput,
    LoadingState,
    PageHeader,
    NgayVnPipe,
  ],
  template: `
    <app-page-header
      title="Lịch thi"
      description="Ca thi theo môn trong học kỳ. Mỗi ca dùng một phòng và một khung tiết."
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

    @if (dangThem()) {
      <div class="khung-them">
        <h3>Thêm ca thi</h3>
        <div class="luoi">
          <div class="rong">
            <span class="nhan">Môn học *</span>
            <app-chon-tim-kiem
              id="mon-thi"
              placeholder="Gõ mã hoặc tên môn…"
              [nguon]="nguonMon"
              [giaTri]="moi.mon_hoc_id || null"
              (giaTriChange)="moi.mon_hoc_id = $event ?? 0"
            />
          </div>
          <label>
            Ngày thi
            <app-date-input
              id="ngay-thi"
              nhan="Ngày thi"
              [giaTri]="moi.ngay_thi"
              (giaTriChange)="moi.ngay_thi = $event"
            />
          </label>
          <label>
            Từ tiết
            <select name="tu-tiet" [(ngModel)]="moi.tiet_bat_dau">
              @for (t of tiet(); track t.id) {
                <option [ngValue]="t.so_tiet">{{ t.label }}</option>
              }
            </select>
          </label>
          <label>
            Đến tiết
            <select name="den-tiet" [(ngModel)]="moi.tiet_ket_thuc">
              @for (t of tiet(); track t.id) {
                <option [ngValue]="t.so_tiet">{{ t.label }}</option>
              }
            </select>
          </label>
          <label>
            Phòng thi
            <select name="phong" [(ngModel)]="moi.phong_hoc_id">
              <option [ngValue]="0">Chọn phòng</option>
              @for (p of phong(); track p.id) {
                <option [ngValue]="p.id">{{ p.label }}</option>
              }
            </select>
          </label>
          <label>
            Đợt thi
            <input name="dot-thi" maxlength="50" [(ngModel)]="moi.dot_thi" placeholder="Giữa kỳ / Cuối kỳ" />
          </label>
        </div>
        <div class="nut-phu">
          <app-button variant="secondary" (click)="dongForm()">Hủy</app-button>
          <app-button variant="primary" [disabled]="!hopLe()" [loading]="dangLuu()" (click)="luu()">
            Thêm ca thi
          </app-button>
        </div>
      </div>
    }

    @if (dangTai()) {
      <app-loading-state label="Đang tải lịch thi…" />
    } @else if (danhSach().length === 0) {
      <p class="trong">Chưa có ca thi nào trong học kỳ này.</p>
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
              @if (laAdmin()) {
                <th></th>
              }
            </tr>
          </thead>
          <tbody>
            @for (t of danhSach(); track t.id) {
              <tr>
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
                @if (laAdmin()) {
                  <td class="thao-tac">
                    <button type="button" (click)="xoa(t)">Xóa</button>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
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
    }
    tr:last-child td {
      border-bottom: 0;
    }
    td b {
      font-family: var(--font-mono, monospace);
      font-size: var(--text-small);
      color: var(--color-primary);
      margin-right: 6px;
    }
    td span {
      color: var(--color-ink);
    }
    .thao-tac {
      text-align: right;
    }
    .thao-tac button {
      border: none;
      background: transparent;
      color: var(--color-danger);
      font: inherit;
      font-size: var(--text-small);
      font-weight: 600;
      cursor: pointer;
    }
    .trong {
      padding: 24px;
      text-align: center;
      color: var(--color-ink-muted);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius);
    }
    @media (max-width: 720px) {
      .luoi {
        grid-template-columns: 1fr 1fr;
      }
    }
  `,
})
export class LichThiTrang {
  private readonly service = inject(LichThiService);
  private readonly lopHocPhan = inject(LopHocPhanService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(AppToastService);

  readonly hocKy = signal<TuyChon[]>([]);
  readonly hocKyId = signal(0);
  readonly danhSach = signal<LichThi[]>([]);
  readonly phong = signal<TuyChon[]>([]);
  readonly tiet = signal<{ id: number; so_tiet: number; label: string }[]>([]);
  readonly dangTai = signal(true);
  readonly dangThem = signal(false);
  readonly dangLuu = signal(false);
  readonly loi = signal('');

  readonly laAdmin = () => this.auth.nguoiDung()?.vai_tro === 'ADMIN';

  readonly moi = {
    mon_hoc_id: 0,
    ngay_thi: '',
    tiet_bat_dau: 1,
    tiet_ket_thuc: 3,
    phong_hoc_id: 0,
    dot_thi: '',
  };

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

  chonHocKy(id: number): void {
    this.hocKyId.set(id);
    this.tai();
  }

  hopLe(): boolean {
    return (
      this.moi.mon_hoc_id > 0 &&
      !!this.moi.ngay_thi &&
      this.moi.phong_hoc_id > 0 &&
      this.moi.tiet_ket_thuc >= this.moi.tiet_bat_dau
    );
  }

  moForm(): void {
    this.dangThem.set(true);
    this.moi.mon_hoc_id = 0;
    this.moi.ngay_thi = '';
    this.moi.tiet_bat_dau = 1;
    this.moi.tiet_ket_thuc = 3;
    this.moi.phong_hoc_id = this.phong()[0]?.id ?? 0;
    this.moi.dot_thi = '';
  }

  dongForm(): void {
    this.dangThem.set(false);
  }

  luu(): void {
    if (!this.hopLe() || this.dangLuu()) return;
    this.dangLuu.set(true);
    this.loi.set('');
    this.service
      .tao({
        hoc_ky_id: this.hocKyId(),
        mon_hoc_id: this.moi.mon_hoc_id,
        ngay_thi: this.moi.ngay_thi,
        tiet_bat_dau: this.moi.tiet_bat_dau,
        tiet_ket_thuc: this.moi.tiet_ket_thuc,
        phong_hoc_id: this.moi.phong_hoc_id,
        dot_thi: this.moi.dot_thi || null,
      })
      .subscribe({
        next: () => {
          this.dangLuu.set(false);
          this.dangThem.set(false);
          this.toast.hien('Đã thêm ca thi.', 'success');
          this.tai();
        },
        error: (error: { error?: { message?: string } }) => {
          this.toast.hien(error.error?.message ?? 'Không thêm được ca thi.', 'danger');
          this.dangLuu.set(false);
        },
      });
  }

  xoa(t: LichThi): void {
    this.service.xoa(t.id).subscribe({
      next: () => {
        this.toast.hien('Đã xóa ca thi.', 'success');
        this.tai();
      },
      error: (error: { error?: { message?: string } }) =>
        this.toast.hien(error.error?.message ?? 'Không xóa được ca thi.', 'danger'),
    });
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
