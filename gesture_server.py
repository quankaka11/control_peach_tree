"""
Hand Gesture Control Server
Provides WebSocket API for real-time hand gesture recognition
"""
import asyncio
import json
import mediapipe as mp
import cv2
import numpy as np
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# ================== CONFIG ==================
CAM_W, CAM_H = 640, 480
CLICK_THRESHOLD = 30
SWIPE_THRESHOLD = 40
DRAG_THRESHOLD = 0.15  # Distance threshold for drag detection

# Display settings
SHOW_CAMERA_WINDOW = True  # Set to False to disable camera preview
WINDOW_NAME = "Hand Gesture Control - Camera Feed"
PREVIEW_WIDTH = 480  # Smaller preview window
PREVIEW_HEIGHT = 360

# ============================================

app = FastAPI(title="Hand Gesture Control API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", " http://localhost:8080"],  # Vite default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MediaPipe setup
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

class GestureDetector:
    def __init__(self):
        self.prev_x = None
        self.prev_y = None
        self.dragging = False
        self.last_swipe_time = time.time()
        self.last_click_time = time.time()
        self.cap = None
        
    def get_distance(self, p1, p2):
        """Calculate Euclidean distance between two points"""
        return np.linalg.norm(np.array(p1) - np.array(p2))
    
    def fingers_up(self, lm):
        """Detect which fingers are up"""
        tips = [4, 8, 12, 16, 20]
        fingers = []
        # Thumb
        fingers.append(lm[tips[0]].x < lm[tips[0] - 1].x)
        # Other fingers
        for i in range(1, 5):
            fingers.append(lm[tips[i]].y < lm[tips[i] - 2].y)
        return fingers
    
    def draw_preview(self, img, hand_landmarks, gesture_type, cursor_pos=None):
        """Draw hand landmarks and gesture info on preview window"""
        if not SHOW_CAMERA_WINDOW:
            return
        
        # Draw hand landmarks
        if hand_landmarks:
            mp_draw = mp.solutions.drawing_utils
            mp_draw.draw_landmarks(
                img, 
                hand_landmarks, 
                mp_hands.HAND_CONNECTIONS,
                mp_draw.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
                mp_draw.DrawingSpec(color=(0, 255, 255), thickness=2)
            )
            
            # Draw cursor position
            if cursor_pos:
                cx_px = int(cursor_pos[0] * CAM_W)
                cy_px = int(cursor_pos[1] * CAM_H)
                cv2.circle(img, (cx_px, cy_px), 10, (255, 0, 255), -1)
                cv2.circle(img, (cx_px, cy_px), 15, (255, 0, 255), 2)
        
        # Draw gesture status overlay
        overlay_height = 80
        overlay = img.copy()
        cv2.rectangle(overlay, (0, 0), (CAM_W, overlay_height), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.6, img, 0.4, 0, img)
        
        # Gesture type text
        gesture_text = f"Gesture: {gesture_type.upper()}"
        cv2.putText(img, gesture_text, (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        
        # Status indicator
        if gesture_type == "no_hand":
            status_color = (0, 0, 255)  # Red
            status_text = "No Hand Detected"
        elif gesture_type == "click":
            status_color = (255, 0, 255)  # Magenta
            status_text = "CLICK!"
        elif gesture_type in ["drag_start", "dragging"]:
            status_color = (0, 165, 255)  # Orange
            status_text = "DRAGGING"
        elif gesture_type == "swipe":
            status_color = (255, 255, 0)  # Cyan
            status_text = "SWIPE!"
        else:
            status_color = (0, 255, 0)  # Green
            status_text = "Hand Detected"
        
        cv2.putText(img, status_text, (10, 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)
        
        # Resize for preview
        preview = cv2.resize(img, (PREVIEW_WIDTH, PREVIEW_HEIGHT))
        cv2.imshow(WINDOW_NAME, preview)
        cv2.waitKey(1)
    
    def start_camera(self):
        """Initialize camera"""
        if self.cap is None:
            self.cap = cv2.VideoCapture(0)
            self.cap.set(3, CAM_W)
            self.cap.set(4, CAM_H)
            
            if SHOW_CAMERA_WINDOW:
                cv2.namedWindow(WINDOW_NAME, cv2.WINDOW_NORMAL)
                cv2.resizeWindow(WINDOW_NAME, PREVIEW_WIDTH, PREVIEW_HEIGHT)
    
    def stop_camera(self):
        """Release camera"""
        if self.cap is not None:
            self.cap.release()
            self.cap = None
        
        if SHOW_CAMERA_WINDOW:
            cv2.destroyAllWindows()
    
    async def detect_gestures(self, websocket: WebSocket):
        """Main gesture detection loop"""
        self.start_camera()
        
        try:
            while True:
                success, img = self.cap.read()
                if not success:
                    await asyncio.sleep(0.01)
                    continue
                
                img = cv2.flip(img, 1)
                rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                result = hands.process(rgb)
                
                gesture_data = {
                    "type": "none",
                    "timestamp": time.time()
                }
                
                if result.multi_hand_landmarks:
                    hand = result.multi_hand_landmarks[0]
                    lm = hand.landmark
                    
                    index_tip = lm[8]
                    thumb_tip = lm[4]
                    
                    # Normalized coordinates (0-1)
                    cx = index_tip.x
                    cy = index_tip.y
                    
                    # Send cursor position
                    gesture_data["cursor"] = {
                        "x": cx,
                        "y": cy
                    }
                    
                    # Detect pinch (click gesture)
                    dist = self.get_distance(
                        (index_tip.x, index_tip.y),
                        (thumb_tip.x, thumb_tip.y)
                    )
                    
                    current_time = time.time()
                    
                    if dist < CLICK_THRESHOLD / CAM_W:  # Normalize threshold
                        if current_time - self.last_click_time > 0.3:  # Debounce
                            gesture_data["type"] = "click"
                            gesture_data["action"] = "pinch"
                            self.last_click_time = current_time
                    
                    # Detect fist (drag gesture)
                    finger_state = self.fingers_up(lm)
                    if finger_state == [False, False, False, False, False]:
                        if not self.dragging:
                            gesture_data["type"] = "drag_start"
                            self.dragging = True
                        else:
                            gesture_data["type"] = "dragging"
                    else:
                        if self.dragging:
                            gesture_data["type"] = "drag_end"
                            self.dragging = False
                    
                    # Detect swipe (rotate gesture)
                    if self.prev_x is not None and current_time - self.last_swipe_time > 0.6:
                        dx = cx - self.prev_x
                        if abs(dx) > SWIPE_THRESHOLD / CAM_W:
                            if dx > 0:
                                gesture_data["type"] = "swipe"
                                gesture_data["direction"] = "right"
                                gesture_data["action"] = "rotate_right"
                            else:
                                gesture_data["type"] = "swipe"
                                gesture_data["direction"] = "left"
                                gesture_data["action"] = "rotate_left"
                            self.last_swipe_time = current_time
                    
                    self.prev_x = cx
                    self.prev_y = cy
                    
                    # Draw preview window with hand tracking
                    self.draw_preview(img, hand, gesture_data["type"], (cx, cy))
                else:
                    # No hand detected
                    gesture_data["type"] = "no_hand"
                    self.prev_x = None
                    self.prev_y = None
                    if self.dragging:
                        gesture_data["type"] = "drag_end"
                        self.dragging = False
                    
                    # Draw preview window without hand
                    self.draw_preview(img, None, gesture_data["type"])
                
                # Send gesture data to frontend
                await websocket.send_json(gesture_data)
                await asyncio.sleep(0.03)  # ~30 FPS
                
        except Exception as e:
            print(f"Error in gesture detection: {e}")
        finally:
            self.stop_camera()

# Global detector instance
detector = GestureDetector()

@app.websocket("/ws/gestures")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for gesture streaming"""
    await websocket.accept()
    print("Client connected to gesture stream")
    
    try:
        await detector.detect_gestures(websocket)
    except WebSocketDisconnect:
        print("Client disconnected from gesture stream")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        detector.stop_camera()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "Hand Gesture Control API",
        "websocket": "/ws/gestures"
    }

@app.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy"}

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Starting Hand Gesture Control Server...")
    print("=" * 60)
    print("📡 WebSocket endpoint: ws://localhost:8000/ws/gestures")
    print("🌐 Frontend should connect to this endpoint")
    print("🎥 Camera Preview:", "ENABLED" if SHOW_CAMERA_WINDOW else "DISABLED")
    if SHOW_CAMERA_WINDOW:
        print(f"   └─ Window: '{WINDOW_NAME}'")
        print(f"   └─ Size: {PREVIEW_WIDTH}x{PREVIEW_HEIGHT}")
    print("=" * 60)
    print("\n💡 Tip: Set SHOW_CAMERA_WINDOW = False to disable preview\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
