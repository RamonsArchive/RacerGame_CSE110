/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  TreasureHuntGameState,
  GameStatus,
  GAME_CONFIG,
} from "@/app/constants/index_treasurehunt";
import {
  validateGrammarSentence,
  handleCorrectAnswer,
  handleIncorrectAnswer,
  saveGameState,
  showHint,
  handleGiveUp,
  getCurrentQuestionProgress,
  getSentencePartsWithUnderline,
  updateCPUProgress,
} from "@/lib/utils_treasurehunt";
import { Settings, Lightbulb, HelpCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import BackTo from "./BackTo";
import Image from "next/image";

const TH_ActiveScreen = ({
  gameState,
  setGameStatus,
  onGameFinished,
  onRestartGame,
}: {
  gameState: TreasureHuntGameState;
  setGameStatus: (status: GameStatus) => void;
  onGameFinished: (updatedState: TreasureHuntGameState) => void;
  onRestartGame: () => void;
}) => {
  const [userInput, setUserInput] = useState<string>("");
  const [showIncorrectPopup, setShowIncorrectPopup] = useState<boolean>(false);
  const [showHintPopup, setShowHintPopup] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [currentGameState, setCurrentGameState] =
    useState<TreasureHuntGameState>(gameState);

  // Refs for CPU timer management
  const cpuTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cpuScheduledRef = useRef<boolean>(false);
  const hasResetRef = useRef<boolean>(false);

  // Get player references
  const currentPlayer = currentGameState.currentPlayer;
  const opponent = currentGameState.opponent;

  // Calculate progress percentage - use currentPlayer if available, fallback to legacy
  const currentQuestionIndex =
    currentPlayer?.currentQuestionIndex ??
    currentGameState.currentQuestionIndex ??
    0;

  const currentQuestion = currentGameState.questions?.[currentQuestionIndex];

  const questionProgress = getCurrentQuestionProgress(currentGameState);

  // Calculate progress for display
  const currentPlayerPosition = currentPlayer?.currentQuestionIndex || 0;
  const opponentPosition = opponent?.currentQuestionIndex || 0;
  const totalQuestions = currentGameState.totalQuestions || 0;

  const currentPlayerPositionPercentage =
    (currentPlayerPosition / totalQuestions) * 90;
  const opponentPositionPercentage = (opponentPosition / totalQuestions) * 90;

  // White line is at top: 70%, left: 70%, rotated -35.5deg
  // Cars should move along this line direction based on progress
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

  // Show hint button after first mistake
  const canShowHint =
    questionProgress &&
    questionProgress.mistakes >= GAME_CONFIG.HINT_MISTAKE_THRESHOLD &&
    !questionProgress.hintShown;

  // Show give up button after 3 mistakes
  const canGiveUp =
    questionProgress &&
    questionProgress.mistakes >= GAME_CONFIG.GIVE_UP_MISTAKE_THRESHOLD;

  // Save game state when it changes
  useEffect(() => {
    if (currentGameState.status === "active") {
      saveGameState(currentGameState);
    }
  }, [currentGameState]);

  const scheduleCPUAnswer = useCallback((difficulty: "easy" | "medium") => {
    console.log("Scheduling CPU answer...");

    if (cpuTimerRef.current) {
      console.log("Clearing existing CPU timer");
      clearTimeout(cpuTimerRef.current);
      cpuTimerRef.current = null;
    }

    // random delay based on difficulty and current question
    const baseThinkTime = 6000; // Base thinking time of 2 seconds
    const randomThinkTime = Math.random() * 2000;
    const difficultyMultiplier = difficulty === "easy" ? 1.5 : 1; // Easy mode is slower

    // Add some randomness based on question length
    const questionLength = currentQuestion?.incorrectSentence.length || 20;
    const lengthFactor = Math.min(questionLength / 20, 2); // Cap at 2x for very long sentences

    const totalDelay =
      (baseThinkTime + randomThinkTime) * difficultyMultiplier * lengthFactor;

    console.log("Setting timer for", {
      baseThinkTime,
      randomThinkTime,
      difficultyMultiplier,
      questionLength,
      lengthFactor,
      totalDelay: Math.round(totalDelay),
    });

    cpuTimerRef.current = setTimeout(() => {
      console.log("CPU timer triggered, updating state");
      setCurrentGameState((prevState) => {
        if (
          !prevState?.opponent ||
          prevState.opponent.isFinished ||
          prevState.status !== "active"
        ) {
          console.log(
            "CPU skipping move - game not active or opponent finished",
            {
              hasOpponent: !!prevState?.opponent,
              opponentFinished: prevState?.opponent?.isFinished,
              gameStatus: prevState?.status,
            }
          );
          return prevState;
        }

        console.log("CPU making move", {
          currentQuestion: prevState.opponent.currentQuestionIndex,
          questionsAnswered: prevState.opponent.questionsAnswered,
        });

        const updatedState = updateCPUProgress(prevState, difficulty);

        console.log("CPU move complete", {
          newQuestion: updatedState.opponent?.currentQuestionIndex,
          totalAnswered: updatedState.opponent?.questionsAnswered,
        });

        return updatedState;
      });

      // Schedule next move after state update
      setTimeout(() => {
        setCurrentGameState((prevState) => {
          if (
            prevState?.status === "active" &&
            prevState.opponent &&
            !prevState.opponent.isFinished
          ) {
            console.log("Scheduling next CPU move");
            scheduleCPUAnswer(difficulty);
          } else {
            console.log("CPU finished or game ended", {
              gameStatus: prevState?.status,
              opponentFinished: prevState?.opponent?.isFinished,
            });
          }
          return prevState;
        });
      }, 0);
    }, totalDelay);
  }, []);

  // Separate effect to handle game status updates to avoid setState during render
  useEffect(() => {
    // Only check for game end conditions if the game is active
    if (currentGameState.status === "active") {
      const isGameFinished =
        currentGameState.opponent?.isFinished ||
        currentGameState.currentPlayer.isFinished;

      if (isGameFinished) {
        const finalState: TreasureHuntGameState = {
          ...currentGameState,
          status: "finished" as GameStatus,
          endTime: Date.now(),
          opponent: currentGameState.opponent
            ? {
                ...currentGameState.opponent,
                isFinished: true,
              }
            : undefined,
        }; // Update the state one final time
        setCurrentGameState(finalState);

        // Schedule status updates in next tick to avoid setState during render
        setTimeout(() => {
          setGameStatus("finished");
          onGameFinished(finalState);
        }, 0);
      } else if (
        currentGameState.opponent &&
        !currentGameState.opponent.isFinished &&
        !currentGameState.currentPlayer.isFinished
      ) {
        // Schedule next CPU move if game is still active
        scheduleCPUAnswer("medium");
      }
    }
  }, [
    currentGameState.status,
    currentGameState.opponent?.isFinished,
    currentGameState.currentPlayer.isFinished,
    setGameStatus,
    onGameFinished,
  ]);

  // Start CPU when game becomes active - only trigger once when game starts
  useEffect(() => {
    console.log("🎮 Game status changed", {
      status: currentGameState?.status,
      mode: currentGameState?.mode,
      hasTimer: !!cpuTimerRef.current,
      isScheduled: cpuScheduledRef.current,
    });

    if (
      currentGameState?.status === "active" &&
      currentGameState.mode === "solo" &&
      currentGameState.opponent &&
      !currentGameState.opponent.isFinished &&
      !currentGameState.currentPlayer.isFinished &&
      !cpuTimerRef.current &&
      !cpuScheduledRef.current
    ) {
      console.log("🎮 Starting initial CPU scheduling");
      cpuScheduledRef.current = true;
      scheduleCPUAnswer("medium");
    }

    // Cleanup on unmount
    return () => {
      if (cpuTimerRef.current) {
        console.log("🎮 Cleaning up CPU timer on unmount");
        clearTimeout(cpuTimerRef.current);
        cpuTimerRef.current = null;
      }
      cpuScheduledRef.current = false;
    };
  }, [
    currentGameState?.status,
    currentGameState?.mode,
    currentGameState?.opponent?.isFinished,
    currentGameState?.currentPlayer?.isFinished,
    scheduleCPUAnswer,
  ]);

  // Reset ref when game resets
  useEffect(() => {
    hasResetRef.current = false;
    return () => {
      hasResetRef.current = true;
    };
  }, []);

  const handleAnswerSubmit = useCallback(() => {
    if (!userInput.trim()) return;

    const isCorrect = validateGrammarSentence(
      userInput.trim(),
      currentQuestion.correctSentence
    );

    if (isCorrect) {
      setCurrentGameState((prevState) => {
        // Clear CPU timer when player answers to prevent stale updates
        if (cpuTimerRef.current) {
          clearTimeout(cpuTimerRef.current);
          cpuTimerRef.current = null;
        }

        const updatedState = handleCorrectAnswer(prevState);

        if (updatedState.currentPlayer.isFinished) {
          // Player finished - check if CPU is also finished
          if (updatedState.opponent?.isFinished) {
            updatedState.status = "finished";
            updatedState.endTime = Date.now();
          } else {
            // Player finished first - mark CPU as finished
            updatedState.status = "finished";
            updatedState.endTime = Date.now();
            if (updatedState.opponent) {
              updatedState.opponent.isFinished = true;
            }
          }
          // Schedule status updates in next tick to avoid setState during render
          setTimeout(() => {
            setGameStatus("finished");
            onGameFinished(updatedState);
          }, 0);
        } else {
          // CPU scheduling is now handled by the game status effect
        }
        return updatedState;
      });
      setUserInput("");
    } else {
      setCurrentGameState((prevState) => {
        return handleIncorrectAnswer(prevState, userInput.trim());
      });
      setShowIncorrectPopup(true);
    }
  }, [
    userInput,
    currentQuestion,
    setGameStatus,
    onGameFinished,
    scheduleCPUAnswer,
  ]);

  const handleTryAgain = useCallback(() => {
    setShowIncorrectPopup(false);
    setUserInput("");
  }, []);

  const handleShowHint = useCallback(() => {
    const updatedState = showHint(currentGameState);
    setCurrentGameState(updatedState);
    setShowHintPopup(true);
  }, [currentGameState]);

  const handleGiveUpClick = useCallback(() => {
    if (
      confirm(
        "Are you sure you want to give up on this question? You won't get a point for it."
      )
    ) {
      const updatedState = handleGiveUp(currentGameState);
      setCurrentGameState(updatedState);
      setUserInput("");

      if (updatedState.currentPlayer.isFinished) {
        updatedState.status = "finished";
        setCurrentGameState(updatedState);
        // Schedule status updates in next tick to avoid setState during render
        setTimeout(() => {
          setGameStatus("finished");
          onGameFinished(updatedState);
        }, 0);
      }
    }
  }, [currentGameState, setGameStatus, onGameFinished]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleAnswerSubmit();
      }
    },
    [handleAnswerSubmit]
  );

  // Helper function to calculate progress percentage
  const getProgressPercentage = (current: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  };

  // Early return after all hooks - check if question exists
  if (!currentQuestion) {
    return <div>Loading question...</div>;
  }

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Assets/TreasureHunt/TH.png"
          alt="Treasure Hunt Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Seagulls in top right corner */}
      <div className="absolute top-56 right-36 z-20 flex items-start gap-4">
        <div className="animate-seagull-fly-1">
          <Image
            src="/Assets/TreasureHunt/seagull.png"
            alt="Seagull"
            width={160}
            height={160}
            className="drop-shadow-lg"
          />
        </div>
        <div className="animate-seagull-fly-2 mt-4">
          <Image
            src="/Assets/TreasureHunt/seagull.png"
            alt="Seagull"
            width={70}
            height={70}
            className="drop-shadow-lg"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-14 flex items-center justify-center w-full h-dvh p-8 gap-8">
        {/* Player Progress Card - Left Side */}
        <div className="flex flex-col w-full max-w-2xl gap-6 bg-white/40 backdrop-blur-sm p-8 rounded-3xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="group flex items-center gap-2 px-4 py-2 bg-blue-500/60 backdrop-blur-sm hover:bg-blue-600/70 text-white rounded-xl font-bold transition-all hover:scale-105"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Home</span>
            </Link>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-3 bg-blue-500/60 backdrop-blur-sm hover:bg-blue-600/70 text-white rounded-full transition-all hover:scale-110"
              aria-label="Settings"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-black text-center text-orange-600 drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)]">
            <span className="text-yellow-400">Treasure</span>{" "}
            <span className="text-yellow-400">Hunt</span>{" "}
          </h1>

          {/* Progress Bar - Kid Friendly */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <p className="text-xl font-bold text-blue-700">
                Question {currentQuestionIndex + 1} of{" "}
                {currentGameState.totalQuestions}
              </p>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-400/60 backdrop-blur-sm rounded-full">
                <span className="text-2xl">⭐</span>
                <p className="text-xl font-bold text-white">
                  Points: {currentPlayer?.totalPoints ?? 0}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200/50 backdrop-blur-sm rounded-full h-8 overflow-visible shadow-inner relative">
              <div
                className="bg-linear-to-r from-blue-400 via-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-16 relative overflow-visible"
                style={{
                  width: `${Math.max((currentQuestionIndex / currentGameState.totalQuestions) * 100, 5)}%`,
                }}
              >
                {/* Wave animation overlay */}
                <div
                  className="absolute inset-0 opacity-30 animate-wave"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      90deg,
                      transparent,
                      transparent 2px,
                      rgba(255, 255, 255, 0.3) 2px,
                      rgba(255, 255, 255, 0.3) 4px
                    )`,
                    backgroundSize: "200px 100%",
                  }}
                />
                {(currentQuestionIndex / currentGameState.totalQuestions) *
                  100 >
                  15 && (
                  <span className="text-white font-bold text-sm relative z-10">
                    {Math.round(
                      (currentQuestionIndex / currentGameState.totalQuestions) *
                        100
                    )}
                    %
                  </span>
                )}
              </div>
              {/* Floating boat on progress bar */}
              <div
                className="absolute top-1/2 -translate-y-1/2 animate-boat-float z-20"
                style={{
                  left: `calc(${Math.max((currentQuestionIndex / currentGameState.totalQuestions) * 100, 5)}% - 30px)`,
                  transition: "left 0.5s ease-out",
                }}
              >
                <Image
                  src="/Assets/TreasureHunt/Boat.png"
                  alt="Boat"
                  width={60}
                  height={60}
                  className="drop-shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* Incorrect Sentence Display */}
          <div className="text-center">
            <p className="text-xl font-bold text-gray-700 mb-4">
              ✏️ Fix this sentence:
            </p>
            <div className="bg-red-100/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
              <p className="text-2xl md:text-3xl font-bold text-red-700 leading-relaxed">
                {getSentencePartsWithUnderline(
                  currentQuestion.incorrectSentence,
                  currentQuestion.wordToUnderline
                ).map((part, index) =>
                  part.shouldUnderline ? (
                    <span
                      key={index}
                      className="underline decoration-red-500 decoration-2 underline-offset-2 animate-bounce"
                    >
                      {part.text}
                    </span>
                  ) : (
                    <span key={index}>{part.text}</span>
                  )
                )}
              </p>
            </div>
          </div>

          {/* Input Area */}
          <div className="flex flex-col gap-4">
            <textarea
              className="w-full text-xl px-6 py-5 rounded-2xl bg-white/50 backdrop-blur-sm text-gray-900 outline-none focus:ring-4 focus:ring-blue-200 transition-all min-h-[120px] resize-y font-nunito shadow-lg"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type the correct sentence here..."
              rows={3}
            />

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={handleAnswerSubmit}
                disabled={!userInput.trim()}
                className="flex-1 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-2xl px-8 py-5 rounded-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
              >
                ✅ Submit Answer
              </button>

              {canShowHint && (
                <button
                  onClick={handleShowHint}
                  className="flex items-center justify-center gap-2 bg-linear-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold text-lg px-6 py-5 rounded-2xl transition-all hover:scale-105 shadow-lg"
                >
                  <Lightbulb className="w-6 h-6" />
                  💡 See Hint
                </button>
              )}

              {canGiveUp && (
                <button
                  onClick={handleGiveUpClick}
                  className="flex items-center justify-center gap-2 bg-linear-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold text-lg px-6 py-5 rounded-2xl transition-all hover:scale-105 shadow-lg"
                >
                  <HelpCircle className="w-6 h-6" />
                  Give Up
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CPU/Opponent Progress Card - Right Side */}
        {opponent && (
          <div className="flex flex-col w-full max-w-2xl gap-6 bg-white/40 backdrop-blur-sm p-8 rounded-3xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-purple-700">
                {opponent.playerName || "CPU"}
              </h2>
            </div>

            {/* Progress Bar */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <p className="text-xl font-bold text-purple-700">
                  Question {opponent.currentQuestionIndex + 1} of{" "}
                  {currentGameState.totalQuestions}
                </p>
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-400/60 backdrop-blur-sm rounded-full">
                  <span className="text-2xl">⭐</span>
                  <p className="text-xl font-bold text-white">
                    Points: {opponent.totalPoints ?? 0}
                  </p>
                </div>
              </div>
              <div className="w-full bg-gray-200/50 backdrop-blur-sm rounded-full h-8 overflow-visible shadow-inner relative">
                <div
                  className="bg-linear-to-r from-purple-400 via-purple-500 to-purple-600 h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-16 relative overflow-visible"
                  style={{
                    width: `${Math.max(
                      (opponent.currentQuestionIndex /
                        currentGameState.totalQuestions) *
                        100,
                      5
                    )}%`,
                  }}
                >
                  {/* Wave animation overlay */}
                  <div
                    className="absolute inset-0 opacity-30 animate-wave"
                    style={{
                      backgroundImage: `repeating-linear-gradient(
                      90deg,
                      transparent,
                      transparent 2px,
                      rgba(255, 255, 255, 0.3) 2px,
                      rgba(255, 255, 255, 0.3) 4px
                    )`,
                      backgroundSize: "200px 100%",
                    }}
                  />
                  {(opponent.currentQuestionIndex /
                    currentGameState.totalQuestions) *
                    100 >
                    15 && (
                    <span className="text-white font-bold text-sm relative z-10">
                      {Math.round(
                        (opponent.currentQuestionIndex /
                          currentGameState.totalQuestions) *
                          100
                      )}
                      %
                    </span>
                  )}
                </div>
                {/* Floating boat on progress bar */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 animate-boat-float z-20"
                  style={{
                    left: `calc(${Math.max(
                      (opponent.currentQuestionIndex /
                        currentGameState.totalQuestions) *
                        100,
                      5
                    )}% - 30px)`,
                    transition: "left 0.5s ease-out",
                  }}
                >
                  <Image
                    src="/Assets/TreasureHunt/Boat.png"
                    alt="Boat"
                    width={60}
                    height={60}
                    className="drop-shadow-lg"
                  />
                </div>
              </div>
            </div>

            {/* Status Display */}
            <div className="text-center">
              <p className="text-xl font-bold text-gray-700 mb-4">
                {opponent.isFinished
                  ? "🏁 Finished!"
                  : "⏳ Working on question..."}
              </p>
              {opponent.isFinished && (
                <div className="bg-purple-100/50 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
                  <p className="text-lg font-semibold text-purple-700">
                    Completed all questions!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Incorrect Answer Popup with shake animation */}
      {showIncorrectPopup && (
        <div className="fixed inset-0 bg-black/60 flex-center z-50">
          <div className="bg-linear-to-br from-red-400/80 to-red-600/80 backdrop-blur-md text-white p-10 rounded-3xl text-center max-w-md mx-4 shadow-2xl border-4 border-white/60 animate-bounce">
            <p className="text-4xl font-bold mb-4 animate-pulse">
              😅 Try Again!
            </p>
            <p className="text-xl mb-6">
              Not quite right yet! Take another look and try again.
            </p>
            <button
              onClick={handleTryAgain}
              className="bg-white/90 text-red-600 px-8 py-4 rounded-xl font-bold text-xl hover:bg-white transition-all hover:scale-105 backdrop-blur-sm animate-pulse"
            >
              Keep Trying! 💪
            </button>
          </div>
        </div>
      )}

      {/* Hint Popup with glow animation */}
      {showHintPopup && currentQuestion.hint && (
        <div className="fixed inset-0 bg-black/60 flex-center z-50">
          <div className="bg-linear-to-br from-yellow-400 to-orange-500 text-white p-10 rounded-3xl text-center max-w-md mx-4 shadow-2xl border-4 border-white animate-pulse">
            <p className="text-4xl mb-4 animate-bounce">💡 Hint!</p>
            <p className="text-xl mb-6">{currentQuestion.hint}</p>
            <button
              onClick={() => setShowHintPopup(false)}
              className="bg-white text-orange-600 px-8 py-4 rounded-xl font-bold text-xl hover:bg-gray-100 transition-all hover:scale-105 animate-pulse"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 flex-center z-50">
          <div className="bg-white p-8 rounded-3xl max-w-md mx-4 shadow-2xl border-4 border-purple-400">
            <h2 className="text-3xl font-bold text-center mb-6 text-purple-600">
              ⚙️ Settings
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Want to restart with different settings?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  onRestartGame();
                }}
                className="bg-linear-to-r from-blue-500 to-purple-600 text-white font-bold text-xl px-6 py-4 rounded-xl hover:scale-105 transition-all"
              >
                🔄 Restart Game
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="bg-gray-300 text-gray-700 font-bold text-lg px-6 py-3 rounded-xl hover:bg-gray-400 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TH_ActiveScreen;
