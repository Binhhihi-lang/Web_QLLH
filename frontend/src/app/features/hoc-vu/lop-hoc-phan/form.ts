import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, map } from 'rxjs';
import {
  LopHocPhanInput,
  LopHocPhanService,
  TuyChon,
} from '@core/services/lop-hoc-phan.service';
import { BuoiHocService } from '@core/services/buoi-hoc.service';
import { TrangThaiLopHocPhan } from '@core/models/dao-tao.model';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { AppToastService } from '@shared/ui/app-toast.service';
import { ChonTimKiem, LuaChonTimKiem } from '@shared/ui/chon-tim-kiem';
import { DateInput } from '@shared/ui/date-input';
import { PageHeader } from '@shared/ui/page-header';

interface DongLichNhap {
  thu: number;
  tiet_bat_dau: number;
  tiet_ket_thuc: number;
  phong_hoc_id: number;
}

@Component({
  selector: 'app-lop-hoc-phan-form',
  standalone: true,
  imports: [FormsModule, RouterLink, AppAlert, AppButton, ChonTimKiem, DateInput, PageHeader],
  template: `
    <app-page-header
      [title]="laSua() ? 'Sửa lớp học phần' : 'Mở lớp học phần'"
      description="Gán môn học, học kỳ, giảng viên, giới hạn sĩ số và xếp lịch học."
    />
    @if (loi()) {
      <app-alert muc="danger">{{ loi() }}</app-alert>
    }
    @if (dangTai()) {
      <p class="loading" role="status">Đang tải lớp học phần…</p>
    } @else {
      <form class="form" (ngSubmit)="luu()" #f="ngForm">
        <div class="luoi">
          <label>
            Mã lớp học phần *
            <input
              name="ma"
              required
              maxlength="50"
              [(ngModel)]="data.ma_lop_hp"
              placeholder="VD: INT2203-HK1-2026-01"
            />
          </label>
          <label>
            Học kỳ *
            <select name="hoc-ky" required [(ngModel)]="data.hoc_ky_id" (ngModelChange)="chonHocKy()">
              <option [ngValue]="0">Chọn học kỳ</option>
              @for (item of hk(); track item.id) {
                <option [ngValue]="item.id">{{ item.label }}</option>
              }
            </select>
          </label>

          <div class="o-rong">
            <span class="nhan">Môn học *</span>
            <app-chon-tim-kiem
              id="mon-hoc"
              placeholder="Gõ mã hoặc tên môn…"
              [nguon]="nguonMon"
              [giaTri]="data.mon_hoc_id || null"
              [nhanDaChon]="nhanMon()"
              (giaTriChange)="data.mon_hoc_id = $event ?? 0"
            />
          </div>

          <div class="o-rong">
            <span class="nhan">Giảng viên *</span>
            <app-chon-tim-kiem
              id="giang-vien"
              placeholder="Gõ mã hoặc tên giảng viên…"
              [nguon]="nguonGiangVien"
              [giaTri]="data.giang_vien_id || null"
              [nhanDaChon]="nhanGiangVien()"
              (giaTriChange)="data.giang_vien_id = $event ?? 0"
            />
          </div>

          <label>
            Sĩ số tối đa *
            <input
              name="si-so"
              required
              type="number"
              min="1"
              max="500"
              step="1"
              [(ngModel)]="data.si_so_toi_da"
            />
          </label>
          <label>
            Năm thứ
            <select name="nam-thu" [(ngModel)]="data.nam_thu">
              <option [ngValue]="null">Mọi năm</option>
              @for (year of [1, 2, 3, 4, 5, 6]; track year) {
                <option [ngValue]="year">Năm {{ year }}</option>
              }
            </select>
          </label>

          @if (laSua()) {
            <label>
              Trạng thái
              <select name="trang-thai" [(ngModel)]="data.trang_thai">
                <option value="OPEN">Đang mở</option>
                <option value="CLOSED">Đã đóng</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </label>
          }
        </div>

        @if (!laSua()) {
          <fieldset class="lich">
            <legend>Lịch học</legend>
            <p class="goi-y">
              Mỗi dòng là một buổi 2–3 tiết tại một phòng. Thêm bao nhiêu dòng thì hệ thống sinh
              bấy nhiêu buổi mỗi tuần — để trống nếu chưa xếp lịch.
            </p>

            @for (dong of lich(); track $index; let i = $index) {
              <div class="dong-lich">
                <label>
                  Thứ
                  <select [(ngModel)]="dong.thu" [name]="'thu' + i">
                    <option [ngValue]="2">Thứ 2</option>
                    <option [ngValue]="3">Thứ 3</option>
                    <option [ngValue]="4">Thứ 4</option>
                    <option [ngValue]="5">Thứ 5</option>
                    <option [ngValue]="6">Thứ 6</option>
                    <option [ngValue]="7">Thứ 7</option>
                    <option [ngValue]="8">Chủ nhật</option>
                  </select>
                </label>
                <label>
                  Từ tiết
                  <select [(ngModel)]="dong.tiet_bat_dau" [name]="'tu-tiet' + i">
                    @for (t of tiet(); track t.id) {
                      <option [ngValue]="t.so_tiet">{{ t.label }}</option>
                    }
                  </select>
                </label>
                <label>
                  Đến tiết
                  <select [(ngModel)]="dong.tiet_ket_thuc" [name]="'den-tiet' + i">
                    @for (t of tiet(); track t.id) {
                      <option [ngValue]="t.so_tiet">{{ t.label }}</option>
                    }
                  </select>
                </label>
                <label class="phong">
                  Phòng
                  <select [(ngModel)]="dong.phong_hoc_id" [name]="'phong' + i">
                    <option [ngValue]="0">Chọn phòng</option>
                    @for (p of phong(); track p.id) {
                      <option [ngValue]="p.id">{{ p.label }}</option>
                    }
                  </select>
                </label>
                <button
                  class="bo-dong"
                  type="button"
                  aria-label="Bỏ dòng lịch"
                  (click)="xoaDong(i)"
                >
                  <span class="material-icons" aria-hidden="true">close</span>
                </button>
              </div>
            }

            <button class="them-dong" type="button" (click)="themDong()">
              <span class="material-icons" aria-hidden="true">add</span>
              Thêm dòng lịch
            </button>

            @if (lich().length > 0) {
              <div class="khoang-ngay">
                <label>
                  Áp dụng từ ngày
                  <app-date-input
                    id="tu-ngay"
                    nhan="Áp dụng từ ngày"
                    [giaTri]="tuNgay()"
                    (giaTriChange)="tuNgay.set($event)"
                  />
                </label>
                <label>
                  Đến ngày
                  <app-date-input
                    id="den-ngay"
                    nhan="Đến ngày"
                    [giaTri]="denNgay()"
                    (giaTriChange)="denNgay.set($event)"
                  />
                </label>
              </div>

              <p class="xem-truoc">
                <b>{{ soBuoi() }}</b> buổi sẽ được tạo
                @if (buoiDau()) {
                  · buổi đầu {{ buoiDau() }}
                }
              </p>
              @if (loiLich()) {
                <p class="loi-lich">{{ loiLich() }}</p>
              }
            }
          </fieldset>
        }

        <div class="nut">
          <a routerLink="/lop-hoc-phan">Hủy</a>
          <app-button
            variant="primary"
            type="submit"
            [disabled]="!!f.invalid || !hopLe() || dangLuu()"
            [loading]="dangLuu()"
          >
            {{ laSua() ? 'Lưu thay đổi' : 'Mở lớp' }}
          </app-button>
        </div>
      </form>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .form {
      max-width: 880px;
      padding: 24px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }
    .luoi {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }
    label,
    .o-rong {
      display: grid;
      gap: 7px;
      font-size: var(--text-small);
      font-weight: 600;
      color: var(--color-ink);
      min-width: 0;
    }
    .nhan {
      font-weight: 600;
    }
    input,
    select {
      width: 100%;
      box-sizing: border-box;
      padding: 11px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      font: inherit;
      background: var(--color-surface);
      color: var(--color-ink);
    }
    .lich {
      margin: 22px 0 0;
      padding: 18px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
    }
    .lich legend {
      padding: 0 6px;
      font-size: var(--text-small);
      font-weight: 700;
    }
    .goi-y {
      margin: 0 0 14px;
      font-size: var(--text-caption);
      color: var(--color-ink-muted);
      font-weight: 400;
    }
    .dong-lich {
      display: grid;
      grid-template-columns: 1fr 0.7fr 0.7fr 1.4fr 36px;
      gap: 10px;
      align-items: end;
      margin-bottom: 10px;
    }
    .dong-lich label {
      font-weight: 500;
      font-size: var(--text-caption);
    }
    .dong-lich select {
      padding: 8px;
      font-size: var(--text-small);
    }
    .bo-dong {
      display: grid;
      place-items: center;
      height: 36px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-ink-subtle);
      cursor: pointer;
    }
    .bo-dong:hover {
      color: var(--color-danger);
      border-color: var(--color-danger);
    }
    .bo-dong .material-icons {
      font-size: 18px;
    }
    .them-dong {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border: 1px dashed var(--color-border);
      border-radius: var(--radius);
      background: transparent;
      color: var(--color-primary);
      font: inherit;
      font-size: var(--text-small);
      font-weight: 600;
      cursor: pointer;
    }
    .them-dong .material-icons {
      font-size: 18px;
    }
    .khoang-ngay {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-top: 16px;
    }
    .xem-truoc {
      margin: 14px 0 0;
      padding: 10px 13px;
      border-radius: var(--radius);
      background: var(--color-primary-soft);
      color: var(--color-ink);
      font-size: var(--text-small);
      font-weight: 400;
    }
    .xem-truoc b {
      font-size: var(--text-heading, 1.125rem);
    }
    .loi-lich {
      margin: 8px 0 0;
      color: var(--color-danger);
      font-size: var(--text-caption);
    }
    .nut {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 18px;
      margin-top: 24px;
    }
    .nut a {
      color: var(--color-ink-muted);
      text-decoration: none;
      font-weight: 600;
    }
    .loading {
      color: var(--color-ink-muted);
    }
    @media (max-width: 720px) {
      .form {
        padding: 16px;
      }
      .luoi,
      .khoang-ngay {
        grid-template-columns: 1fr;
      }
      .dong-lich {
        grid-template-columns: 1fr 1fr;
      }
      .dong-lich .phong {
        grid-column: 1 / -1;
      }
      .bo-dong {
        grid-column: 2;
        justify-self: end;
        width: 36px;
      }
    }
  `,
})
export class LopHocPhanForm {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(LopHocPhanService);
  private readonly buoiHoc = inject(BuoiHocService);
  private readonly toast = inject(AppToastService);

