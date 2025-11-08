// components/TQ_FinishedScreen.tsx DONT FORGET TO KEEP THE REMATCH BUTTON
"use client";
import React, { useCallback, useEffect, useState } from "react";
import { GameState } from "../constants/index_typequest";
import TQ_Summary from "./TQ_Summary";
import TQ_Leaderboard from "./TQ_Leaderboard";
import TQ_RematchButton from "./TQ_RematchButton";
import { calculateGameScore } from "@/lib/utils_typequest";
import TQ_RematchAcceptToast from "./TQ_RematchAcceptToast";

interface TQ_FinishedScreenProps {
  gameState: GameState | null;
  onPlayAgain: () => void;
  shouldPollOpponent: boolean;
  opponentLeftGame?: boolean;
  handleGameReset: () => void;
  // Multiplayer rematch props
  myPlayerId?: string | null;
  onRematchAccepted?: (
    matchId: string,
    opponentId: string,
    opponentName: string
  ) => void;
  handleRejectRematch: (matchId: string) => void;
}

const TQ_FinishedScreen = ({
  gameState,
  onPlayAgain,
  shouldPollOpponent,
  opponentLeftGame = false,
  myPlayerId,
  onRematchAccepted,
  handleGameReset,
  handleRejectRematch,
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

  const getWinnerMessage = useCallback(() => {
    if (!winner) return null;

    if (gameState.mode === "multiplayer" && !gameState.opponent?.isFinished) {
      return (
        <div className="flex flex-col items-start gap-2">
          <p className="text-5xl">⏳</p>
          <p className="text-3xl font-bold text-yellow-400">
            Waiting for opponent...
          </p>
          <p className="text-lg text-slate-300">
            Waiting for opponent to finish...
          </p>
        </div>
      );
    }

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
  }, [
    winner,
    currentPlayerTotalPoints,
    opponentTotalPoints,
    gameState.mode,
    gameState.opponent?.isFinished,
  ]);

  return (
    <>
      <div
        className="flex items-start justify-end w-full h-dvh p-4 relative"
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
                  Race Completed!
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
              <TQ_Summary
                gameState={gameState}
                shouldPollOpponent={shouldPollOpponent}
                currentPlayerTotalPoints={currentPlayerTotalPoints}
                opponentTotalPoints={opponentTotalPoints}
                opponentLeftGame={opponentLeftGame}
              />
            )}

            {/* Action Buttons */}
            <div className="flex flex-col w-full gap-3">
              <button
                onClick={() => setOpenLeaderboard(true)}
                className="flex items-center justify-center gap-2 w-full bg-slate-200/90 hover:bg-slate-100/90 text-slate-900 font-bold text-xl py-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              >
                <span>🏆</span>
                View Leaderboard
              </button>

              <div className="flex flex-row w-full gap-4">
                {/* Multiplayer: Show Rematch button */}
                {gameState?.mode === "multiplayer" &&
                myPlayerId &&
                gameState.opponent?.playerId &&
                gameState.opponent?.playerName &&
                onRematchAccepted ? (
                  <TQ_RematchButton
                    myPlayerId={myPlayerId}
                    opponentId={gameState.opponent.playerId}
                    opponentName={gameState.opponent.playerName}
                    gradeLevel={gameState.gradeLevel}
                    gameMode={gameState.mode}
                    onRematchAccepted={onRematchAccepted}
                  />
                ) : (
                  /* Solo: Show Play Again button */
                  <button
                    onClick={onPlayAgain}
                    className="flex-1 bg-green-600/90 hover:bg-green-700/90 text-white font-bold text-xl py-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
                  >
                    Play Again
                  </button>
                )}
                <button
                  onClick={handleGameReset}
                  className="flex-1 bg-primary-600/90 hover:bg-primary-700/90 text-white font-bold text-xl py-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
                >
                  Back to Menu
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

      <TQ_RematchAcceptToast
        myPlayerId={myPlayerId}
        opponentId={gameState.opponent?.playerId}
        opponentName={gameState.opponent?.playerName}
        matchId={gameState.gameId}
        gradeLevel={gameState.gradeLevel}
        gameMode={gameState.mode}
        onRematchAccepted={onRematchAccepted!}
        handleRejectRematch={handleRejectRematch!}
      />
    </>
  );
};

export default TQ_FinishedScreen;
