"use client";
import React, { useState } from "react";
import { GameState } from "../constants/index_typequest";
import BackTo from "./BackTo";
import { getProgressPercentage } from "@/lib/utils_typequest";
import Image from "next/image";

const TQ_ActiveScreen = ({
  gameState,
  onAnswerSubmit,
  handleGameReset,
  opponentLeftGame = false,
}: {
  gameState: GameState | null;
  onAnswerSubmit: (userAnswer: string) => void;
  handleGameReset: () => void;
  opponentLeftGame?: boolean;
}) => {
  const [textInput, setTextInput] = useState<string>("");
  const currentPlayer = gameState?.currentPlayer || null;
  const opponent = gameState?.opponent || null;
  const currentQuestion =
    gameState?.questions[currentPlayer?.currentQuestionIndex || 0] || null;
  const choices = currentQuestion?.choices || [];

  const currentPlayerPosition = currentPlayer?.currentQuestionIndex || 0;
  const opponentPosition = opponent?.currentQuestionIndex || 0;
  const totalQuestions = gameState?.totalQuestions || 0;

  const currentPlayerPositionPercentage =
    (currentPlayerPosition / totalQuestions) * 90;
  const opponentPositionPercentage = (opponentPosition / totalQuestions) * 90;

  console.log("currentQuestionIndex", currentPlayerPosition);
  console.log("opponentQuestionIndex", opponentPosition);
  console.log(currentPlayerPositionPercentage, opponentPositionPercentage);

  return (
    <div 
      className="flex w-full h-dvh flex-col gap-5 p-10 relative"
      style={{
        backgroundImage: 'url(/Assets/TypeQuest/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Background gradient overlay - darker on left, transparent on right */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent pointer-events-none z-0"></div>
      
      <div className="flex justify-between items-center w-full relative z-10">
        <BackTo title="Back To Home" onClick={handleGameReset} />
        <div className="flex flex-row items-center gap-4">
          <div className="flex flex-row items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/60 backdrop-blur-sm border border-white/20">
            <p className="text-md font-semibold text-slate-100">Question</p>
            <p className="text-md font-bold text-slate-100">
              {currentPlayer?.questionsAnswered || 0} {" / "}{" "}
              {gameState?.totalQuestions || 0}
            </p>
          </div>
          <div className="flex flex-row items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/60 backdrop-blur-sm border border-white/20">
            <p className="text-md font-semibold text-slate-100">Mistakes</p>
            <p className="text-md font-bold text-slate-100">
              {currentPlayer?.currentQuestionMistakes || 0}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-row items-center gap-10 relative z-10">
        <div className="flex flex-col gap-2 w-[50%] items-start px-4 py-3 rounded-lg bg-slate-900/60 backdrop-blur-sm border border-white/20">
          <p className="text-sm font-semibold text-slate-100">Your Progress</p>
          <div className="relative w-full h-5 bg-slate-100 rounded-full">
            <div
              className={`absolute top-0 left-0 h-full bg-green-500 rounded-full`}
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
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 items-start px-4 py-3 rounded-lg bg-slate-900/60 backdrop-blur-sm border border-white/20">
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
              Opponent Progress
            </p>
            {opponentLeftGame && (
              <p className="text-xs font-bold text-red-400 animate-pulse">
                ⚠️ Opponent left game
              </p>
            )}
          </div>
          <div className="relative w-full h-5 bg-slate-100 rounded-full overflow-hidden">
            {opponentLeftGame ? (
              // Red fill animation when opponent leaves (2 second drop down)
              <div
                className="absolute top-0 left-0 h-full bg-red-500 rounded-full animate-[slideRight_2s_ease-out_forwards]"
                style={{
                  width: "0%",
                  animation: "slideRight 2s ease-out forwards",
                }}
              />
            ) : (
              // Normal yellow progress bar
              <div
                className={`absolute top-0 left-0 h-full bg-yellow-500 rounded-full transition-all duration-300`}
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
                }}
              />
            )}
          </div>
        </div>
        <style jsx>{`
          @keyframes slideRight {
            from {
              width: 0%;
            }
            to {
              width: 100%;
            }
          }
        `}</style>
      </div>
      <div className="flex flex-col gap-5 w-full max-w-2xl mx-auto pt-10 p-5 relative z-10">
        <div className="flex-center w-full">
          <p className="text-3xl font-bold text-slate-100">
            {currentQuestion?.prompt}
          </p>
        </div>
        <div className="grid grid-cols-2 w-full gap-3">
          {choices.map((choice: string, index: number) => (
            <div
              key={index}
              className="flex flex-col items-center bg-slate-900/60 backdrop-blur-sm rounded-md px-5 py-4 hover:cursor-pointer hover:bg-slate-800/80 transition-all duration-300 ease-in-out shadow-md border border-white/20"
            >
              <p className="text-lg text-center font-semibold text-slate-100">
                {choice}
              </p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-5">
          <div className="relative flex-row items-center rounded-md border border-white/30 shadow-md bg-slate-900/60 backdrop-blur-sm">
            <input
              className="w-full text-semibold text-lg px-5 py-5 rounded-md border-0 bg-transparent text-slate-100 placeholder:text-slate-400 outline-none focus:outline-none focus:ring-0"
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
      <div id="race_track" className="flex flex-row w-full relative z-10">
        <div className="relative w-full h-full">
          <Image
            src="/Assets/TypeQuest/startFinish.png"
            alt="Race Track"
            width={1000}
            height={100}
            className="object-cover w-full h-full"
          />
          <div
            className="absolute top-4 h-20 w-25 left-0 transition-all duration-300 ease-in-out bg-primary-500 rounded-full"
            style={{
              left: `${currentPlayerPositionPercentage}%`,
            }}
          >
            <Image
              src="/Assets/TypeQuest/tq_gamePic.jpg"
              alt="Start"
              width={100}
              height={100}
              className="object-contain h-full w-full rounded-full"
            />
          </div>
          <div
            className="absolute bottom-4 h-20 w-25 left-0 transition-all duration-300 ease-in-out bg-tertiary-500 rounded-full"
            style={{
              left: `${opponentPositionPercentage}%`,
            }}
          >
            <Image
              src="/Assets/TypeQuest/car2.jpg"
              alt="Opponent"
              width={100}
              height={100}
              className="object-contain h-full w-full rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TQ_ActiveScreen;
