import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { BuoiHoc, BuoiHocService, HinhThucHoc } from '@core/services/buoi-hoc.service';
import { LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { AppToastService } from '@shared/ui/app-toast.service';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { DateInput } from '@shared/ui/date-input';
import { EmptyState } from '@shared/ui/empty-state';
import { LoadingState } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';
import { NgayVnPipe } from '@shared/pipes/ngay-vn.pipe';
import { XungDotLich, XungDotLichKhoi, docXungDotLich } from '@features/hoc-vu/xung-dot-lich';
/**
 * Tab Lịch học của một lớp: danh sách buổi, hủy/mở lại, thêm buổi bù.
 * Buổi đã hủy vẫn hiện để đối chiếu; lý do hủy không hiện trên lịch.
 *
 * Hủy buổi ĐÃ DẠY là thao tác phá huỷ (xoá luôn điểm danh ở backend), nên chỉ
 * ADMIN thấy nút và phải xác nhận qua hộp thoại — giảng viên không thấy nút,
 * backend cũng chặn.
 */
@Component({
  selector: 'app-lop-hoc-phan-lich-hoc',
  standalone: true,
  imports: [
    FormsModule,
    AppAlert,
    AppButton,
    ConfirmDialog,
    DateInput,
    EmptyState,
    LoadingState,
    NgayVnPipe,
    XungDotLichKhoi,
  ],
  template: `
    @if (loi()) {
      <app-alert muc="danger">{{ loi() }}</app-alert>
    }

    <div class="thanh-cong-cu">
      <span class="dem">{{ buoi().length }} buổi</span>
      @if (coQuyenGhi()) {
        <app-button variant="secondary" (click)="moFormThem()">
          <span class="material-icons" aria-hidden="true">add</span>
          Thêm buổi
        </app-button>
      }
    </div>

    @if (dangThem()) {
      <div class="khung-them">
        <h3>Thêm buổi học</h3>
        <div class="luoi">
          <label>
            Ngày
            <app-date-input
              id="ngay-buoi-hoc"
              nhan="Ngày học"
              [giaTri]="moi.ngay_hoc"
              (giaTriChange)="moi.ngay_hoc = $event"
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
            Phòng
            <select name="phong" [(ngModel)]="moi.phong_hoc_id">
              <option [ngValue]="0">Chọn phòng</option>
              @for (p of phong(); track p.id) {
                <option [ngValue]="p.id">{{ p.label }}</option>
              }
            </select>
          </label>
          <label>
            Hình thức học
            <select name="hinh-thuc" [(ngModel)]="moi.hinh_thuc">
              @for (h of hinhThucList; track h.value) {
                <option [ngValue]="h.value">{{ h.label }}</option>
              }
            </select>
          </label>
        </div>

        @if (xungDotThem(); as xd) {
          <app-xung-dot-lich [duLieu]="xd" />
        }

        <div class="nut-phu">
          <app-button variant="secondary" (click)="dongFormThem()">Hủy</app-button>
          <app-button variant="primary" [disabled]="!themHopLe()" [loading]="dangLuu()" (click)="them()">
            Thêm buổi
          </app-button>
        </div>
      </div>
    }

    @if (dangTai()) {
      <app-loading-state label="Đang tải lịch học…" />
    } @else if (buoi().length === 0) {
      <app-empty-state
        icon="event_busy"
        title="Lớp chưa có buổi học nào"
        description="Dùng “Thêm buổi” để tạo buổi đầu tiên, hoặc sửa lớp để sinh lịch cả học kỳ."
      />
    } @else {
      <div class="bang-cuon">
        <table>
          <thead>
            <tr>
              <th>Ngày</th>
              @if (coTiet()) {
                <th>Tiết</th>
              }
              <th>Giờ</th>
              <th>Phòng</th>
              <th>Hình thức</th>
              <th>Trạng thái</th>
              <th>Điểm danh</th>
              @if (coQuyenGhi()) {
                <th></th>
              }
            </tr>
          </thead>
          <tbody>
            @for (b of buoi(); track b.id) {
              <tr [class.da-huy]="b.trang_thai === 'CANCELLED'">
                <td>{{ b.ngay_hoc | ngayVn }}</td>
                @if (coTiet()) {
                  <td>{{ tietCua(b) }}</td>
                }
                <td>{{ b.gio_bat_dau }}–{{ b.gio_ket_thuc }}</td>
                <td>{{ b.phong_hoc?.ma_phong ?? '—' }}</td>
                <td>
                  <span class="nhan" [class]="'nhan-' + (b.hinh_thuc ?? 'LY_THUYET')">
                    {{ tenHinhThuc(b.hinh_thuc) }}
                  </span>
                </td>
                <td>
                  <span class="nhan" [class.nhan-huy]="b.trang_thai === 'CANCELLED'">
                    {{ nhanTrangThai(b.trang_thai) }}
                  </span>
                  @if (b.buoi_goc_id) {
                    <span class="nhan nhan-bu">Buổi bù</span>
                  }
                </td>
                <td>{{ b.so_diem_danh > 0 ? b.so_diem_danh + ' SV' : '—' }}</td>
                @if (coQuyenGhi()) {
                  <td class="thao-tac">
                    @if (b.trang_thai === 'CANCELLED') {
                      <button type="button" class="nut-thao-tac" (click)="moLai(b)">Mở lại</button>
                    } @else if (coTheHuy(b)) {
                      <button type="button" class="nut-thao-tac nut-huy" (click)="hoiHuy(b)">Hủy</button>
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <!-- Một hộp thoại duy nhất cho cả hai trường hợp: buổi thường chỉ hỏi
         "hủy buổi này?", buổi đã dạy thêm cảnh báo mất điểm danh. -->
    @if (dangHoiHuy(); as b) {
      <app-confirm-dialog
        [tieuDe]="b.trang_thai === 'DONE' ? 'Hủy buổi đã dạy?' : 'Hủy buổi học?'"
        [moTa]="
          b.trang_thai === 'DONE'
            ? 'Buổi học đã dạy có điểm danh. Hủy sẽ xóa toàn bộ điểm danh của buổi này và không khôi phục được.'
            : 'Buổi ' + (b.ngay_hoc | ngayVn) + ' (' + b.gio_bat_dau + '–' + b.gio_ket_thuc + ') sẽ chuyển sang trạng thái đã hủy.'
        "
        nhanDongY="Hủy buổi"
        [nguyHiem]="true"
        [dangXuLy]="dangLuu()"
        (dongY)="xacNhanHuy()"
        (huy)="dongHoiHuy()"
      />
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .thanh-cong-cu {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }
    .dem {
      font-size: var(--text-small);
      color: var(--color-ink-muted);
    }
    .thanh-cong-cu app-button {
      margin-left: auto;
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
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 12px;
    }
    label {
      display: grid;
      gap: 6px;
      font-size: var(--text-small);
      font-weight: 600;
      color: var(--color-ink-muted);
    }
    input,
    select {
      padding: 9px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font: inherit;
      background: var(--color-surface);
      color: var(--color-ink);
    }
    .nut-phu {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 14px;
    }
    .bang-cuon {
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
    tr.da-huy td {
      color: var(--color-ink-subtle);
    }
    tr.da-huy td:first-child {
      text-decoration: line-through;
    }
    .nhan {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: var(--text-caption);
      font-weight: 600;
      background: var(--color-surface-alt);
      color: var(--color-ink-muted);
    }
    .nhan-bu {
      background: var(--color-primary-soft);
      color: var(--color-ink);
      margin-left: 6px;
    }
    .nhan-huy {
      background: transparent;
      border: 1px dashed var(--color-border);
    }
    /* Nhãn hình thức dùng LẠI biến màu của lịch tuần để bảng này và lịch tuần
       nói cùng một ngôn ngữ màu. */
    .nhan-LY_THUYET {
      background: var(--lich-ly-thuyet-bg);
      color: var(--lich-ly-thuyet-fg);
      border: 1px solid var(--lich-ly-thuyet-vien);
    }
    .nhan-THUC_HANH {
      background: var(--lich-thuc-hanh-bg);
      color: var(--lich-thuc-hanh-fg);
      border: 1px solid var(--lich-thuc-hanh-vien);
    }
    .nhan-TRUC_TUYEN {
      background: var(--lich-truc-tuyen-bg);
      color: var(--lich-truc-tuyen-fg);
      border: 1px solid var(--lich-truc-tuyen-vien);
    }
    .thao-tac {
      text-align: right;
      white-space: nowrap;
    }
    .nut-thao-tac {
      border: none;
      background: transparent;
      color: var(--color-primary);
      font: inherit;
      font-size: var(--text-small);
      font-weight: 600;
      cursor: pointer;
      padding: 4px 6px;
      border-radius: var(--radius-sm);
    }
    .nut-thao-tac:hover {
      background: var(--color-primary-soft);
    }
    /* Hủy là thao tác phá huỷ — tô đỏ để không bấm nhầm cạnh "Mở lại". */
    .nut-huy {
      color: var(--color-danger);
    }
    .nut-huy:hover {
      background: var(--color-danger-soft);
    }
    @media (max-width: 900px) {
      .luoi {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    @media (max-width: 640px) {
      .luoi {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 600px) {
      .luoi {
        grid-template-columns: 1fr;
      }
      .thanh-cong-cu {
        flex-wrap: wrap;
      }
    }
  `,
})
export class LopHocPhanLichHoc {
  readonly lopId = input.required<number>();

  private readonly buoiHoc = inject(BuoiHocService);
  private readonly lopHocPhan = inject(LopHocPhanService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(AppToastService);

  readonly buoi = signal<BuoiHoc[]>([]);
  readonly phong = signal<{ id: number; label: string }[]>([]);
  readonly tiet = signal<{ id: number; so_tiet: number; label: string }[]>([]);
  readonly dangTai = signal(true);
  readonly dangLuu = signal(false);
  readonly dangThem = signal(false);
  readonly loi = signal('');
  /** Buổi đang chờ người dùng xác nhận hủy; `null` = không mở hộp thoại. */
  readonly dangHoiHuy = signal<BuoiHoc | null>(null);
  /** Xung đột lịch backend trả khi thêm buổi — hiện thành danh sách, không chỉ một câu. */
  readonly xungDotThem = signal<XungDotLich | null>(null);

  readonly hinhThucList: Array<{ value: HinhThucHoc; label: string }> = [
    { value: 'LY_THUYET', label: 'Lý thuyết' },
    { value: 'THUC_HANH', label: 'Thực hành' },
    { value: 'TRUC_TUYEN', label: 'Trực tuyến' },
  ];

  /** Toàn bộ buổi đều thiếu tiết thì ẩn hẳn cột — cột đầy dấu gạch chỉ gây nhiễu. */
  readonly coTiet = computed(() => this.buoi().some((b) => !!b.tiet_bat_dau && !!b.tiet_ket_thuc));

  readonly moi: {
    ngay_hoc: string;
    tiet_bat_dau: number;
    tiet_ket_thuc: number;
    phong_hoc_id: number;
    hinh_thuc: HinhThucHoc;
  } = { ngay_hoc: '', tiet_bat_dau: 1, tiet_ket_thuc: 3, phong_hoc_id: 0, hinh_thuc: 'LY_THUYET' };

  readonly coQuyenGhi = computed(() => {
    const vaiTro = this.auth.nguoiDung()?.vai_tro;
    return vaiTro === 'ADMIN' || vaiTro === 'GIANG_VIEN';
  });

  readonly laAdmin = computed(() => this.auth.nguoiDung()?.vai_tro === 'ADMIN');

  constructor() {
    this.lopHocPhan.layTuyChon('rooms').subscribe({ next: (rows) => this.phong.set(rows) });
    this.lopHocPhan.layTiet().subscribe({ next: (rows) => this.tiet.set(rows) });
  }

  ngOnInit(): void {
    this.tai();
  }

  themHopLe(): boolean {
    return !!this.moi.ngay_hoc && this.moi.phong_hoc_id > 0 && this.moi.tiet_ket_thuc >= this.moi.tiet_bat_dau;
  }

  tietCua(b: BuoiHoc): string {
    return b.tiet_bat_dau && b.tiet_ket_thuc ? `${b.tiet_bat_dau}–${b.tiet_ket_thuc}` : '';
  }

  nhanTrangThai(trangThai: BuoiHoc['trang_thai']): string {
    return trangThai === 'DONE' ? 'Đã dạy' : trangThai === 'CANCELLED' ? 'Đã hủy' : 'Sắp dạy';
  }

  tenHinhThuc(hinhThuc: HinhThucHoc | undefined): string {
    return hinhThuc === 'THUC_HANH'
      ? 'Thực hành'
      : hinhThuc === 'TRUC_TUYEN'
        ? 'Trực tuyến'
        : 'Lý thuyết';
  }

  /**
   * Buổi đã dạy chỉ ADMIN hủy được. Backend cũng chặn giảng viên ở tầng
   * quyền — ẩn nút ở đây để họ không bấm rồi ăn 403.
   */
  coTheHuy(b: BuoiHoc): boolean {
    if (b.trang_thai === 'CANCELLED') return false;
    if (b.trang_thai === 'DONE') return this.laAdmin();
    return true;
  }

  moFormThem(): void {
    this.dangThem.set(true);
    this.xungDotThem.set(null);
    this.moi.ngay_hoc = '';
    this.moi.tiet_bat_dau = 1;
    this.moi.tiet_ket_thuc = 3;
    this.moi.phong_hoc_id = this.phong()[0]?.id ?? 0;
    this.moi.hinh_thuc = 'LY_THUYET';
  }

  dongFormThem(): void {
    this.dangThem.set(false);
    this.xungDotThem.set(null);
  }

  them(): void {
    if (!this.themHopLe() || this.dangLuu()) return;
    this.dangLuu.set(true);
    this.xungDotThem.set(null);
    this.buoiHoc.themBuoi(this.lopId(), this.moi).subscribe({
      next: () => {
        this.dangLuu.set(false);
        this.dangThem.set(false);
        this.toast.hien('Đã thêm buổi học.', 'success');
        this.tai();
      },
      error: (error: unknown) => {
        // 409 trùng lịch: backend kèm danh sách buổi vướng, hiện đủ để người
        // dùng biết đổi giờ hay đổi phòng. Lỗi khác thì một câu là đủ.
        const xungDot = docXungDotLich(error);
        this.xungDotThem.set(xungDot);
        if (!xungDot) {
          this.toast.hien(this.thongDiepLoi(error, 'Không thêm được buổi học.'), 'danger');
        }
        this.dangLuu.set(false);
      },
    });
  }

  hoiHuy(b: BuoiHoc): void {
    this.dangHoiHuy.set(b);
  }

  dongHoiHuy(): void {
    this.dangHoiHuy.set(null);
  }

  xacNhanHuy(): void {
    const b = this.dangHoiHuy();
    if (!b || this.dangLuu()) return;
    this.dangLuu.set(true);
    // `xac_nhan` báo backend rằng người dùng đã đồng ý mất điểm danh — buổi đã
    // dạy mà thiếu cờ này thì backend từ chối chứ không lặng lẽ xoá.
    this.buoiHoc
      .doiTrangThai(b.id, 'CANCELLED', { xac_nhan: b.trang_thai === 'DONE' || b.so_diem_danh > 0 })
      .subscribe({
        next: () => {
          this.dangLuu.set(false);
          this.dangHoiHuy.set(null);
          this.toast.hien('Đã hủy buổi học.', 'success');
          this.tai();
        },
        error: (error: unknown) => {
          this.dangLuu.set(false);
          this.dangHoiHuy.set(null);
          this.toast.hien(this.thongDiepLoi(error, 'Không hủy được buổi học.'), 'danger');
        },
      });
  }

  moLai(b: BuoiHoc): void {
    this.buoiHoc.doiTrangThai(b.id, 'SCHEDULED').subscribe({
      next: () => {
        this.toast.hien('Đã mở lại buổi học.', 'success');
        this.tai();
      },
      error: (error: unknown) =>
        this.toast.hien(this.thongDiepLoi(error, 'Không mở lại được buổi học.'), 'danger'),
    });
  }

  private thongDiepLoi(error: unknown, macDinh: string): string {
    const than = (error as { error?: { message?: string } } | null)?.error;
    return than?.message ?? macDinh;
  }

  private tai(): void {
    this.dangTai.set(true);
    this.buoiHoc.layCuaLop(this.lopId()).subscribe({
      next: (rows) => {
        this.buoi.set(rows);
        this.dangTai.set(false);
      },
      error: () => {
        this.loi.set('Không tải được lịch học của lớp.');
        this.dangTai.set(false);
      },
    });
  }
}

@Component({
  selector: 'app-lop-hoc-phan-lich-hoc-page',
  standalone: true,
  imports: [RouterLink, PageHeader, LopHocPhanLichHoc],
  template: `
    <app-page-header
      title="Lịch học"
      description="Các buổi học của lớp. Buổi đã hủy vẫn hiện để đối chiếu."
    >
      <app-button variant="secondary" [routerLink]="['/lop-hoc-phan', id]">
        <span class="material-icons" aria-hidden="true">arrow_back</span>
        Thông tin lớp
      </app-button>
    </app-page-header>

    <nav class="tabs" aria-label="Thông tin lớp học phần">
      <a [routerLink]="['/lop-hoc-phan', id]">Thông tin</a>
      <a [routerLink]="['/lop-hoc-phan', id, 'sinh-vien']">Sinh viên</a>
      <a class="active" [routerLink]="['/lop-hoc-phan', id, 'lich-hoc']">Lịch học</a>
      <a [routerLink]="['/diem-danh']" [queryParams]="{ lop_hoc_phan_id: id }">Điểm danh</a>
      <a [routerLink]="['/lop-hoc-phan', id, 'chuyen-can']">Chuyên cần</a>
      <a [routerLink]="['/lop-hoc-phan', id, 'diem']">Điểm</a>
    </nav>

    <app-lop-hoc-phan-lich-hoc [lopId]="id" />
  `,
  styles: `
    .tabs {
      display: flex;
      gap: 2px;
      margin: 0 0 18px;
      border-bottom: 1px solid var(--color-border);
      overflow-x: auto;
    }
    .tabs a {
      padding: 10px 12px;
      font-size: var(--text-small);
      font-weight: 600;
      color: var(--color-ink-muted);
      text-decoration: none;
      white-space: nowrap;
      border-bottom: 2px solid transparent;
    }
    .tabs a.active {
      color: var(--color-primary);
      border-bottom-color: var(--color-primary);
    }
  `,
})
export class LopHocPhanLichHocPage {
  private readonly route = inject(ActivatedRoute);
  readonly id = Number(this.route.snapshot.paramMap.get('id')) || 0;
}
