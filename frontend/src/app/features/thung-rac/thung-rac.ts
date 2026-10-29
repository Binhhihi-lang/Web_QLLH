import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  BanGhiThungRac,
  CAC_LOAI_THUC_THE,
  ThungRacFilter,
  ThungRacService,
} from '@core/services/thung-rac.service';
import { AlertMuc, AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { CotBang, DataTable, OTuyChinh } from '@shared/ui/data-table';
import { PageHeader } from '@shared/ui/page-header';
import { Pagination } from '@shared/ui/pagination';
import { SearchInput } from '@shared/ui/search-input';

@Component({
  selector: 'app-thung-rac',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    AppAlert,
    AppButton,
    ConfirmDialog,
    DataTable,
    OTuyChinh,
    PageHeader,
    Pagination,
    SearchInput,
  ],
  template: `
    <app-page-header
      title="Thùng rác"
      subtitle="Quản lý và khôi phục các bản ghi đã xóa mềm trong hệ thống (SCR-45)">
    </app-page-header>

    @if (thongBao()) {
      <div class="mb-4">
        <app-alert [muc]="thongBao()!.muc">
          {{ thongBao()!.noiDung }}
        </app-alert>
      </div>
    }

    <!-- Thanh bộ lọc -->
    <div class="bg-surface rounded-xl border border-outline-variant p-4 mb-6 shadow-sm flex flex-wrap gap-4 items-center justify-between">
      <div class="flex flex-wrap items-center gap-3 flex-1">
        <!-- Chọn loại thực thể -->
        <div class="flex items-center gap-2">
          <label for="loai-select" class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
            Loại dữ liệu:
          </label>
          <select
            id="loai-select"
            [ngModel]="loaiHienTai()"
            (ngModelChange)="doiLoai($event)"
            class="px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition">
            @for (item of danhSachLoai; track item.ma) {
              <option [value]="item.ma">{{ item.ten }}</option>
            }
          </select>
        </div>

        <!-- Tìm kiếm -->
        <div class="w-72">
          <app-search-input
            [placeholder]="'Tìm kiếm ' + tenLoaiHienTai() + '...'"
            [value]="boLoc().q ?? ''"
            (valueChange)="timKiem($event)">
          </app-search-input>
        </div>
      </div>

      <div class="flex items-center gap-2 text-xs text-on-surface-variant">
        <span>Tổng số: <strong class="text-on-surface font-semibold">{{ tongSo() }}</strong> bản ghi</span>
        <button
          type="button"
          (click)="taiLai()"
          class="p-2 hover:bg-surface-variant rounded-lg transition"
          title="Tải lại">
          <span class="material-icons text-base">refresh</span>
        </button>
      </div>
    </div>

    <!-- Bảng dữ liệu -->
    <app-data-table
      [cot]="cacCot"
      [rows]="danhSach()"
      [dangTai]="dangTai()"
      [loi]="loi()"
      (thuLai)="taiLai()">

      <!-- Cột Tên / Mã định danh -->
      <ng-template appOTuyChinh="thong_tin" let-row>
        <div class="flex flex-col">
          <span class="font-medium text-on-surface text-sm">
            {{ layTieuDe(row) }}
          </span>
          <span class="text-xs text-on-surface-variant font-mono">
            {{ layMoTaPhu(row) }}
          </span>
        </div>
      </ng-template>

      <!-- Cột Thời gian xóa -->
      <ng-template appOTuyChinh="deleted_at" let-row>
        <span class="text-xs text-on-surface-variant whitespace-nowrap">
          {{ row.deleted_at | date: 'dd/MM/yyyy HH:mm' }}
        </span>
      </ng-template>

      <!-- Cột Người xóa -->
      <ng-template appOTuyChinh="deleted_by" let-row>
        <span class="text-xs text-on-surface whitespace-nowrap">
          {{ row.xoa_boi?.name ?? '—' }}
        </span>
      </ng-template>

      <!-- Cột Thao tác -->
      <ng-template appOTuyChinh="thao_tac" let-row>
        <app-button
          variant="secondary"
          size="sm"
          (click)="moDialogKhoiPhuc(row)">
          Khôi phục
        </app-button>
      </ng-template>
    </app-data-table>

    <!-- Phân trang -->
    @if (tongSo() > 0 && !dangTai()) {
      <div class="mt-4">
        <app-pagination
          [currentPage]="trangHienTai()"
          [perPage]="boLoc().per_page ?? 10"
          [total]="tongSo()"
          [lastPage]="tongTrang()"
          (pageChange)="chuyenTrang($event)"
          (perPageChange)="doiCoTrang($event)">
        </app-pagination>
      </div>
    }

    <!-- Dialog xác nhận khôi phục -->
    @if (banGhiKhoiPhuc()) {
      <app-confirm-dialog
        [tieuDe]="'Khôi phục ' + tenLoaiHienTai()"
        [moTa]="'Bạn có chắc chắn muốn khôi phục ' + tenLoaiHienTai() + ' này về trạng thái hoạt động không?'"
        [nhanDongY]="'Khôi phục'"
        [nguyHiem]="false"
        [dangXuLy]="dangKhoiPhuc()"
        (dongY)="xacNhanKhoiPhuc()"
        (huy)="banGhiKhoiPhuc.set(null)">
      </app-confirm-dialog>
    }
  `,
})
export class ThungRacPage {
  private readonly service = inject(ThungRacService);

