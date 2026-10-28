import { Routes } from '@angular/router';

function routePatterns(routes: Routes, prefix: string[] = []): string[][] {
  const patterns: string[][] = [];

  for (const route of routes) {
    const path = route.path ?? '';
    if (path === '**' || route.matcher) continue;

    const segments = path ? path.split('/').filter(Boolean) : [];
    const fullPath = [...prefix, ...segments];
    const hasChildren = Boolean(route.children?.length || route.loadChildren);
    const isTerminal =
      Boolean(route.redirectTo) || (!hasChildren && Boolean(route.component || route.loadComponent));

    if (isTerminal) patterns.push(fullPath);
    if (route.children) patterns.push(...routePatterns(route.children, fullPath));
  }

  return patterns;
}

function matchesPattern(path: string[], pattern: string[]): boolean {
  return (
    path.length === pattern.length &&
    pattern.every((segment, index) => segment.startsWith(':') || segment === path[index])
  );
}

export function laDuongDanMenuHopLe(url: string, routes: Routes): boolean {
  const value = url.trim();

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname);
    } catch {
      return false;
    }
  }

  if (!value.startsWith('/') || value.startsWith('//')) return false;

  const pathname = value.split(/[?#]/, 1)[0];
  let segments: string[];
  try {
    segments = pathname
      .split('/')
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment));
  } catch {
    return false;
  }

  return routePatterns(routes).some((pattern) => matchesPattern(segments, pattern));
}

/** Đường dẫn nội bộ đúng hình dạng, chưa xét có route hay chưa. */
export function laDuongDanNoiBoHopLe(url: string): boolean {
  const value = url.trim();
  if (!value.startsWith('/') || value.startsWith('//')) return false;
  if (/[\x00-\x20\\]/.test(value)) return false;

  try {
    value
      .split(/[?#]/, 1)[0]
      .split('/')
      .filter(Boolean)
      .forEach((segment) => decodeURIComponent(segment));
  } catch {
    return false;
  }

  return true;
}

export type TrangThaiDuongDanMenu = 'hop-le' | 'chua-co-trang' | 'khong-hop-le';

/**
 * So khớp URL menu với đường dẫn đang mở, bỏ query, fragment và dấu `/` cuối.
 *
 * Chỉ nhận đường dẫn nội bộ: menu trỏ ra ngoài (http, mailto) không bao giờ
 * khớp route, nên không được coi là "trang chưa làm".
 */
export function menuKhopDuongDan(urlMenu: string, duongDan: string): boolean {
  if (!urlMenu.startsWith('/') || urlMenu.startsWith('//')) return false;
  return chuanHoaDuongDan(urlMenu) === chuanHoaDuongDan(duongDan);
}

function chuanHoaDuongDan(url: string): string {
  return url.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
}

/**
 * Ba kết quả để form menu quyết định: lưu bình thường, lưu kèm cảnh báo, hay
 * chặn.
 *
 * `chua-co-trang` là trạng thái hợp lệ có chủ đích: admin được thêm menu cho
 * màn hình chưa code xong, và bấm vào menu đó sẽ ra trang "chưa làm" thay vì
 * 404. Chặn ở đây thì không ai khai trước được menu cho tuần sau.
 */
export function danhGiaDuongDanMenu(url: string, routes: Routes): TrangThaiDuongDanMenu {
  if (laDuongDanMenuHopLe(url, routes)) return 'hop-le';
  if (laDuongDanNoiBoHopLe(url)) return 'chua-co-trang';
  return 'khong-hop-le';
}
