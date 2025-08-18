### **Tổng quan khi chuyển từ `overdue` sang 4 status khác**

**Đặc điểm của `overdue`**:

- Task đã vượt quá `dueDate/dueTime` nhưng chưa hoàn thành (`done`).
- Bắt buộc phải có `startDate/startTime` và `dueDate/dueTime` (vì có `due` mới xác định được `overdue`).
- `actualStart*` và `actualEnd*` có thể có hoặc chưa.

---

### **1. Chuyển `overdue` → `backlog`**

**Luôn cưỡng ép được**, nhưng **reset dữ liệu thực tế**:

- **Hành động**:
  - `actualStartDate`, `actualStartTime`, `actualEndDate`, `actualEndTime` = `null` (xóa dữ liệu cũ).
  - Giữ nguyên `startDate/startTime/dueDate/dueTime`.
- **Lưu ý**:
  - Task sẽ quay lại trạng thái chưa được lên lịch chi tiết, nhưng vẫn giữ thông tin kế hoạch ban đầu.

---

### **2. Chuyển `overdue` → `todo`**

**Cưỡng ép được nếu cập nhật `startDate/startTime`**:

- **Điều kiện**:
  - `startDate/startTime` phải được đặt thành thời điểm **trong tương lai** (nếu không, task sẽ tự động thành `overdue`/`in-progress` ngay sau khi chuyển).
- **Hành động**:
  - Reset: `actualStart*`, `actualEnd*` = `null`.
  - Hiển thị form yêu cầu nhập **`startDate/startTime` mới** (bắt buộc) và `dueDate/dueTime` (tùy chọn).
    - Nếu không nhập `dueDate/dueTime`, giữ nguyên giá trị cũ.
- **Trường hợp không thể cưỡng ép**:
  - Người dùng từ chối cập nhật `startDate/startTime` trong tương lai → không cho phép chuyển.

---

### **3. Chuyển `overdue` → `in-progress`**

**Luôn cưỡng ép được**, nhưng **cập nhật thời gian thực tế**:

- **Hành động**:
  - Nếu chưa có `actualStart*`:
    - `actualStartDate` = `now` (ngày hiện tại).
    - `actualStartTime` = `now` (giờ hiện tại).
  - Nếu đã có `actualStart*`: **Giữ nguyên** (không ghi đè).
- **Xử lý thời hạn**:
  - Giữ nguyên `dueDate/dueTime` cũ (dù đã qua).
  - Task vẫn ở `in-progress` nhưng hiển thị cảnh báo "quá hạn".

---

### **4. Chuyển `overdue` → `done`**

**Cưỡng ép được nếu có `actualStart*` hoặc cập nhật bù**:

- **Hành động**:
  - **Nếu đã có `actualStart*`**:
    - `actualEndDate` = `now`, `actualEndTime` = `now`.
    - Giữ nguyên `actualStart*`.
  - **Nếu chưa có `actualStart*`**:
    - Hiển thị form với 2 lựa chọn:
      1. **Tự động gán**:
      - `actualStartDate` = `now`
      - `actualStartTime` = `now`
      - `actualEndDate` = `now`
      - `actualEndTime` = `now`  
        (Task hoàn thành ngay lập tức).
      2. **Nhập thủ công**:
      - Yêu cầu nhập `actualStartDate`, `actualStartTime` (bắt buộc, phải trước `now`).
      - `actualEndDate` = `now`, `actualEndTime` = `now`.
- **Trường hợp không thể cưỡng ép**:
  - Người dùng không nhập `actualStart*` khi chưa có dữ liệu → không cho phép chuyển.

---

### **Tổng kết logic ràng buộc**

| **Chuyển đến** | **Cưỡng ép được?** | **Dữ liệu thay đổi**                               | **Form hiển thị?**                                    |
| -------------- | ------------------ | -------------------------------------------------- | ----------------------------------------------------- |
| `backlog`      | ✅                 | Reset `actual*`                                    | ❌                                                    |
| `todo`         | ⚠️ (Có điều kiện)  | Reset `actual*`; Cập nhật `start*` trong tương lai | ✅ (Nhập `start*/due*` mới)                           |
| `in-progress`  | ✅                 | Gán `actualStart* = now` (nếu chưa có)             | ❌                                                    |
| `done`         | ⚠️ (Có điều kiện)  | Gán `actualEnd* = now`; Xử lý `actualStart*`       | ✅ (Nếu chưa có `actualStart*`: chọn tự gán/nhập tay) |

