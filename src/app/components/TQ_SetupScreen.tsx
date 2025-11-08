"use client";
import React, { useState, useEffect } from "react";
import {
  GameMode,
  GameState,
  GameStatus,
  GradeLevel,
} from "@/app/constants/index_typequest";
import { ChevronLeft, Trophy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { MultiplayerPlayer } from "@/lib/GlobalTypes";
import MultiplayerSetup from "./MultiplayerSetup";
import TQ_Leaderboard from "./TQ_Leaderboard";

interface Props {
  gameStatus: GameStatus;
  handleGameStart: (
    gameMode: GameMode,
    gradeLevel: GradeLevel,
    playerName: string
  ) => void;
  multiplayerPlayers: MultiplayerPlayer[];
  multiplayerView: boolean;
  handleAcceptMatch: () => void;
  handleRejectMatch: () => void;
  joinLobby: (
    playerName: string,
    gradeLevel: GradeLevel,
    gameMode: GameMode
  ) => void;
  leaveLobby: () => void;
  handleConnect: (playerId: string, playerName: string) => void;
  incomingRequest: {
    matchId: string;
    from: string;
    gradeLevel: GradeLevel;
  } | null;
  gameState: GameState | null;
}

const TQ_SetupScreen = ({
  gameStatus,
  handleGameStart,
  multiplayerPlayers,
  multiplayerView,
  handleAcceptMatch,
  handleRejectMatch,
  joinLobby,
  leaveLobby,
  handleConnect,
  incomingRequest,
  gameState,
}: Props) => {
  // Local state for smooth typing (no parent re-renders)
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>("K");
  const [gameMode, setGameMode] = useState<GameMode>("solo");
  const [playerName, setPlayerName] = useState<string>("");
  const [leaderboardView, setLeaderboardView] = useState<boolean>(false);
  const handleStartGame = (
    gameMode: GameMode,
    gradeLevel: GradeLevel,
    playerName: string
  ) => {
    if (
      (gameMode === "multiplayer" && playerName.length < 2) ||
      playerName.length > 20
    ) {
      alert(
        "Player name must be between 2 and 20 characters long for multiplayer mode"
      );
      return;
    }
    if (gameMode === "multiplayer") {
      joinLobby(playerName, gradeLevel, gameMode);
      return;
    }
    handleGameStart(gameMode, gradeLevel, playerName);
  };

  // set player name from local stoarge
  useEffect(() => {
    const playerName = localStorage.getItem("playerName");
    const gradeLevel = localStorage.getItem("gradeLevel");
    const gameMode = localStorage.getItem("gameMode");
    if (playerName) {
      setPlayerName(playerName);
    }
    if (gradeLevel) {
      setGradeLevel(gradeLevel as GradeLevel);
    }
    if (gameMode) {
      setGameMode(gameMode as GameMode);
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

  return (
    <>
      <div
        key={gameStatus}
        className="flex-center w-full h-dvh relative overflow-hidden"
        style={{
          backgroundImage: "url(/Assets/TypeQuest/background.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-r from-black/50 via-black/30 to-transparent pointer-events-none z-0"></div>

        {/* Animated road lines - decorative scrolling effect */}
        <div
          className="absolute pointer-events-none z-1 overflow-hidden"
          style={{
            width: "150vw",
            height: "4px",
            top: "50%",
            left: "50%",
            transformOrigin: "center center",
            transform: "translate(-64%, -36%) rotate(35deg)",
          }}
        >
          <div
            className="w-full h-full animate-road-line"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent 0px, transparent 50px, rgba(255, 255, 255, 0.95) 50px, rgba(255, 255, 255, 0.95) 100px)",
              backgroundSize: "120px 100%",
            }}
          ></div>
        </div>

        {/* Car positioned above the road line */}
        <div
          className="absolute pointer-events-none z-5"
          style={{
            top: "70%",
            left: "30%",
            transformOrigin: "center center",
            transform: "translate(-33%, -67%) rotate(0deg)",
          }}
        >
          <Image
            src="/Assets/TypeQuest/car_setup.png"
            alt="Setup Car"
            width={1400}
            height={700}
            className="object-contain"
          />
        </div>

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
            <button
              onClick={() => setLeaderboardView(true)}
              className="group gap-1 flex flex-row items-center px-4 py-2 rounded-lg bg-slate-900/60 backdrop-blur-sm border-2 border-amber-400/60 animate-shine-border hover:cursor-pointer hover:bg-slate-800/80 transition-all duration-300 ease-in-out"
            >
              <Trophy className="w-5 h-5 text-amber-400 group-hover:text-amber-300 transition-all duration-300 ease-in-out" />
              <p className="font-bold text-md text-amber-400 group-hover:text-amber-300 transition-all duration-300 ease-in-out">
                Leaderboard
              </p>
            </button>
          </div>

          {/* Title - compact */}
          <h1 className="text-6xl font-black text-white leading-tight">
            Type Quest
          </h1>

          {/* Player Name Input */}
          <div className="flex flex-col gap-2 w-full max-w-md">
            <p className="text-lg text-white font-semibold">Player Name:</p>
            <input
              value={playerName}
              onChange={(e) => handlePlayerNameChange(e)}
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
                  onChange={(e) => handleGradeLevelChange(e)}
                  className="appearance-none bg-slate-900/60 backdrop-blur-sm border border-white/30 text-white text-lg p-3 pr-10 rounded-lg w-full focus:outline-none focus:border-white/50 transition-all cursor-pointer"
                  style={{
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                  }}
                >
                  <option value="K" className="bg-slate-900 text-white">
                    K
                  </option>
                  <option value="1-2" className="bg-slate-900 text-white">
                    1-2
                  </option>
                  <option value="3-4" className="bg-slate-900 text-white">
                    3-4
                  </option>
                  <option value="5-6" className="bg-slate-900 text-white">
                    5-6
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
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <p className="text-lg text-white font-semibold">Mode:</p>
              <div className="relative">
                <select
                  value={gameMode}
                  onChange={(e) => handleGameModeChange(e)}
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
            </div>
          </div>

          {/* Start Game Button */}
          <button
            onClick={() => handleStartGame(gameMode, gradeLevel, playerName)}
            className="bg-green-500 hover:bg-green-600 text-white text-xl font-bold px-6 py-4 rounded-lg hover:cursor-pointer hover:scale-105 transition-all duration-300 ease-in-out w-full max-w-md shadow-lg"
          >
            Start Game
          </button>
        </div>
      </div>

      {/* Multiplayer Setup Modal */}
      <MultiplayerSetup
        playerName={playerName}
        players={multiplayerPlayers}
        isVisible={multiplayerView}
        onClose={leaveLobby}
        onConnect={handleConnect}
        incomingRequest={incomingRequest}
        onAcceptRequest={handleAcceptMatch}
        onRejectRequest={handleRejectMatch}
      />

      <TQ_Leaderboard
        isOpen={leaderboardView}
        onClose={() => setLeaderboardView(false)}
        gradeLevel={gradeLevel}
        mode={gameMode}
        currentGameId={gameState?.gameId}
      />
    </>
  );
};

export default TQ_SetupScreen;
