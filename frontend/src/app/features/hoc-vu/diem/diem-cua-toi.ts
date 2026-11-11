import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LopHocPhanService, TuyChon } from '@core/services/lop-hoc-phan.service';
import { BangDiemHocKy, DiemService, TongQuanGpa } from './diem.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { PageHeader } from '@shared/ui/page-header';

@Component({
  selector: 'app-diem-cua-toi',
  standalone: true,
  imports: [FormsModule, AppAlert, AppButton, PageHeader],
  template: `
    <app-page-header
      title="Điểm của tôi"
      description="Xem điểm thành phần, kết quả học tập và GPA tích lũy."
    />

    <section class="bo-loc">
      <label>
        <span>Học kỳ</span>
        <select [ngModel]="hocKyId()" (ngModelChange)="chonHocKy($event)">
          @for (k of hocKy(); track k.id) {
            <option [ngValue]="k.id">{{ k.label }}</option>
          }
        </select>
      </label>
    </section>

    @if (loi()) {
      <app-alert muc="danger" title="Không tải được kết quả học tập">
        {{ loi() }}
        <app-button variant="secondary" size="sm" (click)="tai()">Thử lại</app-button>
      </app-alert>
    }

    @if (dangTai()) {
      <section class="thong-ke" aria-label="Đang tải điểm">
        <div class="the skeleton"></div>
        <div class="the skeleton"></div>
        <div class="the skeleton"></div>
      </section>
    } @else if (gpa(); as tongQuan) {
      <section class="thong-ke" aria-label="Tổng quan GPA">
        <article class="the">
          <span class="nhan">GPA học kỳ · hệ 10</span>
          <strong>{{ hienSo(bangDiem()?.gpa_he_10 ?? tongQuan.hoc_ky_hien_tai?.gpa_he_10) }}</strong>
          <small>{{ bangDiem()?.hoc_ky?.ten_hoc_ky ?? tongQuan.hoc_ky_hien_tai?.ten_hoc_ky ?? 'Chưa có học kỳ đang học' }}</small>
        </article>
        <article class="the">
          <span class="nhan">GPA học kỳ · hệ 4</span>
          <strong>{{ hienSo(bangDiem()?.gpa_he_4 ?? tongQuan.hoc_ky_hien_tai?.gpa_he_4) }}</strong>
          <small>{{ bangDiem()?.tong_tin_chi ?? tongQuan.hoc_ky_hien_tai?.tong_tin_chi ?? 0 }} tín chỉ trong kỳ</small>
        </article>
        <article class="the the-noi-bat">
          <span class="nhan">GPA tích lũy (CPA) · hệ 10 / hệ 4</span>
          <strong>{{ hienSo(tongQuan.tich_luy.gpa_he_10) }} / {{ hienSo(tongQuan.tich_luy.gpa_he_4) }}</strong>
          <small>
            {{ tongQuan.tich_luy.tin_chi_dat }} / {{ tongQuan.tich_luy.tong_tin_chi }} tín chỉ đạt
            · {{ tongQuan.tich_luy.so_hoc_ky_da_tinh }} học kỳ
          </small>
        </article>
      </section>
    }

    @if (!dangTai() && bangDiem(); as bang) {
      <section class="bang-diem" aria-labelledby="tieu-de-bang-diem">
        <div class="dau-bang">
          <div>
            <p class="nhan-muc">KẾT QUẢ THEO HỌC KỲ</p>
            <h2 id="tieu-de-bang-diem">{{ bang.hoc_ky.ten_hoc_ky }}</h2>
            <p>{{ bang.hoc_ky.ma_hoc_ky }} · {{ bang.mon_hoc.length }} môn học</p>
          </div>
          <div class="gpa-ky">
            <span>GPA kỳ</span>
            <strong>{{ hienSo(bang.gpa_he_10) }} / {{ hienSo(bang.gpa_he_4) }}</strong>
            <small>Hệ 10 / hệ 4 · {{ bang.tong_tin_chi }} tín chỉ</small>
          </div>
        </div>

        @if (bang.mon_hoc.length) {
          <div class="bang-cuon">
            <table>
              <thead>
                <tr>
                  <th scope="col">Mã môn</th>
                  <th scope="col">Tên môn học</th>
                  <th scope="col">Tín chỉ</th>
                  <th scope="col">Chuyên cần</th>
                  <th scope="col">Giữa kỳ</th>
                  <th scope="col">Cuối kỳ</th>
                  <th scope="col">Tổng kết</th>
                  <th scope="col">Điểm chữ</th>
                  <th scope="col">Hệ 4</th>
                  <th scope="col">Kết quả</th>
                </tr>
              </thead>
              <tbody>
                @for (mon of bang.mon_hoc; track mon.ma_mon) {
                  <tr>
                    <td class="ma-mon">{{ mon.ma_mon }}</td>
                    <td>{{ mon.ten_mon }}</td>
                    <td>{{ mon.so_tin_chi }}</td>
                    <td>{{ hienSo(mon.diem_chuyen_can) }}</td>
                    <td>{{ hienSo(mon.diem_giua_ky) }}</td>
                    <td>{{ hienSo(mon.diem_cuoi_ky) }}</td>
                    <td><strong>{{ hienSo(mon.diem_tong_ket) }}</strong></td>
                    <td>{{ mon.diem_chu ?? '—' }}</td>
                    <td>{{ hienSo(mon.diem_he_4) }}</td>
                    <td>
                      @if (mon.ket_qua) {
                        <span class="ket-qua" [class.dat]="mon.ket_qua === 'DAT'">
                          {{ mon.ket_qua === 'DAT' ? 'Đạt' : 'Không đạt' }}
                        </span>
                      } @else {
                        <span class="chua-co-diem">Chưa có điểm</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="rong">
            <span class="material-icons" aria-hidden="true">school</span>
            <strong>Chưa có kết quả học tập</strong>
            <p>Điểm sẽ xuất hiện khi giảng viên cập nhật kết quả môn học.</p>
          </div>
        }
      </section>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .bo-loc {
      display: flex;
      gap: 14px;
      margin-bottom: 16px;
    }
    .bo-loc label {
      display: grid;
      gap: 6px;
      font-size: var(--text-caption);
      font-weight: 600;
      color: var(--color-ink-muted);
    }
    .bo-loc select {
      padding: 9px 10px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font: inherit;
      font-size: var(--text-small);
      background: var(--color-surface);
      color: var(--color-ink);
      min-width: 240px;
    }
    .thong-ke {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 20px;
    }

    .the {
      display: grid;
      min-height: 132px;
      align-content: start;
      gap: 8px;
      padding: 18px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
    }

    .the-noi-bat {
      border-color: var(--color-primary);
      background: var(--color-primary-soft);
    }

    .nhan {
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
      font-weight: 600;
    }

    .the strong {
      color: var(--color-ink);
      font-size: var(--text-h2);
      font-variant-numeric: tabular-nums;
    }

    .the small,
    .gpa-ky small {
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }

    .skeleton {
      min-height: 132px;
      background: linear-gradient(
        90deg,
        var(--color-surface-alt),
        var(--color-surface),
        var(--color-surface-alt)
      );
    }

    .bang-diem {
      overflow: hidden;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
    }

    .dau-bang {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 20px;
      border-bottom: 1px solid var(--color-border);
    }

    .nhan-muc {
      margin: 0 0 4px;
      color: var(--color-primary);
      font-size: var(--text-caption);
      font-weight: 700;
      letter-spacing: 0.06em;
    }

    h2 {
      margin: 0;
      color: var(--color-ink);
      font-size: var(--text-h3);
      font-weight: 650;
    }

    .dau-bang p:last-child {
      margin: 5px 0 0;
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }

    .gpa-ky {
      display: grid;
      gap: 4px;
      text-align: right;
    }

    .gpa-ky span {
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }

    .gpa-ky strong {
      color: var(--color-primary);
      font-size: var(--text-h3);
      font-variant-numeric: tabular-nums;
    }

    .bang-cuon {
      overflow-x: auto;
    }

    table {
      width: 100%;
      min-width: 930px;
      border-collapse: collapse;
      font-size: var(--text-small);
    }

    th,
    td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--color-border-soft);
      text-align: left;
      white-space: nowrap;
    }

    th {
      background: var(--color-surface-alt);
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
      font-weight: 650;
    }

    tbody tr:last-child td {
      border-bottom: 0;
    }

    tbody tr:hover {
      background: var(--color-surface-alt);
    }

    .ma-mon {
      color: var(--color-ink-muted);
      font-variant-numeric: tabular-nums;
    }

    .ket-qua {
      display: inline-flex;
      padding: 4px 8px;
      border-radius: 999px;
      background: var(--color-danger-soft);
      color: var(--color-danger);
      font-size: var(--text-caption);
      font-weight: 650;
    }

    .ket-qua.dat {
      background: var(--color-success-soft);
      color: var(--color-success);
    }

    .chua-co-diem {
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }

    .rong {
      display: grid;
      justify-items: center;
      gap: 8px;
      padding: 48px 20px;
      color: var(--color-ink-muted);
      text-align: center;
    }

    .rong .material-icons {
      color: var(--color-primary);
      font-size: 32px;
    }

    .rong strong {
      color: var(--color-ink);
    }

    .rong p {
      margin: 0;
      font-size: var(--text-small);
    }

    @media (max-width: 820px) {
      .thong-ke {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .the-noi-bat {
        grid-column: 1 / -1;
      }
    }

    @media (max-width: 560px) {
      .thong-ke {
        grid-template-columns: 1fr;
      }

      .the-noi-bat {
        grid-column: auto;
      }

      .dau-bang {
        align-items: flex-start;
        flex-direction: column;
      }

      .gpa-ky {
        text-align: left;
      }
    }
  `,
})
export class DiemCuaToi {
  private readonly service = inject(DiemService);
  private readonly lopHocPhan = inject(LopHocPhanService);
  private readonly route = inject(ActivatedRoute);

