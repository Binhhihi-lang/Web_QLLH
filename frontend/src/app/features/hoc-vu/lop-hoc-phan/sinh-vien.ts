import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { LopHocPhanService, SinhVienLop } from '@core/services/lop-hoc-phan.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { CotBang, DataTable, OTuyChinh } from '@shared/ui/data-table';
import { PageHeader } from '@shared/ui/page-header';

@Component({
  selector: 'app-lop-hoc-phan-sinh-vien',
  standalone: true,
  imports: [AppAlert, AppButton, DataTable, OTuyChinh, PageHeader, RouterLink],
  template: `
    <app-page-header
      title="Sinh viên lớp học phần"
      description="Danh sách sinh viên có đăng ký đang hiệu lực."
    >
      <a class="back" [routerLink]="['/lop-hoc-phan', id]">Quay lại lớp học phần</a>
    </app-page-header>
    @if (loi()) {
      <app-alert muc="danger">{{ loi() }}</app-alert>
    }
    <app-data-table
      [cot]="cot()"
      [rows]="rows()"
      [dangTai]="dangTai()"
      [loi]="null"
      (thuLai)="tai()"
      tieuDeRong="Chưa có sinh viên"
      moTaRong="Lớp học phần này chưa có đăng ký hiệu lực."
    >
      <ng-template appOTuyChinh="thao_tac" let-row>
        @if (laAdmin()) {
          <app-button
            variant="danger"
            size="sm"
            (click)="huy(row)"
            [disabled]="dangHuy().has(row.dang_ky_hoc_phan_id)"
          >
            Hủy đăng ký
          </app-button>
        }
      </ng-template>
    </app-data-table>
  `,
  styles: `
    .back {
      color: var(--color-primary);
      font-weight: 600;
      text-decoration: none;
    }
    .back:hover {
      text-decoration: underline;
    }
  `,
})
export class LopHocPhanSinhVien {
  private readonly service = inject(LopHocPhanService);
  private readonly auth = inject(AuthService);
  readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  readonly rows = signal<SinhVienLop[]>([]);
  readonly dangTai = signal(true);
  readonly loi = signal<string | null>(null);
  readonly dangHuy = signal<Set<number>>(new Set());
  readonly laAdmin = computed(() => this.auth.nguoiDung()?.vai_tro === 'ADMIN');
  readonly cot = computed<CotBang<SinhVienLop>[]>(() => [
    { khoa: 'ma_sv', nhan: 'Mã sinh viên', rong: '150px' },
    { khoa: 'ho_ten', nhan: 'Họ và tên' },
    { khoa: 'email', nhan: 'Email' },
    { khoa: 'lop', nhan: 'Lớp hành chính', rong: '160px' },
    ...(this.laAdmin() ? [{ khoa: 'thao_tac', nhan: 'Thao tác', rong: '130px' }] : []),
  ]);

  constructor() {
    this.tai();
  }

  tai(): void {
    this.dangTai.set(true);
    this.loi.set(null);
    this.service.laySinhVien(this.id).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.dangTai.set(false);
      },
      error: () => {
        this.loi.set('Không tải được danh sách sinh viên.');
        this.dangTai.set(false);
      },
    });
  }

  huy(row: SinhVienLop): void {
    const xacNhan = confirm(`Hủy đăng ký học phần của ${row.ho_ten}?`);
    if (!xacNhan) return;
    const lyDo = prompt('Nhập lý do hủy đăng ký:')?.trim();
    if (!lyDo) return;

    const id = row.dang_ky_hoc_phan_id;
    this.dangHuy.update((ids) => new Set(ids).add(id));
    this.loi.set(null);
    this.service.huyDangKy(id, lyDo).subscribe({
      next: () => {
        this.dangHuy.update((ids) => {
          const next = new Set(ids);
          next.delete(id);
          return next;
        });
        this.tai();
      },
      error: (error: { error?: { message?: string } }) => {
        this.loi.set(error.error?.message ?? 'Không thể hủy đăng ký học phần.');
        this.dangHuy.update((ids) => {
          const next = new Set(ids);
          next.delete(id);
          return next;
        });
      },
    });
  }
}
