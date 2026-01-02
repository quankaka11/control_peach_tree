import { useEffect, useRef, useState, useCallback } from 'react';

export interface GestureData {
  type: 'none' | 'pinch' | 'swipe' | 'no_hand';
  cursor?: {
    x: number;
    y: number;
  };
  direction?: 'left' | 'right' | 'up' | 'down';
  action?: 'add_item' | 'rotate_left' | 'rotate_right' | 'open_modal' | 'close_modal';
  timestamp: number;
}

export interface GestureCallbacks {
  onCursorMove?: (x: number, y: number) => void;
  onPinch?: () => void;  // Add gift/card
  onRotateLeft?: () => void;  // Swipe left
  onRotateRight?: () => void;  // Swipe right
  onOpenModal?: () => void;  // Swipe up
  onCloseModal?: () => void;  // Swipe down
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

  // Store callbacks in ref to avoid reconnection when they change
  const callbacksRef = useRef(callbacks);

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

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
            callbacksRef.current.onCursorMove?.(data.cursor.x, data.cursor.y);
          }

          // Handle gestures
          switch (data.type) {
            case 'pinch':
              if (debug) console.log('👌 Pinch gesture detected - Adding item');
              callbacksRef.current.onPinch?.();
              break;

            case 'swipe':
              if (data.direction) {
                if (debug) console.log(`👉 Swipe ${data.direction}`);

                if (data.direction === 'left') {
                  callbacksRef.current.onRotateLeft?.();
                } else if (data.direction === 'right') {
                  callbacksRef.current.onRotateRight?.();
                } else if (data.direction === 'up') {
                  callbacksRef.current.onOpenModal?.();
                } else if (data.direction === 'down') {
                  callbacksRef.current.onCloseModal?.();
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
  }, [enabled, serverUrl, debug]);

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
