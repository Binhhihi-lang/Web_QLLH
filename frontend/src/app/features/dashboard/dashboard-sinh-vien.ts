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
import { BadgeSac, StatusBadge } from '@shared/ui/status-badge';
import { NgayVnPipe } from '@shared/pipes/ngay-vn.pipe';
import {
  BuoiTrongTuan,
  DashboardSinhVien,
  HocPhanDaDangKy,
  MonCanChuY,
} from './dashboard.model';
import { BieuDoCotDiem, DuLieuCotDiem } from './bieu-do-cot-diem';
import { ChonHocKy, KyTrongODChon } from './chon-hoc-ky';
import { TheSoLieuCard } from './the-so-lieu';
import { BieuDoTron } from './bieu-do-tron';
import { DiemService, DiemMonHoc } from '@features/hoc-vu/diem/diem.service';
import {
  CHUA_CO,
  LatBieuDo,
  dinhDangSoHienThi,
  dinhDangTuPhanSo,
  latChuyenCan,
  lopCaHoc,
  mauChuyenCan,
  mauTrangThaiBuoi,
  nhanHinhThuc,
  nhanTrangThaiBuoi,
  nhanThu,
  phanSoSangPhanTram,
  sapXepTuan,
} from './dashboard-tinh-toan';

/**
 * Dashboard SINH_VIEN (SCR-05) — `GET /api/dashboard/student` + `GET /api/me/grades`.
 *
 * Hai thang tỉ lệ KHÔNG được lẫn (hợp đồng §14):
 * - `the_so_lieu[chuyen_can].gia_tri` là phần trăm 0–100 → hiện nguyên.
 * - `chuyen_can.ty_le` và `hoc_phan_da_dang_ky[].ty_le_chuyen_can` là phân số
 *   0–1 → nhân 100 khi hiện chữ, dùng trực tiếp khi vẽ thanh tiến trình.
 *
 * Vì sao khối điểm gọi thêm `/me/grades` thay vì đọc từ dashboard: hợp đồng
 * không trả `diem_tb_lop` trong dashboard — nó thuộc §14c của endpoint grades.
 * Hợp đồng §14 cho dashboard vẫn tính là "một lần gọi"; khối điểm là nguồn
 * riêng, một request phụ CÙNG kỳ nên không thành N+1.
 */
