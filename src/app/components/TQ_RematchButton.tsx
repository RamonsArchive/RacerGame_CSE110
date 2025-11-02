"use client";
import React, { useState, useEffect } from "react";
import { GradeLevel, GameMode } from "@/app/constants/index_typequest";

interface RematchButtonProps {
  myPlayerId: string;
  opponentId: string;
  opponentName: string;
  gradeLevel: GradeLevel;
  gameMode: GameMode;
  onRematchAccepted: (
    matchId: string,
    opponentId: string,
    opponentName: string
  ) => void;
}

const TQ_RematchButton = ({
  myPlayerId,
  opponentId,
  opponentName,
  gradeLevel,
  gameMode,
  onRematchAccepted,
}: RematchButtonProps) => {
  const [rematchStatus, setRematchStatus] = useState<
    "idle" | "waiting" | "ready"
  >("idle");
  const [matchId, setMatchId] = useState<string>("");

  // Request rematch
  const handleRematchRequest = async () => {
    try {
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
        setMatchId(data.matchId);
        setRematchStatus("waiting");
        console.log("🔄 Rematch request sent");

        // Start polling for acceptance
        pollForRematchAcceptance(data.matchId);
      }
    } catch (err) {
      console.error("Failed to request rematch:", err);
      alert("Failed to send rematch request");
    }
  };

  // Poll for rematch acceptance
  const pollForRematchAcceptance = (matchId: string) => {
    let hasCompleted = false;

    const checkInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/match?matchId=${matchId}`);
        const data = await res.json();

        if (data.ok && data.match) {
          if (data.match.status === "accepted") {
            if (hasCompleted) return; // Prevent double-triggering
            hasCompleted = true;
            clearInterval(checkInterval);
            console.log("✅ Rematch accepted!");

            // Clean up match request
            await fetch(`/api/match?matchId=${matchId}`, { method: "DELETE" });

            // Trigger rematch
            onRematchAccepted(matchId, opponentId, opponentName);
          } else if (data.match.status === "rejected") {
            if (hasCompleted) return;
            hasCompleted = true;
            clearInterval(checkInterval);
            console.log("❌ Rematch rejected");
            setRematchStatus("idle");
            alert("Opponent declined rematch");

            // Clean up rejected match
            await fetch(`/api/match?matchId=${matchId}`, { method: "DELETE" });
          }
        } else if (!data.ok && res.status === 404) {
          // ✅ Match was deleted (opponent accepted on their end)
          // This means the game is starting, so stop polling
          console.log("🎮 Match deleted - opponent accepted, starting game...");
          if (hasCompleted) return;
          hasCompleted = true;
          clearInterval(checkInterval);
          // Wait a moment for the other player to initialize the game
          setTimeout(() => {
            // If we're still waiting after 2 seconds, they probably accepted
            // and we should check if game state updated
            console.log("⏳ Waiting for game to start...");
          }, 2000);
        }
      } catch (err) {
        console.error("Failed to check rematch status:", err);
      }
    }, 1000);

    // Stop polling after 30 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (rematchStatus === "waiting" && !hasCompleted) {
        setRematchStatus("idle");
        console.log("⏱️ Rematch request timed out");
      }
    }, 30000);
  };

  // Check for incoming rematch requests (only when idle)
  useEffect(() => {
    // ✅ Only poll for incoming requests if we're not waiting for our own request
    if (rematchStatus !== "idle") {
      return;
    }

    const checkForIncomingRematch = async () => {
      try {
        const incomingMatchId = `${opponentId}_${myPlayerId}`;
        const res = await fetch(`/api/match?matchId=${incomingMatchId}`);
        const data = await res.json();

        if (data.ok && data.match && data.match.status === "pending") {
          console.log("📥 Incoming rematch request detected");
          setMatchId(incomingMatchId);
          setRematchStatus("ready");
        }
      } catch (err) {
        // No incoming request (404 is expected if no request exists)
        console.log("⏳ No incoming rematch yet");
      }
    };

    // Initial check
    checkForIncomingRematch();

    // Poll for incoming requests every 2 seconds
    const interval = setInterval(checkForIncomingRematch, 2000);

    return () => clearInterval(interval);
  }, [myPlayerId, opponentId, rematchStatus]);

  // Accept incoming rematch
  const handleAcceptRematch = async () => {
    try {
      // ✅ Step 1: Accept the match (set status to "accepted")
      await fetch("/api/match", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          status: "accepted",
        }),
      });

      console.log("✅ Accepted rematch request");

      // ✅ Step 2: Wait a moment for the other player to see the "accepted" status
      await new Promise((resolve) => setTimeout(resolve, 500));

      // ✅ Step 3: Clean up match request
      await fetch(`/api/match?matchId=${matchId}`, { method: "DELETE" });

      // ✅ Step 4: Trigger rematch
      onRematchAccepted(matchId, opponentId, opponentName);
    } catch (err) {
      console.error("Failed to accept rematch:", err);
      alert("Failed to accept rematch");
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      {rematchStatus === "idle" && (
        <button
          onClick={handleRematchRequest}
          className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
        >
          <span>🔄</span>
          Request Rematch
        </button>
      )}

      {rematchStatus === "waiting" && (
        <div className="flex items-center justify-center gap-3 w-full bg-yellow-500/20 border border-yellow-400/40 text-yellow-200 font-semibold text-lg py-4 rounded-lg backdrop-blur-sm wrap-break-words">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
          </span>
          <span>⏳ Waiting for {opponentName}...</span>
        </div>
      )}

      {rematchStatus === "ready" && (
        <button
          onClick={handleAcceptRematch}
          className="flex flex-row items-center justify-center gap-2 w-full bg-linear-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold text-lg py-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg animate-pulse wrap-break-words"
        >
          <span>🎮</span>
          <span>{opponentName} wants a rematch!</span>
        </button>
      )}
    </div>
  );
};

export default TQ_RematchButton;
