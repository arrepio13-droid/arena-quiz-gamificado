import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  quizTitle: string;
  pin: string;
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  quizTitle,
  pin,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    const durationMs = 1350;

    let frameId: number;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);

      if (elapsed < durationMs) {
        frameId = requestAnimationFrame(tick);
      } else {
        onComplete();
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [onComplete]);

  const statusLabel =
    progress < 40
      ? 'Inicializando Arena Quiz...'
      : progress < 85
      ? `Sincronizando QR Code · PIN ${pin.slice(0, 3)} ${pin.slice(3)}...`
      : 'Sala pronta!';

  return (
    <motion.div
      key="arena-splash"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      onClick={onComplete}
      data-testid="splash-screen"
      className="fixed inset-0 z-50 bg-[#062A3E] text-slate-100 flex flex-col items-center justify-center p-6 select-none cursor-pointer"
    >
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
        {/* Animated 4-Shape Geometric Emblem */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative"
        >
          <svg
            viewBox="0 0 96 96"
            className="w-24 h-24 rounded-3xl shadow-2xl"
            aria-hidden="true"
          >
            <rect width="96" height="96" rx="22" fill="#09354F" />
            {/* Top-Left Red Triangle */}
            <motion.g
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
            >
              <rect x="8" y="8" width="37" height="37" rx="9" fill="#DC2626" />
              <polygon points="26.5,15 38.5,37 14.5,37" fill="#FFFFFF" />
            </motion.g>
            {/* Top-Right Blue Diamond */}
            <motion.g
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.15 }}
            >
              <rect x="51" y="8" width="37" height="37" rx="9" fill="#2563EB" />
              <polygon points="69.5,14 81,26.5 69.5,39 58,26.5" fill="#FFFFFF" />
            </motion.g>
            {/* Bottom-Left Gold Circle */}
            <motion.g
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
            >
              <rect x="8" y="51" width="37" height="37" rx="9" fill="#D97706" />
              <circle cx="26.5" cy="69.5" r="11" fill="#FFFFFF" />
            </motion.g>
            {/* Bottom-Right Green Square */}
            <motion.g
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.45 }}
            >
              <rect x="51" y="51" width="37" height="37" rx="9" fill="#16A34A" />
              <rect x="59" y="59" width="21" height="21" rx="3.5" fill="#FFFFFF" />
            </motion.g>
          </svg>
        </motion.div>

        {/* Brand Title & Quiz Name */}
        <div className="space-y-1.5">
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
            ARENA QUIZ
          </h1>
          <p className="text-xs sm:text-sm font-medium text-cyan-100/80">
            {quizTitle}
          </p>
        </div>

        {/* Smooth Progress Indicator */}
        <div className="w-full space-y-2 pt-2">
          <div className="w-full h-2.5 bg-[#041E2D] border border-cyan-800/60 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-75 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono-tabular text-cyan-200/80 px-0.5">
            <span>{statusLabel}</span>
            <span className="font-bold text-emerald-400">{progress}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
