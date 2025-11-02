"use client";
import React, { useState } from "react";
import {
  GameMode,
  GameState,
  GameStatus,
  GradeLevel,
} from "@/app/constants/index_typequest";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
}: Props) => {
  // Local state for smooth typing (no parent re-renders)
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>("K");
  const [gameMode, setGameMode] = useState<GameMode>("solo");
  const [playerName, setPlayerName] = useState<string>("Player");

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

  return (
    <div 
      key={gameStatus} 
      className="flex-center w-full h-dvh relative overflow-hidden"
      style={{
        backgroundImage: 'url(/Assets/TypeQuest/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Background gradient overlay - darker on left, transparent on right */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent pointer-events-none z-0"></div>
      
      {/* Animated road lines - decorative scrolling effect at 35 degrees */}
      <div 
        className="absolute pointer-events-none z-[1] overflow-hidden" 
        style={{
          width: '150vw',
          height: '4px',
          top: '50%',
          left: '50%',
          transformOrigin: 'center center',
          transform: 'translate(-64%, -36%) rotate(35deg)',
        }}
      >
        <div 
          className="w-full h-full animate-road-line" 
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 50px, rgba(255, 255, 255, 0.95) 50px, rgba(255, 255, 255, 0.95) 100px)',
            backgroundSize: '120px 100%',
          }}
        ></div>
      </div>
      
      {/* Car positioned above the road line - behind text */}
      <div 
        className="absolute pointer-events-none z-[5]" 
        style={{
          top: '70%',
          left: '30%',
          transformOrigin: 'center center',
          transform: 'translate(-33%, -67%) rotate(0deg)',
        }}
      >
        <Image
          src="/Assets/TypeQuest/car_setup.png"
          alt="Setup Car"
          width={1600}
          height={800}
          className="object-contain"
        />
      </div>
      
      {/* Content aligned to left */}
      <div className="flex flex-col items-start justify-start p-10 gap-8 relative z-10 max-w-3xl">
        <Link
          href="/"
          className="group flex flex-row items-center px-4 py-2 rounded-lg bg-slate-900/60 backdrop-blur-sm border border-white/20 hover:cursor-pointer hover:bg-slate-800/80 hover:border-white/30 transition-all duration-300 ease-in-out"
        >
          <ChevronLeft className="w-6 h-6 text-white group-hover:text-slate-300 transition-all duration-300 ease-in-out" />
          <p className="font-bold text-lg text-white group-hover:text-slate-300 transition-all duration-300 ease-in-out">
            Back to Home
          </p>
        </Link>

        {/* Title - split into two lines */}
        <div className="flex flex-col">
          <h1 className="text-7xl md:text-8xl font-black text-white leading-tight">
            Type Racer
          </h1>
          <h1 className="text-7xl md:text-8xl font-black text-white leading-tight">
            Championship
          </h1>
        </div>

        {/* Game Mode Selection */}
        <div className="flex flex-col gap-3 w-full max-w-md">
          <p className="text-2xl md:text-3xl text-white font-semibold">Select game mode:</p>
          <select
            value={gameMode}
            onChange={(e) => setGameMode(e.target.value as GameMode)}
            className="bg-transparent backdrop-blur-sm border border-white/30 text-white text-2xl p-4 rounded-lg w-full focus:outline-none focus:border-white/50 transition-all"
            style={{ backgroundColor: 'transparent' }}
          >
            <option value="solo" className="bg-slate-900 text-white">Solo</option>
            <option value="multiplayer" className="bg-slate-900 text-white">Multiplayer</option>
          </select>
        </div>

        {/* Grade Level Selection */}
        <div className="flex flex-col gap-3 w-full max-w-md">
          <p className="text-2xl md:text-3xl text-white font-semibold">Grade Level:</p>
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
            className="bg-transparent backdrop-blur-sm border border-white/30 text-white text-2xl p-4 rounded-lg w-full focus:outline-none focus:border-white/50 transition-all"
            style={{ backgroundColor: 'transparent' }}
          >
            <option value="K" className="bg-slate-900 text-white">Kindergarten</option>
            <option value="1-2" className="bg-slate-900 text-white">Grades 1-2</option>
            <option value="3-4" className="bg-slate-900 text-white">Grades 3-4</option>
            <option value="5-6" className="bg-slate-900 text-white">Grades 5-6</option>
          </select>
        </div>

        {/* Start Game Button */}
        <button
          onClick={() => handleGameStart(gameMode, gradeLevel, playerName)}
          className="bg-slate-900/60 backdrop-blur-sm border border-white/20 text-white text-2xl font-bold px-8 py-5 rounded-lg hover:cursor-pointer hover:bg-slate-800/80 hover:border-white/30 hover:scale-105 transition-all duration-300 ease-in-out w-full max-w-md"
        >
          Start Game
        </button>
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
    </>
  );
};

export default TQ_SetupScreen;
