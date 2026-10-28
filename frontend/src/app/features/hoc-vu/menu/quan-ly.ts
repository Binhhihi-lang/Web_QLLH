import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MenuApi, MenuInput, MenuService } from '@core/services/menu.service';
import { danhGiaDuongDanMenu } from '@core/utils/menu-url';
import { routes } from '../../../app.routes';
import { AppAlert } from '@shared/ui/app-alert';
import { PageHeader } from '@shared/ui/page-header';

export type VaiTroMenu = 'ADMIN' | 'GIANG_VIEN' | 'SINH_VIEN';

export const VAI_TRO: ReadonlyArray<{ ma: VaiTroMenu; nhan: string }> = [
  { ma: 'ADMIN', nhan: 'Quản trị viên' },
  { ma: 'GIANG_VIEN', nhan: 'Giảng viên' },
  { ma: 'SINH_VIEN', nhan: 'Sinh viên' },
];

interface MenuForm {
  ten: string;
  url: string;
  vi_tri: MenuApi['vi_tri'];
  nhom: string;
  vai_tro: VaiTroMenu[];
  thu_tu: number;
  trang_thai: boolean;
}

const FORM_MOI: MenuForm = {
  ten: '',
  url: '',
  vi_tri: 'sidebar',
  nhom: '',
  vai_tro: [],
  thu_tu: 0,
  trang_thai: true,
};

