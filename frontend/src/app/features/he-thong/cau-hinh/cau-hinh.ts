import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CauHinhDiem,
  CauHinhDiemApi,
  CAC_DIEM_CHU,
  KhoangQuyDoiDiem,
  TrongSoDiem,
  laKhoangQuyDoiDiem,
  laTrongSoDiem,
  kiemTraCauHinhDiem,
} from '@core/models/he-thong.model';
import { CauHinhService, HocKyCauHinh } from '@core/services/cau-hinh.service';
import { AppToastService } from '@shared/ui/app-toast.service';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { PageHeader } from '@shared/ui/page-header';

type KhoaTrongSo = keyof TrongSoDiem;
type KhoaKhoang = 'tu' | 'den' | 'chu' | 'he_4' | 'xep_loai' | 'dat';

@Component({
  selector: 'app-cau-hinh',
  standalone: true,
  imports: [AppAlert, AppButton, PageHeader],
  template: `
    <app-page-header
      title="Cấu hình quy đổi điểm"
      description="Mỗi học kỳ có một cấu hình riêng. Học kỳ sắp diễn ra có thể chỉnh sửa; học kỳ đang diễn ra hoặc đã đóng chỉ được xem."
    />

    @if (dangTaiDanhSach()) {
      <div class="dang-tai" role="status">
        {{ dangOTrangChiTiet() ? 'Đang tải dữ liệu học kỳ…' : 'Đang tải danh sách học kỳ…' }}
      </div>
    } @else if (loiTai()) {
      <app-alert muc="danger" title="Không tải được cấu hình">
        {{ loiTai() }}
        <button type="button" class="nut-thu-lai" (click)="tai()">Thử lại</button>
      </app-alert>
    } @else {
      @if (!dangOTrangChiTiet()) {
      <section class="the danh-sach" aria-labelledby="danh-sach-title">
        <div class="dau-the">
          <div>
            <h2 id="danh-sach-title">Cấu hình theo học kỳ</h2>
            <p>
              Chọn dòng học kỳ để xem chi tiết; tìm hoặc lọc theo năm học, trạng thái và tình trạng cấu hình.
            </p>
          </div>
          <span class="so-luong">{{ hocKyLoc().length }} học kỳ</span>
        </div>
        <div class="bo-loc">
          <label class="truong tim-kiem">
            <span>Tìm kiếm</span>
            <input
              type="search"
              placeholder="Tên, mã học kỳ, năm học"
              [value]="tuKhoa()"
              (input)="tuKhoa.set($any($event.target).value)"
            />
          </label>
          <label class="truong">
            <span>Năm học</span>
            <select
              aria-label="Lọc theo năm học"
              [value]="locNamHoc()"
              (change)="locNamHoc.set($any($event.target).value)"
            >
              <option value="">Tất cả năm học</option>
              @for (nam of cacNamHoc(); track nam) {
                <option [value]="nam">{{ nam }}</option>
              }
            </select>
          </label>
          <label class="truong">
            <span>Trạng thái</span>
            <select
              aria-label="Lọc theo trạng thái"
              [value]="locTrangThai()"
              (change)="locTrangThai.set($any($event.target).value)"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="UPCOMING">Sắp diễn ra</option>
              <option value="ONGOING">Đang diễn ra</option>
              <option value="CLOSED">Đã đóng</option>
            </select>
          </label>
          <label class="truong">
            <span>Cấu hình</span>
            <select
              aria-label="Lọc theo tình trạng cấu hình"
              [value]="locCauHinh()"
              (change)="locCauHinh.set($any($event.target).value)"
            >
              <option value="">Tất cả</option>
              <option value="saved">Đã lưu</option>
              <option value="missing">Chưa lưu</option>
            </select>
          </label>
        </div>
        <div class="hanh-dong-bo-loc">
          <button type="button" class="nut-xoa-loc" [disabled]="!coBoLoc()" (click)="xoaLoc()">
            Xóa bộ lọc
          </button>
        </div>
        <div class="bang-bao">
          <table>
            <thead>
              <tr>
                <th scope="col">Học kỳ</th>
                <th scope="col">Năm học</th>
                <th scope="col">Thời gian</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Cấu hình</th>
                <th scope="col"><span class="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              @for (hocKy of hocKyLoc(); track hocKy.id) {
                <tr
                  class="dong-hoc-ky"
                  tabindex="0"
                  [attr.aria-label]="'Xem chi tiết cấu hình ' + hocKy.label"
                  (click)="chonHocKy(hocKy)"
                  (keydown.enter)="moChiTietBangPhim($event, hocKy)"
                  (keydown.space)="moChiTietBangPhim($event, hocKy)"
                >
                  <td data-label="Học kỳ">
                    <strong>{{ hocKy.label }}</strong
                    ><small>{{ hocKy.ma_hoc_ky }}</small>
                  </td>
                  <td data-label="Năm học">{{ hocKy.nam_hoc }}</td>
                  <td data-label="Thời gian">
                    {{ hocKy.ngay_bat_dau }} – {{ hocKy.ngay_ket_thuc }}
                  </td>
                  <td data-label="Trạng thái">
                    <span
                      class="nhan-trang-thai"
                      [class]="'nhan-trang-thai ' + hocKy.trang_thai.toLowerCase()"
                      >{{ tenTrangThai(hocKy.trang_thai) }}</span
                    >
                  </td>
                  <td data-label="Cấu hình">
                    {{ hocKy.cau_hinh_da_luu ? 'Đã lưu' : 'Chưa lưu' }}
                  </td>
                  <td data-label="Thao tác">
                    <div class="thao-tac-hoc-ky">
                      @if (hocKy.trang_thai === 'UPCOMING') {
                        <app-button
                          variant="secondary"
                          size="sm"
                          type="button"
                          (click)="$event.stopPropagation(); suaHocKy(hocKy)"
                        >
                          Sửa
                        </app-button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="rong">Không tìm thấy học kỳ phù hợp.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
      }

      @if (hocKyDangChon(); as hocKy) {
        @if (dangOTrangChiTiet()) {
          <div class="dieu-huong-chi-tiet">
            <button type="button" class="nut-xem" (click)="veDanhSach()">
              Quay lại danh sách cấu hình
            </button>
            @if (!dangSua() && hocKy.trang_thai === 'UPCOMING') {
              <app-button type="button" (click)="suaHocKy(hocKy)">Sửa cấu hình</app-button>
            } @else if (dangSua()) {
              <button type="button" class="nut-xem" (click)="chonHocKy(hocKy)">
                Xem chi tiết
              </button>
            }
          </div>
        }
        @if (dangTaiChiTiet()) {
          <div class="dang-tai" role="status">Đang tải cấu hình học kỳ…</div>
        } @else if (loiChiTiet()) {
          <app-alert muc="danger" title="Không tải được chi tiết">{{ loiChiTiet() }}</app-alert>
        } @else if (cauHinh(); as config) {
          <form class="form-cau-hinh" (submit)="luu($event)" novalidate>
            <section class="the" aria-labelledby="chi-tiet-title">
              <div class="dau-the">
                <div>
                  <h2 id="chi-tiet-title">
                    {{ dangSua() ? 'Sửa cấu hình điểm' : 'Chi tiết cấu hình điểm' }}
                  </h2>
                  <p>
                    {{ hocKy.label }} · {{ hocKy.ngay_bat_dau }} – {{ hocKy.ngay_ket_thuc }} · Năm học
                    {{ hocKy.nam_hoc }}
                  </p>
                </div>
                <span
                  class="nhan-trang-thai"
                  [class]="'nhan-trang-thai ' + hocKy.trang_thai.toLowerCase()"
                  >{{ tenTrangThai(hocKy.trang_thai) }}</span
                >
              </div>
              @if (hocKy.trang_thai !== 'UPCOMING') {
                <app-alert muc="info" title="Cấu hình chỉ xem">
                  Học kỳ đã bắt đầu hoặc đã đóng nên cấu hình được khóa để bảo toàn điểm lịch sử.
                </app-alert>
              } @else if (!dangSua()) {
                <app-alert muc="info" title="Bạn đang xem cấu hình">
                  Học kỳ chưa diễn ra. Chọn “Sửa cấu hình” để thay đổi thiết lập cho riêng học kỳ này.
                </app-alert>
              } @else if (!hocKy.cau_hinh_da_luu) {
                <p class="ghi-chu">
                  Chưa lưu cấu hình cho học kỳ này. Các giá trị đang hiển thị là mặc định từ API.
                </p>
              }
              <p class="ghi-chu">
                Điểm tổng kết được làm tròn HALF_UP đến 2 chữ số thập phân trước khi quy đổi.
              </p>
            </section>

            <fieldset [disabled]="!choPhepSua() || dangLuu()">
              <section class="the" aria-labelledby="trong-so-title">
                <div class="dau-the">
                  <div>
                    <h2 id="trong-so-title">Trọng số điểm thành phần</h2>
                    <p>Tổng ba trọng số phải bằng 100%.</p>
                  </div>
                  <span class="tong-trong-so" [class.khong-hop-le]="!tongTrongSoHopLe()"
                    >Tổng: {{ (tongTrongSo() * 100).toFixed(1) }}%</span
                  >
                </div>
                <div class="luoi-trong-so">
                  <label class="truong"
                    ><span>Chuyên cần</span>
                    <div class="don-vi">
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        [value]="config['diem.trong_so'].chuyen_can"
                        (input)="doiTrongSo('chuyen_can', $event)"
                      /><span>tỷ lệ (0–1)</span>
                    </div></label
                  >
                  <label class="truong"
                    ><span>Giữa kỳ</span>
                    <div class="don-vi">
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        [value]="config['diem.trong_so'].giua_ky"
                        (input)="doiTrongSo('giua_ky', $event)"
                      /><span>tỷ lệ (0–1)</span>
                    </div></label
                  >
                  <label class="truong"
                    ><span>Cuối kỳ</span>
                    <div class="don-vi">
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        [value]="config['diem.trong_so'].cuoi_ky"
                        (input)="doiTrongSo('cuoi_ky', $event)"
                      /><span>tỷ lệ (0–1)</span>
                    </div></label
                  >
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
                  <app-button variant="secondary" size="sm" type="button" (click)="themKhoang()"
                    >Thêm khoảng</app-button
                  >
                </div>
                <div class="bang-bao">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Từ</th>
                        <th scope="col">Đến</th>
                        <th scope="col">Điểm chữ</th>
                        <th scope="col">Hệ 4</th>
                        <th scope="col">Xếp loại</th>
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
                            <select aria-label="Điểm chữ" (change)="doiKhoang(i, 'chu', $event)">
                              @for (chu of cacDiemChu; track chu) {
                                <option [value]="chu" [selected]="khoang.chu === chu">
                                  {{ chu }}
                                </option>
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
                            <input
                              aria-label="Xếp loại"
                              type="text"
                              maxlength="100"
                              [value]="khoang.xep_loai"
                              (input)="doiKhoang(i, 'xep_loai', $event)"
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
                <label class="truong so-ngay"
                  ><span>Số ngày cho phép</span>
                  <div class="don-vi">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      [value]="config['diem.diem_danh.sua_trong_so_ngay']"
                      (input)="doiSoNgay($event)"
                    /><span>ngày</span>
                  </div></label
                >
                @if (loiValidation()['diem.diem_danh.sua_trong_so_ngay']) {
                  <p class="loi-truong" role="alert">
                    {{ loiValidation()['diem.diem_danh.sua_trong_so_ngay'] }}
                  </p>
                }
              </section>
            </fieldset>
            @if (choPhepSua()) {
              <div class="hanh-dong">
                <app-button type="submit" [loading]="dangLuu()">Lưu cấu hình học kỳ</app-button>
              </div>
            }
          </form>
        }
      } @else if (dangOTrangChiTiet()) {
        <app-alert muc="warning" title="Không tìm thấy học kỳ">
          Học kỳ trong đường dẫn không tồn tại hoặc không còn khả dụng.
          <button type="button" class="nut-thu-lai" (click)="veDanhSach()">Về danh sách</button>
        </app-alert>
      }
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      max-width: 1180px;
      min-width: 0;
      margin: 0 auto;
      overflow-x: clip;
    }
    .form-cau-hinh {
      display: grid;
      gap: 16px;
      min-width: 0;
    }
    .the {
      display: grid;
      gap: 16px;
      min-width: 0;
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
    .dau-the p,
    .ghi-chu {
      margin: 5px 0 0;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
    }
    .so-luong {
      color: var(--color-ink-muted);
      font-size: var(--text-small);
    }
    .bo-loc {
      display: grid;
      grid-template-columns: minmax(220px, 2fr) repeat(3, minmax(140px, 1fr));
      gap: 12px;
    }
    .hanh-dong-bo-loc {
      display: flex;
      justify-content: flex-end;
      margin-top: -4px;
    }
    .nut-xoa-loc {
      padding: 6px 10px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-primary);
      cursor: pointer;
      font: inherit;
      font-size: var(--text-small);
      font-weight: 600;
    }
    .nut-xoa-loc:disabled {
      color: var(--color-ink-muted);
      cursor: not-allowed;
      opacity: 0.6;
    }
    .thao-tac-hoc-ky,
    .dieu-huong-chi-tiet {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .thao-tac-hoc-ky {
      justify-content: flex-end;
    }
    .dieu-huong-chi-tiet {
      justify-content: space-between;
    }
    .truong {
      display: grid;
      gap: 6px;
      color: var(--color-ink);
      font-size: var(--text-small);
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
    .bang-bao {
      min-width: 0;
      max-width: 100%;
      overflow-x: auto;
      contain: layout;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th,
    td {
      padding: 9px 8px;
      border-bottom: 1px solid var(--color-border);
      text-align: left;
      vertical-align: middle;
    }
    th {
      color: var(--color-ink-muted);
      font-size: var(--text-small);
      font-weight: 600;
      white-space: nowrap;
    }
    td small {
      display: block;
      margin-top: 3px;
      color: var(--color-ink-muted);
    }
    tr.dang-chon {
      background: var(--color-primary-soft);
    }
    tr.dong-hoc-ky {
      cursor: pointer;
      transition: background-color 120ms ease;
    }
    tr.dong-hoc-ky:hover {
      background: var(--color-primary-soft);
    }
    tr.dong-hoc-ky:focus-visible {
      outline: 3px solid var(--color-primary);
      outline-offset: -3px;
    }
    .nhan-trang-thai {
      display: inline-flex;
      padding: 4px 8px;
      border-radius: var(--radius);
      font-size: var(--text-caption);
      font-weight: 700;
      white-space: nowrap;
    }
    .nhan-trang-thai.upcoming {
      background: var(--color-warning-soft);
      color: var(--color-warning);
    }
    .nhan-trang-thai.ongoing {
      background: var(--color-success-soft);
      color: var(--color-success);
    }
    .nhan-trang-thai.closed {
      background: var(--color-surface-muted, var(--color-border));
      color: var(--color-ink-muted);
    }
    .nut-xem,
    .nut-thu-lai {
      border: 0;
      background: none;
      color: var(--color-primary);
      cursor: pointer;
      font: inherit;
      font-weight: 600;
      white-space: nowrap;
    }
    .rong {
      padding: 24px;
      color: var(--color-ink-muted);
      text-align: center;
    }
    fieldset {
      display: grid;
      gap: 16px;
      min-width: 0;
      padding: 0;
      margin: 0;
      border: 0;
    }
    fieldset:disabled {
      opacity: 0.78;
    }
    .luoi-trong-so {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
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
    .don-vi {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .don-vi span {
      flex: 0 0 auto;
      color: var(--color-ink-muted);
    }
    td input,
    td select {
      min-width: 86px;
    }
    .nut-hanh-dong {
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
    @media (min-width: 761px) and (max-width: 1023px) {
      .danh-sach .bang-bao table {
        min-width: 850px;
      }
    }
    @media (max-width: 760px) {
      .bo-loc {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .luoi-trong-so {
        grid-template-columns: 1fr;
      }
      .dau-the {
        flex-direction: column;
      }
      .dieu-huong-chi-tiet {
        align-items: flex-start;
      }
      .the {
        padding: 14px;
      }
      .danh-sach .bang-bao {
        overflow: visible;
      }
      .danh-sach .bang-bao table,
      .danh-sach .bang-bao tbody {
        display: block;
        width: 100%;
      }
      .danh-sach .bang-bao thead {
        display: none;
      }
      .danh-sach .bang-bao tbody {
        display: grid;
        gap: 12px;
      }
      .danh-sach .bang-bao tr.dong-hoc-ky {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        padding: 6px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius);
        background: var(--color-surface);
      }
      .danh-sach .bang-bao tr.dong-hoc-ky:hover {
        background: var(--color-primary-soft);
      }
      .danh-sach .bang-bao tr.dong-hoc-ky td {
        display: grid;
        align-content: start;
        gap: 4px;
        min-width: 0;
        padding: 8px;
        border: 0;
        overflow-wrap: anywhere;
      }
      .danh-sach .bang-bao tr.dong-hoc-ky td::before {
        content: attr(data-label);
        color: var(--color-ink-muted);
        font-size: var(--text-caption);
        font-weight: 600;
      }
      .danh-sach .bang-bao tr.dong-hoc-ky td:nth-child(1),
      .danh-sach .bang-bao tr.dong-hoc-ky td:nth-child(3),
      .danh-sach .bang-bao tr.dong-hoc-ky td:nth-child(6) {
        grid-column: 1 / -1;
      }
      .danh-sach .bang-bao tr.dong-hoc-ky td:nth-child(6) {
        padding-top: 4px;
      }
      .thao-tac-hoc-ky {
        justify-content: stretch;
      }
      .thao-tac-hoc-ky app-button {
        width: 100%;
      }
      .danh-sach .bang-bao tr:not(.dong-hoc-ky) td[colspan] {
        display: block;
      }
    }
    @media (max-width: 460px) {
      .bo-loc {
        grid-template-columns: 1fr;
      }
      .dieu-huong-chi-tiet {
        flex-direction: column;
      }
    }
  `,
})
export class CauHinhPage {
  private readonly service = inject(CauHinhService);
  private readonly toast = inject(AppToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly cacDiemChu = CAC_DIEM_CHU;
  readonly cacHocKy = signal<HocKyCauHinh[]>([]);
  readonly hocKyDangChon = signal<HocKyCauHinh | null>(null);
  readonly cauHinh = signal<CauHinhDiem | null>(null);
  readonly dangOTrangChiTiet = signal(false);
  readonly dangSua = signal(false);
  readonly tuKhoa = signal('');
  readonly locNamHoc = signal('');
  readonly locTrangThai = signal('');
  readonly locCauHinh = signal('');
  readonly dangTaiDanhSach = signal(true);
  readonly dangTaiChiTiet = signal(false);
  readonly dangLuu = signal(false);
  readonly daGui = signal(false);
  readonly loiTai = signal<string | null>(null);
  readonly loiChiTiet = signal<string | null>(null);
  readonly cacNamHoc = computed(() =>
    [...new Set(this.cacHocKy().map((row) => row.nam_hoc))].sort().reverse(),
  );
  readonly coBoLoc = computed(
    () =>
      Boolean(this.tuKhoa().trim()) ||
      Boolean(this.locNamHoc()) ||
      Boolean(this.locTrangThai()) ||
      Boolean(this.locCauHinh()),
  );
  readonly hocKyLoc = computed(() => {
    const query = this.tuKhoa().trim().toLocaleLowerCase('vi');
    return this.cacHocKy().filter(
      (row) =>
        (!query ||
          `${row.label} ${row.ma_hoc_ky} ${row.nam_hoc}`.toLocaleLowerCase('vi').includes(query)) &&
        (!this.locNamHoc() || row.nam_hoc === this.locNamHoc()) &&
        (!this.locTrangThai() || row.trang_thai === this.locTrangThai()) &&
        (!this.locCauHinh() ||
          (this.locCauHinh() === 'saved' ? row.cau_hinh_da_luu : !row.cau_hinh_da_luu)),
    );
  });
  readonly choPhepSua = computed(
    () => this.dangSua() && this.hocKyDangChon()?.trang_thai === 'UPCOMING',
  );
  readonly loiValidation = computed(() => {
    const config = this.cauHinh();
    return config && this.daGui() ? kiemTraCauHinhDiem(config) : {};
  });
  readonly tongTrongSo = computed(() => {
    const weights = this.cauHinh()?.['diem.trong_so'];
    return weights ? weights.chuyen_can + weights.giua_ky + weights.cuoi_ky : 0;
  });
  readonly tongTrongSoHopLe = computed(
    () => Number.isFinite(this.tongTrongSo()) && Math.abs(this.tongTrongSo() - 1) <= 0.00001,
  );

  constructor() {
    this.route.data.subscribe((data) => this.dangSua.set(data['editMode'] === true));
    this.route.paramMap.subscribe((params) => {
      const hocKyId = params.get('hocKyId');
      this.dangOTrangChiTiet.set(hocKyId !== null);
      if (hocKyId === null) {
        this.hocKyDangChon.set(null);
        this.cauHinh.set(null);
        this.loiChiTiet.set(null);
        return;
      }
      this.taiChiTietTheoId(Number(hocKyId));
    });
    this.tai();
  }

  tai(): void {
    this.dangTaiDanhSach.set(true);
    this.loiTai.set(null);
    this.service.layHocKy().subscribe({
      next: (rows) => {
        this.cacHocKy.set([...rows].sort((a, b) => b.ngay_bat_dau.localeCompare(a.ngay_bat_dau)));
        this.dangTaiDanhSach.set(false);
        const hocKyId = Number(this.route.snapshot.paramMap.get('hocKyId'));
        if (Number.isInteger(hocKyId) && hocKyId > 0) this.taiChiTietTheoId(hocKyId);
      },
      error: (error: HttpErrorResponse) => {
        this.loiTai.set(error.error?.message ?? 'Không tải được danh sách học kỳ.');
        this.dangTaiDanhSach.set(false);
      },
    });
  }

  chonHocKy(hocKy: HocKyCauHinh): void {
    void this.router.navigate(['/cau-hinh', hocKy.id]);
  }

  moChiTietBangPhim(event: Event, hocKy: HocKyCauHinh): void {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    this.chonHocKy(hocKy);
  }

  suaHocKy(hocKy: HocKyCauHinh): void {
    if (hocKy.trang_thai !== 'UPCOMING') return;
    void this.router.navigate(['/cau-hinh', hocKy.id, 'sua']);
  }

  veDanhSach(): void {
    void this.router.navigate(['/cau-hinh']);
  }

  xoaLoc(): void {
    this.tuKhoa.set('');
    this.locNamHoc.set('');
    this.locTrangThai.set('');
    this.locCauHinh.set('');
  }

  private taiChiTietTheoId(hocKyId: number): void {
    const hocKy = this.cacHocKy().find((row) => row.id === hocKyId);
    if (!hocKy) {
      this.hocKyDangChon.set(null);
      this.cauHinh.set(null);
      this.dangTaiChiTiet.set(false);
      return;
    }

    this.taiChiTiet(hocKy);
  }

  private taiChiTiet(hocKy: HocKyCauHinh): void {
    this.hocKyDangChon.set(hocKy);
    this.cauHinh.set(null);
    this.dangTaiChiTiet.set(true);
    this.loiChiTiet.set(null);
    this.service.lay(hocKy.id).subscribe({
      next: (raw) => {
        const config = this.docCauHinh(raw);
        if (!config) this.loiChiTiet.set('Cấu hình từ API thiếu dữ liệu hoặc sai định dạng.');
        else this.cauHinh.set(config);
        this.dangTaiChiTiet.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loiChiTiet.set(error.error?.message ?? 'Không tải được cấu hình học kỳ.');
        this.dangTaiChiTiet.set(false);
      },
    });
  }

  tenTrangThai(trangThai: string): string {
    return (
      (
        { UPCOMING: 'Sắp diễn ra', ONGOING: 'Đang diễn ra', CLOSED: 'Đã đóng' } as Record<
          string,
          string
        >
      )[trangThai] ?? trangThai
    );
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
      'diem.bang_quy_doi': config['diem.bang_quy_doi'].map((range, row) =>
        row === index ? { ...range, [khoa]: this.giaTriKhoang(khoa, raw) } : range,
      ),
    }));
  }
  doiSoNgay(event: Event): void {
    this.capNhat((config) => ({
      ...config,
      'diem.diem_danh.sua_trong_so_ngay': this.soNhap((event.target as HTMLInputElement).value),
    }));
  }
  themKhoang(): void {
    this.capNhat((config) => ({
      ...config,
      'diem.bang_quy_doi': [
        ...config['diem.bang_quy_doi'],
        { tu: 0, den: 10, chu: 'F', he_4: 0, xep_loai: 'Kém (không đạt)', dat: false },
      ],
    }));
  }
  xoaKhoang(index: number): void {
    this.capNhat((config) => ({
      ...config,
      'diem.bang_quy_doi': config['diem.bang_quy_doi'].filter((_, row) => row !== index),
    }));
  }

  luu(event: Event): void {
    event.preventDefault();
    this.daGui.set(true);
    const config = this.cauHinh();
    const hocKy = this.hocKyDangChon();
    if (!config || !hocKy || !this.choPhepSua() || Object.keys(kiemTraCauHinhDiem(config)).length)
      return;
    this.dangLuu.set(true);
    this.service.capNhat(config, hocKy.id).subscribe({
      next: (updated) => {
        const parsed = this.docCauHinh(updated);
        if (!parsed) {
          this.toast.hien('API trả về cấu hình không đúng định dạng.', 'danger');
          this.dangLuu.set(false);
          return;
        }
        this.cauHinh.set(parsed);
        this.cacHocKy.update((rows) =>
          rows.map((row) => (row.id === hocKy.id ? { ...row, cau_hinh_da_luu: true } : row)),
        );
        this.hocKyDangChon.update((row) => (row ? { ...row, cau_hinh_da_luu: true } : row));
        this.daGui.set(false);
        this.dangLuu.set(false);
        this.toast.hien(`Đã lưu cấu hình cho ${hocKy.label}.`, 'success');
        void this.router.navigate(['/cau-hinh', hocKy.id]);
      },
      error: (error: HttpErrorResponse) => {
        this.toast.hien(error.error?.message ?? 'Không lưu được cấu hình.', 'danger');
        this.dangLuu.set(false);
      },
    });
  }

  private capNhat(chinhSua: (config: CauHinhDiem) => CauHinhDiem): void {
    this.cauHinh.update((config) => (config ? chinhSua(config) : config));
  }
  private docCauHinh(raw: CauHinhDiemApi): CauHinhDiem | null {
    const weights = raw['diem.trong_so'];
    const ranges = raw['diem.bang_quy_doi'];
    const days = raw['diem.diem_danh.sua_trong_so_ngay'];
    if (
      !laTrongSoDiem(weights) ||
      !Array.isArray(ranges) ||
      !ranges.every(laKhoangQuyDoiDiem) ||
      typeof days !== 'number'
    )
      return null;
    return {
      'diem.trong_so': { ...weights },
      'diem.bang_quy_doi': ranges.map((range: KhoangQuyDoiDiem) => ({ ...range })),
      'diem.diem_danh.sua_trong_so_ngay': days,
    };
  }
  private soNhap(raw: string): number {
    return raw === '' ? Number.NaN : Number(raw);
  }
  private giaTriKhoang(khoa: KhoaKhoang, raw: string): number | string | boolean {
    if (khoa === 'chu' || khoa === 'xep_loai') return raw;
    if (khoa === 'dat') return raw === 'true';
    return this.soNhap(raw);
  }
}
