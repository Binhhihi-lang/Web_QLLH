import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, forkJoin, map, of, switchMap } from 'rxjs';
import { LopHocPhan } from '@core/models/dao-tao.model';
import { LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { AppAlert } from '@shared/ui/app-alert';
import { LoadingState } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';
import { StatusBadge } from '@shared/ui/status-badge';
import { BuoiHocDiemDanh, DiemDanhService, DongDiemDanh } from './diem-danh.service';

interface BuoiHienThi extends BuoiHocDiemDanh {
  daDiemDanh: boolean;
}

@Component({
  selector: 'app-diem-danh-danh-sach',
  standalone: true,
  imports: [AppAlert, FormsModule, LoadingState, PageHeader, RouterLink, StatusBadge],
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
          <span>Lớp học phần</span>
          <select
            [ngModel]="lopDangChon()"
            (ngModelChange)="chonLop($event)"
            aria-label="Lọc theo lớp học phần"
          >
            <option value="">Chọn lớp học phần</option>
            @for (lop of lopHocPhan(); track lop.id) {
              <option [value]="lop.id">{{ lop.ma_lop_hp }} · {{ lop.mon_hoc.ten_mon }}</option>
            }
          </select>
        </label>
        <label>
          <span>Ngày học</span>
          <input
            type="date"
            [ngModel]="ngayLoc()"
            (ngModelChange)="ngayLoc.set($event)"
            aria-label="Lọc theo ngày học"
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
      } @else if (lopDangChon() && !loi()) {
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
                          : buoi.daDiemDanh
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
                    {{ buoi.daDiemDanh ? 'Xem / sửa' : 'Điểm danh' }}
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
      grid-template-columns: minmax(240px, 2fr) minmax(160px, 1fr) minmax(190px, 1fr);
      gap: 14px;
      margin-bottom: 16px;
      padding: 18px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
    }
    label {
      display: grid;
      gap: 6px;
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }
    select,
    input {
      width: 100%;
      min-height: 42px;
      padding: 8px 11px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
      font: inherit;
    }
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
      width: 76px;
      min-height: 60px;
      height: auto;
      flex: none;
      place-items: center;
      box-sizing: border-box;
      padding: 7px 5px;
      border-radius: var(--radius);
      background: var(--color-primary-soft);
      color: var(--color-primary);
    }
    .ngay .material-icons {
      font-size: 22px;
    }
    .ngay time {
      display: block;
      max-width: 100%;
      font-size: 10px;
      line-height: 1.25;
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
      font-size: var(--text-small);
      font-weight: 650;
    }
    .noi-dung p,
    .gio {
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
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
      font-size: var(--text-caption);
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
      font-size: var(--text-caption);
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
        margin-left: 64px;
      }
    }
  `,
})
export class DiemDanhDanhSach {
  private readonly lopService = inject(LopHocPhanService);
  private readonly service = inject(DiemDanhService);
  private readonly queryLop = inject(ActivatedRoute).snapshot.queryParamMap.get('lop_hoc_phan_id');
  private taiBuoi?: Subscription;

  readonly lopHocPhan = signal<LopHocPhan[]>([]);
  readonly lopDangChon = signal('');
  readonly lopDuocChon = computed(
    () => this.lopHocPhan().find((lop) => String(lop.id) === this.lopDangChon()) ?? null,
  );
  readonly buoi = signal<BuoiHienThi[]>([]);
  readonly ngayLoc = signal('');
  readonly trangThaiLoc = signal<'ALL' | 'DONE' | 'PENDING'>('ALL');
  readonly dangTaiLop = signal(true);
  readonly dangTaiBuoi = signal(false);
  readonly loi = signal('');
  readonly buoiHienThi = computed(() =>
    this.buoi().filter((buoi) => {
      const dungNgay = !this.ngayLoc() || buoi.ngay_hoc === this.ngayLoc();
      const dungTrangThai =
        this.trangThaiLoc() === 'ALL' ||
        (this.trangThaiLoc() === 'DONE' ? buoi.daDiemDanh : !buoi.daDiemDanh);
      return dungNgay && dungTrangThai;
    }),
  );

  constructor() {
    this.taiLop();
  }

  taiLop(): void {
    this.dangTaiLop.set(true);
    this.loi.set('');
    this.lopService.layDanhSach({ page: 1, per_page: 100 }).subscribe({
      next: (response) => {
        this.lopHocPhan.set(response.data.filter((lop) => !lop.da_xoa));
        this.dangTaiLop.set(false);
        const idDuocChon =
          this.queryLop && this.lopHocPhan().some((lop) => String(lop.id) === this.queryLop)
            ? this.queryLop
            : String(this.lopHocPhan()[0]?.id ?? '');
        this.chonLop(idDuocChon);
      },
      error: () => {
        this.loi.set('Không tải được danh sách lớp học phần. Vui lòng thử lại.');
        this.dangTaiLop.set(false);
      },
    });
  }

  chonLop(id: string): void {
    this.taiBuoi?.unsubscribe();
    this.lopDangChon.set(id);
    this.buoi.set([]);
    if (!id) {
      this.dangTaiBuoi.set(false);
      this.loi.set('');
      return;
    }

    this.dangTaiBuoi.set(true);
    this.loi.set('');
    this.taiBuoi = this.service
      .layBuoiTheoLop(Number(id))
      .pipe(
        switchMap((buoi) =>
          buoi.length
            ? forkJoin(
                buoi.map((item) =>
                  this.service.layDiemDanh(item.id).pipe(
                    map((rows: DongDiemDanh[]) => ({
                      ...item,
                      daDiemDanh: rows.length > 0 && rows.every((row) => row.trang_thai !== null),
                    })),
                  ),
                ),
              )
            : of([]),
        ),
      )
      .subscribe({
        next: (rows) => {
          this.buoi.set(rows);
          this.dangTaiBuoi.set(false);
        },
        error: () => {
          this.loi.set('Không tải được các buổi học. Vui lòng thử lại.');
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

  nhanTrangThai(buoi: BuoiHienThi): string {
    if (buoi.trang_thai === 'CANCELLED') return 'Đã hủy';
    return buoi.daDiemDanh ? 'Đã điểm danh' : 'Chưa điểm danh';
  }

  mauTrangThai(buoi: BuoiHienThi): 'success' | 'warning' | 'neutral' {
    if (buoi.trang_thai === 'CANCELLED') return 'neutral';
    return buoi.daDiemDanh ? 'success' : 'warning';
  }
}
