import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateKahootScore,
  validateNickname,
  parseQrOrPinInput,
  getFiftyFiftyHiddenOptionIds,
  rankParticipants,
  evaluateMatchGamification,
  type QuizDeck,
  type PlayerParticipant,
} from './rules';

test('calculateKahootScore awards full basePoints for instant correct answer and increments streak', () => {
  const res = calculateKahootScore({
    isCorrect: true,
    basePoints: 1000,
    timeRemainingMs: 19800,
    totalTimeMs: 20000,
    currentStreak: 0,
  });
  assert.equal(res.totalPoints, 1000);
  assert.equal(res.newStreak, 1);
  assert.equal(res.streakBonus, 0);
});

test('calculateKahootScore applies speed decay, streak bonus, and 2x power-up multiplier', () => {
  const res = calculateKahootScore({
    isCorrect: true,
    basePoints: 1000,
    timeRemainingMs: 10000, // 50% time remaining -> 750 speed points
    totalTimeMs: 20000,
    currentStreak: 2, // becomes streak 3 -> +200 streak bonus
    doublePointsActive: true,
  });
  assert.equal(res.newStreak, 3);
  assert.equal(res.speedPoints, 1500);
  assert.equal(res.streakBonus, 400);
  assert.equal(res.totalPoints, 1900);
});

test('calculateKahootScore resets streak on wrong answer unless streakShieldActive is true', () => {
  const withoutShield = calculateKahootScore({
    isCorrect: false,
    basePoints: 1000,
    timeRemainingMs: 12000,
    totalTimeMs: 20000,
    currentStreak: 4,
    streakShieldActive: false,
  });
  assert.equal(withoutShield.totalPoints, 0);
  assert.equal(withoutShield.newStreak, 0);
  assert.equal(withoutShield.shieldConsumed, false);

  const withShield = calculateKahootScore({
    isCorrect: false,
    basePoints: 1000,
    timeRemainingMs: 12000,
    totalTimeMs: 20000,
    currentStreak: 4,
    streakShieldActive: true,
  });
  assert.equal(withShield.totalPoints, 0);
  assert.equal(withShield.newStreak, 4);
  assert.equal(withShield.shieldConsumed, true);
});

test('validateNickname rejects empty or 1-char nicknames and trims valid ones', () => {
  assert.equal(validateNickname('   ').valid, false);
  assert.equal(validateNickname('A').valid, false);

  const ok = validateNickname('  Relampago Azul  ');
  assert.equal(ok.valid, true);
  assert.equal(ok.cleaned, 'Relampago Azul');
});

test('parseQrOrPinInput resolves both QR URLs and formatted 6-digit PINs', () => {
  const sampleDecks: QuizDeck[] = [
    {
      id: 'quiz-pop-science',
      pin: '482910',
      title: 'Ciência & Curiosidades',
      description: 'Teste',
      category: 'Ciência',
      difficulty: 'Médio',
      playsCount: 120,
      questions: [],
    },
  ];

  const fromQrUrl = parseQrOrPinInput(
    'https://kahoot.arena/?pin=482910&quiz=quiz-pop-science',
    sampleDecks
  );
  assert.equal(fromQrUrl.valid, true);
  assert.equal(fromQrUrl.pin, '482910');

  const fromFormattedPin = parseQrOrPinInput('482 910', sampleDecks);
  assert.equal(fromFormattedPin.valid, true);
  assert.equal(fromFormattedPin.deck?.id, 'quiz-pop-science');

  const invalidPin = parseQrOrPinInput('999999', sampleDecks);
  assert.equal(invalidPin.valid, false);
});

test('getFiftyFiftyHiddenOptionIds removes exactly two wrong options', () => {
  const hidden = getFiftyFiftyHiddenOptionIds(
    [
      { id: 'o1', text: 'A', shape: 'triangle', color: 'red' },
      { id: 'o2', text: 'B', shape: 'diamond', color: 'blue' },
      { id: 'o3', text: 'C', shape: 'circle', color: 'amber' },
      { id: 'o4', text: 'D', shape: 'square', color: 'green' },
    ],
    'o2'
  );
  assert.equal(hidden.length, 2);
  assert.equal(hidden.includes('o2'), false);
});

test('rankParticipants orders players by score and updates ranks', () => {
  const players: PlayerParticipant[] = [
    {
      id: 'p1',
      nickname: 'Ana',
      avatarId: 'fox',
      titleBadge: 'Iniciante',
      score: 1200,
      streak: 1,
      maxStreak: 1,
      correctCount: 1,
      answeredCount: 2,
      lastPointsEarned: 600,
      previousRank: 1,
      currentRank: 1,
      isLocalPlayer: false,
    },
    {
      id: 'p2',
      nickname: 'Carlos',
      avatarId: 'robot',
      titleBadge: 'Mestre',
      score: 2450,
      streak: 2,
      maxStreak: 2,
      correctCount: 2,
      answeredCount: 2,
      lastPointsEarned: 1250,
      previousRank: 2,
      currentRank: 2,
      isLocalPlayer: true,
    },
  ];

  const ranked = rankParticipants(players);
  assert.equal(ranked[0].nickname, 'Carlos');
  assert.equal(ranked[0].currentRank, 1);
  assert.equal(ranked[0].previousRank, 2);
  assert.equal(ranked[1].nickname, 'Ana');
  assert.equal(ranked[1].currentRank, 2);
});

test('evaluateMatchGamification awards badges for 1st place, streak >= 3, and 100% accuracy', () => {
  const result = evaluateMatchGamification(
    {
      id: 'local',
      nickname: 'MestreQR',
      avatarId: 'dragon',
      titleBadge: 'Lenda',
      score: 6400,
      streak: 6,
      maxStreak: 6,
      correctCount: 6,
      answeredCount: 6,
      lastPointsEarned: 1200,
      previousRank: 1,
      currentRank: 1,
      isLocalPlayer: true,
    },
    6
  );

  assert.equal(result.accuracyPercent, 100);
  assert.equal(result.badgesUnlocked.length, 4);
});
