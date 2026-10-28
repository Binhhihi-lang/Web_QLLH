import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DaoTaoRegistry } from '@core/mock/registry/dao-tao.registry';
import { HocVuRegistry } from '@core/mock/registry/hoc-vu.registry';
import { AuthRegistry } from '@core/mock/registry/auth.registry';
import { MenuRegistry } from '@core/mock/registry/menu.registry';
import { ApiResponse, readParams, stripOrigin } from '@core/mock/mock-response';

/**
 * Sổ tra cứu mock: chỉ ĐIỀU PHỐI, không chứa dữ liệu.
 *
 * Vì sao tách: hai bạn FE làm song song trên hai nhóm màn hình. Nếu mọi mock
 * nằm trong một file thì ngày nào cũng conflict. Mỗi nhóm một registry riêng
 * (`dao-tao.registry.ts`, `hoc-vu.registry.ts`), mỗi người sở hữu một file;
 * file này chỉ chuyển tiếp nên gần như không bao giờ phải sửa.
 *
 * Thêm nhóm mới: tạo registry con, thêm một dòng vào mảng `nguon` dưới đây.
 *
 * Đường dẫn dùng tiếng Anh đúng docs/04-api-contract.md (`/students`,
 * `/subjects`…), dù trường JSON là tiếng Việt.
 *
 * Trả `undefined` khi không có mock cho đường dẫn → interceptor để request đi
 * tiếp ra mạng thật.
 */
@Injectable()
export class MockRegistry {
  private readonly daoTao = new DaoTaoRegistry();
  private readonly hocVu = new HocVuRegistry();
  private readonly auth = new AuthRegistry();
  private readonly menu = new MenuRegistry();

  private readonly nguon = [this.daoTao, this.hocVu, this.menu];

  resolve(
    method: string,
    urlWithParams: string,
    body: unknown = null,
    authorization: string | null = null,
  ): ApiResponse<unknown> | Record<string, unknown> | undefined {
    const path = stripOrigin(urlWithParams).split('?')[0];
    const params: HttpParams = readParams(urlWithParams);
    const ketQuaAuth = this.auth.resolve(method, path, body, authorization);
    if (ketQuaAuth !== undefined) return ketQuaAuth;

    // Vai trò người gọi — registry cần để lọc dữ liệu đúng như backend. Thiếu
    // nó thì mock trả về cả mục mà vai trò đó không có quyền thấy.
    const vaiTro = this.auth.vaiTroTheoToken(authorization);

    for (const nguon of this.nguon) {
      const ketQua = nguon.resolve(method, path, params, body, vaiTro);
      if (ketQua !== undefined) {
        return ketQua as ApiResponse<unknown>;
      }
    }

    return undefined;
  }
}
