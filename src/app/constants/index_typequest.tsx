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
    K: 8,
    "1-2": 8,
    "3-4": 10,
    "5-6": 8,
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

// Complete word bank organized by grade bands
export const WORD_BANK: Record<GradeLevel, Question[]> = {
  K: [
    // ========== SPELLING (clue-based) ==========
    {
      id: "k-s1",
      prompt: "Spell the word that barks",
      correctAnswer: "dog",
      gradeLevel: "K",
      category: "spelling",
      basePoints: 80,
      choices: ["dog", "god", "dig", "dug"],
    },
    {
      id: "k-s2",
      prompt: "Spell the word that says 'meow'",
      correctAnswer: "cat",
      gradeLevel: "K",
      category: "spelling",
      basePoints: 80,
      choices: ["cat", "cot", "cut", "bat"],
    },
    {
      id: "k-s3",
      prompt: "Spell the word you wear on your head",
      correctAnswer: "hat",
      gradeLevel: "K",
      category: "spelling",
      basePoints: 80,
      choices: ["hat", "hot", "hit", "bat"],
    },
    {
      id: "k-s4",
      prompt: "Spell the word that shines in the sky",
      correctAnswer: "sun",
      gradeLevel: "K",
      category: "spelling",
      basePoints: 80,
      choices: ["sun", "son", "fun", "run"],
    },
    {
      id: "k-s5",
      prompt: "Spell the color of an apple",
      correctAnswer: "red",
      gradeLevel: "K",
      category: "spelling",
      basePoints: 80,
      choices: ["red", "rad", "bed", "rod"],
    },

    // ========== VOCABULARY (fill in the blank) ==========
    {
      id: "k-v1",
      prompt: "I ___ happy today (am/is)",
      correctAnswer: "am",
      gradeLevel: "K",
      category: "vocabulary",
      basePoints: 70,
      choices: ["am", "is", "are", "be"],
    },
    {
      id: "k-v2",
      prompt: "The ball is ___ (big/little)",
      correctAnswer: "big",
      gradeLevel: "K",
      category: "vocabulary",
      basePoints: 70,
      choices: ["big", "small", "tiny", "huge"],
    },
    {
      id: "k-v3",
      prompt: "I can ___ fast (run/walk)",
      correctAnswer: "run",
      gradeLevel: "K",
      category: "vocabulary",
      basePoints: 70,
      choices: ["run", "walk", "jump", "hop"],
    },

    // ========== GRAMMAR (punctuation/capitalization) ==========
    {
      id: "k-g1",
      prompt: "Add the missing punctuation: I like dogs___",
      correctAnswer: ".",
      gradeLevel: "K",
      category: "sentence",
      basePoints: 60,
      choices: [".", "?", "!", ","],
    },
    {
      id: "k-g2",
      prompt: "Which word should be capitalized: 'my name is tom'",
      correctAnswer: "Tom",
      gradeLevel: "K",
      category: "sentence",
      basePoints: 70,
      choices: ["Tom", "my", "name", "is"],
    },

    // ========== MATH WORD PROBLEMS ==========
    {
      id: "k-m1",
      prompt: "1 + 1 = ?",
      correctAnswer: "2",
      gradeLevel: "K",
      category: "math-word",
      basePoints: 50,
      choices: ["1", "2", "3", "4"],
    },
    {
      id: "k-m2",
      prompt: "2 + 2 = ?",
      correctAnswer: "4",
      gradeLevel: "K",
      category: "math-word",
      basePoints: 50,
      choices: ["3", "4", "5", "6"],
    },
    {
      id: "k-m3",
      prompt: "5 - 2 = ?",
      correctAnswer: "3",
      gradeLevel: "K",
      category: "math-word",
      basePoints: 60,
      choices: ["2", "3", "4", "5"],
    },
    {
      id: "k-m4",
      prompt: "3 + 3 = ?",
      correctAnswer: "6",
      gradeLevel: "K",
      category: "math-word",
      basePoints: 60,
      choices: ["5", "6", "7", "8"],
    },
  ],

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

    // ========== VOCABULARY (fill in the blank) ==========
    {
      id: "12-v1",
      prompt: "Thomas ___ the pasta last night (ate/eat)",
      correctAnswer: "ate",
      gradeLevel: "1-2",
      category: "vocabulary",
      basePoints: 90,
      choices: ["ate", "eat", "eating", "eaten"],
    },
    {
      id: "12-v2",
      prompt: "She ___ to school every day (goes/go)",
      correctAnswer: "goes",
      gradeLevel: "1-2",
      category: "vocabulary",
      basePoints: 90,
      choices: ["goes", "go", "went", "going"],
    },
    {
      id: "12-v3",
      prompt: "The dog ___ loudly (barked/bark)",
      correctAnswer: "barked",
      gradeLevel: "1-2",
      category: "vocabulary",
      basePoints: 90,
      choices: ["barked", "bark", "barking", "barks"],
    },
    {
      id: "12-v4",
      prompt: "They ___ playing outside (are/is)",
      correctAnswer: "are",
      gradeLevel: "1-2",
      category: "vocabulary",
      basePoints: 85,
      choices: ["are", "is", "am", "be"],
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

    // ========== VOCABULARY (fill in the blank) ==========
    {
      id: "34-v1",
      prompt: "The teacher ___ the lesson clearly (explained/explain)",
      correctAnswer: "explained",
      gradeLevel: "3-4",
      category: "vocabulary",
      basePoints: 120,
      choices: ["explained", "explain", "explaining", "explains"],
    },
    {
      id: "34-v2",
      prompt: "She felt ___ when she won the race (excited/exciting)",
      correctAnswer: "excited",
      gradeLevel: "3-4",
      category: "vocabulary",
      basePoints: 120,
      choices: ["excited", "exciting", "excite", "excites"],
    },
    {
      id: "34-v3",
      prompt:
        "The story was so ___ that I couldn't stop reading (interesting/interested)",
      correctAnswer: "interesting",
      gradeLevel: "3-4",
      category: "vocabulary",
      basePoints: 130,
      choices: ["interesting", "interested", "interest", "interests"],
    },
    {
      id: "34-v4",
      prompt: "We ___ to the beach last summer (went/go)",
      correctAnswer: "went",
      gradeLevel: "3-4",
      category: "vocabulary",
      basePoints: 110,
      choices: ["went", "go", "goes", "going"],
    },
    {
      id: "34-v5",
      prompt: "The scientist ___ a new discovery (made/make)",
      correctAnswer: "made",
      gradeLevel: "3-4",
      category: "vocabulary",
      basePoints: 120,
      choices: ["made", "make", "makes", "making"],
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

    // ========== VOCABULARY (fill in the blank) ==========
    {
      id: "56-v1",
      prompt:
        "The scientist's hypothesis was ___ by the experiment (confirmed/confirm)",
      correctAnswer: "confirmed",
      gradeLevel: "5-6",
      category: "vocabulary",
      basePoints: 160,
      choices: ["confirmed", "confirm", "confirming", "confirms"],
    },
    {
      id: "56-v2",
      prompt:
        "The ancient ruins ___ a fascinating glimpse into the past (provided/provide)",
      correctAnswer: "provided",
      gradeLevel: "5-6",
      category: "vocabulary",
      basePoints: 160,
      choices: ["provided", "provide", "provides", "providing"],
    },
    {
      id: "56-v3",
      prompt: "Her argument was both ___ and persuasive (logical/logic)",
      correctAnswer: "logical",
      gradeLevel: "5-6",
      category: "vocabulary",
      basePoints: 170,
      choices: ["logical", "logic", "logically", "logistics"],
    },
    {
      id: "56-v4",
      prompt:
        "The committee will ___ the proposal tomorrow (consider/considering)",
      correctAnswer: "consider",
      gradeLevel: "5-6",
      category: "vocabulary",
      basePoints: 150,
      choices: ["consider", "considering", "considered", "considers"],
    },
    {
      id: "56-v5",
      prompt:
        "The results were ___ different from what we expected (significantly/significant)",
      correctAnswer: "significantly",
      gradeLevel: "5-6",
      category: "vocabulary",
      basePoints: 170,
      difficulty: "medium",
      choices: ["significantly", "significant", "significance", "signify"],
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
      prompt: "Add missing punctuation: Its a beautiful day___",
      correctAnswer: "It's",
      gradeLevel: "5-6",
      category: "sentence",
      basePoints: 140,
      choices: ["It's", "Its", "Its'", "It`s"],
    },
    {
      id: "56-g5",
      prompt: "Which punctuation for emphasis: I cannot believe it___",
      correctAnswer: "!",
      gradeLevel: "5-6",
      category: "sentence",
      basePoints: 120,
      choices: ["!", ".", "?", ";"],
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
  ],
};
