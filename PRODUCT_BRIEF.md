# Booking Dashboard — Product brief

## Mục tiêu và giai đoạn

Helio là personal/demo project giúp quản lý lịch hẹn trong một workspace. Dự án đã nối React với Laravel API và đang hoàn thiện workflow cùng khả năng triển khai. Không có tuyên bố về khách hàng thật, doanh thu hay số người dùng production.

## Người dùng

- Admin: quản lý appointment qua UI; quản lý customer/service/staff qua API.
- Staff: API giới hạn xem/sửa/hủy appointment được phân công; không được chuyển sang staff khác. Frontend directory cho staff còn thiếu.
- Customer: bản ghi khách hàng và người nhận email; chưa có portal tự đặt lịch.

## Phạm vi đã có

Đăng nhập/đăng xuất, lịch tuần hiện tại theo giờ Việt Nam, tải toàn bộ trang appointment trong khoảng tuần, lọc status/staff, tạo/sửa/đổi ngày giờ/hủy appointment có lý do, metrics từ API. Backend có CRUD tài nguyên, policy, overlap locking, idempotency key, created_by, status history, audit log và queue email. CI có build, PHPUnit và browser smoke với API fixtures.

## Tiêu chí đánh giá

- Ngày trên calendar và giờ hiển thị dùng Asia/Ho_Chi_Minh.
- API kiểm tra quyền, validation và overlap trước khi lưu.
- Appointment mới gắn creator từ user đăng nhập; staff không tự đổi người phụ trách.
- UI tải đủ các trang trong tuần và phản hồi sau thao tác API.
- Test và giới hạn được công bố rõ trong README; không đồng nhất browser test mock API với full-stack E2E.

## Công việc tiếp theo

Ưu tiên hoàn thiện directory cho staff, edit duration/status workflow, màn hình quản lý Customers/Services/Team, test browser edit/cancel và full-stack smoke. Sau đó chuẩn bị deployment frontend/backend, queue/mail thực tế và backup/rollback. Reminder khi đổi lịch và chống gửi email trùng cần được xử lý trước khi dựa vào thông báo thực tế.

## Ngoài phạm vi hiện tại

Thanh toán, multi-tenant, portal khách hàng, SMS, đồng bộ Google Calendar và mobile app chưa được triển khai. Dữ liệu seed chỉ phục vụ demo.
