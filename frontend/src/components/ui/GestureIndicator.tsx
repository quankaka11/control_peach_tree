import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Circle, Move, RotateCw, MousePointer2, HandMetal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GestureIndicatorProps {
    isConnected: boolean;
    isHandDetected: boolean;
    lastGestureType?: string;
    cursorPosition?: { x: number; y: number };
    className?: string;
}

export const GestureIndicator = ({
    isConnected,
    isHandDetected,
    lastGestureType = 'none',
    cursorPosition,
    className,
}: GestureIndicatorProps) => {
    const getGestureIcon = () => {
        switch (lastGestureType) {
            case 'click':
                return <MousePointer2 className="w-4 h-4" />;
            case 'drag_start':
            case 'dragging':
            case 'drag_end':
                return <Move className="w-4 h-4" />;
            case 'swipe':
                return <RotateCw className="w-4 h-4" />;
            case 'open_hand':
                return <HandMetal className="w-4 h-4" />;
            default:
                return <Hand className="w-4 h-4" />;
        }
    };

    const getGestureText = () => {
        switch (lastGestureType) {
            case 'click':
                return 'Chạm 2 ngón';
            case 'drag_start':
                return 'Nắm tay - Đóng thiệp/quà';
            case 'dragging':
                return 'Nắm tay';
            case 'drag_end':
                return 'Thả tay';
            case 'swipe':
                return 'Vuốt tay - Xoay/Di chuyển';
            case 'open_hand':
                return 'Mở tay (5 ngón)';
            case 'no_hand':
                return 'Không phát hiện tay';
            default:
                return isHandDetected ? 'Đã phát hiện tay' : 'Chờ phát hiện';
        }
    };

    const getStatusColor = () => {
        if (!isConnected) return 'bg-destructive';
        if (!isHandDetected) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <motion.div
            className={cn(
                'glass-panel px-4 py-2 rounded-lg shadow-soft',
                'flex items-center gap-3',
                className
            )}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            {/* Status indicator */}
            <div className="relative">
                <div className={cn('w-3 h-3 rounded-full', getStatusColor())} />
                {isConnected && isHandDetected && (
                    <motion.div
                        className={cn('absolute inset-0 rounded-full', getStatusColor())}
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                        }}
                    />
                )}
            </div>

            {/* Gesture icon */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={lastGestureType}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-primary"
                >
                    {getGestureIcon()}
                </motion.div>
            </AnimatePresence>

            {/* Status text */}
            <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground">
                    {isConnected ? 'Điều khiển bằng tay' : 'Đang kết nối...'}
                </span>
                <AnimatePresence mode="wait">
                    <motion.span
                        key={lastGestureType}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-muted-foreground"
                    >
                        {getGestureText()}
                    </motion.span>
                </AnimatePresence>
            </div>

            {/* Cursor position indicator (optional debug) */}
            {cursorPosition && isHandDetected && (
                <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <Circle className="w-2 h-2 fill-current" />
                    <span>
                        {Math.round(cursorPosition.x * 100)}%, {Math.round(cursorPosition.y * 100)}%
                    </span>
                </div>
            )}
        </motion.div>
    );
};
