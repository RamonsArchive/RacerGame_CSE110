"use client";
import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  UnscrambleGameState,
  GameStatus,
  GAME_CONFIG,
} from "@/app/constants/index_unscramble";
import {
  handleCorrectAnswer,
  handleIncorrectAnswer,
  saveGameState,
  showHint,
  handleGiveUp,
  getCurrentQuestionProgress,
} from "@/lib/utils_unscramble";
import {
  ChevronLeft,
  Settings,
  Lightbulb,
  HelpCircle,
  Undo2,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

/* ───────────────────────────────
    🔠 TYPES & HELPERS
─────────────────────────────────── */
type Tile = { id: string; ch: string };

const normalize = (s: string) => (s || "").toLowerCase().replace(/[^a-z]/g, "");
const toTiles = (answer: string): Tile[] =>
  normalize(answer)
    .split("")
    .map((ch, i) => ({
      id: `t-${i}-${ch}-${Math.random().toString(36).slice(2, 7)}`,
      ch,
    }));

/* ───────────────────────────────
    🧩 TILE COMPONENTS
─────────────────────────────────── */
function TileView({
  tile,
  onDragStart,
}: {
  tile: Tile;
  onDragStart: (e: React.DragEvent, tile: Tile, srcIndex: number) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, tile, -1)}
      className="select-none w-12 h-12 rounded-xl border-2 border-blue-500 bg-white grid place-items-center text-2xl font-black text-blue-700 shadow hover:shadow-lg"
    >
      {tile.ch.toUpperCase()}
    </div>
  );
}

function EmptySlot({
  index,
  onDropTile,
}: {
  index: number;
  onDropTile: (data: {tile: Tile, sourceIndex: number}, slotIndex: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onDragOver={(e) => {
        e.preventDefault();
        ref.current?.classList.add("ring-2", "ring-emerald-400");
      }}
      onDragLeave={() =>
        ref.current?.classList.remove("ring-2", "ring-emerald-400")
      }
      onDrop={(e) => {
        e.preventDefault();
        ref.current?.classList.remove("ring-2", "ring-emerald-400");
        const data = JSON.parse(e.dataTransfer.getData("application/json"));
        onDropTile(data, index);
      }}
      className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-400 grid place-items-center bg-gray-100"
    />
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
  onDragStart: (e: React.DragEvent, tile: Tile, srcIndex: number) => void;
  onDropTile: (data: {tile: Tile, sourceIndex: number}, slotIndex: number) => void;
  onClearSlot: (slotIndex: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      draggable
      onDragStart={(e) => onDragStart(e, tile, index)}
      onDragOver={(e) => {
        e.preventDefault();
        ref.current?.classList.add("ring-2", "ring-emerald-400");
      }}
      onDragLeave={() =>
        ref.current?.classList.remove("ring-2", "ring-emerald-400")
      }
      onDrop={(e) => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData("application/json"));
        onDropTile(data, index);
      }}
      className="relative w-12 h-12 rounded-xl border-2 border-blue-500 bg-white grid place-items-center text-2xl font-black text-blue-700 shadow"
    >
      <button
        onClick={() => onClearSlot(index)}
        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
      >
        <X className="w-3 h-3" />
      </button>
      {tile.ch.toUpperCase()}
    </div>
  );
}

