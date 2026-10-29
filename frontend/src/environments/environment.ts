export const environment = {
  production: false,
  /** Base path của Backend API — khớp docs/04-api-contract.md */
  apiBaseUrl: 'http://localhost:8000/api',
  /**
   * Bật mock layer khi Backend chưa có endpoint thật.
   * Tắt đi thì request đi thẳng ra apiBaseUrl, không phải sửa code.
   */
  useMock: false,
};
