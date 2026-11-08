import { HttpErrorResponse } from '@angular/common/http';
import { Component, input } from '@angular/core';

/**
 * Một dòng xung đột lịch backend trả trong `errors.trung_lich` khi 409
 * `SCHEDULE_CONFLICT` (docs/04-api-contract.md).
 *
 * `loai` quyết định cách hiển thị, không phải cách lọc — dữ liệu nào có thì
 * hiện nấy, vì backend trả các loại xung đột khác nhau tuỳ endpoint:
 * - `buoi_hoc`  — buổi học của sinh viên trùng buổi của lớp khác (có `ma_sv`)
 * - `lich_thi`  — trùng ca thi
 * - `phong_hoc` — trùng phòng, không gắn với sinh viên (có `doi_tuong` = mã phòng,
 *                 kèm `mon_hoc` của ca thi đã chiếm phòng)
 *
 * Backend dùng HAI tên trường ngày: `ngay` khi xung đột theo sinh viên và
 * `ngay_hoc`/`ngay_thi` khi xung đột theo phòng — nên đọc lần lượt cả ba.
 */
export interface DongXungDot {
  sinh_vien_id?: number;
  ma_sv?: string;
  ho_ten?: string;
  ma_lop_hp?: string;
  ngay?: string;
  ngay_hoc?: string;
  ngay_thi?: string;
  gio_bat_dau?: string;
  gio_ket_thuc?: string;
  /**
   * Loại xung đột. Backend dùng 5 giá trị (docs/04 §Xung đột lịch):
   * `phong_hoc`, `buoi_hoc`, `lich_thi` khi xếp ca thi; `sinh_vien`,
   * `giang_vien` khi xếp buổi học. Xem `doiTuong()` để biết ý nghĩa `doi_tuong`.
   */
  loai?: 'buoi_hoc' | 'lich_thi' | 'phong_hoc' | 'sinh_vien' | 'giang_vien' | string;
  /** Ý nghĩa phụ thuộc `loai`: mã phòng / mã môn / mã GV / mã SV. */
  doi_tuong?: string;
  /** Tên môn của ca thi đang chiếm phòng (chỉ có ở xung đột phòng). */
  mon_hoc?: string | null;
  lich_thi_id?: number;
  buoi_hoc_id?: number;
  /** Chỉ có ở xung đột trong chính lô sinh lịch: dòng nào đụng dòng nào. */
  dong?: number;
  trung_voi_dong?: number;
}

export interface XungDotLich {
  thongDiep: string;
  dong: DongXungDot[];
  /** Tổng số vi phạm backend đếm được — có thể lớn hơn `dong.length`. */
  tongSo: number;
  /** Số vi phạm không có trong danh sách trả về. */
  conLai: number;
}

/**
 * Đọc lỗi 409 thành cấu trúc để hiển thị.
 *
 * Trả `null` khi lỗi KHÔNG phải trùng lịch — nơi gọi dùng để quyết định hiện
 * khối xung đột hay chỉ hiện một câu thông báo chung.
 *
 * Vì sao phải đọc `errors.trung_lich` thay vì `message`: `message` chỉ nói
 * "trùng lịch của 12 sinh viên", người dùng cần biết TRÙNG VỚI AI, LÚC NÀO để
 * quyết định đổi giờ hay đổi phòng. Một câu chung không đủ hành động.
 */
export function docXungDotLich(error: unknown): XungDotLich | null {
  const than = error instanceof HttpErrorResponse ? error.error : error;
  if (!than || typeof than !== 'object') return null;

  const goi = than as {
    ma_loi?: string;
    message?: string;
    errors?: { trung_lich?: unknown; tong_so_vi_pham?: unknown } | null;
  };
  if (goi.ma_loi !== 'SCHEDULE_CONFLICT') return null;

  const tho = Array.isArray(goi.errors?.trung_lich) ? (goi.errors!.trung_lich as unknown[]) : [];
  const dong = tho
    .filter((item): item is DongXungDot => !!item && typeof item === 'object')
    .map((item) => item as DongXungDot);
  const tongSo = Number(goi.errors?.tong_so_vi_pham ?? dong.length) || dong.length;

  return {
    thongDiep: goi.message ?? 'Ca bị trùng lịch với lịch đã có.',
    dong,
    tongSo,
    conLai: Math.max(0, tongSo - dong.length),
  };
}

/**
 * Khối hiển thị danh sách xung đột lịch — dùng chung cho form ca thi và form
 * buổi học để hai màn không hiển thị cùng một lỗi theo hai kiểu.
 *
 * Bố cục: mỗi dòng hai hàng — hàng trên là ĐỐI TƯỢNG (sinh viên/lớp/phòng),
 * hàng dưới là THỜI GIAN. Người dùng quét theo đối tượng trước, rồi mới xem
 * giờ, nên tách hai hàng dễ đọc hơn một chuỗi dài.
 */
