import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, Subscription, map, of } from 'rxjs';
import { LopHocPhan } from '@core/models/dao-tao.model';
import { LopHocPhanService, TuyChon } from '@core/services/lop-hoc-phan.service';
import { chuanHoaTimKiem } from '@core/utils/chuan-hoa-tim-kiem';
import { AppAlert } from '@shared/ui/app-alert';
import { ChonTimKiem, LuaChonTimKiem } from '@shared/ui/chon-tim-kiem';
import { DateInput } from '@shared/ui/date-input';
import { LoadingState } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';
import { StatusBadge } from '@shared/ui/status-badge';
import { BuoiHocDiemDanh, DiemDanhService } from './diem-danh.service';

@Component({
  selector: 'app-diem-danh-danh-sach',
  standalone: true,
  imports: [
    AppAlert,
    ChonTimKiem,
    DateInput,
    FormsModule,
    LoadingState,
    PageHeader,
    RouterLink,
    StatusBadge,
  ],
  template: `
    <app-page-header
      title="Điểm danh"
      description="Chọn lớp học phần và buổi học để ghi nhận chuyên cần."
    />

    @if (loi()) {
      <app-alert muc="danger" title="Không tải được dữ liệu">
        {{ loi() }}
        <button class="thu-lai" type="button" (click)="taiLop()">Thử lại</button>
      </app-alert>
    }

    @if (dangTaiLop()) {
      <app-loading-state label="Đang tải lớp học phần…" />
    } @else {
      <section class="bo-loc" aria-label="Lọc buổi học">
        <label>
          <span>Học kỳ</span>
          <select
            [ngModel]="hocKyId()"
            (ngModelChange)="chonHocKy($event)"
            aria-label="Lọc theo học kỳ"
          >
            <option [ngValue]="0">Tất cả học kỳ</option>
            @for (k of hocKy(); track k.id) {
              <option [ngValue]="k.id">{{ k.label }}</option>
            }
          </select>
        </label>
        <div class="o-rong">
          <span>Lớp học phần</span>
          <app-chon-tim-kiem
            id="loc-lop-hoc-phan"
            placeholder="Gõ mã lớp hoặc tên môn…"
            [nguon]="nguonLop"
            [giaTri]="lopIdDangChon()"
            [nhanDaChon]="nhanLopDangChon()"
            (giaTriChange)="chonLop($event)"
          />
        </div>
        <label>
          <span>Ngày học</span>
          <app-date-input
            id="loc-ngay-hoc"
            nhan="Lọc theo ngày học"
            [giaTri]="ngayLoc()"
            (giaTriChange)="ngayLoc.set($event)"
          />
        </label>
        <label>
          <span>Trạng thái điểm danh</span>
          <select
            [ngModel]="trangThaiLoc()"
            (ngModelChange)="trangThaiLoc.set($event)"
            aria-label="Lọc theo trạng thái điểm danh"
          >
            <option value="ALL">Tất cả</option>
            <option value="DONE">Đã điểm danh</option>
            <option value="PENDING">Chưa điểm danh</option>
          </select>
        </label>
      </section>

      @if (dangTaiBuoi()) {
        <app-loading-state label="Đang tải các buổi học…" />
      } @else if (loiBuoi()) {
        <app-alert muc="danger" title="Không tải được buổi học">
          {{ loiBuoi() }}
          <button class="thu-lai" type="button" (click)="chonLop(lopIdDangChon())">
            Thử lại
          </button>
        </app-alert>
      } @else if (lopIdDangChon() && !loi()) {
        @if (buoiHienThi().length) {
          <section class="danh-sach" aria-label="Danh sách buổi học">
            @for (buoi of buoiHienThi(); track buoi.id) {
              <article class="buoi">
                <div class="ngay" aria-label="Ngày học">
                  <span class="material-icons" aria-hidden="true">event</span>
                  <time [attr.datetime]="buoi.ngay_hoc">{{ dinhDangNgay(buoi.ngay_hoc) }}</time>
                </div>
                <div class="noi-dung">
                  <div class="tieu-de">
                    <h2>{{ lopDuocChon()?.mon_hoc?.ten_mon }}</h2>
                    <app-status-badge
                      [value]="
                        buoi.trang_thai === 'CANCELLED'
                          ? 'CANCELLED'
                          : buoi.da_diem_danh
                            ? 'DONE'
                            : 'PENDING'
                      "
                      [label]="nhanTrangThai(buoi)"
                      [mau]="mauTrangThai(buoi)"
                    />
                  </div>
                  <p>{{ lopDuocChon()?.ma_lop_hp }} · {{ lopDuocChon()?.mon_hoc?.ma_mon }}</p>
                  <span class="gio">
                    <span class="material-icons" aria-hidden="true">schedule</span>
                    {{ buoi.gio_bat_dau }} – {{ buoi.gio_ket_thuc }}
                  </span>
                </div>
                @if (buoi.trang_thai === 'CANCELLED') {
                  <span class="da-huy">Buổi học đã hủy</span>
                } @else {
                  <a
                    class="hanh-dong"
                    [routerLink]="['/diem-danh', buoi.id]"
                    [queryParams]="{
                      ngay_hoc: buoi.ngay_hoc,
                      gio_bat_dau: buoi.gio_bat_dau,
                      gio_ket_thuc: buoi.gio_ket_thuc,
                      ma_lop_hp: lopDuocChon()?.ma_lop_hp,
                      ten_mon: lopDuocChon()?.mon_hoc?.ten_mon,
                      lop_hoc_phan_id: lopDuocChon()?.id,
                    }"
                  >
                    {{ buoi.da_diem_danh ? 'Xem / sửa' : 'Điểm danh' }}
                    <span class="material-icons" aria-hidden="true">arrow_forward</span>
                  </a>
                }
              </article>
            }
          </section>
        } @else {
          <section class="rong">
            <span class="material-icons" aria-hidden="true">event_busy</span>
            <h2>
              {{
                ngayLoc() || trangThaiLoc() !== 'ALL' ? 'Không có buổi phù hợp' : 'Chưa có buổi học'
              }}
            </h2>
            <p>Thử điều chỉnh bộ lọc hoặc chọn một lớp học phần khác.</p>
          </section>
        }
      } @else {
        <section class="rong">
          <span class="material-icons" aria-hidden="true">fact_check</span>
          <h2>Chọn lớp học phần</h2>
          <p>Các buổi học của lớp sẽ xuất hiện tại đây.</p>
        </section>
      }
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .bo-loc {
      display: grid;
      grid-template-columns: minmax(180px, 1fr) minmax(240px, 2fr) minmax(170px, 1fr) minmax(190px, 1fr);
      gap: 14px;
      margin-bottom: 16px;
      padding: 18px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
    }
    label,
    .o-rong {
      display: grid;
      gap: 6px;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
      font-weight: 600;
      min-width: 0;
    }
    select {
      width: 100%;
      min-height: 42px;
      padding: 8px 11px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
      font: inherit;
      font-size: var(--text-small);
      font-weight: 400;
    }
    /* Ô chọn có tìm kiếm cao bằng ô select bên cạnh. */
    .danh-sach {
      display: grid;
      gap: 12px;
    }
    .buoi {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 18px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }
    .ngay {
      display: grid;
      width: 92px;
      min-height: 64px;
      height: auto;
      flex: none;
      place-items: center;
      box-sizing: border-box;
      padding: 7px 5px;
      border-radius: var(--radius);
      background: var(--color-primary-soft);
      color: var(--color-on-primary-soft);
    }
    .ngay .material-icons {
      font-size: 22px;
    }
    .ngay time {
      display: block;
      max-width: 100%;
      font-size: var(--text-caption);
      line-height: 1.3;
      text-align: center;
      overflow-wrap: anywhere;
    }
    .noi-dung {
      min-width: 0;
      flex: 1;
    }
    .tieu-de {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    h2,
    p {
      margin: 0;
    }
    .tieu-de h2 {
      color: var(--color-ink);
      font-size: var(--text-body);
      font-weight: 650;
    }
    .noi-dung p,
    .gio {
      color: var(--color-ink-muted);
      font-size: var(--text-small);
    }
    .noi-dung p {
      margin: 4px 0;
    }
    .gio {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .gio .material-icons {
      font-size: 16px;
    }
    .hanh-dong {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      flex: none;
      color: var(--color-primary);
      font-size: var(--text-small);
      font-weight: 650;
      text-decoration: none;
    }
    .hanh-dong:hover {
      text-decoration: underline;
    }
    .da-huy {
      flex: none;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
    }
    .hanh-dong .material-icons {
      font-size: 18px;
    }
    .rong {
      display: grid;
      justify-items: center;
      gap: 8px;
      padding: 48px 20px;
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-lg);
      color: var(--color-ink-muted);
      text-align: center;
    }
    .rong .material-icons {
      color: var(--color-primary);
      font-size: 32px;
    }
    .rong h2 {
      color: var(--color-ink);
      font-size: var(--text-small);
    }
    .rong p {
      font-size: var(--text-small);
    }
    .thu-lai {
      margin-left: 8px;
      border: 0;
      background: none;
      color: var(--color-primary);
      cursor: pointer;
      font: inherit;
      font-weight: 600;
    }
    @media (max-width: 900px) {
      .bo-loc {
        grid-template-columns: 1fr 1fr;
      }
      .o-rong {
        grid-column: 1 / -1;
      }
    }
    @media (max-width: 760px) {
      .bo-loc {
        grid-template-columns: 1fr;
      }
      .buoi {
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .hanh-dong {
        width: 100%;
        margin-left: 108px;
      }
    }
  `,
})
export class DiemDanhDanhSach {
  private readonly lopService = inject(LopHocPhanService);
  private readonly service = inject(DiemDanhService);
  private readonly queryLop = inject(ActivatedRoute).snapshot.queryParamMap.get('lop_hoc_phan_id');
  private taiBuoi?: Subscription;

