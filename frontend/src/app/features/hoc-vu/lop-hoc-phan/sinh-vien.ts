import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { LopHocPhanService, SinhVienLop } from '@core/services/lop-hoc-phan.service';
import { chuanHoaTimKiem } from '@core/utils/chuan-hoa-tim-kiem';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { CotBang, DataTable, OTuyChinh } from '@shared/ui/data-table';
import { PageHeader } from '@shared/ui/page-header';
import { SearchInput } from '@shared/ui/search-input';

@Component({
  selector: 'app-lop-hoc-phan-sinh-vien',
  standalone: true,
  imports: [AppAlert, AppButton, DataTable, OTuyChinh, PageHeader, RouterLink, SearchInput],
  template: `
    <app-page-header
      title="Sinh viên lớp học phần"
      [description]="
        laSinhVien()
          ? 'Danh sách sinh viên cùng lớp.'
          : 'Danh sách sinh viên có đăng ký đang hiệu lực.'
      "
    >
      <a class="back" [routerLink]="['/lop-hoc-phan', id]">Quay lại lớp học phần</a>
    </app-page-header>
    @if (loi()) {
      <app-alert muc="danger">{{ loi() }}</app-alert>
    }
    @if (rows().length) {
      <section class="loc">
        <app-search-input
          class="tim"
          placeholder="Tìm theo mã SV hoặc họ tên…"
          (valueChange)="tuKhoa.set($event)"
        />
        @if (dangLoc()) {
          <span class="dem">Khớp {{ rowsHienThi().length }}/{{ rows().length }} sinh viên</span>
        }
      </section>
    }
    <app-data-table
      [cot]="cot()"
      [rows]="rowsHienThi()"
      [khoa]="laSinhVien() ? 'ma_sv' : 'id'"
      [dangTai]="dangTai()"
      [loi]="null"
      (thuLai)="tai()"
      [tieuDeRong]="tieuDeRong()"
      [moTaRong]="moTaRong()"
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
    .loc {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .loc .tim {
      flex: 1 1 260px;
      max-width: 340px;
    }
    .dem {
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }
  `,
})
export class LopHocPhanSinhVien {
  private readonly service = inject(LopHocPhanService);
  private readonly auth = inject(AuthService);
  readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  readonly rows = signal<SinhVienLop[]>([]);
  readonly tuKhoa = signal('');
  readonly dangTai = signal(true);
  readonly loi = signal<string | null>(null);
  readonly dangHuy = signal<Set<number>>(new Set());
  readonly laAdmin = computed(() => this.auth.nguoiDung()?.vai_tro === 'ADMIN');
  readonly laSinhVien = computed(() => this.auth.nguoiDung()?.vai_tro === 'SINH_VIEN');
  /** Chỉ ảnh hưởng phần hiển thị; `rows()` vẫn là dữ liệu đầy đủ để hủy đăng ký. */
  readonly rowsHienThi = computed(() => {
    const tuKhoa = chuanHoaTimKiem(this.tuKhoa());

    if (tuKhoa === '') {
      return this.rows();
    }

    return this.rows().filter((row) =>
      // `email`/`lop` vắng mặt với SINH_VIEN: nối thẳng sẽ sinh chữ "undefined"
      // trong khoá tìm kiếm, gõ "undef" lại ra cả danh sách.
      chuanHoaTimKiem(
        [row.ma_sv, row.ho_ten, row.email, row.lop].filter(Boolean).join(' '),
      ).includes(tuKhoa),
    );
  });
  readonly dangLoc = computed(() => chuanHoaTimKiem(this.tuKhoa()) !== '');
  readonly tieuDeRong = computed(() =>
    this.dangLoc() ? 'Không tìm thấy sinh viên' : 'Chưa có sinh viên',
  );
  readonly moTaRong = computed(() =>
    this.dangLoc()
      ? `Không có sinh viên nào khớp "${this.tuKhoa().trim()}".`
      : 'Lớp học phần này chưa có đăng ký hiệu lực.',
  );
  readonly cot = computed<CotBang<SinhVienLop>[]>(() => {
    // SINH_VIEN chỉ nhận `ma_sv` + `ho_ten` từ API, khai thêm cột sẽ ra ô trống.
    if (this.laSinhVien()) {
      return [
        { khoa: 'ma_sv', nhan: 'Mã sinh viên', rong: '150px' },
        { khoa: 'ho_ten', nhan: 'Họ và tên' },
      ];
    }

    return [
      { khoa: 'ma_sv', nhan: 'Mã sinh viên', rong: '150px' },
      { khoa: 'ho_ten', nhan: 'Họ và tên' },
      { khoa: 'email', nhan: 'Email' },
      { khoa: 'lop', nhan: 'Lớp hành chính', rong: '160px' },
      ...(this.laAdmin() ? [{ khoa: 'thao_tac', nhan: 'Thao tác', rong: '130px' }] : []),
    ];
  });

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
