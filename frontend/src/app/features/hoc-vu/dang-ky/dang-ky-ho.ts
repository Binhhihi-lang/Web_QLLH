import { Component, HostListener, computed, inject, signal, viewChild, ElementRef } from '@angular/core';
import { finalize } from 'rxjs';
import { LopHocPhan, SinhVien } from '@core/models/dao-tao.model';
import { SinhVienService } from '@core/services/sinh-vien.service';
import { LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { PageHeader } from '@shared/ui/page-header';
import {
  DangKyService,
  KetQuaDangKyHangLoat,
} from './dang-ky.service';

@Component({
  selector: 'app-dang-ky-ho',
  standalone: true,
  imports: [AppAlert, AppButton, PageHeader],
  template: `
    <app-page-header
      title="Đăng ký học phần"
      description="Đăng ký cho từng sinh viên hoặc xử lý cả lớp hành chính. Kết quả được kiểm tra theo từng sinh viên."
    />

    @if (thongBao()) {
      <app-alert [muc]="thongBaoMuc()">{{ thongBao() }}</app-alert>
    }

    <section class="the">
      <div class="the-dau">
        <span class="material-icons" aria-hidden="true">person_add</span>
        <div>
          <h2>Đăng ký cho sinh viên</h2>
          <p>Chọn một sinh viên và lớp học phần đang mở.</p>
        </div>
      </div>
      <form class="luoi-form" (submit)="dangKyDon($event)">
        <label>
          <span>Sinh viên</span>
          <select required [value]="sinhVienId()" (change)="sinhVienId.set(giaTri($event))">
            <option value="">Chọn sinh viên</option>
            @for (student of sinhVien(); track student.id) {
              <option [value]="student.id">
                {{ student.ma_sv }} · {{ student.ho_ten }}
              </option>
            }
          </select>
        </label>
        <label>
          <span>Lớp học phần</span>
          <select required [value]="lopHocPhanId()" (change)="lopHocPhanId.set(giaTri($event))">
            <option value="">Chọn lớp học phần</option>
            @for (section of lopHocPhan(); track section.id) {
              <option [value]="section.id">
                {{ section.ma_lop_hp }} · {{ section.mon_hoc.ten_mon }} · còn
                {{ section.si_so_toi_da - section.si_so_hien_tai }} chỗ
              </option>
            }
          </select>
        </label>
        <div class="nut-form">
          <app-button type="submit" [loading]="dangGuiDon()" [disabled]="!coDuLieuDon() || dangTai()">
            Đăng ký
          </app-button>
        </div>
      </form>
    </section>

    <section class="the">
      <div class="the-dau">
        <span class="material-icons" aria-hidden="true">groups</span>
        <div>
          <h2>Đăng ký theo lớp hành chính</h2>
          <p>Hệ thống xử lý độc lập từng sinh viên và giữ lại kết quả để đối soát.</p>
        </div>
      </div>
      <div class="luoi-form">
        <label>
          <span>Lớp học phần</span>
          <select required [value]="lopHangLoatId()" (change)="lopHangLoatId.set(giaTri($event))">
            <option value="">Chọn lớp học phần</option>
            @for (section of lopHocPhan(); track section.id) {
              <option [value]="section.id">
                {{ section.ma_lop_hp }} · {{ section.mon_hoc.ten_mon }} · còn
                {{ section.si_so_toi_da - section.si_so_hien_tai }} chỗ
              </option>
            }
          </select>
        </label>
        <label>
          <span>Lớp hành chính</span>
          <select required [value]="lopHanhChinhId()" (change)="lopHanhChinhId.set(giaTri($event))">
            <option value="">Chọn lớp hành chính</option>
            @for (classroom of lopHanhChinh(); track classroom.id) {
              <option [value]="classroom.id">{{ classroom.label }}</option>
            }
          </select>
        </label>
        <div class="nut-form">
          <app-button
            variant="secondary"
            [disabled]="!coDuLieuHangLoat() || dangTai()"
            (click)="moXacNhan()"
          >
            <span class="material-icons" aria-hidden="true">playlist_add</span>
            Xem và xác nhận
          </app-button>
        </div>
      </div>
    </section>

    @if (loiTai()) {
      <app-alert muc="danger" title="Không tải được dữ liệu">{{ loiTai() }}</app-alert>
    }

    @if (moHopThoai()) {
      <div class="nen" (click)="dongHopThoai()" aria-hidden="true"></div>
      <section
        #hopThoai
        class="hop-thoai"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tieu-de-xac-nhan"
        tabindex="-1"
      >
        <div class="hop-dau">
          <span class="material-icons" aria-hidden="true">playlist_add_check</span>
          <div>
            <h2 id="tieu-de-xac-nhan">
              {{ ketQuaHangLoat() ? 'Kết quả đăng ký hàng loạt' : 'Xác nhận đăng ký hàng loạt' }}
            </h2>
            <p>
              {{ lopDangChon()?.ma_lop_hp }} · {{ lopHCdangChon()?.label }}
            </p>
          </div>
          <button type="button" class="dong" aria-label="Đóng hộp thoại" (click)="dongHopThoai()">
            <span class="material-icons" aria-hidden="true">close</span>
          </button>
        </div>

        @if (ketQuaHangLoat(); as result) {
          <div class="tong-ket" aria-live="polite">
            <strong>{{ result.thanh_cong }} thành công</strong>
            <span>{{ result.that_bai }} thất bại · {{ result.chi_tiet.length }} sinh viên</span>
          </div>
          <div class="bang-ket-qua">
            <table>
              <thead>
                <tr><th>Mã sinh viên</th><th>Kết quả</th><th>Chi tiết</th></tr>
              </thead>
              <tbody>
                @for (line of result.chi_tiet; track line.sinh_vien_id) {
                  <tr>
                    <td>{{ line.ma_sv || '—' }}</td>
                    <td>
                      <span class="nhan-ket-qua" [class.loi]="line.ket_qua === 'THAT_BAI'">
                        {{ line.ket_qua === 'THANH_CONG' ? 'Thành công' : 'Thất bại' }}
                      </span>
                    </td>
                    <td>{{ line.message || (line.ket_qua === 'THANH_CONG' ? 'Đã đăng ký thành công.' : (line.ma_loi || 'Không thể đăng ký học phần.')) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <p>
            Xác nhận đăng ký lớp học phần cho
            <strong>{{ soSinhVienDuKien() }}</strong> sinh viên thuộc
            <strong>{{ lopHCdangChon()?.label }}</strong>?
          </p>
          <p class="goi-y">Mỗi sinh viên được xử lý riêng; một dòng lỗi không làm dừng các dòng còn lại.</p>
        }

        <div class="nut-hop">
          @if (!ketQuaHangLoat()) {
            <app-button variant="secondary" (click)="dongHopThoai()">Quay lại</app-button>
            <app-button [loading]="dangGuiHangLoat()" [disabled]="soSinhVienDuKien() === 0" (click)="xacNhanHangLoat()">
              Xác nhận đăng ký
            </app-button>
          } @else {
            <app-button (click)="dongHopThoai()">Đóng</app-button>
          }
        </div>
      </section>
    }
  `,
  styles: `
    :host{display:grid;gap:16px}.the{padding:20px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)}.the-dau{display:flex;align-items:flex-start;gap:12px;margin-bottom:18px}.the-dau>.material-icons{display:grid;place-items:center;width:40px;height:40px;border-radius:var(--radius);background:var(--color-primary-soft);color:var(--color-on-primary-soft);font-size:21px}.the-dau h2,.hop-dau h2{margin:0;color:var(--color-ink);font:600 var(--text-h3) var(--font-heading)}.the-dau p,.hop-dau p{margin:5px 0 0;color:var(--color-ink-muted);font-size:var(--text-small)}.luoi-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:end;gap:14px}.luoi-form label{display:grid;gap:6px;color:var(--color-ink-muted);font-size:var(--text-small);font-weight:600}.luoi-form select{width:100%;min-height:42px;padding:9px 11px;border:1px solid var(--color-border);border-radius:var(--radius);background:var(--color-surface);color:var(--color-ink);font:400 var(--text-small) var(--font-body)}.nut-form{display:flex;justify-content:flex-end;grid-column:1/-1}.nen{position:fixed;inset:0;z-index:90;background:rgba(15,23,42,.48)}.hop-thoai{position:fixed;inset:50% auto auto 50%;z-index:91;display:grid;gap:18px;width:min(760px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;transform:translate(-50%,-50%);padding:22px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-xl);box-shadow:var(--shadow-lg)}.hop-thoai:focus{outline:none}.hop-dau{display:flex;align-items:flex-start;gap:12px}.hop-dau>.material-icons{color:var(--color-primary);font-size:24px}.hop-dau>div{flex:1}.dong{display:grid;place-items:center;width:36px;height:36px;border:0;border-radius:var(--radius);background:transparent;color:var(--color-ink-muted);cursor:pointer}.dong:hover{background:var(--color-surface-alt);color:var(--color-ink)}.tong-ket{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 14px;border-radius:var(--radius);background:var(--color-success-soft);color:var(--color-on-success-soft);font-size:var(--text-small)}.tong-ket span,.goi-y{color:var(--color-ink-muted);font-size:var(--text-small)}.bang-ket-qua{overflow:auto;max-height:44dvh;border:1px solid var(--color-border);border-radius:var(--radius)}table{width:100%;border-collapse:collapse;font-size:var(--text-small)}th,td{padding:10px 12px;text-align:left;border-bottom:1px solid var(--color-border-soft)}th{position:sticky;top:0;background:var(--color-surface-alt);color:var(--color-ink-muted);font-size:var(--text-caption);text-transform:uppercase;letter-spacing:.03em}.nhan-ket-qua{color:var(--color-on-success-soft);font-weight:600}.nhan-ket-qua.loi{color:var(--color-on-danger-soft)}.nut-hop{display:flex;justify-content:flex-end;gap:8px}.goi-y{margin-top:-14px}@media(max-width:680px){.the{padding:16px}.luoi-form{grid-template-columns:1fr}.nut-form{grid-column:auto}.nut-form app-button{width:100%}.nut-hop{flex-direction:column-reverse}.nut-hop app-button{width:100%}.hop-thoai{padding:17px}}
  `,
})
export class DangKyHo {
  private readonly sinhVienService = inject(SinhVienService);
  private readonly lopHocPhanService = inject(LopHocPhanService);
  private readonly service = inject(DangKyService);
  private readonly hopThoai = viewChild<ElementRef<HTMLElement>>('hopThoai');

  readonly sinhVien = signal<SinhVien[]>([]);
  readonly lopHocPhan = signal<LopHocPhan[]>([]);
  readonly lopHanhChinh = signal<{ id: number; label: string }[]>([]);
  readonly sinhVienId = signal('');
  readonly lopHocPhanId = signal('');
  readonly lopHangLoatId = signal('');
  readonly lopHanhChinhId = signal('');
  readonly dangTai = signal(true);
  readonly dangGuiDon = signal(false);
  readonly dangGuiHangLoat = signal(false);
  readonly loiTai = signal<string | null>(null);
  readonly thongBao = signal<string | null>(null);
  readonly thongBaoMuc = signal<'success' | 'danger'>('success');
  readonly moHopThoai = signal(false);
  readonly ketQuaHangLoat = signal<KetQuaDangKyHangLoat | null>(null);

  readonly coDuLieuDon = computed(() => !!this.sinhVienId() && !!this.lopHocPhanId());
  readonly coDuLieuHangLoat = computed(() => !!this.lopHangLoatId() && !!this.lopHanhChinhId());
  readonly lopDangChon = computed(() =>
    this.lopHocPhan().find((row) => row.id === Number(this.lopHangLoatId())),
  );
  readonly lopHCdangChon = computed(() =>
    this.lopHanhChinh().find((row) => row.id === Number(this.lopHanhChinhId())),
  );
  readonly soSinhVienDuKien = computed(() =>
    this.sinhVien().filter(
      (row) =>
        row.trang_thai &&
        row.lop_hanh_chinh?.id === Number(this.lopHanhChinhId()),
    ).length,
  );

  constructor() {
    this.taiDuLieu();
  }

  giaTri(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  taiDuLieu(): void {
    this.dangTai.set(true);
    this.loiTai.set(null);
    let remaining = 3;
    const done = () => {
      remaining -= 1;
      if (remaining === 0) this.dangTai.set(false);
    };
    this.sinhVienService
      .layDanhSach({ page: 1, per_page: 100, trang_thai: true })
      .pipe(finalize(done))
      .subscribe({
        next: (response) => this.sinhVien.set(response.data),
        error: () => this.loiTai.set('Không thể tải danh sách sinh viên.'),
      });
    this.lopHocPhanService
      .layDanhSach({ page: 1, per_page: 100, trang_thai: 'OPEN' })
      .pipe(finalize(done))
      .subscribe({
        next: (response) => this.lopHocPhan.set(response.data),
        error: () => this.loiTai.set('Không thể tải danh sách lớp học phần.'),
      });
    this.sinhVienService
      .layTuyChonLop()
      .pipe(finalize(done))
      .subscribe({
        next: (rows) => this.lopHanhChinh.set(rows),
        error: () => this.loiTai.set('Không thể tải danh sách lớp hành chính.'),
      });
  }

  dangKyDon(event: Event): void {
    event.preventDefault();
    if (!this.coDuLieuDon() || this.dangGuiDon()) return;
    this.dangGuiDon.set(true);
    this.thongBao.set(null);
    this.service.dangKyHo(Number(this.sinhVienId()), Number(this.lopHocPhanId())).subscribe({
      next: () => {
        this.thongBaoMuc.set('success');
        this.thongBao.set('Đã đăng ký học phần cho sinh viên.');
        this.sinhVienId.set('');
        this.lopHocPhanId.set('');
        this.dangGuiDon.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.thongBaoMuc.set('danger');
        this.thongBao.set(error.error?.message ?? 'Không thể đăng ký học phần.');
        this.dangGuiDon.set(false);
      },
    });
  }

  moXacNhan(): void {
    if (!this.coDuLieuHangLoat() || this.dangTai()) return;
    this.ketQuaHangLoat.set(null);
    this.moHopThoai.set(true);
    queueMicrotask(() => this.hopThoai()?.nativeElement.focus());
  }

  xacNhanHangLoat(): void {
    if (!this.coDuLieuHangLoat() || this.dangGuiHangLoat()) return;
    this.dangGuiHangLoat.set(true);
    this.service
      .dangKyHangLoat({
        lop_hoc_phan_id: Number(this.lopHangLoatId()),
        lop_hanh_chinh_id: Number(this.lopHanhChinhId()),
      })
      .subscribe({
        next: (result) => {
          this.ketQuaHangLoat.set(result);
          this.dangGuiHangLoat.set(false);
        },
        error: (error: { error?: { message?: string } }) => {
          this.thongBaoMuc.set('danger');
          this.thongBao.set(error.error?.message ?? 'Không thể đăng ký hàng loạt.');
          this.dangGuiHangLoat.set(false);
          this.dongHopThoai();
        },
      });
  }

  dongHopThoai(): void {
    if (this.dangGuiHangLoat()) return;
    this.moHopThoai.set(false);
    this.ketQuaHangLoat.set(null);
  }

  @HostListener('document:keydown.escape')
  khiNhanEscape(): void {
    if (this.moHopThoai() && !this.dangGuiHangLoat()) this.dongHopThoai();
  }
}
