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

// Credenciais oficiais da nuvem Supabase
const CLOUD_SUPABASE_URL = 'https://ioxeqobrutxbakhexgor.supabase.co';
const CLOUD_SUPABASE_KEY = typeof atob === 'function'
  ? atob('c2Jfc2VjcmV0X0FDVFhicjhHeXhMOW5KNlUtNGh0T0FfaDREY3ZmeWM=')
  : '';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  // Limpar qualquer cache legado que possa ter ficado no navegador
  try {
    localStorage.removeItem('ARENA_QUIZ_SUPABASE_CONFIG');
  } catch {
    // ignore
  }

  const envUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || CLOUD_SUPABASE_URL) || CLOUD_SUPABASE_URL;
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || CLOUD_SUPABASE_KEY).trim() || CLOUD_SUPABASE_KEY;

  return { url: envUrl, anonKey: envKey };
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  if (!url || !anonKey) {
    try { localStorage.removeItem('ARENA_QUIZ_SUPABASE_CONFIG'); } catch {}
  } else {
    try {
      localStorage.setItem(
        'ARENA_QUIZ_SUPABASE_CONFIG',
        JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
      );
    } catch {}
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

/**
 * Cliente REST direto para o Supabase (100% nativo)
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed = parsed.filter(
          (p) => p.nickname && p.nickname.toLowerCase() !== 'vcdssfga' && !p.nickname.toLowerCase().includes('vcdss')
        );
        if (parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch {
    // ignore
  }
  return [
    {
      id: 'bot-1',
      nickname: 'Mestre Ninja',
      avatar_id: 'ninja',
      title_badge: 'Mestre dos Quizzes',
      total_score: 0,
      matches_played: 0,
      wins_count: 0,
      correct_answers: 0,
      position: 1,
    },
    {
      id: 'bot-2',
      nickname: 'AstralPulse',
      avatar_id: 'cat',
      title_badge: 'Velocista Espacial',
      total_score: 0,
      matches_played: 0,
      wins_count: 0,
      correct_answers: 0,
      position: 2,
    },
    {
      id: 'bot-3',
      nickname: 'QuantumFox',
      avatar_id: 'fox',
      title_badge: 'Estrategista Ágil',
      total_score: 0,
      matches_played: 0,
      wins_count: 0,
      correct_answers: 0,
      position: 3,
    },
    {
      id: 'bot-4',
      nickname: 'SolarSpark',
      avatar_id: 'bear',
      title_badge: 'Explorador Solar',
      total_score: 0,
      matches_played: 0,
      wins_count: 0,
      correct_answers: 0,
      position: 4,
    },
    {
      id: 'bot-5',
      nickname: 'PixelPanda',
      avatar_id: 'panda',
      title_badge: 'Guerreiro 8-bit',
      total_score: 0,
      matches_played: 0,
      wins_count: 0,
      correct_answers: 0,
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
 * Registra o jogador no banco de dados Supabase imediatamente ao entrar na sala / confirmar apelido.
 * Garante que o usuário apareça instantaneamente no banco de dados mesmo antes de terminar o quiz.
 */
export async function registerPlayerEntry(player: {
  id: string;
  nickname: string;
  avatarId: string;
  titleBadge: string;
}): Promise<void> {
  const cleanNick = (player.nickname || 'Jogador QR').trim();
  const playerId = player.id;

  // 1. Gravar imediatamente no Supabase via Cliente Oficial
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('players').upsert({
        id: playerId,
        nickname: cleanNick,
        avatar_id: player.avatarId,
        title_badge: player.titleBadge,
        total_score: 0,
        matches_played: 0,
        wins_count: 0,
        correct_answers: 0,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('Supabase JS upsert error, trying REST fallback:', error);
      }
    }
  } catch (err) {
    console.warn('Erro ao inserir via supabase client:', err);
  }

  // 1.1 Gravação adicional via REST
  await supabaseRest('players', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: {
      id: playerId,
      nickname: cleanNick,
      avatar_id: player.avatarId,
      title_badge: player.titleBadge,
      total_score: 0,
      matches_played: 0,
      wins_count: 0,
      correct_answers: 0,
      updated_at: new Date().toISOString(),
    },
  });

  // 2. Notificar servidor local se disponível
  try {
    if (API_BASE) {
      await fetch(`${API_BASE}/api/player/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: playerId,
          nickname: cleanNick,
          avatarId: player.avatarId,
          titleBadge: player.titleBadge,
          pointsToAdd: 0,
          isWin: false,
          correctAnswersToAdd: 0,
        }),
      });
    }
  } catch {
    // ignore
  }

  // 3. Atualizar cache local
  const list = getLocalLeaderboard();
  let existing = list.find((p) => p.id === playerId);
  if (!existing) {
    list.push({
      id: playerId,
      nickname: cleanNick,
      avatar_id: player.avatarId,
      title_badge: player.titleBadge,
      total_score: 0,
      matches_played: 0,
      wins_count: 0,
      correct_answers: 0,
    });
    saveLocalLeaderboard(list);
  }
}

/**
 * Salva a pontuação do jogador no Supabase na nuvem.
 * Cada participante usa um ID único para NUNCA somar pontos com jogadores anteriores ou tentativas passadas.
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
  const playerId = player.id || `player-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. Tentar via Cliente Oficial Supabase
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('players')
        .upsert({
          id: playerId,
          nickname: cleanNick,
          avatar_id: player.avatarId,
          title_badge: player.titleBadge,
          total_score: matchScore,
          matches_played: 1,
          wins_count: player.isWin ? 1 : 0,
          correct_answers: Number(player.correctAnswersToAdd) || 0,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && data) {
        const { data: allRanked } = await supabase
          .from('players')
          .select('id, total_score')
          .order('total_score', { ascending: false });

        let position = 1;
        if (allRanked && Array.isArray(allRanked)) {
          const idx = allRanked.findIndex((x) => x.id === playerId);
          position = idx !== -1 ? idx + 1 : 1;
        }
        return { player: { ...data, position }, position };
      }
    }
  } catch (err) {
    console.warn('Erro ao sincronizar perfil via supabase-js:', err);
  }

  // 1.1 TENTAR GRAVAR DIRETAMENTE NO SUPABASE NA NUVEM VIA REST
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

  // 1.2 TENTAR VIA SERVIDOR BACKEND /api/player/sync
  try {
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/api/player/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: playerId,
          nickname: cleanNick,
          avatarId: player.avatarId,
          titleBadge: player.titleBadge,
          pointsToAdd: matchScore,
          isWin: player.isWin,
          correctAnswersToAdd: player.correctAnswersToAdd,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.player && json.position) {
          return json;
        }
      }
    }
  } catch {
    // Falha de rede ou offline
  }

  // 2. MODO LOCAL FALLBACK (offline)
  const list = getLocalLeaderboard();
  let existing = list.find((p) => p.id === playerId);

  if (existing) {
    existing.total_score = matchScore; // PONTUAÇÃO DESSA TENTATIVA ÚNICA (NUNCA SOMAR)
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
 * Sincroniza a pontuação final da partida diretamente no Supabase em tempo real.
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
  if (!localP) return 1;

  const cleanNick = (localP.nickname || '').trim();
  const roundScore = Math.round(Number(localP.score) || 0);

  // 1. Tentar via Cliente Oficial Supabase
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('players').upsert({
        id: localP.id,
        nickname: cleanNick,
        avatar_id: localP.avatarId,
        title_badge: localP.titleBadge,
        total_score: roundScore,
        matches_played: 1,
        wins_count: localP.currentRank === 1 ? 1 : 0,
        correct_answers: Number(localP.correctCount) || 0,
        updated_at: new Date().toISOString(),
      });

      const { data: allRanked } = await supabase
        .from('players')
        .select('id, total_score')
        .order('total_score', { ascending: false });

      if (allRanked && Array.isArray(allRanked)) {
        const idx = allRanked.findIndex((x) => x.id === localP.id);
        if (idx !== -1) {
          return idx + 1;
        }
      }
    }
  } catch (err) {
    console.warn('Erro ao sincronizar participante via supabase-js:', err);
  }

  // 1.1 REST Fallback
  try {
    await supabaseRest('players', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: {
        id: localP.id,
        nickname: cleanNick,
        avatar_id: localP.avatarId,
        title_badge: localP.titleBadge,
        total_score: roundScore,
        matches_played: 1,
        wins_count: localP.currentRank === 1 ? 1 : 0,
        correct_answers: Number(localP.correctCount) || 0,
        updated_at: new Date().toISOString(),
      },
    });

    const { data: allRanked } = await supabaseRest<DbPlayer[]>('players?select=id,total_score&order=total_score.desc');
    if (allRanked && Array.isArray(allRanked)) {
      const idx = allRanked.findIndex((x) => x.id === localP.id);
      if (idx !== -1) {
        return idx + 1;
      }
    }
  } catch (err) {
    console.warn('Erro ao sincronizar participante no Supabase REST:', err);
  }

  return localP.currentRank;
}

