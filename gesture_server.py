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
PINCH_THRESHOLD = 30  # Pinch distance for adding items
SWIPE_HORIZONTAL_THRESHOLD = 80  # Horizontal swipe threshold (increased to prevent accidental triggers)
SWIPE_VERTICAL_THRESHOLD = 80  # Vertical swipe threshold (increased)
GESTURE_COOLDOWN = 0.8  # Cooldown between gestures to prevent cancellation
MOVEMENT_CONFIRMATION_FRAMES = 3  # Number of frames to confirm movement direction

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
        
        # Gesture cooldowns (separate for each type)
        self.last_pinch_time = 0
        self.last_swipe_horizontal_time = 0
        self.last_swipe_vertical_time = 0
        
        # Movement tracking for anti-cancellation
        self.movement_start_x = None
        self.movement_start_y = None
        self.movement_direction = None  # 'left', 'right', 'up', 'down', or None
        self.movement_confirmed_frames = 0
        
        # Camera management
        self.cap = None
        self.active_connections = 0
        self.camera_lock = False
        
    def get_distance(self, p1, p2):
        """Calculate Euclidean distance between two points"""
        return np.linalg.norm(np.array(p1) - np.array(p2))

    
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
        elif gesture_type == "open_hand":
            status_color = (147, 112, 219)  # Purple
            status_text = "OPEN HAND - View Item!"
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
            if not self.cap.isOpened():
                print("❌ Failed to open camera")
                self.cap = None
                return False
            
            self.cap.set(3, CAM_W)
            self.cap.set(4, CAM_H)
            
            if SHOW_CAMERA_WINDOW:
                cv2.namedWindow(WINDOW_NAME, cv2.WINDOW_NORMAL)
                cv2.resizeWindow(WINDOW_NAME, PREVIEW_WIDTH, PREVIEW_HEIGHT)
            
            print(f"📷 Camera initialized")
        
        self.active_connections += 1
        print(f"👥 Active connections: {self.active_connections}")
        return True
    
    def stop_camera(self):
        """Release camera only when no active connections"""
        self.active_connections = max(0, self.active_connections - 1)
        print(f"👥 Active connections: {self.active_connections}")
        
        if self.active_connections == 0 and self.cap is not None:
            self.cap.release()
            self.cap = None
            
            if SHOW_CAMERA_WINDOW:
                cv2.destroyAllWindows()
            
            print("📷 Camera released")
    
    async def detect_gestures(self, websocket: WebSocket):
        """Main gesture detection loop"""
        if not self.start_camera():
            print("❌ Cannot start camera, aborting gesture detection")
            return
        
        try:
            while True:
                if self.cap is None:
                    print("❌ Camera is None, breaking loop")
                    break
                    
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
                    
                    current_time = time.time()
                    
                    # ========== ACTION 1: PINCH (Add Gift/Card) ==========
                    dist = self.get_distance(
                        (index_tip.x, index_tip.y),
                        (thumb_tip.x, thumb_tip.y)
                    )
                    
                    if dist < PINCH_THRESHOLD / CAM_W:
                        if current_time - self.last_pinch_time > GESTURE_COOLDOWN:
                            gesture_data["type"] = "pinch"
                            gesture_data["action"] = "add_item"
                            self.last_pinch_time = current_time
                            print(f"👌 PINCH detected! Adding item...")
                    
                    # ========== SWIPE DETECTION WITH ANTI-CANCELLATION ==========
                    # Initialize movement tracking
                    if self.movement_start_x is None:
                        self.movement_start_x = cx
                        self.movement_start_y = cy
                    
                    # Calculate movement from start position
                    dx = cx - self.movement_start_x
                    dy = cy - self.movement_start_y
                    
                    # Convert to pixels for threshold comparison
                    dx_px = abs(dx * CAM_W)
                    dy_px = abs(dy * CAM_H)
                    
                    # Determine if we have significant movement
                    has_horizontal_movement = dx_px > SWIPE_HORIZONTAL_THRESHOLD
                    has_vertical_movement = dy_px > SWIPE_VERTICAL_THRESHOLD
                    
                    # ========== ACTION 2 & 3: SWIPE LEFT/RIGHT (Rotate) ==========
                    if has_horizontal_movement and not has_vertical_movement:
                        # Determine direction
                        new_direction = 'right' if dx > 0 else 'left'
                        
                        # Confirm movement direction
                        if self.movement_direction == new_direction:
                            self.movement_confirmed_frames += 1
                        else:
                            self.movement_direction = new_direction
                            self.movement_confirmed_frames = 1
                        
                        # Trigger gesture only if confirmed and cooldown passed
                        if (self.movement_confirmed_frames >= MOVEMENT_CONFIRMATION_FRAMES and 
                            current_time - self.last_swipe_horizontal_time > GESTURE_COOLDOWN):
                            
                            gesture_data["type"] = "swipe"
                            gesture_data["direction"] = new_direction
                            gesture_data["action"] = f"rotate_{new_direction}"
                            self.last_swipe_horizontal_time = current_time
                            
                            # Reset movement tracking to prevent re-trigger
                            self.movement_start_x = cx
                            self.movement_start_y = cy
                            self.movement_direction = None
                            self.movement_confirmed_frames = 0
                            
                            print(f"{'➡️' if new_direction == 'right' else '⬅️'} SWIPE {new_direction.upper()} detected!")
                    
                    # ========== ACTION 4 & 5: SWIPE UP/DOWN (Open/Close Modal) ==========
                    elif has_vertical_movement and not has_horizontal_movement:
                        # Determine direction (remember: y increases downward)
                        new_direction = 'up' if dy < 0 else 'down'
                        
                        # Confirm movement direction
                        if self.movement_direction == new_direction:
                            self.movement_confirmed_frames += 1
                        else:
                            self.movement_direction = new_direction
                            self.movement_confirmed_frames = 1
                        
                        # Trigger gesture only if confirmed and cooldown passed
                        if (self.movement_confirmed_frames >= MOVEMENT_CONFIRMATION_FRAMES and 
                            current_time - self.last_swipe_vertical_time > GESTURE_COOLDOWN):
                            
                            # Swipe UP: Always opens modal
                            if new_direction == 'up':
                                gesture_data["type"] = "swipe"
                                gesture_data["direction"] = "up"
                                gesture_data["action"] = "open_modal"
                                self.last_swipe_vertical_time = current_time
                                print(f"⬆️ SWIPE UP detected! Opening modal...")
                            
                            # Swipe DOWN: Send to frontend (frontend will check if modal is open)
                            elif new_direction == 'down':
                                gesture_data["type"] = "swipe"
                                gesture_data["direction"] = "down"
                                gesture_data["action"] = "close_modal"
                                self.last_swipe_vertical_time = current_time
                                print(f"⬇️ SWIPE DOWN detected! Sending close signal...")
                            
                            # Reset movement tracking
                            self.movement_start_x = cx
                            self.movement_start_y = cy
                            self.movement_direction = None
                            self.movement_confirmed_frames = 0
                    
                    # Reset movement tracking if hand is relatively still
                    elif not has_horizontal_movement and not has_vertical_movement:
                        # Hand returned to neutral - reset tracking
                        self.movement_start_x = cx
                        self.movement_start_y = cy
                        self.movement_direction = None
                        self.movement_confirmed_frames = 0
                    
                    # Update previous position
                    self.prev_x = cx
                    self.prev_y = cy
                    
                    # Draw preview window with hand tracking
                    self.draw_preview(img, hand, gesture_data["type"], (cx, cy))
                else:
                    # No hand detected - reset all tracking
                    gesture_data["type"] = "no_hand"
                    self.prev_x = None
                    self.prev_y = None
                    self.movement_start_x = None
                    self.movement_start_y = None
                    self.movement_direction = None
                    self.movement_confirmed_frames = 0
                    
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
