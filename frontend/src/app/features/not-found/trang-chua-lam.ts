import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MenuService } from '@core/services/menu.service';
import { menuKhopDuongDan } from '@core/utils/menu-url';
import { DangXayDung } from '@shared/ui/dang-xay-dung';

/**
 * Màn hình đã khai trong bảng menu nhưng chưa có code.
 *
 * Route này CHỈ khớp khi `laTrangChuaLamGuard` xác nhận URL có trong menu (xem
 * `app.routes.ts`), nên ở đây không cần nhánh 404 nữa. Vẫn giữ layout: người
 * dùng bấm một mục menu chưa làm xong thì phải điều hướng tiếp được, khác với
 * gõ sai đường dẫn.
 *
 * Tên mục menu đọc từ `menus` chứ không từ `route.data`: menu do admin tự thêm
 * lúc chạy, không thể khai trước trong file route.
 */
@Component({
  selector: 'app-trang-chua-lam',
  standalone: true,
  imports: [DangXayDung],
  template: `
    <app-dang-xay-dung [ma]="tenMenu()" [title]="tenMenu()" [chiTiet]="chiTiet()" />
  `,
})
export class TrangChuaLam implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly menuService = inject(MenuService);

  readonly tenMenu = signal('Đang xây dựng');
  readonly chiTiet = signal('Màn hình này đang được chuẩn bị.');

  ngOnInit(): void {
    const duongDan = `/${this.route.snapshot.url.map((segment) => segment.path).join('/')}`;

    this.menuService.layMenuHienThi().subscribe({
      next: (menus) => {
        const menu = menus.find((item) => menuKhopDuongDan(item.url, duongDan));
        if (!menu) return;

        this.tenMenu.set(menu.ten);
        this.chiTiet.set(`Nội dung trang ${this.vietThuong(menu.ten)} đang được chuẩn bị.`);
      },
    });
  }

  private vietThuong(ten: string): string {
    return ten.charAt(0).toLocaleLowerCase('vi') + ten.slice(1);
  }
}
