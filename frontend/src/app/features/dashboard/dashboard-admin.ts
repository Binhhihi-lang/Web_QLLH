import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService } from '@core/services/dashboard.service';
import {
  DangKyGanDay,
  DashboardAdmin,
  LopSapMo,
  TheSoLieu,
  TyLeLapDay,
} from '@core/mock/data/dashboard.mock';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { AppCard } from '@shared/ui/app-card';
import { EmptyState } from '@shared/ui/empty-state';
import { LoadingState } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';
import { StatusBadge, BadgeSac } from '@shared/ui/status-badge';

/**
 * Dashboard ADMIN (SCR-03).
 *
 * Bốn phần theo tài liệu: thẻ số liệu, tỷ lệ lấp đầy, lớp sắp mở, đăng ký
 * gần đây. Có đủ 4 trạng thái UI bắt buộc: loading, có dữ liệu, rỗng, lỗi.
 */
@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [
    RouterLink,
    DecimalPipe,
    AppAlert,
    AppButton,
    AppCard,
    EmptyState,
    LoadingState,
    PageHeader,
    StatusBadge,
  ],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.css',
})
export class DashboardAdminPage {
  private readonly service = inject(DashboardService);

  readonly dangTai = signal(true);
  readonly loi = signal<string | null>(null);
  readonly duLieu = signal<DashboardAdmin | null>(null);

  readonly theSoLieu = computed(() => this.duLieu()?.the_so_lieu ?? []);
  readonly tyLeLapDay = computed(() => this.duLieu()?.ty_le_lap_day ?? []);
  readonly lopSapMo = computed(() => this.duLieu()?.lop_sap_mo ?? []);
  readonly dangKyGanDay = computed(() => this.duLieu()?.dang_ky_gan_day ?? []);

  /** Tỷ lệ lấp đầy cao nhất trong 4 kỳ — dùng để chuẩn hoá chiều cao cột. */
  private readonly tyLeCaoNhat = computed(() =>
    Math.max(100, ...this.tyLeLapDay().map((t) => this.phanTram(t))),
  );

  constructor() {
    this.tai();
  }

  tai(): void {
    this.dangTai.set(true);
    this.loi.set(null);

    this.service.layDashboardAdmin().subscribe({
      next: (d) => {
        this.duLieu.set(d);
        this.dangTai.set(false);
      },
      error: () => {
        this.loi.set('Không tải được số liệu dashboard. Kiểm tra kết nối rồi thử lại.');
        this.dangTai.set(false);
      },
    });
  }

  phanTram(t: TyLeLapDay): number {
    return t.tong_cho === 0 ? 0 : Math.round((t.da_dang_ky / t.tong_cho) * 100);
  }

  /** Chiều cao cột theo % của kỳ cao nhất, tối thiểu 6% để cột 0 vẫn thấy. */
  chieuCaoCot(t: TyLeLapDay): string {
    return `${Math.max(6, Math.round((this.phanTram(t) / this.tyLeCaoNhat()) * 100))}%`;
  }

  iconThe(khoa: string): string {
    const map: Record<string, string> = {
      sinh_vien: 'school',
      lop_hoc_phan: 'class',
      dang_ky: 'how_to_reg',
      cho_dang_ky: 'event_seat',
    };
    return map[khoa] ?? 'insights';
  }

  iconXuHuong(t: TheSoLieu): string {
    return t.xu_huong === 'len' ? 'trending_up' : t.xu_huong === 'xuong' ? 'trending_down' : 'remove';
  }

  nhanTrangThaiDangKy(t: DangKyGanDay): string {
    return t.trang_thai === 'THANH_CONG' ? 'Thành công' : 'Đã huỷ';
  }

  mauTrangThaiDangKy(t: DangKyGanDay): BadgeSac {
    return t.trang_thai === 'THANH_CONG' ? 'success' : 'neutral';
  }

  nhanTrangThaiLop(l: LopSapMo): string {
    const map: Record<string, string> = {
      OPEN: 'Đang mở',
      CLOSED: 'Đã đầy',
      CANCELLED: 'Đã huỷ',
    };
    return map[l.trang_thai] ?? l.trang_thai;
  }
}
