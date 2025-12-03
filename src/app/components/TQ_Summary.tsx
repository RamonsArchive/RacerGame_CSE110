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
  opponentLeftGame = false,
}: {
  gameState: GameState;
  shouldPollOpponent?: boolean;
  currentPlayerTotalPoints: number;
  opponentTotalPoints: number;
  opponentLeftGame?: boolean;
}) => {
  const currentName = gameState.currentPlayer.playerName;
  const opponentName = gameState.opponent?.playerName;
  return (
    <div className="flex flex-row w-full p-4 gap-4 bg-linear-to-br bg-slate-900/85 backdrop-blur-md shadow-2xl border-2 border-white/30 rounded-2xl">
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

      {/* Opponent Column */}
      <div className="flex flex-1 flex-col gap-3 relative">
        {/* Live updating indicator OR Final indicator if opponent left */}
        {opponentLeftGame ? (
          <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 bg-red-500/30 border border-red-400/50 rounded-full">
            <span className="text-[10px] font-semibold text-red-200">
              ⚠️ FINAL
            </span>
          </div>
        ) : shouldPollOpponent && !gameState.opponent?.isFinished ? (
          <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 bg-green-500/30 border border-green-400/50 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-semibold text-green-200">
              LIVE
            </span>
          </div>
        ) : null}
        <div className="pb-1 border-b border-white/20">
          <h3 className="text-base font-bold text-white">
            {opponentName || "Opponent"}
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
  <div className="flex flex-col gap-1.5">
    <p className="text-sm font-semibold text-slate-300 tracking-wide">
      {label}
    </p>
    <span className="inline-block w-fit px-3 py-1 rounded-md bg-white/10 text-white font-bold text-base leading-tight shadow-sm">
      {value}
    </span>
  </div>
);

export default TQ_Summary;
