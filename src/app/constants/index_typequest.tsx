// constants/index_typequest.tsx

export type GradeLevel = "K" | "1-2" | "3-4" | "5-6";

export const GRADE_LEVEL_LABELS: Record<GradeLevel, string> = {
  K: "Kindergarten",
  "1-2": "Grades 1-2",
  "3-4": "Grades 3-4",
  "5-6": "Grades 5-6",
};

export const GRADE_LEVEL_DESCRIPTIONS: Record<GradeLevel, string> = {
  K: "Simple 3-4 letter words",
  "1-2": "Basic spelling and sight words",
  "3-4": "Intermediate vocabulary",
  "5-6": "Advanced spelling and vocabulary",
};

export type GameMode = "solo" | "multiplayer";
export type GameStatus = "setup" | "active" | "finished";

export const GAME_CONTROLLER = {
  startGame: (gameState: GameState) => {
    gameState.status = "setup";
  },
  endGame: (gameState: GameState) => {
    gameState.status = "finished";
  },
  skipQuestion: (gameState: GameState) => {
    gameState.status = "active";
  },
};

export interface Question {
  id: string;
  prompt: string;
  correctAnswer: string;
  gradeLevel: GradeLevel;
  category?: "spelling" | "vocabulary" | "sentence" | "math-word";
  basePoints?: number;
  difficulty?: "easy" | "medium" | "hard"; // Optional: further subdivision within grade band
  choices?: string[]; // ✅ Add this - pre-generated choices
}

export interface QuestionResult {
  questionId: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  correct: boolean;
  timeSpent: number; // seconds
  mistakes: number; // number of incorrect attempts before getting it right
  points: number;
  timestamp: number;
}

export interface PlayerProgress {
  playerId: string;
  playerName: string;
  currentQuestionIndex: number;
  questionStartTime: number | null;
  questionsAnswered: number;
  currentQuestionMistakes: number;
  totalPoints: number;
  totalMistakes: number;
  questionResults: QuestionResult[];
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
  timeLimit?: number; // optional time limit per question in seconds
  allowSkip: boolean;
  targetTimePerQuestion: number; // Used for speed bonus calculation
}

export interface GameResult {
  gameId: string;
  date: number;
  gradeLevel: GradeLevel;
  mode: GameMode;
  playerName: string;

  // Main metrics
  totalPoints: number;
  totalQuestions: number;
  correctAnswers: number;
  totalMistakes: number;
  totalTime: number; // seconds

  // Calculated metrics
  accuracy: number; // percentage
  averageTimePerQuestion: number; // seconds
  charactersPerSecond?: number; // typing speed metric

  // Multiplayer specific
  opponent?: {
    name: string;
    points: number;
  };
  won?: boolean; // for multiplayer
  pointMargin?: number; // how much you won/lost by
}

// Game configuration - updated for grade bands
export const GAME_CONFIG = {
  DEFAULT_QUESTIONS: 10,
  MIN_QUESTIONS: 5,
  MAX_QUESTIONS: 20,

  // Points system
  BASE_POINTS: 100,
  SPEED_BONUS_MULTIPLIER: 20,
  MISTAKE_PENALTY: 10,
  PERFECT_BONUS: 50,

  // Target times by grade band (seconds per question)
  TARGET_TIMES: {
    K: 8,
    "1-2": 6,
    "3-4": 5,
    "5-6": 4,
  } as Record<GradeLevel, number>,

  // CPU difficulty settings
  CPU_DIFFICULTY: {
    easy: {
      mistakeRate: 0.4,
      speedMultiplier: 0.5,
      pointsMultiplier: 0.7,
    },
    medium: {
      mistakeRate: 0.2,
      speedMultiplier: 0.2,
      pointsMultiplier: 0.9,
    },
    hard: {
      mistakeRate: 0.1,
      speedMultiplier: 1.3,
      pointsMultiplier: 1.1,
    },
  },

  SESSION_STORAGE_KEY: "typequest_game_state",
  LEADERBOARD_KEY: "typequest_leaderboard",
  MAX_LEADERBOARD_ENTRIES: 50,
} as const;