---

### **Giải thích đặc biệt**

- **Tại sao `overdue` → `todo` cần `start*` trong tương lai?**
  - Nếu `start*` vẫn trong quá khứ, task sẽ tự động chuyển thành `in-progress`/`overdue` ngay sau khi chuyển → mâu thuẫn logic.
- **Tại sao `overdue` → `done` cần `actualStart*`?**
  - Nguyên tắc: "Có kết thúc (`actualEnd*`) thì phải có bắt đầu (`actualStart*`)".
- **Xử lý `due*` đã qua**:
  - Khi chuyển sang `in-progress`/`done`, hệ thống vẫn giữ `due*` cũ để theo dõi tiến độ trễ, nhưng không thay đổi trạng thái tự động.

> ⚠️ **Lưu ý chung**: App luôn đảm bảo tính toàn vẹn dữ liệu. Các trường hợp "không thể cưỡng ép" xảy ra khi người dùng không cung cấp đủ thông tin bắt buộc qua form.

### Tổng hợp các trường hợp "cưỡng ép" chuyển status từ **done** sang 4 status khác (backlog, todo, in-progress, overdue) dựa trên 8 trường thời gian

**Lưu ý chung khi chuyển từ done:**

- `actualEndDate` và `actualEndTime` luôn bị **xóa** (vì task không còn trạng thái hoàn thành).
- `actualStartDate/Time` chỉ được giữ nguyên khi chuyển sang **in-progress/overdue** (task đã bắt đầu). Bị xóa khi chuyển sang **backlog/todo** (task chưa bắt đầu).
- Các trường `startDate/Time`, `dueDate/Time` được điều chỉnh tự động để đảm bảo tính hợp lệ của status mới.

---

#### **1. Chuyển từ done → backlog**

_(Reset hoàn toàn task)_  
**Hành động:**

- Xóa toàn bộ 8 trường (planned + actual).
- Status mới: **backlog**.  
  **Điều kiện cưỡng chế:** Luôn thành công.

```typescript
// Pseudocode
clearAllFields();
status = "backlog";
```

---

#### **2. Chuyển từ done → todo**

_(Task chưa bắt đầu, có thời gian bắt đầu trong tương lai)_  
**Hành động:**

- Xóa tất cả trường `actual*` (vì task chưa bắt đầu).
- Kiểm tra `startDate/startTime`:
  - Nếu chưa tồn tại → **đặt mặc định** `startDate/startTime = now + 1h`.
  - Nếu đã tồn tại nhưng ở **quá khứ** → **đặt lại** `startDate/startTime = now + 1h`.
  - Nếu ở **tương lai** → giữ nguyên.
- Xóa `dueDate/dueTime` (tránh xung đột nếu due < start mới).
- Status mới: **todo**.  
  **Điều kiện cưỡng chế:** Luôn thành công sau khi điều chỉnh.

```typescript
clearActualFields();
if (!startDate || startDate < now) {
  setStart(now + 1h); // Đặt start trong tương lai
}
clearDueFields(); // Đảm bảo không có due < start
status = "todo";
```

---

#### **3. Chuyển từ done → in-progress**

_(Task đang chạy lại ngay lập tức)_  
**Hành động:**

- Cập nhật `actualStartDate/actualStartTime = now` (thời gian bắt đầu mới).
- Xóa `actualEndDate/actualEndTime`.
- Kiểm tra `startDate/startTime`:
  - Nếu chưa tồn tại → **đặt mặc định** `startDate/startTime = now`.
  - Nếu ở **tương lai** → **ghi đè** `startDate/startTime = now` (đảm bảo task đã bắt đầu).
- Kiểm tra `dueDate/dueTime`:
  - Nếu tồn tại và ở **quá khứ** → **đặt lại** `dueDate/dueTime = now + 1h` (tránh chuyển ngay sang overdue).
