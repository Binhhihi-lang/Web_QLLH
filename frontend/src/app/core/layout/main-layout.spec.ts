import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { MenuService } from '@core/services/menu.service';
import { MainLayout } from './main-layout';

/**
 * Khung ứng dụng — khoá lỗi "cuộn xuống thấy khoảng trắng".
 *
 * Người dùng báo 2026-11-11: cuộn trang dashboard sinh viên/giảng viên xuống
 * thì header và sidebar trôi mất, bên dưới là khoảng trắng lớn. Đo được:
 * `document.scrollingElement.scrollHeight` = **1372px** trong khi viewport
 * 582px → 790px trắng, và cuộn được cả cửa sổ.
 *
 * Nguyên nhân: `main.noi-dung` có `overflow-y: auto` với nội dung 2423px nhưng
 * không có containing block gần nhất, nên vùng cuộn của nó bị tính vào
 * document; `overflow: hidden` trên `.khung` không chặn được. Thêm
 * `position: relative` cho `.khung` thì document về đúng viewport.
 *
 * jsdom không tính bố cục thật, nên test đọc khai báo CSS của component.
 */
describe('MainLayout', () => {
  const styles = (): string =>
    (Array.from(document.querySelectorAll('style'))
      .map((o) => o.textContent ?? '')
      .join('\n')
      // Angular gắn scope vào selector; bỏ để so khớp như mã nguồn.
      .replace(/\[_ng(content|host)-[^\]]*\]/g, '')
      .replace(/\s+/g, ' '));

  function tao() {
    TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideRouter([]),
        {
          provide: MenuService,
          useValue: {
            layMenuSidebar: vi.fn(() => of([])),
            layMenuHeader: vi.fn(() => of([])),
            phienBan: signal(0),
          },
        },
        {
          provide: AuthService,
          useValue: {
            nguoiDung: () => ({ id: 1, name: 'Test', email: 't@e.vn', vai_tro: 'ADMIN' }),
            dangXuat: vi.fn(() => of(null)),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(MainLayout);
    fixture.detectChanges();
    return fixture;
  }

  it('khung có position relative để vùng cuộn của main không đẩy document', () => {
    tao();
    const css = styles();
    // Lấy khối .khung, bỏ chú thích để không khớp chữ trong comment.
    const khongChuThich = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const khoi = khongChuThich.match(/\.khung \{[^}]*\}/)?.[0] ?? '';

    expect(khoi).toBeTruthy();
    expect(khoi).toContain('overflow: hidden');
    expect(khoi).toContain('position: relative');
    expect(khoi).toContain('height: 100vh');
  });

  it('main vẫn là vùng cuộn nội bộ duy nhất', () => {
    tao();
    const khongChuThich = styles().replace(/\/\*[\s\S]*?\*\//g, '');
    const khoi = khongChuThich.match(/\.noi-dung \{[^}]*\}/)?.[0] ?? '';
    expect(khoi).toContain('overflow-y: auto');
    expect(khoi).toContain('flex: 1');
  });
});
