# FlexBookmark - Chrome Extension

![FlexBookmark Logo](assets/icons/icon128.png)

Một extension Chrome để quản lý bookmark mạnh mẽ với đồng bộ tài khoản Google.

## Tính năng chính

- 📁 Hiển thị bookmark dạng cây thư mục trong sidebar
- 🚀 Thêm/xóa bookmark nhanh chóng
- 🔄 Tự động đồng bộ với tài khoản Google
- 🎨 Giao diện New Tab tùy biến
- ⚡ Tối ưu hiệu suất với Service Worker

## Cài đặt

1. Clone repository:
   ```bash
   git clone https://github.com/yourusername/flexbookmark.git
   ```
2. Mở Chrome và truy cập `chrome://extensions`
3. Bật **Developer mode**
4. Click **Load unpacked** và chọn thư mục dự án

## Cấu trúc dự án

```
flexbookmark/
├── assets/          # Tài nguyên tĩnh
├── src/             # Source code chính
│   ├── background/  # Xử lý nền
│   ├── content/     # Giao diện người dùng
│   └── popup/       # Popup (nếu có)
└── manifest.json    # Cấu hình extension
```

## Công nghệ sử dụng

- Chrome Extension API (Manifest V3)
- ES6 Modules
- Service Workers
- CSS Variables

## Hướng phát triển

- [ ] Thêm tính năng kéo thả sắp xếp bookmark
- [ ] Hỗ trợ tag và tìm kiếm nâng cao
- [ ] Dark mode

## License

MIT
