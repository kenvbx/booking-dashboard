# Architecture note

## Direction
Modular monolith: Laravel REST API + React/TypeScript frontend + MySQL. Queue dùng cho confirmation/reminder emails. MVP frontend hiện chạy độc lập với demo state để kiểm tra UX trước khi nối API.

## Booking consistency
Server là source of truth. Create/reschedule chạy trong transaction, lock availability của staff theo ngày hoặc query overlap dưới lock phù hợp; không dựa vào frontend check. Request có thể retry nên dùng idempotency key/unique constraint ở application layer.

## Initial workload assumptions
Personal/demo deployment, vài staff và hàng nghìn appointments. Mục tiêu response thông thường dưới 300ms; chưa cần cache, replica hoặc microservices.

## Failure & observability
API trả lỗi validation theo field và conflict booking theo mã lỗi riêng. Queue có retry bounded + failed jobs. Log request/job id, actor và appointment id; không log secret hay dữ liệu nhạy cảm không cần thiết.
