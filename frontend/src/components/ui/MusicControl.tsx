import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface MusicControlProps {
  className?: string;
}

const MusicControl = ({ className = '' }: MusicControlProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element with a placeholder - in production, replace with actual audio
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // For demo, we'll just toggle the state
        // audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.button
        onClick={togglePlay}
        className="relative flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.div
              key="pause"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Pause className="w-4 h-4 text-primary" />
            </motion.div>
          ) : (
            <motion.div
              key="play"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Play className="w-4 h-4 text-primary ml-0.5" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Playing animation rings */}
        {isPlaying && (
          <>
            <motion.span
              className="absolute inset-0 rounded-full border border-primary/30"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.span
              className="absolute inset-0 rounded-full border border-primary/30"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            />
          </>
        )}
      </motion.button>

      <motion.button
        onClick={toggleMute}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 hover:bg-muted transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isMuted ? (
          <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </motion.button>

      <span className="text-xs text-muted-foreground font-medium">
        {isPlaying ? 'Đang phát' : 'Nhạc Tết'}
      </span>
    </div>
  );
};

export default MusicControl;
