// components/TQ_FinishedScreen.tsx
"use client";
import React, { useState } from "react";
import { GameState } from "../constants/index_typequest";
import TQ_Summary from "./TQ_Summary";
import TQ_Leaderboard from "./TQ_Leaderboard";

interface TQ_FinishedScreenProps {
  gameState: GameState | null;
  onPlayAgain: () => void;
  onBackHome: () => void;
  shouldPollOpponent: boolean;
}

const TQ_FinishedScreen = ({
  gameState,
  onPlayAgain,
  onBackHome,
  shouldPollOpponent,
}: TQ_FinishedScreenProps) => {
  const [openLeaderboard, setOpenLeaderboard] = useState(false);

  // Add this early return
  if (!gameState) {
    return null;
  }

  const winner =
    gameState?.currentPlayer?.totalPoints && gameState?.opponent?.totalPoints
      ? gameState.currentPlayer.totalPoints > gameState.opponent.totalPoints
        ? "win"
        : gameState.currentPlayer.totalPoints < gameState.opponent.totalPoints
        ? "loss"
        : "tie"
      : null;

  const getWinnerMessage = () => {
    if (!winner) return null;

    switch (winner) {
      case "win":
        return (
          <div className="flex flex-col items-center gap-2">
            <p className="text-5xl">🎉</p>
            <p className="text-3xl font-bold text-green-400 animate-bounce">
              You Won!
            </p>
            <p className="text-lg text-slate-300">
              Beat opponent by{" "}
              {(gameState?.currentPlayer?.totalPoints || 0) -
                (gameState?.opponent?.totalPoints || 0)}{" "}
              points
            </p>
          </div>
        );
      case "loss":
        return (
          <div className="flex flex-col items-center gap-2">
            <p className="text-5xl">💪</p>
            <p className="text-3xl font-bold text-red-400">
              Better Luck Next Time!
            </p>
            <p className="text-lg text-slate-300">
              Lost by{" "}
              {(gameState?.opponent?.totalPoints || 0) -
                (gameState?.currentPlayer?.totalPoints || 0)}{" "}
              points
            </p>
          </div>
        );
      case "tie":
        return (
          <div className="flex flex-col items-center gap-2">
            <p className="text-5xl">🤝</p>
            <p className="text-3xl font-bold text-yellow-400">It's a Tie!</p>
            <p className="text-lg text-slate-300">
              Both scored {gameState?.currentPlayer?.totalPoints} points
            </p>
          </div>
        );
    }
  };

  return (
    <>
      <div className="flex items-center justify-center w-full h-dvh p-4">
        <div className="flex flex-col w-full max-w-2xl p-10 gap-8 bg-linear-to-b from-pink-700 via-primary-900 to-secondary-800 rounded-2xl shadow-2xl">
          {/* Title */}
          <div className="flex justify-center w-full">
            <h1 className="text-5xl font-bold text-white drop-shadow-2xl text-center">
              Race Completed! 🏁
            </h1>
          </div>

          {/* Live Update Indicator - only show if opponent still playing */}
          {shouldPollOpponent && gameState?.mode === "multiplayer" && (
            <div className="flex items-center justify-center gap-3 px-4 py-3 bg-blue-500/20 border border-blue-400/40 rounded-lg backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <p className="text-sm font-semibold text-blue-200">
                  🎮 Opponent still playing...
                </p>
              </div>
              <p className="text-xs text-blue-300/80">Updating live</p>
            </div>
          )}

          {/* Winner Announcement */}
          <div className="flex justify-center w-full">{getWinnerMessage()}</div>

          {/* Summary */}
          {gameState && (
            <TQ_Summary
              gameState={gameState}
              shouldPollOpponent={shouldPollOpponent}
            />
          )}

          {/* Action Buttons */}
          <div className="flex flex-col w-full gap-3">
            <button
              onClick={() => setOpenLeaderboard(true)}
              className="flex items-center justify-center gap-2 w-full bg-slate-200 hover:bg-slate-100 text-slate-900 font-bold text-xl py-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              <span>🏆</span>
              View Leaderboard
            </button>

            <div className="flex flex-row w-full gap-4">
              <button
                onClick={onPlayAgain}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              >
                Play Again
              </button>
              <button
                onClick={onBackHome}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xl py-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Modal */}
      <TQ_Leaderboard
        isOpen={openLeaderboard}
        onClose={() => setOpenLeaderboard(false)}
        gradeLevel={gameState?.gradeLevel}
        mode={gameState?.mode}
        currentGameId={gameState?.gameId}
      />
    </>
  );
};

export default TQ_FinishedScreen;
