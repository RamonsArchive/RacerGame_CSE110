"use client";
import React, { useState, useEffect, useRef } from "react";
import { GameState } from "../constants/index_typequest";
import BackTo from "./BackTo";
import { getProgressPercentage } from "@/lib/utils_typequest";
import Image from "next/image";
const TQ_ActiveScreen = ({
  gameState,
  onAnswerSubmit,
  handleGameReset,
  opponentLeftGame = false,
  isCorrectAnswer = 0,
  onDismissFeedback,
}: {
  gameState: GameState | null;
  onAnswerSubmit: (userAnswer: string) => void;
  handleGameReset: () => void;
  opponentLeftGame?: boolean;
  isCorrectAnswer?: number;
  onDismissFeedback?: () => void;
}) => {
  const [textInput, setTextInput] = useState<string>("");
  const [giveInstruction, setGiveInstruction] = useState<boolean>(false);
  const [errorClick, setErrorClick] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Show instruction popup on first render
  useEffect(() => {
    setGiveInstruction(true);
    timeoutRef.current = setTimeout(() => {
      setGiveInstruction(false);
    }, 8000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (errorClick) {
      // playsound effect
      const audio = new Audio("/Assets/TypeQuest/honk.mp3");
      audio.volume = 0.3;
      audio.play();
      errorTimeoutRef.current = setTimeout(() => {
        setErrorClick(false);
      }, 4000);

      return () => {
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
        }
      };
    }
  }, [errorClick]);

  useEffect(() => {
    if (isCorrectAnswer === 1) {
      // playsound effect
      const audio = new Audio("/Assets/TypeQuest/accelerate.mov");
      audio.volume = 0.3;
      audio.play();
    } else if (isCorrectAnswer === -1) {
      // playsound effect
      const audio = new Audio("/Assets/TypeQuest/screech.mov");
      audio.volume = 0.3;
      audio.play();
      // shake the screen
      document.body.classList.add("shake");
      setTimeout(() => {
        document.body.classList.remove("shake");
      }, 1000);
    }
  }, [isCorrectAnswer]);

  return (
    <div className="flex w-full h-dvh flex-col gap-5 p-10 relative overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          src="/Assets/TypeQuest/background_play.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </div>
      {/* Background gradient overlay - darker on left, transparent on right */}
      <div className="absolute inset-0 bg-linear-to-r from-black/50 via-black/30 to-transparent pointer-events-none z-0"></div>

      {/* Animated road lines - decorative scrolling effect from bottom-left to top-right */}
      <div
        className="absolute pointer-events-none z-1 overflow-hidden"
        style={{
          width: "200vw",
          height: "8px",
          top: "70%",
          left: "73%",
          transformOrigin: "center center",
          transform: "translate(-50%, -50%) rotate(-35.5deg)",
        }}
      >
        <div
          className="w-full h-full animate-road-line"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0px, transparent 50px, rgba(255, 255, 255, 0.95) 50px, rgba(255, 255, 255, 0.95) 100px)",
            backgroundSize: "120px 100%",
          }}
        ></div>
      </div>

      <div className="flex justify-between items-center w-full relative z-10">
        <BackTo title="Back To Home" onClick={handleGameReset} />
        <div className="flex flex-row items-center gap-4">
          <div className="flex flex-row items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/85 backdrop-blur-md shadow-2xl border-2 border-white/30">
            <p className="text-md font-semibold text-slate-100 text-with-border">
              Question
            </p>
            <p className="text-md font-bold text-slate-100">
              {currentPlayer?.questionsAnswered || 0} {" / "}{" "}
              {gameState?.totalQuestions || 0}
            </p>
          </div>
          <div className="flex flex-row items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/85 backdrop-blur-md shadow-2xl border-2 border-white/30">
            <p className="text-md font-semibold text-slate-100 text-with-border">
              Mistakes
            </p>
            <p className="text-md font-bold text-slate-100">
              {currentPlayer?.currentQuestionMistakes || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="flex flex-row items-center gap-10 shrink-0 relative z-10">
        <div className="flex flex-col gap-2 w-[50%] items-start px-4 py-3 rounded-2xl bg-slate-900/85 backdrop-blur-md shadow-2xl border-2 border-white/30">
          <p className="text-sm font-semibold text-slate-100 text-with-border">
            Your Progress
          </p>
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
        <div className="flex flex-1 flex-col gap-2 items-start px-4 py-3 rounded-2xl bg-slate-900/85 backdrop-blur-md shadow-2xl border-2 border-white/30">
          <div className="flex flex-row gap-5 items-center w-full">
            <p
              className={`text-sm font-semibold text-slate-100 text-with-border ${
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
          @keyframes fade-in-bounce {
            0% {
              opacity: 0;
              transform: translateY(-10px) scale(0.9);
            }
            50% {
              transform: translateY(5px) scale(1.05);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @keyframes fade-in-out {
            0% {
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              opacity: 0;
            }
          }
          @keyframes bounce-in {
            0% {
              transform: scale(0);
            }
            50% {
              transform: scale(1.1);
            }
            70% {
              transform: scale(0.95);
            }
            100% {
              transform: scale(1);
            }
          }
          @keyframes shake-in {
            0% {
              transform: scale(0) rotate(0deg);
            }
            25% {
              transform: scale(1.1) rotate(-5deg);
            }
            50% {
              transform: scale(0.95) rotate(5deg);
            }
            75% {
              transform: scale(1.05) rotate(-3deg);
            }
            100% {
              transform: scale(1) rotate(0deg);
            }
          }
          @keyframes scale-bounce {
            0%,
            100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.2);
            }
          }
          @keyframes spin-slow {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          @keyframes wiggle {
            0%,
            100% {
              transform: rotate(0deg);
            }
            25% {
              transform: rotate(-10deg);
            }
            75% {
              transform: rotate(10deg);
            }
          }
          .animate-fade-in-bounce {
            animation: fade-in-bounce 0.6s ease-out;
          }
          .animate-fade-in-out {
            animation: fade-in-out 2s ease-in-out;
          }
          .animate-bounce-in {
            animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }
          .animate-shake-in {
            animation: shake-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }
          .animate-scale-bounce {
            animation: scale-bounce 0.5s ease-in-out infinite;
          }
          .animate-spin-slow {
            animation: spin-slow 2s linear infinite;
          }
          .animate-wiggle {
            animation: wiggle 0.5s ease-in-out infinite;
          }
          @keyframes slide-in-right {
            0% {
              opacity: 0;
              transform: translateX(20px);
            }
            100% {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .animate-slide-in-right {
            animation: slide-in-right 0.4s
              cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }
          .text-with-border {
            color: white;
            text-shadow:
              -1px -1px 0 rgba(0, 0, 0, 1),
              1px -1px 0 rgba(0, 0, 0, 1),
              -1px 1px 0 rgba(0, 0, 0, 1),
              1px 1px 0 rgba(0, 0, 0, 1),
              -0.5px -0.5px 0 rgba(0, 0, 0, 1),
              0.5px -0.5px 0 rgba(0, 0, 0, 1),
              -0.5px 0.5px 0 rgba(0, 0, 0, 1),
              0.5px 0.5px 0 rgba(0, 0, 0, 1);
          }
          .icon-with-border {
            filter: drop-shadow(-1px -1px 0 rgba(0, 0, 0, 1))
              drop-shadow(1px -1px 0 rgba(0, 0, 0, 1))
              drop-shadow(-1px 1px 0 rgba(0, 0, 0, 1))
              drop-shadow(1px 1px 0 rgba(0, 0, 0, 1))
              drop-shadow(-0.5px -0.5px 0 rgba(0, 0, 0, 1))
              drop-shadow(0.5px -0.5px 0 rgba(0, 0, 0, 1))
              drop-shadow(-0.5px 0.5px 0 rgba(0, 0, 0, 1))
              drop-shadow(0.5px 0.5px 0 rgba(0, 0, 0, 1));
          }
        `}</style>
      </div>
      <div className="flex flex-row gap-5 items-center w-full max-w-6xl">
        {/* Unified Game Container */}
        <div className="flex flex-col gap-4 w-full max-w-2xl bg-slate-900/85 backdrop-blur-md rounded-2xl p-5 shadow-2xl border-2 border-white/30 mr-auto">
          {/* Question Prompt */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg border border-white/20">
            <p className="text-2xl font-bold text-slate-100 text-center leading-tight">
              {currentQuestion?.prompt}
            </p>
          </div>

          {/* Choices Grid */}
          <div className="grid grid-cols-2 gap-3">
            {choices.map((choice: string, index: number) => (
              <button
                key={index}
                onClick={() => setErrorClick(true)}
                disabled={isCorrectAnswer !== 0 || errorClick}
                className={`flex flex-col items-center justify-center bg-slate-800/80 backdrop-blur-sm rounded-lg px-4 py-3 transition-all duration-300 ease-in-out shadow-md border border-white/20 min-h-[70px] hover:bg-slate-700/80 hover:border-white/40 ${
                  isCorrectAnswer !== 0 || errorClick
                    ? "pointer-events-none opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <p className="text-lg text-center font-bold text-slate-100">
                  {choice}
                </p>
              </button>
            ))}
          </div>

          {/* Input Section */}
          <div className="relative rounded-lg border-2 border-white/30 shadow-lg bg-slate-800/80 backdrop-blur-sm hover:border-white/50 transition-all duration-300">
            <input
              className="w-full text-semibold text-xl px-5 py-4 rounded-lg border-0 bg-transparent text-slate-100 placeholder:text-slate-400/70 outline-none focus:outline-none focus:ring-0"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();

                  // If feedback modal is showing, dismiss it instead of submitting
                  if (isCorrectAnswer !== 0 && onDismissFeedback) {
                    onDismissFeedback();
                    return;
                  }

                  // Otherwise, submit the answer normally
                  if (textInput.trim()) {
                    onAnswerSubmit(textInput);
                    setTextInput("");
                  }
                }
              }}
              placeholder="Type your answer here..."
            />
          </div>
        </div>

        {/* Instruction Popup - shows on first render, appears on right side */}
        {giveInstruction && (
          <div className="shrink-0 w-80 animate-slide-in-right relative z-30">
            <div className="bg-linear-to-br from-blue-500/50 via-purple-500/50 to-pink-500/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="text-6xl">💡</div>
                <p className="text-2xl font-black text-white drop-shadow-lg text-center">
                  How to Play
                </p>
                <p className="text-lg font-bold text-white/95 drop-shadow-md text-center leading-relaxed">
                  Type your answer and press{" "}
                  <span className="bg-white/30 px-2 py-1 rounded-lg font-black">
                    Enter
                  </span>{" "}
                  to submit!
                </p>
                <p className="text-base font-semibold text-white/90 drop-shadow-sm text-center">
                  Race to win! 🏁
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Answer Feedback Overlay - Correct Answer */}
      {isCorrectAnswer === 1 && (
        <div className="fixed inset-0 z-100 flex items-center justify-center animate-fade-in-out">
          <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm pointer-events-auto"></div>
          <div className="relative w-[500px] h-[400px] bg-linear-to-br from-green-400 via-emerald-400 to-teal-400 rounded-3xl p-12 shadow-2xl border-4 border-white/80 animate-bounce-in flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="text-8xl animate-spin-slow">✨</div>
              <div className="text-7xl font-black text-white animate-scale-bounce">
                ✓
              </div>
              <p className="text-4xl font-black text-white drop-shadow-lg text-center">
                Correct!
              </p>
              <p className="text-2xl font-bold text-white/90 drop-shadow-md text-center">
                Great job! 🎉
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Answer Feedback Overlay - Wrong Answer */}
      {isCorrectAnswer === -1 && (
        <div className="fixed inset-0 z-100 flex items-center justify-center animate-fade-in-out">
          <div className="absolute inset-0 bg-orange-500/20 backdrop-blur-sm pointer-events-auto"></div>
          <div className="relative w-[500px] h-[400px] bg-linear-to-br from-orange-400 via-red-400 to-pink-400 rounded-3xl p-12 shadow-2xl border-4 border-white/80 animate-shake-in flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="text-8xl animate-wiggle">💪</div>
              <div className="text-7xl font-black text-white animate-scale-bounce">
                ✗
              </div>
              <p className="text-4xl font-black text-white drop-shadow-lg text-center">
                Not quite...
              </p>
              <p className="text-2xl font-bold text-white/90 drop-shadow-md text-center">
                Keep trying! You got this! 💪
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Click Warning Modal - appears when user clicks on choices */}
      {errorClick && (
        <div className="fixed inset-0 z-100 flex items-center justify-center animate-fade-in-out">
          <div className="absolute inset-0 bg-orange-500/20 backdrop-blur-sm pointer-events-auto"></div>
          <div className="relative w-[500px] h-[400px] bg-linear-to-br from-orange-400 via-amber-400 to-yellow-400 rounded-3xl p-12 shadow-2xl border-4 border-white/80 animate-shake-in flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="text-8xl animate-wiggle">⚠️</div>
              <div className="text-7xl font-black text-white animate-scale-bounce">
                ✋
              </div>
              <p className="text-4xl font-black text-white drop-shadow-lg text-center">
                No Clicking!
              </p>
              <p className="text-2xl font-bold text-white/90 drop-shadow-md text-center">
                You must{" "}
                <span className="bg-white/30 px-3 py-1 rounded-lg font-black">
                  type
                </span>{" "}
                your answer and press{" "}
                <span className="bg-white/30 px-3 py-1 rounded-lg font-black">
                  Enter
                </span>
                !
              </p>
              <p className="text-xl font-semibold text-white/90 drop-shadow-sm text-center">
                Keep typing! 💪
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cars positioned on left and right sides of the road line */}
      {/* White line center is at top: 70%, left: 70%, cars start from fixed positions on left/right sides */}
      {/* Player's car on the left side of the road */}
      <div
        className="absolute pointer-events-none z-5 transition-all duration-300 ease-in-out"
        style={{
          top: "80%",
          left: "58%",
          transformOrigin: "center center",
          // Fixed starting position: -80px offset to left side, then move along line direction
          transform: `translate(calc(-50% - 80px + ${playerMoveX.toFixed(
            2
          )}vw), calc(-50% + ${playerMoveY.toFixed(2)}vw))`,
        }}
      >
        <div className="relative">
          {/* Player tag - green circle with "You" label */}
          <div className="relative w-fit h-fit">
            <Image
              src="/Assets/TypeQuest/racer car 1.png"
              alt="Player Car"
              width={480}
              height={480}
              className="object-contain"
            />
            <div
              className="absolute left-1/2 -translate-x-1/2 z-10"
              style={{ top: "55%" }}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="bg-green-500 rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-white/80">
                  <span className="text-white text-xs font-black">You</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Opponent's car on the right side of the road */}
      <div
        className="absolute pointer-events-none z-5 transition-all duration-300 ease-in-out"
        style={{
          top: "90%",
          left: "63%",
          transformOrigin: "center center",
          // Fixed starting position: +80px offset to right side, then move along line direction
          transform: `translate(calc(-50% + 80px + ${opponentMoveX.toFixed(
            2
          )}vw), calc(-50% + ${opponentMoveY.toFixed(2)}vw))`,
        }}
      >
        <div className="relative">
          {/* Opponent tag - orange circle with "Opponent" label */}

          <div className="relative w-fit h-fit">
            <Image
              src="/Assets/TypeQuest/racer car 2.png"
              alt="Opponent Car"
              width={480}
              height={480}
              className="object-contain"
            />
            <div
              className="absolute left-1/2 -translate-x-1/2 z-10"
              style={{ top: "42%" }}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="bg-orange-500 rounded-full w-20 h-10 flex items-center justify-center shadow-lg border-2 border-white/80 px-2">
                  <span className="text-white text-xs font-black">
                    Opponent
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TQ_ActiveScreen;
