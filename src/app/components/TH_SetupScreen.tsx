"use client";
import React, { useState, useEffect } from "react";
import {
  GradeLevel,
  TreasureHuntGameState,
  GameStatus,
  GameMode,
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
  handleGameStart: (
    gameMode: GameMode,
    gradeLevel: GradeLevel,
    playerName: string,
    questionCount: number
  ) => void;
}) => {
  // Local state for smooth typing (no parent re-renders)
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(
    gameState?.gradeLevel || "K"
  );
  const [gameMode, setGameMode] = useState<GameMode>("solo");
  const [playerName, setPlayerName] = useState<string>("");
  const [questionCount, setQuestionCount] = useState<number>(
    gameState?.totalQuestions || GAME_CONFIG.DEFAULT_QUESTIONS
  );

  // Set player name, grade level, and game mode from local storage
  useEffect(() => {
    const savedPlayerName = localStorage.getItem("playerName");
    const savedGradeLevel = localStorage.getItem("gradeLevel");
    const savedGameMode = localStorage.getItem("gameMode");
    if (savedPlayerName) {
      setPlayerName(savedPlayerName);
    }
    if (savedGradeLevel) {
      setGradeLevel(savedGradeLevel as GradeLevel);
    }
    if (savedGameMode) {
      setGameMode(savedGameMode as GameMode);
    }
  }, []);

  const handlePlayerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerName(e.target.value);
    localStorage.setItem("playerName", e.target.value);
  };

  const handleGradeLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGradeLevel(e.target.value as GradeLevel);
    localStorage.setItem("gradeLevel", e.target.value);
  };

  const handleGameModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGameMode(e.target.value as GameMode);
    localStorage.setItem("gameMode", e.target.value);
  };

  const handleStartGame = (
    gameMode: GameMode,
    gradeLevel: GradeLevel,
    playerName: string,
    questionCount: number
  ) => {
    if (gameMode === "multiplayer") {
      alert("Coming soon! Please select Solo mode.");
      return;
    }
    if (playerName.length < 1 || playerName.length > 20) {
      alert("Player name must be between 1 and 20 characters long");
      return;
    }
    handleGameStart(gameMode, gradeLevel, playerName, questionCount);
  };

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
            {/* Player Name Input */}
            <div className="flex flex-col gap-2">
              <p className="font-nunito text-lg font-semibold text-gray-800">
                Player Name
              </p>
              <input
                value={playerName}
                onChange={handlePlayerNameChange}
                className="bg-white/60 backdrop-blur-sm text-gray-900 p-3 rounded-lg text-lg font-nunito focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-300"
                placeholder="Enter your name"
              />
            </div>

            {/* Grade & Mode - side by side */}
            <div className="flex gap-4">
              <div className="flex flex-col gap-2 flex-1">
                <p className="font-nunito text-lg font-semibold text-gray-800">
                  Select Grade Level
                </p>
                <select
                  value={gradeLevel}
                  onChange={handleGradeLevelChange}
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

              <div className="flex flex-col gap-2 flex-1">
                <p className="font-nunito text-lg font-semibold text-gray-800">
                  Mode
                </p>
                <select
                  value={gameMode}
                  onChange={handleGameModeChange}
                  className="bg-white/60 backdrop-blur-sm text-gray-900 p-3 rounded-lg text-lg font-nunito focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-300"
                >
                  <option value="solo">Solo</option>
                  <option value="multiplayer">Multiplayer</option>
                </select>
                {gameMode === "multiplayer" && (
                  <p className="font-nunito text-sm text-yellow-600 mt-2">
                    ⚠️ Multiplayer coming soon! Please select Solo mode.
                  </p>
                )}
              </div>
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

          {/* Start Game Button */}
          <button
            onClick={() =>
              handleStartGame(gameMode, gradeLevel, playerName, questionCount)
            }
            className="bg-green-400/70 backdrop-blur-sm text-gray-800 px-5 py-4 rounded-lg hover:cursor-pointer hover:bg-green-500/80 hover:scale-105 transition-all duration-300 ease-in-out"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default TH_SetupScreen;
