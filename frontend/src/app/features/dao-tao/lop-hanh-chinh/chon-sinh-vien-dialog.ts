import {
  Component,
  ElementRef,
  HostListener,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { SinhVien } from '@core/models/dao-tao.model';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';

@Component({
  selector: 'app-chon-sinh-vien-dialog',
  standalone: true,
  imports: [AppAlert, AppButton],
  template: `
    <div class="lop-phu" (click)="dong.emit()">
      <section
        class="hop-thoai"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tieu-de-hop-gan"
        (click)="$event.stopPropagation()"
      >
        <div class="dau-hop">
          <div>
            <span class="nhan-muc">QUẢN LÝ THÀNH VIÊN</span>
            <h2 id="tieu-de-hop-gan">Gán sinh viên vào lớp</h2>
            <p>Tìm sinh viên theo mã, họ tên hoặc email.</p>
          </div>
          <button type="button" class="nut-dong" aria-label="Đóng" (click)="dong.emit()">
            <span class="material-icons" aria-hidden="true">close</span>
          </button>
        </div>

        <label class="tim-sv">
          <span class="material-icons" aria-hidden="true">search</span>
          <span class="visually-hidden">Tìm sinh viên</span>
          <input
            #oTimKiem
            type="search"
            placeholder="Nhập mã, họ tên hoặc email…"
            [value]="tuKhoa()"
            (input)="doiTuKhoa($event)"
          />
        </label>

        @if (loiTimKiem()) {
          <app-alert muc="danger">{{ loiTimKiem() }}</app-alert>
        }
        @if (loiGan()) {
          <app-alert muc="danger" title="Chưa thể gán sinh viên">{{ loiGan() }}</app-alert>
        }

        <div class="ket-qua">
          @if (dangTim()) {
            <div class="dang-tai" role="status" aria-live="polite">Đang tìm sinh viên…</div>
          } @else if (ketQua().length === 0) {
            <div class="rong-tim">
              @if (tuKhoa().trim()) {
                Không tìm thấy sinh viên phù hợp chưa thuộc lớp này.
              } @else {
                Không còn sinh viên để gán trong danh sách.
              }
            </div>
          } @else {
            <div class="danh-sach-chon">
              @for (sv of ketQua(); track sv.id) {
                <label class="dong-chon">
                  <input
                    type="checkbox"
                    [checked]="daChonId(sv.id)"
                    (change)="doiChon(sv, $event)"
                  />
                  <span class="thong-tin-chon">
                    <strong>{{ sv.ho_ten }}</strong>
                    <span>{{ sv.ma_sv }} · {{ sv.email }}</span>
                    @if (sv.lop_hanh_chinh) {
                      <small>Hiện thuộc {{ sv.lop_hanh_chinh.ma_lop }} · sẽ chuyển lớp</small>
                    } @else {
                      <small>Chưa được xếp lớp</small>
                    }
                  </span>
                </label>
              }
            </div>
          }
        </div>

        @if (daChon().length) {
          <p class="dem-da-chon" aria-live="polite">
            Đã chọn {{ daChon().length }} sinh viên
            @if (soSinhVienChuyen()) {
              · {{ soSinhVienChuyen() }} sinh viên sẽ được chuyển từ lớp khác
            }
          </p>
        }

        <div class="hanh-dong-hop">
          <app-button variant="secondary" [disabled]="dangCapNhat()" (click)="dong.emit()">
            Hủy
          </app-button>
          <app-button
            [disabled]="!daChon().length"
            [loading]="dangCapNhat()"
            (click)="xacNhanGan.emit()"
          >
            Gán {{ daChon().length ? '(' + daChon().length + ')' : '' }}
          </app-button>
        </div>
      </section>
    </div>
  `,
  styles: `
    .lop-phu {
      position: fixed;
      z-index: 1000;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 20px;
      background: rgb(16 24 40 / 48%);
    }

    .hop-thoai {
      display: flex;
      width: min(100%, 580px);
      max-height: min(780px, calc(100dvh - 40px));
      flex-direction: column;
      padding: 22px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
    }

    .dau-hop {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    .nhan-muc {
      color: var(--color-primary);
      font-size: var(--text-caption);
      font-weight: 700;
      letter-spacing: 0.08em;
    }

    .dau-hop h2 {
      margin-top: 5px;
      color: var(--color-ink);
      font-size: var(--text-h2);
      font-weight: 650;
    }

    .dau-hop p {
      margin: 6px 0 0;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
      line-height: 1.55;
    }

    .nut-dong {
      display: grid;
      width: 36px;
      height: 36px;
      flex: none;
      place-items: center;
      border: 0;
      border-radius: var(--radius);
      background: transparent;
      color: var(--color-ink-muted);
      cursor: pointer;
    }

    .nut-dong:hover {
      background: var(--color-surface-alt);
    }

    .nut-dong:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .tim-sv {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 42px;
      padding: 0 11px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      color: var(--color-ink-subtle);
    }

    .tim-sv:focus-within {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    .tim-sv .material-icons {
      font-size: 19px;
    }

    .tim-sv input {
      width: 100%;
      min-width: 0;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--color-ink);
      font: 400 var(--text-small) var(--font-body);
    }

    .ket-qua {
      min-height: 120px;
      margin-top: 12px;
      overflow-y: auto;
    }

    .danh-sach-chon {
      display: grid;
      gap: 2px;
    }

    .dong-chon {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 11px 9px;
      border-bottom: 1px solid var(--color-border);
      cursor: pointer;
    }

    .dong-chon:hover {
      border-radius: var(--radius);
      background: var(--color-surface-alt);
    }

    .dong-chon input {
      width: 17px;
      height: 17px;
      flex: none;
      margin: 2px 0 0;
      accent-color: var(--color-primary);
    }

    .thong-tin-chon {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: 3px;
    }

    .thong-tin-chon strong {
      color: var(--color-ink);
      font-size: var(--text-small);
    }

    .thong-tin-chon span,
    .thong-tin-chon small {
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
      overflow-wrap: anywhere;
    }

    .thong-tin-chon small {
      color: var(--color-primary);
    }

    .dem-da-chon {
      margin: 12px 0 0;
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }

    .hanh-dong-hop {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 16px;
      margin-top: 12px;
      border-top: 1px solid var(--color-border);
    }

    .dang-tai,
    .rong-tim {
      padding: 30px 16px;
      color: var(--color-ink-muted);
      text-align: center;
      font-size: var(--text-small);
    }

    .visually-hidden {
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

    @media (max-width: 680px) {
      .lop-phu {
        padding: 10px;
      }

      .hop-thoai {
        max-height: calc(100dvh - 20px);
        padding: 18px 15px;
      }

      .hanh-dong-hop app-button {
        flex: 1;
      }

      .hanh-dong-hop app-button button {
        width: 100%;
      }
    }
  `,
})
export class ChonSinhVienDialog {
  private readonly oTimKiem = viewChild.required<ElementRef<HTMLInputElement>>('oTimKiem');

  readonly ketQua = input.required<SinhVien[]>();
  readonly daChon = input.required<SinhVien[]>();
  readonly tuKhoa = input('');
  readonly dangTim = input(false);
  readonly dangCapNhat = input(false);
  readonly loiTimKiem = input('');
  readonly loiGan = input('');
  readonly soSinhVienChuyen = input(0);

  readonly dong = output<void>();
  readonly tuKhoaThayDoi = output<string>();
  readonly chonSinhVien = output<{ sinhVien: SinhVien; daChon: boolean }>();
  readonly xacNhanGan = output<void>();

  constructor() {
    afterNextRender(() => this.oTimKiem().nativeElement.focus());
  }

  @HostListener('document:keydown', ['$event'])
  dongBangEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.dong.emit();
  }

  daChonId(id: number): boolean {
    return this.daChon().some((sv) => sv.id === id);
  }

  doiTuKhoa(event: Event): void {
    this.tuKhoaThayDoi.emit((event.target as HTMLInputElement).value);
  }

  doiChon(sv: SinhVien, event: Event): void {
    this.chonSinhVien.emit({
      sinhVien: sv,
      daChon: (event.target as HTMLInputElement).checked,
    });
  }
}
