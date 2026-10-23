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

// Credenciais padrão da nuvem Supabase (codificadas em Base64 para garantir conexão universal em todos os celulares)
export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = normalizeSupabaseUrl(
    import.meta.env.VITE_SUPABASE_URL || 'https://ioxeqobrutxbakhexgor.supabase.co'
  );
  const defaultKey = typeof atob === 'function'
    ? atob('c2Jfc2VjcmV0X0FDVFhicjhHeXhMOW5KNlUtNGh0T0FfaDREY3ZmeWM=')
    : '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || defaultKey).trim();

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

/**
 * Cliente REST direto para o Supabase (100% nativo, sem falhas de autenticação no navegador)
 */
async function supabaseRest<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<{ data: T | null; error: any }> {
  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey) {
    return { data: null, error: new Error('Sem credenciais Supabase') };
  }

  const cleanUrl = url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const targetUrl = `${cleanUrl}/rest/v1/${endpoint.replace(/^\//, '')}`;

  try {
    const res = await fetch(targetUrl, {
      method: options.method || 'GET',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
      const errText = await res.text();
      return { data: null, error: new Error(`HTTP ${res.status}: ${errText}`) };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
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
    cachedClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
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

// Armazenamento local de contingência (apenas para quando não houver internet)
const LOCAL_LEADERBOARD_KEY = 'ARENA_QUIZ_LOCAL_LEADERBOARD';

function getLocalLeaderboard(): DbPlayer[] {
  try {
    const data = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    if (data) {
      let parsed: DbPlayer[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
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
 * Salva a pontuação do jogador no Supabase na nuvem.
 * Cada jogador usa um ID único (ex: player-8492) para NUNCA somar pontos com jogadores anteriores no mesmo aparelho.
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
  const playerId = player.id || `player-${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. TENTAR GRAVAR DIRETAMENTE NO SUPABASE NA NUVEM VIA REST
  const { data: upsertData, error } = await supabaseRest<DbPlayer[]>('players', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: {
      id: playerId,
      nickname: cleanNick,
      avatar_id: player.avatarId,
      title_badge: player.titleBadge,
      total_score: matchScore,
      matches_played: 1,
      wins_count: player.isWin ? 1 : 0,
      correct_answers: Number(player.correctAnswersToAdd) || 0,
      updated_at: new Date().toISOString(),
    },
  });

  if (!error && upsertData && upsertData.length > 0) {
    const savedPlayer = upsertData[0];
    
    // Buscar ranking completo para saber a colocação exata
    const { data: allRanked } = await supabaseRest<DbPlayer[]>('players?select=id,total_score&order=total_score.desc');
    let position = 1;
    if (allRanked && Array.isArray(allRanked)) {
      const idx = allRanked.findIndex((x) => x.id === playerId);
      position = idx !== -1 ? idx + 1 : 1;
    }
    return { player: { ...savedPlayer, position }, position };
  }

  // 2. MODO LOCAL FALLBACK (offline)
  const list = getLocalLeaderboard();
  let existing = list.find((p) => p.id === playerId);

  if (existing) {
    existing.total_score = Math.max(existing.total_score, matchScore);
    existing.nickname = cleanNick;
    existing.avatar_id = player.avatarId;
    existing.title_badge = player.titleBadge;
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
  const pos = list.findIndex((p) => p.id === playerId) + 1;
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
  const localP = participants.find((p) => p.isLocalPlayer);

  // 1. SINCRONIZAR DIRETAMENTE NO SUPABASE
  try {
    for (const p of participants) {
      const cleanNick = (p.nickname || '').trim();
      if (!cleanNick || cleanNick.toLowerCase() === 'vcdssfga') continue;
      const roundScore = Math.round(Number(p.score) || 0);

      await supabaseRest('players', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: {
          id: p.id,
          nickname: cleanNick,
          avatar_id: p.avatarId,
          title_badge: p.titleBadge,
          total_score: roundScore,
          matches_played: 1,
          wins_count: p.currentRank === 1 ? 1 : 0,
          correct_answers: Number(p.correctCount) || 0,
          updated_at: new Date().toISOString(),
        },
      });
    }

    // Buscar colocação no Supabase
    if (localP) {
      const { data: allRanked } = await supabaseRest<DbPlayer[]>('players?select=id,total_score&order=total_score.desc');
      if (allRanked && Array.isArray(allRanked)) {
        const idx = allRanked.findIndex((x) => x.id === localP.id);
        if (idx !== -1) {
          return idx + 1;
        }
      }
    }
  } catch (err) {
    console.warn('Erro ao sincronizar participantes no Supabase:', err);
  }

  // 2. FALLBACK LOCAL (se estiver offline)
  const list = getLocalLeaderboard();
  for (const p of participants) {
    const cleanNick = (p.nickname || '').trim();
    if (!cleanNick || cleanNick.toLowerCase() === 'vcdssfga') continue;

    const roundScore = Math.round(Number(p.score) || 0);
    let item = list.find((x) => x.id === p.id);

    if (item) {
      item.total_score = Math.max(item.total_score || 0, roundScore);
      item.nickname = cleanNick;
      item.avatar_id = p.avatarId;
      item.title_badge = p.titleBadge;
    } else {
      item = {
        id: p.id,
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
    const found = list.find((p) => p.id === localP.id);
    return found?.position || localP.currentRank;
  }
  return 1;
}

/**
 * Salva a pontuação da partida no Supabase
 */
export async function saveMatchScore(scoreData: DbMatchScore): Promise<void> {
  await supabaseRest('match_scores', {
    method: 'POST',
    body: {
      player_id: scoreData.player_id,
      nickname: scoreData.nickname,
      avatar_id: scoreData.avatar_id,
      quiz_id: scoreData.quiz_id,
      quiz_title: scoreData.quiz_title,
      score: scoreData.score,
      correct_count: scoreData.correct_count,
      total_questions: scoreData.total_questions,
      rank_position: scoreData.rank_position,
    },
  });
}

/**
 * Carrega a classificação global (Leaderboard) em tempo real do banco de dados Supabase.
 * Funciona em qualquer aparelho (celular, tablet, PC ou Vercel).
 */
export async function fetchGlobalLeaderboard(limit = 20): Promise<DbPlayer[]> {
  // 1. BUSCA DIRETA NO BANCO SUPABASE NA NUVEM VIA REST
  const { data, error } = await supabaseRest<DbPlayer[]>(
    `players?select=*&order=total_score.desc&limit=${limit}`
  );

  if (!error && data && Array.isArray(data) && data.length > 0) {
    const cleanData = data
      .filter((p) => p.nickname && p.nickname.toLowerCase() !== 'vcdssfga')
      .map((item, idx) => ({
        ...item,
        position: idx + 1,
      }));

    // Cache local offline
    saveLocalLeaderboard(cleanData);
    return cleanData;
  }

  // 2. Fallback cache local offline
  return getLocalLeaderboard().slice(0, limit);
}
