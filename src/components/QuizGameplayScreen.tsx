import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  Flame,
  HelpCircle,
  Pause,
  RotateCcw,
  Shield,
  Snowflake,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import {
  PlayerParticipant,
  PowerUpType,
  QuizDeck,
  QuizQuestion,
  ScoreCalculationResult,
} from '../game/rules';
import { KahootShapeIcon, PlayerAvatar } from './PlayerAvatar';

interface QuizGameplayScreenProps {
  quiz: QuizDeck;
  currentQuestion: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  timeRemainingMs: number;
  totalTimeMs: number;
  localPlayer: PlayerParticipant;
  participants: PlayerParticipant[];
  selectedOptionId: string | null;
  roundResult: ScoreCalculationResult | null;
  usedPowerUps: Record<PowerUpType, boolean>;
  activeDoublePoints: boolean;
  activeStreakShield: boolean;
  hiddenOptionIds: string[];
  timeFrozen: boolean;
  muted: boolean;
  onSelectOption: (optionId: string) => void;
  onActivatePowerUp: (type: PowerUpType) => void;
  onNextQuestion: () => void;
  onToggleMute: () => void;
  onOpenPause: () => void;
  onRestartQuiz: () => void;
}

const QuestionSceneIllustration: React.FC<{
  type?: 'runner_hydration' | 'water_glass_scale' | 'tired_focus' | 'body_weight_scale';
}> = ({ type }) => {
  if (type === 'water_glass_scale') {
    return (
      <svg
        viewBox="0 0 800 220"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full block"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="bgWater" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EFFAFC" />
            <stop offset="100%" stopColor="#D5F2F8" />
          </linearGradient>
        </defs>
        <rect width="800" height="220" fill="url(#bgWater)" />
        <path d="M55 20 C55 20 73 42 73 53 C73 63 65 70 55 70 C45 70 37 63 37 53 C37 42 55 20 55 20 Z" fill="#FEF08A" />
        <path d="M55 82 C55 82 73 104 73 115 C73 125 65 132 55 132 C45 132 37 125 37 115 C37 104 55 82 55 82 Z" fill="#FDE047" />
        <path d="M55 144 C55 144 73 166 73 177 C73 187 65 194 55 194 C45 194 37 187 37 177 C37 166 55 144 55 144 Z" fill="#EAB308" />
        <path d="M350 45 L450 45 L438 195 L362 195 Z" fill="#BAE6FD" fillOpacity="0.55" stroke="#0284C7" strokeWidth="4" />
        <path d="M356 95 Q400 85 444 95 L436 191 L364 191 Z" fill="#38BDF8" fillOpacity="0.65" />
        <ellipse cx="400" cy="45" rx="50" ry="9" fill="#E0F2FE" stroke="#0284C7" strokeWidth="3.5" />
        <circle cx="385" cy="24" r="5" fill="#38BDF8" />
        <circle cx="415" cy="18" r="7" fill="#0EA5E9" />
      </svg>
    );
  }

  if (type === 'tired_focus') {
    return (
      <svg
        viewBox="0 0 800 220"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full block"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="bgOffice" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
        </defs>
        <rect width="800" height="220" fill="url(#bgOffice)" />
        <rect x="130" y="45" width="160" height="105" rx="8" fill="#0F172A" stroke="#475569" strokeWidth="3" />
        <circle cx="400" cy="80" r="40" fill="#CBD5E1" />
        <rect x="370" y="70" width="24" height="14" rx="3" fill="none" stroke="#1E293B" strokeWidth="3" />
        <rect x="406" y="70" width="24" height="14" rx="3" fill="none" stroke="#1E293B" strokeWidth="3" />
        <line x1="394" y1="77" x2="406" y2="77" stroke="#1E293B" strokeWidth="3" />
        <path d="M335 195 C335 145 465 145 465 195" fill="#475569" />
        <rect x="520" y="55" width="140" height="64" rx="12" fill="#0F172A" stroke="#F59E0B" strokeWidth="3" />
        <rect x="534" y="70" width="32" height="34" rx="4" fill="#F59E0B" />
        <circle cx="615" cy="87" r="14" fill="#38BDF8" fillOpacity="0.3" />
      </svg>
    );
  }

  if (type === 'body_weight_scale') {
    return (
      <svg
        viewBox="0 0 800 220"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full block"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="bgRoom" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
        </defs>
        <rect width="800" height="220" fill="url(#bgRoom)" />
        <rect x="280" y="35" width="240" height="150" rx="22" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="4" />
        <rect x="340" y="55" width="120" height="42" rx="8" fill="#0F172A" />
        <circle cx="400" cy="135" r="24" fill="#E0F2FE" stroke="#0284C7" strokeWidth="3" />
        <path d="M400 120 L400 135 L412 135" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  // Default: runner_hydration (glowing blue athletic silhouette & water splash, no overlapping SVG text)
  return (
    <svg
      viewBox="0 0 800 220"
      preserveAspectRatio="xMidYMid slice"
      className="w-full h-full block"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bgRunner" x1="0" y1="0" x2="1" y2="0.5">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="45%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#F0F9FF" />
        </linearGradient>
        <radialGradient id="glowCyan" cx="0.3" cy="0.5" r="0.45">
          <stop offset="0%" stopColor="#0284C7" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="220" fill="url(#bgRunner)" />
      <rect width="800" height="220" fill="url(#glowCyan)" />
      <circle cx="240" cy="52" r="22" fill="#0284C7" fillOpacity="0.8" />
      <path
        d="M195 102 Q235 78 285 104 L315 145 L285 160 L262 126 L245 195 L195 195 L212 128 L175 154 L160 134 Z"
        fill="#0EA5E9"
        fillOpacity="0.75"
        stroke="#0369A1"
        strokeWidth="3"
      />
      <circle cx="240" cy="122" r="6" fill="#E0F2FE" />
      <circle cx="225" cy="148" r="5" fill="#E0F2FE" />
      <circle cx="255" cy="142" r="4" fill="#E0F2FE" />
      <circle cx="520" cy="70" r="18" fill="#38BDF8" fillOpacity="0.25" />
      <circle cx="580" cy="120" r="28" fill="#0EA5E9" fillOpacity="0.2" />
    </svg>
  );
};

export const QuizGameplayScreen: React.FC<QuizGameplayScreenProps> = ({
  quiz,
  currentQuestion,
  questionIndex,
  totalQuestions,
  timeRemainingMs,
  totalTimeMs,
  localPlayer,
  participants,
  selectedOptionId,
  roundResult,
  usedPowerUps,
  activeDoublePoints,
  activeStreakShield,
  hiddenOptionIds,
  timeFrozen,
  muted,
  onSelectOption,
  onActivatePowerUp,
  onNextQuestion,
  onToggleMute,
  onOpenPause,
  onRestartQuiz,
}) => {
  const isAnswered = selectedOptionId !== null;
  const secondsLeft = Math.max(0, Math.ceil(timeRemainingMs / 1000));
  const timerRatio = Math.max(0, Math.min(1, timeRemainingMs / Math.max(1000, totalTimeMs)));

  const [bannerShowPoints, setBannerShowPoints] = useState(false);
  const [showScoreboardStep, setShowScoreboardStep] = useState(false);

  useEffect(() => {
    setBannerShowPoints(false);
    setShowScoreboardStep(false);
  }, [questionIndex, currentQuestion.id]);

  useEffect(() => {
    if (!isAnswered) {
      setBannerShowPoints(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setBannerShowPoints(true);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [isAnswered]);

  const handleAdvanceArrow = () => {
    if (!showScoreboardStep) {
      setShowScoreboardStep(true);
    } else {
      onNextQuestion();
    }
  };

  const optionStyles: Record<
    'red' | 'blue' | 'amber' | 'green',
    { base: string; keyHint: string }
  > = {
    red: {
      base: 'bg-[#DC1C2E] hover:bg-[#E62E40] text-white border-b-4 border-[#9E111F]',
      keyHint: '1',
    },
    blue: {
      base: 'bg-[#1368CE] hover:bg-[#1E7AE6] text-white border-b-4 border-[#0D4A96]',
      keyHint: '2',
    },
    amber: {
      base: 'bg-[#D89E00] hover:bg-[#E8AC0A] text-white border-b-4 border-[#9E7200]',
      keyHint: '3',
    },
    green: {
      base: 'bg-[#26890C] hover:bg-[#2FA012] text-white border-b-4 border-[#1A6007]',
      keyHint: '4',
    },
  };

  return (
    <div className="min-h-screen bg-[#062A3E] text-slate-100 flex flex-col justify-between p-3 sm:p-5 md:p-6 select-none relative overflow-x-hidden">
      {/* Subtle Constellation Network Background */}
      <svg
        viewBox="0 0 1440 900"
        className="fixed inset-0 w-full h-full pointer-events-none opacity-30"
        aria-hidden="true"
      >
        <g stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.45">
          <line x1="110" y1="120" x2="290" y2="210" />
          <line x1="290" y1="210" x2="190" y2="380" />
          <line x1="1180" y1="90" x2="1340" y2="240" />
          <line x1="1180" y1="90" x2="1040" y2="260" />
          <line x1="1040" y1="260" x2="1340" y2="240" />
          <line x1="1340" y1="240" x2="1260" y2="460" />
          <line x1="1040" y1="260" x2="1260" y2="460" />
          <line x1="1260" y1="460" x2="1380" y2="680" />
        </g>
        <g fill="#7DD3FC">
          <circle cx="110" cy="120" r="3.5" />
          <circle cx="290" cy="210" r="4" />
          <circle cx="190" cy="380" r="3" />
          <circle cx="1180" cy="90" r="4.5" />
          <circle cx="1340" cy="240" r="5" />
          <circle cx="1040" cy="260" r="3.5" />
          <circle cx="1260" cy="460" r="4" />
          <circle cx="1380" cy="680" r="3.5" />
        </g>
      </svg>

      {/* Top HUD & Step Segments */}
      <div className="max-w-5xl w-full mx-auto relative z-10 space-y-2.5">
        {/* Segmented Top Progress Indicators */}
        <div className="flex items-center justify-center gap-2 pt-0.5">
          {quiz.questions.map((q, idx) => {
            const completed = idx < questionIndex || (idx === questionIndex && isAnswered);
            const current = idx === questionIndex;
            return (
              <div
                key={q.id}
                className={`h-1.5 flex-1 max-w-[80px] rounded-full transition-colors ${
                  completed
                    ? 'bg-white'
                    : current
                    ? 'bg-white/80'
                    : 'bg-white/25'
                }`}
              />
            );
          })}
        </div>

        {/* Responsive Arena Quiz HUD Header (Zero text truncation or overlap on mobile) */}
        <div className="bg-[#07344D]/95 border border-cyan-500/30 rounded-2xl p-3 sm:px-4 sm:py-3 shadow-lg space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Player Identity */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
              <PlayerAvatar avatarId={localPlayer.avatarId} size="sm" />
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-200/80 truncate">
                  ARENA QUIZ · #{localPlayer.currentRank}
                </div>
                <div
                  className="text-sm sm:text-base font-extrabold text-white truncate"
                  data-testid="hud-player-nickname"
                >
                  {localPlayer.nickname}
                </div>
              </div>
            </div>

            {/* Center: Score & Combo */}
            <div className="flex items-center gap-3 sm:gap-5 font-mono-tabular shrink-0 px-2 border-l border-r border-cyan-800/60">
              <div>
                <div className="text-[9px] sm:text-[10px] font-bold text-cyan-200/80 uppercase tracking-wider">
                  PONTOS
                </div>
                <div
                  className="text-sm sm:text-xl font-extrabold text-emerald-400 leading-none mt-0.5"
                  data-testid="hud-player-score"
                >
                  {Math.round(localPlayer.score)}
                </div>
              </div>

              <div>
                <div className="text-[9px] sm:text-[10px] font-bold text-cyan-200/80 uppercase tracking-wider flex items-center gap-0.5">
                  <Flame
                    className={`w-3 h-3 shrink-0 ${
                      localPlayer.streak > 0 ? 'text-amber-400 fill-amber-400' : 'text-slate-500'
                    }`}
                  />
                  <span>COMBO</span>
                </div>
                <div className="text-sm sm:text-xl font-extrabold text-amber-300 leading-none mt-0.5">
                  {localPlayer.streak}x
                </div>
              </div>
            </div>

            {/* Right: Utility Controls (Mute [M], Pause [P], Restart [R]) */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleMute();
                }}
                aria-label={muted ? 'Ativar som [M]' : 'Silenciar som [M]'}
                title="Som [M]"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0A4160] hover:bg-[#0E5278] border border-cyan-500/30 flex items-center justify-center text-slate-200 transition-colors cursor-pointer"
              >
                {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onOpenPause();
                }}
                aria-label="Pausar jogo [P]"
                title="Pausar [P]"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0A4160] hover:bg-[#0E5278] border border-cyan-500/30 flex items-center justify-center text-slate-200 transition-colors cursor-pointer"
              >
                <Pause className="w-4 h-4" />
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onRestartQuiz();
                }}
                aria-label="Reiniciar partida [R]"
                title="Reiniciar [R]"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0A4160] hover:bg-[#0E5278] border border-cyan-500/30 flex items-center justify-center text-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Power-Ups Bar (2x2 grid on mobile, 4-col on sm+ so full words never truncate or overlap) */}
          {!isAnswered && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2 border-t border-cyan-800/50">
              <button
                type="button"
                disabled={usedPowerUps.double_points}
                onClick={() => onActivatePowerUp('double_points')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                  activeDoublePoints
                    ? 'bg-amber-400 text-slate-950 border-amber-200'
                    : usedPowerUps.double_points
                    ? 'bg-slate-900/50 text-slate-500 border-slate-800 cursor-not-allowed'
                    : 'bg-[#0A4160] hover:bg-[#0E5278] text-amber-300 border-cyan-500/30 cursor-pointer'
                }`}
              >
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span>2x Pontos</span>
              </button>

              <button
                type="button"
                disabled={usedPowerUps.fifty_fifty}
                onClick={() => onActivatePowerUp('fifty_fifty')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                  usedPowerUps.fifty_fifty
                    ? 'bg-slate-900/50 text-slate-500 border-slate-800 cursor-not-allowed'
                    : 'bg-[#0A4160] hover:bg-[#0E5278] text-emerald-300 border-cyan-500/30 cursor-pointer'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                <span>50 / 50</span>
              </button>

              <button
                type="button"
                disabled={usedPowerUps.freeze_time}
                onClick={() => onActivatePowerUp('freeze_time')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                  timeFrozen
                    ? 'bg-sky-400 text-slate-950 border-sky-200'
                    : usedPowerUps.freeze_time
                    ? 'bg-slate-900/50 text-slate-500 border-slate-800 cursor-not-allowed'
                    : 'bg-[#0A4160] hover:bg-[#0E5278] text-sky-300 border-cyan-500/30 cursor-pointer'
                }`}
              >
                <Snowflake className="w-3.5 h-3.5 shrink-0" />
                <span>Congelar</span>
              </button>

              <button
                type="button"
                disabled={usedPowerUps.streak_shield}
                onClick={() => onActivatePowerUp('streak_shield')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                  activeStreakShield
                    ? 'bg-purple-500 text-white border-purple-300'
                    : usedPowerUps.streak_shield
                    ? 'bg-slate-900/50 text-slate-500 border-slate-800 cursor-not-allowed'
                    : 'bg-[#0A4160] hover:bg-[#0E5278] text-purple-300 border-cyan-500/30 cursor-pointer'
                }`}
              >
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span>Escudo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Framed Arena Quiz Stage Card */}
      <main className="max-w-4xl w-full mx-auto my-2.5 flex-1 flex flex-col justify-center relative z-10">
        {!showScoreboardStep ? (
          <div className="w-full rounded-2xl bg-[#E8F4F8] border-2 border-cyan-300/60 shadow-2xl overflow-hidden flex flex-col justify-between relative">
            {/* Upper Illustration Stage (Dedicated height so diagonal banner NEVER overlaps the question text on mobile) */}
            <div className="relative h-36 sm:h-48 w-full overflow-hidden">
              <QuestionSceneIllustration type={currentQuestion.illustrationType} />

              {/* Diagonal Tilted Ribbon Banner on Answer ("✓ Correto" -> "+ 814") */}
              {isAnswered && roundResult && (
                <div
                  data-testid="round-feedback-panel"
                  className={`absolute left-[-5%] right-[-5%] top-1/2 -translate-y-1/2 z-20 py-2.5 sm:py-3.5 shadow-xl transform -rotate-3 flex items-center justify-center transition-colors duration-200 ${
                    roundResult.totalPoints > 0
                      ? 'bg-[#5CB83C] text-white'
                      : 'bg-[#DC2626] text-white'
                  }`}
                >
                  {!bannerShowPoints ? (
                    <div className="flex items-center gap-2 text-xl sm:text-3xl font-extrabold tracking-tight">
                      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white flex items-center justify-center shrink-0">
                        {roundResult.totalPoints > 0 ? (
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                        ) : (
                          <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                        )}
                      </span>
                      <span>
                        {roundResult.totalPoints > 0 ? 'Correto' : 'Incorreto'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-xl sm:text-3xl font-extrabold font-mono-tabular">
                      <span>+ {roundResult.totalPoints}</span>
                      {roundResult.streakBonus > 0 && (
                        <span className="text-xs sm:text-sm font-semibold opacity-95">
                          (Combo {roundResult.newStreak}x)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Question Card (Cleanly separated from the diagonal ribbon so words never overlap on mobile) */}
            <div className="px-3 sm:px-6 -mt-5 relative z-10">
              <div className="max-w-2xl w-full mx-auto bg-white rounded-xl px-4 py-3.5 sm:px-6 sm:py-4 shadow-md border border-slate-200/90 text-center">
                <h1
                  className="text-base sm:text-xl md:text-2xl font-bold text-slate-900 leading-snug break-words"
                  data-testid="active-question-text"
                >
                  {currentQuestion.question}
                </h1>
              </div>
            </div>

            {/* 2x2 Answer Grid inside the Stage Card */}
            <div className="p-3 sm:p-5 pt-3 bg-[#E8F4F8] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {currentQuestion.options.map((option, idx) => {
                  const isHiddenBy5050 = hiddenOptionIds.includes(option.id);
                  const isCorrectOption = option.id === currentQuestion.correctOptionId;
                  const styleMeta = optionStyles[option.color];

                  let stateClasses = styleMeta.base;
                  if (isHiddenBy5050 && !isAnswered) {
                    stateClasses =
                      'bg-slate-300 border-b-4 border-slate-400 text-slate-500 opacity-45 cursor-not-allowed';
                  } else if (isAnswered) {
                    if (isCorrectOption) {
                      stateClasses =
                        'bg-[#5CB83C] text-white border-b-4 border-[#3E8425] shadow-md';
                    } else {
                      stateClasses =
                        'bg-[#F1A7B5] text-white/95 border-b-4 border-[#D98292] opacity-90';
                    }
                  }

                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={isAnswered || isHiddenBy5050}
                      onClick={() => onSelectOption(option.id)}
                      data-testid={`answer-option-${idx}`}
                      className={`min-h-[68px] sm:min-h-[88px] px-3.5 py-3 rounded-lg flex items-center justify-between gap-3 text-left sm:text-center transition-transform duration-150 ${
                        !isAnswered && !isHiddenBy5050
                          ? 'active:scale-[0.99] cursor-pointer'
                          : ''
                      } ${stateClasses}`}
                    >
                      {/* Dedicated Left Column for Geometric Shape Icon (Never overlaps text) */}
                      <span className="w-7 h-7 rounded-md bg-black/15 flex items-center justify-center shrink-0">
                        <KahootShapeIcon shape={option.shape} className="w-4 h-4" />
                      </span>

                      {/* Center Option Text with clean wrapping */}
                      <span className="flex-1 text-sm sm:text-base md:text-lg font-bold leading-snug break-words">
                        {isHiddenBy5050 && !isAnswered
                          ? 'Eliminada (50/50)'
                          : option.text}
                      </span>

                      {/* Dedicated Right Column for Check / Cross Status Badge */}
                      {isAnswered ? (
                        <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                          {isCorrectOption ? (
                            <Check className="w-3.5 h-3.5 text-[#5CB83C] stroke-[3]" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-[#E11D48] stroke-[3]" />
                          )}
                        </span>
                      ) : (
                        <span className="w-6 shrink-0 hidden sm:block" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Green Countdown Progress Bar with Seconds Number */}
              <div className="w-full h-4 bg-slate-300/80 rounded-full overflow-hidden relative flex items-center">
                <div
                  className={`h-full transition-all duration-200 flex items-center justify-end pr-2.5 rounded-full ${
                    timeFrozen
                      ? 'bg-sky-500'
                      : secondsLeft <= 5
                      ? 'bg-red-500'
                      : 'bg-[#26890C]'
                  }`}
                  style={{ width: `${Math.max(10, timerRatio * 100)}%` }}
                >
                  <span className="font-mono-tabular text-[11px] font-extrabold text-white leading-none">
                    {secondsLeft}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Dedicated "Pontuações" Interstitial Card (Responsive truncation & spacing on mobile) */
          <div
            data-testid="round-scoreboard-card"
            className="w-full min-h-[380px] sm:min-h-[450px] rounded-2xl bg-[#08334C]/95 border border-cyan-400/35 p-5 sm:p-10 shadow-2xl flex flex-col justify-between"
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white text-center">
              Pontuações
            </h2>

            <div className="my-5 max-w-2xl w-full mx-auto space-y-2.5">
              {participants.slice(0, 5).map((p) => {
                const climbed = p.previousRank > p.currentRank;
                const displayName = p.isLocalPlayer ? `Você (${p.nickname})` : p.nickname;

                return (
                  <div
                    key={p.id}
                    className={`px-4 sm:px-5 py-3 rounded-lg flex items-center justify-between gap-3 font-mono-tabular transition-all ${
                      p.isLocalPlayer
                        ? 'bg-white/20 text-white font-extrabold shadow-sm'
                        : 'text-slate-100 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
                      <span className="w-5 text-sm sm:text-base font-extrabold text-cyan-200 shrink-0">
                        {p.currentRank}
                      </span>
                      <span className="font-sans text-sm sm:text-lg font-bold truncate">
                        {displayName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm sm:text-lg font-extrabold shrink-0">
                      <span>{Math.round(p.score)}</span>
                      {climbed && (
                        <span
                          className="inline-flex items-center justify-center text-emerald-300"
                          title="Subiu no ranking!"
                        >
                          ▲
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center text-xs text-cyan-100/85 flex items-center justify-center gap-2 px-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="leading-relaxed">{currentQuestion.explanation}</span>
            </div>
          </div>
        )}

        {/* Advance Button: Full-width clean button below card on mobile/tablet, plus floating arrow on desktop */}
        {isAnswered && (
          <div className="mt-3 flex justify-end lg:mt-0">
            <button
              type="button"
              data-testid="next-question-button"
              onClick={handleAdvanceArrow}
              aria-label={
                !showScoreboardStep
                  ? 'Ver Pontuações da Rodada'
                  : questionIndex + 1 < totalQuestions
                  ? 'Próxima Pergunta'
                  : 'Ver Pódio Final'
              }
              className="w-full lg:w-14 lg:h-14 py-3.5 px-5 lg:p-0 rounded-xl lg:rounded-full bg-emerald-500 lg:bg-slate-950/90 hover:bg-emerald-400 text-slate-950 lg:text-white lg:hover:text-slate-950 border border-white/20 shadow-2xl flex items-center justify-center gap-2 font-extrabold text-sm lg:fixed lg:right-6 lg:top-1/2 lg:-translate-y-1/2 z-30 transition-all cursor-pointer"
            >
              <span className="lg:hidden">
                {!showScoreboardStep
                  ? 'Ver Pontuações da Rodada'
                  : questionIndex + 1 < totalQuestions
                  ? 'Próxima Pergunta'
                  : 'Ver Pódio Final'}
              </span>
              <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 shrink-0" />
            </button>
          </div>
        )}
      </main>

      {/* Bottom Keyboard Shortcuts Hint (Hidden on narrow mobile where touch is used) */}
      <div className="hidden sm:block max-w-5xl w-full mx-auto text-center text-xs text-cyan-200/60 py-1 relative z-10">
        Teclas Rápidas: [1–4] Responder Alternativa · [Enter] Avançar · [Q/W/E/S] Power-Ups · [P] Pausar
      </div>
    </div>
  );
};
