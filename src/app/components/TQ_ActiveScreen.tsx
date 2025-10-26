"use client";
import React, { Dispatch, SetStateAction } from "react";
import { ChevronLeft } from "lucide-react";
import { GameState, GameStatus } from "../constants/index_typequest";
import { clearGameState } from "@/lib/utils_typequest";
import BackTo from "./BackTo";

const TQ_ActiveScreen = ({
  setGameStatus,
  gameState,
  onAnswerSubmit,
  onResetGame,
}: {
  setGameStatus: Dispatch<SetStateAction<GameStatus>>;

  gameState: GameState | null;
  onAnswerSubmit: (userAnswer: string) => void;
  onResetGame: () => void;
}) => {
  const handleBackToHome = () => {
    clearGameState();
    setGameStatus("setup");
  };
  return (
    <div className="w-full h-dvh flex-col gap-10 p-10">
      <div className="flex flex-row w-full">
        <BackTo title="Back To Home" onClick={handleBackToHome} />
      </div>
    </div>
  );
};

export default TQ_ActiveScreen;
