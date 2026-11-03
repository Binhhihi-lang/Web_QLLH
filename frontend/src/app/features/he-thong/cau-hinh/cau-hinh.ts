import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import {
  CauHinhDiem,
  KhoangQuyDoiDiem,
  TrongSoDiem,
  laKhoangQuyDoiDiem,
  laTrongSoDiem,
  kiemTraCauHinhDiem,
} from '@core/models/he-thong.model';
import { CauHinhService } from '@core/services/cau-hinh.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { PageHeader } from '@shared/ui/page-header';

type KhoaTrongSo = keyof TrongSoDiem;
type KhoaKhoang = 'tu' | 'den' | 'chu' | 'he_4' | 'dat';

@Component({
  selector: 'app-cau-hinh',
  standalone: true,
  imports: [AppAlert, AppButton, PageHeader],
  template: `
    <app-page-header
      title="Cấu hình"
      description="Điều chỉnh quy tắc tính điểm và thời hạn được phép sửa điểm danh."
    />

    @if (thongBao()) {
      <app-alert [muc]="thongBao()!.muc">{{ thongBao()!.noiDung }}</app-alert>
    }

    @if (dangTai()) {
      <div class="dang-tai" role="status">Đang tải cấu hình…</div>
    } @else if (loiTai()) {
      <app-alert muc="danger" title="Không tải được cấu hình">
        {{ loiTai() }}
        <button type="button" class="nut-thu-lai" (click)="tai()">Thử lại</button>
      </app-alert>
    } @else if (cauHinh(); as config) {
      <form class="noi-dung" (submit)="luu($event)" novalidate>
        @if (loiLuu()) {
          <app-alert muc="danger" title="Chưa thể lưu cấu hình">{{ loiLuu() }}</app-alert>
        }

        <section class="the" aria-labelledby="trong-so-title">
          <div class="dau-the">
            <div>
              <h2 id="trong-so-title">Trọng số điểm thành phần</h2>
              <p>Tổng ba trọng số phải bằng 100%.</p>
            </div>
            <span class="tong-trong-so" [class.khong-hop-le]="!tongTrongSoHopLe()">
              Tổng: {{ (tongTrongSo() * 100).toFixed(1) }}%
            </span>
          </div>
          <div class="luoi-trong-so">
            <label class="truong">
              <span>Chuyên cần</span>
              <div class="don-vi">
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  [value]="config['diem.trong_so'].chuyen_can"
                  (input)="doiTrongSo('chuyen_can', $event)"
                />
                <span>tỷ lệ (0–1)</span>
              </div>
            </label>
            <label class="truong">
              <span>Giữa kỳ</span>
              <div class="don-vi">
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  [value]="config['diem.trong_so'].giua_ky"
                  (input)="doiTrongSo('giua_ky', $event)"
                />
                <span>tỷ lệ (0–1)</span>
              </div>
            </label>
            <label class="truong">
              <span>Cuối kỳ</span>
              <div class="don-vi">
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  [value]="config['diem.trong_so'].cuoi_ky"
                  (input)="doiTrongSo('cuoi_ky', $event)"
                />
                <span>tỷ lệ (0–1)</span>
              </div>
            </label>
          </div>
          @if (loiValidation()['diem.trong_so']) {
            <p class="loi-truong" role="alert">{{ loiValidation()['diem.trong_so'] }}</p>
          }
        </section>

        <section class="the" aria-labelledby="bang-quy-doi-title">
          <div class="dau-the">
            <div>
              <h2 id="bang-quy-doi-title">Bảng quy đổi điểm</h2>
              <p>Các khoảng phải phủ liên tục từ 0 đến 10, không chồng lấn hoặc để trống.</p>
            </div>
            <app-button variant="secondary" size="sm" type="button" (click)="themKhoang()">
              Thêm khoảng
            </app-button>
          </div>

          <div class="bang-bao">
            <table>
              <thead>
                <tr>
                  <th scope="col">Từ</th>
                  <th scope="col">Đến</th>
                  <th scope="col">Điểm chữ</th>
                  <th scope="col">Hệ 4</th>
                  <th scope="col">Kết quả</th>
                  <th scope="col"><span class="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <tbody>
                @for (khoang of config['diem.bang_quy_doi']; track $index; let i = $index) {
                  <tr>
                    <td>
                      <input
                        aria-label="Điểm bắt đầu"
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        [value]="khoang.tu"
                        (input)="doiKhoang(i, 'tu', $event)"
                      />
                    </td>
                    <td>
                      <input
                        aria-label="Điểm kết thúc"
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        [value]="khoang.den"
                        (input)="doiKhoang(i, 'den', $event)"
                      />
                    </td>
                    <td>
                      <select
                        aria-label="Điểm chữ"
                        [value]="khoang.chu"
                        (change)="doiKhoang(i, 'chu', $event)"
                      >
                        @for (chu of cacDiemChu; track chu) {
                          <option [value]="chu">{{ chu }}</option>
                        }
                      </select>
                    </td>
                    <td>
                      <input
                        aria-label="Điểm hệ 4"
                        type="number"
                        min="0"
                        max="4"
                        step="0.1"
                        [value]="khoang.he_4"
                        (input)="doiKhoang(i, 'he_4', $event)"
                      />
                    </td>
                    <td>
                      <select
                        aria-label="Kết quả đạt"
                        [value]="khoang.dat ? 'true' : 'false'"
                        (change)="doiKhoang(i, 'dat', $event)"
                      >
                        <option value="true">Đạt</option>
                        <option value="false">Không đạt</option>
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        class="nut-hanh-dong"
                        [attr.aria-label]="'Xóa khoảng điểm ' + (i + 1)"
                        (click)="xoaKhoang(i)"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (loiValidation()['diem.bang_quy_doi']) {
            <p class="loi-truong" role="alert">{{ loiValidation()['diem.bang_quy_doi'] }}</p>
          }
        </section>

        <section class="the" aria-labelledby="so-ngay-title">
          <div class="dau-the">
            <div>
              <h2 id="so-ngay-title">Thời hạn sửa điểm danh</h2>
              <p>Số ngày tối đa sau buổi học mà giảng viên được chỉnh sửa điểm danh.</p>
            </div>
          </div>
          <label class="truong so-ngay">
            <span>Số ngày cho phép</span>
            <div class="don-vi">
              <input
                type="number"
                min="0"
                step="1"
                [value]="config['diem.diem_danh.sua_trong_so_ngay']"
                (input)="doiSoNgay($event)"
              />
              <span>ngày</span>
            </div>
          </label>
          @if (loiValidation()['diem.diem_danh.sua_trong_so_ngay']) {
            <p class="loi-truong" role="alert">
              {{ loiValidation()['diem.diem_danh.sua_trong_so_ngay'] }}
            </p>
          }
        </section>

        <div class="hanh-dong">
          <app-button type="submit" [loading]="dangLuu()">Lưu cấu hình</app-button>
        </div>
      </form>
    }
  `,
  styles: `
    :host {
      display: block;
      max-width: 1080px;
      margin: 0 auto;
    }
    .noi-dung {
      display: grid;
      gap: 16px;
    }
    .the {
      display: grid;
      gap: 16px;
      padding: 18px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
    }
    .dau-the {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    .dau-the h2 {
      margin: 0;
      font-size: var(--text-h3);
    }
    .dau-the p {
      margin: 5px 0 0;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
    }
    .tong-trong-so {
      flex: 0 0 auto;
      padding: 5px 9px;
      border-radius: var(--radius);
      background: var(--color-success-soft);
      color: var(--color-success);
      font-size: var(--text-small);
      font-weight: 700;
    }
    .tong-trong-so.khong-hop-le {
      background: var(--color-danger-soft);
      color: var(--color-danger);
    }
    .luoi-trong-so {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }
    .truong {
      display: grid;
      gap: 6px;
      color: var(--color-ink);
      font-size: var(--text-small);
    }
    .don-vi {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    input,
    select {
      min-width: 0;
      width: 100%;
      padding: 8px 10px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      color: var(--color-ink);
      background: var(--color-surface);
      font: inherit;
    }
    input:focus,
    select:focus {
      outline: 3px solid var(--color-primary-soft);
      border-color: var(--color-primary);
    }
    .don-vi span {
      flex: 0 0 auto;
      color: var(--color-ink-muted);
    }
    .bang-bao {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th,
    td {
      padding: 8px;
      border-bottom: 1px solid var(--color-border);
      text-align: left;
    }
    th {
      color: var(--color-ink-muted);
      font-size: var(--text-small);
      font-weight: 600;
    }
    td input,
    td select {
      min-width: 86px;
    }
    .nut-thu-lai {
      border: 0;
      background: none;
      color: var(--color-danger);
      cursor: pointer;
      font: inherit;
    }
    .nut-hanh-dong {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 32px;
      padding: 5px 9px;
      border: 1px solid var(--color-danger);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-danger);
      cursor: pointer;
      font: inherit;
      font-size: var(--text-caption);
      font-weight: 600;
      white-space: nowrap;
    }
    .nut-hanh-dong:hover {
      background: var(--color-danger-soft);
    }
    .nut-hanh-dong:focus-visible {
      outline: 2px solid var(--color-danger);
      outline-offset: 2px;
    }
    .loi-truong {
      margin: 0;
      color: var(--color-danger);
      font-size: var(--text-small);
    }
    .so-ngay {
      max-width: 340px;
    }
    .hanh-dong {
      display: flex;
      justify-content: flex-end;
    }
    .dang-tai {
      padding: 24px;
      color: var(--color-ink-muted);
      text-align: center;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    @media (max-width: 700px) {
      .luoi-trong-so {
        grid-template-columns: 1fr;
      }
      .dau-the {
        flex-direction: column;
      }
      .the {
        padding: 14px;
      }
    }
  `,
})
export class CauHinhPage {
  private readonly service = inject(CauHinhService);