- Status mới: **in-progress**.  
  **Điều kiện cưỡng chế:** Luôn thành công sau khi điều chỉnh.

```typescript
setActualStart(now);
clearActualEnd();
if (!startDate || startDate > now) {
  setStart(now); // Đảm bảo start <= now
}
if (dueDate && dueDate < now) {
  setDue(now + 1h); // Đảm bảo due >= now
}
status = "in-progress";
```

---

#### **4. Chuyển từ done → overdue**

_(Task quá hạn nhưng chưa hoàn thành)_  
**Hành động:**

- Xóa `actualEndDate/actualEndTime` (task chưa xong).
- Giữ nguyên `actualStartDate/actualStartTime` (nếu có).
- Kiểm tra `dueDate/dueTime`:
  - Nếu chưa tồn tại → **đặt mặc định** `dueDate/dueTime = now - 1h` (tạo thời hạn đã qua).
  - Nếu ở **tương lai** → **ghi đè** `dueDate/dueTime = now - 1h` (đảm bảo đã quá hạn).
- Không thay đổi `startDate/startTime`.
- Status mới: **overdue**.  
  **Điều kiện cưỡng chế:** Luôn thành công sau khi điều chỉnh.

```typescript
clearActualEnd();
if (!dueDate || dueDate > now) {
  setDue(now - 1h); // Đảm bảo due < now
}
status = "overdue";
```

---

### **Tổng kết đặc biệt**

- **Không có trường hợp không thể cưỡng ép**: Có thể chuyển từ done sang bất kỳ status nào nhờ tự động điều chỉnh trường thời gian.
- **Không cần form nhập liệu**: Tất cả điều chỉnh được thực hiện tự động theo logic thống nhất.
- **Nguyên tắc ràng buộc thời gian**:
  - `startDate/Time` phải tồn tại nếu có `dueDate/Time`.
  - `actualStart*` phải tồn tại nếu có `actualEnd*`.
  - Trạng thái luôn tương thích với thời gian hệ thống (now).

### **Ví dụ tình huống đặc biệt**

- **Chuyển done → in-progress**:

  - Task có `startDate = 2025-08-20` (tương lai) → ghi đè thành `startDate = now`.
  - Task có `dueDate = 2025-08-15` (quá khứ) → ghi đè thành `dueDate = now + 1h`.  
    → Đảm bảo task ở trạng thái "đang chạy" hợp lệ.

- **Chuyển done → overdue**:
  - Task không có `dueDate` → đặt mặc định `dueDate = now - 1h`.  
    → Đảm bảo task ở trạng thái "quá hạn".

> **Lưu ý cuối**: Các điều chỉnh tự động đảm bảo tính toàn vẹn dữ liệu và logic nghiệp vụ. Ứng dụng tuân thủ nghiêm ngặt nguyên tắc "có end thì phải có start" và "trạng thái phải khớp với khoảng thời gian thực tế".

Dưới đây là phân tích chi tiết các trường hợp **cưỡng ép chuyển trạng thái từ `in-progress` sang 4 trạng thái khác** (backlog, todo, done, overdue), bao gồm điều kiện, hành động hệ thống, và các trường hợp không thể cưỡng ép. Giả định hệ thống luôn tuân thủ nguyên tắc:

- **Có `dueDate/dueTime` → Bắt buộc có `startDate/startTime`**
- **`actualStart`/`actualEnd` chỉ ghi nhận khi thực tế xảy ra**
- Trạng thái phản ánh đúng thời điểm so với `start/due`

---

### **Tổng quan chuyển đổi từ `in-progress`**

| Chuyển đến  | Có thể cưỡng ép? | Điều kiện bắt buộc                        | Hành động hệ thống                                          |
| ----------- | ---------------- | ----------------------------------------- | ----------------------------------------------------------- |
| **Backlog** | ✅ Có            | Không yêu cầu field                       | Reset trường thực tế.                                       |
| **Todo**    | ✅ Có            | `startDate/startTime` hợp lệ              | Reset trường thực tế, kiểm tra thời gian.                   |
| **Done**    | ⚠️ Có điều kiện  | `actualEnd` ≤ `due` (nếu có)              | Ghi nhận `actualEnd`, xử lý xung đột thời gian.             |
| **Overdue** | ⚠️ Có điều kiện  | `dueDate/dueTime` đã qua & task chưa xong | Không ghi nhận `actualEnd`, kiểm tra tính hợp lệ của `due`. |

