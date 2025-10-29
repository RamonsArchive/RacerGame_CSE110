"use client"; // page renders client side Essential for user interaction
import React, { useState, useCallback } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

// Define types for the treasure hunt game
interface GrammarQuestion {
  id: number;
  incorrectSentence: string;
  correctSentence: string;
}

interface GameState {
  currentQuestionIndex: number;
  questions: GrammarQuestion[];
  score: number;
  isGameFinished: boolean;
}

// Dummy grammar questions
const GRAMMAR_QUESTIONS: GrammarQuestion[] = [
  {
    id: 1,
    incorrectSentence: "The dog are running in the park",
    correctSentence: "The dog is running in the park",
  },
  {
    id: 2,
    incorrectSentence: "She don't like to eat vegetables",
    correctSentence: "She doesn't like to eat vegetables",
  },
  {
    id: 3,
    incorrectSentence: "I have went to the store yesterday",
    correctSentence: "I went to the store yesterday",
  },
  {
    id: 4,
    incorrectSentence: "The books was on the table",
    correctSentence: "The books were on the table",
  },
  {
    id: 5,
    incorrectSentence: "He can't hardly see the board",
    correctSentence: "He can hardly see the board",
  },
];

const TreasureHuntPage = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentQuestionIndex: 0,
    questions: GRAMMAR_QUESTIONS,
    score: 0,
    isGameFinished: false,
  });

  const [userInput, setUserInput] = useState<string>("");
  const [showIncorrectPopup, setShowIncorrectPopup] = useState<boolean>(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];

  const handleAnswerSubmit = useCallback(() => {
    if (!userInput.trim()) return;

    const isCorrect = userInput.trim() === currentQuestion.correctSentence;

    if (isCorrect) {
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        const nextQuestionIndex = gameState.currentQuestionIndex + 1;

        if (nextQuestionIndex >= gameState.questions.length) {
          // Game finished
          setGameState((prev) => ({
            ...prev,
            isGameFinished: true,
            score: prev.score + 1,
          }));
        } else {
          // Move to next question
          setGameState((prev) => ({
            ...prev,
            currentQuestionIndex: nextQuestionIndex,
            score: prev.score + 1,
          }));
        }
        setUserInput("");
      }, 1500);
    } else {
      setShowIncorrectPopup(true);
    }
  }, [userInput, currentQuestion, gameState]);

  const handleTryAgain = useCallback(() => {
    setShowIncorrectPopup(false);
    setUserInput("");
  }, []);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleAnswerSubmit();
      }
    },
    [handleAnswerSubmit]
  );

  const handleRestart = useCallback(() => {
    setGameState({
      currentQuestionIndex: 0,
      questions: GRAMMAR_QUESTIONS,
      score: 0,
      isGameFinished: false,
    });
    setUserInput("");
    setShowIncorrectPopup(false);
    setShowSuccessMessage(false);
  }, []);

  if (gameState.isGameFinished) {
    return (
      <div className="w-full h-dvh bg-gradient-to-br from-primary-800 via-secondary-800 to-tertiary-700 flex-center">
        <div className="flex flex-col w-full max-w-2xl p-10 gap-10 bg-gradient-to-b from-pink-700 via-primary-900 to-secondary-800 rounded-xl shadow-lg">
          <Link
            href="/"
            className="group flex flex-row items-center px-3 hover:cursor-pointer hover:underline hover:text-slate-300 transition-all duration-300 ease-in-out w-fit"
          >
            <ChevronLeft className="w-6 h-6 text-slate-100 group-hover:text-slate-300 group-hover:underline transition-all duration-300 ease-in-out" />
            <p className="font-bold text-md font-nunito text-slate-100 group-hover:text-slate-300 group-hover:underline transition-all duration-300 ease-in-out">
              Back To Home
            </p>
          </Link>

          <h1 className="font-nunito text-6xl font-black text-center text-slate-100 drop-shadow-2xl animate-bright-gradient">
            Treasure Hunt
          </h1>

          <div className="text-center">
            <h2 className="font-nunito text-3xl font-bold text-slate-100 mb-4">
              Congratulations! 🎉
            </h2>
            <p className="font-nunito text-xl text-slate-100 mb-6">
              You completed all {gameState.questions.length} grammar challenges!
            </p>
            <p className="font-nunito text-2xl font-bold text-green-400 mb-8">
              Final Score: {gameState.score}/{gameState.questions.length}
            </p>
          </div>

          <button
            onClick={handleRestart}
            className="bg-green-400 text-slate-700 px-5 py-4 rounded-lg hover:cursor-pointer hover:scale-105 transition-all duration-300 ease-in-out"
          >
            <p className="font-nunito text-2xl font-black text-center">
              Play Again
            </p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-dvh bg-gradient-to-br from-primary-800 via-secondary-800 to-tertiary-700 flex-center">
      <div className="flex flex-col w-full max-w-2xl p-10 gap-10 bg-gradient-to-b from-pink-700 via-primary-900 to-secondary-800 rounded-xl shadow-lg">
        <Link
          href="/"
          className="group flex flex-row items-center px-3 hover:cursor-pointer hover:underline hover:text-slate-300 transition-all duration-300 ease-in-out w-fit"
        >
          <ChevronLeft className="w-6 h-6 text-slate-100 group-hover:text-slate-300 group-hover:underline transition-all duration-300 ease-in-out" />
          <p className="font-bold text-md font-nunito text-slate-100 group-hover:text-slate-300 group-hover:underline transition-all duration-300 ease-in-out">
            Back To Home
          </p>
        </Link>

        <h1 className="font-nunito text-6xl font-black text-center text-slate-100 drop-shadow-2xl animate-bright-gradient">
          Treasure Hunt
        </h1>

        <div className="flex justify-between items-center w-full">
          <p className="font-nunito text-lg font-semibold text-slate-100">
            Question {gameState.currentQuestionIndex + 1} of{" "}
            {gameState.questions.length}
          </p>
          <p className="font-nunito text-lg font-bold text-green-400">
            Score: {gameState.score}
          </p>
        </div>

        <div className="text-center">
          <p className="font-nunito text-xl font-semibold text-slate-100 mb-6">
            Enter the grammatically correct version of the sentence below:
          </p>
          <div className="bg-slate-800 p-6 rounded-lg mb-6">
            <p className="font-nunito text-2xl font-bold text-red-300">
              {currentQuestion.incorrectSentence}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type the correct sentence here..."
            className="w-full text-lg px-5 py-4 rounded-lg border border-primary-100 bg-slate-100 text-slate-900 outline-none focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-300"
          />

          <button
            onClick={handleAnswerSubmit}
            disabled={!userInput.trim()}
            className="bg-green-400 text-slate-700 px-5 py-4 rounded-lg hover:cursor-pointer hover:scale-105 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <p className="font-nunito text-2xl font-black text-center">
              Submit
            </p>
          </button>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex-center z-50">
            <div className="bg-green-500 text-white p-8 rounded-lg text-center animate-pulse">
              <p className="font-nunito text-2xl font-bold">Correct! ✅</p>
              <p className="font-nunito text-lg mt-2">
                Moving to next question...
              </p>
            </div>
          </div>
        )}

        {/* Incorrect Answer Popup */}
        {showIncorrectPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex-center z-50">
            <div className="bg-red-500 text-white p-8 rounded-lg text-center max-w-md mx-4">
              <p className="font-nunito text-2xl font-bold mb-4">
                Try Again! ❌
              </p>
              <p className="font-nunito text-lg mb-6">
                That&apos;s not quite right. Take another look at the sentence
                and try again.
              </p>
              <button
                onClick={handleTryAgain}
                className="bg-white text-red-500 px-6 py-3 rounded-lg font-nunito font-bold hover:bg-gray-100 transition-all duration-300"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreasureHuntPage;
