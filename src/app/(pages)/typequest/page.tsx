"use client"; // page renders client side Essential for user interaction
import React, { useEffect, useCallback } from "react";
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
  checkAnswer,
  simulateCPUAnswer,
  clearGameState,
} from "@/lib/utils_typequest";
import TQ_SetupScreen from "@/app/components/TQ_SetupScreen";
import TQ_ActiveScreen from "@/app/components/TQ_ActiveScreen";
import TQ_FinishedScreen from "@/app/components/TQ_FinishedScreen";

const TypeQuestPage = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("setup");

  useEffect(() => {
    const savedState = loadGameState();
    if (savedState) {
      setGameState(savedState);
      setGameStatus(savedState.status);
    }
  }, []);

  // Auto-save whenever game state changes for even driven updates
  useEffect(() => {
    if (gameState) {
      saveGameState(gameState);
    }
  }, [gameState]);

  const handleGameStart = useCallback(
    (gameMode: GameMode, gradeLevel: GradeLevel, playerName: string) => {
      const newGameState = initializeGame(gameMode, gradeLevel, playerName);
      setGameState(newGameState);
      setGameStatus("active");
      console.log(newGameState);
    },
    []
  );

  const handleGameReset = useCallback(() => {
    clearGameState();
    setGameState(null);
    setGameStatus("setup");
  }, []);

  const handleAnswerSubmit = useCallback(
    (userAnswer: string) => {
      if (!gameState || gameState.status !== "active") return;
      const currentQuestion =
        gameState.questions[gameState.currentPlayer.currentQuestionIndex];
      const questionStartTime =
        gameState.currentPlayer.questionStartTime || Date.now();

      const timeSpent = Date.now() - questionStartTime;

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
          GAME_CONFIG.BASE_POINTS
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

        const updatedPlayer: PlayerProgress = {
          ...gameState.currentPlayer,
          currentQuestionIndex:
            gameState.currentPlayer.currentQuestionIndex + 1,
          questionsAnswered: gameState.currentPlayer.questionsAnswered + 1,
          totalPoints: gameState.currentPlayer.totalPoints + points,
          totalMistakes:
            gameState.currentPlayer.totalMistakes +
              gameState.currentPlayer.currentQuestionMistakes || 0,
          questionResults: [
            ...gameState.currentPlayer.questionResults,
            questionResult,
          ],
          currentQuestionMistakes: 0,
          questionStartTime: Date.now(), // question start time for next question
          isFinished:
            gameState.currentPlayer.questionsAnswered + 1 >=
            gameState.totalQuestions,
        };

        let updatedOpponent = gameState.opponent;
        if (
          gameState.mode === "solo" &&
          gameState.opponent &&
          !gameState.currentPlayer.isFinished
        ) {
          const cpuResult = simulateCPUAnswer(currentQuestion, "medium");
          const cpuPoints = calculateQuestionPoints(
            cpuResult.timeSpent,
            cpuResult.mistakes,
            GAME_CONFIG.TARGET_TIMES[gameState.gradeLevel],
            GAME_CONFIG.BASE_POINTS
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

          updatedOpponent = {
            ...gameState.opponent,
            currentQuestionIndex: gameState.opponent.currentQuestionIndex + 1,
            questionsAnswered: gameState.opponent.questionsAnswered + 1,
            totalPoints: gameState.opponent.totalPoints + cpuPoints,
            totalMistakes:
              gameState.opponent.totalMistakes + cpuResult.mistakes,
            questionResults: [
              ...gameState.opponent.questionResults,
              cpuQuestionResult,
            ],
            isFinished:
              gameState.opponent.questionsAnswered + 1 >=
              gameState.totalQuestions,
          };
        }
        const isGameFinished =
          updatedPlayer.isFinished &&
          (gameState.mode === "multiplayer"
            ? updatedOpponent?.isFinished
            : true);

        setGameState({
          ...gameState,
          currentPlayer: updatedPlayer,
          opponent: updatedOpponent,
          status: isGameFinished ? "finished" : "active",
          endTime: isGameFinished ? Date.now() : null,
        });

        if (isGameFinished) {
          setGameStatus("finished");
        }
      } else {
        // incorrect ansewrs - icrement mistakes and continue

        setGameState({
          ...gameState,
          currentPlayer: {
            ...gameState.currentPlayer,
            currentQuestionMistakes:
              gameState.currentPlayer.currentQuestionMistakes + 1,
          },
        });
      }
    },
    [gameState]
  );

  return (
    <div className="w-full h-dvh bg-linear-to-br from-primary-800 via-secondary-800 to-tertiary-700">
      {gameStatus === "setup" && (
        <TQ_SetupScreen
          gameStatus={gameStatus}
          setGameStatus={setGameStatus}
          gameState={gameState}
          setGameState={setGameState}
          handleGameStart={handleGameStart}
        />
      )}
      {gameStatus === "active" && (
        <TQ_ActiveScreen
          setGameStatus={setGameStatus}
          gameState={gameState}
          onAnswerSubmit={handleAnswerSubmit}
          onResetGame={handleGameReset}
        />
      )}
      {gameStatus === "finished" && <TQ_FinishedScreen />}
    </div>
  );
};

export default TypeQuestPage;
