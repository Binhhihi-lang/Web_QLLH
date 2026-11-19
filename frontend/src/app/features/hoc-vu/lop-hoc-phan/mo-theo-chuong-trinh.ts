import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ChuongTrinhDaoTao, ChuongTrinhMon, ChuongTrinhService } from '@core/services/chuong-trinh.service';
import {
  CauHinhMonInput,
  DongLichMonInput,
  KetQuaMoLop,
  LopHocPhanService,
  MoLopTheoChuongTrinhInput,
  TuyChon,
} from '@core/services/lop-hoc-phan.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { PageHeader } from '@shared/ui/page-header';

export interface HocKyOption extends TuyChon {
  nam_hoc?: string;
  ky_thu?: number;
  trang_thai?: string;
}

interface CauHinhMonForm {
  mon_hoc_id: number;
  ma_lop_hp: string;
  giang_vien_id: number;
  si_so_toi_da: number;
  lich: DongLichMonInput[];
}

@Component({
  selector: 'app-mo-lop-theo-chuong-trinh',
  standalone: true,
  imports: [AppAlert, AppButton, FormsModule, PageHeader, RouterLink],
  template: `
    <app-page-header
      title="Mở lớp theo chương trình"
      description="Chọn học kỳ và chương trình — hệ thống tự động suy ra kỳ thứ, cho phép cấu hình chi tiết từng môn và mở hàng loạt lớp học phần."
    >
      <app-button variant="secondary" routerLink="/lop-hoc-phan">Về danh sách lớp</app-button>
    </app-page-header>

    @if (loi()) {
      <app-alert muc="danger">{{ loi() }}</app-alert>
    }
    @if (ketQua(); as kq) {
      <app-alert [muc]="kq.tao > 0 ? 'success' : 'info'">
        Đã mở {{ kq.tao }} lớp, bỏ qua {{ kq.bo_qua }} môn đã có lớp.
      </app-alert>
      @if (kq.chi_tiet.length > 0) {
        <div class="bang-cuon">
          <table>
            <thead>
              <tr>
                <th>Mã môn</th>
                <th>Tên môn</th>
                <th>Loại môn</th>
                <th>Kết quả</th>
                <th>Mã lớp / lý do</th>
              </tr>
            </thead>
            <tbody>
              @for (dong of kq.chi_tiet; track dong.ma_mon) {
                <tr>
                  <td class="mono font-bold">{{ dong.ma_mon }}</td>
                  <td>{{ dong.ten_mon }}</td>
                  <td>
                    <span class="nhan-loai" [class.nhan-loai--bat-buoc]="dong.bat_buoc">
                      {{ dong.bat_buoc ? 'Bắt buộc' : 'Tự chọn' }}
                    </span>
                  </td>
                  <td>
                    <span class="pill" [class.pill--ok]="dong.ket_qua === 'THANH_CONG'" [class.pill--off]="dong.ket_qua === 'BO_QUA'">
                      {{ dong.ket_qua === 'THANH_CONG' ? 'Đã mở' : 'Bỏ qua' }}
                    </span>
                  </td>
                  <td class="mono phu">{{ dong.ma_lop_hp ?? dong.ly_do ?? '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    }

    <form class="khung" (ngSubmit)="moLop()">
      <h3>1. Chọn học kỳ và chương trình đào tạo</h3>

      <div class="luoi-dau">
        <label>
          <span>Học kỳ *</span>
          <select name="hoc-ky" [(ngModel)]="mau.hoc_ky_id" (ngModelChange)="chonHocKy($event)" required>
            <option [ngValue]="0">Chọn học kỳ</option>
            @for (hk of dsHocKy(); track hk.id) {
              <option [ngValue]="hk.id">{{ hk.label }}</option>
            }
          </select>
        </label>

        <label>
          <span>Chương trình đào tạo *</span>
          <select name="ctdt" [(ngModel)]="mau.chuong_trinh_id" (ngModelChange)="chonChuongTrinh($event)" required>
            <option [ngValue]="0">Chọn chương trình</option>
            @for (ct of dsChuongTrinh(); track ct.id) {
              <option [ngValue]="ct.id">
                {{ ct.ma_ctdt }} · {{ ct.nganh?.ten_nganh ?? '—' }} · {{ ct.khoa_hoc }}
              </option>
            }
          </select>
        </label>
      </div>

      <!-- Trạng thái tự động hóa kỳ thứ & kiểm tra trường hợp biên -->
      @if (thongTinKyThu(); as tt) {
        <div class="hop-trang-thai" [class.hop-trang-thai--ok]="tt.loai === 'OK'" [class.hop-trang-thai--canh-bao]="tt.loai === 'GRADUATED' || tt.loai === 'SUMMER_SEMESTER'" [class.hop-trang-thai--loi]="tt.loai === 'NOT_YET_ADMITTED'">
          <span class="material-icons" aria-hidden="true">
            {{ tt.loai === 'OK' ? 'auto_awesome' : tt.loai === 'GRADUATED' ? 'school' : tt.loai === 'SUMMER_SEMESTER' ? 'wb_sunny' : 'error_outline' }}
          </span>
          <div class="noi-dung-tt">
            <strong>{{ tt.tieuDe }}</strong>
            <p>{{ tt.thongBao }}</p>
            @if (tt.loai === 'SUMMER_SEMESTER') {
              <app-button variant="secondary" size="sm" routerLink="/lop-hoc-phan/them">
                Mở lớp lẻ (nguyện vọng LOPNV)
              </app-button>
            }
          </div>
        </div>
      }

      @if (chuongTrinhDangChon(); as ct) {
        <div class="goi-y">
          <strong>{{ ct.ten }}</strong>
          <span class="phu">
            {{ ct.so_nam ?? 4 }} năm ({{ ct.so_ky ?? 8 }} kỳ) · {{ ct.tong_tin_chi }} tín chỉ · {{ ct.sinh_vien_ap_dung }} sinh viên áp dụng
          </span>
          @if (ct.so_mon_chua_gan_ky > 0) {
            <span class="canh-bao">
              {{ ct.so_mon_chua_gan_ky }} môn chưa gán kỳ — không mở được cho tới khi gán kỳ thứ.
            </span>
          }
        </div>
      }

      <!-- Danh sách môn học của kỳ thứ tương ứng & Thiết lập chi tiết từng môn -->
      @if (monXemTruoc().length > 0) {
        <div class="khung-xem-truoc">
          <div class="tieu-de-xem-truoc">
            <div>
              <h4>2. Danh sách môn học dự kiến mở (Kỳ thứ {{ mau.ky_thu }})</h4>
              <p class="mo-ta-bang">Nhấp vào môn học hoặc nút "Thiết lập" để phân công Giảng viên, Sĩ số, Phòng học và Lịch học cho từng môn.</p>
            </div>
            <span class="phu">{{ monXemTruoc().length }} môn · {{ tongTinChiXemTruoc() }} tín chỉ</span>
          </div>

          <div class="bang-cuon">
            <table>
              <thead>
                <tr>
                  <th>Mã lớp học phần</th>
                  <th>Mã môn</th>
                  <th>Tên môn</th>
                  <th>Số TC</th>
                  <th>Loại</th>
                  <th>Giảng viên</th>
                  <th>Lịch & Phòng</th>
                  <th class="can-phai">Sĩ số</th>
                  <th>Trạng thái</th>
                  <th class="can-phai">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                @for (m of monXemTruoc(); track m.id) {
                  <tr class="dong-mon" (click)="moThietLapMon(m)">
                    <td class="mono">{{ layMaLopMon(m.mon_hoc.id) }}</td>
                    <td class="mono font-bold">{{ m.mon_hoc.ma_mon }}</td>
                    <td><strong>{{ m.mon_hoc.ten_mon }}</strong></td>
                    <td>{{ m.mon_hoc.so_tin_chi }}</td>
                    <td>
                      <span class="nhan-loai" [class.nhan-loai--bat-buoc]="m.bat_buoc">
                        {{ m.bat_buoc ? 'Bắt buộc' : 'Tự chọn' }}
                      </span>
                    </td>
                    <td>
                      <span class="ten-gv">{{ moTaGiangVien(m.mon_hoc.id) }}</span>
                    </td>
                    <td>
                      <span class="mo-ta-lich">{{ moTaLich(m.mon_hoc.id) }}</span>
                    </td>
                    <td class="can-phai font-bold">
                      {{ laySiSoMon(m.mon_hoc.id) }}
                    </td>
                    <td>
                      @if (daThietLap(m.mon_hoc.id)) {
                        <span class="pill pill--ok">Đã thiết lập</span>
                      } @else {
                        <span class="pill pill--off">Cần nhập mã và sĩ số</span>
                      }
                    </td>
                    <td class="can-phai">
                      <button
                        type="button"
                        class="nut-thiet-lap"
                        (click)="$event.stopPropagation(); moThietLapMon(m)"
                      >
                        <span class="material-icons" aria-hidden="true">settings</span>
                        Thiết lập
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <div class="luoi">
        @if (choPhepChinhKyThu()) {
          <label>
            <span>Kỳ thứ CTĐT (chỉnh sửa thủ công)</span>
            <select name="ky-thu" [(ngModel)]="mau.ky_thu" (ngModelChange)="doiKyThuThuCong($event)">
              @for (k of dsKyThu(); track k) {
                <option [ngValue]="k">Kỳ {{ k }}</option>
              }
            </select>
          </label>
        }
      </div>

      <div class="tuy-chon-phu">
        <label class="nhan-checkbox">
          <input type="checkbox" [checked]="choPhepChinhKyThu()" (change)="choPhepChinhKyThu.set(!choPhepChinhKyThu())" />
          <span>Tùy chỉnh kỳ thứ thủ công (nếu muốn mở môn ngoài tiến độ tự động)</span>
        </label>
      </div>

      <p class="hint">
        Mã lớp được gợi ý theo lớp hành chính và mã môn; quản trị có thể sửa từng mã trước khi mở lớp.
        Nhập sĩ số riêng cho từng lớp trong phần thiết lập môn.
        Môn nào đã có lớp trong học kỳ này sẽ được tự động bỏ qua (idempotent), không nhân đôi lớp.
      </p>

      <div class="nut">
        <app-button
          variant="primary"
          type="submit"
          [disabled]="dangGui() || !hopLe() || !coTheMo()"
        >
          {{ dangGui() ? 'Đang mở lớp…' : 'Xác nhận mở lớp theo chương trình' }}
        </app-button>
      </div>
    </form>

    <!-- Modal / Drawer thiết lập chi tiết môn học giống mở lớp lẻ -->
    @if (monDangSua(); as mon) {
      <div class="lop-phu-modal" (click)="dongThietLapMon()">
        <div class="hop-modal" (click)="$event.stopPropagation()">
          <header class="dau-modal">
            <div>
              <h3>Thiết lập lớp học phần: {{ mon.mon_hoc.ten_mon }}</h3>
              <p class="phu-modal">Mã môn: <code>{{ mon.mon_hoc.ma_mon }}</code> · {{ mon.mon_hoc.so_tin_chi }} tín chỉ · {{ mon.bat_buoc ? 'Bắt buộc' : 'Tự chọn' }}</p>
            </div>
            <button type="button" class="nut-dong-modal" (click)="dongThietLapMon()" aria-label="Đóng">
              <span class="material-icons" aria-hidden="true">close</span>
            </button>
          </header>

          <div class="than-modal">
            <div class="hang-input">
              <label>
                <span>Mã lớp học phần *</span>
                <input type="text" maxlength="30" [(ngModel)]="formMon.ma_lop_hp" />
              </label>
              <label>
                <span>Sĩ số tối đa lớp này *</span>
                <input type="number" min="1" max="500" [(ngModel)]="formMon.si_so_toi_da" />
              </label>
              <label>
                <span>Giảng viên phụ trách môn</span>
                <select [(ngModel)]="formMon.giang_vien_id">
                  <option [ngValue]="0">Chưa phân công giảng viên</option>
                  @for (gv of dsGiangVien(); track gv.id) {
                    <option [ngValue]="gv.id">{{ gv.label }}</option>
                  }
                </select>
              </label>

            </div>

            <!-- Thiết lập thời khóa biểu và phòng học -->
            <fieldset class="khung-lich-modal">
              <legend>Lịch học & Phòng học</legend>
              <p class="goi-y-modal">Cấu hình thứ, tiết và phòng học cho lớp (có thể để trống nếu xếp lịch sau):</p>

              @for (d of formMon.lich; track $index; let i = $index) {
                <div class="dong-lich-modal">
                  <label>
                    <span>Thứ</span>
                    <select [(ngModel)]="d.thu">
                      <option [ngValue]="2">Thứ 2</option>
                      <option [ngValue]="3">Thứ 3</option>
                      <option [ngValue]="4">Thứ 4</option>
                      <option [ngValue]="5">Thứ 5</option>
                      <option [ngValue]="6">Thứ 6</option>
                      <option [ngValue]="7">Thứ 7</option>
                      <option [ngValue]="8">Chủ nhật</option>
                    </select>
                  </label>

                  <label>
                    <span>Từ tiết</span>
                    <select [(ngModel)]="d.tiet_bat_dau">
                      @for (t of dsTietHoc; track t) {
                        <option [ngValue]="t">Tiết {{ t }}</option>
                      }
                    </select>
                  </label>

                  <label>
                    <span>Đến tiết</span>
                    <select [(ngModel)]="d.tiet_ket_thuc">
                      @for (t of dsTietHoc; track t) {
                        <option [ngValue]="t">Tiết {{ t }}</option>
                      }
                    </select>
                  </label>

                  <label class="o-phong">
                    <span>Phòng học</span>
                    <select [(ngModel)]="d.phong_hoc_id">
                      <option [ngValue]="0">Chọn phòng học</option>
                      @for (p of dsPhongHoc(); track p.id) {
                        <option [ngValue]="p.id">{{ p.label }}</option>
                      }
                    </select>
                  </label>

                  <button type="button" class="nut-xoa-dong" (click)="xoaDongLich(i)" aria-label="Xóa dòng lịch">
                    <span class="material-icons" aria-hidden="true">delete</span>
                  </button>
                </div>
              }

              <button type="button" class="nut-them-dong" (click)="themDongLich()">
                <span class="material-icons" aria-hidden="true">add</span>
                Thêm buổi học trong tuần
              </button>
            </fieldset>
          </div>

          <footer class="chan-modal">
            <app-button variant="secondary" (click)="dongThietLapMon()">Hủy</app-button>
            <app-button variant="primary" (click)="luuThietLapMon()">Lưu thiết lập môn</app-button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: `
    :host { display: block; }
    .khung {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      padding: 24px;
      display: grid;
      gap: 20px;
    }
    .khung h3 { margin: 0; font-size: var(--text-h3); font-weight: 700; color: var(--color-ink); }
    .luoi-dau { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .luoi { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
    label { display: grid; gap: 6px; font-size: var(--text-small); font-weight: 600; color: var(--color-ink); }
    select, input[type="number"], input[type="text"] {
      font-family: inherit;
      font-size: var(--text-small);
      padding: 9px 12px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-ink);
    }
    select:focus, input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }
    .hop-trang-thai {
      display: flex;
      gap: 12px;
      padding: 14px 16px;
      border-radius: var(--radius);
      border: 1px solid var(--color-border);
      background: var(--color-surface-alt);
    }
    .hop-trang-thai--ok {
      border-color: var(--color-success);
      background: var(--color-success-soft);
      color: var(--color-on-success-soft);
    }
    .hop-trang-thai--canh-bao {
      border-color: var(--color-warning);
      background: var(--color-warning-soft);
      color: var(--color-on-warning-soft);
    }
    .hop-trang-thai--loi {
      border-color: var(--color-danger);
      background: var(--color-danger-soft);
      color: var(--color-on-danger-soft);
    }
    .noi-dung-tt strong { display: block; margin-bottom: 4px; }
    .noi-dung-tt p { margin: 0 0 8px; font-size: var(--text-small); }
    .goi-y {
      padding: 12px 16px;
      border-radius: var(--radius);
      background: var(--color-surface-alt);
      font-size: var(--text-small);
      display: grid;
      gap: 4px;
    }
    .canh-bao { color: var(--color-warning); font-weight: 600; }
    .khung-xem-truoc {
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      padding: 16px;
    }
    .tieu-de-xem-truoc {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      gap: 12px;
      flex-wrap: wrap;
    }
    .tieu-de-xem-truoc h4 { margin: 0 0 4px; font-size: var(--text-base); font-weight: 700; color: var(--color-ink); }
    .mo-ta-bang { margin: 0; font-size: var(--text-caption); color: var(--color-ink-muted); }
    .dong-mon { cursor: pointer; transition: background 0.15s ease; }
    .dong-mon:hover { background: var(--color-surface-alt); }
    .ten-gv { font-weight: 500; color: var(--color-ink); }
    .mo-ta-lich { font-size: var(--text-caption); color: var(--color-ink-muted); }
    .nut-thiet-lap {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 4px 8px;
      font-size: var(--text-caption);
      font-weight: 600;
      color: var(--color-primary);
      cursor: pointer;
    }
    .nut-thiet-lap:hover {
      background: var(--color-primary-soft);
    }
    .tuy-chon-phu { font-size: var(--text-small); }
    .nhan-checkbox { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
    .nhan-loai {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: var(--text-caption);
      font-weight: 600;
      background: var(--color-surface);
      color: var(--color-ink-muted);
    }
    .nhan-loai--bat-buoc {
      background: var(--color-primary-soft);
      color: var(--color-primary);
    }
    .hint { margin: 0; font-size: var(--text-caption); color: var(--color-ink-muted); }
    .nut { display: flex; justify-content: flex-end; }
    .bang-cuon { overflow-x: auto; border: 1px solid var(--color-border); border-radius: var(--radius); margin-bottom: 14px; background: var(--color-surface); }
    table { width: 100%; border-collapse: collapse; font-size: var(--text-small); }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--color-border-soft); white-space: nowrap; }
    th { font-size: var(--text-caption); text-transform: uppercase; letter-spacing: .04em; color: var(--color-ink-muted); }
    .can-phai { text-align: right; }
    .mono { font-family: var(--font-mono, ui-monospace, monospace); }
    .phu { color: var(--color-ink-muted); }
    .font-bold { font-weight: 700; }
    .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: var(--text-caption); font-weight: 600; }
    .pill--ok { background: var(--color-success-soft); color: var(--color-on-success-soft); }
    .pill--off { background: var(--color-surface-alt); color: var(--color-ink-muted); }

    /* ---- Modal thiết lập chi tiết môn ---- */
    .lop-phu-modal {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .hop-modal {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 680px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-lg);
      overflow: hidden;
    }
    .dau-modal {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px 20px;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-surface-alt);
    }
    .dau-modal h3 { margin: 0 0 4px; font-size: var(--text-h3); color: var(--color-ink); }
    .phu-modal { margin: 0; font-size: var(--text-caption); color: var(--color-ink-muted); }
    .nut-dong-modal {
      background: none;
      border: none;
      color: var(--color-ink-muted);
      cursor: pointer;
      display: flex;
      padding: 4px;
    }
    .than-modal { padding: 20px; overflow-y: auto; display: grid; gap: 16px; }
    .hang-input { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
    .khung-lich-modal {
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      padding: 14px;
      display: grid;
      gap: 12px;
    }
    .khung-lich-modal legend { font-weight: 700; font-size: var(--text-small); color: var(--color-ink); padding: 0 6px; }
    .goi-y-modal { margin: 0; font-size: var(--text-caption); color: var(--color-ink-muted); }
    .dong-lich-modal {
      display: grid;
      grid-template-columns: 100px 85px 85px 1fr 36px;
      gap: 8px;
      align-items: end;
      background: var(--color-surface-alt);
      padding: 8px 10px;
      border-radius: var(--radius-sm);
    }
    .dong-lich-modal label span { font-size: var(--text-caption); color: var(--color-ink-muted); }
    .dong-lich-modal select { padding: 6px 8px; font-size: var(--text-caption); }
    .nut-xoa-dong {
      background: none;
      border: none;
      color: var(--color-danger);
      cursor: pointer;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nut-them-dong {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: var(--color-surface);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius);
      color: var(--color-primary);
      font-size: var(--text-small);
      font-weight: 600;
      cursor: pointer;
      justify-content: center;
    }
    .nut-them-dong:hover { background: var(--color-primary-soft); border-style: solid; }
    .chan-modal {
      padding: 12px 20px;
      border-top: 1px solid var(--color-border);
      background: var(--color-surface-alt);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    @media (max-width: 640px) {
      .hang-input { grid-template-columns: 1fr; }
      .dong-lich-modal { grid-template-columns: 1fr 1fr; gap: 8px; }
    }
  `,
})
export class MoLopTheoChuongTrinh {
  private readonly chuongTrinh = inject(ChuongTrinhService);
  private readonly lopHocPhan = inject(LopHocPhanService);
  private readonly router = inject(Router);

  readonly dsChuongTrinh = signal<ChuongTrinhDaoTao[]>([]);
  readonly dsHocKy = signal<HocKyOption[]>([]);
  readonly dsGiangVien = signal<TuyChon[]>([]);
  readonly dsPhongHoc = signal<TuyChon[]>([]);
  readonly dsKyThu = signal<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  readonly dsTietHoc = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  readonly dangGui = signal(false);
  readonly loi = signal('');
  readonly ketQua = signal<KetQuaMoLop | null>(null);
  readonly choPhepChinhKyThu = signal(false);
  readonly chuongTrinhChiTiet = signal<ChuongTrinhDaoTao | null>(null);

  /** Map lưu cấu hình chi tiết cho từng môn: key là mon_hoc_id */
  readonly mapCauHinh = signal<Map<number, CauHinhMonForm>>(new Map());
  readonly monDangSua = signal<ChuongTrinhMon | null>(null);

  formMon: CauHinhMonForm = {
    mon_hoc_id: 0,
    ma_lop_hp: '',
    giang_vien_id: 0,
    si_so_toi_da: 0,
    lich: [],
  };

  readonly mau: MoLopTheoChuongTrinhInput = {
    chuong_trinh_id: 0,
    hoc_ky_id: 0,
    ky_thu: 1,
    cau_hinh_mon: [],
  };

  readonly chuongTrinhDangChon = computed(() =>
    this.dsChuongTrinh().find((ct) => ct.id === this.mau.chuong_trinh_id) ?? null,
  );

  readonly hocKyDangChon = computed(() =>
    this.dsHocKy().find((hk) => hk.id === this.mau.hoc_ky_id) ?? null,
  );

  readonly thongTinKyThu = computed(() => {
    const ct = this.chuongTrinhDangChon();
    const hk = this.hocKyDangChon();
    if (!ct || !hk) return null;

    const namNhapHoc = this.layNamNhapHoc(ct.khoa_hoc);
    const namHocKy = this.layNamHocKy(hk.nam_hoc);
    const kyTrongNam = hk.ky_thu ?? 1;

    // Biên 4 — Học kỳ phụ / Học kỳ hè (Kỳ 3)
    if (kyTrongNam === 3) {
      return {
        loai: 'SUMMER_SEMESTER',
        tieuDe: 'Học kỳ hè (Học kỳ 3)',
        thongBao: 'Học kỳ hè không áp dụng tiến độ CTĐT tự động. Mở lớp theo nhu cầu bằng hình thức Mở lớp lẻ (LOPNV).',
        coTheMo: false,
        kyThu: null,
      };
    }

    if (!namNhapHoc || !namHocKy) {
      return {
        loai: 'UNKNOWN',
        tieuDe: 'Chưa đủ dữ liệu tính toán',
        thongBao: 'Vui lòng kiểm tra khóa học và năm học của học kỳ.',
        coTheMo: true,
        kyThu: 1,
      };
    }

    // Biên 2 — Khóa tương lai chưa nhập học
    if (namHocKy < namNhapHoc) {
      return {
        loai: 'NOT_YET_ADMITTED',
        tieuDe: 'Khóa chưa nhập học',
        thongBao: `Khóa ${ct.khoa_hoc} nhập học năm ${namNhapHoc}, chưa có mặt ở học kỳ năm ${namHocKy}.`,
        coTheMo: false,
        kyThu: null,
      };
    }

    // Tự động tính kỳ thứ
    const kyThu = ((namHocKy - namNhapHoc) * 2) + kyTrongNam;
    // Biên 3 — Đọc độ dài đào tạo từ CTĐT
    const soKyToiDa = ct.so_ky || (ct.so_nam ? Math.round(ct.so_nam * 2) : 8);

    // Biên 1 — Khóa đã tốt nghiệp
    if (kyThu > soKyToiDa) {
      return {
        loai: 'GRADUATED',
        tieuDe: 'Khóa đã hoàn thành chương trình',
        thongBao: `Khóa ${ct.khoa_hoc} đã học qua kỳ thứ ${kyThu} (vượt quá ${soKyToiDa} kỳ của CTĐT). Không mở lớp chính khóa; sinh viên nợ môn sẽ đăng ký lớp nguyện vọng LOPNV.`,
        coTheMo: false,
        kyThu,
      };
    }

    return {
      loai: 'OK',
      tieuDe: 'Tiến độ tự động chuẩn xác',
      thongBao: `Khóa ${ct.khoa_hoc} trong ${hk.label} tương ứng với Kỳ thứ ${kyThu} của chương trình đào tạo.`,
      coTheMo: true,
      kyThu,
    };
  });

  readonly monXemTruoc = computed(() => {
    const ct = this.chuongTrinhChiTiet();
    const kyThu = this.mau.ky_thu;
    if (!ct?.mon || !kyThu) return [];
    return ct.mon.filter((m) => m.ky_thu === kyThu);
  });

  readonly tongTinChiXemTruoc = computed(() =>
    this.monXemTruoc().reduce((sum, m) => sum + (m.mon_hoc?.so_tin_chi ?? 0), 0),
  );

  readonly hopLe = computed(
    () =>
      this.mau.chuong_trinh_id > 0 &&
      this.mau.hoc_ky_id > 0 &&
      this.monXemTruoc().length > 0 &&
      this.monXemTruoc().every((mon) => {
        const config = this.mapCauHinh().get(mon.mon_hoc.id);
        return !!config?.ma_lop_hp.trim() && Number.isInteger(config.si_so_toi_da)
          && config.si_so_toi_da >= 1 && config.si_so_toi_da <= 500;
      }),
  );

  readonly coTheMo = computed(() => this.thongTinKyThu()?.coTheMo ?? true);

  constructor() {
    this.chuongTrinh.layDanhSach({ per_page: 100, trang_thai: true }).subscribe({
      next: (trang) => this.dsChuongTrinh.set(trang.data),
      error: () => this.loi.set('Không tải được danh sách chương trình đào tạo.'),
    });

    this.lopHocPhan.layTuyChon('semesters').subscribe({
      next: (rows) => {
        this.dsHocKy.set(rows as HocKyOption[]);
        if (rows.length > 0 && !this.mau.hoc_ky_id) {
          const hkMo = rows.find((r) => (r as HocKyOption).trang_thai === 'UPCOMING' || (r as HocKyOption).trang_thai === 'ONGOING') ?? rows[0];
          this.mau.hoc_ky_id = hkMo.id;
          this.capNhatKyThuTuDong();
        }
      },
      error: () => this.loi.set('Không tải được danh sách học kỳ.'),
    });

    this.lopHocPhan.layTuyChon('teachers').subscribe({
      next: (rows) => this.dsGiangVien.set(rows),
      error: () => {},
    });

    this.lopHocPhan.layTuyChon('rooms').subscribe({
      next: (rows) => this.dsPhongHoc.set(rows),
      error: () => {},
    });
  }

  chonHocKy(id: number): void {
    this.mau.hoc_ky_id = id;
    this.ketQua.set(null);
    this.loi.set('');
    this.capNhatKyThuTuDong();
  }

  chonChuongTrinh(id: number): void {
    this.mau.chuong_trinh_id = id;
    this.ketQua.set(null);
    this.loi.set('');
    this.capNhatKyThuTuDong();

    if (id > 0) {
      this.chuongTrinh.layMot(id).subscribe({
        next: (ct) => {
          this.chuongTrinhChiTiet.set(ct);
          this.damBaoCauHinhMon();
        },
        error: () => this.chuongTrinhChiTiet.set(null),
      });
    } else {
      this.chuongTrinhChiTiet.set(null);
    }
  }

  doiKyThuThuCong(k: number): void {
    this.mau.ky_thu = k;
    this.damBaoCauHinhMon();
  }

  // ---------------- Cấu hình chi tiết từng môn ----------------

  daThietLap(monHocId: number): boolean {
    const ch = this.mapCauHinh().get(monHocId);
    return !!ch?.ma_lop_hp.trim() && ch.si_so_toi_da >= 1 && ch.si_so_toi_da <= 500;
  }

  laySiSoMon(monHocId: number): number {
    return this.mapCauHinh().get(monHocId)?.si_so_toi_da ?? 0;
  }

  layMaLopMon(monHocId: number): string {
    return this.mapCauHinh().get(monHocId)?.ma_lop_hp ?? '';
  }

  moTaGiangVien(monHocId: number): string {
    const gvId = this.mapCauHinh().get(monHocId)?.giang_vien_id;
    if (!gvId) return 'Chưa phân công';
    return this.dsGiangVien().find((g) => g.id === gvId)?.label ?? `GV #${gvId}`;
  }

  moTaLich(monHocId: number): string {
    const lich = this.mapCauHinh().get(monHocId)?.lich ?? [];
    if (lich.length === 0) return 'Chưa xếp lịch';
    return lich
      .map((d) => {
        const thu = d.thu === 8 ? 'CN' : `T${d.thu}`;
        const phong = this.dsPhongHoc().find((p) => p.id === d.phong_hoc_id)?.label ?? 'P.?';
        return `${thu} (t${d.tiet_bat_dau}-${d.tiet_ket_thuc}, ${phong})`;
      })
      .join('; ');
  }

  moThietLapMon(mon: ChuongTrinhMon): void {
    this.monDangSua.set(mon);
    const tonTai = this.mapCauHinh().get(mon.mon_hoc.id);
    if (tonTai) {
      this.formMon = {
        mon_hoc_id: mon.mon_hoc.id,
        ma_lop_hp: tonTai.ma_lop_hp,
        giang_vien_id: tonTai.giang_vien_id ?? 0,
        si_so_toi_da: tonTai.si_so_toi_da ?? 0,
        lich: tonTai.lich.map((l) => ({ ...l })),
      };
    } else {
      this.formMon = {
        mon_hoc_id: mon.mon_hoc.id,
        ma_lop_hp: this.maLopGoiY(mon),
        giang_vien_id: 0,
        si_so_toi_da: 0,
        lich: [],
      };
    }
  }

  dongThietLapMon(): void {
    this.monDangSua.set(null);
  }

  themDongLich(): void {
    this.formMon.lich.push({
      thu: 2,
      tiet_bat_dau: 1,
      tiet_ket_thuc: 3,
      phong_hoc_id: this.dsPhongHoc()[0]?.id ?? 0,
    });
  }

  xoaDongLich(index: number): void {
    this.formMon.lich.splice(index, 1);
  }

  luuThietLapMon(): void {
    const m = this.monDangSua();
    if (!m) return;
    this.mapCauHinh.update((map) => {
      const moi = new Map(map);
      moi.set(m.mon_hoc.id, { ...this.formMon, lich: [...this.formMon.lich] });
      return moi;
    });
    this.dongThietLapMon();
  }

  private capNhatKyThuTuDong(): void {
    if (this.choPhepChinhKyThu()) return;
    const tt = this.thongTinKyThu();
    if (tt?.kyThu) {
      this.mau.ky_thu = tt.kyThu;
      this.damBaoCauHinhMon();
    }
  }

  private damBaoCauHinhMon(): void {
    const mon = this.monXemTruoc();
    if (mon.length === 0) return;
    this.mapCauHinh.update((current) => {
      const next = new Map(current);
      mon.forEach((dong) => {
        if (!next.has(dong.mon_hoc.id)) {
          next.set(dong.mon_hoc.id, {
            mon_hoc_id: dong.mon_hoc.id,
            ma_lop_hp: this.maLopGoiY(dong),
            giang_vien_id: 0,
            si_so_toi_da: 0,
            lich: [],
          });
        }
      });
      return next;
    });
  }

  private maLopGoiY(mon: ChuongTrinhMon): string {
    const lopHanhChinh = this.chuongTrinhChiTiet()?.ma_lop_hanh_chinh_goi_y;
    return lopHanhChinh ? `${lopHanhChinh}-${mon.mon_hoc.ma_mon}` : mon.mon_hoc.ma_mon;
  }

  private layNamNhapHoc(khoaHoc: string): number | null {
    const match = khoaHoc.match(/K?(\d+)/i);
    if (!match) return null;
    const k = parseInt(match[1], 10);
    return 1956 + k;
  }

  private layNamHocKy(namHoc: string | undefined): number | null {
    if (!namHoc) return null;
    const match = namHoc.match(/^(\d{4})/);
    return match ? parseInt(match[1], 10) : null;
  }

  moLop(): void {
    if (this.dangGui() || !this.hopLe()) return;
    const tt = this.thongTinKyThu();
    if (tt && !tt.coTheMo) return;

    this.dangGui.set(true);
    this.loi.set('');
    this.ketQua.set(null);

    // Thu thập cấu hình chi tiết cho từng môn đã thiết lập
    const cauHinhMon: CauHinhMonInput[] = this.monXemTruoc().map((mon) => {
      const ch = this.mapCauHinh().get(mon.mon_hoc.id)!;
      return {
        mon_hoc_id: mon.mon_hoc.id,
        ma_lop_hp: ch.ma_lop_hp.trim(),
        giang_vien_id: ch.giang_vien_id && ch.giang_vien_id > 0 ? ch.giang_vien_id : null,
        si_so_toi_da: ch.si_so_toi_da,
        lich: ch.lich.filter((l) => l.phong_hoc_id > 0),
      };
    });

    const payload: MoLopTheoChuongTrinhInput = {
      ...this.mau,
      cau_hinh_mon: cauHinhMon,
    };

    this.lopHocPhan.moLopTheoChuongTrinh(payload).subscribe({
      next: (kq) => {
        this.dangGui.set(false);
        this.ketQua.set(kq);
        if (kq.tao > 0) {
          void this.router.navigate(['/lop-hoc-phan']);
        }
      },
      error: (error: { error?: { message?: string } }) => {
        this.dangGui.set(false);
        this.loi.set(error.error?.message ?? 'Không mở được lớp. Kiểm tra lại thông tin.');
      },
    });
  }
}
