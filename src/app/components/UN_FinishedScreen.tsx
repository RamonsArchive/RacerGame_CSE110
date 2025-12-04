"use client";
import React from "react";
import { UnscrambleGameState } from "../constants/index_unscramble";
import { createGameResult } from "@/lib/utils_unscramble";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const UN_FinishedScreen = ({
  gameState,
  onPlayAgain,
  onBackHome,
}: {
  gameState: UnscrambleGameState;
  onPlayAgain: () => void;
  onBackHome: () => void;
}) => {
  // ✅ Calculate accuracy: correct answers / total attempts
  // If totalAttempts is 0 or undefined, default to score/totalQuestions (all correct)
  const totalAttempts =
    gameState.totalAttempts || gameState.totalQuestions || 1;
  const accuracy =
    totalAttempts > 0 ? (gameState.score / totalAttempts) * 100 : 100;

  const result = createGameResult(gameState);
  result.accuracy = Math.round(accuracy * 10) / 10; // Round to 1 decimal place

  // Determine message based on performance
  const getPerformanceMessage = () => {
    if (accuracy >= 90) {
      return {
        emoji: "🌟",
        text: "Outstanding!",
        color: "from-yellow-400 to-orange-500",
      };
    } else if (accuracy >= 75) {
      return {
        emoji: "👏",
        text: "Great job!",
        color: "from-green-400 to-blue-500",
      };
    } else if (accuracy >= 60) {
      return {
        emoji: "👍",
        text: "Good work!",
        color: "from-blue-400 to-purple-500",
      };
    } else {
      return {
        emoji: "💪",
        text: "Keep practicing!",
        color: "from-orange-400 to-red-500",
      };
    }
  };

  const performance = getPerformanceMessage();

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      {/* Background image matching provided art */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/Assets/Unscramble/unscramble.png"
          alt="Unscramble Finish Background"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>

      {/* Main Content - Full-height card that fills most of the screen */}
      <div className="relative z-10 flex items-center justify-center w-full h-dvh p-6">
        <div className="flex flex-col w-full max-w-4xl h-[88vh] gap-6 bg-white/60 backdrop-blur-md p-8 rounded-3xl shadow-2xl overflow-y-auto scrollbar-hidden">
          {/* Header - Larger */}
          <div className="flex items-center justify-between shrink-0">
            <Link
              href="/"
              className="group flex items-center gap-2 px-4 py-2 bg-blue-500/70 hover:bg-blue-600/70 text-white rounded-lg text-base font-bold transition-all hover:scale-105 backdrop-blur-sm"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            <span className="bg-emerald-600 text-white px-5 py-2 rounded-full text-base font-bold shadow">
              {gameState.gradeLevel}
            </span>
          </div>

          {/* Title - Larger */}
          <h1 className="text-4xl md:text-5xl font-black text-center text-emerald-700 drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)] shrink-0">
            The words have been unscrambled!
          </h1>

          {/* Performance Message - Larger */}
          <div className="text-center p-5 rounded-xl bg-emerald-100 text-emerald-800 shadow shrink-0">
            <p className="text-4xl mb-2">{performance.emoji}</p>
            <h2 className="text-3xl font-extrabold">{performance.text}</h2>
            <p className="text-base mt-2">
              Completed {gameState.totalQuestions} challenges!
            </p>
          </div>

          {/* Stats Grid - Larger */}
          <div className="grid grid-cols-4 gap-3 shrink-0">
            <div className="bg-emerald-50 p-5 rounded-xl text-emerald-800 shadow text-center">
              <p className="text-sm font-bold mb-2">⭐ Score</p>
              <p className="text-3xl font-black">
                {gameState.score}/{gameState.totalQuestions}
              </p>
            </div>
            <div className="bg-emerald-50 p-5 rounded-xl text-emerald-800 shadow text-center">
              <p className="text-sm font-bold mb-2">🎯 Accuracy</p>
              <p className="text-3xl font-black">{accuracy.toFixed(1)}%</p>
            </div>
            <div className="bg-rose-50 p-5 rounded-xl text-rose-700 shadow text-center">
              <p className="text-sm font-bold mb-2">😅 Mistakes</p>
              <p className="text-3xl font-black">{gameState.mistakes}</p>
            </div>
            <div className="bg-sky-50 p-5 rounded-xl text-sky-700 shadow text-center">
              <p className="text-sm font-bold mb-2">⏱️ Time</p>
              <p className="text-3xl font-black">
                {Math.round(result.totalTime)}s
              </p>
            </div>
          </div>

          {/* Wrong Answers Dropdown - Can overflow */}
          {gameState.answerLog && gameState.answerLog.length > 0 && (
            <details className="bg-white rounded-xl p-4 shadow shrink-0">
              <summary className="cursor-pointer text-base font-bold text-gray-800">
                See sentences you missed ({gameState.answerLog.length})
              </summary>
              <div className="mt-4 flex flex-col gap-3 max-h-[40vh] overflow-y-auto scrollbar-hidden">
                {gameState.answerLog.map((entry) => (
                  <div
                    key={entry.questionId}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <p className="text-sm text-gray-500 mb-2">
                      Incorrect sentence shown
                    </p>
                    <p className="font-bold text-base text-gray-800 mb-2">
                      {entry.prompt}
                    </p>
                    {entry.userAnswer && (
                      <p className="text-sm text-rose-700 mb-2">
                        Your answer: {entry.userAnswer}
                      </p>
                    )}
                    <p className="text-sm text-emerald-700">
                      Correct answer
                      {Array.isArray(entry.correctAnswer) ? "s" : ""}:
                      {Array.isArray(entry.correctAnswer) ? (
                        <span> {entry.correctAnswer.join(" | ")}</span>
                      ) : (
                        <span> {entry.correctAnswer}</span>
                      )}
                    </p>
                    {entry.gaveUp && (
                      <p className="text-xs text-gray-500 mt-2">
                        You chose to give up on this one.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Action Buttons - Larger */}
          <div className="flex flex-col md:flex-row gap-5 shrink-0">
            <button
              onClick={onPlayAgain}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xl px-6 py-4 rounded-xl transition-all hover:scale-105 shadow-lg"
            >
              🎮 Play Again
            </button>
            <button
              onClick={onBackHome}
              className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-lg px-6 py-4 rounded-xl transition-all hover:scale-105 shadow-lg"
            >
              🏠 Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UN_FinishedScreen;
