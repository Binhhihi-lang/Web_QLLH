import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { AppButton } from '@shared/ui/app-button';
import { AppToastService } from '@shared/ui/app-toast.service';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { CotBang, DataTable, OTuyChinh } from '@shared/ui/data-table';
import { PageHeader } from '@shared/ui/page-header';
import { StatusBadge } from '@shared/ui/status-badge';
import { DangKyHocPhan, DangKyService, TrangThaiDangKy } from './dang-ky.service';

type HocKyLuaChon = { id: number; label: string };

@Component({
  selector: 'app-dang-ky-cua-toi',
  standalone: true,
  imports: [AppButton, ConfirmDialog, DataTable, OTuyChinh, PageHeader, RouterLink, StatusBadge],
  template: `
    <app-page-header
      title="Đăng ký của tôi"
      description="Theo dõi lớp học phần đã đăng ký và hủy đăng ký trong thời gian cho phép."
    >
      <a class="link" routerLink="/lop-hoc-phan">Tìm lớp học phần</a>
    </app-page-header>

    <section class="bo-loc" aria-label="Lọc đăng ký của tôi">
      <label>
        <span>Học kỳ</span>
        <select (change)="doiHocKy(giaTri($event))">
          <option value="">Tất cả học kỳ</option>
          @for (semester of hocKy(); track semester.id) {
            <option [value]="semester.id" [selected]="hocKyId() === idChuoi(semester.id)">
              {{ semester.label }}
            </option>
          }
        </select>
      </label>
      <label>
        <span>Trạng thái</span>
        <select (change)="doiTrangThai(giaTri($event))">
          <option value="" [selected]="trangThai() === ''">Tất cả trạng thái</option>
          <option value="ACTIVE" [selected]="trangThai() === 'ACTIVE'">Đang hiệu lực</option>
          <option value="CANCELLED" [selected]="trangThai() === 'CANCELLED'">Đã hủy</option>
        </select>
      </label>
      @if (hocKyId() || trangThai()) {
        <button type="button" class="xoa-loc" (click)="xoaLoc()">Xóa lọc</button>
      }
    </section>

    <app-data-table
      [cot]="cot()"
      [rows]="rows()"
      [dangTai]="dangTai()"
      [loi]="loiTai()"
      (thuLai)="tai()"
      tieuDeRong="Bạn chưa đăng ký học phần"
      moTaRong="Các lớp đang mở và còn chỗ sẽ xuất hiện trong mục Lớp học phần."
    >
      <ng-template appOTuyChinh="lop_hoc_phan" let-row>
        <div class="lop">
          <strong>{{ row.lop_hoc_phan.ma_lop_hp }}</strong>
          <small>{{ row.lop_hoc_phan.mon_hoc }}</small>
        </div>
      </ng-template>
      <ng-template appOTuyChinh="trang_thai" let-row>
        <app-status-badge
          [value]="row.trang_thai"
          [label]="row.trang_thai === 'ACTIVE' ? 'Đang hiệu lực' : 'Đã hủy'"
        />
      </ng-template>
      <ng-template appOTuyChinh="thao_tac" let-row>
        @if (row.trang_thai === 'ACTIVE') {
          <app-button
            variant="danger"
            size="sm"
            [disabled]="dangHuyId() === row.id"
            (click)="moXacNhan(row, $event)"
          >
            Hủy đăng ký
          </app-button>
        } @else {
          <span class="da-huy">Đã hoàn tất</span>
        }
      </ng-template>
    </app-data-table>
    @if (dangKyCanHuy(); as enrollment) {
      <app-confirm-dialog
        tieuDe="Hủy đăng ký học phần"
        [moTa]="'Bạn có chắc muốn hủy lớp ' + enrollment.lop_hoc_phan.ma_lop_hp + ' — ' + enrollment.lop_hoc_phan.mon_hoc + '? Thao tác chỉ thực hiện được trong đợt đăng ký và trước khi có điểm/điểm danh.'"
        nhanDongY="Hủy đăng ký"
        [dangXuLy]="dangHuyId() === enrollment.id"
        [lyDoChan]="loiHuy()"
        (dongY)="xacNhanHuy()"
        (huy)="dongXacNhan()"
      />
    }
  `,
  styles: `
    :host{display:grid;gap:14px}.link{color:var(--color-primary);font-size:var(--text-small);font-weight:600;text-decoration:none}.link:hover{text-decoration:underline}.bo-loc{display:flex;align-items:end;gap:12px;flex-wrap:wrap;padding:14px 16px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-lg)}.bo-loc label{display:grid;gap:5px;color:var(--color-ink-muted);font-size:var(--text-caption);font-weight:600}.bo-loc select{min-width:190px;padding:9px 10px;border:1px solid var(--color-border);border-radius:var(--radius);background:var(--color-surface);color:var(--color-ink);font:400 var(--text-small) var(--font-body)}.xoa-loc{border:0;background:transparent;color:var(--color-ink-muted);font:600 var(--text-small) var(--font-body);cursor:pointer}.xoa-loc:hover{color:var(--color-danger)}.lop{display:grid;gap:3px;min-width:150px}.lop strong{font-size:var(--text-small);font-weight:600}.lop small,.da-huy{color:var(--color-ink-muted);font-size:var(--text-caption)}@media(max-width:620px){.bo-loc{align-items:stretch}.bo-loc label,.bo-loc select{width:100%}}
  `,
})
export class DangKyCuaToi {
  private readonly service = inject(DangKyService);
  private readonly lopHocPhanService = inject(LopHocPhanService);
  private readonly toast = inject(AppToastService);

