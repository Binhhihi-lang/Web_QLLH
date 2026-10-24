/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      // Màu trỏ vào biến token — KHÔNG khai mã hex ở đây.
      // Nhờ vậy Tailwind và Material dùng chung một nguồn, và chế độ tối
      // chỉ cần đổi biến là cả hai hệ theo.
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          bright: 'var(--color-primary-bright)',
          soft: 'var(--color-primary-soft)',
          on: 'var(--color-on-primary)',
          'on-soft': 'var(--color-on-primary-soft)',
        },
        accent: {
          DEFAULT: 'var(--color-danger)',
          hover: 'var(--color-danger-hover)',
          on: 'var(--color-on-primary)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          hover: 'var(--color-success-hover)',
          soft: 'var(--color-success-soft)',
          'on-soft': 'var(--color-on-success-soft)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          hover: 'var(--color-warning-hover)',
          soft: 'var(--color-warning-soft)',
          'on-soft': 'var(--color-on-warning-soft)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          hover: 'var(--color-danger-hover)',
          soft: 'var(--color-danger-soft)',
          'on-soft': 'var(--color-on-danger-soft)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          hover: 'var(--color-info-hover)',
          soft: 'var(--color-info-soft)',
          'on-soft': 'var(--color-on-info-soft)',
        },
        bg: 'var(--color-bg)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          alt: 'var(--color-surface-alt)',
        },
        // Nền tối (sidebar, header tối, footer). Tách khỏi `ink` vì đây là
        // MÀU NỀN, không phải màu chữ.
        dark: {
          DEFAULT: 'var(--color-dark)',
          2: 'var(--color-dark-2)',
          line: 'var(--color-dark-line)',
        },
        'on-dark': {
          DEFAULT: 'var(--color-on-dark)',
          muted: 'var(--color-on-dark-muted)',
          subtle: 'var(--color-on-dark-subtle)',
        },
        ink: {
          DEFAULT: 'var(--color-ink)',
          muted: 'var(--color-ink-muted)',
          subtle: 'var(--color-ink-subtle)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          soft: 'var(--color-border-soft)',
        },
      },

      fontFamily: {
        heading: 'var(--font-heading)',
        body: 'var(--font-body)',
      },

      fontSize: {
        display: 'var(--text-display)',
        h1: 'var(--text-h1)',
        h2: 'var(--text-h2)',
        h3: 'var(--text-h3)',
        body: 'var(--text-body)',
        small: 'var(--text-small)',
        caption: 'var(--text-caption)',
      },

      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },

      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        lg: 'var(--shadow-lg)',
      },

      transitionDuration: {
        fast: 'var(--dur-fast)',
        DEFAULT: 'var(--dur)',
      },

      transitionTimingFunction: {
        DEFAULT: 'var(--ease)',
      },
    },
  },
  plugins: [],
};