---

### **Chi tiết từng trường hợp**

#### **1. `in-progress` → `backlog`**

**Luôn cưỡng ép được**, nhưng **mất dữ liệu thực tế**:

- **Hành động hệ thống**:
  - Reset: `actualStartDate = null`, `actualStartTime = null`
  - Giữ nguyên: `startDate/startTime/dueDate/dueTime` (nếu có)
- **Lưu ý**:
  - Task sẽ trở trạng thái "chưa sẵn sàng", không phù hợp nếu đã có `start/due`.

---

#### **2. `in-progress` → `todo`**

**Cưỡng ép được nếu**:

- `startDate/startTime` đã được thiết lập.
- `startDate/startTime` chưa đến thời điểm hiện tại (`start > now`).

**Hành động hệ thống**:

- Reset: `actualStartDate = null`, `actualStartTime = null`
- Giữ nguyên: `dueDate/dueTime` (nếu có)
- **Kiểm tra**:
  - Nếu `startDate/startTime` chưa thiết lập → **Không thể chuyển** (task không đủ điều kiện ở `todo`).
  - Nếu `startDate/startTime` đã qua (`start ≤ now`) → Cảnh báo: _"Task đã quá thời điểm bắt đầu, không thể trở lại todo"_.

---

#### **3. `in-progress` → `done`**

**Cưỡng ép được**, nhưng **phụ thuộc vào `due`** và **ghi nhận thời gian hoàn thành**:  
| Trường hợp nhỏ | Hành động hệ thống | Lựa chọn người dùng |
|------------------------------------|-----------------------------------------------------------------------------------|------------------------------------------------------|
| **Chưa có `dueDate/dueTime`** | 1. Hiển thị form nhập `dueDate/dueTime` (bắt buộc).<br>2. Tự động set `due = now` nếu người dùng không nhập. | Nhập `due` thủ công hoặc dùng mặc định (`now`). |
| **Đã có `dueDate/dueTime`** | So sánh `actualEnd` (now) với `due`: | |
| - `actualEnd` ≤ `due` | → Chuyển thẳng sang `done`. | Không cần hành động. |
| - `actualEnd` > `due` | → Cảnh báo: _"Task hoàn thành trễ hạn!"_<br>→ **Vẫn chuyển sang `done`** (trạng thái hoàn thành). | Xác nhận ghi nhận `actualEnd` hoặc hủy. |
| **Chưa có `actualStart`** | Tự động ghi nhận: `actualStart = now` (vì task đang chạy). | Không can thiệp. |

---

#### **4. `in-progress` → `overdue`**

**Chỉ cưỡng ép được nếu**:

- `dueDate/dueTime` đã được thiết lập.
- `dueDate/dueTime` đã qua (`due < now`).
- Task **chưa hoàn thành** (không có `actualEnd`).

| Trường hợp nhỏ                 | Hành động hệ thống                                                                       | Kết quả                                |
| ------------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------- |
| **Chưa có `dueDate/dueTime`**  | → **Không thể chuyển**: Hiển thị form nhập `dueDate/dueTime`.                            | Chuyển sang `overdue` nếu `due < now`. |
| **`dueDate/dueTime` chưa qua** | → **Từ chối**: Hiển thị thông báo _"Task chưa đến hạn, không thể đánh dấu quá hạn"_.     | Giữ nguyên `in-progress`.              |
| **`dueDate/dueTime` đã qua**   | → Chuyển sang `overdue`.<br>- Giữ nguyên `actualStart`.<br>- Không ghi nhận `actualEnd`. | Thành công.                            |

---

### **Trường hợp không thể cưỡng ép**

1. **`in-progress` → `todo`**:

   - Khi `startDate/startTime` chưa được thiết lập → Task không đủ điều kiện tồn tại ở `todo`.
   - Khi `startDate/startTime` đã qua → Task không thể "chưa bắt đầu".

