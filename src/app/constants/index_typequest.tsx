// constants/index_typequest.tsx

export type GradeLevel = "1-2" | "3-4" | "5-6";

export const GRADE_LEVEL_LABELS: Record<GradeLevel, string> = {
  "1-2": "Grades 1-2",
  "3-4": "Grades 3-4",
  "5-6": "Grades 5-6",
};

export const GRADE_LEVEL_DESCRIPTIONS: Record<GradeLevel, string> = {
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
  finishTime: number | null; // ✅ Individual player's finish timestamp
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
  startTime: number;
  endTime: number;

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
  MISTAKE_PENALTY: 20,
  PERFECT_BONUS: 50,

  // Target times by grade band (seconds per question)
  TARGET_TIMES: {
    "1-2": 14,
    "3-4": 12,
    "5-6": 10,
  } as Record<GradeLevel, number>,

  // CPU difficulty settings
  CPU_DIFFICULTY: {
    easy: {
      mistakeRate: 0.4,
      speedMultiplier: 0.5,
      pointsMultiplier: 0.7,
      timeBonusMultiplier: 0.5,
    },
    medium: {
      mistakeRate: 0.2,
      speedMultiplier: 1,
      pointsMultiplier: 1.2,
      timeBonusMultiplier: 1,
    },
    hard: {
      mistakeRate: 0.1,
      speedMultiplier: 1.3,
      pointsMultiplier: 1.3,
      timeBonusMultiplier: 1.3,
    },
  },

  SESSION_STORAGE_KEY: "typequest_game_state",
  LEADERBOARD_KEY: "typequest_leaderboard",
  MAX_LEADERBOARD_ENTRIES: 50,
} as const;

// Helper function to get questions by category
export const getQuestionsByCategory = (
  gradeLevel: GradeLevel,
  category: Question["category"]
): Question[] => {
  return WORD_BANK[gradeLevel].filter((q) => q.category === category);
};

// Helper function to get random questions
export const getRandomQuestions = (
  gradeLevel: GradeLevel,
  count: number
): Question[] => {
  const questions = [...WORD_BANK[gradeLevel]];
  return questions.sort(() => Math.random() - 0.5).slice(0, count);
};

// Helper function to get questions by difficulty
export const getQuestionsByDifficulty = (
  gradeLevel: GradeLevel,
  difficulty: "easy" | "medium" | "hard"
): Question[] => {
  return WORD_BANK[gradeLevel].filter((q) => q.difficulty === difficulty);
};

