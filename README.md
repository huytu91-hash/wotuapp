# wotuapp
## Bảng đơn giá Admin

- Bản xem thử mở từ file lưu thay đổi trên trình duyệt đang dùng.
- Trên Vercel, dùng cùng biến `DATABASE_URL` của app và đặt thêm `WOTU_PRICE_ADMIN_TOKEN` bằng một mã riêng đủ mạnh. Nhập mã này ở mục Bảng đơn giá khi lưu.
- Tài khoản Neon cần quyền tạo bảng `public.wotu_prices` ở lần lưu đầu tiên, hoặc quyền đọc và ghi nếu bảng đã được tạo sẵn.
- Giá GARIS nhập theo giá niêm yết trước chiết khấu 35%. App áp dụng ưu đãi khi tính báo giá.

## Voucher Admin

Voucher dùng chung trên Vercel dùng cùng `DATABASE_URL` và `WOTU_PRICE_ADMIN_TOKEN`. Tài khoản Neon cần quyền tạo bảng `public.wotu_vouchers` ở lần tạo mã đầu tiên hoặc quyền đọc và ghi nếu đã tạo bảng sẵn.

## Đơn hàng và đối soát

- Trên Vercel, đơn hàng dùng `DATABASE_URL`. Quyền tạo bảng `public.wotu_orders` cần có ở lần đặt hàng đầu tiên.
- Trong Admin, dùng `WOTU_PRICE_ADMIN_TOKEN` để tải đơn và xác nhận sau khi đối chiếu số tiền, mã đơn và giao dịch thực tế.
- QR ghi số tiền đợt đầu và mã đơn. Trạng thái thanh toán do WOTU xác nhận thủ công.
- Bản xem thử lưu đơn và trạng thái trong trình duyệt.