2. **`in-progress` → `overdue`**:

   - Khi `dueDate/dueTime` chưa được thiết lập → Không xác định được hạn.
   - Khi `dueDate/dueTime` chưa qua → Không hợp lý để đánh dấu quá hạn.

3. **`in-progress` → `done`**:
   - Khi người dùng **hủy bỏ** việc nhập `dueDate/dueTime` (nếu chưa có `due`) → Không đủ dữ liệu để hoàn thành.

---

### **Xử lý đặc biệt**

- **Tự động chuyển `in-progress` → `done` qua trung gian**:  
  Nếu người dùng cố gắng chuyển `in-progress` → `done` nhưng `due` chưa thiết lập:

  - Hệ thống yêu cầu nhập `dueDate/dueTime`.
  - Nếu người dùng nhập `due` **trong tương lai** → Cảnh báo: _"Hạn chót sau thời điểm hiện tại, task sẽ hoàn thành sớm?"_ → **Vẫn cho phép chuyển sang `done`**.

- **Mâu thuẫn thời gian**:
  - Khi chuyển sang `done`, nếu `actualStart > actualEnd` (thời gian bắt đầu thực tế sau khi kết thúc) → Cảnh báo: _"Thời gian không hợp lệ!"_ → Yêu cầu sửa `actualStart` hoặc `actualEnd`.

---

### **Tổng kết nguyên tắc**

- **`backlog`**: Chỉ áp dụng khi task chưa được lên kế hoạch thời gian.
- **`todo`**: Yêu cầu `startDate/startTime` và thời điểm chưa đến.
- **`in-progress`**: Phải có `actualStart` và nằm trong khoảng `start` → `due` (nếu có).
- **`done`**: Bắt buộc ghi nhận `actualEnd`, so sánh với `due` để xác định trễ hạn.
- **`overdue`**: Chỉ áp dụng khi có `due` đã qua và task chưa hoàn thành.

> ⚠️ Cưỡng ép chuyển trạng thái có thể gây mất tính nhất quán dữ liệu. Hệ thống nên **hiển thị cảnh báo rõ ràng** và **yêu cầu xác nhận** từ người dùng trước khi thực hiện.

Dưới đây là phân tích chi tiết các trường hợp **"cưỡng ép" chuyển status từ `todo` sang 4 status khác (`backlog`, `in-progress`, `done`, `overdue`)**, bao gồm điều kiện, hành động hệ thống, và các trường hợp không thể thực hiện. Giả định rằng task ở status `todo` đã có đủ `startDate` và `startTime` (theo quy tắc hệ thống).

---

### **Tổng quan logic chuyển đổi**

1. **`todo` → `backlog`**:

   - **Điều kiện**: Luôn cưỡng ép được.
   - **Hành động**: Reset tất cả trường thời gian (vì `backlog` không yêu cầu thời gian).
   - **Lưu ý**: Task sẽ mất mọi thông tin lịch trình.

2. **`todo` → `in-progress`**:

   - **Điều kiện**: Luôn cưỡng ép được.
   - **Hành động**: Cập nhật thời gian bắt đầu thực tế (`actualStart`), giữ nguyên lịch trình dự kiến.

3. **`todo` → `done`**:

   - **Điều kiện**: Luôn cưỡng ép được.
   - **Hành động**: Cập nhật cả `actualStart` và `actualEnd` (nếu chưa có).

4. **`todo` → `overdue`**:
   - **Điều kiện**: Chỉ thành công nếu `dueDate/dueTime` đã được thiết lập và đã qua.
   - **Hành động**: Không cập nhật `actualStart`/`actualEnd` (vì task chưa thực sự bắt đầu).

---

### **Chi tiết từng trường hợp**

#### **1. Chuyển `todo` → `backlog`**

- **Logic**: Task từ trạng thái "đã lên lịch" trở về "chưa lên lịch".
- **Hành động hệ thống**:
  - Reset tất cả 8 trường thời gian về `null`.
  - Status mới: `backlog`.
- **Ví dụ**:

  ```json
  // Trước khi chuyển (todo):
  startDate: "2023-10-01", startTime: "09:00", dueDate: "2023-10-05", dueTime: "17:00"

  // Sau khi chuyển (backlog):
  Tất cả trường thời gian = null
  ```