  readonly rows = signal<DangKyHocPhan[]>([]);
  readonly hocKy = signal<HocKyLuaChon[]>([]);
  readonly hocKyId = signal('');
  readonly trangThai = signal('');
  readonly dangTai = signal(true);
  readonly loiTai = signal<string | null>(null);
  readonly dangKyCanHuy = signal<DangKyHocPhan | null>(null);
  readonly dangHuyId = signal<number | null>(null);
  /** Lỗi hủy hiện trong hộp xác nhận — người dùng còn đang ở đó để thử lại. */
  readonly loiHuy = signal('');

  readonly cot = computed<CotBang<DangKyHocPhan>[]>(() => [
    { khoa: 'lop_hoc_phan', nhan: 'Lớp học phần', rong: '250px' },
    { khoa: 'lop_hoc_phan.hoc_ky.ten_hoc_ky', nhan: 'Học kỳ', rong: '220px' },
    { khoa: 'dang_ky_luc', nhan: 'Ngày đăng ký', rong: '175px' },
    { khoa: 'trang_thai', nhan: 'Trạng thái', rong: '155px' },
    { khoa: 'thao_tac', nhan: 'Thao tác', rong: '145px' },
  ]);

  constructor() {
    this.lopHocPhanService.layTuyChon('semesters').subscribe({
      next: (rows) => this.hocKy.set(rows),
      error: () => this.loiTai.set('Không thể tải danh sách học kỳ.'),
    });
    this.tai();
  }

  giaTri(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  idChuoi(id: number): string {
    return id.toString();
  }

  doiHocKy(value: string): void {
    this.hocKyId.set(value);
    this.tai();
  }

  doiTrangThai(value: string): void {
    this.trangThai.set(value);
    this.tai();
  }

  xoaLoc(): void {
    this.hocKyId.set('');
    this.trangThai.set('');
    this.tai();
  }

  tai(): void {
    this.dangTai.set(true);
    this.loiTai.set(null);
    const filter: {
      page: number;
      per_page: 100;
      hoc_ky_id?: number;
      trang_thai?: TrangThaiDangKy;
    } = {
      // Đăng ký của một sinh viên thường chỉ vài dòng — lấy hết một trang,
      // không phân trang để bảng không bị cắt vụn.
      page: 1,
      per_page: 100,
      ...(this.hocKyId() ? { hoc_ky_id: Number(this.hocKyId()) } : {}),
      ...(this.trangThai() ? { trang_thai: this.trangThai() as TrangThaiDangKy } : {}),
    };
    this.service.layCuaToi(filter).subscribe({
      next: (response) => {
        this.rows.set(response.data);
        this.dangTai.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.loiTai.set(error.error?.message ?? 'Không thể tải đăng ký của bạn.');
        this.dangTai.set(false);
      },
    });
  }

  moXacNhan(row: DangKyHocPhan, event: Event): void {
    event.stopPropagation();
    this.loiHuy.set('');
    this.dangKyCanHuy.set(row);
  }

  dongXacNhan(): void {
    if (this.dangHuyId() === null) {
      this.loiHuy.set('');
      this.dangKyCanHuy.set(null);
    }
  }

  xacNhanHuy(): void {
    const row = this.dangKyCanHuy();
    if (!row || this.dangHuyId() !== null) return;
    this.dangHuyId.set(row.id);
    this.loiHuy.set('');
    this.service.huyDangKyCuaToi(row.id).subscribe({
      next: () => {
        this.dangKyCanHuy.set(null);
        this.dangHuyId.set(null);
        this.toast.hien('Đã hủy đăng ký học phần.', 'success');
        this.tai();
      },
      error: (error: { error?: { message?: string } }) => {
        this.dangHuyId.set(null);
        this.loiHuy.set(error.error?.message ?? 'Không thể hủy đăng ký học phần.');
      },
    });
  }
}
