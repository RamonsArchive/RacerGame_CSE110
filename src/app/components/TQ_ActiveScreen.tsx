"use client";
import React, { Dispatch, SetStateAction, useState } from "react";
import { GameState, GameStatus } from "../constants/index_typequest";
import BackTo from "./BackTo";
import { getProgressPercentage } from "@/lib/utils_typequest";

const TQ_ActiveScreen = ({
  setGameStatus,
  gameState,
  onAnswerSubmit,
  handleGameReset,
}: {
  setGameStatus: Dispatch<SetStateAction<GameStatus>>;

  gameState: GameState | null;
  onAnswerSubmit: (userAnswer: string) => void;
  handleGameReset: () => void;
}) => {
  const [textInput, setTextInput] = useState<string>("");
  const currentPlayer = gameState?.currentPlayer || null;
  const opponent = gameState?.opponent || null;
  const currentQuestion =
    gameState?.questions[currentPlayer?.currentQuestionIndex || 0] || null;
  const choices = currentQuestion?.choices || [];

  return (
    <div className="flex w-full h-dvh flex-col gap-5 p-10">
      <div className="flex justify-between items-center w-full">
        <BackTo title="Back To Home" onClick={handleGameReset} />
        <div className="flex flex-row items-center gap-10">
          <div className="flex flex-row items-center gap-2">
            <p className="text-md font-semibold text-slate-100">Question</p>
            <p className="text-md font-bold text-slate-100">
              {currentPlayer?.questionsAnswered || 0} {" / "}{" "}
              {gameState?.totalQuestions || 0}
            </p>
          </div>
          <div className="flex flex-row items-center gap-2">
            <p className="text-md font-semibold text-slate-100">Mistakes</p>
            <p className="text-md font-bold text-slate-100">
              {currentPlayer?.currentQuestionMistakes || 0}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-row items-center gap-10">
        <div className="flex flex-col gap-2 w-[50%] items-start">
          <p className="text-sm font-semibold text-slate-100">Your Progress</p>
          <div className="relative w-full h-5 bg-slate-100 rounded-full">
            <div
              className={`aboslute top-0 left-0 h-full bg-green-500 rounded-full`}
              style={{
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    getProgressPercentage(
                      currentPlayer?.questionsAnswered || 0,
                      gameState?.totalQuestions || 0
                    )
                  )
                )}%`,
              }} // clamp 0–100
            >
              {" "}
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 items-start">
          <p className="text-sm font-semibold text-slate-100">
            Opponent Progress
          </p>
          <div className="relative w-full h-5 bg-slate-100 rounded-full">
            <div
              className={`aboslute top-0 left-0 h-full bg-yellow-500 rounded-full`}
              style={{
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    getProgressPercentage(
                      opponent?.questionsAnswered || 0,
                      gameState?.totalQuestions || 0
                    )
                  )
                )}%`,
              }} // clamp 0–100
            >
              {" "}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-5 w-full max-w-2xl mx-auto pt-10 p-5">
        <div className="flex-center w-full">
          <p className="text-3xl font-bold text-slate-100">
            {currentQuestion?.prompt}
          </p>
        </div>
        <div className="grid grid-cols-2 w-full gap-3">
          {choices.map((choice: string, index: number) => (
            <div
              key={index}
              className="flex flex-col items-center bg-slate-500 rounded-md px-5 py-4 hover:cursor-pointer hover:bg-slate-600 transition-all duration-300 ease-in-out"
            >
              <p className="text-lg text-center font-semibold text-slate-100">
                {choice}
              </p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-5">
          <div className="relaitve flex-row items-center rounded-md border border-primary-100 shadow-md">
            <input
              className="w-full text-semibold text-lg px-5 py-5 rounded-md border border-primary-100 bg-slate-100 text-slate-900 outline-none focus:outline-none focus:ring-0"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAnswerSubmit(textInput);
                  setTextInput("");
                }
              }}
              placeholder="Press Enter to submit your answer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TQ_ActiveScreen;
