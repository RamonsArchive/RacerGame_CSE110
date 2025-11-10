"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Settings, Lightbulb, HelpCircle, Undo2, Shuffle, X } from "lucide-react";
//new addition
import {
  UnscrambleGameState,
  GameStatus,
  GAME_CONFIG,
} from "../constants/index_unscramble";

import {
  saveGameState,
  handleCorrectAnswer,
  handleIncorrectAnswer,
  showHint,
  handleGiveUp,
  getCurrentQuestionProgress,
} from "@/lib/utils_unscramble";

/* =========================
   Helpers
========================= */
const normalize = (s: string) => (s || "").toLowerCase().replace(/[^a-z]/g, "");
const toTiles = (answer: string) =>
  normalize(answer).split("").map((ch, i) => ({ id: `t-${i}-${ch}-${Math.random().toString(36).slice(2, 7)}`, ch }));

const isCorrectAgainst = (assembled: string, correct: string | string[]) => {
  const norm = normalize(assembled);
  if (Array.isArray(correct)) return correct.some((c) => normalize(c) === norm);
  return normalize(correct) === norm;
};

type Tile = { id: string; ch: string };

/* =========================
   Components
========================= */
function TileView({
  tile,
  draggable = true,
  onDragStart,
  onKeyAdd,
  label,
}: {
  tile: Tile;
  draggable?: boolean;
  onDragStart: (e: React.DragEvent, tile: Tile) => void;
  onKeyAdd?: () => void;
  label?: string;
}) {
  return (
    <div
      role="button"
      aria-label={label || `Letter ${tile.ch}`}
      tabIndex={0}
      draggable={draggable}
      onDragStart={(e) => onDragStart(e, tile)}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onKeyAdd) onKeyAdd();
      }}
      className="select-none w-12 h-12 rounded-xl border-2 border-blue-500 bg-white grid place-items-center text-2xl font-black text-blue-700 shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
    >
      {tile.ch.toUpperCase()}
    </div>
  );
}

