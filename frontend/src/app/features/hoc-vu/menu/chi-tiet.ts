import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MenuApi, MenuInput, MenuService } from '@core/services/menu.service';
import { danhGiaDuongDanMenu } from '@core/utils/menu-url';
import { routes } from '../../../app.routes';
import { AppAlert } from '@shared/ui/app-alert';
import { PageHeader } from '@shared/ui/page-header';

type VaiTroMenu = 'ADMIN' | 'GIANG_VIEN' | 'SINH_VIEN';

const VAI_TRO: ReadonlyArray<{ ma: VaiTroMenu; nhan: string }> = [
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

@Component({
  selector: 'app-menu-chi-tiet',
  standalone: true,
  imports: [AppAlert, PageHeader, RouterLink],
  template: `
    @if (menu(); as item) {
      <app-page-header
        [title]="dangSua ? 'Sửa menu' : item.ten"
        [description]="dangSua ? 'Cập nhật thông tin và quyền hiển thị của mục menu.' : 'Thông tin cấu hình mục điều hướng.'"
      >
        <button class="nut nut-phu" type="button" routerLink="/menu">
          <span class="material-icons" aria-hidden="true">arrow_back</span>
          Danh sách menu
        </button>
        @if (!dangSua) {
          <button class="nut nut-chinh" type="button" [routerLink]="['/menu', item.id, 'sua']">
            <span class="material-icons" aria-hidden="true">edit</span>
            Sửa menu
          </button>
        }
      </app-page-header>

      @if (loi()) {
        <app-alert muc="danger" title="Không thể hoàn tất thao tác">{{ loi() }}</app-alert>
      }

      @if (dangSua) {
        <section class="the" aria-labelledby="tieu-de-form-menu">
          <h2 id="tieu-de-form-menu">Thông tin menu</h2>
          <form (submit)="luu($event)">
            <label>
              Tên menu
              <input name="ten" required maxlength="100" [value]="form().ten" (input)="doiTruong('ten', $event)" />
            </label>
            <label>
              Đường dẫn
              <input name="url" required maxlength="2048" [value]="form().url" (input)="doiTruong('url', $event)" />
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
              <input name="nhom" maxlength="100" [value]="form().nhom" (input)="doiTruong('nhom', $event)" />
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
              <small class="goi-y-vai-tro">Không chọn ô nào = mọi vai trò đều thấy.</small>
            </fieldset>
            <label>
              Thứ tự
              <input name="thu_tu" type="number" step="1" [value]="form().thu_tu" (input)="doiThuTu($event)" />
            </label>
            <label class="trang-thai">
              <input name="trang_thai" type="checkbox" [checked]="form().trang_thai" (change)="doiTrangThai($event)" />
              Đang hiển thị
            </label>
            <div class="hanh-dong">
              <button class="nut nut-chinh" type="submit" [disabled]="dangLuu()">
                {{ dangLuu() ? 'Đang lưu…' : 'Lưu thay đổi' }}
              </button>
              <button class="nut nut-phu" type="button" [routerLink]="['/menu', item.id]">Hủy</button>
            </div>
          </form>
        </section>
      } @else {
        <section class="the thong-tin" aria-label="Thông tin menu">
          <div><small>Tên menu</small><strong>{{ item.ten }}</strong></div>
          <div><small>Đường dẫn ứng dụng</small><code>{{ item.url }}</code></div>
          <div>
            <small>Vị trí</small>
            <strong>{{ item.vi_tri === 'sidebar' ? 'Thanh điều hướng' : 'Đầu trang' }}</strong>
          </div>
          <div><small>Nhóm</small><strong>{{ item.nhom || 'Chưa phân nhóm' }}</strong></div>
          <div><small>Vai trò được xem</small><strong>{{ tenVaiTro(item.vai_tro) }}</strong></div>
          <div><small>Thứ tự</small><strong>{{ item.thu_tu }}</strong></div>
          <div><small>Trạng thái</small><strong>{{ item.trang_thai ? 'Đang hiển thị' : 'Đang ẩn' }}</strong></div>
        </section>
      }
    } @else if (loi()) {
      <app-alert muc="danger" title="Không thể tải menu">
        {{ loi() }}
        <button class="nut-thu-lai" type="button" (click)="taiMenu()">Thử tải lại</button>
      </app-alert>
      <button class="nut nut-phu" type="button" routerLink="/menu">Quay lại danh sách</button>
    } @else {
      <p class="trang-thai" role="status" aria-busy="true">Đang tải thông tin menu…</p>
    }
  `,
  styles: `
    :host{display:block}.nut{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:38px;padding:8px 13px;border:1px solid transparent;border-radius:var(--radius);font:600 var(--text-small) var(--font-body);text-decoration:none;cursor:pointer}.nut:disabled{opacity:.55;cursor:not-allowed}.nut-chinh{background:var(--color-primary);color:var(--color-on-primary)}.nut-phu{background:var(--color-surface);border-color:var(--color-border);color:var(--color-ink)}.the{margin-bottom:16px;padding:16px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)}h2{margin:0 0 14px;color:var(--color-ink);font-size:var(--text-h3);font-weight:600}form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}label{display:grid;gap:6px;color:var(--color-ink-muted);font-size:var(--text-caption);font-weight:600}input:not([type=checkbox]),select{width:100%;min-height:38px;padding:8px 10px;border:1px solid var(--color-border);border-radius:var(--radius);background:var(--color-surface);color:var(--color-ink);font:400 var(--text-small) var(--font-body)}input:focus,select:focus{outline:2px solid var(--color-primary);outline-offset:1px}.trang-thai{display:flex;align-items:center;gap:8px;padding-top:24px}.trang-thai input{width:16px;height:16px;accent-color:var(--color-primary)}.hanh-dong{display:flex;align-items:center;gap:8px;grid-column:1/-1}.thong-tin{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;padding:0;overflow:hidden;background:var(--color-border)}.thong-tin div{display:grid;gap:6px;padding:18px;background:var(--color-surface)}small{color:var(--color-ink-muted);font-size:var(--text-caption)}strong,code{font-size:var(--text-small);overflow-wrap:anywhere}.trang-thai[role=status]{padding:16px;color:var(--color-ink-muted);font-size:var(--text-small)}.nut-thu-lai{padding:5px 7px;border:0;background:transparent;color:var(--color-primary);font:600 var(--text-caption) var(--font-body);cursor:pointer}.canh-bao-url{color:var(--color-on-warning-soft);font-size:var(--text-caption);font-weight:500;line-height:1.5}.canh-bao-url.la-loi{color:var(--color-danger)}.vai-tro{grid-column:1/-1;margin:0;padding:10px 12px 12px;border:1px solid var(--color-border);border-radius:var(--radius)}.vai-tro legend{padding:0 6px;color:var(--color-ink-muted);font-size:var(--text-caption);font-weight:600}.vai-tro .o-vai-tro{display:inline-flex;align-items:center;gap:7px;margin-right:16px;color:var(--color-ink);font-size:var(--text-small);font-weight:400;cursor:pointer}.vai-tro .o-vai-tro input{width:16px;height:16px;accent-color:var(--color-primary)}.goi-y-vai-tro{display:block;margin-top:6px;color:var(--color-ink-muted);font-size:var(--text-caption);font-weight:400}@media(max-width:800px){form,.thong-tin{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.the{padding:12px}form,.thong-tin{grid-template-columns:1fr}.trang-thai{padding-top:0}.hanh-dong{flex-wrap:wrap}}
  `,
})
export class MenuChiTiet {
  readonly VAI_TRO = VAI_TRO;
  private readonly service = inject(MenuService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly id = Number(this.route.snapshot.paramMap.get('id'));

  readonly dangSua = this.route.snapshot.data['editMode'] === true;
  readonly menu = signal<MenuApi | null>(null);
  readonly loi = signal<string | null>(null);
  readonly dangLuu = signal(false);
  readonly form = signal<MenuForm>({
    ten: '',
    url: '',
    vi_tri: 'sidebar',
    nhom: '',
    vai_tro: [],
    thu_tu: 0,
    trang_thai: true,
  });

  /** Cùng quy tắc với màn danh sách: đường dẫn chưa có trang thì cảnh báo, không chặn. */
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

  constructor() {
    this.taiMenu();
  }

  taiMenu(): void {
    this.loi.set(null);
    this.service.layMot(this.id).subscribe({
      next: (menu) => {
        this.menu.set(menu);
        this.form.set({
          ten: menu.ten,
          url: menu.url,
          vi_tri: menu.vi_tri,
          nhom: menu.nhom ?? '',
          vai_tro: menu.vai_tro ?? [],
          thu_tu: menu.thu_tu,
          trang_thai: menu.trang_thai,
        });
      },
      error: (error: unknown) => this.loi.set(this.thongBaoLoi(error)),
    });
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

  doiTrangThai(event: Event): void {
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
    this.service.capNhat(this.id, payload).subscribe({
      next: () => {
        this.dangLuu.set(false);
        void this.router.navigate(['/menu', this.id]);
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

  private thongBaoLoi(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'Máy chủ không thể hoàn tất yêu cầu. Vui lòng thử lại.';
    }
    return 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.';
  }
}
