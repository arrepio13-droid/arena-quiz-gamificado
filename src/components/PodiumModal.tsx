import React from 'react';
import {
  Award,
  CheckCircle2,
  Compass,
  Flame,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import {
  evaluateMatchGamification,
  PlayerParticipant,
  QuizDeck,
} from '../game/rules';

interface PodiumModalProps {
  quiz: QuizDeck;
  localPlayer: PlayerParticipant;
  participants: PlayerParticipant[];
  answerHistory: {
    questionId: string;
    questionText: string;
    chosenText: string;
    correctText: string;
    isCorrect: boolean;
    pointsEarned: number;
  }[];
  onPlayAgain: () => void;
  onBackToQrLobby: () => void;
  globalPosition?: number;
  onOpenLeaderboard?: () => void;
}

export const PodiumModal: React.FC<PodiumModalProps> = ({
  quiz,
  localPlayer,
  participants,
  answerHistory,
  onPlayAgain,
  onBackToQrLobby,
  globalPosition,
  onOpenLeaderboard,
}) => {
  const gamification = evaluateMatchGamification(localPlayer, quiz.questions.length);
  const topThree = participants.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#062A3E] text-slate-100 py-8 px-4 md:px-8 flex flex-col justify-between relative overflow-hidden">
      <div className="max-w-4xl w-full mx-auto space-y-6 relative z-10">
        {/* Main Video-Authentic Podium Card (Ribbon Badge + Top 3 Ranking + Reiniciar / Descobrir quizzes) */}
        <div className="rounded-2xl bg-[#08334C]/95 border border-cyan-400/40 p-6 sm:p-10 shadow-2xl space-y-8">
          <div className="text-center">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
              PÓDIO OFICIAL ARENA QUIZ · {quiz.title}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-display text-white mt-1">
              {localPlayer.currentRank === 1
                ? `Vitória Épica, ${localPlayer.nickname}!`
                : `Resultado Final — #${localPlayer.currentRank}º Lugar`}
            </h1>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Tentativa Única Oficial Registrada: <strong className="text-white">{Math.round(localPlayer.score).toLocaleString()} pts</strong></span>
              </div>
              {globalPosition && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-bold">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Posição Global no Banco: <strong className="text-amber-300">#{globalPosition}º Lugar</strong></span>
                </div>
              )}
            </div>
            <p className="text-xs text-cyan-100/70 mt-2">
              Cada participante responde 1 vez ao quiz. Para jogar novamente, registre um novo participante.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left: Celebratory Ribbon & Pentagon Rank Emblem (matches 00:32 of the video) */}
            <div className="md:col-span-5 flex flex-col items-center justify-center relative py-4">
              <svg viewBox="0 0 240 160" className="w-56 h-40" aria-hidden="true">
                {/* Confetti pieces */}
                <rect x="45" y="18" width="8" height="14" rx="2" fill="#EF4444" transform="rotate(-25 45 18)" />
                <rect x="85" y="10" width="8" height="14" rx="2" fill="#F59E0B" transform="rotate(15 85 10)" />
                <rect x="155" y="14" width="8" height="14" rx="2" fill="#8B5CF6" transform="rotate(30 155 14)" />
                <rect x="180" y="34" width="8" height="14" rx="2" fill="#10B981" transform="rotate(-20 180 34)" />
                <rect x="55" y="125" width="8" height="14" rx="2" fill="#3B82F6" transform="rotate(20 55 125)" />
                <rect x="165" y="120" width="8" height="14" rx="2" fill="#EC4899" transform="rotate(-15 165 120)" />
                {/* Blue Ribbon Wings */}
                <polygon points="20,62 85,54 78,96 28,98 40,80" fill="#0EA5E9" />
                <polygon points="220,62 155,54 162,96 212,98 200,80" fill="#0EA5E9" />
                <polygon points="55,66 185,66 178,105 62,105" fill="#0284C7" />
                {/* Center Pentagon Shield */}
                <polygon
                  points="120,42 156,66 142,114 98,114 84,66"
                  fill={localPlayer.currentRank === 1 ? '#F59E0B' : '#EA580C'}
                  stroke="#FFFFFF"
                  strokeWidth="4"
                />
                <text
                  x="120"
                  y="96"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="42"
                  fontWeight="900"
                  fontFamily="sans-serif"
                >
                  {localPlayer.currentRank}
                </text>
              </svg>
            </div>

            {/* Right: Top 3 Leaderboard List (matches 00:32 of the video) */}
            <div className="md:col-span-7 space-y-2.5">
              {topThree.map((p) => {
                const label = p.isLocalPlayer ? `Você (${p.nickname})` : p.nickname;
                return (
                  <div
                    key={p.id}
                    className={`px-4 sm:px-5 py-3.5 rounded-lg flex items-center justify-between gap-3 font-mono-tabular ${
                      p.isLocalPlayer
                        ? 'bg-white/20 text-white font-extrabold shadow-sm'
                        : 'text-slate-100 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <span className="w-5 text-sm sm:text-base font-extrabold text-cyan-200 shrink-0">
                        {p.currentRank}
                      </span>
                      <span className="font-sans text-sm sm:text-lg font-bold truncate">
                        {label}
                      </span>
                    </div>
                    <span className="text-sm sm:text-lg font-extrabold shrink-0">
                      {Math.round(p.score)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Primary Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              data-start="true"
              onClick={onBackToQrLobby}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span>Novo Participante (Novo QR Code)</span>
            </button>

            {onOpenLeaderboard && (
              <button
                type="button"
                onClick={onOpenLeaderboard}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
              >
                <Trophy className="w-4 h-4 shrink-0" />
                <span>Ver Ranking & Posições</span>
              </button>
            )}
          </div>
        </div>

        {/* Gamification Stats & Unlocked Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#08334C]/90 border border-cyan-500/30 rounded-2xl p-3.5 sm:p-4">
            <div className="text-[11px] sm:text-xs text-cyan-200/70 font-semibold uppercase">Sua Pontuação</div>
            <div className="text-lg sm:text-2xl font-extrabold font-mono-tabular text-emerald-400 mt-1">
              {Math.round(localPlayer.score)} pts
            </div>
          </div>

          <div className="bg-[#08334C]/90 border border-cyan-500/30 rounded-2xl p-3.5 sm:p-4">
            <div className="text-[11px] sm:text-xs text-cyan-200/70 font-semibold uppercase">Taxa de Acerto</div>
            <div className="text-lg sm:text-2xl font-extrabold font-mono-tabular text-white mt-1">
              {gamification.accuracyPercent}% ({localPlayer.correctCount}/{quiz.questions.length})
            </div>
          </div>

          <div className="bg-[#08334C]/90 border border-cyan-500/30 rounded-2xl p-3.5 sm:p-4">
            <div className="text-[11px] sm:text-xs text-cyan-200/70 font-semibold uppercase">Maior Sequência</div>
            <div className="text-lg sm:text-2xl font-extrabold font-mono-tabular text-amber-400 mt-1 flex items-center gap-1.5">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 shrink-0" />
              <span>{localPlayer.maxStreak}x</span>
            </div>
          </div>

          <div className="bg-[#08334C]/90 border border-cyan-500/30 rounded-2xl p-3.5 sm:p-4">
            <div className="text-[11px] sm:text-xs text-cyan-200/70 font-semibold uppercase">XP de Gamificação</div>
            <div className="text-lg sm:text-2xl font-extrabold font-mono-tabular text-sky-400 mt-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>+{gamification.xpEarned} XP</span>
            </div>
          </div>
        </div>

        {/* Unlocked Achievements */}
        <div className="bg-[#08334C]/90 border border-cyan-500/30 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Conquistas Arena Quiz Desbloqueadas
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {gamification.badgesUnlocked.map((badge) => (
              <div
                key={badge.id}
                className="p-3.5 rounded-xl bg-[#062A3E] border border-cyan-500/25"
              >
                <div className="text-xs font-extrabold text-amber-400">{badge.title}</div>
                <div className="text-xs text-cyan-100/75 mt-1">{badge.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Question-by-Question Review */}
        {answerHistory.length > 0 && (
          <div className="bg-[#08334C]/90 border border-cyan-500/30 rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-4">
              Gabarito da Partida
            </h2>
            <div className="space-y-2.5">
              {answerHistory.map((item, idx) => (
                <div
                  key={item.questionId}
                  className="p-3.5 rounded-xl bg-[#062A3E] border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    {item.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-white">
                        {idx + 1}. {item.questionText}
                      </div>
                      <div className="text-xs text-cyan-100/75 mt-0.5">
                        Sua resposta:{' '}
                        <strong className={item.isCorrect ? 'text-emerald-400' : 'text-red-400'}>
                          {item.chosenText}
                        </strong>
                        {!item.isCorrect && (
                          <span className="ml-2 text-slate-200">
                            · Correta: <strong className="text-emerald-400">{item.correctText}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono-tabular text-xs font-bold text-emerald-400 shrink-0">
                    +{item.pointsEarned} pts
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
