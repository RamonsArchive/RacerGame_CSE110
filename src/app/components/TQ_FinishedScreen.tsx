import React from "react";
import { GameState } from "../constants/index_typequest";
import TQ_Summary from "./TQ_Summary";

const TQ_FinishedScreen = ({ gameState }: { gameState: GameState | null }) => {
  const winner =
    gameState?.currentPlayer?.totalPoints && gameState?.opponent?.totalPoints
      ? gameState?.currentPlayer?.totalPoints > gameState?.opponent?.totalPoints
        ? true
        : false
      : null;
  return (
    <div className="flex-center w-full h-dvh">
      <div className="flex flex-col w-full max-w-2xl p-10 gap-10 bg-linear-to-b from-pink-700 via-primary-900 to-secondary-800 bg-cover bg-no-repeat rounded-xl shadow-lg">
        <div className="flex flex-center w-full">
          <p className="text-5xl font-bold text-slate-100 drop-shadow-2xl animate-bright-gradient">
            Race Completed!
          </p>
        </div>
        <div className="flex-center w-full">
          {winner === true && (
            <p className="text-2xl font-bold text-slate-100">You Won! 🎉</p>
          )}
          {winner === false && (
            <p className="text-2xl font-bold text-slate-100">You Lost! 😭</p>
          )}
          {winner === null && (
            <p className="text-2xl font-bold text-slate-100">It's a Tie! 🤝</p>
          )}
        </div>
        {gameState && <TQ_Summary gameState={gameState} />}
        <div className="flex flex-col w-full gap-3">
          <button className="flex-center w-full bg-slate-200 text-slate-900 font-bold text-2xl p-3 rounded-lg hover:cursor-pointer hover:scale-105 transition-all duration-300 ease-in-out">
            Open Leaderboard
          </button>
          <div className="flex flex-row w-full gap-5 items-center">
            <button className="flex-center w-full bg-green-600 text-slate-100 font-bold text-2xl p-3 rounded-lg hover:cursor-pointer hover:scale-105 transition-all duration-300 ease-in-out">
              Play Again
            </button>
            <button className="flex-center w-full bg-primary-600 text-slate-100 font-bold text-2xl p-3 rounded-lg hover:cursor-pointer hover:scale-105 transition-all duration-300 ease-in-out">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TQ_FinishedScreen;
