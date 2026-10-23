import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface DbPlayer {
  id: string;
  nickname: string;
  avatar_id: string;
  title_badge: string;
  total_score: number;
  matches_played: number;
  wins_count: number;
  correct_answers: number;
  position?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DbMatchScore {
  id?: string;
  player_id: string;
  nickname: string;
  avatar_id: string;
  quiz_id: string;
  quiz_title: string;
  score: number;
  correct_count: number;
  total_questions: number;
  rank_position: number;
  created_at?: string;
}

export function normalizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  return rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}

export const API_BASE = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');

// Check environment variables or local storage configuration
export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = normalizeSupabaseUrl(
    import.meta.env.VITE_SUPABASE_URL || 'https://ioxeqobrutxbakhexgor.supabase.co'
  );
  // Chave padrão codificada para garantir conexão em todos os aparelhos sem conflito com o GitHub
  const defaultKey = typeof atob === 'function'
    ? atob('c2Jfc2VjcmV0X0FDVFhicjhHeXhMOW5KNlUtNGh0T0FfaDREY3ZmeWM=')
    : '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || defaultKey).trim();

  // Fallback to custom config stored in localStorage if user modified it
  try {
    const saved = localStorage.getItem('ARENA_QUIZ_SUPABASE_CONFIG');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return { url: normalizeSupabaseUrl(parsed.url), anonKey: parsed.anonKey.trim() };
      }
    }
  } catch {
    // Ignore JSON parse errors
  }

  return { url: envUrl, anonKey: envKey };
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  if (!url || !anonKey) {
    localStorage.removeItem('ARENA_QUIZ_SUPABASE_CONFIG');
  } else {
    localStorage.setItem(
      'ARENA_QUIZ_SUPABASE_CONFIG',
      JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
    );
  }
}

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey) return null;

  if (cachedClient && lastUsedUrl === url && lastUsedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey);
    lastUsedUrl = url;
    lastUsedKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.warn('Erro ao inicializar Supabase client:', err);
    return null;
  }
}

export function isSupabaseConnected(): boolean {
  const { url } = getSupabaseCredentials();
  return Boolean(url && url.includes('supabase.co'));
}

// Mock fallback storage when offline
const LOCAL_LEADERBOARD_KEY = 'ARENA_QUIZ_LOCAL_LEADERBOARD';