  readonly id = Number(this.route.snapshot.paramMap.get('id')) || null;
  readonly laSua = computed(() => this.id !== null);
  readonly dangTai = signal(this.id !== null);
  readonly dangLuu = signal(false);
  readonly loi = signal('');
  readonly hk = signal<TuyChon[]>([]);
  readonly phong = signal<TuyChon[]>([]);
  readonly tiet = signal<{ id: number; so_tiet: number; label: string }[]>([]);
  readonly lich = signal<DongLichNhap[]>([]);
  readonly tuNgay = signal('');
  readonly denNgay = signal('');
  readonly loiLich = signal('');

  readonly nhanMon = signal('');
  readonly nhanGiangVien = signal('');

  readonly data: LopHocPhanInput = {
    ma_lop_hp: '',
    mon_hoc_id: 0,
    hoc_ky_id: 0,
    giang_vien_id: 0,
    si_so_toi_da: 40,
    nam_thu: null,
    trang_thai: 'OPEN',
  };

  /** Nguồn cho ô chọn có tìm kiếm — gọi API theo từ khoá, không tải cả danh mục. */
  readonly nguonMon = (tuKhoa: string): Observable<LuaChonTimKiem[]> =>
    this.service
      .timMonHoc(tuKhoa)
      .pipe(map((ds) => ds.map((m) => ({ id: m.id, label: m.ten_mon, ma: m.ma_mon, phu: `${m.so_tin_chi} TC` }))));

