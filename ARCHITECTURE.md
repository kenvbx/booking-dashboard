# Architecture

## Thành phần và data flow

React JavaScript/JSX + Vite gọi Laravel 13 REST API qua fetch và Sanctum bearer token. UI dùng Lucide và CSS; chưa chuyển sang TypeScript. MySQL là database mục tiêu, PHPUnit dùng SQLite. Queue database xử lý email. Đây là modular monolith cho personal/demo workspace.

Login trả token và user; frontend lưu localStorage. Calendar gọi appointments theo from/to, duyệt page đến meta.last_page (100 records/request); directory và metrics được fetch song song. Save gọi POST/PATCH; cancel gọi DELETE kèm reason, sau đó reload workspace. Một số directory lỗi được frontend thay bằng mảng rỗng, nên không nên hiểu workspace tải được là mọi endpoint đều thành công.

## Authorization và dữ liệu

Admin có CRUD customer/service/staff. Staff chỉ có appointment scope theo profile; controller kiểm tra appointment hiện tại, và policy reassign kiểm tra target staff khi update. API gán created_by từ user đăng nhập khi tạo, không lấy creator từ client. Metrics hiện là workspace-wide cho cả admin/staff.

## Booking consistency

Create và update thời gian/staff chạy transaction, lock staff_profiles trước overlap query; cancelled bookings không chặn lịch. MySQL row locking là cơ chế mục tiêu; SQLite tests không chứng minh behavior khi ghi đồng thời. Update/cancel còn cần kiểm tra thêm về concurrent mutations.

Idempotency key có unique constraint và lookup khi create; request trùng trả appointment cũ. Mail dispatch xảy ra sau transaction kể cả khi trả record cũ, nên idempotency hiện chỉ bao phủ bản ghi appointment, chưa bao phủ email side effects.

Lifecycle API: pending → confirmed/cancelled; confirmed → completed/cancelled/rescheduled; rescheduled → pending/confirmed/cancelled. completed/cancelled không chuyển tiếp. Chuyển cancelled/rescheduled cần reason. UI hiện sửa thời gian trực tiếp, không chuyển rescheduled và không có status selector.

## Timezone và date range

Laravel APP_TIMEZONE mặc định Asia/Ho_Chi_Minh. Frontend dùng cùng timezone cố định và offset +07:00; khi tạo gửi timezone kèm ISO datetime. Ngày/giờ hiển thị không lấy timezone máy người dùng. Đổi APP_TIMEZONE đơn lẻ chưa làm frontend tự đổi theo.

API range hiện yêu cầu starts_at >= from và ends_at <= cuối ngày to theo config ứng dụng. Đây là range chứa trọn appointment, chưa phải truy vấn mọi appointment giao nhau với khoảng ngày. Calendar truyền thứ Hai và Chủ nhật. Chưa có migration chuẩn hóa timestamp lịch sử sau đổi timezone; dữ liệu cũ cần được kiểm tra trước chuyển môi trường.

## Queue và failure behavior

Creation dispatch confirmation và delayed reminder một giờ trước starts_at. Jobs có tối đa ba attempts, backoff [60, 300, 900] giây; bỏ qua appointment bị hủy hoặc thiếu email. Edit không đổi thời điểm chạy của reminder đã queue. Local mailer ghi log; SMTP và worker cần cấu hình riêng.

Validation/overlap trả HTTP 422 với field errors; permission denied trả 403, unauthenticated trả 401. Có login/API rate limits, origin CORS qua FRONTEND_URL và audit logs. Chưa có cam kết request tracing, production monitoring hay backup/restore đã kiểm chứng.

## Workload và trade-offs

Giả định demo với vài staff và hàng nghìn appointments; chưa có benchmark latency/throughput. Modular monolith và SQL giảm độ phức tạp vận hành. Queue tách email khỏi request nhưng cần worker và xử lý side effects khi retry. Chưa có nhu cầu được đo để thêm cache, replica, microservices hoặc sharding.

## Verification và deployment boundary

PHPUnit kiểm tra API/domain trên SQLite. Playwright chạy Chromium với API fixtures cho login/create/calendar, chưa chạy Laravel/database thật. GitHub Actions chạy cả hai cùng frontend build.

Cloudflare Pages có thể serve dist/. API Laravel cần PHP host riêng, MySQL, queue worker, SMTP và HTTPS. Production VITE_API_URL phải trỏ API; Vite proxy chỉ dùng local. CORS, tài khoản demo, secret storage, backup/restore và rollback cần hoàn thiện trước release. Chi tiết giới hạn và backlog nằm trong README.md và REQUIREMENTS.md.
