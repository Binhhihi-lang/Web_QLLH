import {
  Component,
  HostListener,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

/**
 * Header trên cùng.
 *
 * Có dropdown người dùng (hồ sơ, đổi mật khẩu, đăng xuất) vì cả ba đều là
 * hành động bắt buộc theo FR-01. Không dùng menu Material để giữ đồng nhất
 * với phần còn lại của layout.
 *
 * Dropdown đóng khi: bấm ra ngoài, nhấn Escape, hoặc chọn một mục. Chỉ đóng
 * khi bấm lại đúng nút là thói quen xấu — người dùng phải nhớ đã mở ở đâu.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="header">
      <button
        type="button"
        class="nut-menu"
        (click)="moMenu.emit()"
        aria-label="Mở menu"
      >
        <span class="material-icons">menu</span>
      </button>

      <div class="tim">
        <span class="material-icons ic">search</span>
        <input
          type="search"
          placeholder="Tìm sinh viên, lớp học phần, môn học…"
          aria-label="Tìm kiếm toàn hệ thống"
        />
      </div>

      <div class="phai">
        <span class="hoc-ky">{{ hocKy() }}</span>

        <!-- Chuyển chế độ sáng/tối -->
        <button
          type="button"
          class="nut-icon"
          (click)="doiCheDo()"
          [attr.aria-label]="toi() ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'"
          [title]="toi() ? 'Chế độ sáng' : 'Chế độ tối'"
        >
          <span class="material-icons">{{ toi() ? 'light_mode' : 'dark_mode' }}</span>
        </button>

        <button type="button" class="nut-icon" aria-label="Thông báo">
          <span class="material-icons">notifications</span>
          @if (soThongBao() > 0) {
            <span class="cham">{{ soThongBao() }}</span>
          }
        </button>

        <div class="nguoi-dung" #vungNguoiDung>
          <button
            type="button"
            class="nut-nguoi-dung"
            (click)="doiDropdown()"
            [attr.aria-expanded]="moDropdown()"
            aria-haspopup="menu"
          >
            <span class="avatar">{{ chuVietTat() }}</span>
            <span class="thong-tin">
              <strong>{{ hoTen() }}</strong>
              <small>{{ tenVaiTro() }}</small>
            </span>
            <span class="material-icons caret">expand_more</span>
          </button>

          @if (moDropdown()) {
            <!-- Lớp phủ trong suốt: bắt mọi cú bấm bên ngoài để đóng dropdown.
                 Dùng lớp phủ thay vì chỉ nghe document:click để cú bấm mở
                 dropdown không tự đóng nó ngay trong cùng một sự kiện. -->
            <div class="nen-dong" (click)="dongDropdown()" aria-hidden="true"></div>
            <div class="dropdown" role="menu">
              <div class="dau">
                <strong>{{ hoTen() }}</strong>
                <small>{{ email() }}</small>
              </div>
              <button type="button" class="muc" role="menuitem" (click)="chon('ho-so')">
                <span class="material-icons">person</span> Hồ sơ cá nhân
              </button>
              <button type="button" class="muc" role="menuitem" (click)="chon('doi-mat-khau')">
                <span class="material-icons">lock</span> Đổi mật khẩu
              </button>
              <div class="vach"></div>
              <button type="button" class="muc nguy-hiem" role="menuitem" (click)="chon('dang-xuat')">
                <span class="material-icons">logout</span> Đăng xuất
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `,
  styles: `
    .header {
      display: flex;
      align-items: center;
      gap: 14px;
      height: 58px;
      padding: 0 20px;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      flex: none;
    }

    .nut-menu,
    .nut-icon {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border: none;
      border-radius: var(--radius);
      background: transparent;
      color: var(--color-ink-muted);
      cursor: pointer;
      flex: none;
    }

    .nut-menu:hover,
    .nut-icon:hover {
      background: var(--color-surface-alt);
      color: var(--color-ink);
    }

    .nut-menu .material-icons,
    .nut-icon .material-icons {
      font-size: 20px;
    }

    /* Nút mở menu chỉ hiện ở mobile — desktop đã có sidebar thường trực. */
    .nut-menu {
      display: none;
    }

    .tim {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      max-width: 420px;
      background: var(--color-surface-alt);
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      padding: 0 11px;
      transition: border-color var(--dur) var(--ease);
    }

    .tim:focus-within {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    .tim .ic {
      font-size: 18px;
      color: var(--color-ink-subtle);
    }

    .tim input {
      flex: 1;
      min-width: 0;
      border: none;
      outline: none;
      background: transparent;
      font-family: var(--font-body);
      font-size: 13.5px;
      color: var(--color-ink);
      padding: 8px 0;
    }

    .tim input::placeholder {
      color: var(--color-ink-subtle);
    }

    .phai {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-left: auto;
    }

    .hoc-ky {
      font-size: 12.5px;
      color: var(--color-ink-muted);
      white-space: nowrap;
    }

    .nut-icon {
      position: relative;
    }

    .cham {
      position: absolute;
      top: 4px;
      right: 4px;
      min-width: 15px;
      height: 15px;
      padding: 0 3px;
      border-radius: 8px;
      background: var(--color-danger);
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 700;
      line-height: 15px;
      text-align: center;
    }

    .nguoi-dung {
      position: relative;
    }

    /* Lớp phủ trong suốt phủ toàn màn hình, nằm dưới dropdown nhưng trên
       phần còn lại. Bấm bất kỳ đâu ngoài dropdown là đóng. */
    .nen-dong {
      position: fixed;
      inset: 0;
      z-index: 40;
    }

    .nut-nguoi-dung {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 4px 8px 4px 4px;
      border: none;
      border-radius: var(--radius);
      background: transparent;
      cursor: pointer;
      font-family: var(--font-body);
    }

    .nut-nguoi-dung:hover {
      background: var(--color-surface-alt);
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      flex: none;
      background: var(--color-primary-soft);
      color: var(--color-on-primary-soft);
      font-weight: 700;
      font-size: 12px;
    }

    .thong-tin {
      display: flex;
      flex-direction: column;
      line-height: 1.3;
      text-align: left;
    }

    .thong-tin strong {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-ink);
      white-space: nowrap;
    }

    .thong-tin small {
      font-size: 11px;
      color: var(--color-ink-muted);
    }

    .caret {
      font-size: 18px;
      color: var(--color-ink-subtle);
    }

    .dropdown {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      z-index: 50;
      min-width: 218px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: 6px;
    }

    .dau {
      padding: 9px 10px 10px;
      border-bottom: 1px solid var(--color-border-soft);
      margin-bottom: 5px;
    }

    .dau strong {
      display: block;
      font-size: 13px;
      color: var(--color-ink);
    }

    .dau small {
      font-size: 11.5px;
      color: var(--color-ink-muted);
    }

    .muc {
      display: flex;
      align-items: center;
      gap: 9px;
      width: 100%;
      padding: 8px 10px;
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-ink);
      font-family: var(--font-body);
      font-size: 13px;
      text-align: left;
      cursor: pointer;
    }

    .muc:hover {
      background: var(--color-surface-alt);
    }

    .muc .material-icons {
      font-size: 17px;
      color: var(--color-ink-subtle);
    }

    .muc.nguy-hiem {
      color: var(--color-on-danger-soft);
    }

    .muc.nguy-hiem .material-icons {
      color: var(--color-danger);
    }

    .vach {
      height: 1px;
      background: var(--color-border-soft);
      margin: 5px 0;
    }

    @media (max-width: 900px) {
      .nut-menu {
        display: grid;
      }

      .hoc-ky,
      .thong-tin {
        display: none;
      }

      .tim {
        max-width: none;
      }
    }
  `,
})
export class Header {
  readonly hoTen = input('Chu Binh');
  readonly email = input('admin@university.edu.vn');
  readonly vaiTro = input('ADMIN');
  readonly hocKy = input('Học kỳ 1 · 2025-2026');
  readonly soThongBao = input(3);

  readonly moMenu = output<void>();
  readonly hanhDong = output<'ho-so' | 'doi-mat-khau' | 'dang-xuat'>();

  readonly moDropdown = signal(false);
  readonly toi = signal(false);

  private static readonly TEN_VAI_TRO: Record<string, string> = {
    ADMIN: 'Quản trị viên',
    GIANG_VIEN: 'Giảng viên',
    SINH_VIEN: 'Sinh viên',
  };

  readonly tenVaiTro = computed(() => Header.TEN_VAI_TRO[this.vaiTro()] ?? this.vaiTro());

  /** Lấy chữ đầu của hai từ cuối — "Nguyễn Văn An" → "VA". */
  readonly chuVietTat = computed(() => {
    const tu = this.hoTen().trim().split(/\s+/);
    if (tu.length === 1) return tu[0].slice(0, 2).toUpperCase();
    return (tu[tu.length - 2][0] + tu[tu.length - 1][0]).toUpperCase();
  });

  /** Escape đóng dropdown — chuẩn bàn phím cho mọi menu. */
  @HostListener('document:keydown.escape')
  khiNhanEscape(): void {
    this.moDropdown.set(false);
  }

  doiDropdown(): void {
    this.moDropdown.update((v) => !v);
  }

  dongDropdown(): void {
    this.moDropdown.set(false);
  }

  /**
   * Đổi chế độ sáng/tối.
   *
   * Ghi vào `documentElement.dataset.theme` — đúng nơi `_tokens.scss` đặt
   * khối `[data-theme='dark']`. Lưu vào localStorage để lần sau giữ nguyên.
   */
  doiCheDo(): void {
    const moi = !this.toi();
    this.toi.set(moi);
    document.documentElement.dataset['theme'] = moi ? 'dark' : 'light';
    try {
      localStorage.setItem('giao_dien', moi ? 'dark' : 'light');
    } catch {
      // Trình duyệt chặn localStorage (chế độ riêng tư) — bỏ qua, giao diện
      // vẫn đổi bình thường, chỉ không nhớ được lựa chọn.
    }
  }

  constructor() {
    // Khôi phục lựa chọn đã lưu. Đọc trong constructor vì chỉ chạy một lần.
    try {
      const daLuu = localStorage.getItem('giao_dien');
      if (daLuu === 'dark') {
        this.toi.set(true);
        document.documentElement.dataset['theme'] = 'dark';
      }
    } catch {
      // Không đọc được localStorage thì dùng mặc định sáng.
    }
  }

  chon(hanhDong: 'ho-so' | 'doi-mat-khau' | 'dang-xuat'): void {
    this.moDropdown.set(false);
    this.hanhDong.emit(hanhDong);
  }
}
