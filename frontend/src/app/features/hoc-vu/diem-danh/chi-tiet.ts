import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { chuanHoaTimKiem } from '@core/utils/chuan-hoa-tim-kiem';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { AppToastService } from '@shared/ui/app-toast.service';
import { LoadingState } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';
import { SearchInput } from '@shared/ui/search-input';
import {
  DiemDanhService,
  DongDiemDanh,
  DongDiemDanhInput,
  TrangThaiDiemDanh,
} from './diem-danh.service';

const TRANG_THAI: Array<{ value: TrangThaiDiemDanh; label: string }> = [
  { value: 'PRESENT', label: 'Có mặt' },
  { value: 'LATE', label: 'Đi muộn' },
  { value: 'ABSENT', label: 'Vắng' },
  { value: 'EXCUSED', label: 'Có phép' },
];

@Component({
  selector: 'app-diem-danh-chi-tiet',
  standalone: true,
  imports: [AppAlert, AppButton, FormsModule, LoadingState, PageHeader, RouterLink, SearchInput],
  template: `
    <app-page-header title="Điểm danh buổi học" [description]="moTaBuoi">
      <a
        class="quay-lai"
        routerLink="/diem-danh"
        [queryParams]="{ lop_hoc_phan_id: lopHocPhanId || null }"
      >
        <span class="material-icons" aria-hidden="true">arrow_back</span>
        Danh sách buổi học
      </a>
    </app-page-header>

    @if (loi() && !rows().length) {
      <app-alert muc="danger">{{ loi() }}</app-alert>
    }

    @if (dangTai()) {
      <app-loading-state label="Đang tải danh sách sinh viên…" />
    } @else if (rows().length) {
      <section class="thong-ke" aria-label="Tổng quan điểm danh">
        <div>
          <strong>{{ rows().length }}</strong
          ><span>Sinh viên</span>
        </div>
        <div>
          <strong>{{ demTrangThai('PRESENT') }}</strong
          ><span>Có mặt</span>
        </div>
        <div>
          <strong>{{ demTrangThai('LATE') }}</strong
          ><span>Đi muộn</span>
        </div>
        <div>
          <strong>{{ demChuaChon() }}</strong
          ><span>Chưa chọn</span>
        </div>
      </section>

      <section class="thanh-cong-cu">
        <app-search-input
          placeholder="Tìm mã sinh viên hoặc họ tên…"
          [value]="tuKhoa()"
          (valueChange)="tuKhoa.set($event)"
        />
        <div class="nut">
          <app-button variant="secondary" size="sm" (click)="tai()" [disabled]="dangLuu()">
            Tải lại
          </app-button>
          <app-button
            variant="primary"
            size="sm"
            (click)="luu()"
            [disabled]="!hopLe()"
            [loading]="dangLuu()"
          >
            Lưu điểm danh
          </app-button>
        </div>
      </section>

      @if (rowsHienThi().length) {
        <div class="bang">
          <table>
            <thead>
              <tr>
                <th>Mã sinh viên</th>
                <th>Họ và tên</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              @for (row of rowsHienThi(); track row.dang_ky_hoc_phan_id) {
                <tr>
                  <td class="ma">{{ row.sinh_vien.ma_sv }}</td>
                  <td>
                    <strong>{{ row.sinh_vien.ho_ten }}</strong>
                    <small>{{ row.sinh_vien.lop || row.sinh_vien.email }}</small>
                  </td>
                  <td>
                    <div
                      class="trang-thai"
                      role="group"
                      [attr.aria-label]="'Trạng thái ' + row.sinh_vien.ho_ten"
                    >
                      @for (item of trangThai; track item.value) {
                        <button
                          type="button"
                          [class.active]="row.trang_thai === item.value"
                          [attr.aria-pressed]="row.trang_thai === item.value"
                          [disabled]="dangLuu()"
                          (click)="doiTrangThai(row, item.value)"
                        >
                          {{ item.label }}
                        </button>
                      }
                    </div>
                  </td>
                  <td>
                    <input
                      class="ghi-chu"
                      type="text"
                      maxlength="500"
                      [ngModel]="row.ghi_chu ?? ''"
                      (ngModelChange)="doiGhiChu(row, $event)"
                      [disabled]="dangLuu()"
                      [attr.aria-label]="'Ghi chú điểm danh ' + row.sinh_vien.ho_ten"
                      placeholder="Ghi chú (không bắt buộc)"
                    />
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <p class="rong">Không tìm thấy sinh viên phù hợp với “{{ tuKhoa() }}”.</p>
      }
    } @else if (!loi()) {
      <section class="rong">
        <span class="material-icons" aria-hidden="true">groups</span>
        <strong>Buổi học chưa có sinh viên đăng ký</strong>
      </section>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .quay-lai {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--color-primary);
      font-size: var(--text-small);
      font-weight: 600;
      text-decoration: none;
    }
    .quay-lai:hover {
      text-decoration: underline;
    }
    .quay-lai .material-icons {
      font-size: 19px;
    }
    .thong-ke {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 14px;
    }
    .thong-ke div {
      display: grid;
      gap: 4px;
      padding: 14px 16px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
    }
    .thong-ke strong {
      color: var(--color-ink);
      font-size: var(--text-h3);
    }
    .thong-ke span {
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }
    .thanh-cong-cu {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    app-search-input {
      width: min(100%, 340px);
    }
    .nut {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .bang {
      overflow: auto;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }
    table {
      width: 100%;
      min-width: 860px;
      border-collapse: collapse;
      font-size: var(--text-small);
    }
    th {
      padding: 11px 14px;
      background: var(--color-surface-alt);
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
      text-align: left;
      white-space: nowrap;
    }
    td {
      padding: 12px 14px;
      border-top: 1px solid var(--color-border-soft);
    }
    td strong,
    td small {
      display: block;
    }
    td small {
      margin-top: 3px;
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }
    .ma {
      color: var(--color-ink-muted);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .trang-thai {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    .trang-thai button {
      padding: 6px 9px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      color: var(--color-ink-muted);
      cursor: pointer;
      font: inherit;
      font-size: var(--text-caption);
      white-space: nowrap;
    }
    .trang-thai button.active {
      border-color: var(--color-primary);
      background: var(--color-primary-soft);
      color: var(--color-on-primary-soft);
      font-weight: 650;
    }
    .trang-thai button:disabled {
      cursor: wait;
      opacity: 0.65;
    }
    .ghi-chu {
      width: 100%;
      min-width: 180px;
      padding: 8px 10px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      color: var(--color-ink);
      font: inherit;
    }
    .rong {
      display: grid;
      justify-items: center;
      gap: 8px;
      padding: 36px 16px;
      color: var(--color-ink-muted);
      text-align: center;
    }
    .rong .material-icons {
      color: var(--color-primary);
      font-size: 30px;
    }
    @media (max-width: 640px) {
      .thong-ke {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .thanh-cong-cu {
        align-items: stretch;
        flex-direction: column;
      }
      app-search-input {
        width: 100%;
      }
      .nut {
        justify-content: flex-end;
      }
    }
  `,
})
export class DiemDanhChiTiet {
  private readonly service = inject(DiemDanhService);
  private readonly toast = inject(AppToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly buoiHocId = Number(this.route.snapshot.paramMap.get('sessionId'));
  readonly lopHocPhanId = Number(this.route.snapshot.queryParamMap.get('lop_hoc_phan_id'));
  readonly moTaBuoi = this.moTaTheoQuery();

  readonly trangThai = TRANG_THAI;
  readonly rows = signal<DongDiemDanh[]>([]);
  readonly tuKhoa = signal('');
  readonly dangTai = signal(true);
  readonly dangLuu = signal(false);
  readonly loi = signal('');
  readonly rowsHienThi = computed(() => {
    const tuKhoa = chuanHoaTimKiem(this.tuKhoa());
    if (!tuKhoa) return this.rows();
    return this.rows().filter((row) =>
      chuanHoaTimKiem(
        `${row.sinh_vien.ma_sv} ${row.sinh_vien.ho_ten} ${row.sinh_vien.email}`,
      ).includes(tuKhoa),
    );
  });
  readonly hopLe = computed(
    () => !this.dangLuu() && this.rows().length > 0 && this.rows().every((row) => row.trang_thai),
  );

  constructor() {
    this.tai();
  }

  private moTaTheoQuery(): string {
    const query = this.route.snapshot.queryParamMap;
    const ngay = query.get('ngay_hoc');
    const batDau = query.get('gio_bat_dau');
    const ketThuc = query.get('gio_ket_thuc');
    const lop = query.get('ma_lop_hp');
    const mon = query.get('ten_mon');
    const chiTiet = [
      mon,
      lop,
      ngay ? this.dinhDangNgay(ngay) : null,
      batDau && ketThuc ? `${batDau} – ${ketThuc}` : null,
    ].filter((value): value is string => !!value);
    return chiTiet.length
      ? `${chiTiet.join(' · ')}. Chọn trạng thái cho từng sinh viên và lưu điểm danh.`
      : 'Chọn trạng thái cho từng sinh viên, thêm ghi chú nếu cần rồi lưu một lần.';
  }

  private dinhDangNgay(ngay: string): string {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(
      new Date(`${ngay}T00:00:00`),
    );
  }

  tai(): void {
    this.dangTai.set(true);
    this.loi.set('');
    this.service.layDiemDanh(this.buoiHocId).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.dangTai.set(false);
      },
      error: () => {
        this.loi.set('Không tải được danh sách điểm danh. Vui lòng thử lại.');
        this.dangTai.set(false);
      },
    });
  }

  doiTrangThai(row: DongDiemDanh, trangThai: TrangThaiDiemDanh): void {
    row.trang_thai = trangThai;
    this.rows.update((rows) => [...rows]);
  }

  doiGhiChu(row: DongDiemDanh, ghiChu: string): void {
    row.ghi_chu = ghiChu.trim() ? ghiChu : null;
    this.rows.update((rows) => [...rows]);
  }

  demTrangThai(trangThai: TrangThaiDiemDanh): number {
    return this.rows().filter((row) => row.trang_thai === trangThai).length;
  }

  demChuaChon(): number {
    return this.rows().filter((row) => row.trang_thai === null).length;
  }

  luu(): void {
    if (!this.hopLe()) return;
    const input: DongDiemDanhInput[] = this.rows().map((row) => ({
      dang_ky_hoc_phan_id: row.dang_ky_hoc_phan_id,
      trang_thai: row.trang_thai!,
      ghi_chu: row.ghi_chu,
    }));

    this.dangLuu.set(true);
    this.loi.set('');
    this.service.luuDiemDanh(this.buoiHocId, input).subscribe({
      // PUT chỉ trả tóm tắt — nạp lại danh sách để lấy trạng thái mới nhất.
      next: () => {
        this.dangLuu.set(false);
        this.toast.hien('Đã lưu điểm danh cho buổi học.', 'success');
        this.tai();
      },
      error: (error: { error?: { message?: string } }) => {
        this.toast.hien(
          error.error?.message ?? 'Không lưu được điểm danh. Vui lòng thử lại.',
          'danger',
        );
        this.dangLuu.set(false);
      },
    });
  }
}