  readonly cacDiemChu = ['A', 'B', 'C', 'D', 'F'] as const;
  readonly cauHinh = signal<CauHinhDiem | null>(null);
  readonly dangTai = signal(true);
  readonly dangLuu = signal(false);
  readonly daGui = signal(false);
  readonly loiTai = signal<string | null>(null);
  readonly loiLuu = signal<string | null>(null);
  readonly thongBao = signal<{ muc: 'success' | 'danger'; noiDung: string } | null>(null);
  readonly loiValidation = computed(() => {
    const config = this.cauHinh();
    return config && this.daGui() ? kiemTraCauHinhDiem(config) : {};
  });
  readonly tongTrongSo = computed(() => {
    const trongSo = this.cauHinh()?.['diem.trong_so'];
    return trongSo ? trongSo.chuyen_can + trongSo.giua_ky + trongSo.cuoi_ky : 0;
  });
  readonly tongTrongSoHopLe = computed(
    () => Number.isFinite(this.tongTrongSo()) && Math.abs(this.tongTrongSo() - 1) <= 0.00001,
  );

  constructor() {
    this.tai();
  }

  tai(): void {
    this.dangTai.set(true);
    this.loiTai.set(null);
    this.service.lay().subscribe({
      next: (raw) => {
        const weights = raw['diem.trong_so'];
        const ranges = raw['diem.bang_quy_doi'];
        const days = raw['diem.diem_danh.sua_trong_so_ngay'];
        if (
          !laTrongSoDiem(weights) ||
          !Array.isArray(ranges) ||
          !ranges.every(laKhoangQuyDoiDiem) ||
          typeof days !== 'number'
        ) {
          this.loiTai.set('Cấu hình từ máy chủ thiếu khóa bắt buộc hoặc không đúng định dạng.');
          this.dangTai.set(false);
          return;
        }
        this.cauHinh.set({
          'diem.trong_so': { ...weights },
          'diem.bang_quy_doi': ranges.map((range) => ({ ...range })),
          'diem.diem_danh.sua_trong_so_ngay': days,
        });
        this.dangTai.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loiTai.set(error.error?.message ?? 'Không tải được cấu hình.');
        this.dangTai.set(false);
      },
    });
  }

