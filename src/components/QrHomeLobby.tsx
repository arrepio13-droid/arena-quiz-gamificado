import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import { Camera, QrCode, RefreshCw, Smartphone, Sparkles, Trophy } from 'lucide-react';
import { QuizDeck } from '../game/rules';

interface QrHomeLobbyProps {
  decks: QuizDeck[];
  selectedDeck: QuizDeck;
  joinUrl: string;
  careerXp: number;
  careerMatches: number;
  onSelectDeck: (deck: QuizDeck) => void;
  onDirectQrReadToNickname: (deck: QuizDeck, playerCode?: string) => void;
  onOpenCameraScanner: () => void;
  onOpenQuizCreator: () => void;
  onOpenHostPresenter: () => void;
  onAwardWarmupXp: (points: number) => void;
  onOpenLeaderboard?: () => void;
}

export const QrHomeLobby: React.FC<QrHomeLobbyProps> = ({
  selectedDeck,
  joinUrl,
  onDirectQrReadToNickname,
  onOpenCameraScanner,
  onOpenLeaderboard,
}) => {
  const [playerCode, setPlayerCode] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const personalizedJoinUrl = joinUrl.includes('?')
    ? `${joinUrl}&code=${playerCode}`
    : `${joinUrl}?code=${playerCode}`;

  return (
    <div className="min-h-screen bg-[#062A3E] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <motion.main
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md mx-auto flex flex-col items-center text-center space-y-5"
      >
        {/* Arena Quiz Brand Lockup */}
        <div className="flex flex-col items-center space-y-2.5">
          <svg
            viewBox="0 0 72 72"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-lg"
            aria-hidden="true"
          >
            <rect width="72" height="72" rx="16" fill="#0A3A54" />
            <rect x="6" y="6" width="28" height="28" rx="7" fill="#DC2626" />
            <polygon points="20,11 29,28 11,28" fill="#FFFFFF" />
            <rect x="38" y="6" width="28" height="28" rx="7" fill="#2563EB" />
            <polygon points="52,10 61,20 52,30 43,20" fill="#FFFFFF" />
            <rect x="6" y="38" width="28" height="28" rx="7" fill="#D97706" />
            <circle cx="20" cy="52" r="8.5" fill="#FFFFFF" />
            <rect x="38" y="38" width="28" height="28" rx="7" fill="#16A34A" />
            <rect x="44" y="44" width="16" height="16" rx="2.5" fill="#FFFFFF" />
          </svg>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              ARENA QUIZ
            </h1>
            <p className="text-xs sm:text-sm text-cyan-100/80 mt-1">
              Escaneie o QR Code individual abaixo para acessar o quiz
            </p>
          </div>
        </div>

        {/* Dedicated Centered QR Code Card */}
        <div className="w-full bg-[#09354F] border border-cyan-800/70 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col items-center space-y-4">
          <div className="flex items-center justify-between w-full text-xs font-mono-tabular px-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 shrink-0" />
              <span>QR CODE DO JOGADOR</span>
            </span>
            <span className="font-bold text-amber-400">
              PIN {selectedDeck.pin.slice(0, 3)} {selectedDeck.pin.slice(3)}
            </span>
          </div>

          {/* Interactive Scannable QR Code */}
          <button
            type="button"
            data-testid="btn-simulate-qr-scan"
            onClick={() => onDirectQrReadToNickname(selectedDeck, playerCode)}
            aria-label={`Ler QR Code do quiz ${selectedDeck.title} com código único #${playerCode}`}
            className="group bg-white p-5 sm:p-6 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.99] transition-transform cursor-pointer flex flex-col items-center"
          >
            <QRCodeSVG value={personalizedJoinUrl} size={220} level="M" includeMargin={false} />
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-extrabold text-slate-900">
              <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Aponte a câmera ou toque no QR Code</span>
            </div>
          </button>

          {/* Unique Player Code Bar with Refresh */}
          <div className="flex items-center justify-between w-full p-2.5 rounded-xl bg-slate-950/70 border border-cyan-800/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Código Deste Jogador:</span>
              <span className="font-mono font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                #{playerCode}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPlayerCode(Math.floor(1000 + Math.random() * 9000).toString())}
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Gerar código para o próximo participante"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Novo Código</span>
            </button>
          </div>

          <div className="space-y-1">
            <div className="text-sm sm:text-base font-extrabold text-white">
              {selectedDeck.title}
            </div>
            <div className="text-xs text-cyan-200/75 font-mono-tabular">
              {selectedDeck.questions.length} perguntas · Gamificação Ao Vivo
            </div>
          </div>

          {/* Action Buttons to Read QR Code */}
          <div className="w-full space-y-2.5 pt-1">
            <button
              type="button"
              data-start="true"
              data-testid="scan-qr-primary-button"
              onClick={() => onDirectQrReadToNickname(selectedDeck, playerCode)}
              className="w-full py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
            >
              <QrCode className="w-5 h-5 shrink-0" />
              <span>Ler QR Code</span>
            </button>

            <button
              type="button"
              onClick={onOpenCameraScanner}
              className="w-full py-2.5 px-4 rounded-xl bg-[#052233] hover:bg-[#072d44] border border-cyan-800/70 text-xs font-bold text-cyan-100 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Abrir Câmera para Escanear</span>
            </button>

            {onOpenLeaderboard && (
              <button
                type="button"
                onClick={onOpenLeaderboard}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-xs font-bold text-amber-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Ver Ranking & Posições</span>
              </button>
            )}
          </div>
        </div>
      </motion.main>
    </div>
  );
};
