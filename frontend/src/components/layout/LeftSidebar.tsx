import { motion } from 'framer-motion';
import { Gift, Plus } from 'lucide-react';

interface LeftSidebarProps {
  onAddGift: () => void;
  giftCount: number;
}

const LeftSidebar = ({ onAddGift, giftCount }: LeftSidebarProps) => {
  return (
    <motion.aside
      className="fixed left-6 top-1/2 -translate-y-1/2 z-40"
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex flex-col items-center gap-4 p-4 rounded-2xl glass-panel shadow-soft">
        <div className="text-center mb-2">
          <Gift className="w-5 h-5 text-primary mx-auto mb-1" />
          <span className="text-xs text-muted-foreground">Hộp Quà</span>
        </div>

        <motion.button
          onClick={onAddGift}
          className="relative group flex items-center justify-center w-14 h-14 rounded-xl tet-button text-primary-foreground"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-6 h-6" />
          
          {/* Ripple effect on hover */}
          <motion.span
            className="absolute inset-0 rounded-xl bg-primary-foreground/20"
            initial={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        </motion.button>

        <motion.div
          className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-accent text-sm font-semibold"
          key={giftCount}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          {giftCount}
        </motion.div>

        <p className="text-[10px] text-center text-muted-foreground max-w-[80px] leading-tight">
          Thêm quà tặng lên cây đào
        </p>
      </div>
    </motion.aside>
  );
};

export default LeftSidebar;
