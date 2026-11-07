import { Component } from '@angular/core';
import { PageHeader } from '@shared/ui/page-header';

@Component({
  selector: 'app-nhat-ky',
  standalone: true,
  imports: [PageHeader],
  template: `
    <app-page-header
      title="Nhật ký hệ thống"
      description="Thông tin về các hoạt động trong hệ thống."
    />

    <section class="trang-thai" aria-labelledby="tieu-de-trang-thai">
      <div class="bieu-tuong" aria-hidden="true">
        <span class="material-icons">history</span>
      </div>
      <div class="noi-dung">
        <span class="nhan">Trạng thái</span>
        <h2 id="tieu-de-trang-thai">Nhật ký hiện chưa khả dụng</h2>
        <p>Chức năng này đang được hoàn thiện. Vui lòng quay lại sau.</p>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .trang-thai {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 22px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }

    .bieu-tuong {
      display: grid;
      width: 52px;
      height: 52px;
      flex: none;
      place-items: center;
      border-radius: var(--radius);
      background: var(--color-primary-soft);
      color: var(--color-primary);
    }

    .bieu-tuong .material-icons {
      font-size: 26px;
    }

    .noi-dung {
      min-width: 0;
      flex: 1;
    }

    .nhan {
      color: var(--color-ink-muted);
      font-size: var(--text-caption);
    }

    h2,
    p {
      margin: 0;
    }

    h2 {
      margin-top: 3px;
      color: var(--color-ink);
      font-size: var(--text-h3);
      font-weight: 650;
    }

    p {
      max-width: 680px;
      margin-top: 5px;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
      line-height: 1.6;
    }

    @media (max-width: 600px) {
      .trang-thai {
        align-items: flex-start;
        flex-wrap: wrap;
        padding: 16px;
      }
    }
  `,
})
export class NhatKyPage {}
