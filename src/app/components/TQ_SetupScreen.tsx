"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  GameMode,
  GameState,
  GameStatus,
  GradeLevel,
} from "@/app/constants/index_typequest";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { MultiplayerPlayer } from "@/lib/GlobalTypes";
import MultiplayerSetup from "./MultiplayerSetup";

const TQ_SetupScreen = ({
  gameStatus,
  gameState,
  handleGameStart,
}: {
  gameStatus: GameStatus;
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
  const [multiplayer, setMultiplayer] = useState<boolean>(
    gameState?.mode === "multiplayer"
  );
  const [multiplayerView, setMultiplayerView] = useState<boolean>(false);
  const [multiplayerPlayers, setMultiplayerPlayers] = useState<
    MultiplayerPlayer[]
  >([]);
  const [playerName, setPlayerName] = useState<string>(
    gameState?.currentPlayer.playerName || "You"
  );
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<{
    matchId: string;
    from: string;
    gradeLevel: string;
  } | null>(null);

  // Join lobby and start polling for players
  const joinLobby = async () => {
    try {
      const res = await fetch("/api/lobby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playerName,
          gradeLevel,
          gameMode,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMyPlayerId(data.player.id);
        setMultiplayerView(true);
        startPollingPlayers(data.player.id);
      } else {
        alert(data.error || "Failed to join lobby");
      }
    } catch (err) {
      alert("Failed to connect to lobby");
      console.error(err);
    }
  };

  // Poll for available players AND incoming match requests
  const startPollingPlayers = (myId: string) => {
    const pollPlayers = async () => {
      try {
        // Fetch available players
        const res = await fetch(`/api/lobby?exclude=${myId}`);
        const data = await res.json();
        if (data.ok) {
          setMultiplayerPlayers(data.players);
        }

        // Check for incoming match requests
        const lobbyPlayers = data.players || [];
        for (const player of lobbyPlayers) {
          const matchId = `${player.id}_${myId}`;
          const matchRes = await fetch(`/api/match?matchId=${matchId}`);
          const matchData = await matchRes.json();

          if (matchData.ok && matchData.match?.status === "pending") {
            setIncomingRequest({
              matchId,
              from: player.name,
              gradeLevel: matchData.match.gradeLevel,
            });
            break; // Only show one request at a time
          }
        }
      } catch (err) {
        console.error("Failed to fetch players:", err);
      }
    };

    // Initial fetch
    pollPlayers();

    // Poll every 2 seconds
    pollIntervalRef.current = setInterval(pollPlayers, 2000);
  };

  // Stop polling and leave lobby
  const leaveLobby = async () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (myPlayerId) {
      try {
        await fetch("/api/lobby", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: myPlayerId }),
        });
      } catch (err) {
        console.error("Failed to leave lobby:", err);
      }
    }

    setMultiplayerView(false);
    setMyPlayerId(null);
    setMultiplayerPlayers([]);
  };

  // Update handleConnect to create match request
  const handleConnect = async (opponentId: string) => {
    const res = await fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requesterId: myPlayerId,
        targetId: opponentId,
        gradeLevel,
      }),
    });

    const data = await res.json();
    if (data.ok) {
      // Poll for acceptance
      waitForMatchAcceptance(data.matchId);
    }
  };

  // Poll to check if opponent accepted
  const waitForMatchAcceptance = (matchId: string) => {
    const checkInterval = setInterval(async () => {
      const res = await fetch(`/api/match?matchId=${matchId}`);
      const data = await res.json();

      if (data.match?.status === "accepted") {
        clearInterval(checkInterval);
        // START GAME!
        leaveLobby();
        handleGameStart(gameMode, gradeLevel, playerName);
      } else if (data.match?.status === "rejected") {
        clearInterval(checkInterval);
        alert("Match request declined");
      }
    }, 1000);
  };

  // Accept incoming match request
  const handleAcceptMatch = async () => {
    if (!incomingRequest) return;

    try {
      await fetch("/api/match", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: incomingRequest.matchId,
          status: "accepted",
        }),
      });

      // Start game!
      leaveLobby();
      handleGameStart(gameMode, gradeLevel, playerName);
    } catch (err) {
      console.error("Failed to accept match:", err);
    }
  };

  // Reject incoming match request
  const handleRejectMatch = async () => {
    if (!incomingRequest) return;

    try {
      await fetch("/api/match", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: incomingRequest.matchId,
          status: "rejected",
        }),
      });

      setIncomingRequest(null);
    } catch (err) {
      console.error("Failed to reject match:", err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleStartGame = (
    gameMode: GameMode,
    gradeLevel: GradeLevel,
    playerName: string
  ) => {
    if (gameMode === "multiplayer" && playerName.length < 3) {
      alert(
        "Player name must be at least 3 characters long for multiplayer mode"
      );
      return;
    }
    if (gameMode === "multiplayer") {
      joinLobby();
      return;
    }
    handleGameStart(gameMode, gradeLevel, playerName);
  };

  return (
    <>
      <div key={gameStatus} className="flex-center w-full h-dvh">
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
          <div className="flex flex-col gap-3 items-start w-full">
            <div className="flex flex-col gap-2 items-start w-full">
              <p className="font-nunito text-sm text-slate-100">Player Name</p>
              <input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-slate-100 text-slate-900 p-2 rounded-md w-full"
              />
            </div>
            <div className="flex items-center justify-between w-full gap-10">
              <div className="flex flex-col gap-2 items-start w-full">
                <p className="font-nunito text-sm text-slate-100">
                  Grade Level
                </p>
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
          </div>
          <button
            onClick={() => handleStartGame(gameMode, gradeLevel, playerName)}
            className="bg-green-400 text-slate-700 px-5 py-4 rounded-lg hover:cursor-pointer hover:scale-105 transition-all duration-300 ease-in-out"
          >
            <p className="font-nunito text-2xl font-black text-center">
              Start Game
            </p>
          </button>
        </div>
      </div>
      <MultiplayerSetup
        players={multiplayerPlayers}
        isVisible={multiplayerView}
        onClose={leaveLobby}
        onConnect={handleConnect}
        playerName={playerName}
        incomingRequest={incomingRequest}
        onAcceptRequest={handleAcceptMatch}
        onRejectRequest={handleRejectMatch}
      />
    </>
  );
};

export default TQ_SetupScreen;
