"use client";
import React, { useState } from "react";
import { TreasureHuntGameState } from "../constants/index_treasurehunt";
import {
  calculateAccuracy,
  calculateAverageTime,
} from "@/lib/utils_treasurehunt";

const TH_Summary = ({
  gameState,
  currentPlayerTotalPoints,
  opponentTotalPoints,
}: {
  gameState: TreasureHuntGameState;
  currentPlayerTotalPoints: number;
  opponentTotalPoints: number;
}) => {
  const [showMissed, setShowMissed] = useState(false);
  const currentName = gameState.currentPlayer.playerName;
  const opponentName = gameState.opponent?.playerName || "CPU";
  
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-row w-full p-4 gap-4 bg-linear-to-br from-slate-800/90 via-slate-700/80 to-slate-900/90 rounded-lg shadow-md border border-white/10">
      {/* Current Player Column */}
      <div className="flex w-[50%] flex-col gap-3">
        <div className="pb-1 border-b border-white/20">
          <h3 className="text-base font-bold text-white">{currentName}</h3>
        </div>
        <SummaryRow label="Points" value={`${currentPlayerTotalPoints}`} />
        <SummaryRow
          label="Progress"
          value={`${gameState.currentPlayer.questionsAnswered} / ${gameState.totalQuestions}`}
        />
        <SummaryRow
          label="Accuracy"
          value={`${calculateAccuracy(
            gameState.currentPlayer.questionResults.filter((q) => q.correct)
              .length,
            gameState.currentPlayer.questionResults.length
          )}%`}
        />
        <SummaryRow
          label="Avg time / question"
          value={`${calculateAverageTime(
            gameState.currentPlayer.questionResults.reduce(
              (s, q) => s + q.timeSpent,
              0
            ),
            gameState.currentPlayer.questionResults.length
          )}s`}
        />
        <SummaryRow
          label="Mistakes"
          value={`${gameState.currentPlayer.totalMistakes}`}
        />
      </div>

      {/* Opponent Column */}
      <div className="flex flex-1 flex-col gap-3 relative">
        <div className="pb-1 border-b border-white/20">
          <h3 className="text-base font-bold text-white">
            {opponentName}
          </h3>
        </div>
        <SummaryRow label="Points" value={`${opponentTotalPoints}`} />
        <SummaryRow
          label="Progress"
          value={`${gameState.opponent?.questionsAnswered || 0} / ${
            gameState.totalQuestions
          }`}
        />
        <SummaryRow
          label="Accuracy"
          value={`${calculateAccuracy(
            gameState.opponent?.questionResults.filter((q) => q.correct)
              .length || 0,
            gameState.opponent?.questionResults.length || 0
          )}%`}
        />
        <SummaryRow
          label="Avg time / question"
          value={`${calculateAverageTime(
            gameState.opponent?.questionResults.reduce(
              (s, q) => s + q.timeSpent,
              0
            ) || 0,
            gameState.opponent?.questionResults.length || 0
          )}s`}
        />
        <SummaryRow
          label="Mistakes"
          value={`${gameState.opponent?.totalMistakes || 0}`}
        />
      </div>
    </div>

    {/* Missed Sentences Button */}
    {gameState.answerLog && gameState.answerLog.length > 0 && (
      <button
        onClick={() => setShowMissed(true)}
        className="mt-2 px-6 py-3 text-lg font-bold text-white bg-slate-800/90 hover:bg-slate-700/90 rounded-lg transition-all shadow-md border border-white/10"
      >
        🎯 See sentences you missed
      </button>
    )}

    {/* Missed Sentences Modal */}
    {showMissed && gameState.answerLog && (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
        <div className="relative max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto bg-slate-800/95 rounded-lg p-6 shadow-xl border border-white/10">
          <button
            onClick={() => setShowMissed(false)}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          >
            ✕
          </button>
          <h2 className="text-xl font-bold text-white mb-6">Sentences You Missed</h2>
          <div className="space-y-4">
            {gameState.answerLog?.map((entry) => (
              <div key={entry.questionId} className="p-4 bg-slate-700/50 rounded-lg border border-white/10">
                <p className="text-white font-medium mb-2">{entry.prompt}</p>
                {entry.userAnswer && (
                  <p className="text-rose-400 text-sm mb-1">
                    Your answer: {entry.userAnswer}
                  </p>
                )}
                <p className="text-emerald-400 text-sm">
                  Correct answer{Array.isArray(entry.correctAnswer) ? "s" : ""}:{" "}
                  {Array.isArray(entry.correctAnswer)
                    ? entry.correctAnswer.join(" | ")
                    : entry.correctAnswer}
                </p>
                {entry.gaveUp && (
                  <p className="text-slate-400 text-xs italic mt-1">
                    You chose to give up on this one
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1.5">
    <p className="text-sm font-semibold text-slate-300 tracking-wide">
      {label}
    </p>
    <span className="inline-block w-fit px-3 py-1 rounded-md bg-white/10 text-white font-bold text-base leading-tight shadow-sm">
      {value}
    </span>
  </div>
);

export default TH_Summary;