  readonly danhSachLoai = CAC_LOAI_THUC_THE;
  readonly loaiHienTai = signal<string>('subjects');
  readonly boLoc = signal<ThungRacFilter>({ page: 1, per_page: 10 });

  readonly dangTai = signal<boolean>(false);
  readonly dangKhoiPhuc = signal<boolean>(false);
  readonly loi = signal<string | null>(null);
  readonly danhSach = signal<BanGhiThungRac[]>([]);
  readonly tongSo = signal<number>(0);
  readonly trangHienTai = signal<number>(1);
  readonly tongTrang = signal<number>(1);

  readonly banGhiKhoiPhuc = signal<BanGhiThungRac | null>(null);
  readonly thongBao = signal<{ muc: AlertMuc; noiDung: string } | null>(null);

  readonly tenLoaiHienTai = computed(() => {
    return this.danhSachLoai.find((l) => l.ma === this.loaiHienTai())?.ten ?? 'bản ghi';
  });

  readonly cacCot: CotBang<BanGhiThungRac>[] = [
    { khoa: 'id', nhan: 'ID', rong: '70px', sap_xep: false },
    { khoa: 'thong_tin', nhan: 'Thông tin bản ghi', sap_xep: false },
    { khoa: 'deleted_at', nhan: 'Thời điểm xóa', rong: '160px', sap_xep: false },
    { khoa: 'deleted_by', nhan: 'Người xóa', rong: '160px', sap_xep: false },
    { khoa: 'thao_tac', nhan: 'Thao tác', rong: '130px', sap_xep: false },
  ];

  constructor() {
    this.taiDuLieu();
  }

  doiLoai(maLoai: string): void {
    this.loaiHienTai.set(maLoai);
    this.boLoc.set({ ...this.boLoc(), page: 1, q: '' });
    this.taiDuLieu();
  }

  timKiem(tuKhoa: string): void {
    this.boLoc.set({ ...this.boLoc(), q: tuKhoa, page: 1 });
    this.taiDuLieu();
  }

  chuyenTrang(trang: number): void {
    this.boLoc.set({ ...this.boLoc(), page: trang });
    this.taiDuLieu();
  }

  doiCoTrang(co: number): void {
    this.boLoc.set({ ...this.boLoc(), per_page: co, page: 1 });
    this.taiDuLieu();
  }

  taiLai(): void {
    this.taiDuLieu();
  }

  taiDuLieu(): void {
    this.dangTai.set(true);
    this.loi.set(null);

    this.service.layDanhSach(this.loaiHienTai(), this.boLoc()).subscribe({
      next: (res) => {
        this.danhSach.set(res.data);
        this.tongSo.set(res.meta.total);
        this.trangHienTai.set(res.meta.current_page);
        this.tongTrang.set(res.meta.last_page);
        this.dangTai.set(false);
      },
      error: (err) => {
        this.loi.set(err?.error?.message ?? 'Không tải được danh sách thùng rác.');
        this.dangTai.set(false);
      },
    });
  }

  layTieuDe(row: BanGhiThungRac): string {
    return (
      (row['ten_mon'] as string) ||
      (row['ho_ten'] as string) ||
      (row['ten_lop'] as string) ||
      (row['ten_phong'] as string) ||
      (row['ten_hoc_ky'] as string) ||
      (row['ten_menu'] as string) ||
      (row['ma_lop_hp'] as string) ||
      (row['name'] as string) ||
      `Bản ghi #${row.id}`
    );
  }

  layMoTaPhu(row: BanGhiThungRac): string {
    return (
      (row['ma_mon'] as string) ||
      (row['ma_sv'] as string) ||
      (row['ma_gv'] as string) ||
      (row['ma_lop'] as string) ||
      (row['ma_phong'] as string) ||
      (row['ma_hoc_ky'] as string) ||
      (row['url'] as string) ||
      (row['email'] as string) ||
      ''
    );
  }

  moDialogKhoiPhuc(row: BanGhiThungRac): void {
    this.banGhiKhoiPhuc.set(row);
  }

  xacNhanKhoiPhuc(): void {
    const item = this.banGhiKhoiPhuc();
    if (!item) return;

    this.dangKhoiPhuc.set(true);
    this.service.khoiPhuc(this.loaiHienTai(), item.id).subscribe({
      next: (res) => {
        this.thongBao.set({ muc: 'success', noiDung: res.message || 'Khôi phục thành công!' });
        this.banGhiKhoiPhuc.set(null);
        this.dangKhoiPhuc.set(false);
        this.taiDuLieu();
      },
      error: (err) => {
        this.thongBao.set({
          muc: 'danger',
          noiDung: err?.error?.message ?? 'Khôi phục thất bại.',
        });
        this.banGhiKhoiPhuc.set(null);
        this.dangKhoiPhuc.set(false);
      },
    });
  }
}
