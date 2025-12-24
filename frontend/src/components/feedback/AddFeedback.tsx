import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Mail, Sparkles } from 'lucide-react';

interface AddFeedbackProps {
  show: boolean;
  type: 'gift' | 'card' | null;
}

const AddFeedback = ({ show, type }: AddFeedbackProps) => {
  return (
    <AnimatePresence>
      {show && type && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Radial burst effect */}
          <motion.div
            className="absolute w-32 h-32 rounded-full"
            style={{
              background: type === 'gift' 
                ? 'radial-gradient(circle, hsl(var(--tet-red) / 0.3) 0%, transparent 70%)'
                : 'radial-gradient(circle, hsl(var(--golden) / 0.3) 0%, transparent 70%)',
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />

          {/* Icon */}
          <motion.div
            className={`flex items-center justify-center w-20 h-20 rounded-full ${
              type === 'gift' ? 'bg-primary' : 'bg-accent'
            }`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: [0, 1.2, 1], rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ duration: 0.5, ease: 'backOut' }}
          >
            {type === 'gift' ? (
              <Gift className="w-10 h-10 text-primary-foreground" />
            ) : (
              <Mail className="w-10 h-10 text-accent-foreground" />
            )}
          </motion.div>

          {/* Sparkles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ 
                x: 0, 
                y: 0, 
                scale: 0,
                rotate: 0
              }}
              animate={{ 
                x: Math.cos(i * Math.PI / 4) * 100,
                y: Math.sin(i * Math.PI / 4) * 100,
                scale: [0, 1, 0],
                rotate: 360
              }}
              transition={{ 
                duration: 0.8,
                delay: i * 0.05,
                ease: 'easeOut'
              }}
            >
              <Sparkles className={`w-4 h-4 ${
                type === 'gift' ? 'text-primary' : 'text-accent'
              }`} />
            </motion.div>
          ))}

          {/* Text feedback */}
          <motion.p
            className="absolute mt-32 text-lg font-serif font-semibold text-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.2 }}
          >
            {type === 'gift' ? 'Đã thêm hộp quà!' : 'Đã gửi thiệp chúc!'}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddFeedback;
