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
    <div
      key={_gameStatus}
      className="flex-center w-full h-dvh relative overflow-hidden"
      style={{
        backgroundImage: "url(/Assets/TreasureHunt/game_background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-r from-black/50 via-black/30 to-transparent pointer-events-none z-0"></div>

      {/* Content - more compact */}
      <div className="flex flex-col items-start justify-start p-8 gap-5 relative z-10 max-w-2xl">
        <div className="flex w-full items-center justify-between gap-2">
          <Link
            href="/"
            className="group flex flex-row items-center px-4 py-2 rounded-lg bg-slate-900/60 backdrop-blur-sm border border-white/20 hover:cursor-pointer hover:bg-slate-800/80 hover:border-white/30 transition-all duration-300 ease-in-out"
          >
            <ChevronLeft className="w-5 h-5 text-white group-hover:text-slate-300 transition-all duration-300 ease-in-out" />
            <p className="font-bold text-md text-white group-hover:text-slate-300 transition-all duration-300 ease-in-out">
              Back to Home
            </p>
          </Link>
        </div>

        {/* Title - compact */}
        <h1 className="text-6xl font-black text-white leading-tight">
          Treasure Hunt
        </h1>

        {/* Player Name Input */}
        <div className="flex flex-col gap-2 w-full max-w-md">
          <p className="text-lg text-white font-semibold">Player Name:</p>
          <input
            value={playerName}
            onChange={handlePlayerNameChange}
            className="bg-slate-900/60 backdrop-blur-sm border border-white/30 text-white text-lg p-3 rounded-lg w-full focus:outline-none focus:border-white/50 transition-all placeholder:text-slate-400"
            placeholder="Enter your name"
          />
        </div>

        {/* Grade & Mode - side by side */}
        <div className="flex gap-4 w-full max-w-md">
          <div className="flex flex-col gap-2 flex-1">
            <p className="text-lg text-white font-semibold">Grade:</p>
            <div className="relative">
              <select
                value={gradeLevel}
                onChange={handleGradeLevelChange}
                className="appearance-none bg-slate-900/60 backdrop-blur-sm border border-white/30 text-white text-lg p-3 pr-10 rounded-lg w-full focus:outline-none focus:border-white/50 transition-all cursor-pointer"
                style={{
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                }}
              >
                <option value="K" className="bg-slate-900 text-white">
                  {GRADE_LEVEL_LABELS.K}
                </option>
                <option value="1-2" className="bg-slate-900 text-white">
                  {GRADE_LEVEL_LABELS["1-2"]}
                </option>
                <option value="3-4" className="bg-slate-900 text-white">
                  {GRADE_LEVEL_LABELS["3-4"]}
                </option>
                <option value="5-6" className="bg-slate-900 text-white">
                  {GRADE_LEVEL_LABELS["5-6"]}
                </option>
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-white/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            <p className="text-sm text-slate-300 mt-2">
              {GRADE_LEVEL_DESCRIPTIONS[gradeLevel]}
            </p>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <p className="text-lg text-white font-semibold">Mode:</p>
            <div className="relative">
              <select
                value={gameMode}
                onChange={handleGameModeChange}
                className="appearance-none bg-slate-900/60 backdrop-blur-sm border border-white/30 text-white text-lg p-3 pr-10 rounded-lg w-full focus:outline-none focus:border-white/50 transition-all cursor-pointer"
                style={{
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                }}
              >
                <option value="solo" className="bg-slate-900 text-white">
                  Solo
                </option>
                <option
                  value="multiplayer"
                  className="bg-slate-900 text-white"
                >
                  Multiplayer
                </option>
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-white/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            {gameMode === "multiplayer" && (
              <p className="text-sm text-yellow-300 mt-2">
                ⚠️ Multiplayer coming soon! Please select Solo mode.
              </p>
            )}
          </div>
        </div>

        {/* Number of Questions */}
        <div className="flex flex-col gap-2 w-full max-w-md">
          <p className="text-lg text-white font-semibold">
            Number of Questions
          </p>
          <div className="relative">
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="appearance-none bg-slate-900/60 backdrop-blur-sm border border-white/30 text-white text-lg p-3 pr-10 rounded-lg w-full focus:outline-none focus:border-white/50 transition-all cursor-pointer"
              style={{
                WebkitAppearance: "none",
                MozAppearance: "none",
              }}
            >
              {Array.from(
                {
                  length:
                    GAME_CONFIG.MAX_QUESTIONS - GAME_CONFIG.MIN_QUESTIONS + 1,
                },
                (_, i) => GAME_CONFIG.MIN_QUESTIONS + i
              ).map((num) => (
                <option key={num} value={num} className="bg-slate-900 text-white">
                  {num} {num === 1 ? "question" : "questions"}
                </option>
              ))}
            </select>
            {/* Custom dropdown arrow */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="w-5 h-5 text-white/70"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
          <p className="text-sm text-slate-300 mt-2">
            Choose how many grammar challenges you want to complete!
          </p>
        </div>

        {/* Start Game Button */}
        <button
          onClick={() =>
            handleStartGame(gameMode, gradeLevel, playerName, questionCount)
          }
          className="bg-green-500 hover:bg-green-600 text-white text-xl font-bold px-6 py-4 rounded-lg hover:cursor-pointer hover:scale-105 transition-all duration-300 ease-in-out w-full max-w-md shadow-lg"
        >
          Start Game
        </button>
      </div>
    </div>
  );
};

export default TH_SetupScreen;
