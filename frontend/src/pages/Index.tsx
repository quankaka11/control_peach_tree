import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Scene from '../components/3d/Scene';
import TopBar from '../components/layout/TopBar';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import AddFeedback from '../components/feedback/AddFeedback';
import DecorationModal from '../components/ui/DecorationModal';
import { GestureIndicator } from '../components/ui/GestureIndicator';
import { useHandGesture } from '../hooks/useHandGesture';
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

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'gift' | 'card' | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | undefined>();

  const [gestureEnabled, setGestureEnabled] = useState(false);
  const [sceneRotation, setSceneRotation] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  // Hand gesture control integration
  const {
    isConnected,
    isHandDetected,
    lastGesture,
    cursorPosition,
  } = useHandGesture({
    enabled: gestureEnabled,
    debug: true,
    callbacks: {
      onClick: () => {
        // Close modal if open
        if (modalOpen) {
          setModalOpen(false);
        }

        // Pinch gesture - add gift or card based on cursor position
        if (cursorPosition.x < 0.5) {
          handleAddGift();
        } else {
          handleAddCard();
        }
      },
      onDragStart: () => {
        // Fist gesture - CLOSE modal if open
        if (modalOpen) {
          setModalOpen(false);
          toast.info('✊ Nắm tay - Đóng thiệp/quà', { duration: 1500 });
        }
      },
      onDragging: () => {
        // No action - removed drag to rotate functionality
      },
      onDragEnd: () => {
        // No action
      },
      onRotateLeft: () => {
        setSceneRotation(prev => ({
          ...prev,
          y: prev.y - Math.PI / 12  // 90 degrees
        }));
        toast.success('⬅️ Xoay trái', {
          duration: 1500,
          description: 'Vuốt tay sang trái'
        });
      },
      onRotateRight: () => {
        setSceneRotation(prev => ({
          ...prev,
          y: prev.y + Math.PI / 12  // 90 degrees
        }));
        toast.success('➡️ Xoay phải', {
          duration: 1500,
          description: 'Vuốt tay sang phải'
        });
      },
      onOpenHand: () => {
        console.log('🖐️ onOpenHand callback triggered!');
        console.log('Gifts:', gifts.length, 'Cards:', cards.length);

        // Open random gift or card
        const allItems = [...gifts, ...cards];
        if (allItems.length === 0) {
          toast.info('Chưa có quà hoặc thiệp nào!', {
            description: 'Hãy thêm quà hoặc thiệp trước'
          });
          return;
        }

        // Pick random item
        const randomIndex = Math.floor(Math.random() * allItems.length);
        const randomItem = allItems[randomIndex];

        console.log('Selected item:', randomItem);

        // Determine if it's a gift or card
        const isGift = 'color' in randomItem;

        if (isGift) {
          setModalType('gift');
          setSelectedColor((randomItem as Gift).color);
        } else {
          setModalType('card');
        }

        setModalOpen(true);
        console.log('Modal should be open now. modalOpen:', true, 'modalType:', isGift ? 'gift' : 'card');

        toast.success('🖐️ Mở tay - Xem quà ngẫu nhiên!', {
          duration: 2000,
          description: isGift ? 'Đã mở hộp quà' : 'Đã mở thiệp chúc'
        });
      },
      onRotateUp: () => {
        setSceneRotation(prev => ({
          ...prev,
          x: prev.x - Math.PI / 24  // 15 degrees - nhẹ hơn
        }));
        toast.success('⬆️ Xoay lên', {
          duration: 1500,
          description: 'Vuốt tay lên trên (nhẹ)'
        });
      },
      onRotateDown: () => {
        setSceneRotation(prev => ({
          ...prev,
          x: prev.x + Math.PI / 24  // 15 degrees - nhẹ hơn
        }));
        toast.success('⬇️ Xoay xuống', {
          duration: 1500,
          description: 'Vuốt tay xuống dưới (nhẹ)'
        });
      },
    },
  });

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

  const handleGiftClick = useCallback((id: string, color: string) => {
    setSelectedColor(color);
    setModalType('gift');
    setModalOpen(true);
  }, []);

  const handleCardClick = useCallback((id: string) => {
    setModalType('card');
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setModalType(null);
    setSelectedColor(undefined);
  }, []);

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
        <Scene
          gifts={gifts}
          cards={cards}
          onGiftClick={handleGiftClick}
          onCardClick={handleCardClick}
          rotation={gestureEnabled ? sceneRotation : undefined}
        />
      </motion.main>

      {/* Gesture Control Indicator */}
      {gestureEnabled && (
        <div className="fixed top-20 right-4 z-50">
          <GestureIndicator
            isConnected={isConnected}
            isHandDetected={isHandDetected}
            lastGestureType={lastGesture?.type}
            cursorPosition={cursorPosition}
          />
        </div>
      )}

      {/* Gesture Control Toggle Button */}
      <motion.button
        onClick={() => {
          setGestureEnabled(!gestureEnabled);
          if (!gestureEnabled) {
            toast.info('Điều khiển bằng tay đã bật', {
              description: 'Đảm bảo server Python đang chạy',
            });
          } else {
            toast.info('Điều khiển bằng tay đã tắt');
          }
        }}
        className={`fixed top-20 left-4 z-50 px-4 py-2 rounded-lg glass-panel shadow-soft
          ${gestureEnabled ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground'}
          hover:scale-105 transition-all duration-200`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">👋</span>
          <span className="text-sm font-medium">
            {gestureEnabled ? 'Điều khiển bằng tay' : 'Bật điều khiển tay'}
          </span>
        </div>
      </motion.button>

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

      {/* Decoration modal */}
      <DecorationModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        type={modalType}
        color={selectedColor}
      />
    </div>
  );
};

export default Index;
