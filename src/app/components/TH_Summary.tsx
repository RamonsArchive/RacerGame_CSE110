"use client";
import React from "react";
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
  const currentName = gameState.currentPlayer.playerName;
  const opponentName = gameState.opponent?.playerName || "CPU";
  
  return (
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
  );
};

// small compact info row component
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

