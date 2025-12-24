# Hướng dẫn tích hợp Hand Gesture Control

## Tổng quan
Hệ thống điều khiển bằng tay sử dụng MediaPipe để nhận diện cử chỉ và WebSocket để giao tiếp real-time giữa Python backend và React frontend.

## Kiến trúc

```
┌─────────────────┐         WebSocket          ┌─────────────────┐
│  Python Server  │ ◄────────────────────────► │  React Frontend │
│  (FastAPI)      │   ws://localhost:8000      │  (Vite + React) │
│                 │                             │                 │
│  - MediaPipe    │                             │  - useHandGesture│
│  - Hand Tracking│                             │  - GestureIndicator│
│  - OpenCV       │                             │  - Scene Control │
└─────────────────┘                             └─────────────────┘
```

## Cài đặt

### 1. Backend (Python)

```bash
# Cài đặt dependencies
pip install -r requirements.txt

# Chạy server
python gesture_server.py
```

Server sẽ chạy tại: `http://localhost:8000`
WebSocket endpoint: `ws://localhost:8000/ws/gestures`

### 2. Frontend (React)

```bash
cd frontend

# Cài đặt dependencies (nếu chưa)
npm install

# Chạy dev server
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

## Cách sử dụng

### 1. Khởi động hệ thống

1. **Bật Python server**: `python gesture_server.py`
2. **Bật React frontend**: `cd frontend && npm run dev`
3. **Mở trình duyệt**: Truy cập `http://localhost:5173`
4. **Bật điều khiển tay**: Click nút "Bật điều khiển tay" ở góc trên bên trái

### 2. Các cử chỉ được hỗ trợ

| Cử chỉ | Mô tả | Hành động |
|--------|-------|-----------|
| 👆 **Chạm 2 ngón** | Chạm ngón trỏ và ngón cái lại với nhau | Click - Thêm quà (bên trái) hoặc thiệp (bên phải) |
| ✊ **Nắm tay** | Nắm tất cả các ngón tay lại | Kéo để xoay cây đào |
| 👉 **Vuốt phải** | Di chuyển tay nhanh sang phải | Xoay cây đào sang phải |
| 👈 **Vuốt trái** | Di chuyển tay nhanh sang trái | Xoay cây đào sang trái |
| 🖐️ **Di chuyển tay** | Di chuyển tay tự do | Di chuyển con trỏ ảo |

### 3. Giao diện người dùng

#### Nút Toggle (Góc trên trái)
- **Tắt**: Màu xám - "Bật điều khiển tay"
- **Bật**: Màu xanh - "Điều khiển bằng tay"

#### Gesture Indicator (Góc trên phải - khi bật)
- **Đèn trạng thái**:
  - 🔴 Đỏ: Không kết nối
  - 🟡 Vàng: Đã kết nối, chưa phát hiện tay
  - 🟢 Xanh: Đã phát hiện tay
- **Icon cử chỉ**: Hiển thị cử chỉ hiện tại
- **Text trạng thái**: Mô tả hành động

## Cấu trúc code

### Backend Files

#### `gesture_server.py`
```python
# FastAPI WebSocket server
# - Xử lý hand tracking với MediaPipe
# - Phát hiện các cử chỉ (click, drag, swipe)
# - Gửi dữ liệu real-time qua WebSocket
```

### Frontend Files

#### `src/hooks/useHandGesture.ts`
```typescript
// React hook để kết nối WebSocket
// - Quản lý kết nối và auto-reconnect
// - Xử lý gesture events
// - Cung cấp callbacks cho các cử chỉ
```

#### `src/components/ui/GestureIndicator.tsx`
```typescript
// Component hiển thị trạng thái
// - Đèn báo kết nối
// - Icon cử chỉ hiện tại
// - Thông tin debug (tùy chọn)
```

