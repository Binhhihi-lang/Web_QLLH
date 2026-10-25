import { Pipe, PipeTransform } from '@angular/core';

/**
 * Đổi ngày ISO (`2026-10-25` hoặc `2026-10-25 09:15:00`) sang `25/10/2026`.
 *
 * Vì sao không dùng `date` pipe của Angular: pipe đó cần `locale` đăng ký qua
 * `LOCALE_ID` + `registerLocaleData`, và với chuỗi chỉ có ngày nó còn cộng/trừ
 * theo múi giờ nên `2026-10-25` có thể hiện thành `24/10/2026`. Ở đây chỉ cắt
 * chuỗi — backend đã trả đúng ngày nghiệp vụ, không có giờ để quy đổi.
 *
 * Giá trị rỗng trả `—` để bảng không có ô trắng trông như lỗi tải.
 */
@Pipe({ name: 'ngayVn', standalone: true })
export class NgayVnPipe implements PipeTransform {
  transform(giaTri: string | null | undefined): string {
    if (!giaTri) return '—';

    const [phanNgay] = giaTri.split(' ');
    const [nam, thang, ngay] = phanNgay.split('-');
    if (!nam || !thang || !ngay) return giaTri;

    return `${ngay}/${thang}/${nam}`;
  }
}
