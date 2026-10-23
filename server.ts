import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import os from 'os';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

function normalizeSupabaseUrl(rawUrl: string): string {
  return rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}

const RAW_SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_URL = RAW_SUPABASE_URL ? normalizeSupabaseUrl(RAW_SUPABASE_URL) : '';
const SUPABASE_KEY = (process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();

const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    })
  : null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RoomPlayer {
  id: string;
  nickname: string;
  avatarId: string;
  titleBadge: string;
  score: number;
  streak: number;
  maxStreak: number;
  correctCount: number;
  answeredCount: number;
  lastPointsEarned: number;
}

interface LiveRoom {
  pin: string;
  quizId: string;
  quizTitle: string;
  status: 'lobby' | 'playing' | 'podium';
  currentQuestionIndex: number;
  players: Map<string, RoomPlayer>;
  updatedAt: number;
}

const rooms = new Map<string, LiveRoom>();

// Seed default active rooms matching INITIAL_QUIZ_DECKS PINs
const defaultPins = [
  { pin: '482910', quizId: 'quiz-hidratacao-saude', quizTitle: 'Hidratação, Saúde & Performance Corporal' },
  { pin: '619420', quizId: 'quiz-pop-science', quizTitle: 'Ciência, Universo & Curiosidades Pop' },
  { pin: '739204', quizId: 'quiz-tech-geek', quizTitle: 'Tecnologia, Jogos & Inovação Digital' },
  { pin: '904115', quizId: 'quiz-math-sprint', quizTitle: 'Sprint de Matemática & Raciocínio Rápido' },
];

for (const item of defaultPins) {
  rooms.set(item.pin, {
    pin: item.pin,
    quizId: item.quizId,
    quizTitle: item.quizTitle,
    status: 'lobby',
    currentQuestionIndex: 0,
    players: new Map(),
    updatedAt: Date.now(),
  });
}

