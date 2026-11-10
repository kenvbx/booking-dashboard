# Booking Dashboard — Requirements and backlog

## Trạng thái hiện tại

| ID | Actor | Yêu cầu / tiêu chí | Trạng thái |
|---|---|---|---|
| R1 | Admin/Staff | Login/logout qua Sanctum; request không xác thực bị từ chối | Có API + UI |
| R2 | Admin/Staff | Lịch tuần thứ Hai–Chủ nhật, ngày hôm nay, giờ Việt Nam; fetch hết trang trong range | Có; chưa chuyển tuần |
| R3 | Admin/Staff | Lọc status/staff và cập nhật số kết quả | Có UI; staff directory bị giới hạn |
| R4 | Admin | Tạo appointment có title, customer, staff, ngày/giờ; toast sau lưu | Có UI + API |
| R5 | Admin/Staff | Sửa appointment / đổi ngày giờ; hủy bắt buộc reason | Có UI + API; UI cần directory admin, duration cố định 45 phút |
| R6 | System | Validate thời gian và overlap trong transaction, khóa staff trên MySQL | Có API; test SQLite chưa chứng minh concurrency MySQL |
| R7 | Staff | Chỉ truy cập appointment được phân công; không chuyển sang staff khác | Có policy; test chặn reassignment trả 403 |
| R8 | System | Lưu created_by từ actor; audit log cho hành động quan trọng | Có API + test creator |
| R9 | Admin | CRUD customer/service/staff; deactivate staff | Có API; chưa có management UI |
| R10 | System | Kiểm tra lifecycle, reason khi chuyển cancelled/rescheduled; lưu history | Có API; UI đổi lịch chưa chuyển status |
| R11 | System | Retry create với idempotency key không tạo appointment mới | Có API; email jobs có thể dispatch lại |
| R12 | System | Queue confirmation và reminder, bounded retries | Có jobs; SMTP/worker triển khai và reminder khi đổi lịch chưa hoàn thiện |
| R13 | Admin/Staff | Metrics từ API với period rõ | Có; workspace-wide, chưa scope theo staff |
| R14 | System | CI build, API tests và browser smoke | Có; browser dùng fixtures, chưa full-stack E2E |

## Backlog ưu tiên

1. Cho staff lấy directory cần thiết theo quyền; kiểm tra create/edit bằng tài khoản staff thật.
2. Giữ duration khi edit, chọn status hợp lệ và ghi reason khi reschedule; hiển thị lỗi trong modal, chặn submit trùng.
3. Đồng bộ lại reminder sau đổi lịch và chống dispatch mail trùng khi retry create.
4. Thêm management UI Customers/Services/Team, xử lý loading/empty/error và pagination.
5. Browser tests edit/cancel, regression tải nhiều trang và smoke chạy cùng Laravel thật; kiểm tra concurrency trên MySQL.
6. Chuyển tuần, out-of-hours calendar layout và khả năng sử dụng bằng bàn phím/mobile.
7. Chuẩn bị Cloudflare Pages + Laravel host, môi trường production, queue worker, SMTP, health check, logs, backup và rollback.
8. Rà soát token storage, quyền xem metrics, tài khoản demo và chính sách dữ liệu trước public release.

## Release acceptance

Chỉ xác nhận release sau khi login → tạo → sửa → hủy được kiểm tra với API thật và đúng role, migration/config tái lập được, worker/mail được kiểm chứng, backup/restore có hướng dẫn, CI đạt và các giới hạn còn lại được công bố. Hiện chưa có bằng chứng đáp ứng đầy đủ các tiêu chí này.