/**
 * Salva a pontuação da partida no Supabase
 */
export async function saveMatchScore(scoreData: DbMatchScore): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
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
    }
  } catch (err) {
    console.warn('Erro ao salvar match_score via supabase-js:', err);
  }

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

  try {
    if (API_BASE) {
      await fetch(`${API_BASE}/api/player/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreData),
      });
    }
  } catch {
    // ignore
  }
}

/**
 * Carrega a classificação global (Leaderboard) em tempo real do banco de dados Supabase.
 * Funciona em qualquer aparelho (celular, tablet, PC ou Vercel).
 */
export async function fetchGlobalLeaderboard(limit = 20): Promise<DbPlayer[]> {
  // 1. Tentar via Cliente Oficial Supabase
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('total_score', { ascending: false })
        .limit(limit);

      if (!error && data && Array.isArray(data) && data.length > 0) {
        const cleanData = data
          .filter((p) => p.nickname && p.nickname.toLowerCase() !== 'vcdssfga')
          .map((item, idx) => ({
            ...item,
            position: idx + 1,
          }));

        saveLocalLeaderboard(cleanData);
        return cleanData;
      }
    }
  } catch (err) {
    console.warn('Erro ao consultar ranking via supabase-js:', err);
  }

  // 1.1 BUSCA DIRETA NO BANCO SUPABASE NA NUVEM VIA REST
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

    saveLocalLeaderboard(cleanData);
    return cleanData;
  }

  // 2. TENTAR VIA SERVIDOR BACKEND /api/leaderboard CONECTADO AO SUPABASE
  try {
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/api/leaderboard?limit=${limit}`);
      if (res.ok) {
        const json = await res.json();
        if (json.players && Array.isArray(json.players) && json.players.length > 0) {
          const cleanData = json.players
            .filter((p: any) => p.nickname && p.nickname.toLowerCase() !== 'vcdssfga')
            .map((item: any, idx: number) => ({
              ...item,
              position: item.position || idx + 1,
            }));
          saveLocalLeaderboard(cleanData);
          return cleanData;
        }
      }
    }
  } catch {
    // Falha de rede ou offline
  }

  // 3. Fallback cache local offline
  return getLocalLeaderboard().slice(0, limit);
}
