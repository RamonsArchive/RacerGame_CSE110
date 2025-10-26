// constants/index_typeracer.tsx

export type GradeLevel = "K" | "1" | "2" | "3" | "4" | "5" | "6";
export type GameMode = "solo" | "multiplayer";
export type GameStatus = "setup" | "active" | "finished";

export interface Question {
  id: string;
  prompt: string;
  correctAnswer: string;
  gradeLevel: GradeLevel;
  category?: "spelling" | "vocabulary" | "sentence" | "math-word";
}

export interface PlayerProgress {
  playerId: string;
  playerName: string;
  currentQuestionIndex: number;
  correctAnswers: number;
  mistakes: number;
  timeElapsed: number; // milliseconds
  questionsAnswered: number;
  isFinished: boolean;
}

export interface GameState {
  gameId: string;
  mode: GameMode;
  gradeLevel: GradeLevel;
  status: GameStatus;
  questions: Question[];
  totalQuestions: number;
  startTime: number | null;
  endTime: number | null;

  // Player data
  currentPlayer: PlayerProgress;
  opponent?: PlayerProgress; // CPU or other player

  // Game settings
  timeLimit?: number; // optional time limit per question
  allowSkip: boolean;
}

export interface GameResult {
  gameId: string;
  date: number;
  gradeLevel: GradeLevel;
  mode: GameMode;
  totalQuestions: number;
  correctAnswers: number;
  mistakes: number;
  totalTime: number;
  wpm?: number; // words per minute
  accuracy: number; // percentage
  opponent?: {
    name: string;
    score: number;
  };
  won?: boolean; // for multiplayer
}

// Word bank organized by grade
export const WORD_BANK: Record<GradeLevel, Question[]> = {
  K: [
    {
      id: "k1",
      prompt: "Spell: cat",
      correctAnswer: "cat",
      gradeLevel: "K",
      category: "spelling",
    },
    {
      id: "k2",
      prompt: "Spell: dog",
      correctAnswer: "dog",
      gradeLevel: "K",
      category: "spelling",
    },
    // Add more...
  ],
  "1": [
    {
      id: "1-1",
      prompt: "Spell: house",
      correctAnswer: "house",
      gradeLevel: "1",
      category: "spelling",
    },
    // Add more...
  ],
  // Continue for grades 2-6
  "2": [],
  "3": [],
  "4": [],
  "5": [],
  "6": [],
};

// Game configuration
export const GAME_CONFIG = {
  DEFAULT_QUESTIONS: 10,
  MIN_QUESTIONS: 5,
  MAX_QUESTIONS: 20,
  CPU_DIFFICULTY: {
    easy: { mistakeRate: 0.3, speedMultiplier: 0.7 },
    medium: { mistakeRate: 0.15, speedMultiplier: 1.0 },
    hard: { mistakeRate: 0.05, speedMultiplier: 1.3 },
  },
  SESSION_STORAGE_KEY: "typeracer_game_state",
  LEADERBOARD_KEY: "typeracer_leaderboard",
} as const;