@Component({
  selector: 'app-menu-quan-ly',
  standalone: true,
  imports: [AppAlert, PageHeader, RouterLink],
  template: `
    <app-page-header
      title="Quản lý menu"
      description="Cấu hình các mục điều hướng, vị trí hiển thị và vai trò được xem."
    >
      <button class="nut nut-chinh" type="button" (click)="batDauTao()">
        <span class="material-icons" aria-hidden="true">add</span>
        Thêm menu
      </button>
    </app-page-header>

    @if (thongBao()) {
      <app-alert muc="success" title="Đã lưu thay đổi">{{ thongBao() }}</app-alert>
    }

    @if (loi()) {
      <app-alert muc="danger" title="Không thể hoàn tất thao tác">
        {{ loi() }}
        <button class="nut-thu-lai" type="button" (click)="taiDanhSach()">Thử tải lại</button>
      </app-alert>
    }

    @if (formMo()) {
      <section class="form-menu" aria-labelledby="tieu-de-form-menu">
        <h2 id="tieu-de-form-menu">Thêm menu</h2>
        <form (submit)="luu($event)">
          <label>
            Tên menu
            <input
              name="ten"
              required
              maxlength="100"
              [value]="form().ten"
              (input)="doiTruong('ten', $event)"
            />
          </label>
          <label>
            Đường dẫn
            <input
              name="url"
              required
              maxlength="2048"
              placeholder="/duong-dan"
              [value]="form().url"
              (input)="doiTruong('url', $event)"
            />
            @if (canhBaoUrl(); as canhBao) {
              <small class="canh-bao-url" [class.la-loi]="canhBao.loi">{{ canhBao.noiDung }}</small>
            }
          </label>
          <label>
            Vị trí
            <select name="vi_tri" [value]="form().vi_tri" (change)="doiViTri($event)">
              <option value="sidebar">Thanh điều hướng</option>
              <option value="header">Đầu trang</option>
            </select>
          </label>
          <label>
            Nhóm
            <input
              name="nhom"
              maxlength="100"
              placeholder="Ví dụ: Học vụ"
              [value]="form().nhom"
              (input)="doiTruong('nhom', $event)"
            />
          </label>
          <fieldset class="vai-tro">
            <legend>Vai trò được xem</legend>
            @for (lua of VAI_TRO; track lua.ma) {
              <label class="o-vai-tro">
                <input
                  type="checkbox"
                  [name]="'vai_tro_' + lua.ma"
                  [checked]="form().vai_tro.includes(lua.ma)"
                  (change)="doiVaiTro(lua.ma, $event)"
                />
                {{ lua.nhan }}
              </label>
            }
            <small class="goi-y-vai-tro">
              Không chọn ô nào = mọi vai trò đều thấy.
            </small>
          </fieldset>
          <label>
            Thứ tự
            <input
              name="thu_tu"
              type="number"
              step="1"
              [value]="form().thu_tu"
              (input)="doiThuTu($event)"
            />
          </label>
          <label class="trang-thai">
            <input
              name="trang_thai"
              type="checkbox"
              [checked]="form().trang_thai"
              (change)="doiTrangThaiForm($event)"
            />
            Đang hiển thị
          </label>
          <div class="hanh-dong-form">
            <button class="nut nut-chinh" type="submit" [disabled]="dangLuu()">
              {{ dangLuu() ? 'Đang lưu…' : 'Lưu menu' }}
            </button>
            <button class="nut nut-phu" type="button" (click)="huyForm()">Hủy</button>
          </div>
        </form>
      </section>
    }

    <section class="bang-menu" aria-label="Danh sách menu">
      @if (dangTai()) {
        <p class="trang-thai" role="status" aria-busy="true">Đang tải danh sách menu…</p>
      } @else if (menus().length === 0) {
        <p class="trang-thai" role="status">Chưa có mục menu nào. Bạn có thể thêm mục mới.</p>
      } @else {
        <div class="bang-cuon">
          <table>
            <thead>
              <tr>
                <th scope="col">Tên menu</th>
                <th scope="col">Đường dẫn</th>
                <th scope="col">Vị trí / nhóm</th>
                <th scope="col">Vai trò</th>
                <th scope="col">Thứ tự</th>
                <th scope="col">Trạng thái</th>
                <th scope="col"><span class="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              @for (menu of menus(); track menu.id) {
                <tr class="dong-menu" (click)="moChiTiet(menu, $event)">
                  <td data-label="Tên menu">
                    <a class="ten-menu" [routerLink]="['/menu', menu.id]">{{ menu.ten }}</a>
                  </td>
                  <td data-label="Đường dẫn"><code>{{ menu.url }}</code></td>
                  <td data-label="Vị trí / nhóm">
                    {{ menu.vi_tri === 'sidebar' ? 'Thanh điều hướng' : 'Đầu trang' }}
                    <small>{{ menu.nhom || 'Chưa phân nhóm' }}</small>
                  </td>
                  <td data-label="Vai trò">{{ tenVaiTro(menu.vai_tro) }}</td>
                  <td data-label="Thứ tự">{{ menu.thu_tu }}</td>
                  <td data-label="Trạng thái">
                    <span class="trang-thai-menu" [class.an]="!menu.trang_thai">
                      {{ menu.trang_thai ? 'Đang hiển thị' : 'Đang ẩn' }}
                    </span>
                  </td>
                  <td class="nut-hang">
                    <button
                      class="nut-hanh-dong"
                      type="button"
                      [attr.aria-label]="'Sửa menu ' + menu.ten"
                      (click)="batDauSua(menu); $event.stopPropagation()"
                    >
                      <span class="material-icons" aria-hidden="true">edit</span>
                      Sửa
                    </button>
                    <button
                      class="nut-hanh-dong"
                      type="button"
                      [attr.aria-label]="(menu.trang_thai ? 'Ẩn' : 'Hiện') + ' menu ' + menu.ten"
                      (click)="doiTrangThai(menu); $event.stopPropagation()"
                    >
                      <span class="material-icons" aria-hidden="true">
                        {{ menu.trang_thai ? 'visibility_off' : 'visibility' }}
                      </span>
                      {{ menu.trang_thai ? 'Ẩn' : 'Hiện' }}
                    </button>
                    <button
                      class="nut-hanh-dong nguy-hiem"
                      type="button"
                      [attr.aria-label]="'Xóa menu ' + menu.ten"
                      (click)="hoiXoa(menu); $event.stopPropagation()"
                    >
                      <span class="material-icons" aria-hidden="true">delete</span>
                      Xóa
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>

    @if (menuCanXoa(); as menu) {
      <div class="nen-dialog">
        <section
          class="dialog"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="tieu-de-xoa-menu"
          aria-describedby="mo-ta-xoa-menu"
        >
          <h2 id="tieu-de-xoa-menu">Xóa mục menu?</h2>
          <p id="mo-ta-xoa-menu">
            “{{ menu.ten }}” sẽ bị gỡ khỏi hệ thống điều hướng. Thao tác này không xóa dữ liệu
            nghiệp vụ.
          </p>
          <div class="hanh-dong-form">
            <button class="nut nut-nguy-hiem" type="button" [disabled]="dangLuu()" (click)="xacNhanXoa()">
              Xác nhận xóa
            </button>
            <button class="nut nut-phu" type="button" (click)="menuCanXoa.set(null)">Hủy</button>
          </div>
        </section>
      </div>
    }
  `,
  styles: `
    :host{display:block}.nut{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:38px;padding:8px 13px;border:1px solid transparent;border-radius:var(--radius);font:600 var(--text-small) var(--font-body);cursor:pointer}.nut:disabled{opacity:.55;cursor:not-allowed}.nut-chinh{background:var(--color-primary);color:var(--color-on-primary)}.nut-phu{background:var(--color-surface);border-color:var(--color-border);color:var(--color-ink)}.nut-nguy-hiem{background:var(--color-danger);color:#fff}.form-menu,.bang-menu{margin-bottom:16px;padding:16px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)}h2{margin:0 0 14px;color:var(--color-ink);font-size:var(--text-h3);font-weight:600}.form-menu form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.form-menu label{display:grid;gap:6px;color:var(--color-ink-muted);font-size:var(--text-caption);font-weight:600}.form-menu input:not([type=checkbox]),.form-menu select{width:100%;min-height:38px;padding:8px 10px;border:1px solid var(--color-border);border-radius:var(--radius);background:var(--color-surface);color:var(--color-ink);font:400 var(--text-small) var(--font-body)}.form-menu input:focus,.form-menu select:focus{outline:2px solid var(--color-primary);outline-offset:1px}.trang-thai{display:flex!important;align-items:center;gap:8px;padding-top:24px;color:var(--color-ink)!important;font-size:var(--text-small)!important}.trang-thai input{width:16px;height:16px;accent-color:var(--color-primary)}.hanh-dong-form{display:flex;align-items:center;gap:8px;grid-column:1/-1}.bang-cuon{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left;font-size:var(--text-small)}    th{padding:10px 12px;color:var(--color-ink-muted);font-size:var(--text-caption);font-weight:600;white-space:nowrap;border-bottom:1px solid var(--color-border)}td{padding:12px;border-bottom:1px solid var(--color-border-soft);color:var(--color-ink);vertical-align:middle}tbody tr:last-child td{border-bottom:0}td small{display:block;margin-top:3px;color:var(--color-ink-muted)}.dong-menu{cursor:pointer}.dong-menu:hover{background:var(--color-surface-alt)}.dong-menu:focus-within{outline:2px solid var(--color-primary);outline-offset:-2px}.ten-menu{color:var(--color-ink);font-weight:600;text-decoration:none}.ten-menu:hover{text-decoration:underline;color:var(--color-primary)}code{font-size:var(--text-caption);overflow-wrap:anywhere}.trang-thai-menu{display:inline-flex;padding:4px 8px;border-radius:999px;background:var(--color-success-soft);color:var(--color-on-success-soft);font-size:var(--text-caption);font-weight:600;white-space:nowrap}.trang-thai-menu.an{background:var(--color-surface-alt);color:var(--color-ink-muted)}.nut-hang{white-space:nowrap;text-align:right}.nut-hanh-dong{display:inline-flex;align-items:center;gap:4px;padding:4px 9px;border:1px solid var(--color-border);border-radius:var(--radius-sm);background:var(--color-surface);color:var(--color-primary);font:600 var(--text-caption) var(--font-body);cursor:pointer;white-space:nowrap;transition:background-color var(--dur) var(--ease),border-color var(--dur) var(--ease)}.nut-hanh-dong+.nut-hanh-dong{margin-left:6px}.nut-hanh-dong .material-icons{font-size:13px}.nut-hanh-dong:hover{background:var(--color-primary-soft);border-color:var(--color-primary)}.nut-hanh-dong.nguy-hiem{color:var(--color-danger)}.nut-hanh-dong.nguy-hiem:hover{background:var(--color-danger-soft);border-color:var(--color-danger)}.nut-thu-lai{padding:5px 7px;border:0;background:transparent;color:var(--color-primary);font:600 var(--text-caption) var(--font-body);cursor:pointer}.nut-thu-lai:hover{text-decoration:underline}.canh-bao-url{color:var(--color-on-warning-soft);font-size:var(--text-caption);font-weight:500;line-height:1.5}.canh-bao-url.la-loi{color:var(--color-danger)}.vai-tro{grid-column:1/-1;margin:0;padding:10px 12px 12px;border:1px solid var(--color-border);border-radius:var(--radius)}.vai-tro legend{padding:0 6px;color:var(--color-ink-muted);font-size:var(--text-caption);font-weight:600}.vai-tro .o-vai-tro{display:inline-flex;align-items:center;gap:7px;margin-right:16px;color:var(--color-ink);font-size:var(--text-small);font-weight:400;cursor:pointer}.vai-tro .o-vai-tro input{width:16px;height:16px;accent-color:var(--color-primary)}.goi-y-vai-tro{display:block;margin-top:6px;color:var(--color-ink-muted);font-size:var(--text-caption);font-weight:400}.trang-thai[role=status]{padding:16px;color:var(--color-ink-muted);font-size:var(--text-small)}.nen-dialog{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:16px;background:rgba(15,23,42,.48)}.dialog{width:min(100%,440px);padding:20px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg)}.dialog p{margin:0 0 18px;color:var(--color-ink-muted);font-size:var(--text-small);line-height:1.55}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:800px){.form-menu form{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.form-menu,.bang-menu{padding:12px}.form-menu form{grid-template-columns:1fr}.form-menu .trang-thai{padding-top:0}.bang-cuon{overflow:visible}table,tbody,tr,td{display:block;width:100%}thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}tbody tr{padding:12px 0;border-bottom:1px solid var(--color-border)}tbody tr:last-child{border-bottom:0}td{display:grid;grid-template-columns:100px minmax(0,1fr);gap:10px;padding:6px 0;border:0}td:before{content:attr(data-label);color:var(--color-ink-muted);font-size:var(--text-caption);font-weight:600}.nut-hang{display:flex;justify-content:flex-end}}
  `,
})
export class MenuQuanLy implements OnInit {
  readonly VAI_TRO = VAI_TRO;
  private readonly service = inject(MenuService);
  private readonly router = inject(Router);