---

#### **2. Chuyển `todo` → `in-progress`**

- **Logic**: Task bắt đầu thực hiện sớm hơn dự kiến (cưỡng ép bắt đầu).
- **Hành động hệ thống**:
  - Cập nhật: `actualStartDate = now()`, `actualStartTime = now()`.
  - Giữ nguyên `startDate`, `startTime`, `dueDate`, `dueTime`.
  - Status mới: `in-progress`.
- **Trường hợp con**:
  - **TH1: Chưa có `dueDate/dueTime`**:
    - Vẫn chuyển được sang `in-progress`.
    - Cảnh báo: "Task chưa có hạn chót!".
  - **TH2: Đã có `dueDate/dueTime`**:
    - Chuyển bình thường, không cảnh báo.
- **Ví dụ**:

  ```json
  // Trước khi chuyển (todo):
  startDate: "2023-10-10", startTime: "09:00", dueDate: "2023-10-15", dueTime: "17:00"

  // Sau khi chuyển (in-progress):
  actualStartDate: "2023-10-05", actualStartTime: "10:30" // now()
  // Các trường khác giữ nguyên
  ```

---

#### **3. Chuyển `todo` → `done`**

- **Logic**: Hoàn thành task mà không cần trải qua `in-progress`.
- **Hành động hệ thống**:
  - Nếu `actualStart` chưa có: Cập nhật `actualStartDate = now()`, `actualStartTime = now()`.
  - Luôn cập nhật `actualEndDate = now()`, `actualEndTime = now()`.
  - Giữ nguyên `startDate`, `startTime`, `dueDate`, `dueTime`.
  - Status mới: `done`.
- **Trường hợp con**:
  - **TH1: `dueDate/dueTime` đã qua**:
    - Task được đánh dấu là hoàn thành trễ (nhưng status vẫn là `done`, không phải `overdue`).
  - **TH2: Chưa có `dueDate/dueTime`**:
    - Vẫn chuyển được, không cảnh báo.
- **Ví dụ**:

  ```json
  // Trước khi chuyển (todo):
  startDate: "2023-10-10", startTime: "09:00"

  // Sau khi chuyển (done):
  actualStartDate: "2023-10-05", actualStartTime: "10:30" // now()
  actualEndDate: "2023-10-05", actualEndTime: "10:30"     // now()
  ```

---

#### **4. Chuyển `todo` → `overdue`**

- **Logic**: Đánh dấu task trễ hạn dù chưa bắt đầu (cưỡng ép).
- **Điều kiện bắt buộc**:
  - `dueDate/dueTime` phải tồn tại và `dueDateTime < now()`.
- **Hành động hệ thống**:
  - Không thay đổi `actualStart`/`actualEnd` (vì task chưa thực sự chạy).
  - Status mới: `overdue`.
- **Trường hợp không thể cưỡng ép**:
  - **TH1: Chưa có `dueDate/dueTime`**:
    - **Không thể chuyển** → Yêu cầu người dùng nhập `dueDate/dueTime` trước.
  - **TH2: `dueDate/dueTime` chưa đến**:
    - **Không thể chuyển** → Hệ thống từ chối với thông báo: "Task chưa đến hạn chót!".
- **Ví dụ thành công**:

  ```json
  // Trước khi chuyển (todo):
  startDate: "2023-10-01", startTime: "09:00", dueDate: "2023-10-05", dueTime: "17:00" // (đã qua)

  // Sau khi chuyển (overdue):
  // actualStart và actualEnd vẫn = null
  ```

---

### **Tổng kết: Trường hợp không thể cưỡng ép**

| Chuyển đổi             | Không thể cưỡng ép khi                                    | Giải pháp                                    |
| ---------------------- | --------------------------------------------------------- | -------------------------------------------- |
| `todo` → `backlog`     | Luôn làm được                                             |                                              |
| `todo` → `in-progress` | Luôn làm được                                             |                                              |
| `todo` → `done`        | Luôn làm được                                             |                                              |
| `todo` → `overdue`     | - Chưa có `dueDate/dueTime`.<br>- `dueDateTime` chưa qua. | Yêu cầu nhập `dueDate/dueTime` hoặc từ chối. |

