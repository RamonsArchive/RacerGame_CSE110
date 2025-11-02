// components/TQ_FinishedScreen.tsx
"use client";
import React, { useEffect, useState } from "react";
import { GameState } from "../constants/index_typequest";
import TQ_Summary from "./TQ_Summary";
import TQ_Leaderboard from "./TQ_Leaderboard";
import TQ_RematchButton from "./TQ_RematchButton";
import { calculateGameScore } from "@/lib/utils_typequest";

interface TQ_FinishedScreenProps {
  gameState: GameState | null;
  onPlayAgain: () => void;
  onBackHome: () => void;
  shouldPollOpponent: boolean;
  opponentLeftGame?: boolean;
  // Multiplayer rematch props
  myPlayerId?: string | null;
  onRematchAccepted?: (
    matchId: string,
    opponentId: string,
    opponentName: string
  ) => void;
}

const TQ_FinishedScreen = ({
  gameState,
  onPlayAgain,
  onBackHome,
  shouldPollOpponent,
  opponentLeftGame = false,
  myPlayerId,
  onRematchAccepted,
}: TQ_FinishedScreenProps) => {
  const [openLeaderboard, setOpenLeaderboard] = useState(false);

  const [currentPlayerTotalPoints, setCurrentPlayerTotalPoints] = useState(0);
  const [opponentTotalPoints, setOpponentTotalPoints] = useState(0);
  const [winner, setWinner] = useState<"win" | "loss" | "tie" | null>(null);

  // Add this early return
  if (!gameState) {
    return null;
  }

  // ✅ Calculate points - MUST match createGameResult logic exactly!
  const calculateCurrentPlayerTotalPoints = () => {
    if (!gameState || !gameState.startTime) return 0;

    // ✅ Use player's individual finishTime (same as createGameResult)
    const playerEndTime =
      gameState.currentPlayer.finishTime || gameState.endTime || Date.now();
    const currentPlayerPerfect = gameState?.currentPlayer?.totalMistakes === 0;

    return calculateGameScore(
      gameState?.currentPlayer?.questionResults,
      currentPlayerPerfect,
      gameState.startTime,
      playerEndTime,
      gameState.targetTimePerQuestion,
      gameState.totalQuestions
    );
  };

  const calculateOpponentTotalPoints = () => {
    if (!gameState || !gameState.startTime || !gameState.opponent) return 0;

    // ✅ Use opponent's individual finishTime (same as createGameResult)
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
  };

  useEffect(() => {
    // ✅ Calculate points first
    const playerPoints = calculateCurrentPlayerTotalPoints();
    const oppPoints = calculateOpponentTotalPoints();

    // ✅ Update points state
    setCurrentPlayerTotalPoints(playerPoints);
    setOpponentTotalPoints(oppPoints);

    // ✅ Calculate winner using the JUST-CALCULATED values (not state)
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
  }, [gameState]);

  console.log("🎮 Finished Screen State:", {
    winner,
    currentPlayerTotalPoints,
    opponentTotalPoints,
    shouldPollOpponent,
    myPlayerId,
  });

  const getWinnerMessage = () => {
    if (!winner) return null;

    switch (winner) {
      case "win":
        return (
          <div className="flex flex-col items-start gap-2">
            <p className="text-5xl">🎉</p>
            <p className="text-5xl font-bold text-green-400 animate-bounce">
              You Won!
            </p>
            <p className="text-lg text-slate-300">
              Beat opponent by {currentPlayerTotalPoints - opponentTotalPoints}{" "}
              points
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
              Lost by {opponentTotalPoints - currentPlayerTotalPoints} points
            </p>
          </div>
        );
      case "tie":
        return (
          <div className="flex flex-col items-start gap-2">
            <p className="text-5xl">🤝</p>
            <p className="text-3xl font-bold text-yellow-400">It's a Tie!</p>
            <p className="text-lg text-slate-300">
              Both scored {currentPlayerTotalPoints} points
            </p>
          </div>
        );
    }
  };

  return (
    <>
      <div 
        className="flex items-start justify-end w-full h-dvh p-4 relative"
        style={{
          backgroundImage: 'url(/Assets/TypeQuest/finish.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="flex flex-row items-start gap-8 w-full max-w-5xl p-10 bg-transparent rounded-2xl mt-8 mr-8">
          {/* Left side: Title and Winner Announcement */}
          <div className="flex flex-col gap-6 flex-shrink-0">
            {/* Title */}
            <div className="flex items-start">
              <h1 className="text-5xl font-bold text-white drop-shadow-2xl">
                Race Completed! 
              </h1>
            </div>

            {/* Winner Announcement */}
            <div className="flex items-start">{getWinnerMessage()}</div>
          </div>

          {/* Right side: Summary and Action Buttons */}
          <div className="flex flex-col gap-8 flex-1">
            {/* Summary */}
            {gameState && <TQ_Summary gameState={gameState} />}

            {/* Action Buttons */}
            <div className="flex flex-col w-full gap-3">
              <button
                onClick={() => setOpenLeaderboard(true)}
                className="flex items-center justify-center gap-2 w-full bg-slate-200/80 hover:bg-slate-100/80 text-slate-900 font-bold text-xl py-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              >
                <span>🏆</span>
                View Leaderboard
              </button>

              <div className="flex flex-row w-full gap-4">
                <button
                  onClick={onPlayAgain}
                  className="flex-3 bg-green-600/80 hover:bg-green-700/80 text-white font-bold text-xl py-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
                >
                  Play Again
                </button>
                <button
                  onClick={onBackHome}
                  className="flex-3 bg-primary-600/80 hover:bg-primary-700/80 text-white font-bold text-xl py-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
                >
                  Home
                </button>
              </div>
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
