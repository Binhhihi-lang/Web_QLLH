import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/auth/auth.service';
import { BuoiLich, LichHocService } from '@core/services/lich-hoc.service';
import { HinhThucHoc } from '@core/services/buoi-hoc.service';
import { LichThi, LichThiService } from '@core/services/lich-thi.service';
import { LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { TuyChon } from '@core/services/lop-hoc-phan.service';
import { AppAlert } from '@shared/ui/app-alert';
import { DateInput } from '@shared/ui/date-input';
import { LoadingState } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';
import { GiangVienHop } from '@features/hoc-vu/lich-hoc/giang-vien-hop';

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
  /** Hình thức của buổi học; ca thi luôn là 'LY_THUYET' vì không dùng tới. */
  hinhThuc: HinhThucHoc;
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
  imports: [DateInput, FormsModule, AppAlert, GiangVienHop, LoadingState, PageHeader],
  template: `
    <app-page-header
      title="Lịch học, lịch thi theo tuần"
      description="Xem ca học và ca thi trong tuần theo thời khóa biểu."
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
          <select
            id="loc-giang-vien"
            name="giang-vien"
            [ngModel]="giangVienId()"
            (ngModelChange)="giangVienId.set($event); tai()"
          >
            <option [ngValue]="0">Tất cả</option>
            @for (g of giangVien(); track g.id) {
              <option [ngValue]="g.id">{{ g.label }}</option>
            }
          </select>
        </label>
        <label class="loc">
          <span>Phòng</span>
          <select
            id="loc-phong"
            name="phong"
            [ngModel]="phongId()"
            (ngModelChange)="phongId.set($event); tai()"
          >
            <option [ngValue]="0">Tất cả</option>
            @for (p of phong(); track p.id) {
              <option [ngValue]="p.id">{{ p.label }}</option>
            }
          </select>
        </label>
      }
    </div>

    <!--
      Chú giải đúng 5 loại người dùng phân biệt được trên lịch. KHÔNG có mục
      "Đã dạy": backend vẫn giữ trạng thái DONE nhưng buổi đã dạy tô màu theo
      hình thức học như buổi thường, nên nó không phải một loại lịch riêng.
      Ô màu dưới đây dùng chính biến của khối — chú giải không thể lệch màu.
    -->
    <div class="chu-giai" aria-label="Chú giải màu lịch">
      <span><i class="o-ly-thuyet"></i> Lịch học lý thuyết</span>
      <span><i class="o-thuc-hanh"></i> Lịch học thực hành</span>
      <span><i class="o-truc-tuyen"></i> Lịch học trực tuyến</span>
      <span><i class="o-thi"></i> Lịch thi</span>
      <span><i class="o-tam-ngung"></i> Lịch tạm ngưng (đã hủy)</span>
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
                      [class.khoi-thi]="k.loai === 'thi'"
                      [class.khoi-ly-thuyet]="k.loai === 'hoc' && k.hinhThuc === 'LY_THUYET'"
                      [class.khoi-thuc-hanh]="k.loai === 'hoc' && k.hinhThuc === 'THUC_HANH'"
                      [class.khoi-truc-tuyen]="k.loai === 'hoc' && k.hinhThuc === 'TRUC_TUYEN'"
                      [class.khoi-tam-ngung]="k.trangThai === 'CANCELLED'"
                      [class.bam-duoc]="!!k.giangVienId"
                      (click)="moGiangVien(k.giangVienId, k.phu)"
                      [attr.aria-label]="nhanKhoi(k)"
                    >
                      @if (k.trangThai === 'CANCELLED') {
                        <!-- Dải chéo + chữ nghiêng: thuần trang trí, nội dung
                             đã nằm trong aria-label nên ẩn khỏi trình đọc màn hình. -->
                        <span class="dai-tam-ngung" aria-hidden="true">Tạm ngưng</span>
                      }
                      <p class="ten">{{ k.ten }}</p>
                      <p class="ma">{{ k.ma }}</p>
                      <!-- Không lặp lại hình thức học / nhãn "Ca thi" ở đây: màu
                           nền khối đã mã hoá đúng thông tin đó, viết thêm chỉ
                           làm khối chật mà không thêm gì. -->
                      <dl>
                        @if (k.tiet) {
                          <dt>Tiết</dt><dd>{{ k.tiet }}</dd>
                        }
                        <dt>Giờ</dt><dd>{{ k.gio }}</dd>
                        <dt>Phòng</dt><dd>{{ k.phong }}</dd>
                        <dt>{{ k.loai === 'thi' ? 'Thi' : 'GV' }}</dt><dd>{{ k.phu }}</dd>
                      </dl>
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
      <app-giang-vien-hop
        [id]="gv.id"
        [ten]="gv.ten"
        (dong)="dongGiangVien()"
      />
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
    /* Chấm của bộ lọc loại ca. "Lịch học" gộp cả 3 hình thức nên không có một
       màu riêng — dùng dải chuyển sắc để gợi ý "nhiều màu", thay vì chọn đại
       một hình thức làm đại diện. */
    .loc-loai i {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--color-surface-alt);
      border: 1px solid var(--color-border);
      flex: none;
    }
    .loc-loai i.hoc {
      background: linear-gradient(
        135deg,
        var(--lich-ly-thuyet-bg) 0 33%,
        var(--lich-thuc-hanh-bg) 33% 66%,
        var(--lich-truc-tuyen-bg) 66%
      );
      border-color: var(--color-border);
    }
    .loc-loai i.thi {
      background: var(--lich-thi-bg);
      border-color: var(--lich-thi-vien);
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
      gap: 8px 18px;
      flex-wrap: wrap;
      padding: 11px 14px;
      margin-bottom: 10px;
      border-radius: var(--radius);
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      /* Chú giải là thứ người dùng đọc để hiểu lịch — để --text-small (13px)
         chứ không phải caption; ở 11px chữ tiếng Việt có dấu bị bết. */
      font-size: var(--text-small);
      font-weight: 500;
      color: var(--color-ink);
    }
    .chu-giai span {
      display: inline-flex;
      align-items: center;
      gap: 7px;
    }
    /* Ô màu của chú giải dùng LẠI đúng biến nền/viền của khối, nên đổi token
       là cả lịch lẫn chú giải đổi theo, không thể lệch. */
    .chu-giai i {
      width: 15px;
      height: 15px;
      border-radius: 3px;
      border: 1px solid;
      flex: none;
    }
    .chu-giai i.o-ly-thuyet {
      background: var(--lich-ly-thuyet-bg);
      border-color: var(--lich-ly-thuyet-vien);
    }
    .chu-giai i.o-thuc-hanh {
      background: var(--lich-thuc-hanh-bg);
      border-color: var(--lich-thuc-hanh-vien);
    }
    .chu-giai i.o-truc-tuyen {
      background: var(--lich-truc-tuyen-bg);
      border-color: var(--lich-truc-tuyen-vien);
    }
    .chu-giai i.o-thi {
      background: var(--lich-thi-bg);
      border-color: var(--lich-thi-vien);
    }
    .chu-giai i.o-tam-ngung {
      background: var(--lich-tam-ngung-bg);
      border-color: var(--lich-tam-ngung-vien);
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
      font-size: var(--text-small);
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
      font-size: var(--text-body);
      /* --color-primary chỉ đạt 4.11:1 trên surface-alt; biến thể đậm của
         primary-soft đạt 5.66:1 và vẫn đọc là xanh. */
      color: var(--color-on-primary-soft);
    }
    .o-ngay span {
      font-size: var(--text-small);
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
    /* ---- Khối lịch ----
       Màu lấy từ 5 biến --lich-* trong _tokens.scss, không hard-code.
       Tên môn là --text-body + đậm: đây là thứ người dùng tìm trên lịch, để
       caption (11px) như trước là quá nhỏ. Các dòng phụ (tiết/giờ/phòng/GV)
       dùng --text-small (13px). */
    .khoi {
      position: relative;
      display: block;
      width: 100%;
      text-align: left;
      font-family: inherit;
      cursor: default;
      padding: 9px 10px;
      margin-bottom: 6px;
      border: 1px solid;
      border-radius: var(--radius-sm);
      line-height: 1.45;
      /* overflow: hidden để dải chéo không tràn ra ngoài góc khối. */
      overflow: hidden;
    }
    .khoi-ly-thuyet {
      background: var(--lich-ly-thuyet-bg);
      border-color: var(--lich-ly-thuyet-vien);
      color: var(--lich-ly-thuyet-fg);
    }
    .khoi-thuc-hanh {
      background: var(--lich-thuc-hanh-bg);
      border-color: var(--lich-thuc-hanh-vien);
      color: var(--lich-thuc-hanh-fg);
    }
    .khoi-truc-tuyen {
      background: var(--lich-truc-tuyen-bg);
      border-color: var(--lich-truc-tuyen-vien);
      color: var(--lich-truc-tuyen-fg);
    }
    .khoi-thi {
      background: var(--lich-thi-bg);
      border-color: var(--lich-thi-vien);
      color: var(--lich-thi-fg);
    }
    /* Tạm ngưng đứng sau cùng để thắng mọi lớp màu phía trên: buổi đã hủy
       phải đỏ dù nó là lý thuyết hay thực hành.
       padding-top chừa chỗ cho dải chéo — dải là hình chữ nhật xoay 45° nên
       bao lấy nó cần ~63px, ít hơn thì chữ tên môn bị dải đè. */
    .khoi-tam-ngung {
      background: var(--lich-tam-ngung-bg);
      border-color: var(--lich-tam-ngung-vien);
      color: var(--lich-tam-ngung-fg);
      padding-top: 64px;
    }
    .khoi-tam-ngung .ten {
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
    /*
      Dải chéo "Tạm ngưng" góc trên trái: băng 78×22 xoay -45° quanh (23,23),
      hai đầu bị overflow hidden cắt phẳng. Nền (::before) và chữ (span) cùng
      khung và phép biến đổi nên không lệch nhau.
    */
    .khoi-tam-ngung::before {
      content: '';
      position: absolute;
      left: -12px;
      top: 16px;
      width: 78px;
      height: 22px;
      background: var(--lich-tam-ngung-dai-bg);
      transform: rotate(-45deg);
      transform-origin: center;
      pointer-events: none;
    }
    .dai-tam-ngung {
      position: absolute;
      left: -12px;
      top: 16px;
      width: 78px;
      height: 22px;
      line-height: 22px;
      padding: 0;
      margin: 0;
      text-align: center;
      /* 11px là sàn đọc được của chữ nghiêng in hoa trên nền đỏ. */
      font-size: var(--text-caption);
      font-weight: 700;
      letter-spacing: 0.01em;
      text-transform: uppercase;
      color: var(--lich-tam-ngung-dai-fg);
      white-space: nowrap;
      overflow: hidden;
      transform: rotate(-45deg);
      transform-origin: center;
      pointer-events: none;
      z-index: 1;
    }
    .ten {
      margin: 0 0 3px;
      font-weight: 700;
      font-size: var(--text-body);
      line-height: 1.35;
      color: inherit;
    }
    .ma {
      margin: 0 0 6px;
      font-size: var(--text-small);
      font-variant-numeric: tabular-nums;
      opacity: 0.92;
      /* Mã lớp/môn không có khoảng trắng nên phải cho bẻ giữa từ ở đây. */
      overflow-wrap: anywhere;
    }
    .khoi dl {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 2px 8px;
      margin: 0;
      font-size: var(--text-small);
    }
    .khoi dt {
      font-size: var(--text-small);
      opacity: 0.88;
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
      margin-top: 7px;
      padding: 2px 7px;
      border-radius: 3px;
      font-size: var(--text-caption);
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      background: var(--color-warning-soft);
      color: var(--color-on-warning-soft);
    }
    /* "Đã dạy" là NHÃN TRẠNG THÁI, không phải loại lịch: nền trung tính để
       không tranh màu với 5 màu hình thức/loại ca. */
    .nhan-thi {
      background: var(--color-warning);
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
  /** Giảng viên đang mở trong hộp thoại; `null` = đóng. */
  readonly giangVienDangXem = signal<{ id: number; ten: string } | null>(null);

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

  /** Bấm ra ngoài đã đóng (lớp nền của hộp thoại bắt click); Escape nghe ở document. */
  @HostListener('document:keydown.escape')
  khiNhanEscape(): void {
    if (this.giangVienDangXem()) this.dongGiangVien();
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
        hinhThuc: b.hinh_thuc ?? 'LY_THUYET',
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
        hinhThuc: 'LY_THUYET',
        buoi: false,
        giangVienId: null,
      });
    }

    return khoi;
  }

  tenHinhThuc(hinhThuc: HinhThucHoc): string {
    return hinhThuc === 'THUC_HANH'
      ? 'Thực hành'
      : hinhThuc === 'TRUC_TUYEN'
        ? 'Trực tuyến'
        : 'Lý thuyết';
  }

  /**
   * Nhãn đọc cho trình đọc màn hình. Khối là một `<button>` chỉ có chữ bên
   * trong nên mặc định trình đọc sẽ đọc cả dải "Tạm ngưng" lẫn từng dòng
   * dl — ồn. Ở đây gộp thành một câu có đủ loại + trạng thái + thời gian.
   */
  nhanKhoi(k: Khoi): string {
    const loai =
      k.trangThai === 'CANCELLED'
        ? 'Lịch tạm ngưng'
        : k.loai === 'thi'
          ? 'Lịch thi'
          : `Lịch học ${this.tenHinhThuc(k.hinhThuc).toLowerCase()}`;
    const daDay = k.trangThai === 'DONE' ? ' đã dạy' : '';
    return `${loai}${daDay}: ${k.ten}, ${k.gio}, phòng ${k.phong}`;
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
      },
    });
  }

  moGiangVien(id: number | null, ten: string): void {
    if (!id) return;
    this.giangVienDangXem.set({ id, ten });
  }

  dongGiangVien(): void {
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
