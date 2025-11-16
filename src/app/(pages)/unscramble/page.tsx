"use client";
import React, { useState, useEffect, useCallback } from "react";

import {
  UnscrambleGameState,
  GameStatus,
  GradeLevel,
} from "@/app/constants/index_unscramble";
import {
  initializeGame,
  loadGameState,
  saveGameState,
  clearGameState,
} from "@/lib/utils_unscramble";

import UN_SetupScreen from "@/app/components/UN_SetupScreen";
import UN_ActiveScreen from "@/app/components/UN_ActiveScreen";
import UN_FinishedScreen from "@/app/components/UN_FinishedScreen";
import { useRouter } from "next/navigation";

const UnscramblePage = () => {
  const [gameState, setGameState] = useState<UnscrambleGameState | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("setup");
  const router = useRouter();

  // Load saved game state on mount
  useEffect(() => {
    const savedState = loadGameState();
    if (savedState && savedState.status !== "finished") {
      setGameState(savedState);
      setGameStatus(savedState.status);
    }
  }, []);

  // Auto-save whenever game state changes
  useEffect(() => {
    if (gameState && gameStatus === "active") {
      saveGameState(gameState);
    }
  }, [gameState, gameStatus]);

  const handleGameStart = useCallback(
    (gradeLevel: GradeLevel, questionCount: number) => {
      const newGameState = initializeGame(gradeLevel, questionCount);
      setGameState(newGameState);
      setGameStatus("active");
      saveGameState(newGameState);
    },
    []
  );

  const handleGameFinished = useCallback(
    (updatedState: UnscrambleGameState) => {
      updatedState.status = "finished";
      setGameState(updatedState);
      setGameStatus("finished");
      saveGameState(updatedState);
    },
    []
  );

  const handleGameReset = useCallback(() => {
    clearGameState();
    setGameState(null);
    setGameStatus("setup");
  }, []);

  const handleBackHome = useCallback(() => {
    handleGameReset();
    router.push("/");
  }, [handleGameReset, router]);

  return (
    <div className="w-full h-dvh from-primary-800 via-secondary-800 to-tertiary-700">
      {gameStatus === "setup" && (
        <UN_SetupScreen
          gameStatus={gameStatus}
          gameState={gameState}
          handleGameStart={handleGameStart}
        />
      )}
      {gameStatus === "active" && gameState && (
        <UN_ActiveScreen
          gameState={gameState}
          setGameStatus={setGameStatus}
          onGameFinished={handleGameFinished}
          onRestartGame={handleGameReset}
        />
      )}
      {gameStatus === "finished" && gameState && (
        <UN_FinishedScreen
          gameState={gameState}
          onPlayAgain={handleGameReset}
          onBackHome={handleBackHome}
        />
      )}
    </div>
  );
};

export default UnscramblePage;