  readonly nguonGiangVien = (tuKhoa: string): Observable<LuaChonTimKiem[]> =>
    this.service
      .timGiangVien(tuKhoa)
      .pipe(map((ds) => ds.map((g) => ({ id: g.id, label: g.ho_ten, ma: g.ma_gv, phu: null }))));

  readonly soBuoi = computed(() => {
    const tu = this.tuNgay();
    const den = this.denNgay();
    if (!tu || !den || this.lich().length === 0) return 0;
    return this.lich().reduce((tong, dong) => tong + this.demNgay(tu, den, dong.thu), 0);
  });

  readonly buoiDau = computed(() => {
    const tu = this.tuNgay();
    const den = this.denNgay();
    if (!tu || !den) return '';
    const thu = this.lich().map((d) => d.thu);
    if (thu.length === 0) return '';
    const ngay = this.ngayDauTien(tu, den, thu);
    return ngay ? this.dinhDangNgay(ngay) : '';
  });

  constructor() {
    this.taiTuyChon('semesters', this.hk);
    this.service.layTuyChon('rooms').subscribe({ next: (r) => this.phong.set(r) });
    this.service.layTiet().subscribe({ next: (r) => this.tiet.set(r) });
    if (this.id !== null) this.taiLop(this.id);
  }

  hopLe(): boolean {
    const coBan =
      !!this.data.ma_lop_hp.trim() &&
      this.data.mon_hoc_id > 0 &&
      this.data.hoc_ky_id > 0 &&
      this.data.giang_vien_id > 0 &&
      Number.isInteger(this.data.si_so_toi_da) &&
      this.data.si_so_toi_da >= 1 &&
      this.data.si_so_toi_da <= 500 &&
      (this.data.nam_thu === null ||
        (Number.isInteger(this.data.nam_thu) && this.data.nam_thu >= 1 && this.data.nam_thu <= 6));

    if (!coBan || this.laSua()) return coBan;

    return this.lichMoiHopLe();
  }

