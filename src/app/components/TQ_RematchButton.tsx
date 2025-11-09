"use client";
import React, { useState } from "react";
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
  gameMode: _gameMode,
  onRematchAccepted,
}: RematchButtonProps) => {
  const [rematchStatus, setRematchStatus] = useState<
    "idle" | "waiting" | "ready" | "rejected"
  >("idle");
  const [_matchId, setMatchId] = useState<string>("");

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
      } else {
        // Handle error (e.g., match already exists)
        console.error("Failed to create rematch request:", data.error);
        alert("Failed to send rematch request");
      }
    } catch (err) {
      console.error("Failed to request rematch:", err);
      alert("Failed to send rematch request");
    }
  };

  // Poll for rematch acceptance
  const pollForRematchAcceptance = (matchId: string) => {
    let hasCompleted = false;
    let lastSeenStatus: "pending" | "accepted" | "rejected" | null = null;

    const checkInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/match?matchId=${matchId}`);
        const data = await res.json();

        if (data.ok && data.match) {
          // Track the status we see
          lastSeenStatus = data.match.status as
            | "pending"
            | "accepted"
            | "rejected";

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
            setRematchStatus("rejected");

            // Clean up rejected match
            await fetch(`/api/match?matchId=${matchId}`, { method: "DELETE" });

            // Reset to idle after 5 seconds
            setTimeout(() => {
              setRematchStatus("idle");
            }, 5000);
          }
        } else if (!data.ok && res.status === 404) {
          // ✅ Match was deleted
          if (hasCompleted) return;

          if (lastSeenStatus === "accepted") {
            // We saw "accepted" before deletion, so opponent accepted and started game
            hasCompleted = true;
            clearInterval(checkInterval);
            console.log("🎮 Match deleted after acceptance - starting game...");
            onRematchAccepted(matchId, opponentId, opponentName);
          } else if (lastSeenStatus === "rejected") {
            // We saw "rejected" before deletion, so opponent rejected it
            hasCompleted = true;
            clearInterval(checkInterval);
            console.log("❌ Match deleted after rejection");
            setRematchStatus("rejected");
            setTimeout(() => {
              setRematchStatus("idle");
            }, 5000);
          } else {
            // Match was deleted but we never saw accepted/rejected
            // Since Player B no longer deletes the match (only Player A does after seeing "accepted"),
            // this shouldn't happen unless there's a timeout or manual deletion
            // If we're still waiting, continue polling in case the match was just slow to update
            console.log(
              "⚠️ Match deleted without seeing status - continuing to poll..."
            );
            // Don't stop polling yet - the match might have been deleted by timeout
            // Continue polling for a bit more to see if status appears
          }
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

  return (
    <div className="flex flex-col flex-1">
      {rematchStatus === "waiting" ? (
        <div className="flex items-center justify-center gap-3 w-full bg-yellow-500/20 border border-yellow-400/40 text-yellow-200 font-semibold text-lg px-6 py-4 rounded-lg backdrop-blur-sm">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
          </span>
          <span>⏳ Waiting for {opponentName}...</span>
        </div>
      ) : rematchStatus === "rejected" ? (
        <div className="flex items-center justify-center gap-3 w-full bg-red-500/20 border border-red-400/40 text-red-200 font-semibold text-lg px-6 py-4 rounded-lg backdrop-blur-sm">
          <span>❌</span>
          <span>{opponentName} declined rematch</span>
        </div>
      ) : (
        <button
          onClick={handleRematchRequest}
          className="flex items-center justify-center gap-2 w-full bg-green-600/90 hover:bg-green-700/90 text-white font-bold text-lg px-6 py-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
        >
          <span>🔄</span>
          Request Rematch
        </button>
      )}
    </div>
  );
};

export default TQ_RematchButton;