export const WORD_BANK: Record<GradeLevel, Question[]> = {
  "1-2": [
    // ========== SPELLING (clue-based) ==========
    {
      id: "12-s1",
      prompt: "Spell the word for a place where you learn",
      correctAnswer: "school",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 100,
      choices: ["school", "skool", "scool", "shool"],
    },
    {
      id: "12-s2",
      prompt: "Spell the word for H₂O that you drink",
      correctAnswer: "water",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 100,
      choices: ["water", "watter", "watr", "watur"],
    },
    {
      id: "12-s3",
      prompt: "Spell the word for a person you like to play with",
      correctAnswer: "friend",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 120,
      difficulty: "medium",
      choices: ["friend", "frend", "freind", "frient"],
    },
    {
      id: "12-s4",
      prompt: "Spell the word for multiple humans",
      correctAnswer: "people",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 120,
      difficulty: "hard",
      choices: ["people", "peopel", "peple", "peeple"],
    },
    {
      id: "12-s5",
      prompt: "Spell the word that means joyful or glad",
      correctAnswer: "happy",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 100,
      choices: ["happy", "happi", "hapy", "happie"],
    },
    {
      id: "12-s6",
      prompt: "Spell the color of the sky on a clear day",
      correctAnswer: "blue",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 90,
      choices: ["blue", "blew", "blu", "bloo"],
    },
    {
      id: "12-s7",
      prompt: "Spell the word for the opposite of night",
      correctAnswer: "day",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 80,
      choices: ["day", "dae", "dai", "dey"],
    },
    {
      id: "12-s8",
      prompt: "Spell the word for something you read with pages",
      correctAnswer: "book",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 90,
      choices: ["book", "buk", "booke", "bok"],
    },
    {
      id: "12-s9",
      prompt: "Spell the word for the opposite of short",
      correctAnswer: "long",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 85,
      choices: ["long", "longe", "lawng", "lung"],
    },
    {
      id: "12-s10",
      prompt: "Spell the word for a young feline pet",
      correctAnswer: "kitten",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 110,
      difficulty: "medium",
      choices: ["kitten", "kiten", "kittin", "kitin"],
    },
    {
      id: "12-s11",
      prompt: "Spell the word for a round toy you bounce",
      correctAnswer: "ball",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 85,
      choices: ["ball", "bal", "bawl", "balle"],
    },
    {
      id: "12-s12",
      prompt: "Spell the word for the star that lights our day",
      correctAnswer: "sun",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 80,
      choices: ["sun", "son", "sunn", "sune"],
    },
    {
      id: "12-s13",
      prompt: "Spell the word for a small furry animal with long ears",
      correctAnswer: "bunny",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 100,
      choices: ["bunny", "buny", "bunnie", "bunie"],
    },
    {
      id: "12-s14",
      prompt: "Spell the word for the opposite of hot",
      correctAnswer: "cold",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 90,
      choices: ["cold", "cald", "kold", "colde"],
    },
    {
      id: "12-s15",
      prompt: "Spell the word for a flat green area of grass",
      correctAnswer: "lawn",
      gradeLevel: "1-2",
      category: "spelling",
      basePoints: 95,
      choices: ["lawn", "lon", "laun", "lown"],
    },

    // ========== VOCABULARY (fill in the blank) ==========
    {
      id: "12-v1",
      prompt: "Thomas ___ the pasta last night",
      correctAnswer: "ate",
      gradeLevel: "1-2",
      category: "vocabulary",
      basePoints: 90,
      choices: ["ate", "eat", "eating", "eaten"],
    },
    {
      id: "12-v2",
      prompt: "She ___ to school every day",
      correctAnswer: "goes",
      gradeLevel: "1-2",
      category: "vocabulary",
      basePoints: 90,
      choices: ["goes", "go", "went", "going"],
    },
    {
      id: "12-v3",
      prompt: "The dog ___ loudly",
      correctAnswer: "barked",
      gradeLevel: "1-2",
      category: "vocabulary",
      basePoints: 90,
      choices: ["barked", "bark", "barking", "barks"],
    },
    {
      id: "12-v4",
      prompt: "They ___ playing outside",
      correctAnswer: "are",
      gradeLevel: "1-2",
      category: "vocabulary",
      basePoints: 85,
      choices: ["are", "is", "am", "be"],
    },
    {
      id: "12-v5",
      prompt: "Yesterday I ___ my grandmother",
      correctAnswer: "saw",
      gradeLevel: "1-2",
      category: "vocabulary",
      basePoints: 90,
      choices: ["saw", "see", "seen", "seeing"],
    },
    {
      id: "12-v6",
      prompt: "My brother ___ very tall",
      correctAnswer: "is",
      gradeLevel: "1-2",
      category: "vocabulary",
      basePoints: 80,
      choices: ["is", "are", "am", "be"],
    },
    {
      id: "12-v7",
      prompt: "We ___ our hands before eating",
      correctAnswer: "wash",
      gradeLevel: "1-2",
      category: "vocabulary",
      basePoints: 85,
      choices: ["wash", "washes", "washed", "washing"],
    },
    {
      id: "12-v8",
      prompt: "The cat ___ on the mat",
      correctAnswer: "sits",
      gradeLevel: "1-2",
      category: "vocabulary",
      basePoints: 85,
      choices: ["sits", "sit", "sitting", "sat"],
    },
    {
      id: "12-v9",
      prompt: "I ___ a new toy for my birthday",
      correctAnswer: "got",
      gradeLevel: "1-2",
      category: "vocabulary",
      basePoints: 90,
      choices: ["got", "get", "gets", "getting"],
    },
    {
      id: "12-v10",
      prompt: "Birds ___ in the sky",
      correctAnswer: "fly",
      gradeLevel: "1-2",
      category: "vocabulary",
      basePoints: 85,
      choices: ["fly", "flies", "flew", "flying"],
    },
    {
      id: "12-v11",
      prompt: "She ___ a pretty dress yesterday",
      correctAnswer: "wore",
      gradeLevel: "1-2",
      category: "vocabulary",
      basePoints: 95,
      difficulty: "medium",
      choices: ["wore", "wear", "wears", "wearing"],
    },
    {
      id: "12-v12",
      prompt: "The baby ___ in the crib",
      correctAnswer: "sleeps",
      gradeLevel: "1-2",
      category: "vocabulary",
      basePoints: 85,
      choices: ["sleeps", "sleep", "sleeping", "slept"],
    },

    // ========== GRAMMAR (punctuation/capitalization) ==========
    {
      id: "12-g1",
      prompt: "Add the missing punctuation: Where is my toy___",
      correctAnswer: "?",
      gradeLevel: "1-2",
      category: "sentence",
      basePoints: 80,
      choices: ["?", ".", "!", ","],
    },
    {
      id: "12-g2",
      prompt: "Which word needs a capital letter: 'on monday we play'",
      correctAnswer: "Monday",
      gradeLevel: "1-2",
      category: "sentence",
      basePoints: 90,
      choices: ["Monday", "we", "play", "on"],
    },
    {
      id: "12-g3",
      prompt:
        "Add the missing punctuation: I love ice cream___ pizza___ and cake",
      correctAnswer: ",",
      gradeLevel: "1-2",
      category: "sentence",
      basePoints: 100,
      difficulty: "medium",
      choices: [",", ".", "?", "!"],
    },
    {
      id: "12-g4",
      prompt: "Add the missing punctuation: Watch out___",
      correctAnswer: "!",
      gradeLevel: "1-2",
      category: "sentence",
      basePoints: 80,
      choices: ["!", ".", "?", ","],
    },
    {
      id: "12-g5",
      prompt: "Add the missing punctuation: I have a pet dog___",
      correctAnswer: ".",
      gradeLevel: "1-2",
      category: "sentence",
      basePoints: 75,
      choices: [".", "?", "!", ","],
    },
    {
      id: "12-g6",
      prompt: "Which word needs a capital letter: 'my name is sarah'",
      correctAnswer: "Sarah",
      gradeLevel: "1-2",
      category: "sentence",
      basePoints: 85,
      choices: ["Sarah", "my", "name", "is"],
    },
    {
      id: "12-g7",
      prompt: "Add the missing punctuation: Wow that's amazing___",
      correctAnswer: "!",
      gradeLevel: "1-2",
      category: "sentence",
      basePoints: 80,
      choices: ["!", ".", "?", ","],
    },
    {
      id: "12-g8",
      prompt: "Which word needs a capital letter: 'we go to lincoln school'",
      correctAnswer: "Lincoln",
      gradeLevel: "1-2",
      category: "sentence",
      basePoints: 95,
      difficulty: "medium",
      choices: ["Lincoln", "we", "go", "school"],
    },
    {
      id: "12-g9",
      prompt: "Add the missing punctuation: Can you help me___",
      correctAnswer: "?",
      gradeLevel: "1-2",
      category: "sentence",
      basePoints: 80,
      choices: ["?", ".", "!", ","],
    },
    {
      id: "12-g10",
      prompt: "Add the missing punctuation: I like cats___ dogs___ and birds",
      correctAnswer: ",",
      gradeLevel: "1-2",
      category: "sentence",
      basePoints: 95,
      choices: [",", ".", "!", "?"],
    },
    {
      id: "12-g11",
      prompt: "Which word needs a capital letter: 'in july we swim'",
      correctAnswer: "July",
      gradeLevel: "1-2",
      category: "sentence",
      basePoints: 90,
      choices: ["July", "in", "we", "swim"],
    },
    {
      id: "12-g12",
      prompt: "Add the missing punctuation: That's so cool___",
      correctAnswer: "!",
      gradeLevel: "1-2",
      category: "sentence",
      basePoints: 80,
      choices: ["!", ".", "?", ","],
    },

    // ========== MATH WORD PROBLEMS ==========
    {
      id: "12-m1",
      prompt: "5 + 7 = ?",
      correctAnswer: "12",
      gradeLevel: "1-2",
      category: "math-word",
      basePoints: 70,
      choices: ["11", "12", "13", "14"],
    },
    {
      id: "12-m2",
      prompt: "10 - 4 = ?",
      correctAnswer: "6",
      gradeLevel: "1-2",
      category: "math-word",
      basePoints: 70,
      choices: ["5", "6", "7", "8"],
    },
    {
      id: "12-m3",
      prompt: "3 × 2 = ?",
      correctAnswer: "6",
      gradeLevel: "1-2",
      category: "math-word",
      basePoints: 80,
      difficulty: "medium",
      choices: ["5", "6", "7", "8"],
    },
    {
      id: "12-m4",
      prompt: "15 + 5 = ?",
      correctAnswer: "20",
      gradeLevel: "1-2",
      category: "math-word",
      basePoints: 75,
      choices: ["18", "19", "20", "21"],
    },
    {
      id: "12-m5",
      prompt: "8 ÷ 2 = ?",
      correctAnswer: "4",
      gradeLevel: "1-2",
      category: "math-word",
      basePoints: 85,
      difficulty: "hard",
      choices: ["2", "3", "4", "5"],
    },
    {
      id: "12-m6",
      prompt: "9 + 6 = ?",
      correctAnswer: "15",
      gradeLevel: "1-2",
      category: "math-word",
      basePoints: 70,
      choices: ["14", "15", "16", "17"],
    },
    {
      id: "12-m7",
      prompt: "12 - 5 = ?",
      correctAnswer: "7",
      gradeLevel: "1-2",
      category: "math-word",
      basePoints: 70,
      choices: ["6", "7", "8", "9"],
    },
    {
      id: "12-m8",
      prompt: "4 × 3 = ?",
      correctAnswer: "12",
      gradeLevel: "1-2",
      category: "math-word",
      basePoints: 80,
      choices: ["10", "11", "12", "13"],
    },
    {
      id: "12-m9",
      prompt: "20 - 8 = ?",
      correctAnswer: "12",
      gradeLevel: "1-2",
      category: "math-word",
      basePoints: 75,
      choices: ["11", "12", "13", "14"],
    },
    {
      id: "12-m10",
      prompt: "6 + 9 = ?",
      correctAnswer: "15",
      gradeLevel: "1-2",
      category: "math-word",
      basePoints: 75,
      choices: ["14", "15", "16", "17"],
    },
    {
      id: "12-m11",
      prompt: "10 ÷ 5 = ?",
      correctAnswer: "2",
      gradeLevel: "1-2",
      category: "math-word",
      basePoints: 80,
      choices: ["1", "2", "3", "4"],
    },
    {
      id: "12-m12",
      prompt: "7 + 8 = ?",
      correctAnswer: "15",
      gradeLevel: "1-2",
      category: "math-word",
      basePoints: 75,
      choices: ["14", "15", "16", "17"],
    },
    {
      id: "12-m13",
      prompt: "5 × 5 = ?",
      correctAnswer: "25",
      gradeLevel: "1-2",
      category: "math-word",
      basePoints: 85,
      difficulty: "medium",
      choices: ["20", "23", "25", "28"],
    },
    {
      id: "12-m14",
      prompt: "18 - 9 = ?",
      correctAnswer: "9",
      gradeLevel: "1-2",
      category: "math-word",
      basePoints: 75,
      choices: ["8", "9", "10", "11"],
    },
    {
      id: "12-m15",
      prompt: "12 ÷ 3 = ?",
      correctAnswer: "4",
      gradeLevel: "1-2",
      category: "math-word",
      basePoints: 80,
      choices: ["3", "4", "5", "6"],
    },
  ],

  "3-4": [
    // ========== SPELLING (clue-based) ==========
    {
      id: "34-s1",
      prompt: "Spell the word meaning 'very pretty'",
      correctAnswer: "beautiful",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 150,
      choices: ["beautiful", "beatiful", "beutiful", "beautyful"],
    },
    {
      id: "34-s2",
      prompt: "Spell the word meaning 'not the same'",
      correctAnswer: "different",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 150,
      choices: ["different", "diffrent", "diferent", "differant"],
    },
    {
      id: "34-s3",
      prompt: "Spell the word meaning 'liked the most'",
      correctAnswer: "favorite",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 140,
      choices: ["favorite", "favrite", "favourit", "favorit"],
    },
    {
      id: "34-s4",
      prompt: "Spell the word meaning 'to keep in your mind'",
      correctAnswer: "remember",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 140,
      choices: ["remember", "rember", "remeber", "remembar"],
    },
    {
      id: "34-s5",
      prompt: "Spell the large gray animal with a trunk",
      correctAnswer: "elephant",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 140,
      choices: ["elephant", "elefant", "elephent", "elaphant"],
    },
    {
      id: "34-s6",
      prompt: "Spell the word meaning 'feeling amazed'",
      correctAnswer: "surprised",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 150,
      difficulty: "hard",
      choices: ["surprised", "surprized", "suprised", "serprise"],
    },
    {
      id: "34-s7",
      prompt: "Spell the word meaning 'to make someone laugh'",
      correctAnswer: "funny",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 130,
      choices: ["funny", "funy", "funnie", "funie"],
    },
    {
      id: "34-s8",
      prompt: "Spell the word meaning 'the power to create or invent'",
      correctAnswer: "imagination",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 160,
      difficulty: "hard",
      choices: ["imagination", "imagenation", "immagination", "imaginashun"],
    },
    {
      id: "34-s9",
      prompt: "Spell the word meaning 'very important'",
      correctAnswer: "important",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 145,
      choices: ["important", "importent", "importint", "imporant"],
    },
    {
      id: "34-s10",
      prompt: "Spell the word meaning 'not easy'",
      correctAnswer: "difficult",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 155,
      difficulty: "medium",
      choices: ["difficult", "dificult", "difficalt", "dificalt"],
    },
    {
      id: "34-s11",
      prompt: "Spell the word meaning 'the opposite of together'",
      correctAnswer: "separate",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 150,
      choices: ["separate", "seperate", "separete", "seprate"],
    },
    {
      id: "34-s12",
      prompt: "Spell the word meaning 'right away'",
      correctAnswer: "immediately",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 160,
      difficulty: "hard",
      choices: ["immediately", "imediately", "immediatly", "imediatly"],
    },
    {
      id: "34-s13",
      prompt: "Spell the word meaning 'the study of the past'",
      correctAnswer: "history",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 135,
      choices: ["history", "histery", "hystory", "histori"],
    },
    {
      id: "34-s14",
      prompt: "Spell the word meaning 'a place to borrow books'",
      correctAnswer: "library",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 145,
      choices: ["library", "libary", "libairy", "librery"],
    },
    {
      id: "34-s15",
      prompt: "Spell the word meaning 'the leader of a school'",
      correctAnswer: "principal",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 150,
      difficulty: "medium",
      choices: ["principal", "principle", "principel", "prencipal"],
    },
    {
      id: "34-s16",
      prompt: "Spell the word meaning 'to find the answer'",
      correctAnswer: "discover",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 140,
      choices: ["discover", "diskover", "diskovr", "discovar"],
    },
    {
      id: "34-s17",
      prompt: "Spell the word meaning 'very amazing'",
      correctAnswer: "wonderful",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 140,
      choices: ["wonderful", "wonderfull", "wondurful", "wanderful"],
    },
    {
      id: "34-s18",
      prompt: "Spell the word meaning 'the opposite of always'",
      correctAnswer: "never",
      gradeLevel: "3-4",
      category: "spelling",
      basePoints: 125,
      choices: ["never", "naver", "nevr", "nevar"],
    },

    // ========== VOCABULARY (fill in the blank) ==========
    {
      id: "34-v1",
      prompt: "The teacher ___ the lesson clearly",
      correctAnswer: "explained",
      gradeLevel: "3-4",
      category: "vocabulary",
      basePoints: 120,
      choices: ["explained", "explain", "explaining", "explains"],
    },
    {
      id: "34-v2",
      prompt: "She felt ___ when she won the race",
      correctAnswer: "excited",
      gradeLevel: "3-4",
      category: "vocabulary",
      basePoints: 120,
      choices: ["excited", "exciting", "excite", "excites"],
    },
    {
      id: "34-v3",
      prompt: "The story was so ___ that I couldn't stop reading",
      correctAnswer: "interesting",
      gradeLevel: "3-4",
      category: "vocabulary",
      basePoints: 130,
      choices: ["interesting", "interested", "interest", "interests"],
    },
    {
      id: "34-v4",
      prompt: "We ___ to the beach last summer",
      correctAnswer: "went",
      gradeLevel: "3-4",
      category: "vocabulary",
      basePoints: 110,
      choices: ["went", "go", "goes", "going"],
    },
    {
      id: "34-v5",
      prompt: "The scientist ___ a new discovery",
      correctAnswer: "made",
      gradeLevel: "3-4",
      category: "vocabulary",
      basePoints: 120,
      choices: ["made", "make", "makes", "making"],
    },
    {
      id: "34-v6",
      prompt: "They ___ their homework before dinner",
      correctAnswer: "finished",
      gradeLevel: "3-4",
      category: "vocabulary",
      basePoints: 115,
      choices: ["finished", "finish", "finishes", "finishing"],
    },
    {
      id: "34-v7",
      prompt: "The magician ___ the audience with his trick",
      correctAnswer: "amazed",
      gradeLevel: "3-4",
      category: "vocabulary",
      basePoints: 125,
      choices: ["amazed", "amaze", "amazing", "amazes"],
    },
    {
      id: "34-v8",
      prompt: "My sister ___ a beautiful painting",
      correctAnswer: "created",
      gradeLevel: "3-4",
      category: "vocabulary",
      basePoints: 120,
      choices: ["created", "create", "creates", "creating"],
    },
    {
      id: "34-v9",
      prompt: "The detective ___ the mystery quickly",
      correctAnswer: "solved",
      gradeLevel: "3-4",
      category: "vocabulary",
      basePoints: 120,
      choices: ["solved", "solve", "solves", "solving"],
    },
    {
      id: "34-v10",
      prompt: "He ___ his room every Saturday",
      correctAnswer: "cleans",
      gradeLevel: "3-4",
      category: "vocabulary",
      basePoints: 110,
      choices: ["cleans", "clean", "cleaned", "cleaning"],
    },
    {
      id: "34-v11",
      prompt: "The flowers ___ beautifully in spring",
      correctAnswer: "bloom",
      gradeLevel: "3-4",
      category: "vocabulary",
      basePoints: 115,
      choices: ["bloom", "blooms", "bloomed", "blooming"],
    },
    {
      id: "34-v12",
      prompt: "They ___ the game with skill",
      correctAnswer: "played",
      gradeLevel: "3-4",
      category: "vocabulary",
      basePoints: 110,
      choices: ["played", "play", "plays", "playing"],
    },
    {
      id: "34-v13",
      prompt: "The astronaut ___ into space",
      correctAnswer: "traveled",
      gradeLevel: "3-4",
      category: "vocabulary",
      basePoints: 125,
      choices: ["traveled", "travel", "travels", "traveling"],
    },
    {
      id: "34-v14",
      prompt: "She ___ her best effort in the test",
      correctAnswer: "gave",
      gradeLevel: "3-4",
      category: "vocabulary",
      basePoints: 115,
      choices: ["gave", "give", "gives", "giving"],
    },
    {
      id: "34-v15",
      prompt: "The thunder ___ during the storm",
      correctAnswer: "rumbled",
      gradeLevel: "3-4",
      category: "vocabulary",
      basePoints: 120,
      choices: ["rumbled", "rumble", "rumbles", "rumbling"],
    },

    // ========== GRAMMAR (punctuation/formatting) ==========
    {
      id: "34-g1",
      prompt: "How should the book title appear: Harry Potter",
      correctAnswer: "Harry Potter",
      gradeLevel: "3-4",
      category: "sentence",
      basePoints: 120,
      choices: ["Harry Potter", "harry potter", "Harry potter", "HARRY POTTER"],
    },
    {
      id: "34-g2",
      prompt: "Add the correct punctuation: I need eggs___ milk___ and bread",
      correctAnswer: ",",
      gradeLevel: "3-4",
      category: "sentence",
      basePoints: 110,
      choices: [",", ";", ".", ":"],
    },
    {
      id: "34-g3",
      prompt:
        "Which punctuation joins two related sentences: I love reading___ it's my favorite hobby",
      correctAnswer: ";",
      gradeLevel: "3-4",
      category: "sentence",
      basePoints: 140,
      difficulty: "hard",
      choices: [";", ",", ".", ":"],
    },
    {
      id: "34-g4",
      prompt: "Add the missing punctuation: Dear Mom___",
      correctAnswer: ",",
      gradeLevel: "3-4",
      category: "sentence",
      basePoints: 100,
      choices: [",", ".", ":", ";"],
    },
    {
      id: "34-g5",
      prompt: "Which needs a capital letter: 'we visited new york city'",
      correctAnswer: "New York City",
      gradeLevel: "3-4",
      category: "sentence",
      basePoints: 110,
      choices: ["New York City", "We", "visited", "we"],
    },
    {
      id: "34-g6",
      prompt: "Add the missing punctuation: Are you coming to the party___",
      correctAnswer: "?",
      gradeLevel: "3-4",
      category: "sentence",
      basePoints: 100,
      choices: ["?", ".", "!", ","],
    },
    {
      id: "34-g7",
      prompt: "How should the movie title appear: the lion king",
      correctAnswer: "The Lion King",
      gradeLevel: "3-4",
      category: "sentence",
      basePoints: 115,
      choices: [
        "The Lion King",
        "the Lion King",
        "The lion king",
        "THE LION KING",
      ],
    },
    {
      id: "34-g8",
      prompt:
        "Add the missing punctuation: I finished my homework___ now I can play",
      correctAnswer: ",",
      gradeLevel: "3-4",
      category: "sentence",
      basePoints: 115,
      choices: [",", ".", ";", ":"],
    },
    {
      id: "34-g9",
      prompt:
        "Choose the correct capitalization: 'on friday, we go to disneyland'",
      correctAnswer: "On Friday, we go to Disneyland",
      gradeLevel: "3-4",
      category: "sentence",
      basePoints: 130,
      difficulty: "medium",
      choices: [
        "On Friday, we go to Disneyland",
        "on Friday, we go to Disneyland",
        "On friday, we go to disneyland",
        "on friday, we go to disneyland",
      ],
    },
    {
      id: "34-g10",
      prompt:
        "Add the missing punctuation: Please bring pencils___ paper___ and markers",
      correctAnswer: ",",
      gradeLevel: "3-4",
      category: "sentence",
      basePoints: 120,
      choices: [",", ".", ":", ";"],
    },
    {
      id: "34-g11",
      prompt: "Add the correct end punctuation: I wonder what time it is___",
      correctAnswer: "?",
      gradeLevel: "3-4",
      category: "sentence",
      basePoints: 110,
      choices: ["?", ".", "!", ","],
    },
    {
      id: "34-g12",
      prompt: "Which needs a capital letter: 'last summer we visited canada'",
      correctAnswer: "Canada",
      gradeLevel: "3-4",
      category: "sentence",
      basePoints: 120,
      choices: ["Canada", "last", "summer", "we"],
    },

    // ========== MATH WORD PROBLEMS ==========
    {
      id: "34-m1",
      prompt: "25 × 4 = ?",
      correctAnswer: "100",
      gradeLevel: "3-4",
      category: "math-word",
      basePoints: 110,
      choices: ["90", "95", "100", "105"],
    },
    {
      id: "34-m2",
      prompt: "56 ÷ 8 = ?",
      correctAnswer: "7",
      gradeLevel: "3-4",
      category: "math-word",
      basePoints: 120,
      choices: ["6", "7", "8", "9"],
    },
    {
      id: "34-m3",
      prompt: "13 × 6 = ?",
      correctAnswer: "78",
      gradeLevel: "3-4",
      category: "math-word",
      basePoints: 130,
      difficulty: "medium",
      choices: ["72", "76", "78", "80"],
    },
    {
      id: "34-m4",
      prompt: "144 ÷ 12 = ?",
      correctAnswer: "12",
      gradeLevel: "3-4",
      category: "math-word",
      basePoints: 130,
      difficulty: "medium",
      choices: ["10", "11", "12", "13"],
    },
    {
      id: "34-m5",
      prompt: "If 2x + 4 = 10, what is x?",
      correctAnswer: "3",
      gradeLevel: "3-4",
      category: "math-word",
      basePoints: 150,
      difficulty: "hard",
      choices: ["2", "3", "4", "5"],
    },
    {
      id: "34-m6",
      prompt: "A pencil costs 30 cents. How much do 4 pencils cost?",
      correctAnswer: "120",
      gradeLevel: "3-4",
      category: "math-word",
      basePoints: 130,
      choices: ["90", "100", "110", "120"],
    },
    {
      id: "34-m7",
      prompt:
        "A baker made 48 cookies and packed them into boxes of 6. How many boxes did she use?",
      correctAnswer: "8",
      gradeLevel: "3-4",
      category: "math-word",
      basePoints: 140,
      choices: ["6", "7", "8", "9"],
    },
    {
      id: "34-m8",
      prompt: "What is 3/4 of 20?",
      correctAnswer: "15",
      gradeLevel: "3-4",
      category: "math-word",
      basePoints: 150,
      difficulty: "medium",
      choices: ["10", "12", "15", "18"],
    },
    {
      id: "34-m9",
      prompt:
        "There are 5 rows of chairs with 9 chairs in each row. How many chairs are there in total?",
      correctAnswer: "45",
      gradeLevel: "3-4",
      category: "math-word",
      basePoints: 140,
      choices: ["36", "40", "45", "50"],
    },
    {
      id: "34-m10",
      prompt:
        "A book has 12 chapters. You read 3 chapters each day. How many days will it take to finish?",
      correctAnswer: "4",
      gradeLevel: "3-4",
      category: "math-word",
      basePoints: 135,
      choices: ["3", "4", "5", "6"],
    },
    {
      id: "34-m11",
      prompt: "What is 9 × 9?",
      correctAnswer: "81",
      gradeLevel: "3-4",
      category: "math-word",
      basePoints: 135,
      choices: ["72", "81", "90", "99"],
    },
    {
      id: "34-m12",
      prompt:
        "You have 60 stickers and share them equally among 5 friends. How many does each friend get?",
      correctAnswer: "12",
      gradeLevel: "3-4",
      category: "math-word",
      basePoints: 140,
      choices: ["10", "11", "12", "13"],
    },
  ],

  "5-6": [
    // ========== SPELLING (clue-based) ==========
    {
      id: "56-s1",
      prompt: "Spell the word meaning 'to provide lodging'",
      correctAnswer: "accommodate",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 200,
      difficulty: "hard",
      choices: ["accommodate", "accomodate", "acomodate", "acommodate"],
    },
    {
      id: "56-s2",
      prompt: "Spell the word meaning 'required or essential'",
      correctAnswer: "necessary",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 200,
      difficulty: "hard",
      choices: ["necessary", "neccesary", "necesary", "neccessary"],
    },
    {
      id: "56-s3",
      prompt: "Spell the word meaning 'to divide or keep apart'",
      correctAnswer: "separate",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 180,
      choices: ["separate", "seperate", "separete", "seprate"],
    },
    {
      id: "56-s4",
      prompt: "Spell the word meaning 'without a doubt'",
      correctAnswer: "definitely",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 190,
      difficulty: "hard",
      choices: ["definitely", "definately", "definitly", "definetly"],
    },
    {
      id: "56-s5",
      prompt: "Spell the word meaning 'the natural world'",
      correctAnswer: "environment",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 190,
      choices: ["environment", "enviroment", "environement", "enviornment"],
    },
    {
      id: "56-s6",
      prompt: "Spell the word meaning 'aware of one's surroundings'",
      correctAnswer: "conscious",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 180,
      choices: ["conscious", "concious", "consious", "conscous"],
    },
    {
      id: "56-s7",
      prompt: "Spell the word meaning 'to change something for the better'",
      correctAnswer: "improve",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 170,
      choices: ["improve", "improv", "impruve", "improove"],
    },
    {
      id: "56-s8",
      prompt: "Spell the word meaning 'to study something carefully'",
      correctAnswer: "analyze",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 180,
      difficulty: "medium",
      choices: ["analyze", "analyse", "analize", "anelyze"],
    },
    {
      id: "56-s9",
      prompt: "Spell the word meaning 'very important or necessary'",
      correctAnswer: "essential",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 180,
      choices: ["essential", "essencial", "essentail", "esential"],
    },
    {
      id: "56-s10",
      prompt: "Spell the word meaning 'to make something easier to understand'",
      correctAnswer: "clarify",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 175,
      choices: ["clarify", "clarafy", "clarfiy", "clarrify"],
    },
    {
      id: "56-s11",
      prompt:
        "Spell the word meaning 'something suggested but not directly stated'",
      correctAnswer: "implication",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 190,
      difficulty: "hard",
      choices: ["implication", "implicaiton", "implicaton", "impliccation"],
    },
    {
      id: "56-s12",
      prompt: "Spell the word meaning 'relating to the mind'",
      correctAnswer: "psychological",
      gradeLevel: "5-6",
      category: "spelling",
      basePoints: 210,
      difficulty: "hard",
      choices: [
        "psychological",
        "psycological",
        "psychologial",
        "pshycological",
      ],
    },

    // ========== VOCABULARY (fill in the blank) ==========
    {
      id: "56-v1",
      prompt: "The scientist's hypothesis was ___ by the experiment",
      correctAnswer: "confirmed",
      gradeLevel: "5-6",
      category: "vocabulary",
      basePoints: 160,
      choices: ["confirmed", "confirm", "confirming", "confirms"],
    },
    {
      id: "56-v2",
      prompt: "The ancient ruins ___ a fascinating glimpse into the past",
      correctAnswer: "provided",
      gradeLevel: "5-6",
      category: "vocabulary",
      basePoints: 160,
      choices: ["provided", "provide", "provides", "providing"],
    },
    {
      id: "56-v3",
      prompt: "Her argument was both ___ and persuasive",
      correctAnswer: "logical",
      gradeLevel: "5-6",
      category: "vocabulary",
      basePoints: 170,
      choices: ["logical", "logic", "logically", "logistics"],
    },
    {
      id: "56-v4",
      prompt: "The committee will ___ the proposal tomorrow",
      correctAnswer: "consider",
      gradeLevel: "5-6",
      category: "vocabulary",
      basePoints: 150,
      choices: ["consider", "considering", "considered", "considers"],
    },
    {
      id: "56-v5",
      prompt: "The results were ___ different from what we expected",
      correctAnswer: "significantly",
      gradeLevel: "5-6",
      category: "vocabulary",
      basePoints: 170,
      difficulty: "medium",
      choices: ["significantly", "significant", "significance", "signify"],
    },
    {
      id: "56-v6",
      prompt: "The teacher asked us to ___ the main idea of the passage",
      correctAnswer: "summarize",
      gradeLevel: "5-6",
      category: "vocabulary",
      basePoints: 165,
      choices: ["summarize", "summary", "summaries", "summarized"],
    },
    {
      id: "56-v7",
      prompt: "The athlete's performance ___ everyone's expectations",
      correctAnswer: "exceeded",
      gradeLevel: "5-6",
      category: "vocabulary",
      basePoints: 170,
      choices: ["exceeded", "exceed", "exceeds", "exceeding"],
    },
    {
      id: "56-v8",
      prompt: "The evidence clearly ___ his claim",
      correctAnswer: "supports",
      gradeLevel: "5-6",
      category: "vocabulary",
      basePoints: 160,
      choices: ["supports", "support", "supported", "supporting"],
    },
    {
      id: "56-v9",
      prompt: "The city decided to ___ a new park downtown",
      correctAnswer: "construct",
      gradeLevel: "5-6",
      category: "vocabulary",
      basePoints: 165,
      choices: ["construct", "construction", "constructs", "constructed"],
    },
    {
      id: "56-v10",
      prompt: "The doctor will ___ the results with you tomorrow",
      correctAnswer: "discuss",
      gradeLevel: "5-6",
      category: "vocabulary",
      basePoints: 160,
      choices: ["discuss", "discussed", "discussing", "discusses"],
    },

    // ========== GRAMMAR (advanced punctuation) ==========
    {
      id: "56-g1",
      prompt: "Format the book title correctly: the great gatsby",
      correctAnswer: "The Great Gatsby",
      gradeLevel: "5-6",
      category: "sentence",
      basePoints: 150,
      choices: [
        "The Great Gatsby",
        "the great gatsby",
        "The great Gatsby",
        "The Great gatsby",
      ],
    },
    {
      id: "56-g2",
      prompt:
        "Add correct punctuation: The ingredients are___ flour, sugar, eggs, and butter",
      correctAnswer: ":",
      gradeLevel: "5-6",
      category: "sentence",
      basePoints: 160,
      choices: [":", ";", ",", "-"],
    },
    {
      id: "56-g3",
      prompt:
        "Punctuate correctly: She studied hard___ however___ she still failed",
      correctAnswer: ";",
      gradeLevel: "5-6",
      category: "sentence",
      basePoints: 180,
      difficulty: "hard",
      choices: [";", ",", ".", ":"],
    },
    {
      id: "56-g4",
      prompt: "Fix the contraction: Its a beautiful day___",
      correctAnswer: "It's",
      gradeLevel: "5-6",
      category: "sentence",
      basePoints: 140,
      choices: ["It's", "Its", "Its'", "It`s"],
    },
    {
      id: "56-g5",
      prompt: "Which punctuation is best for emphasis: I cannot believe it___",
      correctAnswer: "!",
      gradeLevel: "5-6",
      category: "sentence",
      basePoints: 120,
      choices: ["!", ".", "?", ";"],
    },
    {
      id: "56-g6",
      prompt:
        "Choose the correct sentence: We brought everything we needed___ tents, food, and water",
      correctAnswer: "We brought everything we needed: tents, food, and water.",
      gradeLevel: "5-6",
      category: "sentence",
      basePoints: 180,
      difficulty: "medium",
      choices: [
        "We brought everything we needed: tents, food, and water.",
        "We brought everything we needed, tents, food, and water.",
        "We brought everything we needed; tents, food, and water.",
        "We brought everything we needed tents, food, and water.",
      ],
    },
    {
      id: "56-g7",
      prompt:
        "Add missing punctuation: Although it was raining___ we still went outside",
      correctAnswer: ",",
      gradeLevel: "5-6",
      category: "sentence",
      basePoints: 160,
      choices: [",", ";", ":", "."],
    },

    // ========== MATH WORD PROBLEMS ==========
    {
      id: "56-m1",
      prompt: "125 × 8 = ?",
      correctAnswer: "1000",
      gradeLevel: "5-6",
      category: "math-word",
      basePoints: 150,
      choices: ["900", "950", "1000", "1050"],
    },
    {
      id: "56-m2",
      prompt: "If 3x - 7 = 14, what is x?",
      correctAnswer: "7",
      gradeLevel: "5-6",
      category: "math-word",
      basePoints: 180,
      difficulty: "medium",
      choices: ["5", "6", "7", "8"],
    },
    {
      id: "56-m3",
      prompt: "What is 25% of 200?",
      correctAnswer: "50",
      gradeLevel: "5-6",
      category: "math-word",
      basePoints: 170,
      choices: ["40", "45", "50", "55"],
    },
    {
      id: "56-m4",
      prompt: "If 2x + 5 = 3x - 2, what is x?",
      correctAnswer: "7",
      gradeLevel: "5-6",
      category: "math-word",
      basePoints: 200,
      difficulty: "hard",
      choices: ["5", "6", "7", "8"],
    },
    {
      id: "56-m5",
      prompt: "432 ÷ 18 = ?",
      correctAnswer: "24",
      gradeLevel: "5-6",
      category: "math-word",
      basePoints: 160,
      choices: ["22", "23", "24", "25"],
    },
    {
      id: "56-m6",
      prompt: "If a rectangle has length 15 and width 8, what is its area?",
      correctAnswer: "120",
      gradeLevel: "5-6",
      category: "math-word",
      basePoints: 150,
      choices: ["110", "115", "120", "125"],
    },
    {
      id: "56-m7",
      prompt:
        "A store gives a 10% discount on a $50 item. What is the discount?",
      correctAnswer: "5",
      gradeLevel: "5-6",
      category: "math-word",
      basePoints: 170,
      choices: ["4", "5", "10", "15"],
    },
    {
      id: "56-m8",
      prompt: "What is the value of 3² + 4²?",
      correctAnswer: "25",
      gradeLevel: "5-6",
      category: "math-word",
      basePoints: 170,
      difficulty: "medium",
      choices: ["13", "24", "25", "27"],
    },
    {
      id: "56-m9",
      prompt:
        "A runner completes 3.5 kilometers each day for 4 days. How many kilometers total?",
      correctAnswer: "14",
      gradeLevel: "5-6",
      category: "math-word",
      basePoints: 180,
      choices: ["10", "12", "14", "16"],
    },
    {
      id: "56-m10",
      prompt:
        "A recipe calls for 3/4 cup of sugar. If you double the recipe, how much sugar do you need?",
      correctAnswer: "1.5",
      gradeLevel: "5-6",
      category: "math-word",
      basePoints: 185,
      difficulty: "hard",
      choices: ["1", "1.25", "1.5", "2"],
    },
  ],
};