@Component({
  selector: 'app-dashboard-sinh-vien',
  standalone: true,
  imports: [
    RouterLink,
    AppAlert,
    AppButton,
    AppCard,
    BieuDoCotDiem,
    BieuDoTron,
    ChonHocKy,
    EmptyState,
    LoadingState,
    PageHeader,
    SkeletonBlock,
    StatusBadge,
    TheSoLieuCard,
    NgayVnPipe,
  ],
  templateUrl: './dashboard-sinh-vien.html',
  styleUrls: ['./dashboard-chung.css', './dashboard-sinh-vien.css'],
})
export class DashboardSinhVienPage {
  private readonly service = inject(DashboardService);
  private readonly diem = inject(DiemService);
  private readonly lopHocPhan = inject(LopHocPhanService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly dangTai = signal(true);
  readonly loi = signal<string | null>(null);
  readonly duLieu = signal<DashboardSinhVien | null>(null);

  /** Danh sách kỳ của ô chọn + kỳ đang xem. */
  readonly dsKy = signal<KyTrongODChon[]>([]);
  readonly hocKyId = signal<number | null>(null);

  /** Khối điểm có nguồn riêng: `null` = chưa tải hoặc lỗi (khối tự xử lý). */
  readonly bangDiem = signal<DiemMonHoc[] | null>(null);
  readonly dangTaiDiem = signal(false);
  readonly loiDiem = signal(false);

  readonly theSoLieu = computed(() => this.duLieu()?.the_so_lieu ?? []);
  readonly hocPhan = computed(() => this.duLieu()?.hoc_phan_da_dang_ky ?? []);
  readonly cacBuoi = computed(() => this.duLieu()?.thoi_khoa_bieu_tuan?.cac_buoi ?? []);
  readonly tuan = computed(() => this.duLieu()?.thoi_khoa_bieu_tuan ?? null);
  readonly gpa = computed(() => this.duLieu()?.gpa ?? null);
  readonly chuyenCan = computed(() => this.duLieu()?.chuyen_can ?? null);

  readonly hocKy = computed(() => this.duLieu()?.hoc_ky ?? null);

  /** Luôn đủ 7 ngày để lưới tuần không co giãn khác nhau giữa các tuần. */
  readonly tuanTheoThu = computed(() => sapXepTuan(this.cacBuoi()));

  readonly latChuyenCan = computed<LatBieuDo[] | null>(() => {
    const cc = this.chuyenCan();
    return cc ? latChuyenCan(cc) : null;
  });

  /**
   * Cột của biểu đồ "Kết quả học tập": mỗi môn một cột `diem_tong_ket` + đường
   * nối `diem_tb_lop`. Học kỳ chỉ có 1 môn thì KHÔNG vẽ (quy ước: một cột duy
   * nhất trông như lỗi render).
   */
  readonly cotDiem = computed<DuLieuCotDiem[]>(() => {
    const rows = this.bangDiem() ?? [];
    if (rows.length < 2) return [];
    const daSapXep = [...rows].sort(
      (a, b) => (a.diem_tong_ket === null ? 1 : 0) - (b.diem_tong_ket === null ? 1 : 0),
    );
    return daSapXep.map((m) => ({
      nhan: m.ten_mon,
      ten_day_du: `${m.ma_mon} — ${m.ten_mon}`,
      gia_tri: m.diem_tong_ket,
      diem_tb_lop: m.diem_tb_lop ?? null,
    }));
  });

  /** Có ít nhất MỘT môn có điểm tổng kết → mới đủ điều kiện vẽ khối điểm. */
  readonly coDiemTongKet = computed(() =>
    (this.bangDiem() ?? []).some((m) => m.diem_tong_ket !== null),
  );

  readonly loiChao = computed(() => {
    const ten = this.auth.nguoiDung()?.name || this.auth.nguoiDung()?.ho_so?.ho_ten;
    return ten ? `Xin chào, ${ten}` : 'Xin chào';
  });

  readonly phuDe = computed(
    () => this.hocKy()?.ten_hoc_ky ?? 'Chưa đăng ký học phần nào',
  );

  /** Rỗng toàn bộ: chưa có học kỳ và không có học phần nào. */
  readonly rongToanBo = computed(
    () =>
      this.hocKy() === null &&
      this.hocPhan().length === 0 &&
      this.cacBuoi().length === 0,
  );

  /** Đã có dữ liệu cũ để giữ khung khi đổi kỳ (chỉ mờ, không xoá trắng). */
  readonly coDuLieuCu = computed(() => this.duLieu() !== null);

  constructor() {
    this.taiDanhSachKy();
    this.tai();
  }

  private taiDanhSachKy(): void {
    this.lopHocPhan.layTuyChon('semesters').subscribe({
      next: (rows) => this.dsKy.set(rows as KyTrongODChon[]),
      // Danh sách kỳ lỗi không chặn dashboard — vẫn xem được kỳ mặc định.
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
    this.bangDiem.set(null);
    this.loiDiem.set(false);

    const ky = this.hocKyId() ?? undefined;

    this.service.layDashboardSinhVien(ky).subscribe({
      next: (d) => {
        this.duLieu.set(d);
        // Đồng bộ ô chọn với kỳ backend thật sự trả (lần mở đầu không truyền).
        if (d.hoc_ky) this.hocKyId.set(d.hoc_ky.id);
        this.dangTai.set(false);
        // Khối điểm tải sau nhưng CÙNG kỳ: không chặn phần còn lại của trang.
        this.taiDiem(d.hoc_ky?.id ?? ky);
      },
      error: (loi: unknown) => {
        if (this.xuLyMatQuyen(loi)) return;
        this.loi.set('Không tải được số liệu dashboard. Kiểm tra kết nối rồi thử lại.');
        this.dangTai.set(false);
      },
    });
  }

  private taiDiem(hocKyId?: number): void {
    this.dangTaiDiem.set(true);
    this.diem.layDiemCuaToi(hocKyId).subscribe({
      next: (d) => {
        this.bangDiem.set(d.mon_hoc);
        this.dangTaiDiem.set(false);
      },
      // Khối điểm lỗi KHÔNG làm hỏng dashboard: chỉ khối đó hiện thông báo.
      error: () => {
        this.loiDiem.set(true);
        this.dangTaiDiem.set(false);
      },
    });
  }

  private xuLyMatQuyen(loi: unknown): boolean {
    if (!(loi instanceof HttpErrorResponse) || loi.status !== 403) return false;
    this.auth.xoaPhien();
    void this.router.navigate(['/dang-nhap'], { queryParams: { returnUrl: '/dashboard' } });
    return true;
  }

  /** "Hành vi bấm" của lưới thẻ — bảng trong docs/05-screens.md §3.2. */
  bamThe(khoa: string): void {
    const dich: Record<string, string> = {
      tin_chi: '/dang-ky-cua-toi',
      hoc_phan: '/dang-ky-cua-toi',
      gpa_he_4: '/diem-cua-toi',
      chuyen_can: '/diem-danh-cua-toi',
    };
    const url = dich[khoa];
    if (url) void this.router.navigate([url]);
  }

  theBamDuoc(khoa: string): boolean {
    return khoa in { tin_chi: 1, hoc_phan: 1, gpa_he_4: 1, chuyen_can: 1 };
  }

  moHocPhan(h: HocPhanDaDangKy): void {
    void this.router.navigate(['/lop-hoc-phan', h.lop_hoc_phan_id]);
  }

  moLich(): void {
    void this.router.navigate(['/lich-hoc']);
  }

  moDiem(): void {
    const hocKyId = this.hocKy()?.id;
    void this.router.navigate(['/diem-cua-toi'], {
      queryParams: hocKyId ? { hoc_ky_id: hocKyId } : {},
    });
  }

  moDiemDanh(): void {
    void this.router.navigate(['/diem-danh-cua-toi']);
  }

  moMonCanChuY(m: MonCanChuY): void {
    // Đặc tả: mở màn điểm danh cá nhân, lọc theo học kỳ đang xem.
    const hocKyId = this.hocKy()?.id;
    void this.router.navigate(['/diem-danh-cua-toi'], {
      queryParams: hocKyId ? { hoc_ky_id: hocKyId } : {},
    });
  }

  /** Phân số 0–1 → `90,7 %`; null → `—` (chưa có buổi nào được điểm danh). */
  phanTramTuPhanSo(tyLe: number | null | undefined): string {
    return dinhDangTuPhanSo(tyLe);
  }

  /** Độ dài thanh tiến trình nhận 0–1 trực tiếp; null → 0 (không có gì để vẽ). */
  doDayThanh(tyLe: number | null | undefined): number {
    if (tyLe === null || tyLe === undefined || Number.isNaN(tyLe)) return 0;
    return Math.max(0, Math.min(1, tyLe));
  }

  sacChuyenCan(tyLe: number | null | undefined): string {
    return mauChuyenCan(tyLe) ?? 'neutral';
  }

  dinhDangGpa(giaTri: number | null | undefined): string {
    return giaTri === null || giaTri === undefined ? CHUA_CO : dinhDangSoHienThi(giaTri);
  }

  phanTramChuyenCanThanh(): string | null {
    const cc = this.chuyenCan();
    if (!cc) return null;
    const phanTram = phanSoSangPhanTram(cc.ty_le);
    return phanTram === null ? null : `${dinhDangSoHienThi(phanTram)} %`;
  }

  nhanTrangThai(b: BuoiTrongTuan): string {
    return nhanTrangThaiBuoi(b.trang_thai);
  }

  sacTrangThai(b: BuoiTrongTuan): BadgeSac {
    return mauTrangThaiBuoi(b.trang_thai);
  }

  thu(b: BuoiTrongTuan): string {
    return nhanThu(b.thu);
  }

  hinhThuc(b: BuoiTrongTuan): string {
    return nhanHinhThuc(b.hinh_thuc);
  }

  /**
   * Lớp màu khối ca học theo `hinh_thuc` — dùng chung token `--lich-*` với
   * lịch tuần SCR-35. Buổi đã huỷ thắng mọi lớp khác (đỏ đặc + dải chéo).
   */
  lopCua(b: BuoiTrongTuan): string {
    return lopCaHoc(b.hinh_thuc, b.trang_thai);
  }

  /** Nhãn điểm chữ; `null` hiện `—` chứ không phải ô trống. */
  chuDiem(h: HocPhanDaDangKy): string {
    return h.diem_chu ?? CHUA_CO;
  }
}
