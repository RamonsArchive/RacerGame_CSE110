import { MultiplayerPlayer } from "@/lib/GlobalTypes";
import React from "react";

const MultiplayerSetup = ({
  players,
  isVisible,
  onClose,
  onConnect,
  playerName: _playerName,
  incomingRequest,
  onAcceptRequest,
  onRejectRequest,
}: {
  players: MultiplayerPlayer[];
  isVisible: boolean;
  onClose: () => void;
  onConnect: (playerId: string, playerName: string) => void;
  playerName: string;
  incomingRequest?: {
    matchId: string;
    from: string;
    gradeLevel: string;
  } | null;
  onAcceptRequest?: () => void;
  onRejectRequest?: () => void;
}) => {
  if (!isVisible) return null;

  return (
    // Backdrop - darkened and blurred background
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      {/* Modal Container */}
      <div className="bg-linear-to-b from-purple-800 via-purple-900 to-indigo-900 rounded-2xl shadow-2xl w-full max-w-lg p-8 gap-6 flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h2 className="font-nunito text-3xl font-black text-slate-100 text-center">
            Find an Opponent
          </h2>
        </div>

        {/* Incoming Match Request */}
        {incomingRequest && (
          <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-lg p-4 flex flex-col gap-3 animate-pulse">
            <p className="font-nunito text-base font-bold text-yellow-100 text-center">
              🎮 {incomingRequest.from} wants to play!
            </p>
            <div className="flex gap-2">
              <button
                onClick={onAcceptRequest}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-nunito font-bold px-6 py-3 rounded-lg transition-all duration-200"
              >
                Accept ✓
              </button>
              <button
                onClick={onRejectRequest}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-nunito font-bold px-6 py-3 rounded-lg transition-all duration-200"
              >
                Decline ✗
              </button>
            </div>
          </div>
        )}

        {/* Players List */}
        <div className="flex flex-col gap-3">
          <p className="font-nunito text-sm font-semibold text-slate-200">
            Available Players ({players.length})
          </p>

          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
            {players.length === 0 ? (
              <div className="bg-slate-800/50 rounded-lg p-6 text-center">
                <p className="font-nunito text-slate-300">
                  No players available. Waiting for opponents...
                </p>
              </div>
            ) : (
              players.map((player) => (
                <div
                  key={player.id}
                  className="bg-slate-800/50 hover:bg-slate-700/50 rounded-lg p-4 flex items-center justify-between gap-4 transition-all duration-200"
                >
                  <div className="flex flex-col gap-1">
                    <p className="font-nunito text-base font-bold text-slate-100">
                      {player.name}
                    </p>
                    <p className="font-nunito text-xs text-slate-400">
                      Joined {Math.floor((Date.now() - player.joinedAt) / 1000)}
                      s ago
                    </p>
                  </div>
                  <button
                    onClick={() => onConnect(player.id, player.name)}
                    className="bg-green-500 hover:bg-green-600 text-white font-nunito font-bold px-6 py-3 rounded-lg hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    Connect
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onClose}
          className="bg-slate-700 hover:bg-slate-600 text-slate-100 font-nunito font-bold px-6 py-3 rounded-lg transition-all duration-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default MultiplayerSetup;
