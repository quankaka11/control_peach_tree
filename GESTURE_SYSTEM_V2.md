# Hệ Thống Cử Chỉ Tay V2 - 5 Hành Động

## Tổng Quan

Hệ thống cử chỉ tay đã được thiết kế lại với **5 hành động cơ bản** và **logic chống triệt tiêu** để tránh các hành động vô tình khi tay quay về vị trí trung tính.

## 5 Hành Động Chính

### 1. 👌 PINCH (Chạm Ngón Trỏ + Ngón Cái)
- **Mục đích**: Thêm quà hoặc thiệp
- **Cách thực hiện**: Chạm ngón trỏ và ngón cái lại với nhau
- **Logic**:
  - Nếu vị trí tay ở bên trái màn hình (x < 0.5) → Thêm quà
  - Nếu vị trí tay ở bên phải màn hình (x >= 0.5) → Thêm thiệp
- **Cooldown**: 0.8 giây

### 2. ⬅️ SWIPE LEFT (Vuốt Tay Sang Trái)
- **Mục đích**: Xoay cây đào sang trái
- **Cách thực hiện**: Di chuyển tay sang trái một khoảng đủ xa (>80px)
- **Logic chống triệt tiêu**:
  - Yêu cầu di chuyển liên tục 3 frames theo cùng hướng
  - Khi tay quay về phải (về vị trí ban đầu), KHÔNG trigger xoay phải
  - Reset điểm bắt đầu sau mỗi lần trigger
- **Cooldown**: 0.8 giây

### 3. ➡️ SWIPE RIGHT (Vuốt Tay Sang Phải)
- **Mục đích**: Xoay cây đào sang phải
- **Cách thực hiện**: Di chuyển tay sang phải một khoảng đủ xa (>80px)
- **Logic chống triệt tiêu**: Tương tự SWIPE LEFT
- **Cooldown**: 0.8 giây

### 4. ⬆️ SWIPE UP (Vuốt Tay Lên)
- **Mục đích**: Mở quà/thiệp ngẫu nhiên
- **Cách thực hiện**: Di chuyển tay lên trên một khoảng đủ xa (>80px)
- **Logic chống triệt tiêu**:
  - Yêu cầu di chuyển liên tục 3 frames theo hướng lên
  - Khi tay hạ xuống (về vị trí ban đầu), KHÔNG trigger đóng modal
  - Chỉ trigger khi không có chuyển động ngang
- **Cooldown**: 0.8 giây

### 5. ⬇️ SWIPE DOWN (Vuốt Tay Xuống)
- **Mục đích**: Đóng quà/thiệp (chỉ khi có modal đang mở)
- **Cách thực hiện**: Di chuyển tay xuống dưới một khoảng đủ xa (>80px)
- **Điều kiện**: Chỉ hoạt động khi `modalIsOpen = true`
- **Logic chống triệt tiêu**: Tương tự SWIPE UP
- **Cooldown**: 0.8 giây

## Cơ Chế Chống Triệt Tiêu

### 1. Movement Tracking
```python
self.movement_start_x = None  # Vị trí bắt đầu di chuyển
self.movement_start_y = None
self.movement_direction = None  # Hướng di chuyển hiện tại
self.movement_confirmed_frames = 0  # Số frame xác nhận
```

### 2. Confirmation Frames
- Yêu cầu **3 frames liên tiếp** theo cùng hướng mới xác nhận cử chỉ
- Ngăn chặn trigger vô tình do tay rung

### 3. Threshold Cao
- Horizontal threshold: **80px** (tăng từ 40px)
- Vertical threshold: **80px** (tăng từ 30px)
- Yêu cầu di chuyển rõ ràng, có chủ đích

### 4. Reset Tracking
- Khi tay về vị trí trung tính (không di chuyển đáng kể):
  ```python
  self.movement_start_x = cx  # Reset về vị trí hiện tại
  self.movement_start_y = cy
  self.movement_direction = None
  self.movement_confirmed_frames = 0
  ```
- Ngăn chặn trigger khi tay quay về vị trí ban đầu

### 5. Separate Cooldowns
- Mỗi loại gesture có cooldown riêng:
  - `last_pinch_time`
  - `last_swipe_horizontal_time` (cho left/right)
  - `last_swipe_vertical_time` (cho up/down)

## Luồng Hoạt Động

