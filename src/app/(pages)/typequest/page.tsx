/* TODO git commit -m "finished type quest, will need to fix bug where setup component 
requires 2 clicks to properly render. Will add multiplayer, will add testing, will add more word questions. Will finish as
thetics." also make error rate on cpu leaderobard more realistic */

"use client"; // page renders client side Essential for user interaction
import React, { useEffect, useCallback, useRef } from "react";
import { useState } from "react";
import {
  GameState,
  GameStatus,
  GAME_CONFIG,
  QuestionResult,
  PlayerProgress,
  GameMode,
  GradeLevel,
} from "@/app/constants/index_typequest";
import {
  initializeGame,
  calculateQuestionPoints,
  initializeGameMultiplayer,
  loadGameState,
  saveGameState,
  checkAnswer,
  simulateCPUAnswer,
  clearGameState,
  createGameResult,
  createGameResultMultiplayer,
} from "@/lib/utils_typequest";
import TQ_SetupScreen from "@/app/components/TQ_SetupScreen";
import TQ_ActiveScreen from "@/app/components/TQ_ActiveScreen";
import TQ_FinishedScreen from "@/app/components/TQ_FinishedScreen";
import { flushSync } from "react-dom";
import { MultiplayerPlayer } from "@/lib/GlobalTypes";

