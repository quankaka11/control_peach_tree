import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Mail } from 'lucide-react';

interface DecorationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'gift' | 'card' | null;
  color?: string;
}

const DecorationModal = ({ isOpen, onClose, type, color }: DecorationModalProps) => {
  const isGift = type === 'gift';
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Modal */}
          <motion.div
            className="relative z-10 w-[90%] max-w-md"
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="relative overflow-hidden rounded-2xl glass-panel border-2 border-accent/50">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors z-10"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
              
              {/* Decorative top */}
              <div 
                className="h-3"
                style={{ 
                  background: isGift 
                    ? `linear-gradient(90deg, ${color || 'hsl(var(--primary))'}, hsl(var(--accent)))` 
                    : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))' 
                }}
              />
              
              {/* Content */}
              <div className="p-8 text-center">
                {/* Icon */}
                <motion.div
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
                  style={{
                    background: isGift 
                      ? `linear-gradient(135deg, ${color || 'hsl(var(--primary))'}, hsl(var(--accent)))` 
                      : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))'
                  }}
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  {isGift ? (
                    <Gift className="w-10 h-10 text-primary-foreground" />
                  ) : (
                    <Mail className="w-10 h-10 text-primary-foreground" />
                  )}
                </motion.div>
                
                {/* Title */}
                <motion.h2
                  className="text-3xl font-serif font-bold text-gradient-tet mb-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {isGift ? 'Quà Tặng May Mắn' : 'Thiệp Chúc Tết'}
                </motion.h2>
                
                {/* Message */}
                <motion.div
                  className="space-y-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-lg text-foreground leading-relaxed">
                    {isGift 
                      ? 'Chúc bạn năm mới an khang thịnh vượng, vạn sự như ý!' 
                      : 'Chúc Mừng Năm Mới! Năm Ất Tỵ 2025 - Mong bạn luôn hạnh phúc và thành công!'}
                  </p>
                  
                  {/* Fortune */}
                  <div className="pt-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground mb-2">Lời chúc may mắn:</p>
                    <p className="text-xl font-serif text-accent font-semibold">
                      {isGift 
                        ? '🧧 Phúc Lộc Thọ 🧧' 
                        : '🌸 Tân Xuân Như Ý 🌸'}
                    </p>
                  </div>
                </motion.div>
                
                {/* Decorative sparkles */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-accent/60"
                      style={{
                        left: `${15 + i * 15}%`,
                        top: `${20 + (i % 3) * 25}%`,
                      }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Bottom decoration */}
              <div 
                className="h-2"
                style={{ 
                  background: isGift 
                    ? `linear-gradient(90deg, hsl(var(--accent)), ${color || 'hsl(var(--primary))'})` 
                    : 'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--primary)))' 
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DecorationModal;
