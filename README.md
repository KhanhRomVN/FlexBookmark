# 🚀 FlexBookmark - Chrome Extension

![FlexBookmark Logo](assets/icons/icon.png)

**FlexBookmark** is a powerful and lightweight Chrome extension for managing bookmarks in a structured, visual, and customizable way — with seamless Google account sync.

---

## 📌 Features

- 📁 Tree-structured sidebar to visualize your bookmarks
- ➕ Quick add/remove bookmark functionality
- 🔄 Auto-sync with your Google account
- 🎨 Customizable new tab interface
- ⚡ Optimized performance using Service Worker (Manifest V3)

---

## 📦 Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/KhanhRomVN/flexbookmark.git
   cd flexbookmark
   ```

````

2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right corner)
4. Click **Load unpacked** and select the project directory

---

## 📂 Project Structure

```
flexbookmark/
├── assets/          # Static assets (icons, logos, etc.)
├── src/             # Main source code
│   ├── background/  # Service worker and background scripts
│   ├── content/     # Sidebar and new tab UI
│   └── popup/       # Optional popup interface
└── manifest.json    # Chrome extension configuration (Manifest V3)
```

---

## 🛠️ Tech Stack

* Chrome Extensions API (Manifest V3)
* ES6 JavaScript Modules
* Service Workers
* CSS Variables for theming

---

## 🌱 Future Improvements

* [ ] Drag-and-drop bookmark sorting
* [ ] Tagging system & advanced search
* [ ] Dark mode support
* [ ] Multiple account sync management

---

## 📧 Contact

* 📩 Email: [khanhromvn@gmail.com](mailto:khanhromvn@gmail.com)
* 🌐 GitHub: [https://github.com/KhanhRomVN](https://github.com/KhanhRomVN)
* 🌍 Country: Vietnam 🇻🇳

---

## ⚖️ License
This project is licensed under the [MIT License](LICENSE).
````

cache
lưu các habit theo 1 object json.
sẽ có cơ chế xóa các habit của tháng trước. ví dụ nay 1/9 thì habit ở tháng 8 sẽ xóa đi vì ko cần thiết nữa
mẫu habit { id: "habit-001", name: "Chạy bộ buổi sáng", description: "Chạy 30 phút mỗi sáng để tăng cường sức khỏe", habitType: "good", difficultyLevel: 3, goal: 30, limit: undefined, currentStreak: 5, dailyTracking: [30, 25, 30, 20, null, 30, 30], // item1 trong mảng tương ứng day1, null tương ứng với skip habit, trong mảng có 7 item thì tương ứng 7day tức là ngày 7 tháng <x> với x dựa vào createdDate sẽ tìm ra tháng createdDate: <date>, colorCode: "
#4CAF50", longestStreak: 10, category: "health", tags: ["exercise", "morning"], isArchived: false, isQuantifiable: true, unit: "minutes", startTime: "06:00", subtasks: ["Khởi động 5 phút", "Chạy chính 20 phút", "Thả lỏng 5 phút"] }
tác vụ chạy ngầm:
kiểm tra 1 lần xem
vào HabitManager sẽ tiến hành lấy cache ra.
có cache: hiển thị ngay lập tức. sau đó thử kiểm tra ngầm có tồn tại file sheet, token còn valid, có scope sheet và drive ko
ko có cache: tiến hành lấy value từ file sheet.
nếu lấy được. hiển thị lên giao diện ngay lập tức. lưu cache. ko cần kiểm tra ngầm phần "sau đó thử kiểm tra ngầm có tồn tại file sheet, token còn valid, có scope sheet và drive ko" vì nếu lấy được value ở file sheet thì tức là mọi thứ đều ổn
nếu ko lấy được thf kiểm tra token trước tiên (valid và scope) -> lỗi thì tiến hành OAuth Content Screen của GG CLoud cung cấp. sau đó kiểm tra nơi lưu folder "FlexBookmark", "habuitManager", file sheet, cột có bị sai value ko... chỉ cần thiếu 1 thứ hoặc sai gì thì phải sửa ngay. hoan tất thì ngừng.