  readonly hocKy = signal<TuyChon[]>([]);
  readonly hocKyId = signal(0);
  readonly lopHocPhan = signal<LopHocPhan[]>([]);
  readonly lopIdDangChon = signal<number | null>(null);
  readonly lopDuocChon = computed(
    () => this.lopHocPhan().find((lop) => lop.id === this.lopIdDangChon()) ?? null,
  );
  readonly nhanLopDangChon = computed(() => {
    const lop = this.lopDuocChon();
    return lop ? `${lop.ma_lop_hp} · ${lop.mon_hoc.ten_mon}` : '';
  });
  readonly buoi = signal<BuoiHocDiemDanh[]>([]);
  readonly ngayLoc = signal('');
  readonly trangThaiLoc = signal<'ALL' | 'DONE' | 'PENDING'>('ALL');
  readonly dangTaiLop = signal(true);
  readonly dangTaiBuoi = signal(false);
  readonly loi = signal('');
  readonly loiBuoi = signal('');

  /**
   * Nguồn cho ô chọn lớp có tìm kiếm. Danh sách đã tải hết một lần, nên lọc
   * ngay tại client — tìm theo mã lớp, tên môn và mã môn, bỏ dấu tiếng Việt.
   */
  readonly nguonLop = (tuKhoa: string): Observable<LuaChonTimKiem[]> => {
    const khoa = chuanHoaTimKiem(tuKhoa);
    const rows = this.lopHocPhan().map((lop) => ({
      id: lop.id,
      label: lop.mon_hoc.ten_mon,
      ma: lop.ma_lop_hp,
      phu: `${lop.si_so_hien_tai}/${lop.si_so_toi_da} SV`,
      tim: chuanHoaTimKiem(`${lop.ma_lop_hp} ${lop.mon_hoc.ma_mon} ${lop.mon_hoc.ten_mon}`),
    }));
    return of(khoa ? rows.filter((muc) => muc.tim.includes(khoa)) : rows).pipe(
      map((ds) => ds.map(({ tim: _tim, ...muc }) => muc)),
    );
  };

