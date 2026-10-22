export type PowerUpType = 'double_points' | 'fifty_fifty' | 'freeze_time' | 'streak_shield';

export interface QuizOption {
  id: string;
  text: string;
  shape: 'triangle' | 'diamond' | 'circle' | 'square';
  color: 'red' | 'blue' | 'amber' | 'green';
}

export interface QuizQuestion {
  id: string;
  question: string;
  timeLimit: number; // in seconds
  basePoints: number; // 1000 or 2000
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
  category?: string;
  illustrationType?: 'runner_hydration' | 'water_glass_scale' | 'tired_focus' | 'body_weight_scale';
}

export interface QuizDeck {
  id: string;
  pin: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Fácil' | 'Médio' | 'Desafiador';
  questions: QuizQuestion[];
  playsCount: number;
}

export interface PlayerParticipant {
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
  previousRank: number;
  currentRank: number;
  isLocalPlayer: boolean;
  isBot?: boolean;
}

export interface ScoreCalculationInput {
  isCorrect: boolean;
  basePoints: number;
  timeRemainingMs: number;
  totalTimeMs: number;
  currentStreak: number; // streak before this question
  doublePointsActive?: boolean;
  streakShieldActive?: boolean;
}

export interface ScoreCalculationResult {
  totalPoints: number;
  speedPoints: number;
  streakBonus: number;
  newStreak: number;
  shieldConsumed: boolean;
}

/**
 * Kahoot-authentic score calculation:
 * - Base score scales with response speed: Round( (1 - ((responseTime / totalTime) / 2)) * basePoints )
 * - If answered in the first 0.5 seconds, grants full basePoints.
 * - Streak bonus: +100 pts for 2 streak, +200 for 3, +300 for 4, capped at +500 pts for 6+ streak.
 * - Double points power-up multiplies (speedPoints + streakBonus) by 2.
 */
export function calculateKahootScore(input: ScoreCalculationInput): ScoreCalculationResult {
  const {
    isCorrect,
    basePoints,
    timeRemainingMs,
    totalTimeMs,
    currentStreak,
    doublePointsActive = false,
    streakShieldActive = false,
  } = input;

  if (!isCorrect) {
    if (streakShieldActive) {
      return {
        totalPoints: 0,
        speedPoints: 0,
        streakBonus: 0,
        newStreak: currentStreak,
        shieldConsumed: true,
      };
    }
    return {
      totalPoints: 0,
      speedPoints: 0,
      streakBonus: 0,
      newStreak: 0,
      shieldConsumed: false,
    };
  }

  const clampedTotal = Math.max(1000, totalTimeMs);
  const clampedRemaining = Math.max(0, Math.min(clampedTotal, timeRemainingMs));
  const elapsedMs = clampedTotal - clampedRemaining;

  // Kahoot formula: if answered within 500ms, full points; otherwise decays down to 50% of basePoints at 0s left
  const speedRatio = elapsedMs <= 500 ? 1 : 1 - (elapsedMs / clampedTotal) * 0.5;
  const rawSpeedPoints = Math.round(basePoints * Math.max(0.5, Math.min(1, speedRatio)));

  const newStreak = currentStreak + 1;
  // Streak bonus starts at 2 consecutive correct answers
  const streakStep = Math.max(0, Math.min(5, newStreak - 1));
  const streakBonus = streakStep * 100;

  const multiplier = doublePointsActive ? 2 : 1;
  const totalPoints = Math.round((rawSpeedPoints + streakBonus) * multiplier);

  return {
    totalPoints,
    speedPoints: rawSpeedPoints * multiplier,
    streakBonus: streakBonus * multiplier,
    newStreak,
    shieldConsumed: false,
  };
}

/**
 * Validates player nickname after scanning the QR code.
 * Must be 2 to 20 characters after trimming, no empty strings.
 */
export function validateNickname(rawNickname: string): {
  valid: boolean;
  cleaned: string;
  error?: string;
} {
  const cleaned = rawNickname.trim().replace(/\s+/g, ' ');
  if (!cleaned) {
    return {
      valid: false,
      cleaned: '',
      error: 'Por favor, digite seu apelido para entrar no quiz.',
    };
  }
  if (cleaned.length < 2) {
    return {
      valid: false,
      cleaned,
      error: 'O apelido precisa ter pelo menos 2 caracteres.',
    };
  }
  if (cleaned.length > 20) {
    return {
      valid: false,
      cleaned: cleaned.slice(0, 20),
      error: 'O apelido pode ter no máximo 20 caracteres.',
    };
  }
  return { valid: true, cleaned };
}

