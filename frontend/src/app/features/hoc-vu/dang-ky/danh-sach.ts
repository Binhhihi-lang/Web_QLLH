import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '@core/auth/auth.service';
import { RouterLink } from '@angular/router';
import { SinhVien } from '@core/models/dao-tao.model';
import { LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { SinhVienService } from '@core/services/sinh-vien.service';
import { PageMeta } from '@core/mock/mock-response';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { CotBang, DataTable, OTuyChinh } from '@shared/ui/data-table';
import { PageHeader } from '@shared/ui/page-header';
import { Pagination } from '@shared/ui/pagination';
import { SearchInput } from '@shared/ui/search-input';
import { StatusBadge } from '@shared/ui/status-badge';
import { BoLocDangKy, DangKyHocPhan, DangKyService } from './dang-ky.service';

type BoLocTam = { hocKy: string; lopHocPhan: string; sinhVien: string; trangThai: string };
type LuaChon = { id: number; label: string };

@Component({
  selector: 'app-dang-ky-danh-sach',
  standalone: true,
  imports: [AppAlert, AppButton, DataTable, OTuyChinh, PageHeader, Pagination, RouterLink, SearchInput, StatusBadge],
  template: `
    <app-page-header
      title="Danh sách đăng ký"
      description="Tra cứu sinh viên đã đăng ký theo học kỳ, lớp học phần và trạng thái."
    >
      @if (laAdmin()) {
        <app-button variant="primary" routerLink="/dang-ky">
          <span class="material-icons" aria-hidden="true">person_add</span>
          Đăng ký hộ
        </app-button>
      }
    </app-page-header>

    @if (loiTai()) {
      <app-alert muc="danger" title="Không tải được dữ liệu">{{ loiTai() }}</app-alert>
    }

    <section class="bo-loc" aria-label="Bộ lọc danh sách đăng ký">
      <app-search-input
        placeholder="Tìm mã SV, họ tên hoặc mã lớp học phần…"
        [value]="tuKhoa()"
        (valueChange)="timKiem($event)"
      />
      <label>
        <span>Học kỳ</span>
        <select (change)="capNhatLoc('hocKy', giaTri($event))">
          <option value="">Tất cả học kỳ</option>
          @for (option of hocKy(); track option.id) {
            <option [value]="option.id" [selected]="locTam().hocKy === idChuoi(option.id)">
              {{ option.label }}
            </option>
          }
        </select>
      </label>
      <label>
        <span>Lớp học phần</span>
        <select (change)="capNhatLoc('lopHocPhan', giaTri($event))">
          <option value="">Tất cả lớp học phần</option>
          @for (option of lopHocPhan(); track option.id) {
            <option [value]="option.id" [selected]="locTam().lopHocPhan === idChuoi(option.id)">
              {{ option.label }}
            </option>
          }
        </select>
      </label>
      <label>
        <span>Sinh viên</span>
        <select (change)="capNhatLoc('sinhVien', giaTri($event))">
          <option value="">Tất cả sinh viên</option>
          @for (student of sinhVien(); track student.id) {
            <option [value]="student.id" [selected]="locTam().sinhVien === idChuoi(student.id)">
              {{ student.ma_sv }} · {{ student.ho_ten }}
            </option>
          }
        </select>
      </label>
      <label>
        <span>Trạng thái</span>
        <select (change)="capNhatLoc('trangThai', giaTri($event))">
          <option value="" [selected]="locTam().trangThai === ''">Tất cả trạng thái</option>
          <option value="ACTIVE" [selected]="locTam().trangThai === 'ACTIVE'">Đang hiệu lực</option>
          <option value="CANCELLED" [selected]="locTam().trangThai === 'CANCELLED'">Đã hủy</option>
        </select>
      </label>
      <div class="nut-loc">
        <app-button variant="secondary" size="sm" (click)="apDungLoc()">Áp dụng</app-button>
        @if (coLoc()) {
          <button type="button" (click)="xoaLoc()">Xóa lọc</button>
        }
      </div>
    </section>

    <app-data-table
      [cot]="cot()"
      [rows]="rows()"
      [dangTai]="dangTai()"
      [loi]="null"
      (thuLai)="tai()"
      tieuDeRong="Không tìm thấy đăng ký"
      [moTaRong]="coLoc() ? 'Thử thay đổi điều kiện lọc hoặc xóa bộ lọc.' : 'Chưa có sinh viên đăng ký học phần.'"
    >
      <ng-template appOTuyChinh="sinh_vien" let-row>
        <div class="sinh-vien">
          <strong>{{ row.sinh_vien.ho_ten }}</strong>
          <small>{{ row.sinh_vien.ma_sv }}</small>
        </div>
      </ng-template>
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
    </app-data-table>
    @if (meta(); as page) {
      <app-pagination
        [currentPage]="page.current_page"
        [perPage]="page.per_page"
        [total]="page.total"
        [lastPage]="page.last_page"
        (pageChange)="doiTrang($event)"
        (perPageChange)="doiCoTrang($event)"
      />
    }
  `,
  styles: `
    :host{display:grid;gap:14px}.bo-loc{display:flex;align-items:end;gap:12px;flex-wrap:wrap;padding:16px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)}app-search-input{flex:1 1 270px;max-width:380px}.bo-loc label{display:grid;gap:5px;color:var(--color-ink-muted);font-size:var(--text-caption);font-weight:600}.bo-loc select{min-width:150px;max-width:230px;padding:9px 10px;border:1px solid var(--color-border);border-radius:var(--radius);background:var(--color-surface);color:var(--color-ink);font:400 var(--text-small) var(--font-body)}.nut-loc{display:flex;align-items:center;gap:8px}.nut-loc>button{border:0;background:transparent;color:var(--color-ink-muted);font:600 var(--text-small) var(--font-body);cursor:pointer}.nut-loc>button:hover{color:var(--color-danger)}.sinh-vien,.lop{display:grid;gap:3px;min-width:145px}.sinh-vien strong,.lop strong{font-size:var(--text-small);font-weight:600}.sinh-vien small,.lop small{color:var(--color-ink-muted);font-size:var(--text-caption)}@media(max-width:720px){.bo-loc{padding:12px}.bo-loc label,.bo-loc select,app-search-input{width:100%;max-width:none}.nut-loc{width:100%;justify-content:flex-end}}
  `,
})
export class DangKyDanhSach {
  private readonly service = inject(DangKyService);
  private readonly lopHocPhanService = inject(LopHocPhanService);
  private readonly sinhVienService = inject(SinhVienService);
  private readonly auth = inject(AuthService);

  readonly laAdmin = computed(() => this.auth.nguoiDung()?.vai_tro === 'ADMIN');
  readonly rows = signal<DangKyHocPhan[]>([]);
  readonly meta = signal<PageMeta | null>(null);
  readonly hocKy = signal<LuaChon[]>([]);
  readonly lopHocPhan = signal<LuaChon[]>([]);
  readonly sinhVien = signal<SinhVien[]>([]);
  readonly locTam = signal<BoLocTam>({ hocKy: '', lopHocPhan: '', sinhVien: '', trangThai: '' });
  readonly loc = signal<BoLocTam>({ hocKy: '', lopHocPhan: '', sinhVien: '', trangThai: '' });
  readonly tuKhoa = signal('');
  readonly dangTai = signal(true);
  readonly loiTai = signal<string | null>(null);
  private trang = 1;
  private coTrang = 10;

  readonly cot = computed<CotBang<DangKyHocPhan>[]>(() => [
    { khoa: 'sinh_vien', nhan: 'Sinh viên', rong: '210px' },
    { khoa: 'lop_hoc_phan', nhan: 'Lớp học phần', rong: '220px' },
    { khoa: 'lop_hoc_phan.hoc_ky.ten_hoc_ky', nhan: 'Học kỳ', rong: '200px' },
    { khoa: 'dang_ky_luc', nhan: 'Ngày đăng ký', rong: '165px' },
    { khoa: 'trang_thai', nhan: 'Trạng thái', rong: '145px' },
  ]);
  readonly coLoc = computed(
    () =>
      Object.values(this.loc()).some((value) => value !== '') ||
      this.tuKhoa().trim() !== '',
  );

  constructor() {
    this.taiTuyChon();
    this.tai();
  }

  giaTri(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  idChuoi(id: number): string {
    return id.toString();
  }

  capNhatLoc(khoa: keyof BoLocTam, value: string): void {
    this.locTam.update((current) => ({ ...current, [khoa]: value }));
  }

  apDungLoc(): void {
    this.loc.set({ ...this.locTam() });
    this.trang = 1;
    this.tai();
  }

  xoaLoc(): void {
    const empty = { hocKy: '', lopHocPhan: '', sinhVien: '', trangThai: '' };
    this.locTam.set(empty);
    this.loc.set(empty);
    this.tuKhoa.set('');
    this.trang = 1;
    this.tai();
  }

  timKiem(value: string): void {
    this.tuKhoa.set(value);
    this.trang = 1;
    this.tai();
  }

  doiTrang(page: number): void {
    this.trang = page;
    this.tai();
  }

  doiCoTrang(value: number): void {
    this.coTrang = value;
    this.trang = 1;
    this.tai();
  }

  tai(): void {
    this.dangTai.set(true);
    this.loiTai.set(null);
    const filters = this.loc();
    const query: BoLocDangKy & { q?: string } = {
      page: this.trang,
      per_page: this.coTrang as 10 | 25 | 50 | 100,
      ...(filters.hocKy ? { hoc_ky_id: Number(filters.hocKy) } : {}),
      ...(filters.lopHocPhan ? { lop_hoc_phan_id: Number(filters.lopHocPhan) } : {}),
      ...(filters.sinhVien ? { sinh_vien_id: Number(filters.sinhVien) } : {}),
      ...(filters.trangThai ? { trang_thai: filters.trangThai as 'ACTIVE' | 'CANCELLED' } : {}),
      ...(this.tuKhoa().trim() ? { q: this.tuKhoa().trim() } : {}),
    };
    this.service.layDanhSach(query).subscribe({
      next: (response) => {
        this.rows.set(response.data);
        this.meta.set(response.meta);
        this.dangTai.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.loiTai.set(error.error?.message ?? 'Không thể tải danh sách đăng ký.');
        this.dangTai.set(false);
      },
    });
  }

  private taiTuyChon(): void {
    this.lopHocPhanService.layTuyChon('semesters').subscribe({
      next: (rows) => this.hocKy.set(rows),
      error: () => this.loiTai.set('Không thể tải danh sách học kỳ.'),
    });
    this.lopHocPhanService.layDanhSach({ page: 1, per_page: 100 }).subscribe({
      next: (response) =>
        this.lopHocPhan.set(
          response.data.map((section) => ({
            id: section.id,
            label: `${section.ma_lop_hp} · ${section.mon_hoc.ten_mon}`,
          })),
        ),
      error: () => this.loiTai.set('Không thể tải danh sách lớp học phần.'),
    });
    this.sinhVienService.layDanhSach({ page: 1, per_page: 100 }).subscribe({
      next: (response) => this.sinhVien.set(response.data),
      error: () => this.loiTai.set('Không thể tải danh sách sinh viên.'),
    });
  }
}