---

### **Lưu ý đặc biệt**

1. **Quy tắc thời gian**:
   - Task không thể ở `todo` nếu `startDateTime` đã qua → Hệ thống tự động chuyển sang `in-progress` hoặc `overdue`.
   - Có `dueDate` → Bắt buộc phải có `startDate` (áp dụng cho `actual` và `due`).
2. **Giao diện người dùng**:
   - Khi chuyển `todo` → `in-progress`/`done`: Không hiển thị form nhập thời gian (vì đã có `startDate/startTime`).
   - Khi chuyển `todo` → `overdue` mà thiếu `dueDate/dueTime`: Hiển thị form bắt buộc nhập `dueDate/dueTime` (với giá trị trong quá khứ).

> **Câu trả lời cho giả dụ**: Nếu cưỡng ép chuyển `todo` → `done` nhưng hệ thống tự chuyển qua `in-progress`, điều này không xảy ra vì `done` và `in-progress` là độc lập. Trừ khi có lỗi logic, việc chuyển status phải rõ ràng theo hành động người dùng.

Dưới đây là phân tích chi tiết các trường hợp khi **cưỡng ép chuyển status từ `backlog`** sang 4 status (`todo`, `in-progress`, `done`, `overdue`), bao gồm điều kiện, xử lý các trường thiếu dữ liệu, và giới hạn chuyển đổi. Giả định hệ thống sử dụng 8 trường thời gian và tuân thủ nguyên tắc: **"Có end thì bắt buộc có start"**.

---

### **Quy tắc chung khi chuyển từ `backlog`**

1. `backlog` → Bất kỳ status nào: **Bắt buộc phải có `startDate` và `startTime`** (do "có end thì phải có start", và các status khác đều yêu cầu thời gian).
2. Nếu thiếu `startDate/startTime`: **Xuất hiện form nhập** (bắt buộc).
3. `dueDate/dueTime`: Không bắt buộc (trừ trường hợp `overdue`).
4. `actual*` fields: Tự động gán `now` khi chuyển sang `in-progress`/`done` (nếu chưa có).

---

### **I. Chuyển từ `backlog` → `todo`**

**Điều kiện thành công**:

- `startDate/startTime` phải **lớn hơn** thời điểm hiện tại (`now`).

**Các trường hợp chi tiết**:
| Scenario | Hành động hệ thống | Chuyển đổi được không? |
|-----------------------------------|------------------------------------------------------------------------------------|------------------------|
| 1. Chưa có `startDate/startTime` | - Hiện form nhập **bắt buộc** `startDate`, `startTime`.<br>- Nếu người dùng nhập `start > now`: Chuyển sang `todo`.<br>- Nếu `start <= now`: **Từ chối**, đề xuất chuyển sang `in-progress`. | ❌ (nếu `start <= now`) |
| 2. Đã có `startDate/startTime` | - Kiểm tra giá trị:<br> - Nếu `start > now`: Chuyển thành công.<br> - Nếu `start <= now`: **Từ chối**, đề xuất chuyển sang `in-progress`. | ❌ (nếu `start <= now`) |

---

### **II. Chuyển từ `backlog` → `in-progress`**

**Điều kiện thành công**:

- `startDate/startTime` phải **nhỏ hơn hoặc bằng** `now`.

**Các trường hợp chi tiết**:
| Scenario | Hành động hệ thống | Chuyển đổi được không? |
|-----------------------------------|------------------------------------------------------------------------------------|------------------------|
| 1. Chưa có `startDate/startTime` | - Tự gán `startDate/startTime = now`.<br>- Gán `actualStartDate/actualStartTime = now`.<br>- **Không yêu cầu `dueDate/dueTime`** (có thể `null`). | ✅ |
| 2. Đã có `startDate/startTime` | - Kiểm tra giá trị:<br> - Nếu `start <= now`: Gán `actualStartDate/actualStartTime = now` → Chuyển thành công.<br> - Nếu `start > now`: **Từ chối**, đề xuất chuyển sang `todo`. | ❌ (nếu `start > now`) |

---

### **III. Chuyển từ `backlog` → `done`**

**Điều kiện thành công**:

