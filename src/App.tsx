import React, { useEffect, useState, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { AnimatePresence } from 'motion/react';
import {
  calculateKahootScore,
  getFiftyFiftyHiddenOptionIds,
  PlayerParticipant,
  PowerUpType,
  QuizDeck,
  rankParticipants,
  ScoreCalculationResult,
} from './game/rules';
import { INITIAL_QUIZ_DECKS, RIVAL_BOTS } from './game/quizzes';
import { soundEngine } from './game/sound';
import { SplashScreen } from './components/SplashScreen';
import { QrHomeLobby } from './components/QrHomeLobby';
import { QrScannerModal } from './components/QrScannerModal';
import { NicknameScreen } from './components/NicknameScreen';
import { QuizGameplayScreen } from './components/QuizGameplayScreen';
import { PodiumModal } from './components/PodiumModal';
import { QuizCreatorModal } from './components/QuizCreatorModal';
import { HostPresenterModal } from './components/HostPresenterModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { syncPlayerProfile, syncMatchParticipants, saveMatchScore, registerPlayerEntry } from './lib/supabase';

type AppFlowState = 'title' | 'nickname' | 'playing' | 'paused' | 'gameover';

export default function App() {
  const [decks, setDecks] = useState<QuizDeck[]>(INITIAL_QUIZ_DECKS);
  const [selectedDeck, setSelectedDeck] = useState<QuizDeck>(INITIAL_QUIZ_DECKS[0]);
  const [flowState, setFlowState] = useState<AppFlowState>('title');
  const [scannedPlayerCode, setScannedPlayerCode] = useState<string>('');
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return !params.get('pin') && !params.get('quiz') && !params.get('autostart') && !params.get('nosplash');
  });

  // Modals on the Title/Lobby screen
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [globalRankPosition, setGlobalRankPosition] = useState<number | undefined>(undefined);

  // Player Profile & Gamification Career
  const [playerNickname, setPlayerNickname] = useState('');
  const [playerAvatarId, setPlayerAvatarId] = useState('fox');
  const [playerTitleBadge, setPlayerTitleBadge] = useState('Velocista QR');
  const [careerXp, setCareerXp] = useState(350);
  const [careerMatches, setCareerMatches] = useState(2);

  // Active Match State
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeRemainingMs, setTimeRemainingMs] = useState(20000);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [roundResult, setRoundResult] = useState<ScoreCalculationResult | null>(null);
  const [participants, setParticipants] = useState<PlayerParticipant[]>([]);
  const [answerHistory, setAnswerHistory] = useState<
    {
      questionId: string;
      questionText: string;
      chosenText: string;
      correctText: string;
      isCorrect: boolean;
      pointsEarned: number;
    }[]
  >([]);

  // Power-Ups State
  const [usedPowerUps, setUsedPowerUps] = useState<Record<PowerUpType, boolean>>({
    double_points: false,
    fifty_fifty: false,
    freeze_time: false,
    streak_shield: false,
  });
  const [activeDoublePoints, setActiveDoublePoints] = useState(false);
  const [activeStreakShield, setActiveStreakShield] = useState(false);
  const [hiddenOptionIds, setHiddenOptionIds] = useState<string[]>([]);
  const [timeFrozen, setTimeFrozen] = useState(false);
  const [muted, setMuted] = useState(false);

  // WebSocket reference for real-time room sync
  const wsRef = useRef<WebSocket | null>(null);
  const localPlayerIdRef = useRef<string>(`player-${Math.random().toString(36).slice(2, 9)}`);
  const [networkOrigin, setNetworkOrigin] = useState<string>(() => window.location.origin);

  useEffect(() => {
    // If accessing from localhost/127.0.0.1, query server for local Wi-Fi IP so phones can connect via QR code
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      fetch('/api/network-ip')
        .then((r) => r.json())
        .then((data) => {
          if (data && data.ip && data.ip !== 'localhost' && data.ip !== '127.0.0.1') {
            setNetworkOrigin(`http://${data.ip}:${data.port || 3000}`);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Sync document.body.dataset.state with Game State Machine
  useEffect(() => {
    const mappedState =
      flowState === 'nickname' ? 'title' : flowState;
    document.body.dataset.state = mappedState;
  }, [flowState]);

  // Build initial participants list (local player + competitive rivals)
  const buildInitialParticipants = useCallback(
    (nick: string, avId: string, badge: string, customId?: string): PlayerParticipant[] => {
      const cleanNick = (nick || 'JogadorQR').trim();
      const playerId = customId || `player-${Math.floor(1000 + Math.random() * 9000)}`;
      localPlayerIdRef.current = playerId;

      const local: PlayerParticipant = {
        id: playerId,
        nickname: cleanNick,
        avatarId: avId,
        titleBadge: badge,
        score: 0,
        streak: 0,
        maxStreak: 0,
        correctCount: 0,
        answeredCount: 0,
        lastPointsEarned: 0,
        previousRank: 1,
        currentRank: 1,
        isLocalPlayer: true,
      };

      const bots: PlayerParticipant[] = RIVAL_BOTS.map((b, idx) => ({
        id: b.id,
        nickname: b.nickname,
        avatarId: b.avatarId,
        titleBadge: b.titleBadge,
        score: 0,
        streak: 0,
        maxStreak: 0,
        correctCount: 0,
        answeredCount: 0,
        lastPointsEarned: 0,
        previousRank: idx + 2,
        currentRank: idx + 2,
        isLocalPlayer: false,
        isBot: true,
      }));

      return [local, ...bots];
    },
    []
  );

  // Connect WebSocket for live multi-tab / multi-device room synchronization
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const envWs = (import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || '').trim();
    let wsUrl = `${protocol}//${window.location.host}/ws`;
    if (envWs) {
      const clean = envWs.replace(/^http/, 'ws').replace(/\/$/, '');
      wsUrl = clean.endsWith('/ws') ? clean : `${clean}/ws`;
    }
    let socket: WebSocket | null = null;

    try {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        socket?.send(
          JSON.stringify({
            type: 'room:subscribe',
            pin: selectedDeck.pin,
            quizId: selectedDeck.id,
            quizTitle: selectedDeck.title,
            playerId: localPlayerIdRef.current,
          })
        );
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'room:state' && data.room?.players) {
            const remotePlayers = data.room.players as Array<{
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
            }>;

            setParticipants((prev) => {
              if (prev.length === 0) return prev;
              const byId = new Map<string, PlayerParticipant>();
              for (const p of prev) {
                byId.set(p.id, p);
              }
              for (const rp of remotePlayers) {
                if (rp.id !== localPlayerIdRef.current) {
                  byId.set(rp.id, {
                    ...rp,
                    previousRank: byId.get(rp.id)?.currentRank || 1,
                    currentRank: 1,
                    isLocalPlayer: false,
                    isBot: false,
                  });
                }
              }
              return rankParticipants(Array.from(byId.values()));
            });
          }
        } catch {
          // Ignore malformed WS payloads
        }
      };
    } catch {
      // Offline / local fallback works seamlessly
    }

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [selectedDeck.pin, selectedDeck.id, selectedDeck.title]);

  // Support ?autostart=1 and ?pin=XXXXXX URL parameters (e.g. when scanning QR code on phone)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pinParam = params.get('pin');
    const quizParam = params.get('quiz');
    const autostart = params.get('autostart');

    let targetDeck = selectedDeck;
    if (quizParam) {
      const found = decks.find((d) => d.id === quizParam);
      if (found) {
        targetDeck = found;
        setSelectedDeck(found);
      }
    } else if (pinParam) {
      const found = decks.find((d) => d.pin === pinParam.replace(/\D/g, ''));
      if (found) {
        targetDeck = found;
        setSelectedDeck(found);
      }
    }

    const codeParam = params.get('code') || params.get('playerCode');
    if (codeParam) {
      setScannedPlayerCode(codeParam.trim());
    }

    if (autostart === '1') {
      const defaultNick = 'JogadorQR';
      setPlayerNickname(defaultNick);
      startQuizSession(targetDeck, defaultNick, 'fox', 'Velocista QR', codeParam || undefined);
    } else if (pinParam || quizParam) {
      // Scanned QR URL -> take player straight to Nickname Input screen!
      setFlowState('nickname');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startQuizSession = useCallback(
    (deck: QuizDeck, nickname: string, avatarId: string, titleBadge: string, code?: string) => {
      const playerCode = code || Math.floor(1000 + Math.random() * 9000).toString();
      const cleanNick = (nickname || 'Jogador QR').trim().replace(/\s*#\d+$/, '');
      const fullNickname = `${cleanNick} #${playerCode}`;
      const playerId = `player-${playerCode}`;
      localPlayerIdRef.current = playerId;

      // REGISTRAR IMEDIATAMENTE NO BANCO SUPABASE PARA APARECER NO PAINEL NA HORA
      registerPlayerEntry({
        id: playerId,
        nickname: fullNickname,
        avatarId,
        titleBadge,
      }).catch((err) => {
        console.warn('Erro ao registrar entrada no Supabase:', err);
      });

      const firstQ = deck.questions[0];
      const initialList = buildInitialParticipants(fullNickname, avatarId, titleBadge, playerId);

      setSelectedDeck(deck);
      setPlayerNickname(fullNickname);
      setPlayerAvatarId(avatarId);
      setPlayerTitleBadge(titleBadge);
      setParticipants(initialList);
      setQuestionIndex(0);
      setTimeRemainingMs((firstQ?.timeLimit || 20) * 1000);
      setSelectedOptionId(null);
      setRoundResult(null);
      setAnswerHistory([]);
      setUsedPowerUps({
        double_points: false,
        fifty_fifty: false,
        freeze_time: false,
        streak_shield: false,
      });
      setActiveDoublePoints(false);
      setActiveStreakShield(false);
      setHiddenOptionIds([]);
      setTimeFrozen(false);
      setFlowState('playing');

      // Broadcast join over WebSocket if open
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'player:join',
            pin: deck.pin,
            quizId: deck.id,
            quizTitle: deck.title,
            player: {
              id: localPlayerIdRef.current,
              nickname,
              avatarId,
              titleBadge,
              score: 0,
              streak: 0,
              maxStreak: 0,
              correctCount: 0,
              answeredCount: 0,
              lastPointsEarned: 0,
            },
          })
        );
      }
    },
    [buildInitialParticipants]
  );

  const handleSelectOption = useCallback(
    (optionId: string) => {
      if (flowState !== 'playing' || selectedOptionId !== null) return;
      const currentQ = selectedDeck.questions[questionIndex];
      if (!currentQ) return;

      const isCorrect = optionId === currentQ.correctOptionId;
      const localP =
        participants.find((p) => p.isLocalPlayer) ||
        buildInitialParticipants(playerNickname, playerAvatarId, playerTitleBadge)[0];

      const calc = calculateKahootScore({
        isCorrect,
        basePoints: currentQ.basePoints,
        timeRemainingMs,
        totalTimeMs: currentQ.timeLimit * 1000,
        currentStreak: localP.streak,
        doublePointsActive: activeDoublePoints,
        streakShieldActive: activeStreakShield,
      });

      if (isCorrect) {
        soundEngine.playCorrect(calc.newStreak);
      } else {
        soundEngine.playWrong();
      }

      setSelectedOptionId(optionId);
      setRoundResult(calc);

      // Update local player + competitive arena rivals for this round
      const updatedParticipants = participants.map((p) => {
        if (p.isLocalPlayer) {
          const newScore = p.score + calc.totalPoints;
          const newMaxStreak = Math.max(p.maxStreak, calc.newStreak);
          const updatedLocal: PlayerParticipant = {
            ...p,
            score: newScore,
            streak: calc.newStreak,
            maxStreak: newMaxStreak,
            correctCount: p.correctCount + (isCorrect ? 1 : 0),
            answeredCount: p.answeredCount + 1,
            lastPointsEarned: calc.totalPoints,
          };

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'player:score_update',
                pin: selectedDeck.pin,
                player: updatedLocal,
              })
            );
          }
          return updatedLocal;
        }

        if (p.isBot) {
          const botIdx = RIVAL_BOTS.findIndex((b) => b.id === p.id);
          const botMeta = RIVAL_BOTS[botIdx];
          const skill = botMeta?.skill ?? 0.75;
          // Distinct per-bot roll across rounds so bots compete realistically
          const roll = ((questionIndex + 1) * 41 + (botIdx + 1) * 23) % 100;
          const botCorrect = roll < skill * 100;
          const botSpeedFactor = 0.68 + (((botIdx + questionIndex) * 7) % 24) / 100;
          const botEarned = botCorrect
            ? Math.round(currentQ.basePoints * botSpeedFactor) + p.streak * 100
            : 0;
          const botNewStreak = botCorrect ? p.streak + 1 : 0;

          return {
            ...p,
            score: p.score + botEarned,
            streak: botNewStreak,
            maxStreak: Math.max(p.maxStreak, botNewStreak),
            correctCount: p.correctCount + (botCorrect ? 1 : 0),
            answeredCount: p.answeredCount + 1,
            lastPointsEarned: botEarned,
          };
        }

        return p;
      });

      setParticipants(rankParticipants(updatedParticipants));

      const chosenOpt = currentQ.options.find((o) => o.id === optionId);
      const correctOpt = currentQ.options.find((o) => o.id === currentQ.correctOptionId);

      setAnswerHistory((prev) => [
        ...prev,
        {
          questionId: currentQ.id,
          questionText: currentQ.question,
          chosenText:
            optionId === '__TIMEOUT__'
              ? 'Tempo Esgotado'
              : chosenOpt?.text || 'Alternativa',
          correctText: correctOpt?.text || '',
          isCorrect,
          pointsEarned: calc.totalPoints,
        },
      ]);
    },
    [
      flowState,
      selectedOptionId,
      selectedDeck,
      questionIndex,
      participants,
      buildInitialParticipants,
      playerNickname,
      playerAvatarId,
      playerTitleBadge,
      timeRemainingMs,
      activeDoublePoints,
      activeStreakShield,
    ]
  );

  // Question Countdown Timer
  useEffect(() => {
    if (flowState !== 'playing' || selectedOptionId !== null || timeFrozen) return;

    const interval = window.setInterval(() => {
      setTimeRemainingMs((prev) => {
        if (prev <= 250) {
          window.clearInterval(interval);
          return 0;
        }
        const next = prev - 250;
        if (next % 1000 === 0 && next <= 5000) {
          soundEngine.playTick(true);
        }
        return next;
      });
    }, 250);

    return () => window.clearInterval(interval);
  }, [flowState, selectedOptionId, timeFrozen]);

  // Trigger timeout answer if timer reaches 0
  useEffect(() => {
    if (flowState === 'playing' && selectedOptionId === null && timeRemainingMs <= 0) {
      handleSelectOption('__TIMEOUT__');
    }
  }, [flowState, selectedOptionId, timeRemainingMs, handleSelectOption]);

  const handleNextQuestion = useCallback(() => {
    const nextIdx = questionIndex + 1;
    if (nextIdx < selectedDeck.questions.length) {
      const nextQ = selectedDeck.questions[nextIdx];
      setQuestionIndex(nextIdx);
      setTimeRemainingMs(nextQ.timeLimit * 1000);
      setSelectedOptionId(null);
      setRoundResult(null);
      setActiveDoublePoints(false);
      setActiveStreakShield(false);
      setHiddenOptionIds([]);
      setTimeFrozen(false);
    } else {
      // Finished all questions -> Podium!
      soundEngine.playPodiumFanfare();
      const localP = participants.find((p) => p.isLocalPlayer);
      if (localP) {
        setCareerXp((xp) => xp + Math.round(localP.score / 10) + localP.correctCount * 50);
        setCareerMatches((m) => m + 1);

        // Sincronizar todos os participantes da partida para que o pódio e o ranking fiquem 100% alinhados
        syncMatchParticipants(participants)
          .then((pos) => {
            setGlobalRankPosition(pos);
          })
          .catch(() => {
            setGlobalRankPosition(localP.currentRank);
          });

        const isWin = localP.currentRank === 1;
        syncPlayerProfile({
          id: localP.id,
          nickname: localP.nickname,
          avatarId: localP.avatarId,
          titleBadge: localP.titleBadge,
          pointsToAdd: Math.round(localP.score),
          isWin,
          correctAnswersToAdd: localP.correctCount,
        }).catch((err) => {
          console.warn('Erro ao atualizar ranking no Supabase:', err);
        });

        saveMatchScore({
          player_id: localP.id,
          nickname: localP.nickname,
          avatar_id: localP.avatarId,
          quiz_id: selectedDeck.id,
          quiz_title: selectedDeck.title,
          score: Math.round(localP.score),
          correct_count: localP.correctCount,
          total_questions: selectedDeck.questions.length,
          rank_position: localP.currentRank,
        }).catch(() => {});
      }
      setFlowState('gameover');
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore confetti errors in headless environments
      }
    }
  }, [questionIndex, selectedDeck, participants]);

  const handleActivatePowerUp = useCallback(
    (type: PowerUpType) => {
      if (flowState !== 'playing' || selectedOptionId !== null || usedPowerUps[type]) return;
      const currentQ = selectedDeck.questions[questionIndex];
      if (!currentQ) return;

      soundEngine.playPowerUp();
      setUsedPowerUps((prev) => ({ ...prev, [type]: true }));

      if (type === 'double_points') {
        setActiveDoublePoints(true);
      } else if (type === 'fifty_fifty') {
        const hidden = getFiftyFiftyHiddenOptionIds(
          currentQ.options,
          currentQ.correctOptionId
        );
        setHiddenOptionIds(hidden);
      } else if (type === 'freeze_time') {
        setTimeFrozen(true);
      } else if (type === 'streak_shield') {
        setActiveStreakShield(true);
      }
    },
    [flowState, selectedOptionId, usedPowerUps, selectedDeck.questions, questionIndex]
  );

  // Global Keyboard Shortcuts (Enter/Space on Title, 1-4 for options, Q/W/E/S for power-ups, P/Esc for Pause, M for Mute)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (flowState === 'title' && !isScannerModalOpen && !isCreatorModalOpen && !isHostModalOpen) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          soundEngine.playQrScanSuccess();
          setFlowState('nickname');
        }
        return;
      }

      if (flowState === 'playing') {
        if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
          e.preventDefault();
          setFlowState('paused');
          return;
        }
        if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          setMuted((m) => {
            soundEngine.muted = !m;
            return !m;
          });
          return;
        }
        if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          startQuizSession(selectedDeck, playerNickname, playerAvatarId, playerTitleBadge);
          return;
        }

        const currentQ = selectedDeck.questions[questionIndex];
        if (!currentQ) return;

        if (selectedOptionId === null) {
          if (['1', '2', '3', '4'].includes(e.key)) {
            const idx = Number(e.key) - 1;
            const opt = currentQ.options[idx];
            if (opt && !hiddenOptionIds.includes(opt.id)) {
              e.preventDefault();
              handleSelectOption(opt.id);
            }
          } else if (e.key.toLowerCase() === 'q') {
            handleActivatePowerUp('double_points');
          } else if (e.key.toLowerCase() === 'w') {
            handleActivatePowerUp('fifty_fifty');
          } else if (e.key.toLowerCase() === 'e') {
            handleActivatePowerUp('freeze_time');
          } else if (e.key.toLowerCase() === 's') {
            handleActivatePowerUp('streak_shield');
          }
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNextQuestion();
        }
      } else if (flowState === 'paused') {
        if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
          e.preventDefault();
          setFlowState('playing');
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    flowState,
    isScannerModalOpen,
    isCreatorModalOpen,
    isHostModalOpen,
    selectedDeck,
    questionIndex,
    selectedOptionId,
    hiddenOptionIds,
    playerNickname,
    playerAvatarId,
    playerTitleBadge,
    startQuizSession,
    handleSelectOption,
    handleActivatePowerUp,
    handleNextQuestion,
  ]);

  const joinUrl = `${networkOrigin}/?pin=${selectedDeck.pin}&quiz=${selectedDeck.id}`;
  const currentQuestion =
    selectedDeck.questions[questionIndex] || selectedDeck.questions[0];
  const localPlayer =
    participants.find((p) => p.isLocalPlayer) ||
    buildInitialParticipants(playerNickname, playerAvatarId, playerTitleBadge)[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* 1. INITIAL SCREEN: SPLASH SCREEN -> QR CODE ACCESS */}
      {flowState === 'title' && (
        <>
          <AnimatePresence mode="wait">
            {showSplash ? (
              <SplashScreen
                key="splash"
                quizTitle={selectedDeck.title}
                pin={selectedDeck.pin}
                onComplete={() => setShowSplash(false)}
              />
            ) : (
              <QrHomeLobby
                key="qr-lobby"
                decks={decks}
                selectedDeck={selectedDeck}
                joinUrl={joinUrl}
                careerXp={careerXp}
                careerMatches={careerMatches}
                onSelectDeck={(deck) => setSelectedDeck(deck)}
                onDirectQrReadToNickname={(deck, code) => {
                  setSelectedDeck(deck);
                  if (code) setScannedPlayerCode(code);
                  soundEngine.playQrScanSuccess();
                  setFlowState('nickname');
                }}
                onOpenCameraScanner={() => setIsScannerModalOpen(true)}
                onOpenQuizCreator={() => setIsCreatorModalOpen(true)}
                onOpenHostPresenter={() => setIsHostModalOpen(true)}
                onAwardWarmupXp={(pts) => setCareerXp((x) => x + pts)}
                onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
              />
            )}
          </AnimatePresence>

          <QrScannerModal
            isOpen={isScannerModalOpen}
            quiz={selectedDeck}
            joinUrl={joinUrl}
            onClose={() => setIsScannerModalOpen(false)}
            onScanComplete={(deck) => {
              setIsScannerModalOpen(false);
              setSelectedDeck(deck);
              soundEngine.playQrScanSuccess();
              setFlowState('nickname');
            }}
          />

          <QuizCreatorModal
            isOpen={isCreatorModalOpen}
            onClose={() => setIsCreatorModalOpen(false)}
            onSaveDeck={(newDeck) => {
              setDecks((prev) => [newDeck, ...prev]);
              setSelectedDeck(newDeck);
            }}
          />

          <HostPresenterModal
            isOpen={isHostModalOpen}
            quiz={selectedDeck}
            joinUrl={joinUrl}
            participants={
              participants.length > 0
                ? participants
                : buildInitialParticipants('Apresentador', 'crown', 'Host da Sala')
            }
            onClose={() => setIsHostModalOpen(false)}
            onScanFromTv={() => {
              setIsHostModalOpen(false);
              soundEngine.playQrScanSuccess();
              setFlowState('nickname');
            }}
          />
        </>
      )}

      {/* 2. STEP 2 AFTER READING QR CODE: NICKNAME & AVATAR REGISTRATION */}
      {flowState === 'nickname' && (
        <NicknameScreen
          quiz={selectedDeck}
          initialNickname={playerNickname}
          initialAvatarId={playerAvatarId}
          initialTitleBadge={playerTitleBadge}
          initialPlayerCode={scannedPlayerCode}
          connectedPlayersCount={RIVAL_BOTS.length + 1}
          onBackToHome={() => setFlowState('title')}
          onConfirmJoin={(nickname, avatarId, titleBadge, playerCode) => {
            soundEngine.playQrScanSuccess();
            startQuizSession(selectedDeck, nickname, avatarId, titleBadge, playerCode);
          }}
        />
      )}

      {/* 3. STEP 3 DIRECTED TO THE GAMIFIED QUIZ ARENA */}
      {(flowState === 'playing' || flowState === 'paused') && currentQuestion && (
        <>
          <QuizGameplayScreen
            quiz={selectedDeck}
            currentQuestion={currentQuestion}
            questionIndex={questionIndex}
            totalQuestions={selectedDeck.questions.length}
            timeRemainingMs={timeRemainingMs}
            totalTimeMs={currentQuestion.timeLimit * 1000}
            localPlayer={localPlayer}
            participants={participants}
            selectedOptionId={selectedOptionId}
            roundResult={roundResult}
            usedPowerUps={usedPowerUps}
            activeDoublePoints={activeDoublePoints}
            activeStreakShield={activeStreakShield}
            hiddenOptionIds={hiddenOptionIds}
            timeFrozen={timeFrozen}
            muted={muted}
            onSelectOption={handleSelectOption}
            onActivatePowerUp={handleActivatePowerUp}
            onNextQuestion={handleNextQuestion}
            onToggleMute={() => {
              setMuted((m) => {
                soundEngine.muted = !m;
                return !m;
              });
            }}
            onOpenPause={() => setFlowState('paused')}
            onRestartQuiz={() =>
              startQuizSession(
                selectedDeck,
                playerNickname,
                playerAvatarId,
                playerTitleBadge
              )
            }
          />

          {/* Pause Modal */}
          {flowState === 'paused' && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="pause-modal-title"
            >
              <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-center space-y-5">
                <h2 id="pause-modal-title" className="text-2xl font-extrabold font-display text-white">
                  Partida Pausada
                </h2>

                <div className="grid grid-cols-3 gap-3 font-mono-tabular">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">PONTOS</div>
                    <div className="text-lg font-extrabold text-emerald-400">
                      {Math.round(localPlayer.score)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">COMBO</div>
                    <div className="text-lg font-extrabold text-amber-400">
                      {localPlayer.streak}x
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">PERGUNTA</div>
                    <div className="text-lg font-extrabold text-white">
                      {questionIndex + 1}/{selectedDeck.questions.length}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setFlowState('playing')}
                    className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm cursor-pointer"
                  >
                    Continuar Quiz
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      startQuizSession(
                        selectedDeck,
                        playerNickname,
                        playerAvatarId,
                        playerTitleBadge
                      )
                    }
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
                  >
                    Reiniciar Partida
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlowState('title')}
                    className="w-full py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Voltar ao QR Code Inicial
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 4. FINAL PODIUM & GAMIFICATION RESULTS */}
      {flowState === 'gameover' && (
        <PodiumModal
          quiz={selectedDeck}
          localPlayer={localPlayer}
          participants={participants}
          answerHistory={answerHistory}
          globalPosition={globalRankPosition}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onPlayAgain={() => {
            const rawNick = playerNickname.replace(/\s*#\d+$/, '');
            startQuizSession(
              selectedDeck,
              rawNick,
              playerAvatarId,
              playerTitleBadge
            );
          }}
          onBackToQrLobby={() => setFlowState('title')}
        />
      )}

      {/* 5. LEADERBOARD & SUPABASE USER RANKINGS MODAL */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        localPlayerId={localPlayer.id}
        localPlayerNickname={playerNickname || 'Jogador QR'}
        localPlayerAvatarId={playerAvatarId}
      />
    </div>
  );
}