  readonly dangTai = signal(true);
  readonly loi = signal('');
  readonly bangDiem = signal<BangDiemHocKy | null>(null);
  readonly gpa = signal<TongQuanGpa | null>(null);
  readonly hocKy = signal<TuyChon[]>([]);
  readonly hocKyId = signal(0);

  constructor() {
    this.lopHocPhan.layTuyChon('semesters').subscribe({
      next: (rows) => {
        this.hocKy.set(rows);
        // Chọn kỳ đang diễn ra thay vì kỳ mới nhất: danh sách sắp giảm dần nên
        // rows[0] hay là kỳ tương lai chưa có điểm, mở trang là thấy bảng rỗng.
        const macDinh =
          rows.find((k) => (k as TuyChon & { trang_thai?: string }).trang_thai === 'ONGOING') ??
          rows[0];
        if (macDinh) this.hocKyId.set(macDinh.id);
        this.hocKyTuQuery(rows);
        this.tai();
      },
      error: () => this.tai(),
    });
  }

  chonHocKy(id: number): void {
    this.hocKyId.set(id);
    this.tai();
  }

  /**
   * Mở từ tab của một lớp học phần → `?hoc_ky_id=` chỉ đúng kỳ của lớp đó.
   * Chỉ nhận id có trong danh sách kỳ vừa tải: query rác mà gán thẳng thì ô chọn
   * kỳ không khớp option nào và sinh viên thấy bảng rỗng không hiểu vì sao.
   */
  private hocKyTuQuery(rows: TuyChon[]): void {
    const id = Number(this.route.snapshot.queryParamMap.get('hoc_ky_id'));
    if (!id) return;
    if (rows.some((k) => k.id === id)) this.hocKyId.set(id);
  }

  tai(): void {
    this.dangTai.set(true);
    this.loi.set('');
    forkJoin({
      bangDiem: this.service.layDiemCuaToi(this.hocKyId() || undefined),
      gpa: this.service.layGpa(),
    }).subscribe({
      next: ({ bangDiem, gpa }) => {
        this.bangDiem.set(bangDiem);
        this.gpa.set(gpa);
        this.dangTai.set(false);
      },
      error: (error: unknown) => {
        this.loi.set(
          error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
            ? error.error.message
            : 'Không tải được điểm và GPA. Vui lòng thử lại.',
        );
        this.dangTai.set(false);
      },
    });
  }

  hienSo(value: number | null | undefined): string {
    return value === null || value === undefined ? '—' : value.toFixed(2);
  }
}
