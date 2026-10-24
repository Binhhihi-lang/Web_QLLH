import { Component, signal } from '@angular/core';
import { AppAlert } from '@shared/ui/app-alert';
import { AppButton } from '@shared/ui/app-button';
import { AppCard } from '@shared/ui/app-card';
import { EmptyState } from '@shared/ui/empty-state';
import { LoadingState, SkeletonBlock } from '@shared/ui/loading';
import { PageHeader } from '@shared/ui/page-header';
import { Pagination } from '@shared/ui/pagination';
import { SearchInput } from '@shared/ui/search-input';
import { StatusBadge } from '@shared/ui/status-badge';

/**
 * Trang tra cứu design system.
 *
 * Vì sao có trang này: khi làm màn mới, câu hỏi hay gặp là "màu nào cho trạng
 * thái này", "nút biến thể nào". Mở trang này thấy ngay mọi token và mọi
 * trạng thái của component — nhanh hơn đọc file token.
 *
 * Không phải trang nghiệp vụ, chỉ để đối chiếu.
 */
@Component({
  selector: 'app-style-guide',
  standalone: true,
  imports: [
    AppAlert,
    AppButton,
    AppCard,
    EmptyState,
    LoadingState,
    SkeletonBlock,
    PageHeader,
    Pagination,
    SearchInput,
    StatusBadge,
  ],
  templateUrl: './style-guide.html',
  styleUrl: './style-guide.css',
})
export class StyleGuide {
  readonly toi = signal(false);
  readonly timKiem = signal('');

  readonly mauNen = [
    { ten: 'primary', bien: '--color-primary' },
    { ten: 'primary-hover', bien: '--color-primary-hover' },
    { ten: 'primary-soft', bien: '--color-primary-soft' },
    { ten: 'danger', bien: '--color-danger' },
    { ten: 'danger-soft', bien: '--color-danger-soft' },
    { ten: 'success', bien: '--color-success' },
    { ten: 'success-soft', bien: '--color-success-soft' },
    { ten: 'warning', bien: '--color-warning' },
    { ten: 'warning-soft', bien: '--color-warning-soft' },
    { ten: 'info', bien: '--color-info' },
    { ten: 'info-soft', bien: '--color-info-soft' },
  ];

  readonly mauNenTang = [
    { ten: 'bg', bien: '--color-bg' },
    { ten: 'surface', bien: '--color-surface' },
    { ten: 'surface-alt', bien: '--color-surface-alt' },
    { ten: 'border', bien: '--color-border' },
    { ten: 'border-soft', bien: '--color-border-soft' },
    { ten: 'ink', bien: '--color-ink' },
    { ten: 'ink-muted', bien: '--color-ink-muted' },
    { ten: 'ink-subtle', bien: '--color-ink-subtle' },
  ];

  readonly trangThai = [
    { value: 'ACTIVE', label: 'Đang hoạt động' },
    { value: 'INACTIVE', label: 'Tạm nghỉ' },
    { value: 'OPEN', label: 'Đang mở' },
    { value: 'CLOSED', label: 'Đã đóng' },
    { value: 'CANCELLED', label: 'Đã huỷ' },
    { value: 'REGISTERING', label: 'Đang đăng ký' },
    { value: 'CO_MAT', label: 'Có mặt' },
    { value: 'VANG_CO_PHEP', label: 'Vắng có phép' },
    { value: 'VANG_KHONG_PHEP', label: 'Vắng không phép' },
    { value: 'DAT', label: 'Đạt' },
    { value: 'KHONG_DAT', label: 'Không đạt' },
  ];

  doiCheDo(): void {
    this.toi.update((v) => !v);
    document.documentElement.dataset['theme'] = this.toi() ? 'dark' : 'light';
  }

  capNhatTimKiem(giaTri: string): void {
    this.timKiem.set(giaTri);
  }
}