  readonly menus = signal<MenuApi[]>([]);
  readonly dangTai = signal(true);
  readonly dangLuu = signal(false);
  readonly loi = signal<string | null>(null);
  readonly thongBao = signal<string | null>(null);
  readonly formMo = signal(false);
  readonly menuCanXoa = signal<MenuApi | null>(null);
  readonly form = signal<MenuForm>({ ...FORM_MOI });

  /**
   * Cảnh báo (không chặn) khi đường dẫn đúng hình dạng nhưng chưa có route:
   * admin được phép khai menu trước cho màn hình sẽ làm sau. Lưu vào thì bấm
   * menu sẽ ra trang "chưa làm", không phải 404.
   */
  readonly canhBaoUrl = computed<{ loi: boolean; noiDung: string } | null>(() => {
    const url = this.form().url.trim();
    if (!url) return null;

    switch (danhGiaDuongDanMenu(url, routes)) {
      case 'khong-hop-le':
        return {
          loi: true,
          noiDung: 'Đường dẫn phải bắt đầu bằng “/” hoặc là địa chỉ http(s).',
        };
      case 'chua-co-trang':
        return {
          loi: false,
          noiDung:
            'Chưa có trang nào dùng đường dẫn này. Menu vẫn lưu được và sẽ mở trang “chưa làm” cho tới khi màn hình hoàn thiện.',
        };
      default:
        return null;
    }
  });

