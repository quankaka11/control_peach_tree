import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Scene from '../components/3d/Scene';
import TopBar from '../components/layout/TopBar';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import AddFeedback from '../components/feedback/AddFeedback';
import { toast } from 'sonner';

interface Gift {
  id: string;
  color: string;
  position: [number, number, number];
}

interface Card {
  id: string;
  position: [number, number, number];
}

// Gift colors
const GIFT_COLORS = ['#dc2626', '#f97316', '#eab308', '#b91c1c', '#9333ea'];

// Predefined positions on the tree for decorations
const DECORATION_POSITIONS: [number, number, number][] = [
  [1.0, 1.4, 0.2],
  [-0.8, 1.6, -0.1],
  [0.6, 2.0, -0.3],
  [-0.5, 2.3, 0.2],
  [0.2, 2.6, 0],
  [1.3, 1.1, -0.2],
  [-1.1, 1.3, 0.3],
  [0.4, 1.7, 0.4],
  [-0.7, 1.9, -0.2],
  [0.9, 1.8, 0.1],
  [-0.3, 2.1, -0.1],
  [0.7, 2.4, 0.2],
];

const Index = () => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [aiActive, setAiActive] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'gift' | 'card' | null>(null);

  const getNextPosition = useCallback((currentItems: number): [number, number, number] => {
    const index = currentItems % DECORATION_POSITIONS.length;
    const base = DECORATION_POSITIONS[index];
    // Add small random offset for variety
    return [
      base[0] + (Math.random() - 0.5) * 0.2,
      base[1] + (Math.random() - 0.5) * 0.1,
      base[2] + (Math.random() - 0.5) * 0.2,
    ];
  }, []);

  const handleAddGift = useCallback(() => {
    const newGift: Gift = {
      id: `gift-${Date.now()}`,
      color: GIFT_COLORS[gifts.length % GIFT_COLORS.length],
      position: getNextPosition(gifts.length + cards.length),
    };
    
    setGifts(prev => [...prev, newGift]);
    setFeedbackType('gift');
    setShowFeedback(true);
    
    // Simulate AI gesture recognition
    setAiActive(true);
    setTimeout(() => setAiActive(false), 1500);
    
    setTimeout(() => setShowFeedback(false), 1000);
    
    toast.success('Đã treo hộp quà lên cây đào!', {
      description: 'Kéo chuột để xoay và xem quà tặng',
    });
  }, [gifts.length, cards.length, getNextPosition]);

  const handleAddCard = useCallback(() => {
    const newCard: Card = {
      id: `card-${Date.now()}`,
      position: getNextPosition(gifts.length + cards.length),
    };
    
    setCards(prev => [...prev, newCard]);
    setFeedbackType('card');
    setShowFeedback(true);
    
    // Simulate AI gesture recognition
    setAiActive(true);
    setTimeout(() => setAiActive(false), 1500);
    
    setTimeout(() => setShowFeedback(false), 1000);
    
    toast.success('Đã gắn thiệp chúc Tết!', {
      description: 'Lời chúc của bạn đã được treo lên cây',
    });
  }, [gifts.length, cards.length, getNextPosition]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-peach-light via-background to-muted">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        
        {/* Floating petals - decorative */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-peach/40"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Top bar */}
      <TopBar aiActive={aiActive} />

      {/* Left sidebar - Gift controls */}
      <LeftSidebar 
        onAddGift={handleAddGift} 
        giftCount={gifts.length} 
      />

      {/* Right sidebar - Card controls */}
      <RightSidebar 
        onAddCard={handleAddCard} 
        cardCount={cards.length} 
      />

      {/* Main 3D Canvas */}
      <motion.main
        className="w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <Scene gifts={gifts} cards={cards} />
      </motion.main>

      {/* Add feedback animation */}
      <AddFeedback show={showFeedback} type={feedbackType} />

      {/* Instructions overlay - shown initially */}
      <motion.div
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <div className="px-6 py-3 rounded-full glass-panel shadow-soft">
          <p className="text-sm text-muted-foreground text-center">
            <span className="text-primary font-medium">Kéo chuột</span> để xoay cây đào • 
            <span className="text-accent font-medium ml-1">Cuộn</span> để phóng to/thu nhỏ
          </p>
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-gradient-tet mb-2">
          Chúc Mừng Năm Mới
        </h1>
        <p className="text-lg text-muted-foreground font-light">
          Tết Nguyên Đán 2025 • Năm Ất Tỵ
        </p>
      </motion.div>
    </div>
  );
};

export default Index;
