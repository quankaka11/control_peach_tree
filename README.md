# 🌸 Peach Tree - Hand Gesture Control

Ứng dụng cây đào Tết với điều khiển bằng cử chỉ tay sử dụng AI.

## 🚀 Quick Start

### 1. Cài đặt Backend (Python)

```bash
# Cài đặt dependencies
pip install -r requirements.txt

# Chạy gesture server
python gesture_server.py
```

### 2. Cài đặt Frontend (React)

```bash
cd frontend

# Cài đặt packages
npm install

# Chạy dev server
npm run dev
```

### 3. Sử dụng

1. Mở browser tại `http://localhost:5173`
2. Click nút "Bật điều khiển tay" ở góc trên trái
3. Cho phép truy cập camera
4. Bắt đầu sử dụng cử chỉ tay!

## 👋 Các cử chỉ

| Cử chỉ | Hành động |
|--------|-----------|
| 👆 Chạm 2 ngón (ngón trỏ + ngón cái) | Thêm quà/thiệp |
| ✊ Nắm tay | Kéo để xoay cây |
| 👉 Vuốt phải | Xoay cây sang phải |
| 👈 Vuốt trái | Xoay cây sang trái |

## 📁 Cấu trúc dự án

```
scrool_peach_tree/
├── gesture_server.py          # WebSocket server cho hand tracking
├── hand_control.py            # Script điều khiển chuột gốc
├── requirements.txt           # Python dependencies
├── HAND_GESTURE_GUIDE.md     # Hướng dẫn chi tiết
└── frontend/
    ├── src/
    │   ├── hooks/
    │   │   └── useHandGesture.ts      # React hook cho gesture control
    │   ├── components/
    │   │   └── ui/
    │   │       └── GestureIndicator.tsx  # UI hiển thị trạng thái
    │   └── pages/
    │       └── Index.tsx              # Tích hợp gesture vào scene
    └── package.json
```

## 🛠️ Tech Stack

### Backend
- **FastAPI** - WebSocket server
- **MediaPipe** - Hand tracking AI
- **OpenCV** - Camera processing

### Frontend
- **React + TypeScript** - UI framework
- **Vite** - Build tool
- **Three.js** - 3D rendering
- **Framer Motion** - Animations
- **WebSocket** - Real-time communication

## 📖 Tài liệu

Xem [HAND_GESTURE_GUIDE.md](./HAND_GESTURE_GUIDE.md) để biết thêm chi tiết về:
- Kiến trúc hệ thống
- Cấu hình chi tiết
- Tùy chỉnh cử chỉ
- Xử lý lỗi
- Performance tips

## 🎯 Tính năng

- ✅ Hand tracking real-time với MediaPipe
- ✅ WebSocket communication
- ✅ Gesture recognition (click, drag, swipe)
- ✅ 3D scene control
- ✅ Auto-reconnect
- ✅ Visual feedback
- ✅ Responsive UI

## 🔧 Troubleshooting

**Server không chạy?**
```bash
# Kiểm tra port 8000
netstat -ano | findstr :8000
```

**Camera không hoạt động?**
- Kiểm tra quyền truy cập camera
- Đảm bảo không có app khác đang dùng camera

**WebSocket không kết nối?**
- Đảm bảo Python server đang chạy
- Kiểm tra console log trong browser

## 📝 License

MIT

---

Made with ❤️ for Tết 2025
