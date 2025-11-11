"use client";
import React, { useState, useCallback, useEffect } from "react";
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
import { Settings, Lightbulb, HelpCircle } from "lucide-react";
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
  const cpuTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const hasResetRef = React.useRef(false);
  const cpuScheduledRef = React.useRef(false);

  // Check if gameState is valid after hooks
  useEffect(() => {
    if (currentGameState.status === "active") {
      saveGameState(currentGameState);
    }
  }, [currentGameState]);

  if (!gameState || !gameState.currentPlayer) {
    return <div>Data loading...</div>;
  }

  const currentPlayer = currentGameState.currentPlayer;
  const opponent = currentGameState.opponent;

  // Calculate progress percentage - use currentPlayer if available, fallback to legacy
  const currentQuestionIndex = currentPlayer?.currentQuestionIndex ?? 
    currentGameState.currentQuestionIndex ?? 0;

  const currentQuestion = currentGameState.questions?.[currentQuestionIndex];
  
  if (!currentQuestion) {
    return <div>Loading question...</div>;
  }
  
  const questionProgress = getCurrentQuestionProgress(currentGameState);

  // Calculate progress for display
  const currentPlayerPosition = currentPlayer?.currentQuestionIndex || 0;
  const opponentPosition = opponent?.currentQuestionIndex || 0;
  const totalQuestions = currentGameState.totalQuestions || 0;

  const currentPlayerPositionPercentage = (currentPlayerPosition / totalQuestions) * 90;
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

  const scheduleCPUAnswer = useCallback(
    (difficulty: "easy" | "medium") => {
      console.log("Scheduling CPU answer...");
      
      if (cpuTimerRef.current) {
        console.log("Clearing existing CPU timer");
        clearTimeout(cpuTimerRef.current);
        cpuTimerRef.current = null;
      }

      // random delay based on difficulty and current question
      const baseThinkTime = 4000; // Base thinking time of 2 seconds
      const randomThinkTime = Math.random() * 2000;
      const difficultyMultiplier = difficulty === "easy" ? 1.5 : 1; // Easy mode is slower
      
      // Add some randomness based on question length
      const questionLength = currentQuestion?.incorrectSentence.length || 20;
      const lengthFactor = Math.min(questionLength / 20, 2); // Cap at 2x for very long sentences
      
      const totalDelay = (baseThinkTime + randomThinkTime) * difficultyMultiplier * lengthFactor;
      
      console.log("Setting timer for", {
        baseThinkTime,
        randomThinkTime,
        difficultyMultiplier,
        questionLength,
        lengthFactor,
        totalDelay: Math.round(totalDelay)
      });

      cpuTimerRef.current = setTimeout(() => {
        console.log("CPU timer triggered, updating state");
        setCurrentGameState((prevState) => {
          if (!prevState?.opponent || prevState.opponent.isFinished || prevState.status !== "active") {
            console.log("CPU skipping move - game not active or opponent finished", {
              hasOpponent: !!prevState?.opponent,
              opponentFinished: prevState?.opponent?.isFinished,
              gameStatus: prevState?.status
            });
            return prevState;
          }

          console.log("CPU making move", {
            currentQuestion: prevState.opponent.currentQuestionIndex,
            questionsAnswered: prevState.opponent.questionsAnswered
          });

          const updatedState = updateCPUProgress(prevState, difficulty);
          
          console.log("CPU move complete", {
            newQuestion: updatedState.opponent?.currentQuestionIndex,
            totalAnswered: updatedState.opponent?.questionsAnswered
          });

          return updatedState;
        });

        // Schedule next move after state update
        setTimeout(() => {
          setCurrentGameState(prevState => {
            if (prevState?.status === "active" && prevState.opponent && !prevState.opponent.isFinished) {
              console.log("Scheduling next CPU move");
              scheduleCPUAnswer(difficulty);
            } else {
              console.log("CPU finished or game ended", {
                gameStatus: prevState?.status,
                opponentFinished: prevState?.opponent?.isFinished
              });
            }
            return prevState;
          });
        }, 0);
      }, totalDelay);
    },
    []
  );

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
            opponent: currentGameState.opponent ? {
              ...currentGameState.opponent,
              isFinished: true,
            } : undefined,
          };        // Update the state one final time
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
      isScheduled: cpuScheduledRef.current
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
            setGameStatus("finished");
            onGameFinished(updatedState);
          } else {
            // Player finished first - mark CPU as finished
            updatedState.status = "finished";
            updatedState.endTime = Date.now();
            if (updatedState.opponent) {
              updatedState.opponent.isFinished = true;
            }
            setGameStatus("finished");
            onGameFinished(updatedState);
          }
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
        setGameStatus("finished");
        onGameFinished(updatedState);
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

  return (
    <div
      className="flex w-full h-dvh flex-col gap-5 p-10 relative overflow-hidden"
      style={{
        backgroundImage: "url(/Assets/TypeQuest/background_play.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Background gradient overlay - darker on left, transparent on right */}
      <div className="absolute inset-0 bg-linear-to-r from-black/50 via-black/30 to-transparent pointer-events-none z-0"></div>

      {/* Animated road lines - decorative scrolling effect from bottom-left to top-right */}
      <div
        className="absolute pointer-events-none z-1 overflow-hidden"
        style={{
          width: "150vw",
          height: "4px",
          top: "70%",
          left: "70%",
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
        <BackTo title="Back To Home" onClick={onRestartGame} />
        <div className="flex flex-row items-center gap-4">
          <div className="flex flex-row items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/60 backdrop-blur-sm border border-white/20">
            <p className="text-md font-semibold text-slate-100">Question</p>
            <p className="text-md font-bold text-slate-100">
              {currentPlayer?.questionsAnswered || 0} {" / "}{" "}
              {totalQuestions || 0}
            </p>
          </div>
          <div className="flex flex-row items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/60 backdrop-blur-sm border border-white/20">
            <p className="text-md font-semibold text-slate-100">Mistakes</p>
            <p className="text-md font-bold text-slate-100">
              {currentPlayer?.currentQuestionMistakes || 0}
            </p>
          </div>
          <div className="flex flex-row items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/60 backdrop-blur-sm border border-white/20">
            <p className="text-md font-semibold text-slate-100">Points</p>
            <p className="text-md font-bold text-slate-100">
              {currentPlayer?.totalPoints || 0}
            </p>
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-3 bg-slate-900/60 backdrop-blur-sm border border-white/20 hover:bg-slate-800/80 rounded-lg transition-all"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-slate-100" />
          </button>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="flex flex-row items-center gap-10 shrink-0 relative z-10">
        <div className="flex flex-col gap-2 w-[50%] items-start px-4 py-3 rounded-lg bg-slate-900/60 backdrop-blur-sm border border-white/20">
          <p className="text-sm font-semibold text-slate-100">Your Progress</p>
          <div className="relative w-full h-5 bg-slate-100 rounded-full">
            <div
              className={`absolute top-0 left-0 h-full bg-green-500 rounded-full transition-all duration-300`}
              style={{
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    getProgressPercentage(
                      currentPlayer?.questionsAnswered || 0,
                      totalQuestions || 0
                    )
                  )
                )}%`,
              }}
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 items-start px-4 py-3 rounded-lg bg-slate-900/60 backdrop-blur-sm border border-white/20">
          <p className="text-sm font-semibold text-slate-100">
            {opponent?.playerName || "CPU"} Progress
          </p>
          <div className="relative w-full h-5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full bg-yellow-500 rounded-full transition-all duration-300`}
              style={{
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    getProgressPercentage(
                      opponent?.questionsAnswered || 0,
                      totalQuestions || 0
                    )
                  )
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Question and Answer Section */}
      <div className="flex flex-col gap-5 w-full max-w-2xl ml-10 pt-10 p-5 relative z-10">
        <div className="flex-center w-full">
          <p className="text-2xl font-bold text-slate-100 mb-4">
            ✏️ Fix this sentence:
          </p>
        </div>
        <div className="bg-red-100 border-4 border-red-500 p-6 rounded-2xl shadow-lg">
          <p className="text-2xl md:text-3xl font-bold text-red-700 leading-relaxed text-center">
            {getSentencePartsWithUnderline(
              currentQuestion.incorrectSentence,
              currentQuestion.wordToUnderline
            ).map((part, index) =>
              part.shouldUnderline ? (
                <span
                  key={index}
                  className="underline decoration-red-500 decoration-2 underline-offset-2"
                >
                  {part.text}
                </span>
              ) : (
                <span key={index}>{part.text}</span>
              )
            )}
          </p>
        </div>
        <div className="flex flex-col gap-5">
          <div className="relative flex-row items-center rounded-md border border-white/30 shadow-md bg-slate-900/60 backdrop-blur-sm">
            <textarea
              className="w-full text-semibold text-lg px-5 py-5 rounded-md border-0 bg-transparent text-slate-100 placeholder:text-slate-400 outline-none focus:outline-none focus:ring-0 min-h-[120px] resize-y"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type the correct sentence here..."
              rows={3}
            />
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={handleAnswerSubmit}
              disabled={!userInput.trim()}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold text-xl px-8 py-5 rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
            >
              Submit Answer
            </button>

            {canShowHint && (
              <button
                onClick={handleShowHint}
                className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-lg px-6 py-5 rounded-xl transition-all hover:scale-105 shadow-lg"
              >
                <Lightbulb className="w-5 h-5" />
                💡 See Hint
              </button>
            )}

            {canGiveUp && (
              <button
                onClick={handleGiveUpClick}
                className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold text-lg px-6 py-5 rounded-xl transition-all hover:scale-105 shadow-lg"
              >
                <HelpCircle className="w-5 h-5" />
                Give Up
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cars positioned on left and right sides of the road line */}
      {/* Player's car on the left side of the road */}
      <div
        className="absolute pointer-events-none z-5 transition-all duration-300 ease-in-out"
        style={{
          top: "80%",
          left: "58%",
          transformOrigin: "center center",
          transform: `translate(calc(-50% - 80px + ${playerMoveX.toFixed(
            2
          )}vw), calc(-50% + ${playerMoveY.toFixed(2)}vw))`,
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
      {opponent && (
        <div
          className="absolute pointer-events-none z-5 transition-all duration-300 ease-in-out"
          style={{
            top: "90%",
            left: "63%",
            transformOrigin: "center center",
            transform: `translate(calc(-50% + 80px + ${opponentMoveX.toFixed(
              2
            )}vw), calc(-50% + ${opponentMoveY.toFixed(2)}vw))`,
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
      )}

      {/* Success Message removed: immediate transition on correct answer */}

      {/* Incorrect Answer Popup */}
      {showIncorrectPopup && (
        <div className="fixed inset-0 bg-black/60 flex-center z-50">
          <div className="bg-linear-to-br from-red-400 to-red-600 text-white p-10 rounded-3xl text-center max-w-md mx-4 shadow-2xl border-4 border-white">
            <p className="text-4xl font-bold mb-4">😅 Try Again!</p>
            <p className="text-xl mb-6">
              Not quite right yet! Take another look and try again.
            </p>
            <button
              onClick={handleTryAgain}
              className="bg-white text-red-600 px-8 py-4 rounded-xl font-bold text-xl hover:bg-gray-100 transition-all hover:scale-105"
            >
              Keep Trying! 💪
            </button>
          </div>
        </div>
      )}

      {/* Hint Popup */}
      {showHintPopup && currentQuestion.hint && (
        <div className="fixed inset-0 bg-black/60 flex-center z-50">
          <div className="bg-linear-to-br from-yellow-400 to-orange-500 text-white p-10 rounded-3xl text-center max-w-md mx-4 shadow-2xl border-4 border-white">
            <p className="text-4xl mb-4">💡 Hint!</p>
            <p className="text-xl mb-6">{currentQuestion.hint}</p>
            <button
              onClick={() => setShowHintPopup(false)}
              className="bg-white text-orange-600 px-8 py-4 rounded-xl font-bold text-xl hover:bg-gray-100 transition-all hover:scale-105"
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
