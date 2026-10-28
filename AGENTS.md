# Quy tắc cộng tác cho dự án QLLH

## Quy tắc của người dùng

- Người dùng tự commit và push. Không bao giờ commit hoặc push thay người dùng.
- Khi bắt đầu một công việc code, tạo và checkout nhánh mới trước khi chỉnh sửa. Dùng tên nhánh ngắn, tiếng Việt không dấu, mô tả rõ phạm vi công việc.
- Nếu cần gợi ý commit message, viết bằng tiếng Việt, ngắn gọn, nêu đúng thay đổi; không tự tạo commit.
- Với công việc frontend, ưu tiên giao diện đẹp, bám design system hiện có, responsive trên các kích thước màn hình và chất lượng Lighthouse tốt.
- Sau mỗi phần việc hoàn tất, cập nhật tiến độ rõ ràng cho người dùng.
- Trước khi bàn giao thay đổi frontend, xác nhận `ng build` chạy được; khi yêu cầu có chạy ứng dụng, xác nhận `ng serve` khởi động được. Không tuyên bố đã chạy nếu chưa thực sự chạy.

## Quy ước frontend của repo

- Frontend Angular nằm trong `frontend/`; chạy lệnh npm từ thư mục này.
- Tuân theo design tokens ở `frontend/src/_tokens.scss`, Material theme và Tailwind config hiện có.
- Bám hợp đồng FE/BE tại `docs/04-api-contract.md` và đặc tả màn hình tại `docs/05-screens.md`, `docs/phan-cong-cong-viec.md` đã cập nhật lại .
- Nhóm học vụ thuộc phạm vi Đạt: routes/menu trong `frontend/src/app/routes/hoc-vu.*`; tránh sửa file thuộc nhóm đào tạo nếu không cần thiết.
- Không sửa `.vscode/settings.json` trừ khi người dùng yêu cầu rõ ràng.
