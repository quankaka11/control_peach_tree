# 🖐️ Hệ thống 6 Gesture Mới

## Tổng quan

Đã cập nhật hệ thống điều khiển bằng tay thành **6 gesture đơn giản và trực quan**:

## 📋 Danh sách 6 Gesture

| # | Gesture | Hành động | Mô tả |
|---|---------|-----------|-------|
| 1 | 👆 **Chạm 2 ngón** (Ngón trỏ + Ngón cái) | Thêm quà/thiệp | Bên trái màn hình: thêm quà, Bên phải: thêm thiệp |
| 2 | ✊ **Nắm tay** (5 ngón xuống) | Đóng thiệp/quà | Đóng modal nếu đang mở |
| 3 | 🖐️ **Mở tay** (5 ngón lên) | Mở quà/thiệp ngẫu nhiên | Chọn và mở 1 item ngẫu nhiên |
| 4 | 👈 **Vuốt trái** | Xoay cây sang trái | Xoay 90° sang trái |
| 5 | 👉 **Vuốt phải** | Xoay cây sang phải | Xoay 90° sang phải |
| 6 | ⬆️⬇️ **Vuốt lên/xuống** | Di chuyển cây lên/xuống | Nghiêng cây lên hoặc xuống |

## 🔄 Thay đổi so với trước

### ❌ Đã xóa
- **Kéo để xoay** (drag to rotate) - Quá phức tạp và khó điều khiển

### ✅ Đã thêm/Thay đổi
- **Nắm tay**: Từ "kéo để xoay" → "Đóng thiệp/quà"
- **Mở tay**: Mở quà/thiệp ngẫu nhiên
- **Vuốt lên/xuống**: Di chuyển cây lên/xuống (đã có từ trước)

## 💡 Logic thông minh

### Auto-close Modal
Modal sẽ tự động đóng khi:
- ✊ Nắm tay (chủ động đóng)
- Không còn auto-close khi xoay/di chuyển (để dễ quan sát)

### Random Item Selection
Khi mở tay (🖐️):
1. Chọn ngẫu nhiên từ tất cả quà + thiệp
2. Tự động xác định loại (quà hay thiệp)
3. Hiển thị modal tương ứng
4. Toast notification với icon và mô tả

## 🎯 Ưu điểm

1. **Đơn giản hơn**: 6 gesture rõ ràng, dễ nhớ
2. **Trực quan hơn**: 
   - Nắm = Đóng
   - Mở = Mở
   - Vuốt = Di chuyển/Xoay
3. **Ít xung đột**: Mỗi gesture có 1 chức năng duy nhất
4. **Dễ thực hiện**: Không cần giữ tay ở tư thế phức tạp

## 📝 Code Changes

### Backend (gesture_server.py)
```python
# Phát hiện mở tay (5 ngón lên)
if finger_state == [True, True, True, True, True]:
    gesture_data["type"] = "open_hand"
    gesture_data["action"] = "open_item"
```

### Frontend (Index.tsx)
```typescript
onDragStart: () => {
  // Nắm tay - Đóng modal
  if (modalOpen) {
    setModalOpen(false);
    toast.info('✊ Nắm tay - Đóng thiệp/quà');
  }
},

onOpenHand: () => {
  // Mở tay - Mở item ngẫu nhiên
  const randomItem = allItems[randomIndex];
  setModalOpen(true);
  toast.success('🖐️ Mở tay - Xem quà ngẫu nhiên!');
}
```

## 🎨 UI Updates

### GestureIndicator
- Icon: `HandMetal` cho open_hand
- Text: 
  - "Nắm tay - Đóng thiệp/quà"
  - "Mở tay (5 ngón)"
  - "Vuốt tay - Xoay/Di chuyển"

### Toast Notifications
- ✊ Nắm tay - Đóng thiệp/quà
- 🖐️ Mở tay - Xem quà ngẫu nhiên!
- ⬅️ Xoay trái
- ➡️ Xoay phải
- ⬆️ Di chuyển lên
- ⬇️ Di chuyển xuống

## 🧪 Cách test

1. **Thêm quà/thiệp**: Chạm 2 ngón (trái/phải màn hình)
2. **Mở ngẫu nhiên**: Mở tay (5 ngón lên)
3. **Đóng**: Nắm tay (5 ngón xuống)
4. **Xoay**: Vuốt trái/phải
5. **Di chuyển**: Vuốt lên/xuống

## 📊 Gesture Detection

| Gesture | Finger State | Threshold |
|---------|--------------|-----------|
| Chạm 2 ngón | - | distance < 30px |
| Nắm tay | [F, F, F, F, F] | - |
| Mở tay | [T, T, T, T, T] | - |
| Vuốt | - | dx/dy > 40px |

## 🔧 Troubleshooting

### Gesture không nhận
- Đảm bảo ánh sáng đủ
- Giữ tay trong khung hình
- Thực hiện gesture rõ ràng

### Modal không đóng
- Kiểm tra đã nắm tay đúng cách (5 ngón xuống)
- Xem console log để debug

### Xoay không mượt
- Đã fix: góc xoay tăng lên 90°
- Smooth interpolation với factor 0.1

---

**Hệ thống 6 gesture đơn giản, mạnh mẽ và dễ sử dụng! 🎉**
