# Booking Dashboard — Product brief

## Mục tiêu
Helio là personal/demo appointment-management system giúp admin và staff nhìn rõ lịch hẹn, tránh trùng lịch và xử lý booking nhanh trong một workspace.

## Người dùng chính
- **Admin:** quản lý dịch vụ, nhân sự, khách hàng và lịch hẹn.
- **Staff:** xem và cập nhật các lịch được phân công.
- **Customer:** được đại diện trong luồng đặt lịch và nhận thông tin hẹn.

## MVP slice hiện tại
Overview dashboard với metric cards, lịch tuần, lọc status/staff, agenda trong ngày và tạo lịch hẹn nhanh (demo state trên frontend).

## Tiêu chí thành công
- Xem được tuần hiện tại và trạng thái lịch rõ ràng.
- Thêm được một booking từ modal với phản hồi ngay.
- Lọc lịch mà không tải lại trang.
- Responsive ở desktop, tablet và mobile; focus state và reduced motion được hỗ trợ.

## Giả định & ngoài phạm vi slice
Backend Laravel, auth/RBAC, MySQL transaction + locking, queue email, audit log và persistence sẽ nối ở các vertical slice tiếp theo. Dữ liệu hiện tại là demo, không đại diện cho client work hay production metrics.