  readonly buoiHienThi = computed(() =>
    this.buoi().filter((buoi) => {
      const dungNgay = !this.ngayLoc() || buoi.ngay_hoc === this.ngayLoc();
      const dungTrangThai =
        this.trangThaiLoc() === 'ALL' ||
        (this.trangThaiLoc() === 'DONE' ? buoi.da_diem_danh : !buoi.da_diem_danh);
      return dungNgay && dungTrangThai;
    }),
  );

  constructor() {
    this.lopService.layTuyChon('semesters').subscribe({
      next: (rows) => this.hocKy.set(rows),
      error: () => this.hocKy.set([]),
    });
    this.taiLop();
  }

  chonHocKy(id: number): void {
    this.hocKyId.set(id);
    this.taiLop();
  }

  taiLop(): void {
    this.dangTaiLop.set(true);
    this.loi.set('');
    this.lopService
      .layDanhSach({
        page: 1,
        per_page: 100,
        ...(this.hocKyId() ? { hoc_ky_id: this.hocKyId() } : {}),
      })
      .subscribe({
        next: (response) => {
          this.lopHocPhan.set(response.data.filter((lop) => !lop.da_xoa));
          this.dangTaiLop.set(false);
          const idDuocChon =
            this.queryLop && this.lopHocPhan().some((lop) => String(lop.id) === this.queryLop)
              ? Number(this.queryLop)
              : (this.lopHocPhan()[0]?.id ?? null);
          this.chonLop(idDuocChon);
        },
        error: () => {
          this.loi.set('Không tải được danh sách lớp học phần. Vui lòng thử lại.');
          this.dangTaiLop.set(false);
        },
      });
  }

  chonLop(id: number | null): void {
    this.taiBuoi?.unsubscribe();
    this.lopIdDangChon.set(id);
    this.buoi.set([]);
    this.loiBuoi.set('');
    if (!id) {
      this.dangTaiBuoi.set(false);
      return;
    }

    this.dangTaiBuoi.set(true);
    // API /sections/{id}/sessions đã trả sẵn `da_diem_danh` cho từng buổi nên
    // không cần gọi thêm /attendance cho mỗi buổi (tránh N+1 request).
    this.taiBuoi = this.service.layBuoiTheoLop(id).subscribe({
      next: (rows) => {
        this.buoi.set(rows);
        this.dangTaiBuoi.set(false);
      },
      error: () => {
        this.loiBuoi.set('Không tải được các buổi học. Vui lòng thử lại.');
        this.dangTaiBuoi.set(false);
      },
    });
  }

  dinhDangNgay(ngay: string): string {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(`${ngay}T00:00:00`));
  }

  nhanTrangThai(buoi: BuoiHocDiemDanh): string {
    if (buoi.trang_thai === 'CANCELLED') return 'Đã hủy';
    return buoi.da_diem_danh ? 'Đã điểm danh' : 'Chưa điểm danh';
  }

  mauTrangThai(buoi: BuoiHocDiemDanh): 'success' | 'warning' | 'neutral' {
    if (buoi.trang_thai === 'CANCELLED') return 'neutral';
    return buoi.da_diem_danh ? 'success' : 'warning';
  }
}