  themDong(): void {
    this.lich.update((ds) => [
      ...ds,
      { thu: 2, tiet_bat_dau: 1, tiet_ket_thuc: 3, phong_hoc_id: this.phong()[0]?.id ?? 0 },
    ]);
    if (this.lich().length === 1) this.apDungNgayHocKy();
  }

  xoaDong(i: number): void {
    this.lich.update((ds) => ds.filter((_, chiSo) => chiSo !== i));
  }

  chonHocKy(): void {
    if (this.lich().length > 0) this.apDungNgayHocKy();
  }

  luu(): void {
    if (!this.hopLe() || this.dangLuu() || this.dangTai()) return;
    this.dangLuu.set(true);
    this.loi.set('');
    this.loiLich.set('');

    const request =
      this.id === null ? this.service.tao(this.data) : this.service.capNhat(this.id, this.data);

    request.subscribe({
      next: (row) => {
        if (this.id === null && this.lich().length > 0) {
          this.sinhLich(row.id);
        } else {
          this.toast.hien('Đã lưu lớp học phần.', 'success');
          this.router.navigate(['/lop-hoc-phan', row.id]);
        }
      },
      error: (error: { error?: { message?: string } }) => {
        this.toast.hien(error.error?.message ?? 'Không lưu được lớp học phần.', 'danger');
        this.dangLuu.set(false);
      },
    });
  }

  private sinhLich(lopId: number): void {
    const dongDau = this.lich()[0];
    this.buoiHoc
      .sinhLich(lopId, {
        thu: [...new Set(this.lich().map((d) => d.thu))],
        tiet_bat_dau: dongDau.tiet_bat_dau,
        tiet_ket_thuc: dongDau.tiet_ket_thuc,
        phong_hoc_id: dongDau.phong_hoc_id,
        tu_ngay: this.tuNgay(),
        den_ngay: this.denNgay(),
      })
      .subscribe({
        next: () => this.router.navigate(['/lop-hoc-phan', lopId]),
        error: (error: { error?: { message?: string } }) => {
          this.toast.hien(
            (error.error?.message ?? 'Lớp đã tạo nhưng chưa sinh được lịch.') +
              ' Mở lớp để xếp lịch lại.',
            'danger',
          );
          this.dangLuu.set(false);
        },
      });
  }

