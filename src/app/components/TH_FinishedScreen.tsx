"use client";
import React, { useCallback, useEffect, useState } from "react";
import { TreasureHuntGameState } from "@/app/constants/index_treasurehunt";
import { calculateGameScore, calculateAccuracy, calculateAverageTime } from "@/lib/utils_treasurehunt";
import TH_Summary from "./TH_Summary";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
            <p className="text-3xl font-bold text-red-400">
              Better Luck Next Time!
            </p>
            <p className="text-lg text-black">
              Lost to {gameState.opponent?.playerName || "CPU"} by{" "}
              {opponentTotalPoints - currentPlayerTotalPoints} points
            </p>
          </div>
        );
      case "tie":
        return (
          <div className="flex flex-col items-start gap-2">
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

  // Calculate stats for display
  const correctAnswers = gameState.currentPlayer.questionResults.filter((q) => q.correct).length;
  const totalAnswered = gameState.currentPlayer.questionResults.length;
  const accuracy = calculateAccuracy(correctAnswers, totalAnswered);
  const totalTime = gameState.endTime && gameState.startTime 
    ? (gameState.endTime - gameState.startTime) / 1000 
    : 0;

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background image matching provided art */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/Assets/TreasureHunt/TH_Finish.png"
          alt="Treasure Hunt Finish Background"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center w-full h-screen p-4 overflow-y-auto">
        <div className="flex flex-col w-full max-w-6xl gap-8 p-10 my-4">
          {/* Header */}
          <Link
            href="/"
            className="group flex items-center gap-2 px-4 py-2 bg-blue-500/70 hover:bg-blue-600/80 text-white rounded-xl font-bold transition-all hover:scale-105 w-fit backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>

          {/* Two Column Layout - Vertical Columns */}
          <div className="flex flex-col md:flex-row gap-8 w-full">
            {/* Left Column */}
            <div className="flex flex-col gap-8 flex-1">
              {/* Title */}
              <h1 className="text-5xl md:text-6xl font-black text-center text-emerald-700 drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)] mt-4">
                 Treasure Found! 
              </h1>

              {/* Winner Message */}
              {getWinnerMessage() && (
                <div className="text-center p-6 rounded-2xl bg-emerald-100/60 backdrop-blur-sm text-emerald-800 shadow-lg">
                  {getWinnerMessage()}
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50/60 backdrop-blur-sm p-6 rounded-2xl text-emerald-800 shadow">
                  <p className="text-lg font-bold mb-2">⭐ Points</p>
                  <p className="text-4xl font-black">{currentPlayerTotalPoints}</p>
                </div>
                <div className="bg-emerald-50/60 backdrop-blur-sm p-6 rounded-2xl text-emerald-800 shadow">
                  <p className="text-lg font-bold mb-2">🎯 Accuracy</p>
                  <p className="text-4xl font-black">{accuracy.toFixed(1)}%</p>
                </div>
                <div className="bg-rose-50/60 backdrop-blur-sm p-6 rounded-2xl text-rose-700 shadow">
                  <p className="text-lg font-bold mb-2">😅 Mistakes</p>
                  <p className="text-4xl font-black">{gameState.currentPlayer.totalMistakes}</p>
                </div>
                <div className="bg-sky-50/60 backdrop-blur-sm p-6 rounded-2xl text-sky-700 shadow">
                  <p className="text-lg font-bold mb-2">⏱️ Time</p>
                  <p className="text-4xl font-black">{Math.round(totalTime)}s</p>
                </div>
              </div>

              {/* Wrong Answers Dropdown */}
              {gameState.answerLog && gameState.answerLog.length > 0 && (
                <details className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow">
                  <summary className="cursor-pointer text-lg font-bold text-gray-800">See sentences you missed</summary>
                  <div className="mt-4 flex flex-col gap-4">
                    {gameState.answerLog.map((entry) => (
                      <div key={entry.questionId} className="bg-gray-50/60 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-1">Incorrect sentence shown</p>
                        <p className="font-bold text-gray-800 mb-2">{entry.prompt}</p>
                        {entry.userAnswer && (
                          <p className="text-sm text-rose-700 mb-1">Your answer: {entry.userAnswer}</p>
                        )}
                        <p className="text-sm text-emerald-700">
                          Correct answer{Array.isArray(entry.correctAnswer) ? "s" : ""}:
                          {Array.isArray(entry.correctAnswer) ? (
                            <span> {entry.correctAnswer.join(" | ")}</span>
                          ) : (
                            <span> {entry.correctAnswer}</span>
                          )}
                        </p>
                        {entry.gaveUp && (
                          <p className="text-xs text-gray-500 mt-1">You chose to give up on this one.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* Right Column - Summary */}
            <div className="flex flex-col gap-8 flex-1">
              {/* Grade Level Badge */}
              <div className="text-center">
                <p className="text-lg font-bold text-gray-700 mb-2">Grade Level</p>
                <span className="inline-block bg-emerald-600/70 backdrop-blur-sm text-white px-6 py-3 rounded-full text-xl font-bold shadow-lg">
                  {gameState.gradeLevel}
                </span>
              </div>

              {/* Summary Component */}
              {gameState && (
                <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
                  <TH_Summary
                    gameState={gameState}
                    currentPlayerTotalPoints={currentPlayerTotalPoints}
                    opponentTotalPoints={opponentTotalPoints}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row w-full gap-3">
            <button
              onClick={onPlayAgain}
              className="flex-1 bg-emerald-600/70 hover:bg-emerald-700/80 text-white font-bold text-2xl px-8 py-5 rounded-2xl transition-all hover:scale-105 shadow-lg backdrop-blur-sm"
            >
              Play Again
            </button>
            <button
              onClick={onBackHome}
              className="flex-1 bg-sky-600/70 hover:bg-sky-700/80 text-white font-bold text-xl px-8 py-5 rounded-2xl transition-all hover:scale-105 shadow-lg backdrop-blur-sm"
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