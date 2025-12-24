"""
Test script for gesture server
Run this to verify the gesture detection is working
"""
import asyncio
import websockets
import json

async def test_gesture_server():
    uri = "ws://localhost:8000/ws/gestures"
    
    print("🔌 Connecting to gesture server...")
    print(f"📡 URI: {uri}")
    print("-" * 50)
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected successfully!")
            print("👋 Move your hand in front of the camera")
            print("📊 Receiving gesture data...\n")
            
            gesture_count = 0
            
            async for message in websocket:
                data = json.loads(message)
                gesture_count += 1
                
                # Clear previous line
                print(f"\r[{gesture_count}] ", end="")
                
                # Display gesture type
                gesture_type = data.get('type', 'unknown')
                
                if gesture_type == 'click':
                    print("👆 CLICK detected!", end="")
                elif gesture_type == 'drag_start':
                    print("✊ DRAG START!", end="")
                elif gesture_type == 'dragging':
                    print("🤜 Dragging...", end="")
                elif gesture_type == 'drag_end':
                    print("🖐️ DRAG END!", end="")
                elif gesture_type == 'swipe':
                    direction = data.get('direction', '?')
                    if direction == 'right':
                        print("👉 SWIPE RIGHT!", end="")
                    else:
                        print("👈 SWIPE LEFT!", end="")
                elif gesture_type == 'no_hand':
                    print("❌ No hand detected", end="")
                else:
                    print(f"🖐️ Hand detected", end="")
                
                # Display cursor position if available
                if 'cursor' in data:
                    cursor = data['cursor']
                    print(f" | Cursor: ({cursor['x']:.2f}, {cursor['y']:.2f})", end="")
                
                # Flush output
                print("", flush=True)
                
    except websockets.exceptions.WebSocketException as e:
        print(f"\n❌ WebSocket error: {e}")
        print("\n💡 Make sure the gesture server is running:")
        print("   python gesture_server.py")
    except ConnectionRefusedError:
        print(f"\n❌ Connection refused!")
        print("\n💡 Start the gesture server first:")
        print("   python gesture_server.py")
    except KeyboardInterrupt:
        print("\n\n👋 Test stopped by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    print("=" * 50)
    print("🧪 Gesture Server Test Client")
    print("=" * 50)
    print()
    
    asyncio.run(test_gesture_server())
    
    print("\n" + "=" * 50)
    print("✅ Test completed")
    print("=" * 50)
