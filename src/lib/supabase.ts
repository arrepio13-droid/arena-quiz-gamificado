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
  const envUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || '');
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

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
      return JSON.parse(data);
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
export async function syncPlayerProfile(player: {
  id: string;
  nickname: string;
  avatarId: string;
  titleBadge: string;
  pointsToAdd: number;
  isWin: boolean;
  correctAnswersToAdd: number;
}): Promise<{ player: DbPlayer; position: number }> {
  // 1. Tentar via servidor backend /api/player/sync
  try {
    const res = await fetch(`${API_BASE}/api/player/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(player),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.player && data.position) {
        return data;
      }
    }
  } catch {
    // Falha de rede ou modo estático, prosseguir para fallback
  }

  // 2. MODO LOCAL / DEMO FALLBACK
  const list = getLocalLeaderboard();
  let existing = list.find((p) => p.id === player.id || p.nickname.toLowerCase() === player.nickname.toLowerCase());

  if (existing) {
    existing.total_score += player.pointsToAdd;
    existing.matches_played += 1;
    if (player.isWin) existing.wins_count += 1;
    existing.correct_answers += player.correctAnswersToAdd;
    existing.avatar_id = player.avatarId;
    existing.title_badge = player.titleBadge;
  } else {
    existing = {
      id: player.id,
      nickname: player.nickname,
      avatar_id: player.avatarId,
      title_badge: player.titleBadge,
      total_score: player.pointsToAdd,
      matches_played: 1,
      wins_count: player.isWin ? 1 : 0,
      correct_answers: player.correctAnswersToAdd,
    };
    list.push(existing);
  }

  list.sort((a, b) => b.total_score - a.total_score);
  list.forEach((p, index) => {
    p.position = index + 1;
  });

  saveLocalLeaderboard(list);
  const pos = list.findIndex((p) => p.id === existing?.id) + 1;
  return { player: existing, position: pos || 1 };
}

/**
 * Salva a pontuação da partida no Supabase
 */
export async function saveMatchScore(scoreData: DbMatchScore): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/player/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scoreData),
    });
  } catch (err) {
    console.warn('Erro ao gravar pontuação da partida no servidor:', err);
  }
}

/**
 * Carrega a classificação global (Leaderboard) com posições calculadas
 */
export async function fetchGlobalLeaderboard(limit = 20): Promise<DbPlayer[]> {
  // 1. Tentar via endpoint /api/leaderboard conectado ao Supabase
  try {
    const res = await fetch(`${API_BASE}/api/leaderboard?limit=${limit}`);
    if (res.ok) {
      const json = await res.json();
      if (json.players && Array.isArray(json.players)) {
        return json.players.map((item: any, idx: number) => ({
          ...item,
          position: item.position || idx + 1,
        }));
      }
    }
  } catch {
    // Falha de rede ou offline
  }

  return getLocalLeaderboard().slice(0, limit);
}
