import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/auth/auth.service';
import { BuoiLich, LichHocService } from '@core/services/lich-hoc.service';
import { LichThi, LichThiService } from '@core/services/lich-thi.service';
import { LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { TuyChon } from '@core/services/lop-hoc-phan.service';
import { AppAlert } from '@shared/ui/app-alert';
import { DateInput } from '@shared/ui/date-input';
import { LoadingState } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';
import { environment } from '@env/environment';

interface O { lop: BuoiLich; }
interface OThi { caThi: LichThi; }

interface Ngay {
  iso: string;
  nhan: string;
  ngay: string;
  homNay: boolean;
}

interface Khoi {
  loai: 'hoc' | 'thi';
  ten: string;
  ma: string;
  tiet: string;
  gio: string;
  phong: string;
  phu: string;
  trangThai: 'SCHEDULED' | 'DONE' | 'CANCELLED';
  buoi: boolean;
  giangVienId: number | null;
}

/**
 * Lịch tuần dùng chung cho ba vai trò. Dữ liệu đã được backend lọc theo quyền:
 * giảng viên chỉ lớp mình, sinh viên chỉ lớp đã đăng ký — bộ lọc ở đây chỉ
 * thu hẹp thêm, không mở rộng quyền xem.
 */
@Component({
  selector: 'app-lich-hoc-tuan',
  standalone: true,
  imports: [DateInput, FormsModule, AppAlert, LoadingState, PageHeader],
  template: `
    <app-page-header
      title="Lịch học, lịch thi theo tuần"
      description="Xem ca học và ca thi trong tuần. Màu thể hiện loại ca, không phải lớp."
    />

    @if (loi()) {
      <app-alert muc="danger">{{ loi() }}</app-alert>
    }

    <div class="thanh-cong-cu">
      <div class="loc-loai" role="radiogroup" aria-label="Lọc loại ca">
        <button type="button" role="radio" [attr.aria-checked]="loaiLoc() === 'all'"
          [class.chon]="loaiLoc() === 'all'" (click)="doiLoai('all')">
          <i></i> Tất cả
        </button>
        <button type="button" role="radio" [attr.aria-checked]="loaiLoc() === 'hoc'"
          [class.chon]="loaiLoc() === 'hoc'" (click)="doiLoai('hoc')">
          <i class="hoc"></i> Lịch học
        </button>
        <button type="button" role="radio" [attr.aria-checked]="loaiLoc() === 'thi'"
          [class.chon]="loaiLoc() === 'thi'" (click)="doiLoai('thi')">
          <i class="thi"></i> Lịch thi
        </button>
      </div>

      <label class="chon-ngay">
        <app-date-input
          id="chon-tuan"
          nhan="Chọn tuần cần xem"
          [giaTri]="ngayChon()"
          (giaTriChange)="nhayToiNgay($event)"
        />
      </label>

      <button type="button" class="nut-phu" (click)="doiTuan(-1)" aria-label="Tuần trước">‹</button>
      <button type="button" class="nut-phu" (click)="veHomNay()">Hôm nay</button>
      <button type="button" class="nut-phu" (click)="doiTuan(1)" aria-label="Tuần sau">›</button>
      <strong class="khoang">{{ khoangTuan() }}</strong>

      @if (laAdmin()) {
        <label class="loc">
          <span>Giảng viên</span>
          <select [ngModel]="giangVienId()" (ngModelChange)="giangVienId.set($event); tai()">
            <option [ngValue]="0">Tất cả</option>
            @for (g of giangVien(); track g.id) {
              <option [ngValue]="g.id">{{ g.label }}</option>
            }
          </select>
        </label>
        <label class="loc">
          <span>Phòng</span>
          <select [ngModel]="phongId()" (ngModelChange)="phongId.set($event); tai()">
            <option [ngValue]="0">Tất cả</option>
            @for (p of phong(); track p.id) {
              <option [ngValue]="p.id">{{ p.label }}</option>
            }
          </select>
        </label>
      }
    </div>

    <div class="chu-giai">
      <span><i></i> Ca học</span>
      <span><i class="thi"></i> Ca thi</span>
      <span><i class="da-day"></i> Đã dạy</span>
      <span><i class="huy"></i> Tạm ngưng / đã hủy</span>
    </div>

    @if (dangTai()) {
      <app-loading-state label="Đang tải lịch…" />
    } @else {
      <div class="cuon">
        <div class="bang">
          <div class="dau">
            <div class="goc">Ca học</div>
            @for (d of ngay(); track d.iso) {
              <div class="o-ngay" [class.hom-nay]="d.homNay">
                <b>{{ d.nhan }}</b><span>{{ d.ngay }}</span>
              </div>
            }
          </div>

          @for (ca of caList; track ca) {
            <div class="dong">
              <div class="nhan-ca">{{ ca }}</div>
              @for (d of ngay(); track d.iso) {
                <div class="o">
                  @for (k of khoiCua(d.iso, ca); track $index) {
                    <button
                      type="button"
                      class="khoi"
                      [class.thi]="k.loai === 'thi'"
                      [class.da-day]="k.trangThai === 'DONE'"
                      [class.da-huy]="k.trangThai === 'CANCELLED'"
                      [class.bam-duoc]="!!k.giangVienId"
                      (click)="moGiangVien(k.giangVienId, k.phu)"
                      [attr.aria-label]="k.ten + ' · ' + k.phu"
                    >
                      <p class="ten">{{ k.ten }}</p>
                      <p class="ma">{{ k.ma }}</p>
                      <dl>
                        @if (k.tiet) {
                          <dt>Tiết</dt><dd>{{ k.tiet }}</dd>
                        }
                        <dt>Giờ</dt><dd>{{ k.gio }}</dd>
                        <dt>Phòng</dt><dd>{{ k.phong }}</dd>
                        <dt>{{ k.loai === 'thi' ? 'Thi' : 'GV' }}</dt><dd>{{ k.phu }}</dd>
                      </dl>
                      @if (k.trangThai === 'CANCELLED') {
                        <span class="nhan-phu">ĐÃ HỦY</span>
                      } @else if (k.loai === 'thi') {
                        <span class="nhan-phu nhan-thi">CA THI</span>
                      }
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>
    }

    @if (giangVienDangXem(); as gv) {
      <div class="lop-phu" (click)="dongGiangVien()">
        <div class="hop-thoai" role="dialog" aria-modal="true" aria-labelledby="ten-gv" (click)="$event.stopPropagation()">
          <h2 id="ten-gv">{{ gv.ho_ten }}</h2>
          <p class="ma-gv">{{ gv.ma_gv }}</p>
          <dl>
            <dt>Email</dt>
            <dd><a [href]="'mailto:' + gv.email">{{ gv.email }}</a></dd>
            <dt>Điện thoại</dt>
            <dd>{{ gv.so_dien_thoai || '—' }}</dd>
          </dl>
          <div class="nut-hop">
            <button type="button" class="nut-phu" (click)="dongGiangVien()">Đóng</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .loc-loai {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .loc-loai button {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 5px 10px 5px 6px;
      border: 1px solid transparent;
      border-radius: 999px;
      background: transparent;
      color: var(--color-ink-muted);
      font: inherit;
      font-size: var(--text-small);
      cursor: pointer;
    }
    .loc-loai button.chon {
      background: var(--color-surface-alt);
      color: var(--color-ink);
      font-weight: 600;
    }
    .loc-loai i {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--color-border);
      flex: none;
    }
    .loc-loai i.hoc {
      background: var(--color-primary-soft);
      border: 1px solid var(--color-primary);
    }
    .loc-loai i.thi {
      background: var(--color-danger-soft);
      border: 1px solid var(--color-danger);
    }
    .chon-ngay {
      display: inline-flex;
      align-items: center;
      min-width: 190px;
    }
    .thanh-cong-cu {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .nut-phu {
      padding: 6px 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      color: var(--color-ink);
      font: inherit;
      font-size: var(--text-small);
      font-weight: 600;
      cursor: pointer;
    }
    .khoang {
      margin: 0 6px;
      font-size: var(--text-small);
    }
    .loc {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: var(--text-small);
      color: var(--color-ink-muted);
    }
    .loc select {
      padding: 6px 8px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font: inherit;
      font-size: var(--text-small);
      background: var(--color-surface);
      color: var(--color-ink);
      max-width: 180px;
    }
    .chu-giai {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      padding: 9px 12px;
      margin-bottom: 10px;
      border-radius: var(--radius-sm);
      background: var(--color-surface-alt);
      font-size: var(--text-small);
      color: var(--color-ink-muted);
    }
    .chu-giai span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .chu-giai i {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      background: var(--color-primary-soft);
      border: 1px solid var(--color-primary);
    }
    .chu-giai i.thi {
      background: var(--color-danger-soft);
      border-color: var(--color-danger);
    }
    .chu-giai i.da-day {
      background: var(--color-surface-alt);
      border-color: var(--color-border);
    }
    .chu-giai i.huy {
      background: transparent;
      border: 1px dashed var(--color-border);
    }
    .cuon {
      overflow-x: auto;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
    }
    .bang {
      /* 1100 chứ không 900: ở 900 mỗi cột ngày chỉ còn ~119px, khối ca học
         trừ nhãn "Phòng" đi thì giá trị còn 42px — hẹp hơn cả chữ "Nguyễn",
         nên tên giảng viên bị bẻ đôi. Lưới vốn đã cuộn ngang nên nới rộng
         không ảnh hưởng bố cục trang. */
      min-width: 1100px;
    }
    .dau,
    .dong {
      display: grid;
      grid-template-columns: 64px repeat(7, minmax(0, 1fr));
    }
    .dau {
      border-bottom: 1px solid var(--color-border);
    }
    .goc,
    .nhan-ca {
      display: grid;
      place-items: center;
      padding: 8px 4px;
      font-size: var(--text-caption);
      font-weight: 700;
      color: var(--color-ink-muted);
      background: var(--color-surface-alt);
      border-right: 1px solid var(--color-border);
    }
    .o-ngay {
      padding: 8px 6px;
      text-align: center;
      background: var(--color-surface-alt);
      border-right: 1px solid var(--color-border);
    }
    .o-ngay:last-child {
      border-right: 0;
    }
    .o-ngay b {
      display: block;
      font-size: var(--text-small);
      /* --color-primary chỉ đạt 4.11:1 trên surface-alt; biến thể đậm của
         primary-soft đạt 5.66:1 và vẫn đọc là xanh. */
      color: var(--color-on-primary-soft);
    }
    .o-ngay span {
      font-size: var(--text-caption);
      color: var(--color-ink-muted);
    }
    .o-ngay.hom-nay {
      background: var(--color-primary-soft);
    }
    .dong {
      border-bottom: 1px solid var(--color-border);
    }
    .dong:last-child {
      border-bottom: 0;
    }
    .o {
      min-height: 128px;
      padding: 6px;
      border-right: 1px solid var(--color-border);
      min-width: 0;
    }
    .o:last-child {
      border-right: 0;
    }
    /* Khối ca học: chữ chính --text-small (13px) để đọc được trên lịch dày.
       Màu lấy từ token: ca học = primary, ca thi = danger, đã dạy = surface-alt. */
    .khoi {
      display: block;
      width: 100%;
      text-align: left;
      font-family: inherit;
      cursor: default;
      padding: 8px 9px;
      margin-bottom: 6px;
      border: 1px solid var(--color-primary);
      border-radius: var(--radius-sm);
      background: var(--color-primary-soft);
      color: var(--color-on-primary-soft);
      font-size: var(--text-small);
      line-height: 1.4;
    }
    .khoi.thi {
      background: var(--color-danger-soft);
      border-color: var(--color-danger);
      color: var(--color-on-danger-soft);
    }
    .khoi.da-day {
      background: var(--color-surface-alt);
      border-color: var(--color-border);
      color: var(--color-ink-muted);
    }
    .khoi.da-huy {
      background: var(--color-surface-alt);
      border-color: var(--color-border);
      border-style: dashed;
      color: var(--color-ink-muted);
      opacity: 0.85;
    }
    .khoi.da-huy .ten {
      text-decoration: line-through;
    }
    .khoi.bam-duoc {
      cursor: pointer;
    }
    .khoi.bam-duoc:hover,
    .khoi.bam-duoc:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 1px;
    }
    .lop-phu {
      position: fixed;
      inset: 0;
      z-index: 60;
      display: grid;
      place-items: center;
      padding: 16px;
      background: rgb(15 23 42 / 45%);
    }
    .hop-thoai {
      width: min(360px, 100%);
      padding: 20px;
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      color: var(--color-ink);
      box-shadow: var(--shadow-lg);
    }
    .hop-thoai h2 {
      margin: 0;
      font-size: var(--text-heading, 1.125rem);
    }
    .ma-gv {
      margin: 2px 0 14px;
      font-family: var(--font-mono, monospace);
      font-size: var(--text-caption);
      color: var(--color-ink-muted);
    }
    .hop-thoai dl {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 8px 14px;
      margin: 0 0 16px;
      font-size: var(--text-small);
    }
    .hop-thoai dt {
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }
    .hop-thoai dd {
      margin: 0;
      overflow-wrap: anywhere;
    }
    .hop-thoai a {
      color: var(--color-primary);
    }
    .nut-hop {
      display: flex;
      justify-content: flex-end;
    }
    .ten {
      margin: 0 0 2px;
      font-weight: 700;
      font-size: var(--text-small);
      line-height: 1.35;
      color: inherit;
    }
    .ma {
      margin: 0 0 5px;
      font-size: var(--text-caption);
      font-variant-numeric: tabular-nums;
      opacity: 0.9;
      /* Mã lớp/môn không có khoảng trắng nên phải cho bẻ giữa từ ở đây. */
      overflow-wrap: anywhere;
    }
    .khoi dl {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 1px 6px;
      margin: 0;
      font-size: var(--text-small);
    }
    .khoi dt {
      font-size: var(--text-small);
      opacity: 0.85;
    }
    .khoi dd {
      margin: 0;
      font-size: var(--text-small);
      /* break-word chứ không anywhere: tên giảng viên dài phải xuống dòng ở
         khoảng trắng, không bẻ đôi chữ giữa từ. */
      overflow-wrap: break-word;
    }
    .nhan-phu {
      display: inline-block;
      margin-top: 6px;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: var(--text-caption);
      font-weight: 700;
      letter-spacing: 0.04em;
      background: var(--color-warning-soft);
      color: var(--color-on-warning-soft);
    }
    .nhan-thi {
      background: var(--color-danger);
      color: var(--color-on-primary);
    }
    @media (max-width: 720px) {
      .thanh-cong-cu {
        align-items: stretch;
      }
      .loc select {
        max-width: 140px;
      }
    }
  `,
})
export class LichHocTuan {
  private readonly service = inject(LichHocService);
  private readonly lichThi = inject(LichThiService);
  private readonly lopHocPhan = inject(LopHocPhanService);
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly goc = environment.apiBaseUrl;

  readonly caList = ['Sáng', 'Chiều', 'Tối'] as const;

  readonly neo = signal(this.dauTuan(new Date()));
  readonly dangTai = signal(true);
  readonly loi = signal('');
  readonly buoi = signal<BuoiLich[]>([]);
  readonly caThi = signal<LichThi[]>([]);
  readonly giangVien = signal<TuyChon[]>([]);
  readonly phong = signal<TuyChon[]>([]);
  readonly giangVienId = signal(0);
  readonly phongId = signal(0);
  readonly loaiLoc = signal<'all' | 'hoc' | 'thi'>('all');
  readonly ngayChon = signal(this.isoDate(new Date()));
  readonly giangVienDangXem = signal<{
    ho_ten: string;
    ma_gv: string;
    email: string;
    so_dien_thoai: string | null;
  } | null>(null);

  private giangVienDangXemId = 0;

  readonly laAdmin = computed(() => this.auth.nguoiDung()?.vai_tro === 'ADMIN');

  readonly ngay = computed<Ngay[]>(() => {
    const dau = this.neo();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(dau);
      d.setDate(dau.getDate() + i);
      return {
        iso: this.isoDate(d),
        nhan: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][d.getDay()],
        ngay: this.ddmm(d),
        homNay: this.isoDate(d) === this.isoDate(new Date()),
      };
    });
  });

  readonly khoangTuan = computed(() => {
    const ds = this.ngay();
    const a = new Date(`${ds[0].iso}T00:00:00`);
    const b = new Date(`${ds[6].iso}T00:00:00`);
    return `Tuần ${this.ddmm(a)} – ${this.ddmm(b)}`;
  });

  constructor() {
    if (this.laAdmin()) {
      this.lopHocPhan.layTuyChon('teachers').subscribe({ next: (r) => this.giangVien.set(r) });
      this.lopHocPhan.layTuyChon('rooms').subscribe({ next: (r) => this.phong.set(r) });
    }
  }

  ngOnInit(): void {
    this.tai();
  }

  doiLoai(loai: 'all' | 'hoc' | 'thi'): void {
    this.loaiLoc.set(loai);
  }

  nhayToiNgay(iso: string): void {
    if (!iso) return;
    this.ngayChon.set(iso);
    this.neo.set(this.dauTuan(new Date(`${iso}T00:00:00`)));
    this.tai();
  }

  doiTuan(soTuan: number): void {
    const d = new Date(this.neo());
    d.setDate(d.getDate() + soTuan * 7);
    this.neo.set(this.dauTuan(d));
    this.tai();
  }

  veHomNay(): void {
    this.neo.set(this.dauTuan(new Date()));
    this.tai();
  }

  khoiCua(iso: string, ca: string): Khoi[] {
    const khoi: Khoi[] = [];

    for (const b of this.buoi().filter((x) => this.loaiLoc() !== 'thi' && x.ngay_hoc === iso && this.caCua(x.gio_bat_dau) === ca)) {
      khoi.push({
        loai: 'hoc',
        ten: b.mon_hoc?.ten_mon ?? b.lop_hoc_phan.ma_lop_hp,
        ma: `${b.lop_hoc_phan.ma_lop_hp}${b.mon_hoc ? ' · ' + b.mon_hoc.ma_mon : ''}`,
        tiet: b.tiet_bat_dau && b.tiet_ket_thuc ? `${b.tiet_bat_dau}–${b.tiet_ket_thuc}` : '',
        gio: `${b.gio_bat_dau}–${b.gio_ket_thuc}`,
        phong: b.phong_hoc?.ma_phong ?? '—',
        phu: b.giang_vien?.ho_ten ?? '—',
        trangThai: b.trang_thai,
        buoi: true,
        giangVienId: b.giang_vien?.id ?? null,
      });
    }

    for (const t of this.caThi().filter((x) => this.loaiLoc() !== 'hoc' && x.ngay_thi === iso && this.caCua(x.gio_bat_dau) === ca)) {
      khoi.push({
        loai: 'thi',
        ten: t.mon_hoc?.ten_mon ?? 'Ca thi',
        ma: t.mon_hoc?.ma_mon ?? '',
        tiet: `${t.tiet_bat_dau}–${t.tiet_ket_thuc}`,
        gio: `${t.gio_bat_dau}–${t.gio_ket_thuc}`,
        phong: t.phong_hoc?.ma_phong ?? '—',
        phu: t.dot_thi ?? '—',
        trangThai: 'SCHEDULED',
        buoi: false,
        giangVienId: null,
      });
    }

    return khoi;
  }

  private tai(): void {
    this.dangTai.set(true);
    this.loi.set('');
    const ds = this.ngay();
    const loc = {
      tu_ngay: ds[0].iso,
      den_ngay: ds[6].iso,
      ...(this.giangVienId() ? { giang_vien_id: this.giangVienId() } : {}),
      ...(this.phongId() ? { phong_hoc_id: this.phongId() } : {}),
    };

    this.service.layTatCa(loc).subscribe({
      next: (rows) => {
        this.buoi.set(rows);
        this.lichThi.layDanhSach({ tu_ngay: ds[0].iso, den_ngay: ds[6].iso }).subscribe({
          next: (caThi) => {
            this.caThi.set(caThi);
            this.dangTai.set(false);
          },
          error: () => {
            this.caThi.set([]);
            this.dangTai.set(false);
          },
        });
      },
      error: () => {
        this.loi.set('Không tải được lịch. Kiểm tra kết nối backend.');
        this.dangTai.set(false);
      },    });
  }

  moGiangVien(id: number | null, ten: string): void {
    if (!id) return;
    this.giangVienDangXemId = id;
    // Hiện ngay tên đã có trên khối, rồi bù email/điện thoại khi API trả về.
    this.giangVienDangXem.set({ ho_ten: ten, ma_gv: '', email: '', so_dien_thoai: null });
    this.http.get<{ data: any }>(`${this.goc}/teachers/${id}`).subscribe({
      next: ({ data }) => {
        if (this.giangVienDangXemId !== id) return;
        this.giangVienDangXem.set({
          ho_ten: data.ho_ten,
          ma_gv: data.ma_gv,
          email: data.email,
          so_dien_thoai: data.so_dien_thoai ?? null,
        });
      },
      error: () => {
        /* Giữ tên đã hiện; không chặn người dùng vì lỗi tải chi tiết. */
      },
    });
  }

  dongGiangVien(): void {
    this.giangVienDangXemId = 0;
    this.giangVienDangXem.set(null);
  }

  private caCua(gio: string): string {
    const h = Number(gio.slice(0, 2));
    return h < 12 ? 'Sáng' : h < 18 ? 'Chiều' : 'Tối';
  }

  private dauTuan(d: Date): Date {
    const ngay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const thu = ngay.getDay() === 0 ? 7 : ngay.getDay();
    ngay.setDate(ngay.getDate() - (thu - 1));
    return ngay;
  }

  private isoDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private ddmm(d: Date): string {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
}
