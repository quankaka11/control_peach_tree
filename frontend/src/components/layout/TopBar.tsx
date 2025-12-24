import { motion } from 'framer-motion';
import MusicControl from '../ui/MusicControl';
import AIStatusIndicator from '../ui/AIStatusIndicator';

interface TopBarProps {
  aiActive: boolean;
}

const TopBar = ({ aiActive }: TopBarProps) => {
  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-6 py-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-8 px-6 py-3 rounded-full glass-panel shadow-soft">
        <MusicControl />
        
        <div className="w-px h-6 bg-border" />
        
        <AIStatusIndicator isActive={aiActive} />
      </div>
    </motion.header>
  );
};

export default TopBar;
