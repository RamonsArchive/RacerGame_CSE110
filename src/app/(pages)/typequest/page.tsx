/* TODO git commit -m "finished type quest, will need to fix bug where setup component 
requires 2 clicks to properly render. Will add multiplayer, will add testing, will add more word questions. Will finish as
thetics." also make error rate on cpu leaderobard more realistic */

"use client"; // page renders client side Essential for user interaction
import React, { useEffect, useCallback, useRef } from "react";
import { useState } from "react";
import {
  GameState,
  GameStatus,
  GAME_CONFIG,
  QuestionResult,
  PlayerProgress,
  GameMode,
  GradeLevel,
} from "@/app/constants/index_typequest";
import {
  initializeGame,
  calculateQuestionPoints,
  loadGameState,
  saveGameState,
  checkAnswer,
  simulateCPUAnswer,
  clearGameState,
  createGameResult,
} from "@/lib/utils_typequest";
import TQ_SetupScreen from "@/app/components/TQ_SetupScreen";
import TQ_ActiveScreen from "@/app/components/TQ_ActiveScreen";
import TQ_FinishedScreen from "@/app/components/TQ_FinishedScreen";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";

const TypeQuestPage = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("setup");
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const cpuTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasResetRef = useRef(false); // Add this

  const router = useRouter();
  useEffect(() => {
    const savedState = loadGameState();
    if (savedState) {
      setGameState(savedState);
      setGameStatus(savedState.status);
      if (savedState.status === "finished") {
        setHasBeenSaved(true);
      }
    }
  }, []);

  // Auto-save whenever game state changes for even driven updates
  useEffect(() => {
    if (gameState && gameStatus !== "setup") {
      saveGameState(gameState);
    }
  }, [gameState, gameStatus]);

  const updateCPUProgress = useCallback(
    (currentGameState: GameState): GameState => {
      if (!currentGameState.opponent || currentGameState.opponent.isFinished) {
        return currentGameState;
      }

      // ✅ If player finished, snapshot opponent and stop
      if (currentGameState.currentPlayer.isFinished) {
        console.log("⏹️ Player finished - snapshotting CPU progress");
        return {
          ...currentGameState,
          opponent: {
            ...currentGameState.opponent,
            isFinished: true, // Mark as finished
          },
        };
      }

      const currentQuestion =
        currentGameState.questions[
          currentGameState.opponent.currentQuestionIndex
        ];

      const cpuResult = simulateCPUAnswer(
        currentQuestion,
        currentGameState.opponent,
        "medium"
      );
      const cpuPoints = calculateQuestionPoints(
        cpuResult.timeSpent,
        cpuResult.mistakes,
        GAME_CONFIG.TARGET_TIMES[currentGameState.gradeLevel],
        currentQuestion.basePoints || GAME_CONFIG.BASE_POINTS
      );

      // simulate answer mistakes
      const answerMistakes: QuestionResult[] = [];
      for (let i = 0; i < cpuResult.mistakes; i++) {
        const answerMistake: QuestionResult = {
          questionId: currentQuestion.id,
          prompt: currentQuestion.prompt,
          userAnswer: currentQuestion.correctAnswer,
          correctAnswer: currentQuestion.correctAnswer,
          correct: false,
          timeSpent: cpuResult.timeSpent + i * 0.1,
          mistakes: 1,
          points: 0,
          timestamp: Date.now(),
        };
        answerMistakes.push(answerMistake);
      }

      const cpuQuestionResult: QuestionResult = {
        questionId: currentQuestion.id,
        prompt: currentQuestion.prompt,
        userAnswer: currentQuestion.correctAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        correct: true,
        timeSpent: cpuResult.timeSpent,
        mistakes: cpuResult.mistakes,
        points: cpuPoints,
        timestamp: Date.now(),
      };

      const allQuestionResults: QuestionResult[] = [
        ...currentGameState.opponent.questionResults,
        cpuQuestionResult,
        ...answerMistakes,
      ];

      const newQuestionIndex =
        currentGameState.opponent.currentQuestionIndex + 1;
      const newQuestionsAnswered =
        currentGameState.opponent.questionsAnswered + 1;
      const isOpponentFinished =
        newQuestionsAnswered >= currentGameState.totalQuestions;

      const updatedOpponent: PlayerProgress = {
        ...currentGameState.opponent,
        currentQuestionIndex: newQuestionIndex,
        questionsAnswered: newQuestionsAnswered,
        totalPoints: currentGameState.opponent.totalPoints + cpuPoints,
        totalMistakes:
          currentGameState.opponent.totalMistakes + cpuResult.mistakes,
        questionResults: allQuestionResults,
        isFinished: isOpponentFinished,
        questionStartTime: Date.now(),
      };

      const shouldEndGame =
        currentGameState.currentPlayer.isFinished && updatedOpponent.isFinished;

      return {
        ...currentGameState,
        opponent: updatedOpponent,
        status: shouldEndGame ? "finished" : "active",
        endTime: shouldEndGame ? Date.now() : null,
      };
    },
    []
  );

  // ✅ FIXED: CPU scheduling logic separated completely
  const scheduleCPUAnswer = useCallback(
    (difficulty: "easy" | "medium" | "hard") => {
      // Clear any existing timer
      if (cpuTimerRef.current) {
        clearTimeout(cpuTimerRef.current);
        cpuTimerRef.current = null;
      }

      // Get latest state to calculate delay
      setGameState((prevState) => {
        if (
          !prevState ||
          prevState.status !== "active" ||
          prevState.mode !== "solo"
        ) {
          return prevState;
        }

        if (!prevState.opponent || prevState.opponent.isFinished) {
          return prevState;
        }

        const currentQuestion =
          prevState.questions[prevState.opponent.currentQuestionIndex];

        // ✅ ADD THINKING TIME: Time to read/understand the question
        const wordCount = currentQuestion.prompt.split(" ").length;
        const thinkingTime = {
          easy: 5500 + wordCount * 150, // ~5500-7000ms base thinking
          medium: 11000 + wordCount * 100, // ~11000-12500ms base thinking
          hard: 12000 + wordCount * 100, // ~12000-13500ms base thinking
        }[difficulty];

        const thinkingVaraince = 0.8 + Math.random() * 0.7;
        const actualThinkingTime = thinkingTime * thinkingVaraince;

        // Calculate delay
        const baseTimePerChar = 300;
        const typingTime =
          currentQuestion.correctAnswer.length * baseTimePerChar; // larger delay for longer words
        const difficultyConfig = GAME_CONFIG.CPU_DIFFICULTY[difficulty];
        const adjustedTypingTime =
          typingTime / difficultyConfig.speedMultiplier;

        const typingVariance = 0.9 + Math.random() * 0.5;
        const actualTypingTime = adjustedTypingTime * typingVariance;

        const totalDelay = actualThinkingTime + actualTypingTime;

        // ✅ KEY FIX: Schedule timer but DON'T modify state here
        cpuTimerRef.current = setTimeout(() => {
          // Update CPU progress
          setGameState((currentState) => {
            if (!currentState) return null;

            // ✅ ADD THIS CHECK: Don't update if game was reset
            if (!currentState || currentState.status !== "active") {
              console.log(
                "⏹️ CPU timer fired but game is not active - ignoring"
              );
              return currentState;
            }

            // ✅ Check if we're resetting
            if (hasResetRef.current) {
              console.log(
                "⏹️ CPU timer fired but game is resetting - ignoring"
              );
              return null;
            }

            const updatedState = updateCPUProgress(currentState);

            if (updatedState.status === "finished") {
              setGameStatus("finished");
            } else if (
              updatedState.opponent &&
              !updatedState.opponent.isFinished &&
              !updatedState.currentPlayer.isFinished
            ) {
              // Schedule next CPU answer AFTER state update
              setTimeout(() => scheduleCPUAnswer(difficulty), 0);
            }

            return updatedState;
          });
        }, totalDelay);

        return prevState; // ✅ Don't modify state
      });
    },
    [updateCPUProgress]
  );

  // Start CPU when game becomes active - only trigger once
  useEffect(() => {
    if (
      gameState?.status === "active" &&
      gameState.mode === "solo" &&
      gameState.opponent &&
      !gameState.opponent.isFinished
    ) {
      // Only schedule if there's no active timer
      if (!cpuTimerRef.current) {
        scheduleCPUAnswer("medium");
      }
    }

    // Cleanup on unmount
    return () => {
      if (cpuTimerRef.current) {
        clearTimeout(cpuTimerRef.current);
        cpuTimerRef.current = null;
      }
    };
  }, [gameState?.status, gameState?.mode]); // ✅ REMOVED scheduleCPUAnswer from deps

  // save game result for leaderboard
  useEffect(() => {
    if (
      gameState?.status === "finished" &&
      gameState.endTime &&
      !hasBeenSaved
    ) {
      try {
        const result = createGameResult(gameState);
        console.log("Game result created:", result);
      } catch (error) {
        console.error("Error creating game result:", error);
      }
    }
  }, [gameState?.status, gameState?.endTime]); // ✅ Only trigger when actually finished

  const handleGameReset = useCallback(() => {
    hasResetRef.current = true; // Prevent load effect from running

    // Clear CPU timer on reset
    if (cpuTimerRef.current) {
      clearTimeout(cpuTimerRef.current);
      cpuTimerRef.current = null;
    }

    hasResetRef.current = true;
    clearGameState();
    flushSync(() => {
      setGameState(null);
      setHasBeenSaved(false);
      setGameStatus("setup");
    });

    setTimeout(() => {
      hasResetRef.current = false;
    }, 100);
  }, []);

  const handleGameStart = useCallback(
    (gameMode: GameMode, gradeLevel: GradeLevel, playerName: string) => {
      const newGameState = initializeGame(gameMode, gradeLevel, playerName);
      newGameState.status = "active";
      newGameState.startTime = Date.now();

      // Initialize question start times
      newGameState.currentPlayer.questionStartTime = Date.now();
      if (newGameState.opponent) {
        newGameState.opponent.questionStartTime = Date.now();
      }

      setGameState(newGameState);
      setGameStatus("active");
      saveGameState(newGameState);
      setHasBeenSaved(false);
    },
    []
  );

  const handleAnswerSubmit = useCallback(
    (userAnswer: string) => {
      if (!gameState || gameState.status !== "active") return;

      const currentQuestion =
        gameState.questions[gameState.currentPlayer.currentQuestionIndex];
      const questionStartTime =
        gameState.currentPlayer.questionStartTime || Date.now();

      const timeSpent = (Date.now() - questionStartTime) / 1000; // ✅ Convert to seconds

      const isCorrect = checkAnswer(
        userAnswer,
        currentQuestion.correctAnswer,
        true
      );

      if (isCorrect) {
        const points = calculateQuestionPoints(
          timeSpent,
          gameState.currentPlayer.currentQuestionMistakes || 0,
          GAME_CONFIG.TARGET_TIMES[gameState.gradeLevel],
          currentQuestion.basePoints || GAME_CONFIG.BASE_POINTS
        );

        const questionResult: QuestionResult = {
          questionId: currentQuestion.id,
          prompt: currentQuestion.prompt,
          userAnswer,
          correctAnswer: currentQuestion.correctAnswer,
          correct: true,
          timeSpent,
          mistakes: gameState.currentPlayer.currentQuestionMistakes || 0,
          points,
          timestamp: Date.now(),
        };

        const newQuestionIndex =
          gameState.currentPlayer.currentQuestionIndex + 1;
        const newQuestionsAnswered =
          gameState.currentPlayer.questionsAnswered + 1;
        const isPlayerFinished =
          newQuestionsAnswered >= gameState.totalQuestions;

        const updatedPlayer: PlayerProgress = {
          ...gameState.currentPlayer,
          currentQuestionIndex: newQuestionIndex,
          questionsAnswered: newQuestionsAnswered,
          totalPoints: gameState.currentPlayer.totalPoints + points,
          totalMistakes:
            gameState.currentPlayer.totalMistakes +
            (gameState.currentPlayer.currentQuestionMistakes || 0),
          questionResults: [
            ...gameState.currentPlayer.questionResults,
            questionResult,
          ],
          currentQuestionMistakes: 0,
          questionStartTime: isPlayerFinished ? null : Date.now(),
          isFinished: isPlayerFinished,
        };

        let finalOpponent = gameState.opponent;
        if (
          isPlayerFinished &&
          gameState.mode === "solo" &&
          gameState.opponent
        ) {
          console.log("📸 Player finished - snapshotting opponent state");

          // Clear CPU timer immediately
          if (cpuTimerRef.current) {
            clearTimeout(cpuTimerRef.current);
            cpuTimerRef.current = null;
          }

          // Snapshot opponent as-is
          finalOpponent = {
            ...gameState.opponent,
            isFinished: true, // Mark as finished
          };
        }

        const updatedGameState: GameState = {
          ...gameState,
          currentPlayer: updatedPlayer,
          opponent: finalOpponent,
          status: isPlayerFinished ? "finished" : "active", // ✅ Player finishing = game over
          endTime: isPlayerFinished ? Date.now() : null,
        };

        setGameState(updatedGameState);

        if (isPlayerFinished) {
          setGameStatus("finished");
          // Clear CPU timer when game ends
          if (cpuTimerRef.current) {
            clearTimeout(cpuTimerRef.current);
            cpuTimerRef.current = null;
          }
        }
      } else {
        // Incorrect answer - increment mistakes
        const questionResult: QuestionResult = {
          questionId: currentQuestion.id,
          prompt: currentQuestion.prompt,
          userAnswer,
          correctAnswer: currentQuestion.correctAnswer,
          correct: false,
          timeSpent,
          mistakes: gameState.currentPlayer.currentQuestionMistakes || 0,
          points: 0,
          timestamp: Date.now(),
        };
        const updatedGameState: GameState = {
          ...gameState,
          currentPlayer: {
            ...gameState.currentPlayer,
            currentQuestionMistakes:
              (gameState.currentPlayer.currentQuestionMistakes || 0) + 1,
            questionResults: [
              ...gameState.currentPlayer.questionResults,
              questionResult,
            ],
          },
        };

        setGameState(updatedGameState);
      }
    },
    [gameState]
  );

  const handleBackHome = useCallback(() => {
    handleGameReset();
    router.push("/");
  }, [handleGameReset, router]);

  console.log("Rendering - gameStatus:", gameStatus, "gameState:", gameState);

  return (
    <div className={`w-full h-dvh ${gameStatus === "active" ? "" : "bg-linear-to-br from-primary-800 via-secondary-800 to-tertiary-700"}`}>
      {gameStatus === "setup" && (
        <TQ_SetupScreen
          gameStatus={gameStatus}
          gameState={gameState}
          key={`setup-${Date.now()}`} // Force new instance every time
          handleGameStart={handleGameStart}
        />
      )}
      {gameStatus === "active" && (
        <TQ_ActiveScreen
          setGameStatus={setGameStatus}
          gameState={gameState}
          onAnswerSubmit={handleAnswerSubmit}
          handleGameReset={handleGameReset}
        />
      )}
      {gameStatus === "finished" && gameState && (
        <TQ_FinishedScreen
          gameState={gameState}
          onPlayAgain={handleGameReset}
          onBackHome={handleBackHome}
        />
      )}
      {!gameStatus ||
      (gameStatus !== "setup" &&
        gameStatus !== "active" &&
        gameStatus !== "finished") ? (
        <div className="text-white text-center p-10">
          ERROR: Invalid gameStatus = {gameStatus}
        </div>
      ) : null}
    </div>
  );
};

export default TypeQuestPage;
