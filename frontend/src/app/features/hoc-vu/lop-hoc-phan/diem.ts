import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, map, switchMap } from 'rxjs';
import {
  CauHinhDiem,
  KhoangQuyDoiDiem,
  kiemTraCauHinhDiem,
  laKhoangQuyDoiDiem,
  laTrongSoDiem,
} from '@core/models/he-thong.model';
import { CauHinhService } from '@core/services/cau-hinh.service';
import { DongDiem, LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { chuanHoaTimKiem } from '@core/utils/chuan-hoa-tim-kiem';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { PageHeader } from '@shared/ui/page-header';
import { SearchInput } from '@shared/ui/search-input';

@Component({
  selector: 'app-lop-hoc-phan-diem',
  standalone: true,
  imports: [FormsModule, RouterLink, AppAlert, AppButton, PageHeader, SearchInput],
  template: `
    <app-page-header
      title="Bảng điểm lớp"
      [description]="moTaTrongSo()"
    >
      <a class="back" [routerLink]="['/lop-hoc-phan', id]">Quay lại lớp học phần</a>
    </app-page-header>
    @if (loi()) {
      <app-alert muc="danger">{{ loi() }}</app-alert>
    }
    @if (dangTai()) {
      <p class="loading" role="status">Đang tải bảng điểm…</p>
    } @else if (diem().length) {
      <section class="loc">
        <app-search-input
          class="tim"
          placeholder="Tìm theo mã SV hoặc họ tên…"
          (valueChange)="tuKhoa.set($event)"
        />
        @if (tuKhoa()) {
          <span class="dem">Khớp {{ diemHienThi().length }}/{{ diem().length }} sinh viên</span>
        }
      </section>
      <section class="toolbar">
        <span>{{ daChot() ? 'Điểm đã chốt' : 'Có thể chỉnh sửa điểm' }}</span>
        <div>
          @if (!daChot()) {
            <app-button variant="secondary" size="sm" (click)="tai()">Khôi phục</app-button>
            <app-button
              variant="secondary"
              size="sm"
              (click)="luu()"
              [disabled]="!hopLe()"
              [loading]="dangLuu()"
              >Lưu điểm</app-button
            >
            <app-button
              variant="primary"
              size="sm"
              (click)="chot()"
              [disabled]="!duDiem()"
              [loading]="dangLuu()"
              >Chốt điểm</app-button
            >
          }
        </div>
      </section>
      @if (diemHienThi().length) {
        <div class="bang">
          <table>
            <thead>
              <tr>
                <th>Mã SV</th>
                <th>Họ và tên</th>
                <th>Chuyên cần</th>
                <th>Giữa kỳ</th>
                <th>Cuối kỳ</th>
                <th>Tổng kết</th>
                <th>Điểm chữ</th>
                <th>Xếp loại</th>
              </tr>
            </thead>
            <tbody>
              @for (row of diemHienThi(); track row.dang_ky_hoc_phan_id) {
                <tr>
                  <td>{{ row.sinh_vien.ma_sv }}</td>
                  <td>{{ row.sinh_vien.ho_ten }}</td>
                  <td>
                    <input
                      aria-label="Điểm chuyên cần"
                      type="number"
                      min="0"
                      max="10"
                      step=".01"
                      [disabled]="daChot()"
                      [(ngModel)]="row.diem_chuyen_can"
                      (ngModelChange)="danhDauSua(row)"
                    />
                  </td>
                  <td>
                    <input
                      aria-label="Điểm giữa kỳ"
                      type="number"
                      min="0"
                      max="10"
                      step=".01"
                      [disabled]="daChot()"
                      [(ngModel)]="row.diem_giua_ky"
                      (ngModelChange)="danhDauSua(row)"
                    />
                  </td>
                  <td>
                    <input
                      aria-label="Điểm cuối kỳ"
                      type="number"
                      min="0"
                      max="10"
                      step=".01"
                      [disabled]="daChot()"
                      [(ngModel)]="row.diem_cuoi_ky"
                      (ngModelChange)="danhDauSua(row)"
                    />
                  </td>
                  <td>
                    <strong>{{ tong(row) }}</strong>
                  </td>
                  <td>
                    <span class="badge">{{ chu(row) }}</span>
                  </td>
                  <td>{{ xepLoai(row) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <p class="empty">Không có sinh viên nào khớp "{{ tuKhoa() }}".</p>
      }
    } @else {
      <p class="empty">Lớp học phần chưa có sinh viên đăng ký.</p>
    }
  `,
  styles: `
    .back {
      color: var(--color-primary);
      font-weight: 600;
      text-decoration: none;
    }
    .loc {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    /* Ô tìm kiếm không giãn hết hàng: bảng điểm là màn nhập liệu, chỗ đó để cho bảng. */
    .loc .tim {
      flex: 1 1 260px;
      max-width: 340px;
    }
    .dem {
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      padding: 12px 16px;
      margin-bottom: 12px;
      border-radius: var(--radius);
      background: var(--color-primary-soft);
      font-size: var(--text-small);
      font-weight: 600;
    }
    .toolbar div {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .bang {
      overflow: auto;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 760px;
      font-size: var(--text-small);
    }
    th {
      text-align: left;
      padding: 11px 14px;
      background: var(--color-surface-alt);
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }
    td {
      padding: 10px 14px;
      border-top: 1px solid var(--color-border-soft);
    }
    input {
      width: 70px;
      padding: 7px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font: inherit;
    }
    input:disabled {
      background: var(--color-surface-alt);
      color: var(--color-ink-muted);
    }
    .badge {
      padding: 3px 8px;
      border-radius: 999px;
      background: var(--color-primary-soft);
      color: var(--color-primary);
      font-weight: 700;
    }
    .loading,
    .empty {
      color: var(--color-ink-muted);
    }
  `,
})
export class LopHocPhanDiem {
  private readonly service = inject(LopHocPhanService);
  private readonly cauHinhService = inject(CauHinhService);
  private readonly diemBanDau = new Map<number, [number | null, number | null, number | null]>();
  readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  readonly diem = signal<DongDiem[]>([]);
  readonly dongDaSua = signal<ReadonlySet<number>>(new Set());
  readonly cauHinh = signal<CauHinhDiem | null>(null);
  readonly tuKhoa = signal('');
  readonly loi = signal('');
  readonly dangTai = signal(true);
  readonly dangLuu = signal(false);
  readonly daChot = signal(false);
  readonly hopLe = computed(() => this.diem().every((row) => this.diemHopLe(row)));
  readonly duDiem = computed(
    () => this.hopLe() && this.diem().length > 0 && this.diem().every((row) => this.diemDayDu(row)),
  );
  readonly moTaTrongSo = computed(() => {
    const weights = this.cauHinh()?.['diem.trong_so'];
    if (!weights) return 'Đang tải trọng số điểm…';
    const phanTram = (value: number) =>
      `${(value * 100).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%`;
    return `Trọng số: chuyên cần ${phanTram(weights.chuyen_can)}, giữa kỳ ${phanTram(weights.giua_ky)}, cuối kỳ ${phanTram(weights.cuoi_ky)}.`;
  });

  /**
   * Chỉ ảnh hưởng phần HIỂN THỊ. `hopLe`, `duDiem`, `luu`, `chot` vẫn đọc `diem()`
   * đầy đủ — chốt điểm phải kiểm tra cả lớp, không phải mỗi trang đang nhìn thấy.
   */
  readonly diemHienThi = computed(() => {
    const tuKhoa = chuanHoaTimKiem(this.tuKhoa());

    if (tuKhoa === '') {
      return this.diem();
    }

    return this.diem().filter((row) =>
      chuanHoaTimKiem(`${row.sinh_vien.ma_sv} ${row.sinh_vien.ho_ten}`).includes(tuKhoa),
    );
  });

  constructor() {
    this.tai();
  }

  tai(): void {
    this.dangTai.set(true);
    this.loi.set('');
    forkJoin({
      lop: this.service.layMot(this.id),
      diem: this.service.layDiem(this.id),
    })
      .pipe(
        switchMap(({ lop, diem }) =>
          this.cauHinhService
            .lay(lop.hoc_ky.id)
            .pipe(map((cauHinh) => ({ lop, diem, cauHinh }))),
        ),
      )
      .subscribe({
        next: ({ lop, diem, cauHinh }) => {
          const weights = cauHinh['diem.trong_so'];
          const ranges = cauHinh['diem.bang_quy_doi'];
          const days = cauHinh['diem.diem_danh.sua_trong_so_ngay'];
          if (
            !laTrongSoDiem(weights) ||
            !Array.isArray(ranges) ||
            !ranges.every(laKhoangQuyDoiDiem) ||
            typeof days !== 'number'
          ) {
            this.loi.set('Cấu hình điểm từ máy chủ thiếu khóa bắt buộc hoặc không đúng định dạng.');
            this.dangTai.set(false);
            return;
          }
          const validatedConfig: CauHinhDiem = {
            'diem.trong_so': weights,
            'diem.bang_quy_doi': ranges,
            'diem.diem_danh.sua_trong_so_ngay': days,
          };
          if (Object.keys(kiemTraCauHinhDiem(validatedConfig)).length > 0) {
            this.loi.set('Cấu hình điểm từ máy chủ không hợp lệ.');
            this.dangTai.set(false);
            return;
          }
          this.daChot.set(lop.da_chot_diem);
          this.diem.set(diem);
          this.luuAnhDiemGoc(diem);
          this.dongDaSua.set(new Set());
          this.cauHinh.set(validatedConfig);
          this.dangTai.set(false);
        },
        error: () => {
          this.loi.set('Không tải được bảng điểm hoặc thông tin lớp học phần.');
          this.dangTai.set(false);
        },
      });
  }

  tong(row: DongDiem): string {
    if (!this.dongDaSua().has(row.dang_ky_hoc_phan_id)) {
      return row.diem_tong_ket === null ? '—' : row.diem_tong_ket.toFixed(2);
    }
    const total = this.tinhTong(row);
    return total === null ? '—' : total.toFixed(2);
  }

  chu(row: DongDiem): string {
    if (!this.dongDaSua().has(row.dang_ky_hoc_phan_id)) return row.diem_chu ?? '—';
    return this.khoangQuyDoi(row)?.chu ?? '—';
  }

  xepLoai(row: DongDiem): string {
    if (!this.dongDaSua().has(row.dang_ky_hoc_phan_id)) return row.xep_loai ?? '—';
    return this.khoangQuyDoi(row)?.xep_loai ?? '—';
  }

  luu(): void {
    if (!this.hopLe() || this.daChot() || this.dangLuu()) return;
    this.guiDiem();
  }

  danhDauSua(row: DongDiem): void {
    const original = this.diemBanDau.get(row.dang_ky_hoc_phan_id);
    const current = [row.diem_chuyen_can, row.diem_giua_ky, row.diem_cuoi_ky] as const;
    this.dongDaSua.update((changed) => {
      const next = new Set(changed);
      if (original && current.every((score, index) => score === original[index])) {
        next.delete(row.dang_ky_hoc_phan_id);
      } else {
        next.add(row.dang_ky_hoc_phan_id);
      }
      return next;
    });
  }

  chot(): void {
    if (!this.duDiem() || this.daChot() || this.dangLuu()) return;
    if (!confirm('Chốt điểm lớp này? Điểm sẽ không còn chỉnh sửa.')) return;

    this.dangLuu.set(true);
    this.loi.set('');
    const changedRows = this.cacDongDaSua();
    if (changedRows.length === 0) {
      this.chotDiemDaLuu();
      return;
    }
    this.service.capNhatDiem(this.id, changedRows).subscribe({
      next: (rows) => {
        this.diem.set(rows);
        this.luuAnhDiemGoc(rows);
        this.dongDaSua.set(new Set());
        this.chotDiemDaLuu();
      },
      error: (error: { error?: { message?: string } }) => {
        this.loi.set(error.error?.message ?? 'Không lưu được điểm trước khi chốt.');
        this.dangLuu.set(false);
      },
    });
  }

  private guiDiem(): void {
    const changedRows = this.cacDongDaSua();
    if (changedRows.length === 0) return;
    this.dangLuu.set(true);
    this.loi.set('');
    this.service.capNhatDiem(this.id, changedRows).subscribe({
      next: (rows) => {
        this.diem.set(rows);
        this.luuAnhDiemGoc(rows);
        this.dongDaSua.set(new Set());
        this.dangLuu.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.loi.set(error.error?.message ?? 'Không lưu được điểm.');
        this.dangLuu.set(false);
      },
    });
  }

  private diemHopLe(row: DongDiem): boolean {
    return [row.diem_chuyen_can, row.diem_giua_ky, row.diem_cuoi_ky].every(
      (score) =>
        score === null ||
        (Number.isFinite(score) &&
          score >= 0 &&
          score <= 10 &&
          Math.round(score * 100) === score * 100),
    );
  }

  private diemDayDu(row: DongDiem): row is DongDiem & {
    diem_chuyen_can: number;
    diem_giua_ky: number;
    diem_cuoi_ky: number;
  } {
    return [row.diem_chuyen_can, row.diem_giua_ky, row.diem_cuoi_ky].every(
      (score) => score !== null && Number.isFinite(score),
    );
  }

  private tinhTong(row: DongDiem): number | null {
    if (!this.diemDayDu(row)) return null;
    const weights = this.cauHinh()?.['diem.trong_so'];
    if (!weights) return null;
    const total =
      row.diem_chuyen_can * weights.chuyen_can +
      row.diem_giua_ky * weights.giua_ky +
      row.diem_cuoi_ky * weights.cuoi_ky;
    return Math.round((total + Number.EPSILON) * 100) / 100;
  }

  private cacDongDaSua(): DongDiem[] {
    const changed = this.dongDaSua();
    return this.diem().filter((row) => changed.has(row.dang_ky_hoc_phan_id));
  }

  private luuAnhDiemGoc(rows: DongDiem[]): void {
    this.diemBanDau.clear();
    rows.forEach((row) =>
      this.diemBanDau.set(row.dang_ky_hoc_phan_id, [
        row.diem_chuyen_can,
        row.diem_giua_ky,
        row.diem_cuoi_ky,
      ]),
    );
  }

  private chotDiemDaLuu(): void {
    this.service.chotDiem(this.id).subscribe({
      next: (lop) => {
        this.daChot.set(lop.da_chot_diem);
        this.dangLuu.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.loi.set(error.error?.message ?? 'Không chốt được điểm.');
        this.dangLuu.set(false);
      },
    });
  }

  private khoangQuyDoi(row: DongDiem): KhoangQuyDoiDiem | undefined {
    const total = this.tinhTong(row);
    if (total === null) return undefined;
    return this.cauHinh()?.['diem.bang_quy_doi'].find(
      (range) => total >= range.tu && total <= range.den,
    );
  }
}
