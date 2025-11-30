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
  onDropTile: (
    data: { tile: Tile; sourceIndex: number },
    slotIndex: number
  ) => void;
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
  onDropTile: (
    data: { tile: Tile; sourceIndex: number },
    slotIndex: number
  ) => void;
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

  /* RESET TILES EVERY QUESTION */
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

  useEffect(() => {
    setSlots(new Array(answerTiles.length).fill(null));
    setBank(toTiles(currentQuestion.scrambledAnswer));
    historyRef.current = [];
  }, [currentGameState.currentQuestionIndex]);

  /* ───────────────────────────────
      DRAG & DROP LOGIC
  ─────────────────────────────── */
  const onDragStart = (e: React.DragEvent, tile: Tile, sourceIndex: number) =>
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ tile, sourceIndex })
    );

  const dropIntoSlot = (
    { tile, sourceIndex }: { tile: Tile; sourceIndex: number },
    targetSlotIndex: number
  ) => {
    if (sourceIndex === targetSlotIndex) return;
    historyRef.current.push({ bank: [...bank], slots: [...slots] });

    const nextSlots = [...slots];
    let nextBank = [...bank];
    if (sourceIndex === -1) nextBank = bank.filter((t) => t.id !== tile.id);
    else nextSlots[sourceIndex] = null;

    const existing = nextSlots[targetSlotIndex];
    if (existing) nextBank.push(existing);

    nextSlots[targetSlotIndex] = tile;
    setSlots(nextSlots);
    setBank(nextBank);
  };

  const clearSlot = (slotIndex: number) => {
    historyRef.current.push({ bank: [...bank], slots: [...slots] });
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

  /* ───────────────────────────────
      UI / HINTS / GIVE UP
  ─────────────────────────────── */
  const [showSuccess, setShowSuccess] = useState(false);
  const [showIncorrect, setShowIncorrect] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const questionProgress = getCurrentQuestionProgress(currentGameState);
  const canShowHint =
    questionProgress &&
    questionProgress.mistakes >= GAME_CONFIG.HINT_MISTAKE_THRESHOLD &&
    !questionProgress.hintShown;

  const canGiveUp =
    questionProgress &&
    questionProgress.mistakes >= GAME_CONFIG.GIVE_UP_MISTAKE_THRESHOLD;

  const handleSubmit = () => {
    const userWord = slots.map((t) => t?.ch || "").join("");
    const correct = normalize(currentQuestion.unscrambledAnswer);

    if (normalize(userWord) === correct) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        const updated = handleCorrectAnswer(currentGameState);
        setCurrentGameState(updated);
        if (updated.isGameFinished) {
          updated.status = "finished";
          setGameStatus("finished");
          onGameFinished(updated);
        }
      }, 1500);
    } else {
      setShowIncorrect(true);
      setCurrentGameState(handleIncorrectAnswer(currentGameState, userWord));
    }
  };

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      <Image
        src="/Assets/Unscramble/unscramble.png"
        alt="Background"
        fill
        priority
        className="absolute inset-0 -z-10 object-cover"
      />

      <div className="relative z-10 flex-center p-4 h-full">
        <div className="flex flex-col w-full max-w-4xl gap-6 bg-white/60 backdrop-blur-md p-8 rounded-3xl shadow-2xl">
          {/* HEADER */}
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="bg-blue-600 text-white px-4 py-2 rounded-xl flex gap-2 items-center font-bold"
            >
              <ChevronLeft /> Home
            </Link>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-3 bg-gray-300 hover:bg-gray-400 rounded-full"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>

          {/* CLUE */}
          <div className="text-center">
            <p className="text-xl font-bold mb-2 text-gray-700">Clue:</p>
            <p className="bg-red-200 text-2xl font-bold p-4 rounded-xl shadow">
              {currentQuestion.question}
            </p>
          </div>

          {/* DND SECTION */}
          <div className="flex flex-col gap-4 items-center">
            <div className="flex flex-wrap gap-3 justify-center">
              {slots.map((slot, i) =>
                slot ? (
                  <FilledSlot
                    key={slot.id}
                    tile={slot}
                    index={i}
                    onDragStart={onDragStart}
                    onDropTile={dropIntoSlot}
                    onClearSlot={clearSlot}
                  />
                ) : (
                  <EmptySlot key={i} index={i} onDropTile={dropIntoSlot} />
                )
              )}
            </div>

            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {bank.map((tile) => (
                <TileView key={tile.id} tile={tile} onDragStart={onDragStart} />
              ))}
            </div>

            <button
              onClick={undo}
              className="flex items-center gap-2 px-4 py-2 bg-gray-300 rounded-xl shadow hover:bg-gray-400"
            >
              <Undo2 /> Undo
            </button>
          </div>

          {/* SUBMIT + HINT + GIVE UP */}
          <div className="flex gap-3 flex-col md:flex-row">
            <button
              onClick={handleSubmit}
              disabled={slots.some((s) => !s)}
              className="flex-1 bg-green-500 text-white text-2xl py-4 rounded-xl shadow-lg hover:bg-green-600 disabled:opacity-50"
            >
              Submit Answer
            </button>

            {canShowHint && (
              <button
                onClick={() => setShowHintModal(true)}
                className="flex-1 bg-yellow-500 text-white py-4 rounded-xl shadow hover:bg-yellow-600"
              >
                <Lightbulb /> Hint
              </button>
            )}

            {canGiveUp && (
              <button
                onClick={() => {
                  const updated = handleGiveUp(currentGameState);
                  setCurrentGameState(updated);
                }}
                className="flex-1 bg-red-500 text-white py-4 rounded-xl shadow hover:bg-red-600"
              >
                <HelpCircle /> Give Up
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SUCCESS POPUP */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 flex-center z-50">
          <div className="bg-green-500/70 text-white p-10 rounded-3xl">
            <p className="text-4xl font-bold">🎉 Correct! 🎉</p>
          </div>
        </div>
      )}

      {/* INCORRECT POPUP */}
      {showIncorrect && (
        <div className="fixed inset-0 bg-black/60 flex-center z-50">
          <div className="bg-red-500/70 text-white p-10 rounded-3xl flex flex-col items-center gap-4">
            <p className="text-4xl font-bold">❌ Incorrect ❌</p>
            <button
              onClick={() => setShowIncorrect(false)}
              className="bg-white text-red-600 px-6 py-3 rounded-xl"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* HINT POPUP */}
      {showHintModal && (
        <div className="fixed inset-0 bg-black/60 flex-center z-50">
          <div className="bg-yellow-500/70 text-white p-10 rounded-3xl flex flex-col items-center gap-4">
            <p className="text-3xl font-bold">💡 Hint</p>
            <p>{currentQuestion.hint || "Look carefully!"}</p>
            <button
              onClick={() => setShowHintModal(false)}
              className="bg-white text-yellow-600 px-6 py-3 rounded-xl"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 flex-center z-50">
          <div className="bg-white p-8 rounded-3xl w-[90%] max-w-md flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-center">⚙️ Settings</h2>
            <p className="text-gray-600 text-center">
              Continue or return to game setup?
            </p>

            <button
              onClick={() => onRestartGame()}
              className="bg-blue-500 text-white px-6 py-3 font-bold rounded-xl hover:bg-blue-600"
            >
              🔄 Restart Game
            </button>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="bg-gray-300 px-6 py-3 font-bold rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UN_ActiveScreen;
