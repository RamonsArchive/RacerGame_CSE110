"use client";
import React from "react";
import { TreasureHuntGameState } from "@/app/constants/index_treasurehunt";
import { createGameResult } from "@/lib/utils_treasurehunt";
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
  const result = createGameResult(gameState);
  const accuracy = result.accuracy;

  // Determine message based on performance
  const getPerformanceMessage = () => {
    if (accuracy >= 90) {
      return { emoji: "🌟", text: "Outstanding!", color: "from-yellow-400 to-orange-500" };
    } else if (accuracy >= 75) {
      return { emoji: "👏", text: "Great job!", color: "from-green-400 to-blue-500" };
    } else if (accuracy >= 60) {
      return { emoji: "👍", text: "Good work!", color: "from-blue-400 to-purple-500" };
    } else {
      return { emoji: "💪", text: "Keep practicing!", color: "from-orange-400 to-red-500" };
    }
  };

  const performance = getPerformanceMessage();

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background image matching provided art */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/Assets/TreasureHunt/finished_screen_bg.png"
          alt="Treasure Hunt Finish Background"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>


      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center w-full h-screen p-4 overflow-y-auto">
        <div className="flex flex-col w-full max-w-3xl gap-8 bg-white/95 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border-4 border-emerald-400 my-4">
          {/* Header */}
          <Link
            href="/"
            className="group flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all hover:scale-105 w-fit"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>

          {/* Treasure Chest Image */}
          <div className="flex justify-center">
            <div className="relative w-48 h-48 animate-bounce">
              <Image
                src="/Assets/TreasureHunt/treasure_chest.png"
                alt="Treasure Chest"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-black text-center text-emerald-700 drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)]">
            🏴‍☠️ Treasure Found! 🏴‍☠️
          </h1>

          {/* Performance Message */}
          <div className="text-center p-6 rounded-2xl bg-emerald-100 text-emerald-800 shadow-lg border border-emerald-300">
            <p className="text-5xl mb-2">{performance.emoji}</p>
            <h2 className="text-4xl font-extrabold">{performance.text}</h2>
            <p className="text-xl mt-2">You completed all {gameState.totalQuestions} grammar challenges!</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 p-6 rounded-2xl text-emerald-800 shadow border border-emerald-200">
              <p className="text-lg font-bold mb-2">⭐ Score</p>
              <p className="text-4xl font-black">{gameState.score}/{gameState.totalQuestions}</p>
            </div>
            <div className="bg-emerald-50 p-6 rounded-2xl text-emerald-800 shadow border border-emerald-200">
              <p className="text-lg font-bold mb-2">🎯 Accuracy</p>
              <p className="text-4xl font-black">{accuracy.toFixed(1)}%</p>
            </div>
            <div className="bg-rose-50 p-6 rounded-2xl text-rose-700 shadow border border-rose-200">
              <p className="text-lg font-bold mb-2">😅 Mistakes</p>
              <p className="text-4xl font-black">{gameState.mistakes}</p>
            </div>
            <div className="bg-sky-50 p-6 rounded-2xl text-sky-700 shadow border border-sky-200">
              <p className="text-lg font-bold mb-2">⏱️ Time</p>
              <p className="text-4xl font-black">{Math.round(result.totalTime)}s</p>
            </div>
          </div>

          {/* Grade Level Badge */}
          <div className="text-center">
            <p className="text-lg font-bold text-gray-700 mb-2">Grade Level</p>
            <span className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-full text-xl font-bold shadow-lg">
              {gameState.gradeLevel}
            </span>
          </div>

          {/* Wrong Answers Dropdown */}
          {gameState.answerLog && gameState.answerLog.length > 0 && (
            <details className="bg-white border border-gray-200 rounded-2xl p-5 shadow">
              <summary className="cursor-pointer text-lg font-bold text-gray-800">See sentences you missed</summary>
              <div className="mt-4 flex flex-col gap-4">
                {gameState.answerLog.map((entry) => (
                  <div key={entry.questionId} className="bg-gray-50 border rounded-xl p-4">
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

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={onPlayAgain}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-2xl px-8 py-5 rounded-2xl transition-all hover:scale-105 shadow-lg"
            >
              🎮 Play Again
            </button>
            <button
              onClick={onBackHome}
              className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xl px-8 py-5 rounded-2xl transition-all hover:scale-105 shadow-lg"
            >
              🏠 Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TH_FinishedScreen;