  doiTrongSo(khoa: KhoaTrongSo, event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.capNhat((config) => ({
      ...config,
      'diem.trong_so': { ...config['diem.trong_so'], [khoa]: this.soNhap(raw) },
    }));
  }

  doiKhoang(index: number, khoa: KhoaKhoang, event: Event): void {
    const raw = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.capNhat((config) => ({
      ...config,
      'diem.bang_quy_doi': config['diem.bang_quy_doi'].map((range, viTri) =>
        viTri === index ? { ...range, [khoa]: this.giaTriKhoang(khoa, raw) } : range,
      ),
    }));
  }

  doiSoNgay(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.capNhat((config) => ({
      ...config,
      'diem.diem_danh.sua_trong_so_ngay': this.soNhap(raw),
    }));
  }

  themKhoang(): void {
    this.capNhat((config) => ({
      ...config,
      'diem.bang_quy_doi': [
        ...config['diem.bang_quy_doi'],
        { tu: 0, den: 10, chu: 'F', he_4: 0, dat: false },
      ],
    }));
  }

  xoaKhoang(index: number): void {
    this.capNhat((config) => ({
      ...config,
      'diem.bang_quy_doi': config['diem.bang_quy_doi'].filter((_, viTri) => viTri !== index),
    }));
  }

  luu(event: Event): void {
    event.preventDefault();
    this.daGui.set(true);
    this.loiLuu.set(null);
    this.thongBao.set(null);
    const config = this.cauHinh();
    if (!config) return;
    if (Object.keys(kiemTraCauHinhDiem(config)).length > 0) return;

    this.dangLuu.set(true);
    this.service.capNhat(config).subscribe({
      next: (updated) => {
        const nextWeights = updated['diem.trong_so'];
        const nextRanges = updated['diem.bang_quy_doi'];
        const nextDays = updated['diem.diem_danh.sua_trong_so_ngay'];
        if (
          !laTrongSoDiem(nextWeights) ||
          !Array.isArray(nextRanges) ||
          !nextRanges.every(laKhoangQuyDoiDiem) ||
          typeof nextDays !== 'number'
        ) {
          this.loiLuu.set('Máy chủ đã trả cấu hình thiếu khóa bắt buộc hoặc không đúng định dạng.');
          this.dangLuu.set(false);
          return;
        }
        this.cauHinh.set({
          'diem.trong_so': { ...nextWeights },
          'diem.bang_quy_doi': nextRanges.map((range) => ({ ...range })),
          'diem.diem_danh.sua_trong_so_ngay': nextDays,
        });
        this.dangLuu.set(false);
        this.daGui.set(false);
        this.thongBao.set({ muc: 'success', noiDung: 'Đã lưu cấu hình.' });
      },
      error: (error: HttpErrorResponse) => {
        this.loiLuu.set(error.error?.message ?? 'Không lưu được cấu hình.');
        this.dangLuu.set(false);
      },
    });
  }

  private capNhat(chinhSua: (config: CauHinhDiem) => CauHinhDiem): void {
    this.thongBao.set(null);
    this.loiLuu.set(null);
    this.cauHinh.update((config) => (config ? chinhSua(config) : config));
  }

  private soNhap(raw: string): number {
    return raw === '' ? Number.NaN : Number(raw);
  }

  private giaTriKhoang(khoa: KhoaKhoang, raw: string): number | string | boolean {
    if (khoa === 'chu') return raw;
    if (khoa === 'dat') return raw === 'true';
    return this.soNhap(raw);
  }
}
