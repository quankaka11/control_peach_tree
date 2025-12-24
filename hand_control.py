import cv2
import mediapipe as mp
import pyautogui
import numpy as np
import time

# ================== CONFIG ==================
SCREEN_W, SCREEN_H = pyautogui.size()
CAM_W, CAM_H = 640, 480

CLICK_THRESHOLD = 30
SWIPE_THRESHOLD = 40
SMOOTHING = 5

# ============================================

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)
mp_draw = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0)
cap.set(3, CAM_W)
cap.set(4, CAM_H)

prev_x = None
dragging = False
last_swipe_time = time.time()

def get_distance(p1, p2):
    return np.linalg.norm(np.array(p1) - np.array(p2))

def fingers_up(lm):
    tips = [4, 8, 12, 16, 20]
    fingers = []
    fingers.append(lm[tips[0]].x < lm[tips[0] - 1].x)
    for i in range(1, 5):
        fingers.append(lm[tips[i]].y < lm[tips[i] - 2].y)
    return fingers

while True:
    success, img = cap.read()
    if not success:
        break

    img = cv2.flip(img, 1)
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    result = hands.process(rgb)

    if result.multi_hand_landmarks:
        hand = result.multi_hand_landmarks[0]
        lm = hand.landmark

        index_tip = lm[8]
        thumb_tip = lm[4]

        cx = int(index_tip.x * CAM_W)
        cy = int(index_tip.y * CAM_H)

        screen_x = np.interp(cx, (0, CAM_W), (0, SCREEN_W))
        screen_y = np.interp(cy, (0, CAM_H), (0, SCREEN_H))

        pyautogui.moveTo(screen_x, screen_y, duration=0.01)

        dist = get_distance(
            (index_tip.x * CAM_W, index_tip.y * CAM_H),
            (thumb_tip.x * CAM_W, thumb_tip.y * CAM_H)
        )

        if dist < CLICK_THRESHOLD:
            pyautogui.click()
            time.sleep(0.25)

        finger_state = fingers_up(lm)
        if finger_state == [False, False, False, False, False]:
            if not dragging:
                pyautogui.mouseDown()
                dragging = True
        else:
            if dragging:
                pyautogui.mouseUp()
                dragging = False

        current_time = time.time()
        if prev_x is not None and current_time - last_swipe_time > 0.6:
            dx = cx - prev_x
            if dx > SWIPE_THRESHOLD:
                print("ROTATE RIGHT")
                last_swipe_time = current_time
            elif dx < -SWIPE_THRESHOLD:
                print("ROTATE LEFT")
                last_swipe_time = current_time

        prev_x = cx

        mp_draw.draw_landmarks(img, hand, mp_hands.HAND_CONNECTIONS)

    cv2.imshow("Hand Gesture Control", img)

    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
