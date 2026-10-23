import React, { useEffect, useState } from 'react';
import {
  Trophy,
  X,
  Medal,
  Flame,
  Award,
  RefreshCw,
  Database,
  TrendingUp,
} from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';
import { DbPlayer, fetchGlobalLeaderboard } from '../lib/supabase';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  localPlayerId: string;
  localPlayerNickname: string;
  localPlayerAvatarId: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  localPlayerId,
  localPlayerNickname,
  localPlayerAvatarId,
}) => {
  const [players, setPlayers] = useState<DbPlayer[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await fetchGlobalLeaderboard(20);
      setPlayers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLeaderboard();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Encontrar o jogador atual na lista (estritamente pelo apelido atual)
  const myPlayerEntry = players.find(
    (p) => p.nickname && p.nickname.toLowerCase() === localPlayerNickname.toLowerCase()
  );

  const topThree = players.slice(0, 3);
  const remainingPlayers = players.slice(3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-b from-[#0B253A] to-[#061826] border border-cyan-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-cyan-500/20 flex items-center justify-between bg-[#082033]/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
                Ranking & Posições dos Usuários
              </h2>
              <p className="text-xs sm:text-sm text-cyan-200/70">
                Tabela oficial sincronizada com o banco de dados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadLeaderboard}
              disabled={loading}
              className="p-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 text-cyan-200 transition"
              title="Recarregar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current User Highlights Bar */}
        <div className="px-5 py-3 bg-[#0c2a42] border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PlayerAvatar avatarId={localPlayerAvatarId || 'fox'} size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {localPlayerNickname || 'Seu Perfil'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Você
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {myPlayerEntry ? (
                  <>Posição Atual: <strong className="text-amber-300">#{myPlayerEntry.position}º Lugar</strong> com <strong>{myPlayerEntry.total_score.toLocaleString()} pts</strong></>
                ) : (
                  <>Jogue uma partida para registrar sua pontuação oficial no ranking!</>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
            <div>
              <span className="text-slate-400 block text-[10px]">TOTAL DE JOGADORES</span>
              <strong className="text-white text-sm">{players.length}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">SUAS VITÓRIAS</span>
              <strong className="text-emerald-400 text-sm">{myPlayerEntry?.wins_count || 0}</strong>
            </div>
          </div>
        </div>

        {/* Body / Ranking Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
          
          {/* Top 3 Podiums Showcase */}
          {topThree.length > 0 && (
            <div>
              <span className="text-xs font-black tracking-wider text-cyan-400 uppercase mb-3 block">
                Top 3 — Líderes da Arena
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-end">
                {/* 2nd Place */}
                {topThree[1] && (
                  <div className="order-2 sm:order-1 bg-gradient-to-t from-slate-900/90 to-slate-800/80 border border-slate-400/40 rounded-2xl p-4 text-center flex flex-col items-center relative shadow-lg">
                    <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-slate-300 text-slate-900 text-xs font-black shadow flex items-center gap-1">
                      <Medal className="w-3.5 h-3.5" /> 2º Lugar
                    </div>
                    <PlayerAvatar avatarId={topThree[1].avatar_id} size="md" className="mt-2 mb-2" />
                    <h4 className="font-bold text-sm text-white truncate max-w-[140px]">
                      {topThree[1].nickname}
                    </h4>
                    <span className="text-[11px] text-cyan-300 font-semibold mb-1">
                      {topThree[1].title_badge}
                    </span>
                    <div className="text-lg font-black text-slate-200">
                      {topThree[1].total_score.toLocaleString()} <span className="text-xs font-normal text-slate-400">pts</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {topThree[1].wins_count} vitórias · {topThree[1].matches_played} partidas
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                  <div className="order-1 sm:order-2 bg-gradient-to-t from-amber-950/60 via-[#182C3D] to-amber-900/30 border-2 border-amber-400/60 rounded-2xl p-5 text-center flex flex-col items-center relative shadow-xl shadow-amber-500/10 sm:-translate-y-2">
                    <div className="absolute -top-3.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-xs font-black shadow-lg flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" /> 1º Campeão
                    </div>
                    <PlayerAvatar avatarId={topThree[0].avatar_id} size="lg" className="mt-2 mb-2 ring-2 ring-amber-400" />
                    <h4 className="font-extrabold text-base text-amber-200 truncate max-w-[160px]">
                      {topThree[0].nickname}
                    </h4>
                    <span className="text-[11px] text-amber-300 font-bold mb-1">
                      {topThree[0].title_badge}
                    </span>
                    <div className="text-2xl font-black text-amber-400">
                      {topThree[0].total_score.toLocaleString()} <span className="text-xs font-normal text-amber-200/70">pts</span>
                    </div>
                    <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> {topThree[0].wins_count} vitórias acumuladas
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <div className="order-3 sm:order-3 bg-gradient-to-t from-slate-900/90 to-amber-950/40 border border-amber-700/40 rounded-2xl p-4 text-center flex flex-col items-center relative shadow-lg">
                    <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-700 text-amber-100 text-xs font-black shadow flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> 3º Lugar
                    </div>
                    <PlayerAvatar avatarId={topThree[2].avatar_id} size="md" className="mt-2 mb-2" />
                    <h4 className="font-bold text-sm text-white truncate max-w-[140px]">
                      {topThree[2].nickname}
                    </h4>
                    <span className="text-[11px] text-cyan-300 font-semibold mb-1">
                      {topThree[2].title_badge}
                    </span>
                    <div className="text-lg font-black text-amber-200">
                      {topThree[2].total_score.toLocaleString()} <span className="text-xs font-normal text-slate-400">pts</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {topThree[2].wins_count} vitórias · {topThree[2].matches_played} partidas
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top 20 Leaderboard Table / Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black tracking-wider text-cyan-400 uppercase">
                Top 20 — Melhores Jogadores da Arena
              </span>
              <span className="text-xs text-slate-400">
                Mostrando no máximo os 20 primeiros
              </span>
            </div>

            <div className="space-y-2">
              {players.slice(0, 20).map((p) => {
                const isMe = Boolean(p.nickname && p.nickname.toLowerCase() === localPlayerNickname.toLowerCase());
                const pos = p.position || 0;

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                      isMe
                        ? 'bg-cyan-950/60 border-cyan-400 ring-1 ring-cyan-400/50 shadow-md shadow-cyan-500/10'
                        : pos <= 3
                        ? 'bg-[#0a2337] border-cyan-500/30'
                        : 'bg-[#081b2c]/80 border-slate-700/40 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Position Badge */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                          pos === 1
                            ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/30'
                            : pos === 2
                            ? 'bg-slate-300 text-slate-950'
                            : pos === 3
                            ? 'bg-amber-700 text-amber-100'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        #{pos}
                      </div>

                      <PlayerAvatar avatarId={p.avatar_id} size="sm" />

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {p.nickname}
                          </span>
                          {isMe && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-cyan-400 text-slate-950">
                              Você
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-cyan-200/70 font-medium">
                          {p.title_badge} · {p.matches_played} {p.matches_played === 1 ? 'partida' : 'partidas'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-cyan-300">
                        {p.total_score.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        {p.wins_count} {p.wins_count === 1 ? 'vitória' : 'vitórias'}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* If current player is ranked outside top 20, show their position pinned at bottom */}
              {myPlayerEntry && (myPlayerEntry.position || 0) > 20 && (
                <>
                  <div className="text-center py-1 text-slate-500 font-mono font-bold tracking-widest text-xs">
                    • • •
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl border bg-cyan-950/70 border-cyan-400 ring-1 ring-cyan-400/50 shadow-md shadow-cyan-500/10">
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs bg-cyan-500 text-slate-950">
                        #{myPlayerEntry.position}
                      </div>
                      <PlayerAvatar avatarId={myPlayerEntry.avatar_id} size="sm" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {myPlayerEntry.nickname}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-cyan-400 text-slate-950">
                            Você
                          </span>
                        </div>
                        <span className="text-[11px] text-cyan-200/70 font-medium">
                          {myPlayerEntry.title_badge} · {myPlayerEntry.matches_played} {myPlayerEntry.matches_played === 1 ? 'partida' : 'partidas'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-cyan-300">
                        {myPlayerEntry.total_score.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        {myPlayerEntry.wins_count} {myPlayerEntry.wins_count === 1 ? 'vitória' : 'vitórias'}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {players.length === 0 && !loading && (
                <div className="text-center py-12 text-slate-400">
                  <Database className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                  <p className="text-sm font-semibold">Nenhum jogador registrado ainda.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Jogue a primeira partida para aparecer no topo do ranking!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#082033] border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>As posições são atualizadas em tempo real a cada partida concluída.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black tracking-wide transition ml-auto"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
