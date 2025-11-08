// components/TQ_Leaderboard.tsx
"use client";
import React, { useEffect, useState } from "react";
import { X, Trophy, Medal, Award, Trash2 } from "lucide-react";
import { GameResult, GradeLevel, GameMode } from "../constants/index_typequest";
import {
  getLeaderboard,
  clearLeaderboard,
  getLeaderboardMultiplayer,
  clearLeaderboardMultiplayer,
} from "@/lib/utils_typequest";

interface TQ_LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  gradeLevel?: GradeLevel;
  mode?: GameMode;
  currentGameId?: string;
}

const TQ_Leaderboard = ({
  isOpen,
  onClose,
  gradeLevel,
  mode,
  currentGameId,
}: TQ_LeaderboardProps) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<GameResult[]>([]);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * ✅ Fetch leaderboard data
   * - Multiplayer: Fetch from Redis API
   * - Solo: Fetch from localStorage
   */
  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      if (mode === "multiplayer" && gradeLevel) {
        // Fetch from Redis API
        const data = await getLeaderboardMultiplayer(mode, gradeLevel, 10);
        setLeaderboardData(data);
      } else {
        // Fetch from localStorage (solo)
        const data = getLeaderboard(gradeLevel, mode, 10);
        setLeaderboardData(data);
      }
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
      setLeaderboardData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLeaderboard();

      // Trigger animation after mount
      requestAnimationFrame(() => {
        setShouldAnimate(true);
      });
    } else {
      setShouldAnimate(false);
      setShowConfirmClear(false);
    }
  }, [isOpen, gradeLevel, mode]);

  /**
   * ✅ Clear leaderboard
   * - Multiplayer: DELETE request to Redis API
   * - Solo: Clear localStorage
   */
  const handleClearLeaderboard = async () => {
    try {
      if (mode === "multiplayer" && gradeLevel) {
        // Clear from Redis
        const success = await clearLeaderboardMultiplayer(mode, gradeLevel);
        if (success) {
          setLeaderboardData([]);
        }
      } else {
        // Clear localStorage (solo)
        clearLeaderboard();
        setLeaderboardData([]);
      }
    } catch (error) {
      console.error("Failed to clear leaderboard:", error);
    } finally {
      setShowConfirmClear(false);
    }
  };

  if (!isOpen) return null;

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-orange-400" />;
    return (
      <span className="w-6 text-center font-bold text-slate-400">
        {index + 1}
      </span>
    );
  };

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300 ${
        shouldAnimate ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`flex flex-col w-full max-w-4xl mx-4 p-8 gap-6 bg-linear-to-br from-purple-900 via-primary-900 to-secondary-900 rounded-2xl shadow-2xl border border-white/20 transition-all duration-500 ${
          shouldAnimate ? "scale-100 translate-y-0" : "scale-95 -translate-y-8"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-400" />
            <h2 className="text-4xl font-bold text-white drop-shadow-lg">
              Leaderboard
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Clear Leaderboard Button */}
            {leaderboardData.length > 0 && (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="p-2 rounded-full hover:bg-red-500/20 transition-colors group"
                aria-label="Clear leaderboard"
                title="Clear leaderboard"
              >
                <Trash2 className="w-5 h-5 text-slate-400 group-hover:text-red-400" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close leaderboard"
            >
              <X className="w-6 h-6 text-slate-200 hover:text-white" />
            </button>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmClear && (
          <div className="flex flex-col gap-4 p-4 bg-red-500/10 border-2 border-red-500/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              <p className="text-white font-semibold">
                Clear {mode === "multiplayer" ? "this" : "all"} leaderboard
                data?
              </p>
            </div>
            <p className="text-sm text-slate-300">
              {mode === "multiplayer" ? (
                <>
                  This will permanently delete {leaderboardData.length} recorded
                  games for{" "}
                  <strong>
                    {mode} - {gradeLevel}
                  </strong>{" "}
                  from the server. This action cannot be undone.
                </>
              ) : (
                <>
                  This will permanently delete all {leaderboardData.length}{" "}
                  recorded games from your browser. This action cannot be
                  undone.
                </>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleClearLeaderboard}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
              >
                Yes, Clear {mode === "multiplayer" ? "Server Data" : "All"}
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filters Info */}
        {(gradeLevel || mode) && (
          <div className="flex gap-2 text-sm text-slate-300">
            {gradeLevel && (
              <span className="px-3 py-1 bg-white/10 rounded-full">
                Grade: {gradeLevel}
              </span>
            )}
            {mode && (
              <span className="px-3 py-1 bg-white/10 rounded-full capitalize">
                Mode: {mode}
              </span>
            )}
          </div>
        )}

        {/* Table Header */}
        <div className="grid grid-cols-[auto_2fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-xs font-semibold text-slate-300 uppercase tracking-wider">
          <div>Rank</div>
          <div>Player</div>
          <div className="text-center">Points</div>
          <div className="text-center">Accuracy</div>
          <div className="text-center">Avg Time</div>
          <div className="text-center">Date</div>
        </div>

        {/* Leaderboard Entries */}
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-lg">Loading leaderboard...</p>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No games recorded yet</p>
              <p className="text-sm mt-2">Be the first to play!</p>
            </div>
          ) : (
            leaderboardData.map((entry, index) => {
              const isCurrentGame = entry.gameId === currentGameId;

              // Debug logging for multiplayer gameId matching (only log matches or first entry)
              if (
                mode === "multiplayer" &&
                currentGameId &&
                (isCurrentGame || index === 0)
              ) {
                console.log("🔍 Leaderboard gameId comparison:", {
                  entryGameId: entry.gameId,
                  currentGameId,
                  matches: isCurrentGame,
                  playerName: entry.playerName,
                });
              }

              return (
                <div
                  key={`${entry.gameId}_${entry.date}`} // ✅ Unique key: gameId + timestamp ensures uniqueness even for rematches
                  className={`grid grid-cols-[auto_2fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-3 rounded-lg transition-all duration-300 ${
                    isCurrentGame
                      ? "bg-green-500/20 border-2 border-green-400 shadow-lg shadow-green-500/20"
                      : "bg-white/5 hover:bg-white/10 border border-white/10"
                  } ${
                    shouldAnimate
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 -translate-x-4"
                  }`}
                  style={{
                    transitionDelay: `${index * 50}ms`,
                  }}
                >
                  {/* Rank */}
                  <div className="flex items-center">{getRankIcon(index)}</div>

                  {/* Player Name */}
                  <div className="flex items-center">
                    <p className="text-white font-semibold truncate">
                      {entry.playerName}
                      {isCurrentGame && (
                        <span className="ml-2 text-xs text-green-400 font-normal">
                          (You)
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Points */}
                  <div className="flex items-center justify-center">
                    <span className="px-3 py-1 bg-purple-500/30 rounded-full text-white font-bold text-sm">
                      {entry.totalPoints}
                    </span>
                  </div>

                  {/* Accuracy */}
                  <div className="flex items-center justify-center text-slate-200 text-sm">
                    {entry.accuracy}%
                  </div>

                  {/* Avg Time */}
                  <div className="flex items-center justify-center text-slate-200 text-sm">
                    {entry.averageTimePerQuestion.toFixed(1)}s
                  </div>

                  {/* Date */}
                  <div className="flex items-center justify-center text-slate-400 text-xs">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pt-4 border-t border-white/10">
          {leaderboardData.length > 0 ? (
            <>
              Showing top {leaderboardData.length} result
              {leaderboardData.length !== 1 ? "s" : ""}
            </>
          ) : (
            <>No results to display</>
          )}
        </div>
      </div>
    </div>
  );
};

export default TQ_Leaderboard;
