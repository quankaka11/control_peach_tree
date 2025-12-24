import { motion } from 'framer-motion';
import { Sparkles, Hand } from 'lucide-react';

interface AIStatusIndicatorProps {
  isActive: boolean;
  className?: string;
}

const AIStatusIndicator = ({ isActive, className = '' }: AIStatusIndicatorProps) => {
  return (
    <motion.div 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="relative">
        {isActive ? (
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
          >
            <Hand className="w-4 h-4 text-accent" />
          </motion.div>
        ) : (
          <Sparkles className="w-4 h-4 text-muted-foreground" />
        )}
        
        {isActive && (
          <motion.span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>
      
      <span className="text-xs font-medium text-muted-foreground">
        {isActive ? 'AI Gesture Active' : 'AI Ready'}
      </span>

      {isActive && (
        <motion.div
          className="flex gap-0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1 h-3 bg-accent/60 rounded-full"
              animate={{ scaleY: [0.5, 1, 0.5] }}
              transition={{ 
                duration: 0.6, 
                repeat: Infinity, 
                delay: i * 0.15 
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default AIStatusIndicator;