  /**
   * Nhiều dòng lịch có thể khác tiết/phòng nên phải gọi riêng từng dòng;
   * nhưng API sinh lịch nhận một khung duy nhất, nên chỉ sinh được khi các dòng
   * giống nhau về tiết và phòng.
   */
  private lichMoiHopLe(): boolean {
    const ds = this.lich();
    if (ds.length === 0) return true;

    if (ds.some((d) => d.phong_hoc_id === 0)) {
      this.loiLich.set('Chọn phòng cho mọi dòng lịch.');
      return false;
    }
    if (ds.some((d) => d.tiet_ket_thuc < d.tiet_bat_dau)) {
      this.loiLich.set('Tiết kết thúc phải sau tiết bắt đầu.');
      return false;
    }
    if (!this.tuNgay() || !this.denNgay()) {
      this.loiLich.set('Chọn khoảng ngày áp dụng.');
      return false;
    }
    if (this.soBuoi() === 0) {
      this.loiLich.set('Khoảng ngày không có ngày nào rơi vào thứ đã chọn.');
      return false;
    }
    this.loiLich.set('');
    return true;
  }

  private apDungNgayHocKy(): void {
    const ky = this.hk().find((k) => k.id === this.data.hoc_ky_id) as
      | (TuyChon & { ngay_bat_dau?: string; ngay_ket_thuc?: string })
      | undefined;
    if (!ky?.ngay_bat_dau || !ky.ngay_ket_thuc) return;
    this.tuNgay.set(ky.ngay_bat_dau);
    this.denNgay.set(ky.ngay_ket_thuc);
  }

  private demNgay(tu: string, den: string, thu: number): number {
    const bat = new Date(`${tu}T00:00:00`);
    const ket = new Date(`${den}T00:00:00`);
    if (Number.isNaN(bat.getTime()) || Number.isNaN(ket.getTime()) || ket < bat) return 0;
    const iso = thu === 8 ? 7 : thu - 1;
    let dem = 0;
    const ngay = new Date(bat);
    while (ngay <= ket) {
      const thuCuaNgay = ngay.getDay() === 0 ? 7 : ngay.getDay();
      if (thuCuaNgay === iso) dem += 1;
      ngay.setDate(ngay.getDate() + 1);
    }
    return dem;
  }

  private ngayDauTien(tu: string, den: string, thu: number[]): Date | null {
    const bat = new Date(`${tu}T00:00:00`);
    const ket = new Date(`${den}T00:00:00`);
    if (Number.isNaN(bat.getTime()) || ket < bat) return null;
    const iso = thu.map((t) => (t === 8 ? 7 : t - 1));
    const ngay = new Date(bat);
    while (ngay <= ket) {
      const thuCuaNgay = ngay.getDay() === 0 ? 7 : ngay.getDay();
      if (iso.includes(thuCuaNgay)) return ngay;
      ngay.setDate(ngay.getDate() + 1);
    }
    return null;
  }

  private dinhDangNgay(ngay: Date): string {
    const ngay2 = String(ngay.getDate()).padStart(2, '0');
    const thang = String(ngay.getMonth() + 1).padStart(2, '0');
    return `${ngay2}/${thang}/${ngay.getFullYear()}`;
  }

  private taiTuyChon(path: 'semesters' | 'subjects' | 'teachers', target: typeof this.hk): void {
    this.service.layTuyChon(path).subscribe({
      next: (rows) => target.set(rows),
      error: () => this.loi.set('Không tải được dữ liệu lựa chọn. Vui lòng thử tải lại trang.'),
    });
  }

  private taiLop(id: number): void {
    this.service.layMot(id).subscribe({
      next: (row) => {
        this.data.ma_lop_hp = row.ma_lop_hp;
        this.data.mon_hoc_id = row.mon_hoc.id;
        this.data.hoc_ky_id = row.hoc_ky.id;
        this.data.giang_vien_id = row.giang_vien.id;
        this.data.si_so_toi_da = row.si_so_toi_da;
        this.data.nam_thu = row.nam_thu;
        this.data.trang_thai = row.trang_thai;
        this.nhanMon.set(`${row.mon_hoc.ma_mon} · ${row.mon_hoc.ten_mon}`);
        this.nhanGiangVien.set(`${row.giang_vien.ho_ten}`);
        this.dangTai.set(false);
      },
      error: () => {
        this.loi.set('Không tìm thấy lớp học phần.');
        this.dangTai.set(false);
      },
    });
  }
}