  readonly urlKhongHopLe = computed(() => this.canhBaoUrl()?.loi === true);

  ngOnInit(): void {
    this.taiDanhSach();
  }

  taiDanhSach(): void {
    this.dangTai.set(true);
    this.loi.set(null);
    this.service.layDanhSach().subscribe({
      next: (menus) => {
        this.menus.set(menus);
        this.dangTai.set(false);
      },
      error: (error: unknown) => {
        this.loi.set(this.thongBaoLoi(error));
        this.dangTai.set(false);
      },
    });
  }

  batDauTao(): void {
    this.form.set({ ...FORM_MOI, thu_tu: this.menus().length + 1 });
    this.formMo.set(true);
    this.loi.set(null);
    this.thongBao.set(null);
  }

  batDauSua(menu: MenuApi): void {
    void this.router.navigate(['/menu', menu.id, 'sua']);
  }

  moChiTiet(menu: MenuApi, event: MouseEvent): void {
    if (event.target instanceof Element && event.target.closest('a, button')) return;
    void this.router.navigate(['/menu', menu.id]);
  }

  huyForm(): void {
    this.formMo.set(false);
  }

  doiTruong(truong: 'ten' | 'url' | 'nhom', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.form.update((form) => ({ ...form, [truong]: value }));
  }