/**
 * Normalizes and validates a 6-digit Kahoot Game PIN or QR Code payload.
 */
export function parseQrOrPinInput(rawInput: string, availableDecks: QuizDeck[]): {
  valid: boolean;
  deck?: QuizDeck;
  pin?: string;
  error?: string;
} {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Informe o código PIN ou leia o QR Code válido.',
    };
  }

  // Check if input is a URL containing ?pin= or ?quiz=
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('?')) {
      const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://kahoot.arena/${trimmed}`);
      const pinParam = urlObj.searchParams.get('pin')?.replace(/\D/g, '');
      const quizParam = urlObj.searchParams.get('quiz');
      if (quizParam) {
        const byId = availableDecks.find((d) => d.id === quizParam);
        if (byId) return { valid: true, deck: byId, pin: byId.pin };
      }
      if (pinParam) {
        const byPin = availableDecks.find((d) => d.pin === pinParam);
        if (byPin) return { valid: true, deck: byPin, pin: byPin.pin };
      }
    }
  } catch {
    // Fall through to raw PIN parsing
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length === 6) {
    const matched = availableDecks.find((d) => d.pin === digitsOnly);
    if (matched) {
      return { valid: true, deck: matched, pin: matched.pin };
    }
    return {
      valid: false,
      pin: digitsOnly,
      error: `Nenhum quiz ativo encontrado para o PIN ${digitsOnly}.`,
    };
  }

  const matchedById = availableDecks.find((d) => d.id.toLowerCase() === trimmed.toLowerCase());
  if (matchedById) {
    return { valid: true, deck: matchedById, pin: matchedById.pin };
  }

  return {
    valid: false,
    error: 'Código QR ou PIN inválido. Use um PIN de 6 dígitos.',
  };
}

/**
 * Eliminates 2 wrong options for the 50/50 power-up deterministically.
 */
export function getFiftyFiftyHiddenOptionIds(
  options: QuizOption[],
  correctOptionId: string
): string[] {
  const wrongOptions = options.filter((o) => o.id !== correctOptionId);
  if (wrongOptions.length <= 1) return [];
  return wrongOptions.slice(0, 2).map((o) => o.id);
}

/**
 * Sorts participants by score descending, then maxStreak descending, and updates currentRank and previousRank.
 */
export function rankParticipants(participants: PlayerParticipant[]): PlayerParticipant[] {
  const sorted = [...participants].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    if (b.maxStreak !== a.maxStreak) return b.maxStreak - a.maxStreak;
    return a.isLocalPlayer ? -1 : 1;
  });

  return sorted.map((p, index) => ({
    ...p,
    previousRank: p.currentRank || index + 1,
    currentRank: index + 1,
  }));
}

/**
 * Calculates player XP, Level, and unlocked Achievement Badges after a match.
 */
export function evaluateMatchGamification(player: PlayerParticipant, totalQuestions: number): {
  xpEarned: number;
  accuracyPercent: number;
  badgesUnlocked: { id: string; title: string; description: string }[];
} {
  const safeTotal = Math.max(1, totalQuestions);
  const accuracyPercent = Math.round((player.correctCount / safeTotal) * 100);
  const xpEarned = Math.round(player.score / 10) + player.correctCount * 50 + player.maxStreak * 40;

  const badgesUnlocked: { id: string; title: string; description: string }[] = [
    {
      id: 'qr_explorer',
      title: 'Acesso Instantâneo QR',
      description: 'Entrou na arena escaneando o QR Code e registrando apelido.',
    },
  ];

  if (player.currentRank === 1) {
    badgesUnlocked.push({
      id: 'podium_gold',
      title: 'Campeão do Pódio',
      description: 'Conquistou o 1º lugar geral no Arena Quiz!',
    });
  } else if (player.currentRank <= 3) {
    badgesUnlocked.push({
      id: 'podium_top3',
      title: 'Elite do Pódio',
      description: 'Terminou entre os 3 melhores jogadores da partida.',
    });
  }

  if (player.maxStreak >= 3) {
    badgesUnlocked.push({
      id: 'streak_fire',
      title: 'Sequência em Chamas',
      description: `Acertou ${player.maxStreak} perguntas seguidas sem errar!`,
    });
  }

  if (accuracyPercent === 100) {
    badgesUnlocked.push({
      id: 'perfect_accuracy',
      title: 'Mente Implacável 100%',
      description: 'Gabaritou absolutamente todas as perguntas do quiz!',
    });
  }

  return {
    xpEarned,
    accuracyPercent,
    badgesUnlocked,
  };
}
