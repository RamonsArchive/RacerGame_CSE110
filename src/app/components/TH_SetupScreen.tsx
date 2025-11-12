"use client";
import React, { useState } from "react";
import {
  GradeLevel,
  TreasureHuntGameState,
  GameStatus,
  GRADE_LEVEL_LABELS,
  GRADE_LEVEL_DESCRIPTIONS,
  GAME_CONFIG,
} from "@/app/constants/index_treasurehunt";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const TH_SetupScreen = ({
  gameStatus: _gameStatus,
  gameState,
  handleGameStart,
}: {
  gameStatus: GameStatus;
  gameState?: TreasureHuntGameState | null;
  handleGameStart: (gradeLevel: GradeLevel, questionCount: number) => void;
}) => {
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(
    gameState?.gradeLevel || "K"
  );
  const [questionCount, setQuestionCount] = useState<number>(
    gameState?.totalQuestions || 10
  );

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Assets/TreasureHunt/bg_4.png"
          alt="Treasure Hunt Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-center w-full h-dvh">
        <div className="flex flex-col w-full max-w-2xl p-10 gap-10 bg-white/50 backdrop-blur-md rounded-xl shadow-lg">
        <Link
          href="/"
          className="group flex flex-row items-center px-3 hover:cursor-pointer hover:underline hover:text-gray-700 transition-all duration-300 ease-in-out w-fit"
        >
          <ChevronLeft className="w-6 h-6 text-gray-800 group-hover:text-gray-700 group-hover:underline transition-all duration-300 ease-in-out" />
          <p className="font-bold text-md font-nunito text-gray-800 group-hover:text-gray-700 group-hover:underline transition-all duration-300 ease-in-out">
            Back To Home
          </p>
        </Link>

        <h1 className="font-nunito text-6xl font-black text-center text-gray-800 drop-shadow-2xl">
          Treasure Hunt
        </h1>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="font-nunito text-lg font-semibold text-gray-800">
              Select Grade Level
            </p>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
              className="bg-white/60 backdrop-blur-sm text-gray-900 p-3 rounded-lg text-lg font-nunito focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-300"
            >
              <option value="K">{GRADE_LEVEL_LABELS.K}</option>
              <option value="1-2">{GRADE_LEVEL_LABELS["1-2"]}</option>
              <option value="3-4">{GRADE_LEVEL_LABELS["3-4"]}</option>
              <option value="5-6">{GRADE_LEVEL_LABELS["5-6"]}</option>
            </select>
            <p className="font-nunito text-sm text-gray-700 mt-2">
              {GRADE_LEVEL_DESCRIPTIONS[gradeLevel]}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-nunito text-lg font-semibold text-gray-800">
              Number of Questions
            </p>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="bg-white/60 backdrop-blur-sm text-gray-900 p-3 rounded-lg text-lg font-nunito focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-300"
            >
              {Array.from(
                {
                  length:
                    GAME_CONFIG.MAX_QUESTIONS - GAME_CONFIG.MIN_QUESTIONS + 1,
                },
                (_, i) => GAME_CONFIG.MIN_QUESTIONS + i
              ).map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? "question" : "questions"}
                </option>
              ))}
            </select>
            <p className="font-nunito text-sm text-gray-700 mt-2">
              Choose how many grammar challenges you want to complete!
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg">
            <p className="font-nunito text-sm text-gray-800">
              <strong className="text-green-600">How to play:</strong>{" "}
              You&apos;ll be shown grammatically incorrect sentences. Type the
              correct version to advance through the treasure hunt!
            </p>
          </div>
        </div>

        <button
          onClick={() => handleGameStart(gradeLevel, questionCount)}
          className="bg-green-400/70 backdrop-blur-sm text-gray-800 px-5 py-4 rounded-lg hover:cursor-pointer hover:bg-green-500/80 hover:scale-105 transition-all duration-300 ease-in-out"
        >
          <p className="font-nunito text-2xl font-black text-center">
            Start Game
          </p>
        </button>
        </div>
      </div>
    </div>
  );
};

export default TH_SetupScreen;
