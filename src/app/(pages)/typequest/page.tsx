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
} from "@/lib/utils_typequest";
import TQ_SetupScreen from "@/app/components/TQ_SetupScreen";
import TQ_ActiveScreen from "@/app/components/TQ_ActiveScreen";
import TQ_FinishedScreen from "@/app/components/TQ_FinishedScreen";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import { MultiplayerPlayer } from "@/lib/GlobalTypes";

const TypeQuestPage = () => {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("setup");
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const [shouldPollOpponent, setShouldPollOpponent] = useState(false);
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

  const [multiplayer, setMultiplayer] = useState<boolean>(
    gameState?.mode === "multiplayer"
  );
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

          // Update opponent state with fetched progress
          setGameState((prevState) => {
            if (!prevState || prevState.mode !== "multiplayer")
              return prevState;

            const bothFinished =
              opponentProgress.isFinished && prevState.currentPlayer.isFinished;

            console.log("🔍 Opponent progress:", opponentProgress);
            return {
              ...prevState,
              opponent: {
                ...prevState.opponent!,
                currentQuestionIndex: opponentProgress.currentQuestionIndex,
                questionsAnswered: opponentProgress.questionsAnswered,
                totalPoints: opponentProgress.totalPoints,
                totalMistakes: opponentProgress.totalMistakes,
                isFinished: opponentProgress.isFinished,
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
            console.log("🏁 Both players finished! Game over.");
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
  ]);

  const updateCPUProgress = useCallback(
    (currentGameState: GameState): GameState => {
      if (!currentGameState.opponent || currentGameState.opponent.isFinished) {
        return currentGameState;
      }

      // ✅ If player finished, snapshot opponent and stop
      if (currentGameState.currentPlayer.isFinished) {
        console.log("⏹️ Player finished - snapshotting CPU progress");
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
              console.log(
                "⏹️ CPU timer fired but game is not active - ignoring"
              );
              return currentState;
            }

            // ✅ Check if we're resetting
            if (hasResetRef.current) {
              console.log(
                "⏹️ CPU timer fired but game is resetting - ignoring"
              );
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
  }, [gameState?.status, gameState?.mode]); // ✅ REMOVED scheduleCPUAnswer from deps

  // save game result for leaderboard
  useEffect(() => {
    if (
      gameState?.status === "finished" &&
      gameState.endTime &&
      !hasBeenSaved
    ) {
      try {
        const result = createGameResult(gameState);
        console.log("Game result created:", result);
      } catch (error) {
        console.error("Error creating game result:", error);
      }
    }
  }, [gameState?.status, gameState?.endTime]); // ✅ Only trigger when actually finished

  const handleGameReset = useCallback(() => {
    hasResetRef.current = true; // Prevent load effect from running

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
    });

    setTimeout(() => {
      hasResetRef.current = false;
    }, 100);
  }, []);

  const handleGameStart = useCallback(
    (gameMode: GameMode, gradeLevel: GradeLevel, playerName: string) => {
      console.log(
        "Starting game with mode:",
        gameMode,
        "gradeLevel:",
        gradeLevel,
        "playerName:",
        playerName
      );
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
        };

        let finalOpponent = gameState.opponent;
        if (
          isPlayerFinished &&
          gameState.mode === "solo" &&
          gameState.opponent
        ) {
          console.log("📸 Player finished - snapshotting opponent state");

          // Clear CPU timer immediately
          if (cpuTimerRef.current) {
            clearTimeout(cpuTimerRef.current);
            cpuTimerRef.current = null;
          }

          // Snapshot opponent as-is
          finalOpponent = {
            ...gameState.opponent,
            isFinished: true, // Mark as finished
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
                finishTime: isPlayerFinished ? Date.now() : null,
                questionResults: updatedPlayer.questionResults, // ✅ Sync for metrics!
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
          console.log("🏁 You finished! Waiting for opponent...");
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

  const handleBackHome = useCallback(() => {
    handleGameReset();
    router.push("/");
  }, [handleGameReset, router]);

  console.log("Rendering - gameStatus:", gameStatus, "gameState:", gameState);

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
      console.log("Joining lobby with:", { playerName, gradeLevel, gameMode });

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
      console.log("Response:", res);
      const data = await res.json();
      console.log("Data:", data);
      if (data.ok) {
        setMyPlayerId(data.player.id);
        setMultiplayerView(true);
        startPollingPlayers(data.player.id);
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
        console.log("Polling players");
        const res = await fetch(`/api/lobby?exclude=${myId}`);
        const data = await res.json();
        console.log("Data:", data);
        if (data.ok) {
          setMultiplayerPlayers(data.players);
        }

        // Check for incoming match requests
        const lobbyPlayers = data.players || [];
        for (const player of lobbyPlayers) {
          const matchId = `${player.id}_${myId}`;
          const matchRes = await fetch(`/api/match?matchId=${matchId}`);
          const matchData = await matchRes.json();
          console.log("getting match data:", matchData);

          if (matchData.ok && matchData.match?.status === "pending") {
            console.log("Incoming request:", matchData.match);
            setIncomingRequest({
              matchId,
              from: player.name,
              gradeLevel: matchData.match.gradeLevel,
            });
            break; // Only show one request at a time
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
  const leaveLobby = async () => {
    console.log("Leaving lobby");
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (myPlayerId) {
      try {
        const res = await fetch("/api/lobby", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: myPlayerId }),
        });
        console.log("Leaving body:", res.json());
      } catch (err) {
        console.error("Failed to leave lobby:", err);
      }
    }

    setMultiplayerView(false);
    setMyPlayerId(null);
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
        gradeLevel: gameState?.gradeLevel || "K",
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
    console.log("⏳ Waiting for match acceptance:", {
      matchId,
      opponentId,
      opponentName,
    });

    const checkInterval = setInterval(async () => {
      const res = await fetch(`/api/match?matchId=${matchId}`);
      const data = await res.json();

      if (data.ok && data.match) {
        console.log("📊 Match status:", data.match.status);

        // must be accepted and not rejected
        if (data.match.status === "accepted") {
          clearInterval(checkInterval);
          console.log("✅ Match accepted! Starting game...");

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
            console.log("🎮 Multiplayer game started!");
          } else {
            console.error("❌ Failed to initialize multiplayer game");
            alert("Failed to start multiplayer game");
          }
        } else if (data.match.status === "rejected") {
          clearInterval(checkInterval);
          console.log("❌ Match rejected");
          alert("Match request declined");
        }
      } else {
        console.log("⏳ Still waiting for match response...");
      }
    }, 1000); // check every second
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
      console.log("✅ Accepted match request:", acceptData);

      if (!acceptData.ok) {
        alert("Failed to accept match");
        return;
      }

      // Extract opponent ID from matchId (format: "requesterId_targetId")
      const [opponentId] = incomingRequest.matchId.split("_");

      console.log("🎮 Starting game after acceptance:", {
        matchId: incomingRequest.matchId,
        myPlayerId,
        opponentId,
        opponentName: incomingRequest.from,
      });

      // Start game!
      await leaveLobby();

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
        console.log("🎮 Multiplayer game started!");
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
      console.log("Incoming request set to null");
      console.log("Response:", res);
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

  return (
    <div className="w-full h-dvh bg-linear-to-br from-primary-800 via-secondary-800 to-tertiary-700">
      {gameStatus === "setup" && (
        <TQ_SetupScreen
          gameStatus={gameStatus}
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
          setGameStatus={setGameStatus}
          gameState={gameState}
          onAnswerSubmit={handleAnswerSubmit}
          handleGameReset={handleGameReset}
        />
      )}
      {gameStatus === "finished" && gameState && (
        <TQ_FinishedScreen
          gameState={gameState}
          onPlayAgain={handleGameReset}
          onBackHome={handleBackHome}
          shouldPollOpponent={shouldPollOpponent as boolean}
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