  doiViTri(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as MenuApi['vi_tri'];
    this.form.update((form) => ({ ...form, vi_tri: value }));
  }

  doiVaiTro(vaiTro: VaiTroMenu, event: Event): void {
    const daChon = (event.target as HTMLInputElement).checked;
    this.form.update((form) => ({
      ...form,
      vai_tro: daChon
        ? [...new Set([...form.vai_tro, vaiTro])]
        : form.vai_tro.filter((item) => item !== vaiTro),
    }));
  }

  doiThuTu(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.form.update((form) => ({ ...form, thu_tu: Number.isFinite(value) ? value : 0 }));
  }

  doiTrangThaiForm(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.form.update((form) => ({ ...form, trang_thai: checked }));
  }

  luu(event: Event): void {
    event.preventDefault();
    const payload = this.payload();

    if (danhGiaDuongDanMenu(payload.url, routes) === 'khong-hop-le') {
      this.loi.set('Đường dẫn phải bắt đầu bằng “/” hoặc là địa chỉ http(s).');
      return;
    }

    this.dangLuu.set(true);
    this.loi.set(null);
    this.thongBao.set(null);

    this.service.tao(payload).subscribe({
      next: () => {
        this.dangLuu.set(false);
        this.formMo.set(false);
        this.thongBao.set('Đã tạo mục menu.');
        this.taiDanhSach();
      },
      error: (error: unknown) => {
        this.dangLuu.set(false);
        this.loi.set(this.thongBaoLoi(error));
      },
    });
  }

  doiTrangThai(menu: MenuApi): void {
    this.dangLuu.set(true);
    this.loi.set(null);
    this.service.capNhat(menu.id, { ...this.toInput(menu), trang_thai: !menu.trang_thai }).subscribe({
      next: () => {
        this.dangLuu.set(false);
        this.thongBao.set(menu.trang_thai ? 'Đã ẩn mục menu.' : 'Đã hiển thị mục menu.');
        this.taiDanhSach();
      },
      error: (error: unknown) => {
        this.dangLuu.set(false);
        this.loi.set(this.thongBaoLoi(error));
      },
    });
  }

  hoiXoa(menu: MenuApi): void {
    this.menuCanXoa.set(menu);
    this.loi.set(null);
  }

  xacNhanXoa(): void {
    const menu = this.menuCanXoa();
    if (!menu) return;

    this.dangLuu.set(true);
    this.loi.set(null);
    this.service.xoa(menu.id).subscribe({
      next: () => {
        this.dangLuu.set(false);
        this.menuCanXoa.set(null);
        this.thongBao.set('Đã xóa mục menu.');
        this.taiDanhSach();
      },
      error: (error: unknown) => {
        this.dangLuu.set(false);
        this.loi.set(this.thongBaoLoi(error));
      },
    });
  }

  tenVaiTro(vaiTro: MenuApi['vai_tro']): string {
    if (!vaiTro || vaiTro.length === 0) return 'Mọi vai trò';
    return VAI_TRO.filter((lua) => vaiTro.includes(lua.ma))
      .map((lua) => lua.nhan)
      .join(', ');
  }

  private payload(): MenuInput {
    const form = this.form();
    return {
      ten: form.ten.trim(),
      url: form.url.trim(),
      vi_tri: form.vi_tri,
      nhom: form.nhom.trim() || null,
      vai_tro: form.vai_tro.length > 0 ? [...form.vai_tro] : null,
      thu_tu: form.thu_tu,
      trang_thai: form.trang_thai,
    };
  }

  private toInput(menu: MenuApi): MenuInput {
    return {
      ten: menu.ten,
      url: menu.url,
      vi_tri: menu.vi_tri,
      nhom: menu.nhom,
      vai_tro: menu.vai_tro,
      thu_tu: menu.thu_tu,
      trang_thai: menu.trang_thai,
    };
  }

  private thongBaoLoi(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'Máy chủ không thể hoàn tất yêu cầu. Vui lòng thử lại.';
    }
    return 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.';
  }
}
