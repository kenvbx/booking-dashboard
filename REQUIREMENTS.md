# Booking Dashboard — Requirements

## MVP

| ID | Actor | Requirement | Acceptance criteria |
|---|---|---|---|
| R1 | Admin/Staff | Xem overview metrics | Dashboard hiển thị tổng booking, upcoming today, completion rate, new customers với context period. |
| R2 | Admin/Staff | Xem lịch tuần | Lịch hiển thị 7 ngày, time grid, customer, staff và status. |
| R3 | Admin/Staff | Lọc lịch | Có thể lọc theo status và staff; số lượng kết quả cập nhật ngay. |
| R4 | Admin/Staff | Tạo appointment | Form yêu cầu title, customer, staff, start time; save thành công hiển thị toast. |
| R5 | System | Chuẩn bị chống trùng | Backend slice phải validate overlap trong transaction; UI mô tả rõ việc check conflict. |
| R6 | System | Trạng thái | Confirmed, Pending, Cancelled dùng màu semantic và legend thống nhất. |

## Follow-up
- Laravel auth + Sanctum/RBAC, CRUD customer/service/staff.
- API validation/error contract, idempotency key và overlap locking.
- Queue confirmation/reminder email và audit logs.
- Test domain rules, API workflow và manual E2E.