/* ───────────────────────────────
    ⭐ MAIN COMPONENT
─────────────────────────────────── */
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
  const [currentGameState, setCurrentGameState] =
    useState<UnscrambleGameState>(gameState);
  const currentQuestion =
    currentGameState.questions[currentGameState.currentQuestionIndex];

  // 🛠 Fix: Initialize/reset tiles EVERY question
  const answerTiles = useMemo(
    () => toTiles(currentQuestion.unscrambledAnswer),
    [currentQuestion]
  );
  const [bank, setBank] = useState<Tile[]>(
    toTiles(currentQuestion.scrambledAnswer)
  );
  const [slots, setSlots] = useState<Array<Tile | null>>(
    new Array(answerTiles.length).fill(null)
  );
  const historyRef = useRef<{ bank: Tile[]; slots: (Tile | null)[] }[]>([]);
  const pushHistory = () =>
    historyRef.current.push({ bank: [...bank], slots: [...slots] });

  useEffect(() => {
    setSlots(new Array(answerTiles.length).fill(null));
    setBank(toTiles(currentQuestion.scrambledAnswer));
    historyRef.current = [];
  }, [currentGameState.currentQuestionIndex]);

  // DND Methods
  const onDragStart = (e: React.DragEvent, tile: Tile, sourceIndex: number) =>
    e.dataTransfer.setData("application/json", JSON.stringify({tile, sourceIndex}));

  const dropIntoSlot = ({tile, sourceIndex}:{tile: Tile, sourceIndex: number}, targetSlotIndex: number ) => {
    if (sourceIndex == targetSlotIndex){
      return;
    }

    pushHistory();
    const nextSlots = [...slots];
    let nextBank = [...bank];
    // if tile came from bank, remove from bank
    if (sourceIndex === -1){
      nextBank = bank.filter((t) => t.id !== tile.id);
    } else{
      // Otherwise came from another slot, so clear the answer slot
      nextSlots[sourceIndex] = null;
    }
    
    // Handle if existing tile target is already there
    const existingTileInTarget = nextSlots[targetSlotIndex]
    if (existingTileInTarget){
      nextBank.push(existingTileInTarget);
    }
    nextSlots[targetSlotIndex] = tile;
    setSlots(nextSlots);
    setBank(nextBank);
  };

  const clearSlot = (slotIndex: number) => {
    pushHistory();
    const tile = slots[slotIndex];
    if (tile) setBank((b) => [...b, tile]);
    setSlots((s) => s.map((t, i) => (i === slotIndex ? null : t)));
  };

  const undo = () => {
    const last = historyRef.current.pop();
    if (last) {
      setBank(last.bank);
      setSlots(last.slots);
    }
  };

  // Submit Answer
  const handleAnswerSubmit = useCallback(() => {
    const userWord = slots.map((t) => t?.ch || "").join("");
    const correct = normalize(currentQuestion.unscrambledAnswer);

    if (normalize(userWord) === correct) {
      const updated = handleCorrectAnswer(currentGameState);
      setCurrentGameState(updated);

      if (updated.isGameFinished) {
        updated.status = "finished";
        setGameStatus("finished");
        onGameFinished(updated);
      }
    } else {
      setCurrentGameState(handleIncorrectAnswer(currentGameState, userWord));
    }
  }, [slots, currentQuestion, currentGameState]);

  const progressPercentage =
    (currentGameState.currentQuestionIndex / currentGameState.totalQuestions) *
    100;

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      {/* Background */}
      <Image
        src="/Assets/Unscramble/unscramble.png"
        alt="Unscramble Background"
        fill
        priority
        className="object-cover absolute inset-0 -z-10"
      />

      <div className="relative z-10 flex-center p-4 h-full">
        <div className="flex flex-col w-full max-w-4xl gap-6 bg-white/60 backdrop-blur-md p-8 rounded-3xl shadow-2xl">
          {/* HEADER */}
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl flex gap-2 items-center font-bold shadow"
            >
              <ChevronLeft /> Home
            </Link>
            <button
              onClick={() => onRestartGame()}
              className="p-3 bg-gray-300 hover:bg-gray-400 rounded-full"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>

          {/* Title */}
          <h1 className="text-center text-5xl font-black text-orange-600">
            Unscramble
          </h1>

          {/* Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xl font-bold text-blue-700">
                Question {currentGameState.currentQuestionIndex + 1} of{" "}
                {currentGameState.totalQuestions}
              </p>
              <p className="text-xl font-bold bg-green-400/70 px-4 py-2 rounded-full shadow">
                ⭐ Score: {currentGameState.score}
              </p>
            </div>
            <div className="w-full h-6 rounded-full bg-gray-200">
              <div
                style={{ width: `${Math.max(5, progressPercentage)}%` }}
                className="h-full bg-yellow-400 rounded-full transition-all"
              />
            </div>
          </div>

          {/* Clue */}
          <div className="text-center">
            <p className="text-xl font-bold text-gray-700 mb-2">Clue:</p>
            <p className="bg-red-200 text-xl font-bold p-4 rounded-xl shadow">
              {currentQuestion.question}
            </p>
          </div>

          {/* DND AREA */}
          <div className="flex flex-col gap-4 items-center">
            {/* Slots */}
            <div className="flex flex-wrap justify-center gap-3">
              {slots.map((slot, i) =>
                slot ? (
                  <FilledSlot
                    key={slot.id}
                    tile={slot}
                    index={i}
                    onDragStart={onDragStart}
                    onClearSlot={clearSlot}
                    onDropTile={dropIntoSlot}
                  />
                ) : (
                  <EmptySlot key={i} index={i} onDropTile={dropIntoSlot} />
                )
              )}
            </div>

            {/* Bank */}
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {bank.map((tile) => (
                <TileView key={tile.id} tile={tile} onDragStart={onDragStart} />
              ))}
            </div>

            {/* Undo */}
            <button
              onClick={undo}
              className="flex gap-2 items-center px-4 py-2 bg-gray-300 rounded-xl shadow hover:bg-gray-400"
            >
              <Undo2 /> Undo
            </button>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleAnswerSubmit}
            disabled={slots.some((s) => !s)}
            className="bg-green-500 hover:bg-green-600 text-white text-2xl font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Answer
          </button>
        </div>
      </div>
    </div>
  );
};

export default UN_ActiveScreen;
