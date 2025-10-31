"use client";
import React, { useState, useCallback, useEffect } from "react";
import { TreasureHuntGameState, GameStatus, GAME_CONFIG } from "@/app/constants/index_treasurehunt";
import {
  validateGrammarSentence,
  handleCorrectAnswer,
  handleIncorrectAnswer,
  saveGameState,
  showHint,
  handleGiveUp,
  getCurrentQuestionProgress,
} from "@/lib/utils_treasurehunt";
import { ChevronLeft, Settings, Lightbulb, HelpCircle } from "lucide-react";
import Link from "next/link";
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
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const [showHintPopup, setShowHintPopup] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [currentGameState, setCurrentGameState] = useState<TreasureHuntGameState>(gameState);
  const [backgroundImage, setBackgroundImage] = useState<number>(1);

  // Rotate background images
  useEffect(() => {
    const bgImages = [1, 2, 3];
    const randomBg = bgImages[Math.floor(Math.random() * bgImages.length)];
    setBackgroundImage(randomBg);
  }, [currentGameState.currentQuestionIndex]);

  // Calculate progress percentage
  const progressPercentage =
    currentGameState.totalQuestions > 0
      ? (currentGameState.currentQuestionIndex / currentGameState.totalQuestions) * 100
      : 0;

  const currentQuestion = currentGameState.questions[currentGameState.currentQuestionIndex];
  const questionProgress = getCurrentQuestionProgress(currentGameState);

  // Show hint button after first mistake
  const canShowHint = questionProgress && questionProgress.mistakes >= GAME_CONFIG.HINT_MISTAKE_THRESHOLD && !questionProgress.hintShown;
  
  // Show give up button after 3 mistakes
  const canGiveUp = questionProgress && questionProgress.mistakes >= GAME_CONFIG.GIVE_UP_MISTAKE_THRESHOLD;

  // Save game state when it changes
  useEffect(() => {
    if (currentGameState.status === "active") {
      saveGameState(currentGameState);
    }
  }, [currentGameState]);

  const handleAnswerSubmit = useCallback(() => {
    if (!userInput.trim()) return;

    const isCorrect = validateGrammarSentence(
      userInput.trim(),
      currentQuestion.correctSentence
    );

    if (isCorrect) {
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        const updatedState = handleCorrectAnswer(currentGameState);
        setCurrentGameState(updatedState);

        if (updatedState.isGameFinished) {
          updatedState.status = "finished";
          setCurrentGameState(updatedState);
          setGameStatus("finished");
          onGameFinished(updatedState);
        }
        setUserInput("");
      }, 1500);
    } else {
      const updatedState = handleIncorrectAnswer(currentGameState, userInput.trim());
      setCurrentGameState(updatedState);
      setShowIncorrectPopup(true);
    }
  }, [userInput, currentQuestion, currentGameState, setGameStatus, onGameFinished]);

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
    if (confirm("Are you sure you want to give up on this question? You won't get a point for it.")) {
      const updatedState = handleGiveUp(currentGameState);
      setCurrentGameState(updatedState);
      setUserInput("");

      if (updatedState.isGameFinished) {
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

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={`/Assets/TreasureHunt/bg_${backgroundImage}.png`}
          alt="Treasure Hunt Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-200/20 via-orange-300/30 to-blue-400/20" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-center w-full h-dvh p-4">
        <div className="flex flex-col w-full max-w-4xl gap-6 bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border-4 border-yellow-400">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="group flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all hover:scale-105"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Home</span>
            </Link>
            
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-all hover:scale-110"
              aria-label="Settings"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-black text-center text-orange-600 drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)]">
            <span className="inline-block align-middle">🏴‍☠️</span>{' '}
            <span className="text-yellow-600">Treasure</span>{' '}
            <span className="text-yellow-600">Hunt</span>{' '}
            <span className="inline-block align-middle">🏴‍☠️</span>
          </h1>


          {/* Progress Bar - Kid Friendly */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <p className="text-xl font-bold text-blue-700">
                Question {currentGameState.currentQuestionIndex + 1} of {currentGameState.totalQuestions}
              </p>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-400 rounded-full">
                <span className="text-2xl">⭐</span>
                <p className="text-xl font-bold text-white">Score: {currentGameState.score}</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                style={{ width: `${Math.max(progressPercentage, 5)}%` }}
              >
                {progressPercentage > 15 && (
                  <span className="text-white font-bold text-sm">
                    {Math.round(progressPercentage)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Incorrect Sentence Display */}
          <div className="text-center">
            <p className="text-xl font-bold text-gray-700 mb-4">
              ✏️ Fix this sentence:
            </p>
            <div className="bg-red-100 border-4 border-red-500 p-6 rounded-2xl shadow-lg">
              <p className="text-2xl md:text-3xl font-bold text-red-700 leading-relaxed">
                {currentQuestion.incorrectSentence}
              </p>
            </div>
          </div>

          {/* Input Area */}
          <div className="flex flex-col gap-4">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type the correct sentence here..."
              className="w-full text-xl px-6 py-5 rounded-2xl border-4 border-blue-400 bg-white text-gray-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-200 transition-all min-h-[120px] resize-y font-nunito shadow-lg"
              rows={3}
            />

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={handleAnswerSubmit}
                disabled={!userInput.trim()}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-2xl px-8 py-5 rounded-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
              >
                ✅ Submit Answer
              </button>

              {canShowHint && (
                <button
                  onClick={handleShowHint}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold text-lg px-6 py-5 rounded-2xl transition-all hover:scale-105 shadow-lg"
                >
                  <Lightbulb className="w-6 h-6" />
                  💡 See Hint
                </button>
              )}

              {canGiveUp && (
                <button
                  onClick={handleGiveUpClick}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold text-lg px-6 py-5 rounded-2xl transition-all hover:scale-105 shadow-lg"
                >
                  <HelpCircle className="w-6 h-6" />
                  Give Up
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black/60 flex-center z-50">
          <div className="bg-gradient-to-br from-green-400 to-green-600 text-white p-10 rounded-3xl text-center shadow-2xl border-4 border-white animate-bounce">
            <p className="text-5xl font-bold mb-4">🎉 Awesome! 🎉</p>
            <p className="text-2xl">Correct! Moving to next treasure...</p>
          </div>
        </div>
      )}

      {/* Incorrect Answer Popup */}
      {showIncorrectPopup && (
        <div className="fixed inset-0 bg-black/60 flex-center z-50">
          <div className="bg-gradient-to-br from-red-400 to-red-600 text-white p-10 rounded-3xl text-center max-w-md mx-4 shadow-2xl border-4 border-white">
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
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-10 rounded-3xl text-center max-w-md mx-4 shadow-2xl border-4 border-white">
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
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-xl px-6 py-4 rounded-xl hover:scale-105 transition-all"
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
