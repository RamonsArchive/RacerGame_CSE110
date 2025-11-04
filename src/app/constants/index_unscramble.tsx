export type GradeLevel = "K" | "1-2" | "3-4" | "5-6";
export type GameStatus = "setup" | "active" | "finished";

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

export interface QuestionProgress {
  questionId: string;
  mistakes: number;
  hintShown: boolean;
  gaveUp: boolean;
}

export interface AnswerLogEntry {
  questionId: string;
  prompt: string; // the incorrect sentence shown
  userAnswer: string;
  correctAnswer: string;
  gaveUp?: boolean;
}

export interface UnscrambleQuestion {
  id: string;
  question: string;
  scrambledAnswer: string;
  unscrambledAnswer: string | string[];
  gradeLevel: GradeLevel;
  hint?: string;
}


export interface UnscrambleGameState {
  gameId: string;
  gradeLevel: GradeLevel;
  status: GameStatus;
  currentQuestionIndex: number;
  questions: UnscrambleQuestion[];
  totalQuestions: number;
  score: number;
  mistakes: number;
  isGameFinished: boolean;
  startTime: number | null;
  endTime: number | null;
  questionProgress: QuestionProgress[];
  answerLog: AnswerLogEntry[];
}

export const GAME_CONFIG = {
  DEFAULT_QUESTIONS: 10,
  MIN_QUESTIONS: 5,
  MAX_QUESTIONS: 15,
  SESSION_STORAGE_KEY: "unscramble_game_state",
  HINT_MISTAKE_THRESHOLD: 2, 
  GIVE_UP_MISTAKE_THRESHOLD: 3, 
} as const;


export interface GameResult {
  gameId: string;
  date: number;
  gradeLevel: GradeLevel;
  totalQuestions: number;
  score: number;
  mistakes: number;
  totalTime: number;
  accuracy: number; // percentage
}
export const UNSCRAMBLE_QUESTIONS_BANK: Record<
  GradeLevel,
  UnscrambleQuestion[]
> = {
  K: [
    {
      id: "k-1",
      question: "A small pet that says meow.",
      scrambledAnswer: "tac",
      unscrambledAnswer: "cat",
      gradeLevel: "K",
      hint: "Starts with c",
    },
    {
      id: "k-2",
      question: "It shines in the sky during the day.",
      scrambledAnswer: "nus",
      unscrambledAnswer: "sun",
      gradeLevel: "K",
      hint: "Rhymes with fun",
    },
  ],

  "1-2": [
    {
      id: "12-1",
      question: "You read it.",
      scrambledAnswer: "koob",
      unscrambledAnswer: "book",
      gradeLevel: "1-2",
      hint: "Starts with b",
    },
    {
      id: "12-2",
      question: "You live in it.",
      scrambledAnswer: "eusoh",
      unscrambledAnswer: "house",
      gradeLevel: "1-2",
      hint: "Has 5 letters",
    },
  ],

  "3-4": [
    {
      id: "34-1",
      question: "Earth is one.",
      scrambledAnswer: "telpan",
      unscrambledAnswer: "planet",
      gradeLevel: "3-4",
      hint: "Ends with et",
    },
    {
      id: "34-2",
      question: "You can cross a river on it.",
      scrambledAnswer: "gbride",
      unscrambledAnswer: "bridge",
      gradeLevel: "3-4",
      hint: "Starts with b",
    },
  ],

  "5-6": [
    {
      id: "56-1",
      question: "Very old from long ago.",
      scrambledAnswer: "tnaicen",
      unscrambledAnswer: "ancient",
      gradeLevel: "5-6",
      hint: "Starts with a",
    },
    {
      id: "56-2",
      question: "Quality of being brave.",
      scrambledAnswer: "guearoc",
      unscrambledAnswer: "courage",
      gradeLevel: "5-6",
      hint: "Ends with age",
    },
  ],
};

export const getRandomUnscrambleQuestions = (
  gradeLevel: GradeLevel,
  count: number
): UnscrambleQuestion[] => {
  const pool = [...UNSCRAMBLE_QUESTIONS_BANK[gradeLevel]];
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, pool.length));
};
