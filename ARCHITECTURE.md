# Architecture note

## Direction
Modular monolith: Laravel REST API + React/TypeScript frontend + MySQL. Queue dùng cho confirmation/reminder emails. MVP frontend hiện chạy độc lập với demo state để kiểm tra UX trước khi nối API.

## Booking consistency
Server là source of truth. Create/reschedule chạy trong transaction và khóa bản ghi `staff_profiles` bằng `lockForUpdate()` trước khi query overlap; nhờ đó các booking đồng thời cho cùng staff được serialize trên MySQL. Request có thể retry với `idempotency_key` và unique constraint; retry trả lại appointment đã tạo thay vì tạo bản ghi mới. SQLite local chỉ dùng cho test, còn concurrency guarantee mục tiêu là MySQL.

## Initial workload assumptions
Personal/demo deployment, vài staff và hàng nghìn appointments. Mục tiêu response thông thường dưới 300ms; chưa cần cache, replica hoặc microservices.

## Failure & observability
API trả lỗi validation theo field và conflict booking theo mã lỗi riêng. Queue có retry bounded + failed jobs. Log request/job id, actor và appointment id; không log secret hay dữ liệu nhạy cảm không cần thiết.
