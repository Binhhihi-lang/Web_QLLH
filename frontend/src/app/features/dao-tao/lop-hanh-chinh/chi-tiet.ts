import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SinhVien } from '@core/models/dao-tao.model';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { PageHeader } from '@shared/ui/page-header';
import {
  LopHanhChinhChiTiet as LopHanhChinhData,
  LopHanhChinhService,
} from './lop-hanh-chinh.service';
import { ChonSinhVienDialog } from './chon-sinh-vien-dialog';
import { Subject, catchError, debounceTime, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-lop-hanh-chinh-chi-tiet',
  standalone: true,
  imports: [AppAlert, AppButton, ChonSinhVienDialog, ConfirmDialog, PageHeader, RouterLink],
  template: `
    @if (dangTai()) {
      <div class="dang-tai" role="status" aria-live="polite">Đang tải thông tin lớp…</div>
    } @else if (loiTai()) {
      <app-alert muc="danger" title="Không tải được lớp">
        {{ loiTai() }}
        <a routerLink="/lop-hanh-chinh">Quay lại danh sách</a>
      </app-alert>
    } @else if (lop(); as lopHienTai) {
      <app-page-header
        [title]="lopHienTai.ten_lop"
        [description]="'Mã lớp ' + lopHienTai.ma_lop + ' · Chi tiết và danh sách sinh viên'"
      >
        <a class="nut-quay-lai" routerLink="/lop-hanh-chinh">
          <span class="material-icons" aria-hidden="true">arrow_back</span>
          Danh sách
        </a>
        <a class="nut-sua" [routerLink]="['/lop-hanh-chinh', lopHienTai.id, 'sua']">
          <span class="material-icons" aria-hidden="true">edit</span>
          Chỉnh sửa
        </a>
      </app-page-header>

      @if (thongBao()) {
        <app-alert [muc]="mucThongBao()" [title]="tieuDeThongBao()">{{ thongBao() }}</app-alert>
      }

      <section class="tom-tat" aria-label="Thông tin lớp hành chính">
        <div class="ma-lop">
          <span class="nhan-muc">LỚP HÀNH CHÍNH</span>
          <strong>{{ lopHienTai.ma_lop }}</strong>
          <span class="ten-lop">{{ lopHienTai.ten_lop }}</span>
        </div>
        <div class="chi-so">
          <div class="chi-so-item">
            <span class="material-icons" aria-hidden="true">groups</span>
            <span><strong>{{ lopHienTai.si_so }}</strong><small>sinh viên</small></span>
          </div>
          <span class="trang-thai" [class.khoa]="!lopHienTai.trang_thai">
            <span class="dau-trang-thai" aria-hidden="true"></span>
            {{ lopHienTai.trang_thai ? 'Đang hoạt động' : 'Đã khóa' }}
          </span>
        </div>
        <dl class="thong-tin">
          <div><dt>Khóa học</dt><dd>{{ lopHienTai.khoa_hoc || 'Chưa phân khóa' }}</dd></div>
          <div><dt>Ngành</dt><dd>{{ lopHienTai.nganh || 'Chưa cập nhật' }}</dd></div>
          <div><dt>Năm nhập học</dt><dd>{{ lopHienTai.nam_nhap_hoc || 'Chưa cập nhật' }}</dd></div>
          @if (lopHienTai.mo_ta) {
            <div class="mo-ta"><dt>Mô tả</dt><dd>{{ lopHienTai.mo_ta }}</dd></div>
          }
        </dl>
      </section>

      <section class="danh-sach-sv" aria-labelledby="tieu-de-sinh-vien">
        <div class="dau-danh-sach">
          <div>
            <span class="nhan-muc">THÀNH VIÊN LỚP</span>
            <h2 id="tieu-de-sinh-vien">Danh sách sinh viên</h2>
            <p>
              @if (tongSinhVien() !== null) {
                {{ tongSinhVien() }} sinh viên trong lớp
              } @else {
                Sinh viên được xếp theo họ tên
              }
            </p>
          </div>
          <app-button (click)="moHopGanSinhVien()">
            <span class="material-icons" aria-hidden="true">person_add</span>
            Gán sinh viên
          </app-button>
        </div>

        @if (loiRoster()) {
          <app-alert muc="danger" title="Không tải được danh sách sinh viên">
            {{ loiRoster() }}
            <button type="button" class="nut-thu-lai" (click)="taiDanhSachSinhVien()">Thử lại</button>
          </app-alert>
        } @else if (dangTaiRoster()) {
          <div class="dang-tai danh-sach-trong" role="status" aria-live="polite">
            Đang tải danh sách sinh viên…
          </div>
        } @else if (sinhVienTrongLop().length === 0) {
          <div class="rong">
            <span class="material-icons" aria-hidden="true">groups</span>
            <strong>Lớp chưa có sinh viên</strong>
            <p>Gán sinh viên hiện có vào lớp để cập nhật danh sách.</p>
            <app-button variant="secondary" (click)="moHopGanSinhVien()">Gán sinh viên</app-button>
          </div>
        } @else {
          <div class="bang-bao">
            <table>
              <thead>
                <tr>
                  <th scope="col">Mã sinh viên</th>
                  <th scope="col">Họ và tên</th>
                  <th scope="col">Email</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                @for (sv of sinhVienTrongLop(); track sv.id) {
                  <tr>
                    <td class="ma-sv">{{ sv.ma_sv }}</td>
                    <td class="ho-ten">{{ sv.ho_ten }}</td>
                    <td class="email">{{ sv.email }}</td>
                    <td>
                      <span class="trang-thai" [class.khoa]="!sv.trang_thai">
                        <span class="dau-trang-thai" aria-hidden="true"></span>
                        {{ sv.trang_thai ? 'Hoạt động' : 'Đã khóa' }}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        class="nut-go"
                        [disabled]="dangCapNhat()"
                        [attr.aria-label]="'Gỡ ' + sv.ho_ten + ' khỏi lớp'"
                        (click)="xacNhanGo(sv)"
                      >
                        Gỡ khỏi lớp
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (soTrang() > 1) {
            <nav class="phan-trang" aria-label="Phân trang danh sách sinh viên">
              <button
                type="button"
                [disabled]="trangHienTai() <= 1 || dangTaiRoster()"
                (click)="taiDanhSachSinhVien(trangHienTai() - 1)"
              >
                <span class="material-icons" aria-hidden="true">chevron_left</span>
                Trước
              </button>
              <span>Trang {{ trangHienTai() }} / {{ soTrang() }}</span>
              <button
                type="button"
                [disabled]="trangHienTai() >= soTrang() || dangTaiRoster()"
                (click)="taiDanhSachSinhVien(trangHienTai() + 1)"
              >
                Sau
                <span class="material-icons" aria-hidden="true">chevron_right</span>
              </button>
            </nav>
          }
        }
      </section>

      @if (hopGanMo()) {
        <app-chon-sinh-vien-dialog
          [ketQua]="ketQuaTim()"
          [daChon]="daChon()"
          [tuKhoa]="tuKhoa()"
          [dangTim]="dangTim()"
          [dangCapNhat]="dangCapNhat()"
          [loiTimKiem]="loiTimKiem()"
          [loiGan]="loiGan()"
          [soSinhVienChuyen]="svCanChuyen().length"
          (dong)="dongHopGan()"
          (tuKhoaThayDoi)="capNhatTuKhoa($event)"
          (chonSinhVien)="capNhatChon($event.sinhVien, $event.daChon)"
          (xacNhanGan)="xacNhanGan()"
        />
      }

      @if (svChoGo(); as sv) {
        <app-confirm-dialog
          [tieuDe]="'Gỡ ' + sv.ho_ten + ' khỏi lớp?'"
          [moTa]="moTaGo(sv)"
          nhanDongY="Gỡ khỏi lớp"
          [dangXuLy]="dangCapNhat()"
          [lyDoChan]="loiGan()"
          (huy)="svChoGo.set(null)"
          (dongY)="thucHienGo(sv)"
        />
      }

      @if (hopXacNhanChuyen()) {
        <app-confirm-dialog
          tieuDe="Xác nhận chuyển lớp"
          [moTa]="moTaChuyen(lopHienTai.ma_lop)"
          nhanDongY="Xác nhận chuyển"
          [nguyHiem]="false"
          [dangXuLy]="dangCapNhat()"
          [lyDoChan]="loiGan()"
          (huy)="hopXacNhanChuyen.set(false)"
          (dongY)="thucHienGan()"
        />
      }
    }
  `,
  styles: `
    :host {
      display: block;
      max-width: 1120px;
      margin-inline: auto;
    }

    .tom-tat,
    .danh-sach-sv {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }

    .tom-tat {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 22px 28px;
      padding: 24px;
      margin-bottom: 18px;
    }

    .nhan-muc {
      color: var(--color-primary);
      font-size: var(--text-caption);
      font-weight: 700;
      letter-spacing: 0.08em;
    }

    .ma-lop {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
      min-width: 0;
    }

    .ma-lop > strong {
      color: var(--color-ink);
      font-size: clamp(22px, 4vw, 30px);
      letter-spacing: -0.025em;
      overflow-wrap: anywhere;
    }

    .ten-lop {
      color: var(--color-ink-muted);
      font-size: var(--text-small);
    }

    .chi-so {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
    }

    .chi-so-item {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--color-primary);
    }

    .chi-so-item > .material-icons {
      font-size: 23px;
    }

    .chi-so-item > span:last-child {
      display: flex;
      align-items: baseline;
      gap: 5px;
    }

    .chi-so-item strong {
      color: var(--color-ink);
      font-size: 22px;
      font-variant-numeric: tabular-nums;
    }

    .chi-so-item small {
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }

    .trang-thai {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      color: var(--color-on-success-soft);
      font-size: var(--text-caption);
      font-weight: 650;
      white-space: nowrap;
    }

    .dau-trang-thai {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-success);
    }

    .trang-thai.khoa {
      color: var(--color-on-danger-soft);
    }

    .trang-thai.khoa .dau-trang-thai {
      background: var(--color-danger);
    }

    .thong-tin {
      display: grid;
      grid-column: 1 / -1;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px 24px;
      margin: 0;
      padding-top: 18px;
      border-top: 1px solid var(--color-border);
    }

    .thong-tin div {
      min-width: 0;
    }

    .thong-tin dt {
      margin-bottom: 5px;
      color: var(--color-ink-subtle);
      font-size: var(--text-caption);
    }

    .thong-tin dd {
      margin: 0;
      color: var(--color-ink);
      font-size: var(--text-small);
      font-weight: 600;
      overflow-wrap: anywhere;
    }

    .thong-tin .mo-ta {
      grid-column: 1 / -1;
    }

    .danh-sach-sv {
      padding: 22px 24px;
    }

    .dau-danh-sach {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
    }

    .dau-danh-sach h2 {
      margin-top: 5px;
      color: var(--color-ink);
      font-size: var(--text-h2);
      font-weight: 650;
    }

    .dau-danh-sach p {
      margin: 5px 0 0;
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }

    .bang-bao {
      overflow-x: auto;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
    }

    table {
      width: 100%;
      min-width: 720px;
      border-collapse: collapse;
      text-align: left;
    }

    th,
    td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--color-border);
      font-size: var(--text-small);
    }

    th {
      background: var(--color-surface-alt);
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
      font-weight: 650;
      white-space: nowrap;
    }

    tbody tr:last-child td {
      border-bottom: 0;
    }

    tbody tr:hover {
      background: var(--color-surface-alt);
    }

    .ma-sv {
      color: var(--color-primary);
      font-weight: 650;
      white-space: nowrap;
    }

    .ho-ten {
      min-width: 150px;
      color: var(--color-ink);
      font-weight: 600;
    }

    .email {
      color: var(--color-ink-muted);
    }

    .nut-go,
    .nut-thu-lai {
      min-height: 32px;
      padding: 5px 8px;
      border: 0;
      border-radius: var(--radius);
      background: transparent;
      color: var(--color-danger);
      font: 600 var(--text-caption) var(--font-body);
      cursor: pointer;
      white-space: nowrap;
    }

    .nut-go:hover:not(:disabled),
    .nut-thu-lai:hover {
      background: var(--color-danger-soft);
    }

    .nut-go:focus-visible,
    .nut-thu-lai:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .nut-go:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .phan-trang {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 14px;
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }

    .phan-trang button {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      min-height: 34px;
      padding: 5px 8px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
      font: 600 var(--text-caption) var(--font-body);
      cursor: pointer;
    }

    .phan-trang button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .phan-trang .material-icons {
      font-size: 18px;
    }

    .rong {
      display: flex;
      align-items: center;
      flex-direction: column;
      gap: 9px;
      padding: 32px 16px;
      color: var(--color-ink-muted);
      text-align: center;
    }

    .rong > .material-icons {
      color: var(--color-ink-subtle);
      font-size: 30px;
    }

    .rong strong {
      color: var(--color-ink);
      font-size: var(--text-body);
    }

    .rong p {
      margin: 0 0 6px;
      font-size: var(--text-small);
    }

    .dang-tai {
      padding: 30px 16px;
      color: var(--color-ink-muted);
      text-align: center;
    }

    .danh-sach-trong {
      min-height: 120px;
    }

    .nut-quay-lai,
    .nut-sua {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 38px;
      padding: 8px 10px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      color: var(--color-ink-muted);
      font-size: var(--text-small);
      font-weight: 600;
      text-decoration: none;
    }

    .nut-sua {
      border-color: var(--color-primary-soft);
      background: var(--color-primary-soft);
      color: var(--color-on-primary-soft);
    }

    .nut-quay-lai:hover,
    .nut-sua:hover {
      filter: brightness(0.97);
    }

    .nut-quay-lai .material-icons,
    .nut-sua .material-icons {
      font-size: 18px;
    }

    @media (max-width: 680px) {
      .tom-tat {
        grid-template-columns: minmax(0, 1fr);
        gap: 16px;
        padding: 18px;
      }

      .chi-so {
        align-items: flex-start;
        flex-direction: row;
        justify-content: space-between;
      }

      .thong-tin {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .danh-sach-sv {
        padding: 18px 14px;
      }

      .dau-danh-sach {
        align-items: flex-start;
        flex-direction: column;
      }

    }

    @media (max-width: 380px) {
      .thong-tin {
        grid-template-columns: minmax(0, 1fr);
      }

      .thong-tin .mo-ta {
        grid-column: auto;
      }

    }
  `,
})
export class LopHanhChinhChiTiet {
  private readonly service = inject(LopHanhChinhService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tuKhoaThayDoi = new Subject<string>();
  private readonly id = this.layId(this.route.snapshot.paramMap.get('id'));

  readonly lop = signal<LopHanhChinhData | null>(null);
  readonly sinhVienTrongLop = signal<SinhVien[]>([]);
  readonly ketQuaTim = signal<SinhVien[]>([]);
  readonly daChon = signal<SinhVien[]>([]);
  readonly svChoGo = signal<SinhVien | null>(null);
  readonly dangTai = signal(true);
  readonly dangTaiRoster = signal(false);
  readonly dangTim = signal(false);
  readonly dangCapNhat = signal(false);
  readonly hopGanMo = signal(false);
  readonly hopXacNhanChuyen = signal(false);
  readonly tuKhoa = signal('');
  readonly loiTai = signal('');
  readonly loiRoster = signal('');
  readonly loiTimKiem = signal('');
  readonly loiGan = signal('');
  readonly thongBao = signal('');
  readonly mucThongBao = signal<'success' | 'danger'>('success');
  readonly tieuDeThongBao = computed(() =>
    this.mucThongBao() === 'success' ? 'Đã cập nhật' : 'Có lỗi xảy ra',
  );
  readonly tongSinhVien = signal<number | null>(null);
  readonly trangHienTai = signal(1);
  readonly soTrang = signal(1);
  readonly svCanChuyen = computed(() =>
    this.daChon().filter((sv) => sv.lop_hanh_chinh && sv.lop_hanh_chinh.id !== this.id),
  );

  constructor() {
    this.tuKhoaThayDoi
      .pipe(
        debounceTime(250),
        switchMap((q) => {
          this.dangTim.set(true);
          this.loiTimKiem.set('');
          return this.service.timSinhVien(q).pipe(
            catchError((error: unknown) => {
              this.loiTimKiem.set(this.thongBaoLoi(error, 'Không thể tìm sinh viên. Thử lại sau.'));
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        if (response) {
          const daXepLopNay = new Set(this.sinhVienTrongLop().map((sv) => sv.id));
          this.ketQuaTim.set(response.data.filter((sv) => !daXepLopNay.has(sv.id) && !sv.da_xoa));
        } else {
          this.ketQuaTim.set([]);
        }
        this.dangTim.set(false);
      });

    this.tai();
  }

  moHopGanSinhVien(): void {
    this.hopGanMo.set(true);
    this.tuKhoa.set('');
    this.daChon.set([]);
    this.loiGan.set('');
    this.tuKhoaThayDoi.next('');
  }

  dongHopGan(event?: Event): void {
    event?.stopPropagation();
    if (this.dangCapNhat()) return;
    this.hopGanMo.set(false);
    this.hopXacNhanChuyen.set(false);
    this.daChon.set([]);
  }

  capNhatTuKhoa(q: string): void {
    this.tuKhoa.set(q);
    this.tuKhoaThayDoi.next(q);
  }

  moTaGo(sv: SinhVien): string {
    const maLop = this.lop()?.ma_lop ?? 'lớp này';
    return `${sv.ho_ten} sẽ không còn thuộc lớp ${maLop}. Thao tác này không xóa hồ sơ, điểm hoặc đăng ký học phần.`;
  }

  moTaChuyen(maLop: string): string {
    const danhSach = this.svCanChuyen()
      .map((sv) => `${sv.ho_ten} (từ ${sv.lop_hanh_chinh?.ma_lop ?? 'chưa xếp lớp'})`)
      .join('; ');
    return `${this.svCanChuyen().length} sinh viên sẽ được chuyển sang ${maLop}: ${danhSach}. Việc này chỉ cập nhật lớp hành chính, không thay đổi điểm, đăng ký học phần hay điểm danh.`;
  }

  capNhatChon(sv: SinhVien, checked: boolean): void {
    this.daChon.update((current) =>
      checked
        ? current.some((item) => item.id === sv.id)
          ? current
          : [...current, sv]
        : current.filter((item) => item.id !== sv.id),
    );
    this.loiGan.set('');
  }

  daChonId(id: number): boolean {
    return this.daChon().some((sv) => sv.id === id);
  }

  xacNhanGan(): void {
    if (!this.daChon().length || this.dangCapNhat()) return;
    if (this.svCanChuyen().length) {
      this.hopXacNhanChuyen.set(true);
      return;
    }
    this.thucHienGan();
  }

  thucHienGan(): void {
    if (this.id === null || !this.daChon().length || this.dangCapNhat()) return;
    this.dangCapNhat.set(true);
    this.loiGan.set('');
    this.service.ganSinhVien(this.id, this.daChon().map((sv) => sv.id)).subscribe({
      next: () => {
        const count = this.daChon().length;
        this.dangCapNhat.set(false);
        this.hopGanMo.set(false);
        this.hopXacNhanChuyen.set(false);
        this.daChon.set([]);
        this.thongBao.set(`Đã gán ${count} sinh viên vào lớp.`);
        this.mucThongBao.set('success');
        this.trangHienTai.set(1);
        this.tai();
      },
      error: (error: unknown) => {
        this.dangCapNhat.set(false);
        this.loiGan.set(this.thongBaoLoi(error, 'Không thể gán sinh viên. Vui lòng thử lại.'));
      },
    });
  }

  xacNhanGo(sv: SinhVien): void {
    this.loiGan.set('');
    this.svChoGo.set(sv);
  }

  thucHienGo(sv: SinhVien): void {
    if (this.id === null || this.dangCapNhat()) return;
    this.dangCapNhat.set(true);
    this.loiGan.set('');
    this.service.goSinhVien(this.id, sv.id).subscribe({
      next: () => {
        this.dangCapNhat.set(false);
        this.svChoGo.set(null);
        this.thongBao.set(`Đã gỡ ${sv.ho_ten} khỏi lớp; hồ sơ sinh viên vẫn được giữ nguyên.`);
        this.mucThongBao.set('success');
        this.trangHienTai.set(1);
        this.tai();
      },
      error: (error: unknown) => {
        this.dangCapNhat.set(false);
        this.loiGan.set(this.thongBaoLoi(error, 'Không thể gỡ sinh viên khỏi lớp. Vui lòng thử lại.'));
      },
    });
  }

  taiDanhSachSinhVien(page = 1): void {
    if (this.id === null) return;
    this.dangTaiRoster.set(true);
    this.loiRoster.set('');
    this.service
      .laySinhVien(this.id, { page, per_page: 25, sort_by: 'ho_ten', sort_dir: 'asc' })
      .subscribe({
        next: (response) => {
          this.sinhVienTrongLop.set(response.data);
          this.tongSinhVien.set(response.meta.total);
          this.trangHienTai.set(response.meta.current_page);
          this.soTrang.set(response.meta.last_page);
          this.dangTaiRoster.set(false);
        },
        error: (error: unknown) => {
          this.loiRoster.set(this.thongBaoLoi(error, 'Không thể tải danh sách sinh viên.'));
          this.dangTaiRoster.set(false);
        },
      });
  }

  private tai(): void {
    if (this.id === null) {
      this.loiTai.set('Mã lớp không hợp lệ.');
      this.dangTai.set(false);
      return;
    }

    this.dangTai.set(true);
    this.loiTai.set('');
    this.service.layMot(this.id).subscribe({
      next: (lop) => {
        this.lop.set(lop);
        this.dangTai.set(false);
        this.taiDanhSachSinhVien();
      },
      error: (error: unknown) => {
        this.loiTai.set(this.thongBaoLoi(error, 'Không thể tải thông tin lớp.'));
        this.dangTai.set(false);
      },
    });
  }

  private layId(value: string | null): number | null {
    if (value === null) return null;
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  private thongBaoLoi(error: unknown, macDinh: string): string {
    return error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
      ? error.error.message
      : macDinh;
  }
}
