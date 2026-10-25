import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { delay, mergeMap, of, throwError } from 'rxjs';
import { MockRegistry } from '@core/mock/mock-registry';
import { statusFor } from '@core/mock/mock-response';

/**
 * Chặn request và trả dữ liệu giả khi bật cờ useMock.
 *
 * Vì sao dùng interceptor thay vì thay service: service và component giữ
 * nguyên y như code thật (vẫn gọi HttpClient), nên tắt mock chỉ cần đổi một
 * cờ — không phải sửa code, không có hai nhánh song song trong service.
 */
export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  const registry = inject(MockRegistry);

  // Dùng `urlWithParams`, KHÔNG dùng `url`: `req.url` không chứa query string,
  // nên mọi bộ lọc/tìm kiếm đều không tới được mock và màn hình luôn hiện dữ
  // liệu chưa lọc mà không báo lỗi.
  const result = registry.resolve(req.method, req.urlWithParams, req.body);

  // Không có mock cho đường dẫn này -> để request đi tiếp ra mạng thật.
  if (result === undefined) {
    return next(req);
  }

  const body = result as { success: boolean; ma_loi?: string };
  const httpStatus = body.success
    ? req.method === 'POST' && req.url.endsWith('/students')
      ? 201
      : 200
    : statusFor(body.ma_loi ?? '');

  if (!body.success) {
    const error = new HttpErrorResponse({
      status: httpStatus,
      error: body,
      url: req.urlWithParams,
    });
    return of(null).pipe(
      delay(320),
      mergeMap(() => throwError(() => error)),
    );
  }

  // Độ trễ giả lập để thấy được trạng thái đang tải trên UI.
  return of(new HttpResponse({ status: httpStatus, body })).pipe(delay(320));
}

/** Dùng khi cần trả lỗi HTTP thật (ví dụ test nhánh lỗi). */
export function mockHttpError(maLoi: string, message: string): HttpErrorResponse {
  return new HttpErrorResponse({
    status: statusFor(maLoi),
    error: { success: false, message, ma_loi: maLoi, errors: null },
  });
}
