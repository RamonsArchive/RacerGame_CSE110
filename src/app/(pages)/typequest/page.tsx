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
  loadGameState,
  saveGameState,
  getGameResults,
  checkAnswer,
  simulateCPUAnswer,
  clearGameState,
  getGameQuestions,
  getChoices,
  saveGameResult,
  createGameResult,
} from "@/lib/utils_typequest";
import TQ_SetupScreen from "@/app/components/TQ_SetupScreen";
import TQ_ActiveScreen from "@/app/components/TQ_ActiveScreen";
import TQ_FinishedScreen from "@/app/components/TQ_FinishedScreen";
import { useRouter } from "next/navigation";

const TypeQuestPage = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("setup");
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const cpuTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
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
    if (gameState) {
      saveGameState(gameState);
    }
  }, [gameState]);

  const updateCPUProgress = useCallback(
    (currentGameState: GameState): GameState => {
      if (!currentGameState.opponent || currentGameState.opponent.isFinished) {
        return currentGameState;
      }

      const currentQuestion =
        currentGameState.questions[
          currentGameState.opponent.currentQuestionIndex
        ];

      const cpuResult = simulateCPUAnswer(currentQuestion, "medium");
      const cpuPoints = calculateQuestionPoints(
        cpuResult.timeSpent,
        cpuResult.mistakes,
        GAME_CONFIG.TARGET_TIMES[currentGameState.gradeLevel],
        currentQuestion.basePoints || GAME_CONFIG.BASE_POINTS
      );

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
        questionResults: [
          ...currentGameState.opponent.questionResults,
          cpuQuestionResult,
        ],
        isFinished: isOpponentFinished,
        questionStartTime: isOpponentFinished ? null : Date.now(),
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
  const scheduleCPUAnswer = useCallback(() => {
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

      // Calculate delay
      const baseTimePerChar = 400;
      const cpuSpeed = currentQuestion.correctAnswer.length * baseTimePerChar;
      const difficulty = GAME_CONFIG.CPU_DIFFICULTY.medium;
      const cpuDelay = cpuSpeed / difficulty.speedMultiplier;
      const randomDelay = cpuDelay * (0.8 + Math.random() * 0.4);

      // ✅ KEY FIX: Schedule timer but DON'T modify state here
      cpuTimerRef.current = setTimeout(() => {
        // Update CPU progress
        setGameState((currentState) => {
          if (!currentState) return null;

          const updatedState = updateCPUProgress(currentState);

          if (updatedState.status === "finished") {
            setGameStatus("finished");
          } else if (
            updatedState.opponent &&
            !updatedState.opponent.isFinished
          ) {
            // Schedule next CPU answer AFTER state update
            setTimeout(() => scheduleCPUAnswer(), 0);
          }

          return updatedState;
        });
      }, randomDelay);

      return prevState; // ✅ Don't modify state
    });
  }, [updateCPUProgress]);

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
        scheduleCPUAnswer();
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

  // finish game by setting opponent to finished and cancel CPU timer
  const cancelCPUTimerAndEndGame = useCallback(() => {
    if (cpuTimerRef.current) {
      clearTimeout(cpuTimerRef.current);
      cpuTimerRef.current = null;
    }
    if (gameState) {
      gameState.opponent && (gameState.opponent.isFinished = true);
    }
  }, []);

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

  const handleGameReset = useCallback(() => {
    // Clear CPU timer on reset
    if (cpuTimerRef.current) {
      clearTimeout(cpuTimerRef.current);
      cpuTimerRef.current = null;
    }
    clearGameState();
    setGameState(null);
    setGameStatus("setup");
    setHasBeenSaved(false);
  }, []);

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

        // Check if BOTH players are finished (for solo mode)
        const shouldFinishGame = isPlayerFinished; // TODO: Add opponent finished check

        const updatedGameState: GameState = {
          ...gameState,
          currentPlayer: updatedPlayer,
          status: shouldFinishGame ? "finished" : "active",
          endTime: shouldFinishGame ? Date.now() : null,
        };

        setGameState(updatedGameState);

        if (shouldFinishGame) {
          setGameStatus("finished");
          // Clear CPU timer when game ends
          cancelCPUTimerAndEndGame();
        }
      } else {
        // Incorrect answer - increment mistakes
        const updatedGameState: GameState = {
          ...gameState,
          currentPlayer: {
            ...gameState.currentPlayer,
            currentQuestionMistakes:
              (gameState.currentPlayer.currentQuestionMistakes || 0) + 1,
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

  return (
    <div className="w-full h-dvh bg-linear-to-br from-primary-800 via-secondary-800 to-tertiary-700">
      {gameStatus === "setup" && (
        <TQ_SetupScreen
          gameStatus={gameStatus}
          setGameStatus={setGameStatus}
          gameState={gameState}
          handleGameStart={handleGameStart}
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
      {gameStatus === "finished" && (
        <TQ_FinishedScreen
          gameState={gameState}
          onPlayAgain={handleGameReset}
          onBackHome={handleBackHome}
        />
      )}
    </div>
  );
};

export default TypeQuestPage;
