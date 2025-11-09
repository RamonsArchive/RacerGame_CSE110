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

  // White line is at top: 70%, left: 70%, rotated -35.5deg
  // Cars should move along this line direction based on progress
  // Calculate movement distance along -35.5deg direction (parallel to white line)
  const maxDistance = 60; // Maximum distance to move along the line (in vw for consistency)
  const angle = -35.5 * (Math.PI / 180); // Convert to radians
  const cosAngle = Math.cos(angle); // ≈ 0.814
  const sinAngle = Math.sin(angle); // ≈ -0.581
  
  // Progress from 0 to 1
  const playerProgress = Math.min(currentPlayerPositionPercentage / 100, 1);
  const opponentProgress = Math.min(opponentPositionPercentage / 100, 1);
  
  // Calculate movement components along the line direction
  const playerDistance = playerProgress * maxDistance;
  const opponentDistance = opponentProgress * maxDistance;
  
  // X and Y components of movement (parallel to white line)
  const playerMoveX = playerDistance * cosAngle;
  const playerMoveY = playerDistance * sinAngle;
  const opponentMoveX = opponentDistance * cosAngle;
  const opponentMoveY = opponentDistance * sinAngle;

  console.log("currentQuestionIndex", currentPlayerPosition);
  console.log("opponentQuestionIndex", opponentPosition);
  console.log(currentPlayerPositionPercentage, opponentPositionPercentage);

  return (
    <div 
      className="flex w-full h-dvh flex-col gap-5 p-10 relative overflow-hidden"
      style={{
        backgroundImage: 'url(/Assets/TypeQuest/background_play.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Background gradient overlay - darker on left, transparent on right */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent pointer-events-none z-0"></div>
      
      {/* Animated road lines - decorative scrolling effect from bottom-left to top-right */}
      <div 
        className="absolute pointer-events-none z-[1] overflow-hidden" 
        style={{
          width: '150vw',
          height: '4px',
          top: '70%',
          left: '70%',
          transformOrigin: 'center center',
          transform: 'translate(-50%, -50%) rotate(-35.5deg)',
        }}
      >
        <div 
          className="w-full h-full animate-road-line" 
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 50px, rgba(255, 255, 255, 0.95) 50px, rgba(255, 255, 255, 0.95) 100px)',
            backgroundSize: '120px 100%',
          }}
        ></div>
      </div>
      
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

      {/* Progress Bars */}
      <div className="flex flex-row items-center gap-10 shrink-0 relative z-10">
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
          <div className="flex flex-row gap-5 items-center w-full">
            <p
              className={`text-sm font-semibold text-slate-100 ${
                opponentLeftGame ? "line-through opacity-60" : ""
              }`}
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
      <div className="flex flex-col gap-5 w-full max-w-2xl ml-10 pt-10 p-5 relative z-10">
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
      {/* Cars positioned on left and right sides of the road line */}
      {/* White line center is at top: 70%, left: 70%, cars start from fixed positions on left/right sides */}
      {/* Player's car on the left side of the road */}
      <div
        className="absolute pointer-events-none z-[5] transition-all duration-300 ease-in-out"
        style={{
          top: '80%',
          left: '58%',
          transformOrigin: 'center center',
          // Fixed starting position: -80px offset to left side, then move along line direction
          transform: `translate(calc(-50% - 80px + ${playerMoveX.toFixed(2)}vw), calc(-50% + ${playerMoveY.toFixed(2)}vw))`,
        }}
      >
        <Image
          src="/Assets/TypeQuest/racer car 1.png"
          alt="Player Car"
          width={320}
          height={320}
          className="object-contain"
        />
      </div>
      
      {/* Opponent's car on the right side of the road */}
      <div
        className="absolute pointer-events-none z-[5] transition-all duration-300 ease-in-out"
        style={{
          top: '90%',
          left: '63%',
          transformOrigin: 'center center',
          // Fixed starting position: +80px offset to right side, then move along line direction
          transform: `translate(calc(-50% + 80px + ${opponentMoveX.toFixed(2)}vw), calc(-50% + ${opponentMoveY.toFixed(2)}vw))`,
        }}
      >
        <Image
          src="/Assets/TypeQuest/racer car 2.png"
          alt="Opponent Car"
          width={320}
          height={320}
          className="object-contain"
        />
      </div>
    </div>
  );
};

export default TQ_ActiveScreen;