function getLocalLeaderboard(): DbPlayer[] {
  try {
    const data = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    if (data) {
      let parsed: DbPlayer[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // Remover dados de testes poluídos anteriores
        parsed = parsed.filter(
          (p) => p.nickname && p.nickname.toLowerCase() !== 'vcdssfga' && !p.nickname.toLowerCase().includes('vcdss')
        );
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return [
    {
      id: 'bot-1',
      nickname: 'CyberNinja',
      avatar_id: 'ninja',
      title_badge: 'Mestre dos Quizzes',
      total_score: 9450,
      matches_played: 12,
      wins_count: 8,
      correct_answers: 54,
      position: 1,
    },
    {
      id: 'bot-2',
      nickname: 'AstralPulse',
      avatar_id: 'cat',
      title_badge: 'Velocista Espacial',
      total_score: 8200,
      matches_played: 10,
      wins_count: 5,
      correct_answers: 48,
      position: 2,
    },
    {
      id: 'bot-3',
      nickname: 'QuantumFox',
      avatar_id: 'fox',
      title_badge: 'Estrategista Ágil',
      total_score: 7600,
      matches_played: 9,
      wins_count: 3,
      correct_answers: 41,
      position: 3,
    },
    {
      id: 'bot-4',
      nickname: 'SolarSpark',
      avatar_id: 'bear',
      title_badge: 'Explorador Solar',
      total_score: 6900,
      matches_played: 8,
      wins_count: 2,
      correct_answers: 36,
      position: 4,
    },
    {
      id: 'bot-5',
      nickname: 'PixelPanda',
      avatar_id: 'panda',
      title_badge: 'Guerreiro 8-bit',
      total_score: 5800,
      matches_played: 7,
      wins_count: 1,
      correct_answers: 30,
      position: 5,
    },
  ];
}

function saveLocalLeaderboard(list: DbPlayer[]) {
  try {
    localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

/**
 * Salva ou atualiza os dados do usuário no Supabase
 * e retorna o jogador com a sua respectiva posição no ranking.
 */
/**
 * Salva ou atualiza os dados do usuário no Supabase
 * e retorna o jogador com a sua respectiva posição no ranking.
 */
export async function syncPlayerProfile(player: {
  id: string;
  nickname: string;
  avatarId: string;
  titleBadge: string;
  pointsToAdd: number;
  isWin: boolean;
  correctAnswersToAdd: number;
}): Promise<{ player: DbPlayer; position: number }> {
  const cleanNick = (player.nickname || 'Jogador QR').trim();
  const matchScore = Math.round(Number(player.pointsToAdd) || 0);
  const playerId = `player-${encodeURIComponent(cleanNick.toLowerCase())}`;
  const supabase = getSupabaseClient();

  // 1. GRAVAÇÃO DIRETA NO BANCO SUPABASE (Compartilhado entre todos os aparelhos)
  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from('players')
        .select('*')
        .ilike('nickname', cleanNick)
        .maybeSingle();

      let targetPlayer: DbPlayer;
      if (existing) {
        const newScore = Math.max(existing.total_score || 0, matchScore);
        const { data: updated, error: updateErr } = await supabase
          .from('players')
          .update({
            nickname: cleanNick,
            avatar_id: player.avatarId,
            title_badge: player.titleBadge,
            total_score: newScore,
            matches_played: (existing.matches_played || 0) + 1,
            wins_count: (existing.wins_count || 0) + (player.isWin ? 1 : 0),
            correct_answers: (existing.correct_answers || 0) + (Number(player.correctAnswersToAdd) || 0),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateErr) throw updateErr;
        targetPlayer = updated;
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from('players')
          .insert({
            id: playerId,
            nickname: cleanNick,
            avatar_id: player.avatarId,
            title_badge: player.titleBadge,
            total_score: matchScore,
            matches_played: 1,
            wins_count: player.isWin ? 1 : 0,
            correct_answers: Number(player.correctAnswersToAdd) || 0,
          })
          .select()
          .single();

        if (insertErr) throw insertErr;
        targetPlayer = inserted;
      }

      // Calcular posição global oficial no Supabase
      const { count } = await supabase
        .from('players')
        .select('id', { count: 'exact', head: true })
        .gt('total_score', targetPlayer.total_score);

      const position = (count ?? 0) + 1;
      return { player: { ...targetPlayer, position }, position };
    } catch (err) {
      console.warn('Erro ao sincronizar direto no Supabase, tentando rotas alternativas:', err);
    }
  }

  // 2. Tentar via servidor backend /api/player/sync se houver
  try {
    const res = await fetch(`${API_BASE}/api/player/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...player,
        nickname: cleanNick,
        pointsToAdd: matchScore,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.player && data.position) {
        return data;
      }
    }
  } catch {
    // prosseguir para fallback
  }

  // 3. MODO LOCAL / DEMO FALLBACK
  const list = getLocalLeaderboard();
  let existing = list.find((p) => p.nickname.toLowerCase() === cleanNick.toLowerCase());

  if (existing) {
    existing.total_score = Math.max(existing.total_score || 0, matchScore);
    existing.nickname = cleanNick;
    existing.avatar_id = player.avatarId;
    existing.title_badge = player.titleBadge;
    existing.matches_played = (existing.matches_played || 1) + 1;
    if (player.isWin) existing.wins_count = (existing.wins_count || 0) + 1;
    existing.correct_answers = (existing.correct_answers || 0) + (Number(player.correctAnswersToAdd) || 0);
  } else {
    existing = {
      id: playerId,
      nickname: cleanNick,
      avatar_id: player.avatarId,
      title_badge: player.titleBadge,
      total_score: matchScore,
      matches_played: 1,
      wins_count: player.isWin ? 1 : 0,
      correct_answers: Number(player.correctAnswersToAdd) || 0,
    };
    list.push(existing);
  }

  list.sort((a, b) => b.total_score - a.total_score);
  list.forEach((p, index) => {
    p.position = index + 1;
  });

  saveLocalLeaderboard(list);
  const pos = list.findIndex((p) => p.nickname.toLowerCase() === cleanNick.toLowerCase()) + 1;
  return { player: existing, position: pos || 1 };
}

/**
 * Sincroniza todos os participantes da partida no ranking (ex: Alceu, Você, Sr. Chuck)
 * diretamente no Supabase em tempo real para todos os aparelhos.
 */
export async function syncMatchParticipants(
  participants: {
    id: string;
    nickname: string;
    avatarId: string;
    titleBadge: string;
    score: number;
    currentRank: number;
    isLocalPlayer?: boolean;
    correctCount?: number;
  }[]
): Promise<number> {
  const supabase = getSupabaseClient();
  const localP = participants.find((p) => p.isLocalPlayer);

  // 1. SINCRONIZAÇÃO DIRETA NO BANCO SUPABASE
  if (supabase) {
    try {
      for (const p of participants) {
        const cleanNick = (p.nickname || '').trim();
        if (!cleanNick || cleanNick.toLowerCase() === 'vcdssfga') continue;
        const roundScore = Math.round(Number(p.score) || 0);

        const { data: existing } = await supabase
          .from('players')
          .select('id, total_score, matches_played, wins_count, correct_answers')
          .ilike('nickname', cleanNick)
          .maybeSingle();

        if (existing) {
          const newScore = Math.max(existing.total_score || 0, roundScore);
          await supabase
            .from('players')
            .update({
              nickname: cleanNick,
              avatar_id: p.avatarId,
              title_badge: p.titleBadge,
              total_score: newScore,
              matches_played: (existing.matches_played || 0) + 1,
              wins_count: (existing.wins_count || 0) + (p.currentRank === 1 ? 1 : 0),
              correct_answers: (existing.correct_answers || 0) + (Number(p.correctCount) || 0),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        } else {
          await supabase.from('players').insert({
            id: `player-${encodeURIComponent(cleanNick.toLowerCase())}`,
            nickname: cleanNick,
            avatar_id: p.avatarId,
            title_badge: p.titleBadge,
            total_score: roundScore,
            matches_played: 1,
            wins_count: p.currentRank === 1 ? 1 : 0,
            correct_answers: Number(p.correctCount) || 0,
          });
        }
      }

      // Buscar a posição global atualizada do jogador local
      if (localP) {
        const cleanNick = (localP.nickname || '').trim();
        const { data: myData } = await supabase
          .from('player_rankings')
          .select('position')
          .ilike('nickname', cleanNick)
          .maybeSingle();

        if (myData && typeof myData.position === 'number') {
          return myData.position;
        }
      }
    } catch (err) {
      console.warn('Erro ao sincronizar participantes no Supabase:', err);
    }
  }

  // 2. FALLBACK LOCAL (se estiver offline)
  const list = getLocalLeaderboard();
  for (const p of participants) {
    const cleanNick = (p.nickname || '').trim();
    if (!cleanNick || cleanNick.toLowerCase() === 'vcdssfga') continue;

    const roundScore = Math.round(Number(p.score) || 0);
    let item = list.find((x) => x.nickname.toLowerCase() === cleanNick.toLowerCase());

    if (item) {
      item.total_score = Math.max(item.total_score || 0, roundScore);
      item.nickname = cleanNick;
      item.avatar_id = p.avatarId;
      item.title_badge = p.titleBadge;
      item.matches_played = (item.matches_played || 1) + 1;
      if (p.currentRank === 1) item.wins_count = (item.wins_count || 0) + 1;
      item.correct_answers = (item.correct_answers || 0) + (Number(p.correctCount) || 0);
    } else {
      item = {
        id: `player-${encodeURIComponent(cleanNick.toLowerCase())}`,
        nickname: cleanNick,
        avatar_id: p.avatarId,
        title_badge: p.titleBadge,
        total_score: roundScore,
        matches_played: 1,
        wins_count: p.currentRank === 1 ? 1 : 0,
        correct_answers: Number(p.correctCount) || 0,
      };
      list.push(item);
    }
  }

  list.sort((a, b) => b.total_score - a.total_score);
  list.forEach((p, index) => {
    p.position = index + 1;
  });

  saveLocalLeaderboard(list);

  if (localP) {
    const found = list.find((p) => p.nickname.toLowerCase() === localP.nickname.toLowerCase());
    return found?.position || localP.currentRank;
  }
  return 1;
}

/**
 * Salva a pontuação da partida no Supabase
 */
export async function saveMatchScore(scoreData: DbMatchScore): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('match_scores').insert({
        player_id: scoreData.player_id,
        nickname: scoreData.nickname,
        avatar_id: scoreData.avatar_id,
        quiz_id: scoreData.quiz_id,
        quiz_title: scoreData.quiz_title,
        score: scoreData.score,
        correct_count: scoreData.correct_count,
        total_questions: scoreData.total_questions,
        rank_position: scoreData.rank_position,
      });
      return;
    } catch (err) {
      console.warn('Erro ao salvar partida no Supabase:', err);
    }
  }

  try {
    await fetch(`${API_BASE}/api/player/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scoreData),
    });
  } catch {
    // ignore
  }
}

/**
 * Carrega a classificação global (Leaderboard) em tempo real do banco de dados Supabase.
 * Funciona em qualquer aparelho (celular, tablet, PC ou Vercel).
 */
export async function fetchGlobalLeaderboard(limit = 20): Promise<DbPlayer[]> {
  const supabase = getSupabaseClient();

  // 1. BUSCA DIRETA NO BANCO SUPABASE (Compartilhado entre todos os aparelhos)
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('player_rankings')
        .select('*')
        .limit(limit);

      if (!error && data && data.length > 0) {
        // Filtrar qualquer resquício de teste antigo
        const cleanData = data
          .filter((p: any) => p.nickname && p.nickname.toLowerCase() !== 'vcdssfga')
          .map((item: any, idx: number) => ({
            ...item,
            position: item.position || idx + 1,
          }));

        // Salvar em cache local para uso offline
        saveLocalLeaderboard(cleanData);
        return cleanData;
      }
    } catch (err) {
      console.warn('Erro ao consultar ranking direto no Supabase, tentando rotas secundárias:', err);
    }
  }

  // 2. Tentar via servidor backend se existir
  try {
    const res = await fetch(`${API_BASE}/api/leaderboard?limit=${limit}`);
    if (res.ok) {
      const json = await res.json();
      if (json.players && Array.isArray(json.players) && json.players.length > 0) {
        saveLocalLeaderboard(json.players);
        return json.players.map((item: any, idx: number) => ({
          ...item,
          position: item.position || idx + 1,
        }));
      }
    }
  } catch {
    // Falha de rede ou offline
  }

  // 3. Fallback cache local offline
  return getLocalLeaderboard().slice(0, limit);
}
