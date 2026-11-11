import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { DashboardService } from '@core/services/dashboard.service';
import { LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { AppCard } from '@shared/ui/app-card';
import { EmptyState } from '@shared/ui/empty-state';
import { LoadingState, SkeletonBlock } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';
import { StatusBadge } from '@shared/ui/status-badge';
import { AppToastService } from '@shared/ui/app-toast.service';
import { NgayVnPipe } from '@shared/pipes/ngay-vn.pipe';
import {
  BuoiChuaDiemDanh,
  BuoiSapToi,
  DashboardGiangVien,
  LopPhuTrach,
  MucDoViec,
  ViecCanLam,
} from './dashboard.model';
import {
  iconXuHuong,
  nhanThu,
  nhanThuNgan,
} from './dashboard-tinh-toan';
import { BieuDoCotDiem, DuLieuCotDiem } from './bieu-do-cot-diem';
import { ChonHocKy, KyTrongODChon } from './chon-hoc-ky';
import { TheSoLieuCard } from './the-so-lieu';

/**
 * Dashboard GIANG_VIEN (SCR-04) — `GET /api/dashboard/teacher`, một lần gọi.
 *
 * Thứ tự khối theo `docs/05-screens.md` §3.2: đầu trang (kèm ô chọn kỳ), 4 thẻ
 * số liệu, lớp phụ trách, việc cần làm, buổi sắp tới, buổi chưa điểm danh, và
 * biểu đồ cột điểm TB lớp phụ trách. Bấm vào đâu đi tới đó — dashboard KHÔNG
 * chứa thao tác ghi.
 */
@Component({
  selector: 'app-dashboard-giang-vien',
  standalone: true,
  imports: [
    RouterLink,
    AppAlert,
    AppButton,
    AppCard,
    BieuDoCotDiem,
    ChonHocKy,
    EmptyState,
    LoadingState,
    PageHeader,
    SkeletonBlock,
    StatusBadge,
    TheSoLieuCard,
    NgayVnPipe,
  ],
  templateUrl: './dashboard-giang-vien.html',
  styleUrls: ['./dashboard-chung.css', './dashboard-giang-vien.css'],
})
export class DashboardGiangVienPage {
  private readonly service = inject(DashboardService);
  private readonly lopHocPhan = inject(LopHocPhanService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(AppToastService);

  readonly dangTai = signal(true);
  readonly loi = signal<string | null>(null);
  readonly duLieu = signal<DashboardGiangVien | null>(null);

  /** Danh sách kỳ của ô chọn + kỳ đang xem (id, không phải object). */
  readonly dsKy = signal<KyTrongODChon[]>([]);
  readonly hocKyId = signal<number | null>(null);

  readonly theSoLieu = computed(() => this.duLieu()?.the_so_lieu ?? []);
  readonly lopPhuTrach = computed(() => this.duLieu()?.lop_phu_trach ?? []);
  readonly buoiSapToi = computed(() => this.duLieu()?.buoi_sap_toi ?? []);
  readonly buoiChuaDiemDanh = computed(() => this.duLieu()?.buoi_chua_diem_danh ?? []);
  readonly viecCanLam = computed(() => this.duLieu()?.viec_can_lam ?? []);

  readonly hocKy = computed(() => this.duLieu()?.hoc_ky ?? null);

  /**
   * Cột của biểu đồ "Điểm TB lớp phụ trách": MỘT chuỗi (không có đường TB —
   * đây đã là trung bình). Lớp chưa có `diem_tb_lop` (chưa chấm điểm hoặc
   * backend chưa trả trường) không thành cột, đúng đặc tả.
   */
  readonly cotDiem = computed<DuLieuCotDiem[]>(() =>
    this.lopPhuTrach()
      .filter((l) => typeof l.diem_tb_lop === 'number')
      .map((l) => ({
        nhan: l.ten_mon,
        ten_day_du: `${l.ten_mon} (${l.ma_lop_hp})`,
        gia_tri: l.diem_tb_lop ?? null,
      })),
  );

  readonly loiChao = computed(() => {
    const ten = this.auth.nguoiDung()?.name || this.auth.nguoiDung()?.ho_so?.ho_ten;
    return ten ? `Xin chào, ${ten}` : 'Xin chào';
  });

  readonly phuDe = computed(
    () => this.hocKy()?.ten_hoc_ky ?? 'Chưa được phân lớp trong học kỳ nào',
  );

  /**
   * Rỗng TOÀN BỘ: 200 nhưng không có học kỳ và mọi mảng rỗng. Đây là trạng
   * thái bình thường của giảng viên mới, không phải sự cố — không hiện "Thử
   * lại" vì bấm mãi cũng ra đúng thế.
   */
  readonly rongToanBo = computed(
    () =>
      this.hocKy() === null &&
      this.theSoLieu().length === 0 &&
      this.lopPhuTrach().length === 0 &&
      this.buoiSapToi().length === 0 &&
      this.buoiChuaDiemDanh().length === 0 &&
      this.viecCanLam().length === 0,
  );

  /**
   * Đổi kỳ thì GIỮ khung, chỉ mờ phần số liệu — xoá trắng rồi dựng lại làm cả
   * trang nhảy và mất vị trí cuộn. Lần tải đầu chưa có dữ liệu nên vẫn hiện
   * skeleton; từ lần đổi kỳ thứ hai thì dùng lớp `.dang-mo`.
   */
  readonly coDuLieuCu = computed(() => this.duLieu() !== null);

  constructor() {
    this.taiDanhSachKy();
    this.tai();
  }

  private taiDanhSachKy(): void {
    this.lopHocPhan.layTuyChon('semesters').subscribe({
      next: (rows) => {
        this.dsKy.set(rows as KyTrongODChon[]);
        // Không tự chọn kỳ ở FE: để backend quyết định kỳ mặc định (ONGOING có
        // dữ liệu) và trả về trong `hoc_ky`. Chọn hộ ở đây là đoán sai khi
        // giảng viên không dạy kỳ ONGOING.
      },
      // Danh sách kỳ lỗi không chặn dashboard: vẫn tải số liệu kỳ mặc định.
      error: () => this.dsKy.set([]),
    });
  }

  chonKy(id: number): void {
    if (id === this.hocKyId() && this.duLieu()) return;
    this.hocKyId.set(id);
    this.tai();
  }

  tai(): void {
    this.dangTai.set(true);
    this.loi.set(null);

    this.service.layDashboardGiangVien(this.hocKyId() ?? undefined).subscribe({
      next: (d) => {
        this.duLieu.set(d);
        // Backend trả kỳ thật đã chọn — đồng bộ ô chọn cả khi request không
        // truyền tham số (lần mở đầu tiên).
        if (d.hoc_ky) this.hocKyId.set(d.hoc_ky.id);
        this.dangTai.set(false);
      },
      error: (loi: unknown) => {
        if (this.xuLyMatQuyen(loi)) return;
        this.loi.set('Không tải được số liệu dashboard. Kiểm tra kết nối rồi thử lại.');
        this.dangTai.set(false);
      },
    });
  }

  /**
   * `403` ở dashboard nghĩa là token còn hạn nhưng vai trò đã đổi — giữ phiên
   * chỉ khiến mọi request sau đều 403. Xử lý giống `auth.interceptor` với 401.
   */
  private xuLyMatQuyen(loi: unknown): boolean {
    if (!(loi instanceof HttpErrorResponse) || loi.status !== 403) return false;
    this.auth.xoaPhien();
    void this.router.navigate(['/dang-nhap'], { queryParams: { returnUrl: '/dashboard' } });
    return true;
  }

  bamThe(khoa: string): void {
    const dich: Record<string, string> = {
      buoi_chua_diem_danh: '/diem-danh',
      lop_phu_trach: '/lop-hoc-phan',
    };
    const url = dich[khoa];
    if (url) void this.router.navigate([url]);
  }

  theBamDuoc(khoa: string): boolean {
    return khoa === 'buoi_chua_diem_danh' || khoa === 'lop_phu_trach';
  }

  moLop(l: LopPhuTrach): void {
    void this.router.navigate(['/lop-hoc-phan', l.id]);
  }

  /**
   * Quá hạn sửa (hoặc kỳ đã đóng) thì KHÔNG vào form điểm danh — backend sẽ
   * trả `409 ATTENDANCE_EDIT_EXPIRED`. Mở danh sách kèm thông báo thay vì để
   * người dùng bấm vào rồi bị chặn.
   */
  moBuoiChuaDiemDanh(b: BuoiChuaDiemDanh): void {
    if (!b.con_sua_duoc) {
      this.toast.hien('Quá hạn sửa điểm danh, chỉ quản trị viên sửa được.', 'warning');
      void this.router.navigate(['/diem-danh']);
      return;
    }
    void this.router.navigate(['/diem-danh', b.id]);
  }

  moBuoiSapToi(): void {
    void this.router.navigate(['/lich-hoc']);
  }

  moViec(v: ViecCanLam): void {
    // `url` do backend trả, có thể kèm query — `navigateByUrl` giữ nguyên cả hai.
    void this.router.navigateByUrl(v.url);
  }

  iconXuHuong = iconXuHuong;

  thu(t: BuoiSapToi | BuoiChuaDiemDanh): string {
    return nhanThu(t.thu);
  }

  /** Thứ dạng ngắn (`T2`…`T7`, `CN`) cho cột "Ngày" của bảng buổi sắp tới. */
  thuNgan(t: BuoiSapToi | BuoiChuaDiemDanh): string {
    return nhanThuNgan(t.thu);
  }

  /** `muc_do` chỉ tô màu icon — KHÔNG hiện chữ "cao/trung bình/thấp". */
  iconViec(mucDo: MucDoViec): string {
    const map: Record<MucDoViec, string> = {
      cao: 'priority_high',
      trung_binh: 'flag',
      thap: 'check_circle',
    };
    return map[mucDo];
  }

  sacViec(mucDo: MucDoViec): string {
    const map: Record<MucDoViec, string> = {
      cao: 'danger',
      trung_binh: 'info',
      thap: 'neutral',
    };
    return map[mucDo];
  }
}
