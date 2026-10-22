import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Play, Tv, Users, X, Smartphone } from 'lucide-react';
import { PlayerParticipant, QuizDeck } from '../game/rules';
import { PlayerAvatar } from './PlayerAvatar';

interface HostPresenterModalProps {
  isOpen: boolean;
  quiz: QuizDeck;
  joinUrl: string;
  participants: PlayerParticipant[];
  onClose: () => void;
  onScanFromTv: () => void;
}

export const HostPresenterModal: React.FC<HostPresenterModalProps> = ({
  isOpen,
  quiz,
  joinUrl,
  participants,
  onClose,
  onScanFromTv,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="host-presenter-title"
    >
      <div className="w-full max-w-5xl rounded-2xl bg-slate-900 border border-slate-700 p-6 md:p-8 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Tv className="w-6 h-6 text-amber-400" />
            <div>
              <h2 id="host-presenter-title" className="text-xl md:text-2xl font-extrabold font-display text-white">
                Modo Telão do Apresentador · {quiz.title}
              </h2>
              <p className="text-xs text-slate-400">
                Projete esta tela na sala de aula ou auditório. Os jogadores leem o QR Code, inserem o apelido e entram ao vivo!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modo apresentador"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Giant Scannable QR Code & PIN */}
          <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center">
            <span className="text-xs font-bold text-emerald-400 tracking-wider">
              PASSO 1: ESCANEIE O QR CODE
            </span>
            <div className="mt-3 bg-white p-5 rounded-2xl shadow-xl">
              <QRCodeSVG value={joinUrl} size={220} level="M" includeMargin={false} />
            </div>

            <div className="mt-4">
              <div className="text-xs text-slate-400">PIN DA SALA ARENA QUIZ</div>
              <div className="text-4xl font-extrabold font-mono-tabular tracking-widest text-amber-400 mt-1">
                {quiz.pin.slice(0, 3)} {quiz.pin.slice(3)}
              </div>
            </div>

            <button
              type="button"
              onClick={onScanFromTv}
              className="mt-5 w-full py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Smartphone className="w-4 h-4" />
              Simular Leitura QR e Entrar com Apelido
            </button>
          </div>

          {/* Right: Live Connected Players Lobby */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-5">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">
                    Jogadores Conectados ({participants.length})
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  Sincronizado em tempo real
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800"
                  >
                    <PlayerAvatar avatarId={p.avatarId} size="sm" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {p.nickname}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {p.titleBadge}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-white">
                  Tudo pronto para iniciar a partida?
                </div>
                <div className="text-xs text-slate-400">
                  {quiz.questions.length} perguntas · Cronômetro dinâmico · Power-ups habilitados
                </div>
              </div>
              <button
                type="button"
                onClick={onScanFromTv}
                className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm flex items-center gap-2 shadow-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Play className="w-4 h-4 fill-current" />
                Entrar e Iniciar Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
