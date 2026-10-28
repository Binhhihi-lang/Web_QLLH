import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Trang 404 — đường dẫn không thuộc ứng dụng.
 *
 * Đứng riêng, KHÔNG dùng `MainLayout`: sidebar/header ngụ ý một hệ thống vẫn
 * dùng được, trong khi URL này không tồn tại. Người dùng có một lối ra duy
 * nhất là về trang tổng quan.
 *
 * Không nhầm với `TrangChuaLam`: trang này dành cho URL KHÔNG ai khai, còn màn
 * chưa làm là URL có trong bảng menu nhưng chưa có code.
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="man-hinh" aria-labelledby="tieu-de-404">
      <div class="hop">
        <div class="thuong-hieu">
          <span class="logo">Q</span>
          <span>Hệ thống quản lý lớp học</span>
        </div>

        <p class="ma" aria-hidden="true">404</p>
        <h1 id="tieu-de-404">Không tìm thấy trang</h1>
        <p class="mo-ta">
          Đường dẫn <code>{{ duongDan() }}</code> không tồn tại trong ứng dụng.
          Hãy kiểm tra lại địa chỉ hoặc quay về trang tổng quan.
        </p>

        <a class="nut" routerLink="/dashboard">Về trang tổng quan</a>

        <p class="goi-y">Nếu bạn cho rằng đây là lỗi, hãy báo quản trị viên hệ thống.</p>
      </div>
    </main>
  `,
  styles: `
    .man-hinh{display:grid;place-items:center;min-height:100vh;padding:24px;background:radial-gradient(circle at 50% 0%,var(--color-primary-soft),transparent 60%),var(--color-bg)}.hop{width:min(100%,520px);padding:32px;text-align:center;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-xl);box-shadow:var(--shadow-lg)}.thuong-hieu{display:flex;align-items:center;justify-content:center;gap:9px;margin-bottom:24px;color:var(--color-ink-muted);font-size:var(--text-small);font-weight:600}.logo{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:var(--color-primary);color:var(--color-on-primary);font-family:var(--font-heading);font-size:13px;font-weight:700}.ma{margin:0;color:var(--color-primary);font-family:var(--font-heading);font-size:64px;font-weight:700;line-height:1;letter-spacing:-.02em;opacity:.28}h1{margin:8px 0 10px;color:var(--color-ink);font-size:var(--text-h2);font-weight:600}.mo-ta{margin:0 auto 22px;max-width:400px;color:var(--color-ink-muted);font-size:var(--text-small);line-height:1.6}code{font-size:var(--text-caption);overflow-wrap:anywhere}.nut{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:9px 18px;border-radius:var(--radius);background:var(--color-primary);color:var(--color-on-primary);font:600 var(--text-small) var(--font-body);text-decoration:none}.nut:hover{background:var(--color-primary-hover)}.goi-y{margin:20px 0 0;color:var(--color-ink-subtle);font-size:var(--text-caption)}@media(max-width:560px){.hop{padding:22px}.ma{font-size:48px}}
  `,
})
export class KhongTimThayTrang {
  readonly duongDan = () => decodeURI(window.location.pathname);
}
