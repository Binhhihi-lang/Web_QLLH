import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { LopHocPhan, TrangThaiLopHocPhan } from '@core/models/dao-tao.model';
import { LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { PageHeader } from '@shared/ui/page-header';
import { StatusBadge } from '@shared/ui/status-badge';

@Component({
  selector: 'app-lop-hoc-phan-chi-tiet',
  standalone: true,
  imports: [RouterLink, AppAlert, AppButton, PageHeader, StatusBadge],
  template: `
    @if (lop(); as x) {
      <app-page-header
        [title]="x.ma_lop_hp"
        [description]="x.mon_hoc.ten_mon + ' · ' + x.hoc_ky.ten_hoc_ky"
      >
        <app-button variant="secondary" routerLink="/lop-hoc-phan">
          <span class="material-icons" aria-hidden="true">arrow_back</span>
          Danh sách lớp học phần
        </app-button>
        @if (laAdmin()) {
          <app-button variant="secondary" [routerLink]="['/lop-hoc-phan', x.id, 'sua']"
            >Sửa lớp</app-button
          >
          @if (x.trang_thai !== 'CANCELLED') {
            @if (x.trang_thai === 'OPEN') {
              <app-button variant="secondary" (click)="doiTrangThai('CLOSED')">Đóng lớp</app-button>
            } @else {
              <app-button variant="secondary" (click)="doiTrangThai('OPEN')">Mở lại</app-button>
            }
            <app-button variant="danger" (click)="doiTrangThai('CANCELLED')">Hủy lớp</app-button>
          }
          <app-button variant="danger" (click)="xoa()">Xóa lớp</app-button>
        }
      </app-page-header>

      <nav class="tabs" aria-label="Thông tin lớp học phần">
        <a class="active" [routerLink]="['/lop-hoc-phan', x.id]">Thông tin</a>
        <a [routerLink]="['/lop-hoc-phan', x.id, 'sinh-vien']">Sinh viên</a>
        <span title="Chức năng lịch học chưa được triển khai">Lịch học</span>
        <span title="Chức năng điểm danh chưa được triển khai">Điểm danh</span>
        <a [routerLink]="['/lop-hoc-phan', x.id, 'diem']">Điểm</a>
      </nav>

      <section class="card" aria-label="Thông tin lớp học phần">
        <div>
          <small>Môn học</small><strong>{{ x.mon_hoc.ma_mon }} · {{ x.mon_hoc.ten_mon }}</strong>
        </div>
        <div>
          <small>Học kỳ</small><strong>{{ x.hoc_ky.ten_hoc_ky }} · {{ x.hoc_ky.nam_hoc }}</strong>
        </div>
        <div>
          <small>Giảng viên</small
          ><strong>{{ x.giang_vien.ho_ten }} ({{ x.giang_vien.ma_gv }})</strong>
        </div>
        <div>
          <small>Sĩ số</small><strong>{{ x.si_so_hien_tai }} / {{ x.si_so_toi_da }}</strong>
        </div>
        <div>
          <small>Năm thứ</small><strong>{{ x.nam_thu ? 'Năm ' + x.nam_thu : 'Mọi năm' }}</strong>
        </div>
        <div>
          <small>Trạng thái</small
          ><app-status-badge [value]="x.trang_thai" [label]="nhanTrangThai(x.trang_thai)" />
        </div>
        <div>
          <small>Điểm</small><strong>{{ x.da_chot_diem ? 'Đã chốt' : 'Chưa chốt' }}</strong>
        </div>
      </section>
    } @else if (loi()) {
      <app-alert muc="danger">{{ loi() }}</app-alert>
    } @else {
      <p class="loading" role="status">Đang tải thông tin lớp học phần…</p>
    }

    @if (thongBao()) {
      <app-alert class="thong-bao" muc="danger">{{ thongBao() }}</app-alert>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .tabs {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--color-border);
    }
    .tabs a,
    .tabs span {
      padding: 10px 14px;
      color: var(--color-ink-muted);
      text-decoration: none;
      font-size: var(--text-small);
      font-weight: 600;
    }
    .tabs a.active {
      color: var(--color-primary);
      border-bottom: 2px solid var(--color-primary);
    }
    .tabs span {
      opacity: 0.55;
    }
    .card {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1px;
      background: var(--color-border);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }
    .card div {
      display: grid;
      gap: 6px;
      padding: 18px;
      background: var(--color-surface);
    }
    small {
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }
    strong {
      font-size: var(--text-small);
    }
    .loading {
      color: var(--color-ink-muted);
    }
    .thong-bao {
      display: block;
      margin-top: 16px;
    }
    @media (max-width: 650px) {
      .card {
        grid-template-columns: 1fr 1fr;
      }
    }
  `,
})
export class LopHocPhanChiTiet {
  private readonly service = inject(LopHocPhanService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  readonly lop = signal<LopHocPhan | null>(null);
  readonly loi = signal('');
  readonly thongBao = signal('');
  readonly laAdmin = computed(() => this.auth.nguoiDung()?.vai_tro === 'ADMIN');

  constructor() {
    this.tai();
  }

  doiTrangThai(trangThai: TrangThaiLopHocPhan): void {
    if (
      trangThai === 'CANCELLED' &&
      !confirm('Hủy lớp học phần này? Các đăng ký đang hoạt động sẽ bị hủy.')
    ) {
      return;
    }
    this.thongBao.set('');
    this.service.doiTrangThai(this.id, trangThai).subscribe({
      next: (lop) => this.lop.set(lop),
      error: (error: { error?: { message?: string } }) => {
        this.thongBao.set(error.error?.message ?? 'Không thể đổi trạng thái lớp học phần.');
      },
    });
  }

  xoa(): void {
    if (!confirm('Xóa lớp học phần này?')) return;
    this.thongBao.set('');
    this.service.xoa(this.id).subscribe({
      next: () => this.router.navigate(['/lop-hoc-phan']),
      error: (error: { error?: { message?: string } }) => {
        this.thongBao.set(error.error?.message ?? 'Không thể xóa lớp học phần.');
      },
    });
  }

  nhanTrangThai(trangThai: TrangThaiLopHocPhan): string {
    return trangThai === 'OPEN' ? 'Đang mở' : trangThai === 'CLOSED' ? 'Đã đóng' : 'Đã hủy';
  }

  private tai(): void {
    this.service.layMot(this.id).subscribe({
      next: (lop) => this.lop.set(lop),
      error: () => this.loi.set('Không tải được lớp học phần.'),
    });
  }
}
