"use client";
import React, { useState, useEffect, useRef } from "react";
import { GameMode, GradeLevel } from "../constants/index_typequest";

interface TQ_RematchAcceptToastProps {
  myPlayerId?: string | null;
  opponentId?: string | null;
  opponentName?: string;
  matchId: string;
  gradeLevel: GradeLevel;
  gameMode: GameMode;
  onRematchAccepted: (
    matchId: string,
    opponentId: string,
    opponentName: string
  ) => void;
  handleRejectRematch: (matchId: string) => void;
}

const TQ_RematchAcceptToast = ({
  myPlayerId,
  opponentId,
  opponentName,
  matchId: _matchId,
  gradeLevel: _gradeLevel,
  gameMode: _gameMode,
  onRematchAccepted,
  handleRejectRematch,
}: TQ_RematchAcceptToastProps) => {
  const [showToast, setShowToast] = useState(false);
  const [incomingMatchId, setIncomingMatchId] = useState<string | null>(null);
  const [incomingOpponentName, setIncomingOpponentName] = useState<string>("");
  const showToastRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  // Poll for incoming rematch requests (always, even when toast is hidden)
  useEffect(() => {
    if (!myPlayerId || !opponentId) return;

    const checkInterval = setInterval(async () => {
      try {
        // Check for incoming rematch request (opponentId_myPlayerId)
        const incomingMatchId = `${opponentId}_${myPlayerId}`;
        console.log("incomingMatchId", incomingMatchId);
        const res = await fetch(`/api/match?matchId=${incomingMatchId}`);

        // 404 is expected when no match exists, ignore it
        if (res.status === 404) {
          return;
        }

        if (!res.ok) {
          return;
        }

        const data = await res.json();

        if (data.ok && data.match) {
          if (data.match.status === "pending") {
            // Incoming rematch request detected!
            // Only show toast if we're not already showing one
            if (!showToastRef.current) {
              setIncomingMatchId(incomingMatchId);
              setIncomingOpponentName(opponentName || "Opponent");
              setShowToast(true);
            }
          }
        }
      } catch (_err) {
        // Silently ignore errors (404s are expected)
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(checkInterval);
  }, [myPlayerId, opponentId, opponentName]);

  // Accept incoming rematch
  const handleAcceptRematch = async () => {
    if (!incomingMatchId) return;

    try {
      // ✅ Step 1: Accept the match (set status to "accepted")
      await fetch("/api/match", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: incomingMatchId,
          status: "accepted",
        }),
      });

      // ✅ Step 2: Wait a moment to ensure the requester sees the "accepted" status
      // Player A will delete the match after seeing "accepted", so we don't delete it here
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // ✅ Step 3: Trigger rematch (Player A will clean up the match after seeing "accepted")
      setShowToast(false);
      onRematchAccepted(incomingMatchId, opponentId!, incomingOpponentName);
    } catch (err) {
      console.error("Failed to accept rematch:", err);
      alert("Failed to accept rematch");
    }
  };

  if (!showToast) return null;

  const RejectRematchHanlder = (matchId: string) => {
    try {
      setShowToast(false);
      // Reset state so we can detect new requests
      setIncomingMatchId(null);
      handleRejectRematch(matchId);
    } catch (error) {
      console.error("Failed to reject rematch:", error);
      alert("Failed to reject rematch");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none bg-black/50">
      <div className="flex flex-col gap-4 p-6 bg-slate-900/80 backdrop-blur-md border border-white/30 rounded-2xl shadow-2xl max-w-md w-full mx-4 pointer-events-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎮</span>
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold text-white">Rematch Request</h3>
            <p className="text-sm text-slate-300">
              {incomingOpponentName} wants a rematch!
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row gap-3 w-full">
          <button
            onClick={handleAcceptRematch}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600/80 hover:bg-green-700/80 text-white font-bold text-lg py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
          >
            <span>✓</span>
            Accept
          </button>
          <button
            onClick={() => RejectRematchHanlder(incomingMatchId!)}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-700/80 text-white font-bold text-lg py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
          >
            <span>✕</span>
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default TQ_RematchAcceptToast;