#### `src/pages/Index.tsx`
```typescript
// Tích hợp gesture control vào scene
// - useHandGesture hook
// - Callbacks cho từng cử chỉ
// - Toggle button và indicator
```

## Cấu hình

### Backend Configuration (`gesture_server.py`)

```python
CAM_W, CAM_H = 640, 480          # Độ phân giải camera
CLICK_THRESHOLD = 30             # Ngưỡng phát hiện chạm 2 ngón
SWIPE_THRESHOLD = 40             # Ngưỡng phát hiện vuốt
```

### Frontend Configuration (`useHandGesture.ts`)

```typescript
{
  enabled: true,                  // Bật/tắt gesture control
  serverUrl: 'ws://localhost:8000/ws/gestures',
  debug: true,                    // Hiển thị log console
  callbacks: {
    onClick: () => {},            // Callback khi chạm 2 ngón
    onDragStart: () => {},        // Callback khi bắt đầu kéo
    onDragging: (x, y) => {},     // Callback khi đang kéo
    onDragEnd: () => {},          // Callback khi kết thúc kéo
    onRotateLeft: () => {},       // Callback khi vuốt trái
    onRotateRight: () => {},      // Callback khi vuốt phải
    onSwipe: (dir) => {},         // Callback chung cho vuốt
  }
}
```

## Xử lý lỗi

### Lỗi thường gặp

1. **"Không kết nối được WebSocket"**
   - Kiểm tra Python server đã chạy chưa
   - Kiểm tra port 8000 có bị chiếm không
   - Xem console log để debug

2. **"Không phát hiện tay"**
   - Kiểm tra camera đã được cấp quyền
   - Đảm bảo ánh sáng đủ
   - Giữ tay trong khung hình camera

3. **"Cử chỉ không nhạy"**
   - Điều chỉnh threshold trong `gesture_server.py`
   - Kiểm tra khoảng cách từ camera
   - Thực hiện cử chỉ rõ ràng hơn

### Debug Mode

Bật debug trong hook:
```typescript
useHandGesture({
  debug: true,  // Hiển thị log trong console
})
```

## Tùy chỉnh

### Thêm cử chỉ mới

1. **Backend**: Thêm logic phát hiện trong `gesture_server.py`
```python
# Ví dụ: Phát hiện peace sign
if finger_state == [False, True, True, False, False]:
    gesture_data["type"] = "peace"
    gesture_data["action"] = "custom_action"
```

2. **Frontend**: Thêm callback trong `useHandGesture.ts`
```typescript
callbacks: {
  onPeace: () => {
    console.log('Peace sign detected!');
  }
}
```

### Thay đổi hành động

Chỉnh sửa callbacks trong `Index.tsx`:
```typescript
onClick: () => {
  // Thay đổi hành động khi click
  handleCustomAction();
}
```

## Performance Tips

1. **Giảm FPS nếu lag**: Thay đổi `await asyncio.sleep(0.03)` thành `0.05` trong `gesture_server.py`
2. **Tắt debug mode** trong production
3. **Sử dụng camera độ phân giải thấp hơn** nếu cần

## Tương lai

Các tính năng có thể mở rộng:
- [ ] Multi-hand tracking (2 tay)
- [ ] Gesture recording và playback
- [ ] Custom gesture training
- [ ] Mobile support với camera phone
- [ ] AR overlay trên video feed

## Troubleshooting

### Camera không hoạt động
```bash
# Kiểm tra camera
python -c "import cv2; print(cv2.VideoCapture(0).read())"
```

### WebSocket không kết nối
```bash
# Test WebSocket
curl http://localhost:8000/health
```

### Dependencies lỗi
```bash
# Reinstall Python packages
pip install --force-reinstall -r requirements.txt

# Reinstall Node packages
cd frontend && npm install --force
```

## Liên hệ & Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Console log (F12 trong browser)
2. Python server terminal output
3. Camera permissions
4. Network connectivity

---

**Chúc bạn thành công! 🎉**