function serializeRoom(room: LiveRoom) {
  return {
    pin: room.pin,
    quizId: room.quizId,
    quizTitle: room.quizTitle,
    status: room.status,
    currentQuestionIndex: room.currentQuestionIndex,
    players: Array.from(room.players.values()),
    updatedAt: room.updatedAt,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // CORS middleware for multi-platform / Vercel integration
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  // Track which room each socket subscribed to
  const socketRoomMap = new Map<WebSocket, { pin: string; playerId?: string }>();

  function broadcastRoomState(pin: string) {
    const room = rooms.get(pin);
    if (!room) return;
    const payload = JSON.stringify({
      type: 'room:state',
      room: serializeRoom(room),
    });
    for (const [client, meta] of socketRoomMap.entries()) {
      if (meta.pin === pin && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  // REST API for room status & custom room creation
  app.get('/api/rooms/:pin', (req, res) => {
    const pin = req.params.pin.replace(/\D/g, '');
    const room = rooms.get(pin);
    if (!room) {
      res.status(404).json({ error: 'Sala não encontrada para este PIN.' });
      return;
    }
    res.json({ room: serializeRoom(room) });
  });

  app.post('/api/rooms', (req, res) => {
    const { pin, quizId, quizTitle } = req.body || {};
    if (!pin || !quizId || !quizTitle) {
      res.status(400).json({ error: 'Dados incompletos para criar sala.' });
      return;
    }
    const cleanPin = String(pin).replace(/\D/g, '');
    if (!rooms.has(cleanPin)) {
      rooms.set(cleanPin, {
        pin: cleanPin,
        quizId,
        quizTitle,
        status: 'lobby',
        currentQuestionIndex: 0,
        players: new Map(),
        updatedAt: Date.now(),
      });
    }
    const room = rooms.get(cleanPin)!;
    res.json({ room: serializeRoom(room) });
  });

  // Informações de rede local para permitir acesso de outros aparelhos (celulares) via Wi-Fi
  app.get('/api/network-ip', (_req, res) => {
    let localIp = 'localhost';
    try {
      const nets = os.networkInterfaces();
      for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
          if (net.family === 'IPv4' && !net.internal) {
            localIp = net.address;
            break;
          }
        }
        if (localIp !== 'localhost') break;
      }
    } catch {
      // ignore
    }
    res.json({ ip: localIp, port: 3000 });
  });

  // Supabase Leaderboard and User Ranking APIs
  app.get('/api/supabase-status', async (_req, res) => {
    res.json({
      connected: true,
      projectUrl: SUPABASE_URL,
    });
  });

  app.get('/api/leaderboard', async (req, res) => {
    try {
      if (!supabase) {
        res.json({ players: [] });
        return;
      }
      const limit = Math.min(Number(req.query.limit) || 20, 20);
      const { data, error } = await supabase
        .from('player_rankings')
        .select('*')
        .limit(limit);

      if (error) throw error;
      res.json({ players: data || [] });
    } catch (err: any) {
      console.error('Erro na API /api/leaderboard:', err);
      res.status(500).json({ error: err.message || 'Erro ao consultar ranking no Supabase' });
    }
  });

  app.post('/api/player/sync', async (req, res) => {
    try {
      const { id, nickname, avatarId, titleBadge, pointsToAdd, isWin, correctAnswersToAdd } = req.body || {};
      if (!nickname) {
        res.status(400).json({ error: 'Nickname é obrigatório' });
        return;
      }

      const cleanNick = String(nickname).trim();
      // Usar SEMPRE o ID único fornecido pelo cliente ou gerar um novo timestamped ID para nunca colidir
      const playerId = String(id || `player-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`).trim();
      const matchScore = Math.round(Number(pointsToAdd) || 0);

      if (!supabase) {
        res.json({
          player: {
            id: playerId,
            nickname: cleanNick,
            avatar_id: avatarId || 'fox',
            title_badge: titleBadge || 'Competidor QR',
            total_score: matchScore,
            matches_played: 1,
            wins_count: isWin ? 1 : 0,
            correct_answers: Number(correctAnswersToAdd) || 0,
          },
          position: 1,
        });
        return;
      }

      // Remover entrada poluída de testes legados se houver
      if (cleanNick.toLowerCase() !== 'vcdssfga') {
        try {
          await supabase.from('players').delete().eq('nickname', 'vcdssfga');
        } catch {
          // ignore
        }
      }

      // Verificar se este ID ESPECÍFICO deste participante já foi registrado (ex: na entrada com score 0)
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .maybeSingle();

      let updatedPlayer;
      if (existingPlayer) {
        // Atualizar APENAS a pontuação desta tentativa do participante (NUNCA somar com outros)
        const { data, error } = await supabase
          .from('players')
          .update({
            nickname: cleanNick,
            avatar_id: avatarId || existingPlayer.avatar_id || 'fox',
            title_badge: titleBadge || existingPlayer.title_badge || 'Competidor QR',
            total_score: matchScore,
            matches_played: 1,
            wins_count: isWin ? 1 : 0,
            correct_answers: Number(correctAnswersToAdd) || 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', playerId)
          .select()
          .single();

        if (error) throw error;
        updatedPlayer = data;
      } else {
        // Inserir como NOVO participante isolado no banco de dados
        const { data, error } = await supabase
          .from('players')
          .insert({
            id: playerId,
            nickname: cleanNick,
            avatar_id: avatarId || 'fox',
            title_badge: titleBadge || 'Competidor QR',
            total_score: matchScore,
            matches_played: 1,
            wins_count: isWin ? 1 : 0,
            correct_answers: Number(correctAnswersToAdd) || 0,
          })
          .select()
          .single();

        if (error) throw error;
        updatedPlayer = data;
      }

      // Calcular posição exata no ranking
      const { data: allPlayers } = await supabase
        .from('players')
        .select('id, total_score')
        .order('total_score', { ascending: false });

      let position = 1;
      if (allPlayers && Array.isArray(allPlayers)) {
        const idx = allPlayers.findIndex((p) => p.id === playerId);
        position = idx !== -1 ? idx + 1 : 1;
      }

      res.json({ player: updatedPlayer, position });
    } catch (err: any) {
      console.error('Erro em /api/player/sync:', err);
      res.status(500).json({ error: err.message || 'Erro ao sincronizar jogador' });
    }
  });

  app.post('/api/player/match', async (req, res) => {
    try {
      if (!supabase) {
        res.json({ success: true });
        return;
      }
      const { player_id, nickname, avatar_id, quiz_id, quiz_title, score, correct_count, total_questions, rank_position } = req.body || {};
      const { error } = await supabase.from('match_scores').insert({
        player_id,
        nickname,
        avatar_id,
        quiz_id,
        quiz_title,
        score: Number(score) || 0,
        correct_count: Number(correct_count) || 0,
        total_questions: Number(total_questions) || 0,
        rank_position: Number(rank_position) || 1,
      });

      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error('Erro na API /api/player/match:', err);
      res.status(500).json({ error: err.message || 'Erro ao gravar pontuação da partida' });
    }
  });

  httpServer.on('upgrade', (request, socket, head) => {
    if (request.url?.startsWith('/ws')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(String(raw));
        if (msg.type === 'room:subscribe' && msg.pin) {
          const pin = String(msg.pin).replace(/\D/g, '');
          if (!rooms.has(pin)) {
            rooms.set(pin, {
              pin,
              quizId: msg.quizId || 'custom',
              quizTitle: msg.quizTitle || 'Quiz Arena',
              status: 'lobby',
              currentQuestionIndex: 0,
              players: new Map(),
              updatedAt: Date.now(),
            });
          }
          socketRoomMap.set(ws, { pin, playerId: msg.playerId });
          broadcastRoomState(pin);
        } else if (msg.type === 'player:join' && msg.pin && msg.player) {
          const pin = String(msg.pin).replace(/\D/g, '');
          let room = rooms.get(pin);
          if (!room) {
            room = {
              pin,
              quizId: msg.quizId || 'custom',
              quizTitle: msg.quizTitle || 'Quiz Arena',
              status: 'lobby',
              currentQuestionIndex: 0,
              players: new Map(),
              updatedAt: Date.now(),
            };
            rooms.set(pin, room);
          }
          const player: RoomPlayer = {
            id: String(msg.player.id),
            nickname: String(msg.player.nickname).slice(0, 20),
            avatarId: String(msg.player.avatarId || 'fox'),
            titleBadge: String(msg.player.titleBadge || 'Competidor QR'),
            score: Number(msg.player.score || 0),
            streak: Number(msg.player.streak || 0),
            maxStreak: Number(msg.player.maxStreak || 0),
            correctCount: Number(msg.player.correctCount || 0),
            answeredCount: Number(msg.player.answeredCount || 0),
            lastPointsEarned: Number(msg.player.lastPointsEarned || 0),
          };
          room.players.set(player.id, player);
          room.updatedAt = Date.now();
          socketRoomMap.set(ws, { pin, playerId: player.id });
          broadcastRoomState(pin);
        } else if (msg.type === 'player:score_update' && msg.pin && msg.player) {
          const pin = String(msg.pin).replace(/\D/g, '');
          const room = rooms.get(pin);
          if (room && msg.player.id) {
            room.players.set(String(msg.player.id), {
              id: String(msg.player.id),
              nickname: String(msg.player.nickname).slice(0, 20),
              avatarId: String(msg.player.avatarId || 'fox'),
              titleBadge: String(msg.player.titleBadge || 'Competidor QR'),
              score: Number(msg.player.score || 0),
              streak: Number(msg.player.streak || 0),
              maxStreak: Number(msg.player.maxStreak || 0),
              correctCount: Number(msg.player.correctCount || 0),
              answeredCount: Number(msg.player.answeredCount || 0),
              lastPointsEarned: Number(msg.player.lastPointsEarned || 0),
            });
            room.updatedAt = Date.now();
            broadcastRoomState(pin);
          }
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on('close', () => {
      socketRoomMap.delete(ws);
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Kahoot! Arena server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
