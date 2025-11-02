"use client";
import React from "react";
import { GameState } from "../constants/index_typequest";
import {
  calculateAccuracy,
  calculateAverageTime,
  calculateCharactersPerSecond,
} from "@/lib/utils_typequest";

const TQ_Summary = ({
  gameState,
  shouldPollOpponent,
  currentPlayerTotalPoints,
  opponentTotalPoints,
}: {
  gameState: GameState;
  shouldPollOpponent?: boolean;
  currentPlayerTotalPoints: number;
  opponentTotalPoints: number;
}) => {
  return (
    <div className="flex flex-row w-full p-4 gap-4 bg-linear-to-br from-slate-800/70 via-slate-700/60 to-slate-900/70 rounded-lg shadow-md border border-white/10">
      {/* You */}
      <div className="flex w-[50%] flex-col gap-3">
        <SummaryRow label="Your points" value={`${currentPlayerTotalPoints}`} />
        <SummaryRow
          label="Your progress"
          value={`${gameState.currentPlayer.questionsAnswered} / ${gameState.totalQuestions}`}
        />
        <SummaryRow
          label="Your accuracy"
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
          label="Typing speed"
          value={`${calculateCharactersPerSecond(
            gameState.currentPlayer.questionResults.reduce(
              (s, q) => s + q.correctAnswer.length,
              0
            ),
            gameState.currentPlayer.questionResults.reduce(
              (s, q) => s + q.timeSpent,
              0
            )
          )} cps`}
        />
      </div>

      {/* Opponent */}
      <div className="flex flex-1 flex-col gap-3 relative">
        {/* Live updating indicator */}
        {shouldPollOpponent && (
          <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 bg-green-500/30 border border-green-400/50 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-semibold text-green-200">
              LIVE
            </span>
          </div>
        )}
        <SummaryRow label="Opponent points" value={`${opponentTotalPoints}`} />
        <SummaryRow
          label="Opponent progress"
          value={`${gameState.opponent?.questionsAnswered} / ${gameState.totalQuestions}`}
        />
        <SummaryRow
          label="Opponent accuracy"
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
          label="Typing speed"
          value={`${calculateCharactersPerSecond(
            gameState.opponent?.questionResults.reduce(
              (s, q) => s + q.correctAnswer.length,
              0
            ) || 0,
            gameState.opponent?.questionResults.reduce(
              (s, q) => s + q.timeSpent,
              0
            ) || 0
          )} cps`}
        />
      </div>
    </div>
  );
};

// small compact info row component
const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <p className="text-xs font-semibold text-slate-400 tracking-wide">
      {label}
    </p>
    <span className="inline-block w-fit px-2 py-[2px] rounded-md bg-white/10 text-white font-semibold text-sm leading-tight shadow-sm">
      {value}
    </span>
  </div>
);

export default TQ_Summary;
