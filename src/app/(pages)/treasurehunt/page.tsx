"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  TreasureHuntGameState,
  GameStatus,
  GradeLevel,
} from "@/app/constants/index_treasurehunt";
import {
  initializeGame,
  loadGameState,
  saveGameState,
  clearGameState,
} from "@/lib/utils_treasurehunt";
import TH_SetupScreen from "@/app/components/TH_SetupScreen";
import TH_ActiveScreen from "@/app/components/TH_ActiveScreen";
import TH_FinishedScreen from "@/app/components/TH_FinishedScreen";
import { useRouter } from "next/navigation";

const TreasureHuntPage = () => {
  const [gameState, setGameState] = useState<TreasureHuntGameState | null>(
    null
  );
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
    (updatedState: TreasureHuntGameState) => {
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
        <TH_SetupScreen
          gameStatus={gameStatus}
          gameState={gameState}
          handleGameStart={handleGameStart}
        />
      )}
      {gameStatus === "active" && gameState && (
        <TH_ActiveScreen
          gameState={gameState}
          setGameStatus={setGameStatus}
          onGameFinished={handleGameFinished}
          onRestartGame={handleGameReset}
        />
      )}
      {gameStatus === "finished" && gameState && (
        <TH_FinishedScreen
          gameState={gameState}
          onPlayAgain={handleGameReset}
          onBackHome={handleBackHome}
        />
      )}
    </div>
  );
};

export default TreasureHuntPage;