// Word bank organized by grade bands
export const WORD_BANK: Record<GradeLevel, Question[]> = {
  K: [
    // 3-4 letter words, CVC patterns
    {
      id: "k1",
      prompt: "Spell: cat",
      correctAnswer: "cat",
      gradeLevel: "K",
      category: "spelling",
      basePoints: 80,
    },
    {
      id: "k2",
      prompt: "Spell: dog",
      correctAnswer: "dog",
      gradeLevel: "K",
      category: "spelling",
      basePoints: 80,
    },
    {
      id: "k3",
      prompt: "Spell: run",
      correctAnswer: "run",
      gradeLevel: "K",
      category: "spelling",
      basePoints: 80,
    },
    {
      id: "k4",
      prompt: "Spell: big",
      correctAnswer: "big",
      gradeLevel: "K",
      category: "spelling",
      basePoints: 80,
    },
    {
      id: "k5",
      prompt: "Spell: see",
      correctAnswer: "see",
      gradeLevel: "K",
      category: "spelling",
      basePoints: 80,
    },
    {
      id: "k6",
      prompt: "Spell: hat",
      correctAnswer: "hat",
      gradeLevel: "K",
      category: "spelling",
      basePoints: 80,
    },
    {
      id: "k7",
      prompt: "Spell: sun",
      correctAnswer: "sun",
      gradeLevel: "K",
      category: "spelling",
      basePoints: 80,
    },
    {
      id: "k8",
      prompt: "Spell: red",
      correctAnswer: "red",
      gradeLevel: "K",
      category: "spelling",
      basePoints: 80,
    },
    {
      id: "k9",
      prompt: "Spell: yes",
      correctAnswer: "yes",
      gradeLevel: "K",
      category: "spelling",
      basePoints: 80,
    },
    {
      id: "k10",
      prompt: "Spell: hot",
      correctAnswer: "hot",
      gradeLevel: "K",
      category: "spelling",
      basePoints: 80,
    },
  ],

  "1-2": [
    // Sight words, simple compound words, basic phonics
    {
      id: "12-1",
      prompt: "Spell: house",
      correctAnswer: "house",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 100,
    },
    {
      id: "12-2",
      prompt: "Spell: tree",
      correctAnswer: "tree",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 100,
    },
    {
      id: "12-3",
      prompt: "Spell: happy",
      correctAnswer: "happy",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 100,
    },
    {
      id: "12-4",
      prompt: "Spell: friend",
      correctAnswer: "friend",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 120,
      difficulty: "medium",
    },
    {
      id: "12-5",
      prompt: "Spell: school",
      correctAnswer: "school",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 120,
      difficulty: "medium",
    },
    {
      id: "12-6",
      prompt: "Spell: water",
      correctAnswer: "water",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 100,
    },
    {
      id: "12-7",
      prompt: "Spell: funny",
      correctAnswer: "funny",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 100,
    },
    {
      id: "12-8",
      prompt: "Spell: play",
      correctAnswer: "play",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 100,
    },
    {
      id: "12-9",
      prompt: "Spell: said",
      correctAnswer: "said",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 100,
    },
    {
      id: "12-10",
      prompt: "Spell: they",
      correctAnswer: "they",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 100,
    },
    {
      id: "12-11",
      prompt: "Spell: come",
      correctAnswer: "come",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 100,
    },
    {
      id: "12-12",
      prompt: "Spell: people",
      correctAnswer: "people",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 120,
      difficulty: "hard",
    },
  ],

  "3-4": [
    // More complex words, common misspellings, longer words
    {
      id: "34-1",
      prompt: "Spell: beautiful",
      correctAnswer: "beautiful",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 150,
    },
    {
      id: "34-2",
      prompt: "Spell: important",
      correctAnswer: "important",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 150,
    },
    {
      id: "34-3",
      prompt: "Spell: together",
      correctAnswer: "together",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 140,
    },
    {
      id: "34-4",
      prompt: "Spell: different",
      correctAnswer: "different",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 150,
    },
    {
      id: "34-5",
      prompt: "Spell: elephant",
      correctAnswer: "elephant",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 140,
    },
    {
      id: "34-6",
      prompt: "Spell: favorite",
      correctAnswer: "favorite",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 140,
    },
    {
      id: "34-7",
      prompt: "Spell: remember",
      correctAnswer: "remember",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 140,
    },
    {
      id: "34-8",
      prompt: "Spell: surprised",
      correctAnswer: "surprised",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 150,
    },
    {
      id: "34-9",
      prompt: "Spell: through",
      correctAnswer: "through",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 140,
    },
    {
      id: "34-10",
      prompt: "Spell: thought",
      correctAnswer: "thought",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 140,
    },
  ],

  "5-6": [
    // Advanced vocabulary, commonly misspelled words, academic words
    {
      id: "56-1",
      prompt: "Spell: accommodate",
      correctAnswer: "accommodate",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 200,
    },
    {
      id: "56-2",
      prompt: "Spell: necessary",
      correctAnswer: "necessary",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 200,
    },
    {
      id: "56-3",
      prompt: "Spell: separate",
      correctAnswer: "separate",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 180,
    },
    {
      id: "56-4",
      prompt: "Spell: government",
      correctAnswer: "government",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 180,
    },
    {
      id: "56-5",
      prompt: "Spell: conscious",
      correctAnswer: "conscious",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 180,
    },
    {
      id: "56-6",
      prompt: "Spell: environment",
      correctAnswer: "environment",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 190,
    },
    {
      id: "56-7",
      prompt: "Spell: occurrence",
      correctAnswer: "occurrence",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 200,
    },
    {
      id: "56-8",
      prompt: "Spell: definitely",
      correctAnswer: "definitely",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 190,
    },
    {
      id: "56-9",
      prompt: "Spell: convenient",
      correctAnswer: "convenient",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 190,
    },
    {
      id: "56-10",
      prompt: "Spell: appreciate",
      correctAnswer: "appreciate",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 190,
    },
  ],
};
