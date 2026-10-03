# cbh-youth-online-gift-shop
Front-end Giftshop for CBH Youth Online

Cửa hàng quà lưu niệm Chuyên Biên Hòa tại https://giftshop.chuyenbienhoa.com. Xây dựng bằng Next.js 16, TypeScript và Tailwind CSS v4. Cửa hàng không có backend riêng: sản phẩm, giỏ hàng, đơn hàng và thanh toán (điểm hoạt động, chuyển khoản QR, COD) đều đi qua API của [cbh-youth-online-api](https://github.com/tunnaduong/cbh-youth-online-api).

Cửa hàng không có trang đăng nhập riêng. Người dùng đăng nhập trên [chuyenbienhoa.com](https://www.chuyenbienhoa.com) ([cbh-youth-online-next-js](https://github.com/tunnaduong/cbh-youth-online-next-js)), và cửa hàng đọc cookie `auth_token` dùng chung cho `.chuyenbienhoa.com`. Ứng dụng [cbh-youth-online-mobile](https://github.com/tunnaduong/cbh-youth-online-mobile) mở cửa hàng trong WebView và tự đăng nhập sẵn.

## Chạy dự án

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

Biến môi trường (không bắt buộc, đã có giá trị mặc định):

| Biến | Mặc định |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.chuyenbienhoa.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.chuyenbienhoa.com` (trang đăng nhập) |

Trên `localhost`, trình duyệt không gửi cookie của `.chuyenbienhoa.com`, nên khi chạy local bạn sẽ ở trạng thái chưa đăng nhập.