- Luôn thành công nếu có `startDate/startTime` (dù `start` ở quá khứ/tương lai).

**Các trường hợp chi tiết**:
| Scenario | Hành động hệ thống | Chuyển đổi được không? |
|------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|------------------------|
| 1. Chưa có `startDate/startTime` | - **Bắt buộc nhập** `startDate/startTime`.<br>- Tự gán `actualStartDate/actualStartTime = now`.<br>- Tự gán `actualEndDate/actualEndTime = now`. | ✅ (sau khi nhập) |
| 2. Đã có `startDate/startTime` | - Tự gán `actualStartDate/actualStartTime = now` (nếu chưa có).<br>- Tự gán `actualEndDate/actualEndTime = now`.<br>- **Bỏ qua `dueDate/dueTime`** (nếu có). | ✅ |
| 3. Giả dụ: Tự động qua `in-progress` trước | - Nếu hệ thống **bắt buộc** phải qua `in-progress` trước khi `done`:<br> - Tạm gán `actualStartDate/actualStartTime = now` → Chuyển sang `in-progress`.<br> - Ngay sau đó gán `actualEndDate/actualEndTime = now` → Chuyển sang `done`. | ✅ (qua trung gian) |

---

### **IV. Chuyển từ `backlog` → `overdue`**

**Điều kiện thành công**:

- Bắt buộc phải có `dueDate/dueTime`.
- `dueDate/dueTime` phải **nhỏ hơn** `now`.

**Các trường hợp chi tiết**:
| Scenario | Hành động hệ thống | Chuyển đổi được không? |
|------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|------------------------|
| 1. Chưa có `dueDate/dueTime` | - **Hiện form nhập** `startDate/startTime` (bắt buộc) và `dueDate/dueTime` (bắt buộc).<br>- Nếu `due < now`: Chuyển thành công.<br>- Nếu `due >= now`: **Từ chối**, đề xuất chuyển sang `todo`/`in-progress`. | ❌ (nếu `due >= now`) |
| 2. Đã có `dueDate/dueTime` | - Kiểm tra giá trị:<br> - Nếu `due < now`: Chuyển thành công.<br> - Nếu `due >= now`: **Từ chối**, đề xuất chuyển sang `todo`/`in-progress`. | ❌ (nếu `due >= now`) |
| 3. Đã có `start` và `due` (với `due < now`) | - Không cập nhật `actual*` (vì task chưa thực sự bắt đầu). | ✅ |

---

### **Trường hợp KHÔNG THỂ cưỡng ép chuyển status**

1. **`backlog` → `todo`**
   - Khi `start <= now` (dù đã có hay nhập mới).
2. **`backlog` → `in-progress`**
   - Khi `start > now` (dù đã có hay nhập mới).
3. **`backlog` → `overdue`**
   - Khi `due >= now` hoặc thiếu `dueDate/dueTime`.

→ Riêng **`backlog` → `done`** luôn thành công sau khi xử lý dữ liệu.

---

### **Tổng hợp logic trạng thái dựa trên thời gian**

| Status        | Điều kiện hiển thị                                     |
| ------------- | ------------------------------------------------------ |
| `backlog`     | Chưa có `startDate/startTime` (bắt buộc).              |
| `todo`        | Có `start`, và `start > now`.                          |
| `in-progress` | Có `start`, và `start <= now` (không phụ thuộc `due`). |
| `done`        | Có `actualEnd` (và ngầm định có `start`).              |
| `overdue`     | Có `due`, `due < now`, và chưa `done`.                 |

---

### **Kết luận**

- **Cưỡng ép thành công** khi:
  - `todo`: `start > now` (phải nhập nếu thiếu).
  - `in-progress`: `start <= now` (tự gán nếu thiếu).
  - `done`: Luôn thành công sau khi đảm bảo có `start`.
  - `overdue`: `due < now` (phải nhập nếu thiếu).
- **Hệ thống phải hiện form nhập** khi thiếu dữ liệu bắt buộc (`start` cho mọi status, `due` riêng cho `overdue`).
- **Không bao giờ** để task ở `backlog` nếu đã có `startDate/startTime` (tuân thủ nghiêm ngặt luật quản lý task).