@Component({
  selector: 'app-xung-dot-lich',
  standalone: true,
  template: `
    <div class="khung" role="alert">
      <div class="dau">
        <span class="material-icons" aria-hidden="true">event_busy</span>
        <div>
          <strong>Trùng lịch — không lưu được</strong>
          <p>{{ duLieu().thongDiep }}</p>
        </div>
      </div>

      @if (duLieu().dong.length > 0) {
        <ul>
          @for (d of duLieu().dong; track $index) {
            <li>
              <span class="doi-tuong">{{ doiTuong(d) }}</span>
              <span class="thoi-gian">{{ thoiGian(d) }}</span>
            </li>
          }
        </ul>
        @if (duLieu().conLai > 0) {
          <p class="con-lai">… và {{ duLieu().conLai }} vi phạm khác.</p>
        }
      } @else {
        <p class="con-lai">Máy chủ không trả về chi tiết. Kiểm tra lại giờ và phòng.</p>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .khung {
      margin-top: 12px;
      padding: 12px 14px;
      border: 1px solid var(--color-danger);
      border-radius: var(--radius);
      background: var(--color-danger-soft);
      color: var(--color-on-danger-soft);
      font-size: var(--text-small);
    }
    .dau {
      display: flex;
      gap: 9px;
      align-items: flex-start;
    }
    .dau .material-icons {
      font-size: 19px;
      line-height: 1.2;
      flex: none;
    }
    .dau strong {
      display: block;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .dau p {
      margin: 0;
      opacity: 0.92;
      line-height: 1.5;
    }
    ul {
      margin: 10px 0 0;
      padding: 0;
      list-style: none;
      max-height: 240px;
      overflow-y: auto;
      /* Nền trắng để danh sách tách khỏi khối đỏ — 12 dòng cùng màu đỏ thì
         không đọc nổi. */
      background: var(--color-surface);
      border-radius: var(--radius-sm);
      color: var(--color-ink);
    }
    li {
      display: grid;
      gap: 1px;
      padding: 7px 10px;
      border-bottom: 1px solid var(--color-border-soft);
    }
    li:last-child {
      border-bottom: 0;
    }
    .doi-tuong {
      font-weight: 600;
      font-size: var(--text-small);
      overflow-wrap: anywhere;
    }
    .thoi-gian {
      font-size: var(--text-small);
      color: var(--color-ink-muted);
      font-variant-numeric: tabular-nums;
    }
    .con-lai {
      margin: 8px 0 0;
      font-size: var(--text-small);
      font-weight: 600;
    }
  `,
})
export class XungDotLichKhoi {
  readonly duLieu = input.required<XungDotLich>();

  /**
   * Dòng thứ nhất: ai / lớp nào / phòng nào bị trùng.
   *
   * `doi_tuong` KHÔNG đồng nghĩa "phòng" — nghĩa của nó đổi theo `loai`
   * (docs/04 §Xung đột lịch): mã phòng với `phong_hoc`, mã môn với `lich_thi`,
   * mã giảng viên với `giang_vien`, mã sinh viên với `sinh_vien`. Gắn cứng
   * nhãn "Phòng" sẽ ra "Phòng MH004".
   */
  doiTuong(d: DongXungDot): string {
    const ten = [d.ma_sv, d.ho_ten].filter(Boolean).join(' · ');
    const lop = d.ma_lop_hp ? `lớp ${d.ma_lop_hp}` : '';

    if (ten && lop) return `${ten} — ${lop}`;
    if (ten) return ten;
    if (lop) return lop;
    if (d.loai === 'phong_hoc') {
      const phong = d.doi_tuong ? `Phòng ${d.doi_tuong}` : 'Trùng phòng';
      return d.mon_hoc ? `${phong} — ${d.mon_hoc}` : phong;
    }
    if (d.loai === 'lich_thi' && d.doi_tuong) return `Môn ${d.doi_tuong}`;
    if (d.loai === 'giang_vien' && d.doi_tuong) return `Giảng viên ${d.doi_tuong}`;
    if (d.loai === 'sinh_vien' && d.doi_tuong) return `Sinh viên ${d.doi_tuong}`;
    return d.doi_tuong ?? 'Trùng lịch';
  }

  /** Dòng thứ hai: loại + ngày + khoảng giờ. */
  thoiGian(d: DongXungDot): string {
    const nhan =
      d.loai === 'phong_hoc'
        ? 'Ca thi đã có'
        : d.loai === 'lich_thi'
          ? 'Ca thi trùng giờ'
          : d.loai === 'giang_vien'
            ? 'Trùng giảng viên'
            : d.loai === 'sinh_vien'
              ? 'Trùng lớp đã đăng ký'
              : 'Buổi học';
    const ngay = this.sangVn(d.ngay ?? d.ngay_hoc ?? d.ngay_thi ?? '');
    const gio =
      d.gio_bat_dau && d.gio_ket_thuc ? `${d.gio_bat_dau}–${d.gio_ket_thuc}` : '';
    const dong =
      d.dong !== undefined && d.trung_voi_dong !== undefined
        ? `dòng ${d.dong + 1} ↔ dòng ${d.trung_voi_dong + 1}`
        : '';
    return [nhan, ngay, gio, dong].filter(Boolean).join(' · ');
  }

  /** Cùng quy ước dd/mm/yyyy với pipe `ngayVn` — chép 4 dòng rẻ hơn kéo pipe vào TS. */
  private sangVn(iso: string): string {
    if (!iso) return '';
    const [nam, thang, ngay] = iso.split(' ')[0].split('-');
    if (!nam || !thang || !ngay) return iso;
    return `${ngay}/${thang}/${nam}`;
  }
}

/** Danh sách import gọn cho hai màn dùng lại. */
export const XUNG_DOT_LICH_IMPORTS = [XungDotLichKhoi] as const;
