"use client";
import React, { useCallback, useEffect, useState } from "react";
import { TreasureHuntGameState } from "@/app/constants/index_treasurehunt";
import { createGameResult, calculateGameScore } from "@/lib/utils_treasurehunt";
import TH_Summary from "./TH_Summary";
import BackTo from "./BackTo";

const TH_FinishedScreen = ({
  gameState,
  onPlayAgain,
  onBackHome,
}: {
  gameState: TreasureHuntGameState;
  onPlayAgain: () => void;
  onBackHome: () => void;
}) => {
  const [currentPlayerTotalPoints, setCurrentPlayerTotalPoints] = useState(0);
  const [opponentTotalPoints, setOpponentTotalPoints] = useState(0);
  const [winner, setWinner] = useState<"win" | "loss" | "tie" | null>(null);

  // Calculate points - MUST match createGameResult logic exactly!
  const calculateCurrentPlayerTotalPoints = useCallback(() => {
    if (!gameState || !gameState.startTime) return 0;

    // Use player's individual finishTime (same as createGameResult)
    const playerEndTime =
      gameState.currentPlayer.finishTime || gameState.endTime || Date.now();
    const currentPlayerPerfect = gameState?.currentPlayer?.totalMistakes === 0;

    return calculateGameScore(
      gameState?.currentPlayer?.questionResults || [],
      currentPlayerPerfect,
      gameState.startTime,
      playerEndTime,
      gameState.targetTimePerQuestion,
      gameState.totalQuestions
    );
  }, [gameState]);

  const calculateOpponentTotalPoints = useCallback(() => {
    if (!gameState || !gameState.startTime || !gameState.opponent) return 0;

    // Use opponent's individual finishTime (same as createGameResult)
    const opponentEndTime =
      gameState.opponent.finishTime || gameState.endTime || Date.now();
    const opponentPerfect = gameState?.opponent?.totalMistakes === 0;

    return calculateGameScore(
      gameState?.opponent?.questionResults || [],
      opponentPerfect,
      gameState.startTime,
      opponentEndTime,
      gameState.targetTimePerQuestion,
      gameState.totalQuestions
    );
  }, [gameState]);

  useEffect(() => {
    // Calculate points first
    const playerPoints = calculateCurrentPlayerTotalPoints();
    const oppPoints = calculateOpponentTotalPoints();

    // Update points state
    setCurrentPlayerTotalPoints(playerPoints);
    setOpponentTotalPoints(oppPoints);

    // Calculate winner using the JUST-CALCULATED values (not state)
    const calculatedWinner =
      playerPoints > 0 || oppPoints > 0
        ? playerPoints > oppPoints
          ? "win"
          : playerPoints < oppPoints
          ? "loss"
          : "tie"
        : null;

    setWinner(calculatedWinner);

    console.log("🏆 Winner calculation:", {
      playerPoints,
      oppPoints,
      winner: calculatedWinner,
    });
  }, [
    gameState,
    calculateCurrentPlayerTotalPoints,
    calculateOpponentTotalPoints,
  ]);

  const getWinnerMessage = useCallback(() => {
    if (!gameState || !winner) return null;

    switch (winner) {
      case "win":
        return (
          <div className="flex flex-col items-start gap-2">
            <p className="text-5xl">🎉</p>
            <p className="text-5xl font-bold text-green-400 animate-bounce">
              You Won!
            </p>
            <p className="text-lg text-slate-300">
              Beat {gameState.opponent?.playerName || "CPU"} by{" "}
              {currentPlayerTotalPoints - opponentTotalPoints} points
            </p>
          </div>
        );
      case "loss":
        return (
          <div className="flex flex-col items-start gap-2">
            <p className="text-5xl">💪</p>
            <p className="text-3xl font-bold text-red-400">
              Better Luck Next Time!
            </p>
            <p className="text-lg text-slate-300">
              Lost to {gameState.opponent?.playerName || "CPU"} by{" "}
              {opponentTotalPoints - currentPlayerTotalPoints} points
            </p>
          </div>
        );
      case "tie":
        return (
          <div className="flex flex-col items-start gap-2">
            <p className="text-5xl">🤝</p>
            <p className="text-3xl font-bold text-yellow-400">
              It&apos;s a Tie!
            </p>
            <p className="text-lg text-slate-300">
              Both scored {currentPlayerTotalPoints} points
            </p>
          </div>
        );
    }
  }, [winner, currentPlayerTotalPoints, opponentTotalPoints, gameState]);

  return (
    <div
      className="flex items-start justify-center w-full h-dvh p-4 relative"
      style={{
        backgroundImage: "url(/Assets/TypeQuest/finish.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="flex flex-row items-start gap-10 w-full max-w-5xl p-10 bg-transparent rounded-2xl mt-8 mr-8">
        {/* Left side: Title and Winner Announcement */}
        <div className="flex flex-col gap-6 shrink-0">
          {/* Title */}
          <div className="flex items-start">
            <div className="px-6 py-4 bg-linear-to-br from-slate-800/90 via-slate-700/80 to-slate-900/90 rounded-lg shadow-md border border-white/10">
              <h1 className="text-5xl font-bold text-white">
                🏴‍☠️ Treasure Hunt Complete! 🏴‍☠️
              </h1>
            </div>
          </div>

          {/* Winner Announcement */}
          <div className="flex items-start">
            <div className="px-6 py-4 bg-linear-to-br from-slate-800/90 via-slate-700/80 to-slate-900/90 rounded-lg shadow-md border border-white/10">
              {getWinnerMessage()}
            </div>
          </div>
        </div>

        {/* Right side: Summary and Action Buttons */}
        <div className="flex flex-col gap-8 flex-1">
          {/* Summary */}
          {gameState && (
            <TH_Summary
              gameState={gameState}
              currentPlayerTotalPoints={currentPlayerTotalPoints}
              opponentTotalPoints={opponentTotalPoints}
            />
          )}

          {/* Action Buttons */}
          <div className="flex flex-col w-full gap-3">
            <button
              onClick={onPlayAgain}
              className="flex-1 bg-green-600/90 hover:bg-green-700/90 text-white font-bold text-xl py-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              Play Again
            </button>
            <button
              onClick={onBackHome}
              className="flex-1 bg-primary-600/90 hover:bg-primary-700/90 text-white font-bold text-xl py-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TH_FinishedScreen;