function EmptySlot({ index, onDropTile, onClearSlot }: {
  index: number;
  onDropTile: (tile: Tile, slotIndex: number) => void;
  onClearSlot: (slotIndex: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    ref.current?.classList.add("ring-2", "ring-emerald-400");
  };

  const onDragLeave = () => {
    ref.current?.classList.remove("ring-2", "ring-emerald-400");
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDragLeave();
    const payload = e.dataTransfer.getData("application/json");
    if (!payload) return;
    const tile: Tile = JSON.parse(payload);
    onDropTile(tile, index);
  };

  return (
    <div
      ref={ref}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="relative w-12 h-12 rounded-xl border-2 border-dashed border-gray-300 grid place-items-center bg-gray-50"
      aria-label={`Empty slot ${index + 1}`}
    >
      {/* clear button appears only when filled; rendered by FilledSlot */}
    </div>
  );
}

function FilledSlot({
  index,
  tile,
  onDragStart,
  onDropTile,
  onClearSlot,
}: {
  index: number;
  tile: Tile;
  onDragStart: (e: React.DragEvent, tile: Tile) => void;
  onDropTile: (tile: Tile, slotIndex: number) => void;
  onClearSlot: (slotIndex: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    ref.current?.classList.add("ring-2", "ring-emerald-400");
  };
  const onDragLeave = () => {
    ref.current?.classList.remove("ring-2", "ring-emerald-400");
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDragLeave();
    const payload = e.dataTransfer.getData("application/json");
    if (!payload) return;
    const dropped: Tile = JSON.parse(payload);
    onDropTile(dropped, index);
  };

  return (
    <div
      ref={ref}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="relative w-12 h-12 rounded-xl border-2 border-blue-500 bg-white grid place-items-center text-2xl font-black text-blue-700 shadow"
      aria-label={`Filled slot ${index + 1} with letter ${tile.ch}`}
    >
      <button
        type="button"
        aria-label="Remove letter from slot"
        onClick={() => onClearSlot(index)}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white grid place-items-center shadow hover:bg-red-600"
      >
        <X className="w-3 h-3" />
      </button>
      {tile.ch.toUpperCase()}
    </div>
  );
}

/* =========================
   Main Screen
========================= */
const UN_ActiveScreen = ({
  gameState,
  setGameStatus,
  onGameFinished,
  onRestartGame,
}: {
  gameState: UnscrambleGameState;
  setGameStatus: (status: GameStatus) => void;
  onGameFinished: (updatedState: UnscrambleGameState) => void;
  onRestartGame: () => void;
}) => {
  const [backgroundImage, setBackgroundImage] = useState<number>(1);
  const [showIncorrectPopup, setShowIncorrectPopup] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showHintPopup, setShowHintPopup] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentGameState, setCurrentGameState] =
    useState<UnscrambleGameState>(gameState);

  // Choose background per question
  useEffect(() => {
    const pick = [1, 2, 3][Math.floor(Math.random() * 3)];
    setBackgroundImage(pick);
  }, [currentGameState.currentQuestionIndex]);

  const currentQuestion =
    currentGameState.questions[currentGameState.currentQuestionIndex];

  // Build letter bank + slots from correct answer length (letters only)
  const correctAnswerLetters = useMemo(() => {
    const answers = Array.isArray(currentQuestion.correctAnswer)
      ? currentQuestion.correctAnswer[0]
      : currentQuestion.correctAnswer || currentQuestion.unscrambledAnswer;
    return toTiles(answers || "");
  }, [currentQuestion]);

  // initial bank is the letters of the *scrambled* prompt (letters only)
  const initialBank = useMemo(() => toTiles(currentQuestion.scrambledAnswer || ""), [currentQuestion]);
  const [bank, setBank] = useState<Tile[]>(initialBank);
  const [slots, setSlots] = useState<Array<Tile | null>>(
    new Array(correctAnswerLetters.length).fill(null)
  );

  // for undo
  const historyRef = useRef<{ bank: Tile[]; slots: (Tile | null)[] }[]>([]);
  const pushHistory = () =>
    historyRef.current.push({ bank: [...bank], slots: [...slots] });

  // Save state on change
  useEffect(() => {
    if (currentGameState.status === "active") saveGameState(currentGameState);
  }, [currentGameState]);

  const questionProgress = getCurrentQuestionProgress(currentGameState);

  const canShowHint =
    questionProgress &&
    questionProgress.mistakes >= GAME_CONFIG.HINT_MISTAKE_THRESHOLD &&
    !questionProgress.hintShown;

  const canGiveUp =
    questionProgress &&
    questionProgress.mistakes >= GAME_CONFIG.GIVE_UP_MISTAKE_THRESHOLD;

  /* ========== DnD Handlers ========== */
  const onDragStart = (e: React.DragEvent, tile: Tile) => {
    e.dataTransfer.setData("application/json", JSON.stringify(tile));
    e.dataTransfer.effectAllowed = "move";
  };

  const dropIntoSlot = (tile: Tile, slotIndex: number) => {
    pushHistory();

    // if tile is already in some slot, clear it from there
    const prevIndex = slots.findIndex((t) => t?.id === tile.id);
    const nextSlots = [...slots];
    let nextBank = [...bank];

    if (prevIndex !== -1) nextSlots[prevIndex] = null;
    else nextBank = nextBank.filter((t) => t.id !== tile.id);

    // if slot has a tile, return it to bank
    if (nextSlots[slotIndex]) {
      nextBank.push(nextSlots[slotIndex]!);
    }

    nextSlots[slotIndex] = tile;
    setSlots(nextSlots);
    setBank(nextBank);
  };

  const clearSlot = (slotIndex: number) => {
    pushHistory();
    const nextSlots = [...slots];
    const tile = nextSlots[slotIndex];
    if (tile) setBank((b) => [...b, tile]);
    nextSlots[slotIndex] = null;
    setSlots(nextSlots);
  };

  const addFromBankByIndex = (bankIndex: number) => {
    // keyboard add convenience
    const empty = slots.findIndex((s) => !s);
    if (empty === -1) return;
    const tile = bank[bankIndex];
    if (!tile) return;
    dropIntoSlot(tile, empty);
  };

  const undo = () => {
    const last = historyRef.current.pop();
    if (!last) return;
    setBank(last.bank);
    setSlots(last.slots);
  };

  const shuffleBank = () => {
    pushHistory();
    setBank((b) => [...b].sort(() => Math.random() - 0.5));
  };

  const clearAll = () => {
    pushHistory();
    setBank((b) => [...b, ...slots.filter(Boolean) as Tile[]]);
    setSlots(slots.map(() => null));
  };

  /* ========== Hint (place one correct letter) ========== */
  const revealOneLetter = useCallback(() => {
    if (!correctAnswerLetters.length) return;

    // find first slot that is empty or wrong
    const assembled = slots.map((t) => t?.ch ?? "").join("");
    const target = correctAnswerLetters.map((t) => t.ch).join("");

    let index = -1;
    for (let i = 0; i < slots.length; i++) {
      const have = slots[i]?.ch;
      const need = correctAnswerLetters[i].ch;
      if (have !== need) {
        index = i;
        break;
      }
    }
    if (index === -1) return;

    // try to find needed letter in bank first
    const needed = correctAnswerLetters[index].ch;
    const inBank = bank.find((t) => t.ch === needed);
    if (inBank) {
      dropIntoSlot(inBank, index);
      setShowHintPopup(true);
      return;
    }

    // otherwise, if wrong letter sits there, swap it back to bank
    const wrong = slots[index];
    if (wrong) {
      clearSlot(index);
    }
    setShowHintPopup(true);
  }, [bank, slots, correctAnswerLetters]);

  /* ========== Submit ========== */
  const handleSubmit = useCallback(() => {
    const userWord = slots.map((t) => (t ? t.ch : "")).join("");
    if (!userWord) return;

    const correct = currentQuestion.correctAnswer
      ? currentQuestion.correctAnswer
      : currentQuestion.unscrambledAnswer;

    const isRight = isCorrectAgainst(userWord, correct);

    if (isRight) {
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
        } else {
          // reset for next question
          const nextQ =
            updatedState.questions[updatedState.currentQuestionIndex];
          const nextBank = toTiles(nextQ.scrambledAnswer || "");
          const ansLetters = toTiles(
            Array.isArray(nextQ.correctAnswer)
              ? nextQ.correctAnswer[0]
              : nextQ.correctAnswer || nextQ.unscrambledAnswer || ""
          );
          setBank(nextBank);
          setSlots(new Array(ansLetters.length).fill(null));
          historyRef.current = [];
        }
      }, 1000);
    } else {
      const updatedState = handleIncorrectAnswer(currentGameState, userWord);
      setCurrentGameState(updatedState);
      setShowIncorrectPopup(true);
    }
  }, [
    slots,
    currentQuestion,
    currentGameState,
    onGameFinished,
    setGameStatus,
  ]);

  const handleGiveUpClick = useCallback(() => {
    if (
      confirm(
        "Are you sure you want to give up on this word? You won't get a point for it."
      )
    ) {
      const updatedState = handleGiveUp(currentGameState);
      setCurrentGameState(updatedState);

      if (updatedState.isGameFinished) {
        updatedState.status = "finished";
        setCurrentGameState(updatedState);
        setGameStatus("finished");
        onGameFinished(updatedState);
      } else {
        const nextQ =
          updatedState.questions[updatedState.currentQuestionIndex];
        const nextBank = toTiles(nextQ.scrambledAnswer || "");
        const ansLetters = toTiles(
          Array.isArray(nextQ.correctAnswer)
            ? nextQ.correctAnswer[0]
            : nextQ.correctAnswer || nextQ.unscrambledAnswer || ""
        );
        setBank(nextBank);
        setSlots(new Array(ansLetters.length).fill(null));
        historyRef.current = [];
      }
    }
  }, [currentGameState, setGameStatus, onGameFinished]);

  if (!currentQuestion) return null;

  const progressPct =
    currentGameState.totalQuestions > 0
      ? (currentGameState.currentQuestionIndex / currentGameState.totalQuestions) * 100
      : 0;

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src={`/Assets/TreasureHunt/bg_${backgroundImage}.png`}
          alt="Unscramble background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-b from-yellow-200/20 via-orange-300/30 to-blue-400/20" />
      </div>

      {/* Main */}
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

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={undo}
                className="p-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full transition-all"
                aria-label="Undo last action"
              >
                <Undo2 className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={shuffleBank}
                className="p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-all"
                aria-label="Shuffle bank letters"
              >
                <Shuffle className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all"
                aria-label="Settings"
              >
                <Settings className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-black text-center text-orange-600 drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)]">
            <span className="text-yellow-600">Unscramble</span>
          </h1>

          {/* Progress */}
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
                className="bg-linear-to-r from-yellow-400 via-orange-500 to-red-500 h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                style={{ width: `${progressPct}%` }}
              >
                {progressPct > 15 && (
                  <span className="text-white font-bold text-sm">{Math.round(progressPct)}%</span>
                )}
              </div>
            </div>
          </div>

          {/* Clue and scrambled shown */}
          <div className="text-center">
            <p className="text-xl font-bold text-gray-700 mb-4">
              Clue {currentQuestion.question}
            </p>
            <div className="bg-red-100 border-4 border-red-500 p-6 rounded-2xl shadow-lg">
              <p className="text-2xl md:text-3xl font-bold text-red-700 leading-relaxed">
                {currentQuestion.scrambledAnswer}
              </p>
            </div>
          </div>

          {/* Slots */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg font-semibold text-gray-700">Arrange the letters:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {slots.map((tile, i) =>
                tile ? (
                  <FilledSlot
                    key={`slot-${i}`}
                    index={i}
                    tile={tile}
                    onDragStart={onDragStart}
                    onDropTile={dropIntoSlot}
                    onClearSlot={clearSlot}
                  />
                ) : (
                  <EmptySlot key={`slot-${i}`} index={i} onDropTile={dropIntoSlot} onClearSlot={clearSlot} />
                )
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={clearAll}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold"
              >
                Clear
              </button>
              {canShowHint && (
                <button
                  type="button"
                  onClick={revealOneLetter}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-white font-semibold"
                >
                  <Lightbulb className="w-5 h-5" /> Hint
                </button>
              )}
              {canGiveUp && (
                <button
                  type="button"
                  onClick={handleGiveUpClick}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-400 hover:bg-red-500 text-white font-semibold"
                >
                  <HelpCircle className="w-5 h-5" /> Give Up
                </button>
              )}
            </div>
          </div>

          {/* Word bank */}
          <div className="mt-4">
            <p className="text-lg font-semibold text-gray-700 mb-2">Word bank</p>
            <div className="flex flex-wrap gap-2">
              {bank.length === 0 && (
                <span className="text-gray-500 text-sm">No letters left — submit when ready!</span>
              )}
              {bank.map((tile, idx) => (
                <TileView
                  key={tile.id}
                  tile={tile}
                  onDragStart={(e, t) => onDragStart(e, t)}
                  onKeyAdd={() => addFromBankByIndex(idx)}
                  label={`Bank letter ${tile.ch}`}
                />
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col md:flex-row gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={slots.every((s) => !s)}
              className="flex-1 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-2xl px-8 py-5 rounded-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
            >
              ✅ Submit Answer
            </button>
          </div>
        </div>
      </div>

      {/* Success */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black/60 flex-center z-50" role="alertdialog" aria-modal="true">
          <div className="bg-linear-to-br from-green-400 to-green-600 text-white p-10 rounded-3xl text-center shadow-2xl border-4 border-white animate-bounce">
            <p className="text-5xl font-bold mb-4">🎉 Awesome! 🎉</p>
            <p className="text-2xl">Correct! You unscrambled it!</p>
          </div>
        </div>
      )}

      {/* Incorrect */}
      {showIncorrectPopup && (
        <div className="fixed inset-0 bg-black/60 flex-center z-50" role="alertdialog" aria-modal="true">
          <div className="bg-linear-to-br from-red-400 to-red-600 text-white p-10 rounded-3xl text-center max-w-md mx-4 shadow-2xl border-4 border-white">
            <p className="text-4xl font-bold mb-4">😅 Try Again!</p>
            <p className="text-xl mb-6">Not quite right yet! Take another look and try again.</p>
            <button
              type="button"
              onClick={() => setShowIncorrectPopup(false)}
              className="bg-white text-red-600 px-8 py-4 rounded-xl font-bold text-xl hover:bg-gray-100 transition-all hover:scale-105"
            >
              Keep Trying! 💪
            </button>
          </div>
        </div>
      )}

      {/* Hint popup acknowledgement */}
      {showHintPopup && (
        <div className="fixed inset-0 bg-black/60 flex-center z-50" role="alertdialog" aria-modal="true">
          <div className="bg-linear-to-br from-yellow-400 to-orange-500 text-white p-8 rounded-3xl text-center max-w-md mx-4 shadow-2xl border-4 border-white">
            <p className="text-3xl mb-4">💡 Hint placed</p>
            <p className="text-lg mb-6">We revealed a helpful letter in the right spot.</p>
            <button
              type="button"
              onClick={() => setShowHintPopup(false)}
              className="bg-white text-orange-600 px-6 py-3 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all hover:scale-105"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Settings */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 flex-center z-50" role="alertdialog" aria-modal="true">
          <div className="bg-white p-8 rounded-3xl max-w-md mx-4 shadow-2xl border-4 border-purple-400">
            <h2 className="text-3xl font-bold text-center mb-6 text-purple-600">⚙️ Settings</h2>
            <p className="text-center text-gray-600 mb-6">
              Want to restart with different settings?
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  onRestartGame();
                }}
                className="bg-linear-to-r from-blue-500 to-purple-600 text-white font-bold text-xl px-6 py-4 rounded-xl hover:scale-105 transition-all"
              >
                🔄 Restart Game
              </button>
              <button
                type="button"
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

export default UN_ActiveScreen;