const TypeQuestPage = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("setup");
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const [shouldPollOpponent, setShouldPollOpponent] = useState(false);
  const [opponentLeftGame, setOpponentLeftGame] = useState(false); // Track if opponent quit
  const cpuTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasResetRef = useRef(false); // Add this

  /* ****************************************************** */
  /* MULTIPLAYER VARIABLES */
  /* ****************************************************** */
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<{
    matchId: string;
    from: string;
    gradeLevel: GradeLevel;
  } | null>(null);

  const [multiplayerView, setMultiplayerView] = useState<boolean>(false);
  const [multiplayerPlayers, setMultiplayerPlayers] = useState<
    MultiplayerPlayer[]
  >([]);

  // Store setup values in ref (doesn't cause re-renders, but available when needed)
  const setupValuesRef = useRef({
    gradeLevel: "K" as GradeLevel,
    gameMode: "solo" as GameMode,
    playerName: "Player",
  });

  useEffect(() => {
    const savedState = loadGameState();
    if (savedState) {
      setGameState(savedState);
      setGameStatus(savedState.status);
      if (savedState.status === "finished") {
        setHasBeenSaved(true);
      }
    }
  }, []);

  // Auto-save whenever game state changes for even driven updates
  useEffect(() => {
    if (gameState && gameStatus !== "setup") {
      saveGameState(gameState);
    }
  }, [gameState, gameStatus]);

  // 🎮 MULTIPLAYER: Poll opponent's progress
  useEffect(() => {
    // ✅ Keep polling even in "finished" state until BOTH players are done
    const shouldPoll =
      gameState?.mode === "multiplayer" &&
      gameState?.gameId &&
      gameState?.currentPlayer.playerId &&
      (gameStatus === "active" ||
        (gameStatus === "finished" && !gameState?.opponent?.isFinished));

    setShouldPollOpponent(shouldPoll as boolean);
    if (!shouldPoll) {
      return;
    }

    const pollOpponentProgress = async () => {
      try {
        const res = await fetch(
          `/api/game/progress?roomId=${gameState.gameId}&playerId=${gameState.currentPlayer.playerId}`
        );
        const data = await res.json();

        if (data.ok && data.opponentProgress) {
          const opponentProgress = data.opponentProgress;

          // ✅ Check if opponent left the game
          if (opponentProgress.isActive === false && !opponentLeftGame) {
            setOpponentLeftGame(true);
            // Opponent left - mark their current state as final
            setGameState((prevState) => {
              if (!prevState || prevState.mode !== "multiplayer")
                return prevState;
              return {
                ...prevState,
                opponent: {
                  ...prevState.opponent!,
                  currentQuestionIndex: opponentProgress.currentQuestionIndex,
                  questionsAnswered: opponentProgress.questionsAnswered,
                  totalPoints: opponentProgress.totalPoints,
                  totalMistakes: opponentProgress.totalMistakes,
                  isFinished: true, // Mark as finished when they leave
                  finishTime: opponentProgress.finishTime || Date.now(), // ✅ Sync finish time
                  questionResults: opponentProgress.questionResults,
                },
                status: prevState.currentPlayer.isFinished
                  ? "finished"
                  : prevState.status,
                endTime: prevState.currentPlayer.isFinished
                  ? Date.now()
                  : prevState.endTime,
              };
            });
            return; // Stop processing further
          }

          // Update opponent state with fetched progress
          setGameState((prevState) => {
            if (!prevState || prevState.mode !== "multiplayer")
              return prevState;

            const bothFinished =
              opponentProgress.isFinished && prevState.currentPlayer.isFinished;
            return {
              ...prevState,
              opponent: {
                ...prevState.opponent!,
                currentQuestionIndex: opponentProgress.currentQuestionIndex,
                questionsAnswered: opponentProgress.questionsAnswered,
                totalPoints: opponentProgress.totalPoints,
                totalMistakes: opponentProgress.totalMistakes,
                isFinished: opponentProgress.isFinished,
                finishTime: opponentProgress.finishTime, // ✅ Sync individual finish time
                questionResults: opponentProgress.questionResults,
              },
              // Only mark game as finished when BOTH players are done
              status: bothFinished ? "finished" : prevState.status,
              endTime: bothFinished ? Date.now() : prevState.endTime,
            };
          });

          // If opponent just finished and we're already finished, update game status
          if (
            opponentProgress.isFinished &&
            gameState.currentPlayer.isFinished &&
            gameStatus !== "finished"
          ) {
            setGameStatus("finished");
          }
        }
      } catch (err) {
        console.error("Failed to fetch opponent progress:", err);
      }
    };

    // Initial fetch
    pollOpponentProgress();

    // Poll every 1 second
    const interval = setInterval(pollOpponentProgress, 1000);

    return () => clearInterval(interval);
  }, [
    gameState?.mode,
    gameStatus,
    gameState?.gameId,
    gameState?.currentPlayer.playerId,
    gameState?.currentPlayer.isFinished,
    gameState?.opponent?.isFinished,
    opponentLeftGame,
  ]);

  const updateCPUProgress = useCallback(
    (currentGameState: GameState): GameState => {
      if (!currentGameState.opponent || currentGameState.opponent.isFinished) {
        return currentGameState;
      }

      // ✅ If player finished, snapshot opponent and stop
      if (currentGameState.currentPlayer.isFinished) {
        return {
          ...currentGameState,
          opponent: {
            ...currentGameState.opponent,
            isFinished: true, // Mark as finished
          },
        };
      }

      const currentQuestion =
        currentGameState.questions[
          currentGameState.opponent.currentQuestionIndex
        ];

      const cpuResult = simulateCPUAnswer(
        currentQuestion,
        currentGameState.opponent,
        "medium"
      );
      const cpuPoints = calculateQuestionPoints(
        cpuResult.timeSpent,
        cpuResult.mistakes,
        GAME_CONFIG.TARGET_TIMES[currentGameState.gradeLevel],
        currentQuestion.basePoints || GAME_CONFIG.BASE_POINTS
      );

      // simulate answer mistakes
      const answerMistakes: QuestionResult[] = [];
      for (let i = 0; i < cpuResult.mistakes; i++) {
        const answerMistake: QuestionResult = {
          questionId: currentQuestion.id,
          prompt: currentQuestion.prompt,
          userAnswer: currentQuestion.correctAnswer,
          correctAnswer: currentQuestion.correctAnswer,
          correct: false,
          timeSpent: cpuResult.timeSpent + i * 0.1,
          mistakes: 1,
          points: 0,
          timestamp: Date.now(),
        };
        answerMistakes.push(answerMistake);
      }

      const cpuQuestionResult: QuestionResult = {
        questionId: currentQuestion.id,
        prompt: currentQuestion.prompt,
        userAnswer: currentQuestion.correctAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        correct: true,
        timeSpent: cpuResult.timeSpent,
        mistakes: cpuResult.mistakes,
        points: cpuPoints,
        timestamp: Date.now(),
      };

      const allQuestionResults: QuestionResult[] = [
        ...currentGameState.opponent.questionResults,
        cpuQuestionResult,
        ...answerMistakes,
      ];

      const newQuestionIndex =
        currentGameState.opponent.currentQuestionIndex + 1;
      const newQuestionsAnswered =
        currentGameState.opponent.questionsAnswered + 1;
      const isOpponentFinished =
        newQuestionsAnswered >= currentGameState.totalQuestions;

      const updatedOpponent: PlayerProgress = {
        ...currentGameState.opponent,
        currentQuestionIndex: newQuestionIndex,
        questionsAnswered: newQuestionsAnswered,
        totalPoints: currentGameState.opponent.totalPoints + cpuPoints,
        totalMistakes:
          currentGameState.opponent.totalMistakes + cpuResult.mistakes,
        questionResults: allQuestionResults,
        isFinished: isOpponentFinished,
        questionStartTime: Date.now(),
      };

      const shouldEndGame =
        currentGameState.currentPlayer.isFinished && updatedOpponent.isFinished;

      return {
        ...currentGameState,
        opponent: updatedOpponent,
        status: shouldEndGame ? "finished" : "active",
        endTime: shouldEndGame ? Date.now() : null,
      };
    },
    []
  );

  // ✅ FIXED: CPU scheduling logic separated completely
  const scheduleCPUAnswer = useCallback(
    (difficulty: "easy" | "medium" | "hard") => {
      // Clear any existing timer
      if (cpuTimerRef.current) {
        clearTimeout(cpuTimerRef.current);
        cpuTimerRef.current = null;
      }

      // Get latest state to calculate delay
      setGameState((prevState) => {
        if (
          !prevState ||
          prevState.status !== "active" ||
          prevState.mode !== "solo"
        ) {
          return prevState;
        }

        if (!prevState.opponent || prevState.opponent.isFinished) {
          return prevState;
        }

        const currentQuestion =
          prevState.questions[prevState.opponent.currentQuestionIndex];

        // ✅ ADD THINKING TIME: Time to read/understand the question
        const wordCount = currentQuestion.prompt.split(" ").length;
        const thinkingTime = {
          easy: 5500 + wordCount * 150, // ~5500-7000ms base thinking
          medium: 11000 + wordCount * 100, // ~11000-12500ms base thinking
          hard: 12000 + wordCount * 100, // ~12000-13500ms base thinking
        }[difficulty];

        const thinkingVaraince = 0.8 + Math.random() * 0.7;
        const actualThinkingTime = thinkingTime * thinkingVaraince;

        // Calculate delay
        const baseTimePerChar = 300;
        const typingTime =
          currentQuestion.correctAnswer.length * baseTimePerChar; // larger delay for longer words
        const difficultyConfig = GAME_CONFIG.CPU_DIFFICULTY[difficulty];
        const adjustedTypingTime =
          typingTime / difficultyConfig.speedMultiplier;

        const typingVariance = 0.9 + Math.random() * 0.5;
        const actualTypingTime = adjustedTypingTime * typingVariance;

        const totalDelay = actualThinkingTime + actualTypingTime;

        // ✅ KEY FIX: Schedule timer but DON'T modify state here
        cpuTimerRef.current = setTimeout(() => {
          // Update CPU progress
          setGameState((currentState) => {
            if (!currentState) return null;

            // ✅ ADD THIS CHECK: Don't update if game was reset
            if (!currentState || currentState.status !== "active") {
              return currentState;
            }

            // ✅ Check if we're resetting
            if (hasResetRef.current) {
              return null;
            }

            const updatedState = updateCPUProgress(currentState);

            if (updatedState.status === "finished") {
              setGameStatus("finished");
            } else if (
              updatedState.opponent &&
              !updatedState.opponent.isFinished &&
              !updatedState.currentPlayer.isFinished
            ) {
              // Schedule next CPU answer AFTER state update
              setTimeout(() => scheduleCPUAnswer(difficulty), 0);
            }

            return updatedState;
          });
        }, totalDelay);

        return prevState; // ✅ Don't modify state
      });
    },
    [updateCPUProgress]
  );

  // Start CPU when game becomes active - only trigger once
  useEffect(() => {
    if (
      gameState?.status === "active" &&
      gameState.mode === "solo" &&
      gameState.opponent &&
      !gameState.opponent.isFinished
    ) {
      // Only schedule if there's no active timer
      if (!cpuTimerRef.current) {
        scheduleCPUAnswer("medium");
      }
    }

    // Cleanup on unmount
    return () => {
      if (cpuTimerRef.current) {
        clearTimeout(cpuTimerRef.current);
        cpuTimerRef.current = null;
      }
    };
  }, [
    gameState?.status,
    gameState?.mode,
    gameState?.opponent,
    scheduleCPUAnswer,
  ]); // ✅ Include all dependencies

  // save game result for leaderboard
  useEffect(() => {
    if (
      gameState?.status === "finished" &&
      gameState.endTime &&
      !hasBeenSaved
    ) {
      const saveResult = async () => {
        try {
          // ✅ For multiplayer, use async version that fetches latest opponent data from Redis
          // This ensures both players use the same source of truth
          if (gameState.mode === "multiplayer") {
            const result = await createGameResultMultiplayer(gameState);
            console.log(
              "✅ Saved multiplayer game result with fresh opponent data:",
              result
            );
          } else {
            const result = createGameResult(gameState);
            console.log("✅ Saved solo game result:", result);
          }
          setHasBeenSaved(true);
        } catch (error) {
          console.error("Error creating game result:", error);
        }
      };

      saveResult();
    }
  }, [
    gameState?.status,
    gameState?.endTime,
    gameState?.mode,
    gameState,
    hasBeenSaved,
  ]); // ✅ Include all dependencies

  const handleGameReset = useCallback(() => {
    hasResetRef.current = true; // Prevent load effect from running

    // ✅ MULTIPLAYER: Notify opponent that we're leaving
    if (
      gameState?.mode === "multiplayer" &&
      gameState?.gameId &&
      gameState?.currentPlayer.playerId
    ) {
      fetch("/api/game/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: gameState.gameId,
          playerId: gameState.currentPlayer.playerId,
          playerName: gameState.currentPlayer.playerName,
          progress: {
            currentQuestionIndex: gameState.currentPlayer.currentQuestionIndex,
            questionsAnswered: gameState.currentPlayer.questionsAnswered,
            totalPoints: gameState.currentPlayer.totalPoints,
            totalMistakes: gameState.currentPlayer.totalMistakes,
            isFinished: gameState.currentPlayer.isFinished,
            finishTime: gameState.endTime,
            questionResults: gameState.currentPlayer.questionResults,
            isActive: false, // ✅ Mark as inactive (left game)
          },
        }),
      }).catch((err) =>
        console.error("Failed to notify opponent of leaving:", err)
      );
    }

    // Clear CPU timer on reset
    if (cpuTimerRef.current) {
      clearTimeout(cpuTimerRef.current);
      cpuTimerRef.current = null;
    }

    hasResetRef.current = true;
    clearGameState();
    flushSync(() => {
      setGameState(null);
      setHasBeenSaved(false);
      setGameStatus("setup");
      setOpponentLeftGame(false); // Reset opponent left flag
    });

    setTimeout(() => {
      hasResetRef.current = false;
    }, 100);
  }, [gameState]);

  const handlePlayAgainWithCPU = useCallback((gameState: GameState) => {
    handleGameReset();
    handleGameStart(
      gameState.mode,
      gameState.gradeLevel,
      gameState.currentPlayer.playerName
    );
  }, []);

  const handleGameStart = useCallback(
    (gameMode: GameMode, gradeLevel: GradeLevel, playerName: string) => {
      const newGameState = initializeGame(gameMode, gradeLevel, playerName);
      newGameState.status = "active";
      newGameState.startTime = Date.now();

      // Initialize question start times
      newGameState.currentPlayer.questionStartTime = Date.now();
      if (newGameState.opponent) {
        newGameState.opponent.questionStartTime = Date.now();
      }

      setGameState(newGameState);
      setGameStatus("active");
      saveGameState(newGameState);
      setHasBeenSaved(false);
    },
    []
  );

  const handleAnswerSubmit = useCallback(
    (userAnswer: string) => {
      if (!gameState || gameState.status !== "active") return;

      const currentQuestion =
        gameState.questions[gameState.currentPlayer.currentQuestionIndex];
      const questionStartTime =
        gameState.currentPlayer.questionStartTime || Date.now();

      const timeSpent = (Date.now() - questionStartTime) / 1000; // ✅ Convert to seconds

      const isCorrect = checkAnswer(
        userAnswer,
        currentQuestion.correctAnswer,
        true
      );

      if (isCorrect) {
        const points = calculateQuestionPoints(
          timeSpent,
          gameState.currentPlayer.currentQuestionMistakes || 0,
          GAME_CONFIG.TARGET_TIMES[gameState.gradeLevel],
          currentQuestion.basePoints || GAME_CONFIG.BASE_POINTS
        );

        const questionResult: QuestionResult = {
          questionId: currentQuestion.id,
          prompt: currentQuestion.prompt,
          userAnswer,
          correctAnswer: currentQuestion.correctAnswer,
          correct: true,
          timeSpent,
          mistakes: gameState.currentPlayer.currentQuestionMistakes || 0,
          points,
          timestamp: Date.now(),
        };

        const newQuestionIndex =
          gameState.currentPlayer.currentQuestionIndex + 1;
        const newQuestionsAnswered =
          gameState.currentPlayer.questionsAnswered + 1;
        const isPlayerFinished =
          newQuestionsAnswered >= gameState.totalQuestions;

        const updatedPlayer: PlayerProgress = {
          ...gameState.currentPlayer,
          currentQuestionIndex: newQuestionIndex,
          questionsAnswered: newQuestionsAnswered,
          totalPoints: gameState.currentPlayer.totalPoints + points,
          totalMistakes:
            gameState.currentPlayer.totalMistakes +
            (gameState.currentPlayer.currentQuestionMistakes || 0),
          questionResults: [
            ...gameState.currentPlayer.questionResults,
            questionResult,
          ],
          currentQuestionMistakes: 0,
          questionStartTime: isPlayerFinished ? null : Date.now(),
          isFinished: isPlayerFinished,
          finishTime: isPlayerFinished ? Date.now() : null, // ✅ Track individual finish time
        };

        let finalOpponent = gameState.opponent;
        if (
          isPlayerFinished &&
          gameState.mode === "solo" &&
          gameState.opponent
        ) {
          // Clear CPU timer immediately
          if (cpuTimerRef.current) {
            clearTimeout(cpuTimerRef.current);
            cpuTimerRef.current = null;
          }

          // Snapshot opponent as-is
          finalOpponent = {
            ...gameState.opponent,
            isFinished: true, // Mark as finished
            finishTime: Date.now(), // ✅ Mark CPU finish time
          };
        }

        // ✅ For MULTIPLAYER: Keep game "active" until both finish, but mark player as finished
        // ✅ For SOLO: Game ends when player finishes
        const shouldEndGame =
          isPlayerFinished &&
          (gameState.mode === "solo" ||
            (gameState.mode === "multiplayer" && finalOpponent?.isFinished));

        const updatedGameState: GameState = {
          ...gameState,
          currentPlayer: updatedPlayer,
          opponent: finalOpponent,
          status: shouldEndGame ? "finished" : "active",
          endTime: shouldEndGame ? Date.now() : null,
        };

        setGameState(updatedGameState);

        // 🎮 MULTIPLAYER: Push progress update to opponent (including questionResults for metrics)
        if (gameState.mode === "multiplayer" && gameState.gameId) {
          fetch("/api/game/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roomId: gameState.gameId,
              playerId: updatedPlayer.playerId,
              playerName: updatedPlayer.playerName,
              progress: {
                currentQuestionIndex: updatedPlayer.currentQuestionIndex,
                questionsAnswered: updatedPlayer.questionsAnswered,
                totalPoints: updatedPlayer.totalPoints,
                totalMistakes: updatedPlayer.totalMistakes,
                isFinished: updatedPlayer.isFinished,
                finishTime: updatedPlayer.finishTime, // ✅ Use player's individual finish time
                questionResults: updatedPlayer.questionResults, // ✅ Sync for metrics!
                isActive: true, // ✅ Player is still active during normal gameplay
              },
            }),
          }).catch((err) => console.error("Failed to push progress:", err));
        }

        // Update UI to show finished screen (but keep polling if opponent isn't done)
        if (isPlayerFinished && gameState.mode === "solo") {
          setGameStatus("finished");
          // Clear CPU timer when solo game ends
          if (cpuTimerRef.current) {
            clearTimeout(cpuTimerRef.current);
            cpuTimerRef.current = null;
          }
        } else if (isPlayerFinished && gameState.mode === "multiplayer") {
          // Show finished screen but keep status "active" until both done
          setGameStatus("finished"); // Show finished UI
          // Polling will continue until opponent finishes
        }
      } else {
        // Incorrect answer - increment mistakes
        const questionResult: QuestionResult = {
          questionId: currentQuestion.id,
          prompt: currentQuestion.prompt,
          userAnswer,
          correctAnswer: currentQuestion.correctAnswer,
          correct: false,
          timeSpent,
          mistakes: gameState.currentPlayer.currentQuestionMistakes || 0,
          points: 0,
          timestamp: Date.now(),
        };
        const updatedGameState: GameState = {
          ...gameState,
          currentPlayer: {
            ...gameState.currentPlayer,
            currentQuestionMistakes:
              (gameState.currentPlayer.currentQuestionMistakes || 0) + 1,
            questionResults: [
              ...gameState.currentPlayer.questionResults,
              questionResult,
            ],
          },
        };

        setGameState(updatedGameState);
      }
    },
    [gameState]
  );

  // Handle rematch acceptance
  const handleRematchAccepted = useCallback(
    async (matchId: string, opponentId: string, opponentName: string) => {
      console.log("🔄 Starting rematch:", {
        matchId,
        opponentId,
        opponentName,
      });

      // Reset game state
      handleGameReset();

      // Wait a bit for state to clear
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Initialize new multiplayer game with same settings
      const newGameState = await initializeGameMultiplayer(
        matchId,
        myPlayerId!,
        setupValuesRef.current.playerName,
        opponentId,
        opponentName,
        setupValuesRef.current.gradeLevel,
        GAME_CONFIG.DEFAULT_QUESTIONS
      );

      if (newGameState) {
        setGameState(newGameState);
        setGameStatus("active");
      } else {
        console.error("❌ Failed to start rematch");
        alert("Failed to start rematch");
        setGameStatus("setup");
      }
    },
    [myPlayerId, handleGameReset]
  );

  /* ****************************************************** */
  /* MULTIPLAYER */
  /* ****************************************************** */

  // Join lobby and start polling for players
  const joinLobby = async (
    playerName: string,
    gradeLevel: GradeLevel,
    gameMode: GameMode
  ) => {
    try {
      // ✅ Stop any existing polling first (in case of rejoin)
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      // ✅ Clear any stale incoming requests
      setIncomingRequest(null);

      // Store setup values in ref for later use (when initializing multiplayer game)
      setupValuesRef.current = { playerName, gradeLevel, gameMode };

      const res = await fetch("/api/lobby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playerName,
          gradeLevel,
          gameMode,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        const newPlayerId = data.player.id;

        // ✅ Clean up any old match requests involving the NEW playerId
        // (This handles cases where player rejoins with same or different name)
        try {
          // Get all players in lobby to check for old match requests
          const lobbyRes = await fetch(`/api/lobby?exclude=${newPlayerId}`);
          const lobbyData = await lobbyRes.json();
          console.log("joining lobby", lobbyData);
          if (lobbyData.ok && lobbyData.players) {
            for (const player of lobbyData.players) {
              // Clean up match requests in both directions for the NEW playerId
              const matchId1 = `${newPlayerId}_${player.id}`;
              const matchId2 = `${player.id}_${newPlayerId}`;
              await Promise.all([
                fetch(`/api/match?matchId=${matchId1}`, {
                  method: "DELETE",
                }).catch(() => {}),
                fetch(`/api/match?matchId=${matchId2}`, {
                  method: "DELETE",
                }).catch(() => {}),
              ]);
            }
          }
        } catch (err) {
          console.error("Failed to clean up old match requests:", err);
        }

        setMyPlayerId(newPlayerId);
        setMultiplayerView(true);
        startPollingPlayers(newPlayerId);
      } else {
        alert(data.error || "Failed to join lobby");
      }
    } catch (err) {
      alert("Failed to connect to lobby");
      console.error(err);
    }
  };

  // Poll for available players AND incoming match requests
  const startPollingPlayers = (myId: string) => {
    const pollPlayers = async () => {
      try {
        // Fetch available players
        const res = await fetch(`/api/lobby?exclude=${myId}`);
        const data = await res.json();
        if (data.ok) {
          setMultiplayerPlayers(data.players);
        }

        // Check for incoming match requests (only from current lobby players)
        const lobbyPlayers = data.players || [];
        const now = Date.now();
        const MATCH_MAX_AGE = 5 * 60 * 1000; // 5 minutes (matches TTL)

        for (const player of lobbyPlayers) {
          const matchId = `${player.id}_${myId}`;
          const matchRes = await fetch(`/api/match?matchId=${matchId}`);
          const matchData = await matchRes.json();

          if (matchData.ok && matchData.match?.status === "pending") {
            // ✅ Filter out stale match requests (older than 5 minutes)
            const matchAge =
              now -
              (matchData.match.createdAt
                ? Number(matchData.match.createdAt)
                : 0);
            if (matchAge < MATCH_MAX_AGE) {
              setIncomingRequest({
                matchId,
                from: player.name,
                gradeLevel: matchData.match.gradeLevel,
              });
              break; // Only show one request at a time
            } else {
              // ✅ Clean up stale match request
              console.log("🧹 Cleaning up stale match request:", matchId);
              fetch(`/api/match?matchId=${matchId}`, {
                method: "DELETE",
              }).catch(() => {});
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch players:", err);
      }
    };

    // Initial fetch
    pollPlayers();

    // Poll every 2 seconds
    pollIntervalRef.current = setInterval(pollPlayers, 2000);
  };

  // Stop polling and leave lobby
  const leaveLobby = async (excludeMatchId?: string) => {
    // ✅ Stop polling FIRST
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // ✅ Clear incoming request
    setIncomingRequest(null);

    if (myPlayerId) {
      try {
        // ✅ Clean up any match requests involving this player before leaving
        // BUT exclude the accepted match (so the requester can still see "accepted")
        try {
          const lobbyRes = await fetch(`/api/lobby?exclude=${myPlayerId}`);
          const lobbyData = await lobbyRes.json();
          if (lobbyData.ok && lobbyData.players) {
            for (const player of lobbyData.players) {
              // Clean up match requests in both directions
              const matchId1 = `${myPlayerId}_${player.id}`;
              const matchId2 = `${player.id}_${myPlayerId}`;

              // ✅ Don't delete the accepted match - let the requester delete it
              if (
                excludeMatchId &&
                (matchId1 === excludeMatchId || matchId2 === excludeMatchId)
              ) {
                continue;
              }

              await Promise.all([
                fetch(`/api/match?matchId=${matchId1}`, {
                  method: "DELETE",
                }).catch(() => {}),
                fetch(`/api/match?matchId=${matchId2}`, {
                  method: "DELETE",
                }).catch(() => {}),
              ]);
            }
          }
        } catch (err) {
          console.error("Failed to clean up match requests:", err);
        }

        await fetch("/api/lobby", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: myPlayerId }),
        });
      } catch (err) {
        console.error("Failed to leave lobby:", err);
      }
    }

    setMultiplayerView(false);
    // ✅ Don't clear myPlayerId here - we need it for rematch!
    // setMyPlayerId(null);
    setMultiplayerPlayers([]);
  };

  // Update handleConnect to create match request
  const handleConnect = async (opponentId: string, opponentName: string) => {
    const res = await fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requesterId: myPlayerId,
        targetId: opponentId,
        gradeLevel: setupValuesRef.current.gradeLevel || "K",
      }),
    });

    const data = await res.json();
    if (data.ok) {
      // Poll for acceptance
      waitForMatchAcceptance(data.matchId, opponentId, opponentName);
    }
  };

  // Poll to check if opponent accepted
  const waitForMatchAcceptance = async (
    matchId: string,
    opponentId: string,
    opponentName: string
  ) => {
    let hasCompleted = false;

    const checkInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/match?matchId=${matchId}`);
        const data = await res.json();

        if (data.ok && data.match) {
          if (data.match.status === "completed") {
            if (hasCompleted) return;
            hasCompleted = true;
            clearInterval(checkInterval);
            alert("Match request timed out");

            // ✅ Clean up completed match
            fetch(`/api/match?matchId=${matchId}`, { method: "DELETE" }).catch(
              (err) => console.error("Failed to clean up completed match:", err)
            );

            setIncomingRequest(null);
            return;
          }

          // must be accepted and not rejected
          if (data.match.status === "accepted") {
            if (hasCompleted) return;
            hasCompleted = true;
            clearInterval(checkInterval);

            // START GAME!
            await leaveLobby();

            // Initialize multiplayer game with shared questions
            const newGameState = await initializeGameMultiplayer(
              matchId,
              myPlayerId!,
              setupValuesRef.current.playerName,
              opponentId,
              opponentName,
              setupValuesRef.current.gradeLevel,
              GAME_CONFIG.DEFAULT_QUESTIONS
            );

            if (newGameState) {
              setGameState(newGameState);
              setGameStatus("active");

              // ✅ Player A (requester) deletes the match after seeing "accepted" and starting game
              // This ensures Player A always sees the status before deletion
              fetch(`/api/match?matchId=${matchId}`, {
                method: "DELETE",
              }).catch((err) =>
                console.error("Failed to clean up match:", err)
              );
            } else {
              console.error("❌ Failed to initialize multiplayer game");
              alert("Failed to start multiplayer game");
            }
          } else if (data.match.status === "rejected") {
            if (hasCompleted) return;
            hasCompleted = true;
            clearInterval(checkInterval);

            // ✅ Clean up rejected match
            fetch(`/api/match?matchId=${matchId}`, { method: "DELETE" }).catch(
              (err) => console.error("Failed to clean up rejected match:", err)
            );
          }
        } else if (!data.ok && res.status === 404) {
          // ✅ Match was deleted - this means opponent accepted a different request or match expired
          // Just stop polling silently (no error needed)
          if (hasCompleted) return;
          hasCompleted = true;
          clearInterval(checkInterval);
        }
      } catch (err) {
        console.error("Failed to check match status:", err);
      }
    }, 1000); // check every second

    return () => {
      clearInterval(checkInterval);
    };
  };

  // Accept incoming match request
  const handleAcceptMatch = async () => {
    if (!incomingRequest) return;

    try {
      const res = await fetch("/api/match", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: incomingRequest.matchId,
          status: "accepted",
        }),
      });

      const acceptData = await res.json();

      if (!acceptData.ok) {
        alert("Failed to accept match");
        return;
      }

      // Extract opponent ID from matchId (format: "requesterId_targetId")
      const [opponentId] = incomingRequest.matchId.split("_");

      // Start game!
      // ✅ Don't delete the accepted match - let Player A (requester) delete it after seeing "accepted"
      await leaveLobby(incomingRequest.matchId);

      // Initialize multiplayer game with shared questions
      const newGameState = await initializeGameMultiplayer(
        incomingRequest.matchId,
        myPlayerId!,
        setupValuesRef.current.playerName,
        opponentId,
        incomingRequest.from,
        setupValuesRef.current.gradeLevel,
        GAME_CONFIG.DEFAULT_QUESTIONS
      );

      if (newGameState) {
        setGameState(newGameState);
        setGameStatus("active");

        // ✅ Player B (accepter) does NOT delete the match
        // Player A (requester) will delete it after seeing "accepted" status
        // This ensures Player A always sees the status before deletion
      } else {
        console.error("❌ Failed to initialize multiplayer game");
        alert("Failed to start multiplayer game");
      }
    } catch (err) {
      console.error("Failed to accept match:", err);
    }
  };

  // Reject incoming match request
  const handleRejectMatch = async () => {
    console.log("Rejecting match:", incomingRequest);
    if (!incomingRequest) return;

    try {
      const res = await fetch("/api/match", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: incomingRequest.matchId,
          status: "rejected",
        }),
      });

      const rejectData = await res.json();
      console.log("Rejected match:", rejectData);

      // ✅ Clean up rejected match request
      await fetch(`/api/match?matchId=${incomingRequest.matchId}`, {
        method: "DELETE",
      }).catch((err) => console.error("Failed to clean up:", err));

      setIncomingRequest(null);
    } catch (err) {
      console.error("Failed to reject match:", err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleRejectRematch = async (matchId: string) => {
    try {
      // ✅ Step 1: Set status to rejected
      const res = await fetch("/api/match", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: matchId,
          status: "rejected",
        }),
      });
      const rejectData = await res.json();
      console.log("Rejected rematch:", rejectData);

      // ✅ Step 2: Wait a moment for the requester to see the rejection
      // Wait 2 seconds to ensure the requester's polling (every 1 second) sees the "rejected" status
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // ✅ Step 3: Delete the match to clean up
      await fetch(`/api/match?matchId=${matchId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to reject rematch:", err);
    }
  };

  return (
    <div className="w-full h-dvh bg-linear-to-br from-primary-800 via-secondary-800 to-tertiary-700">
      {gameStatus === "setup" && (
        <TQ_SetupScreen
          gameStatus={gameStatus}
          gameState={gameState}
          key={`setup-${Date.now()}`} // Force new instance every time
          handleGameStart={handleGameStart}
          multiplayerPlayers={multiplayerPlayers}
          multiplayerView={multiplayerView}
          handleAcceptMatch={handleAcceptMatch}
          handleRejectMatch={handleRejectMatch}
          joinLobby={joinLobby}
          leaveLobby={leaveLobby}
          handleConnect={handleConnect}
          incomingRequest={incomingRequest}
        />
      )}
      {gameStatus === "active" && (
        <TQ_ActiveScreen
          gameState={gameState}
          onAnswerSubmit={handleAnswerSubmit}
          handleGameReset={handleGameReset}
          opponentLeftGame={opponentLeftGame}
        />
      )}
      {gameStatus === "finished" && gameState && (
        <TQ_FinishedScreen
          gameState={gameState}
          handlePlayAgainWithCPU={handlePlayAgainWithCPU}
          handleGameReset={handleGameReset}
          shouldPollOpponent={shouldPollOpponent as boolean}
          opponentLeftGame={opponentLeftGame}
          myPlayerId={myPlayerId}
          onRematchAccepted={handleRematchAccepted}
          handleRejectRematch={handleRejectRematch}
        />
      )}
      {!gameStatus ||
      (gameStatus !== "setup" &&
        gameStatus !== "active" &&
        gameStatus !== "finished") ? (
        <div className="text-white text-center p-10">
          ERROR: Invalid gameStatus = {gameStatus}
        </div>
      ) : null}
    </div>
  );
};

export default TypeQuestPage;