### Ví dụ: Xoay Trái rồi Quay Về
1. **Frame 1-5**: Tay di chuyển sang trái
   - `movement_start_x = 0.5`
   - `dx = -0.15` (đủ lớn)
   - `movement_direction = 'left'`
   - `movement_confirmed_frames = 3` → **TRIGGER ROTATE LEFT**
   
2. **Frame 6-10**: Tay quay về phải (về vị trí ban đầu)
   - `movement_start_x = 0.35` (đã reset sau trigger)
   - `dx = +0.10` (chưa đủ lớn để trigger)
   - **KHÔNG TRIGGER ROTATE RIGHT** ✅

3. **Frame 11**: Tay về vị trí trung tính
   - Reset tất cả tracking
   - Sẵn sàng cho gesture tiếp theo

### Ví dụ: Mở Modal rồi Hạ Tay
1. **Swipe Up**: Tay di chuyển lên → Mở modal
   - `modalIsOpen = true`
   
2. **Tay hạ xuống** (về vị trí ban đầu):
   - Vì `movement_start_y` đã reset sau trigger
   - Di chuyển chưa đủ lớn
   - **KHÔNG TRIGGER CLOSE** ✅

3. **Muốn đóng modal**: Phải swipe down một cách rõ ràng
   - Di chuyển >80px xuống dưới
   - Giữ 3 frames
   - → **TRIGGER CLOSE** ✅

## Cấu Hình

### Backend (gesture_server.py)
```python
PINCH_THRESHOLD = 30  # Khoảng cách pinch
SWIPE_HORIZONTAL_THRESHOLD = 80  # Ngưỡng vuốt ngang
SWIPE_VERTICAL_THRESHOLD = 80  # Ngưỡng vuốt dọc
GESTURE_COOLDOWN = 0.8  # Thời gian cooldown (giây)
MOVEMENT_CONFIRMATION_FRAMES = 3  # Số frame xác nhận
```

### Frontend (useHandGesture.ts)
```typescript
interface GestureCallbacks {
  onPinch?: () => void;
  onRotateLeft?: () => void;
  onRotateRight?: () => void;
  onOpenModal?: () => void;
  onCloseModal?: () => void;
  modalIsOpen?: boolean;  // Đồng bộ trạng thái modal
}
```

## Lợi Ích

✅ **Không còn hành động triệt tiêu**: Tay quay về không trigger hành động ngược lại
✅ **Gesture rõ ràng**: Threshold cao yêu cầu di chuyển có chủ đích
✅ **Ổn định**: Confirmation frames ngăn trigger vô tình
✅ **Đơn giản**: Chỉ 5 hành động dễ nhớ, dễ thực hiện
✅ **Thông minh**: Modal state awareness (swipe down chỉ hoạt động khi cần)

## Testing

### Test Case 1: Xoay Trái/Phải
1. Vuốt tay sang trái → Cây xoay trái ✅
2. Đưa tay về vị trí ban đầu → Cây KHÔNG xoay phải ✅
3. Vuốt tay sang phải → Cây xoay phải ✅

### Test Case 2: Mở/Đóng Modal
1. Vuốt tay lên → Modal mở ✅
2. Hạ tay về → Modal KHÔNG đóng ✅
3. Vuốt tay xuống → Modal đóng ✅
4. Vuốt tay xuống khi modal đã đóng → Không có gì xảy ra ✅

### Test Case 3: Thêm Quà/Thiệp
1. Đưa tay sang trái, pinch → Thêm quà ✅
2. Đưa tay sang phải, pinch → Thêm thiệp ✅

## Hướng Dẫn Sử Dụng

1. **Bật điều khiển tay**: Click nút "👋 Bật điều khiển tay"
2. **Đảm bảo camera hoạt động**: Indicator màu xanh = OK
3. **Thực hiện cử chỉ**:
   - Pinch để thêm
   - Vuốt ngang để xoay
   - Vuốt lên để mở
   - Vuốt xuống để đóng
4. **Lưu ý**: Mỗi cử chỉ cần di chuyển rõ ràng, có cooldown 0.8s

## Troubleshooting

**Q: Gesture không được nhận diện?**
- Kiểm tra threshold có đủ lớn không (>80px)
- Đảm bảo di chuyển theo 1 hướng (không chéo)
- Chờ cooldown kết thúc (0.8s)

**Q: Vẫn bị trigger khi tay quay về?**
- Kiểm tra logic reset tracking
- Tăng MOVEMENT_CONFIRMATION_FRAMES lên 4-5

**Q: Swipe down không hoạt động?**
- Kiểm tra `modalIsOpen` có được truyền đúng không
- Đảm bảo modal đang mở
