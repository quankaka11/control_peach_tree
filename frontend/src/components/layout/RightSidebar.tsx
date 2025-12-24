import { motion } from 'framer-motion';
import { Mail, Plus } from 'lucide-react';

interface RightSidebarProps {
  onAddCard: () => void;
  cardCount: number;
}

const RightSidebar = ({ onAddCard, cardCount }: RightSidebarProps) => {
  return (
    <motion.aside
      className="fixed right-6 top-1/2 -translate-y-1/2 z-40"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex flex-col items-center gap-4 p-4 rounded-2xl glass-panel shadow-soft">
        <div className="text-center mb-2">
          <Mail className="w-5 h-5 text-primary mx-auto mb-1" />
          <span className="text-xs text-muted-foreground">Thiệp Tết</span>
        </div>

        <motion.button
          onClick={onAddCard}
          className="relative group flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-golden text-foreground shadow-glow-gold"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-6 h-6" />
          
          {/* Shimmer effect */}
          <motion.span
            className="absolute inset-0 rounded-xl overflow-hidden"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" 
                  style={{ backgroundSize: '200% 100%' }} />
          </motion.span>
        </motion.button>

        <motion.div
          className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm font-semibold"
          key={cardCount}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          {cardCount}
        </motion.div>

        <p className="text-[10px] text-center text-muted-foreground max-w-[80px] leading-tight">
          Gửi lời chúc Tết
        </p>
      </div>
    </motion.aside>
  );
};

export default RightSidebar;
