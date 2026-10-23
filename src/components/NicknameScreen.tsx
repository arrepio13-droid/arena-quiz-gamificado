import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Dices, Play, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { QuizDeck, validateNickname } from '../game/rules';
import { AVATARS, FUN_NICKNAMES } from '../game/quizzes';
import { PlayerAvatar } from './PlayerAvatar';

interface NicknameScreenProps {
  quiz: QuizDeck;
  initialNickname: string;
  initialAvatarId: string;
  initialTitleBadge: string;
  initialPlayerCode?: string;
  connectedPlayersCount: number;
  onBackToHome: () => void;
  onConfirmJoin: (nickname: string, avatarId: string, titleBadge: string, playerCode: string) => void;
}

const TITLE_BADGES = [
  'Velocista QR',
  'Mestre do Quiz',
  'Estrategista 2x',
  'Lenda da Arena',
];

export const NicknameScreen: React.FC<NicknameScreenProps> = ({
  quiz,
  initialNickname,
  initialAvatarId,
  initialTitleBadge,
  initialPlayerCode,
  connectedPlayersCount,
  onBackToHome,
  onConfirmJoin,
}) => {
  const [nickname, setNickname] = useState(() => (initialNickname === 'Jogador 1' ? '' : (initialNickname || '')));
  const [avatarId, setAvatarId] = useState(initialAvatarId || 'fox');
  const [titleBadge, setTitleBadge] = useState(initialTitleBadge || TITLE_BADGES[0]);
  const [playerCode, setPlayerCode] = useState(() => initialPlayerCode || Math.floor(1000 + Math.random() * 9000).toString());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRandomNickname = () => {
    const randomPick = FUN_NICKNAMES[Math.floor(Math.random() * FUN_NICKNAMES.length)];
    const randomSuffix = Math.floor(10 + Math.random() * 89);
    setNickname(`${randomPick}${randomSuffix}`);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateNickname(nickname);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Digite um apelido válido.');
      return;
    }
    setErrorMsg(null);
    onConfirmJoin(validation.cleaned, avatarId, titleBadge, playerCode);
  };

  return (
    <div className="min-h-screen bg-[#062A3E] text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-10">
      {/* Top Status Bar */}
      <div className="max-w-4xl w-full mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToHome}
          className="self-start inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs sm:text-sm font-medium text-slate-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Voltar ao QR Code</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-100/80 font-mono-tabular">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>QR Code Lido</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>PIN {quiz.pin.slice(0, 3)} {quiz.pin.slice(3)}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>{connectedPlayersCount} na sala</span>
          </span>
        </div>
      </div>

      {/* Main Centered Nickname & Avatar Registration Card */}
      <main className="max-w-2xl w-full mx-auto my-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <p className="text-xs font-semibold text-emerald-400 tracking-wide">
              PASSO 2 DE 2 · IDENTIFICAÇÃO DO JOGADOR
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold font-display text-white mt-1">
              Insira seu Apelido para o Quiz
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Você está entrando em: <strong className="text-slate-200">{quiz.title}</strong> ({quiz.questions.length} perguntas)
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 shrink-0">
            <PlayerAvatar avatarId={avatarId} size="lg" />
            <div>
              <div className="text-sm font-bold text-white truncate max-w-[140px]">
                {nickname.trim() || 'Seu Apelido'}
              </div>
              <div className="text-xs text-amber-400 font-medium">{titleBadge}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6" noValidate>
          {/* Nickname Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="player-nickname-input"
                className="block text-sm font-semibold text-slate-200"
              >
                Seu Apelido na Arena
              </label>
              <button
                type="button"
                onClick={handleRandomNickname}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <Dices className="w-3.5 h-3.5" />
                Gerar Apelido Aleatório
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="player-nickname-input"
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Ex: MestreQuiz, RelampagoAzul..."
                maxLength={20}
                autoFocus
                className="flex-1 px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-base font-semibold focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            {errorMsg && (
              <p role="alert" className="mt-2 text-xs font-semibold text-red-400">
                {errorMsg}
              </p>
            )}

            {/* Código Único do Jogador / Partida */}
            <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Seu Código Único nesta Partida:</span>
                <span className="font-mono text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                  #{playerCode}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPlayerCode(Math.floor(1000 + Math.random() * 9000).toString())}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer flex items-center gap-1"
                title="Sortear outro código de partida"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Novo Código</span>
              </button>
            </div>
          </div>

          {/* Avatar Selection */}
          <div>
            <span className="block text-sm font-semibold text-slate-200 mb-2.5">
              Escolha seu Avatar de Competidor
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
              {AVATARS.map((av) => {
                const isSelected = av.id === avatarId;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setAvatarId(av.id)}
                    aria-label={`Selecionar avatar ${av.name}`}
                    aria-pressed={isSelected}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-transform cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-emerald-400 scale-105 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <PlayerAvatar avatarId={av.id} size="sm" />
                    <span className="mt-1 text-[10px] font-medium text-slate-300 truncate w-full text-center">
                      {av.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Badge Selection */}
          <div>
            <span className="block text-sm font-semibold text-slate-200 mb-2">
              Título de Gamificação Inicial
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TITLE_BADGES.map((badge) => {
                const active = titleBadge === badge;
                return (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => setTitleBadge(badge)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {badge}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aviso da regra oficial de 1 tentativa */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-200">
            <span className="text-amber-400 font-bold text-base shrink-0">⚠️</span>
            <span>
              <strong>Regra Oficial da Arena:</strong> Cada participante só poderá responder <strong>1 vez</strong> o quiz. Sua pontuação será gravada de forma independente no ranking oficial.
            </span>
          </div>

          {/* Submit & Launch directly into the Quiz */}
          <div className="pt-2">
            <button
              type="submit"
              data-testid="confirm-nickname-start-quiz"
              className="w-full py-4 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-base flex items-center justify-center gap-2.5 shadow-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play className="w-5 h-5 fill-current" />
              Confirmar Apelido e Iniciar Quiz Agora
            </button>
          </div>
        </form>
      </main>

      {/* Bottom Footer Info */}
      <div className="max-w-4xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Power-Ups ativos: 2x Pontos · 50/50 · Congelar Tempo · Escudo de Sequência
        </span>
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Responda rápido para ganhar até 1.000 pts + bônus de combo por pergunta
        </span>
      </div>
    </div>
  );
};
