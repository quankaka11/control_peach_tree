import { useEffect, useRef, useState, useCallback } from 'react';

export interface GestureData {
  type: 'none' | 'click' | 'drag_start' | 'dragging' | 'drag_end' | 'swipe' | 'no_hand';
  cursor?: {
    x: number;
    y: number;
  };
  direction?: 'left' | 'right';
  action?: 'pinch' | 'rotate_left' | 'rotate_right';
  timestamp: number;
}

export interface GestureCallbacks {
  onCursorMove?: (x: number, y: number) => void;
  onClick?: () => void;
  onDragStart?: () => void;
  onDragging?: (x: number, y: number) => void;
  onDragEnd?: () => void;
  onRotateLeft?: () => void;
  onRotateRight?: () => void;
  onSwipe?: (direction: 'left' | 'right') => void;
}

interface UseHandGestureOptions {
  enabled?: boolean;
  serverUrl?: string;
  callbacks?: GestureCallbacks;
  debug?: boolean;
}

export const useHandGesture = ({
  enabled = true,
  serverUrl = 'ws://localhost:8000/ws/gestures',
  callbacks = {},
  debug = false,
}: UseHandGestureOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [lastGesture, setLastGesture] = useState<GestureData | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0.5, y: 0.5 });
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      if (debug) console.log('🔌 Connecting to gesture server:', serverUrl);
      
      const ws = new WebSocket(serverUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (debug) console.log('✅ Connected to gesture server');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data: GestureData = JSON.parse(event.data);
          setLastGesture(data);

          // Update hand detection status
          setIsHandDetected(data.type !== 'no_hand');

          // Update cursor position
          if (data.cursor) {
            setCursorPosition(data.cursor);
            callbacks.onCursorMove?.(data.cursor.x, data.cursor.y);
          }

          // Handle gestures
          switch (data.type) {
            case 'click':
              if (debug) console.log('👆 Click gesture detected');
              callbacks.onClick?.();
              break;

            case 'drag_start':
              if (debug) console.log('✊ Drag start');
              callbacks.onDragStart?.();
              break;

            case 'dragging':
              if (data.cursor) {
                callbacks.onDragging?.(data.cursor.x, data.cursor.y);
              }
              break;

            case 'drag_end':
              if (debug) console.log('🖐️ Drag end');
              callbacks.onDragEnd?.();
              break;

            case 'swipe':
              if (data.direction) {
                if (debug) console.log(`👉 Swipe ${data.direction}`);
                callbacks.onSwipe?.(data.direction);
                
                if (data.direction === 'left') {
                  callbacks.onRotateLeft?.();
                } else {
                  callbacks.onRotateRight?.();
                }
              }
              break;
          }
        } catch (error) {
          console.error('Error parsing gesture data:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      ws.onclose = () => {
        if (debug) console.log('🔌 Disconnected from gesture server');
        setIsConnected(false);
        setIsHandDetected(false);
        wsRef.current = null;

        // Attempt to reconnect
        if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          
          if (debug) {
            console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          }
          
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [enabled, serverUrl, callbacks, debug]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsHandDetected(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    isHandDetected,
    lastGesture,
    cursorPosition,
    reconnect: connect,
    disconnect,
  };
};
