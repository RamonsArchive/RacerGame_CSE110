"use client";
import React, { Dispatch, SetStateAction, useState } from "react";
import {
  GameMode,
  GameState,
  GameStatus,
  GradeLevel,
} from "@/app/constants/index_typequest";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

const TQ_SetupScreen = ({
  gameStatus,
  setGameStatus,
  gameState,
  handleGameStart,
}: {
  gameStatus: GameStatus;
  setGameStatus: Dispatch<SetStateAction<GameStatus>>;
  gameState?: GameState | null;
  handleGameStart: (
    gameMode: GameMode,
    gradeLevel: GradeLevel,
    playerName: string
  ) => void;
}) => {
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(
    gameState?.gradeLevel || "K"
  );
  const [gameMode, setGameMode] = useState<GameMode>(gameState?.mode || "solo");
  const [playerName, setPlayerName] = useState<string>(
    gameState?.currentPlayer.playerName || "You"
  );
  return (
    <div className="flex-center w-full h-dvh">
      <div className="flex flex-col w-full max-w-2xl p-10 gap-10 bg-linear-to-b from-pink-700 via-primary-900 to-secondary-800 bg-cover bg-no-repeat rounded-xl shadow-lg">
        <Link
          href="/"
          className="group flex flex-row items-center px-3 hover:cursor-pointer hover:underline hover:text-slate-300 transition-all duration-300 ease-in-out"
        >
          <ChevronLeft className="w-6 h-6 text-slate-100 group-hover:text-slate-300 group-hover:underline transition-all duration-300 ease-in-out" />
          <p className="font-bold text-md font-nunito text-slate-100 group-hover:text-slate-300 group-hover:underline transition-all duration-300 ease-in-out">
            Back To Home
          </p>
        </Link>

        <h1 className="font-nunito text-6xl font-black text-center text-slate-100 drop-shadow-2xl animate-bright-gradient">
          Type Quest
        </h1>
        <div className="flex items-center justify-between w-full gap-10">
          <div className="flex flex-col gap-2 items-start w-full">
            <p className="font-nunito text-sm text-slate-100">Grade Level</p>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
              className="bg-slate-100 text-slate-900 p-2 rounded-md w-full"
            >
              <option value="K">Kindergarten</option>
              <option value="1-2">Grades 1-2</option>
              <option value="3-4">Grades 3-4</option>
              <option value="5-6">Grades 5-6</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 items-start w-full">
            <p className="font-nunito text-sm text-slate-100">Game Mode</p>
            <select
              value={gameMode}
              onChange={(e) => setGameMode(e.target.value as GameMode)}
              className="bg-slate-100 text-slate-900 p-2 rounded-md w-full"
            >
              <option value="solo">Solo</option>
              <option value="multiplayer">Multiplayer</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => handleGameStart(gameMode, gradeLevel, playerName)}
          className="bg-green-400 text-slate-700 px-5 py-4 rounded-lg hover:cursor-pointer hover:scale-105 transition-all duration-300 ease-in-out"
        >
          <p className="font-nunito text-2xl font-black text-center">
            Start Game
          </p>
        </button>
      </div>
    </div>
  );
};

export default TQ_SetupScreen;
