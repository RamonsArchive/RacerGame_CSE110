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
  prompt: string; // the clue (and scrambled letters) shown
  userAnswer: string;
  correctAnswer: string;
  gaveUp?: boolean;
}

export interface UnscrambleQuestion {
  id: string;
  question: string;
  scrambledAnswer: string;
  unscrambledAnswer: string;
  gradeLevel: GradeLevel;
  correctAnswer?: string | string[]; // 💡 KEEP THIS!
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
  /* Your full question bank stays exactly as you have it — looks good */
  // K / 1-2 / 3-4 / 5-6 data stays unchanged...
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
    {
      id: "k-3",
      question: "A pet that says woof.",
      scrambledAnswer: "god",
      unscrambledAnswer: "dog",
      gradeLevel: "K",
      hint: "Starts with d",
    },
    {
      id: "k-4",
      question: "You wear it on your head.",
      scrambledAnswer: "tah",
      unscrambledAnswer: "hat",
      gradeLevel: "K",
      hint: "Keeps your head warm",
    },
    {
      id: "k-5",
      question: "You can throw or kick it.",
      scrambledAnswer: "llab",
      unscrambledAnswer: "ball",
      gradeLevel: "K",
      hint: "Starts with b",
    },
    {
      id: "k-6",
      question: "A big plant with a trunk.",
      scrambledAnswer: "reet",
      unscrambledAnswer: "tree",
      gradeLevel: "K",
      hint: "Has green leaves",
    },
    {
      id: "k-7",
      question: "You see it in the night sky.",
      scrambledAnswer: "srat",
      unscrambledAnswer: "star",
      gradeLevel: "K",
      hint: "Shines bright",
    },
    {
      id: "k-8",
      question: "An animal that can fly.",
      scrambledAnswer: "brid",
      unscrambledAnswer: "bird",
      gradeLevel: "K",
      hint: "Has wings",
    },
    {
      id: "k-9",
      question: "A green animal that hops.",
      scrambledAnswer: "gorf",
      unscrambledAnswer: "frog",
      gradeLevel: "K",
      hint: "Lives near ponds",
    },
    {
      id: "k-10",
      question: "An animal that swims.",
      scrambledAnswer: "hsif",
      unscrambledAnswer: "fish",
      gradeLevel: "K",
      hint: "Lives in water",
    },
    {
      id: "k-11",
      question: "Shines in the night sky with the stars.",
      scrambledAnswer: "onom",
      unscrambledAnswer: "moon",
      gradeLevel: "K",
      hint: "Round and bright",
    },
    {
      id: "k-12",
      question: "Comes from a chicken.",
      scrambledAnswer: "gge",
      unscrambledAnswer: "egg",
      gradeLevel: "K",
      hint: "You can eat it for breakfast",
    },
    {
      id: "k-13",
      question: "A big furry animal.",
      scrambledAnswer: "ebra",
      unscrambledAnswer: "bear",
      gradeLevel: "K",
      hint: "Rhymes with chair",
    },
    {
      id: "k-14",
      question: "A very young child.",
      scrambledAnswer: "byab",
      unscrambledAnswer: "baby",
      gradeLevel: "K",
      hint: "Starts with b",
    },
    {
      id: "k-15",
      question: "Falls from the clouds.",
      scrambledAnswer: "niar",
      unscrambledAnswer: "rain",
      gradeLevel: "K",
      hint: "You need an umbrella",
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
    {
      id: "12-3",
      question: "You drink it.",
      scrambledAnswer: "waetr",
      unscrambledAnswer: "water",
      gradeLevel: "1-2",
      hint: "Clear and wet",
    },
    {
      id: "12-4",
      question: "A red or green fruit.",
      scrambledAnswer: "plpae",
      unscrambledAnswer: "apple",
      gradeLevel: "1-2",
      hint: "Keeps the doctor away",
    },
    {
      id: "12-5",
      question: "Color of grass.",
      scrambledAnswer: "egner",
      unscrambledAnswer: "green",
      gradeLevel: "1-2",
      hint: "Starts with g",
    },
    {
      id: "12-6",
      question: "You sit on it.",
      scrambledAnswer: "achir",
      unscrambledAnswer: "chair",
      gradeLevel: "1-2",
      hint: "At a table or desk",
    },
    {
      id: "12-7",
      question: "What you do when you feel glad.",
      scrambledAnswer: "lmise",
      unscrambledAnswer: "smile",
      gradeLevel: "1-2",
      hint: "On your face",
    },
    {
      id: "12-8",
      question: "A long vehicle that runs on tracks.",
      scrambledAnswer: "tanri",
      unscrambledAnswer: "train",
      gradeLevel: "1-2",
      hint: "Takes people to places",
    },
    {
      id: "12-9",
      question: "White and floating in the sky.",
      scrambledAnswer: "docul",
      unscrambledAnswer: "cloud",
      gradeLevel: "1-2",
      hint: "Brings rain",
    },
    {
      id: "12-10",
      question: "Grows in yards and parks.",
      scrambledAnswer: "sasgr",
      unscrambledAnswer: "grass",
      gradeLevel: "1-2",
      hint: "Green and thin",
    },
    {
      id: "12-11",
      question: "A cheesy food cut into slices.",
      scrambledAnswer: "zpzia",
      unscrambledAnswer: "pizza",
      gradeLevel: "1-2",
      hint: "Often has pepperoni",
    },
    {
      id: "12-12",
      question: "You listen to it.",
      scrambledAnswer: "iucms",
      unscrambledAnswer: "music",
      gradeLevel: "1-2",
      hint: "Can be loud or soft",
    },
    {
      id: "12-13",
      question: "Helps you see in the dark.",
      scrambledAnswer: "tglih",
      unscrambledAnswer: "light",
      gradeLevel: "1-2",
      hint: "Opposite of dark",
    },
    {
      id: "12-14",
      question: "How you feel when things are good.",
      scrambledAnswer: "papyh",
      unscrambledAnswer: "happy",
      gradeLevel: "1-2",
      hint: "Rhymes with snappy",
    },
    {
      id: "12-15",
      question: "A big striped wild cat.",
      scrambledAnswer: "geitr",
      unscrambledAnswer: "tiger",
      gradeLevel: "1-2",
      hint: "Lives in the jungle",
    },
  ],

  "3-4": [
    {
      id: "34-1",
      question: "Earth is one.",
      scrambledAnswer: "telpan",
      unscrambledAnswer: "planet",
      gradeLevel: "3-4",
      hint: "In space",
    },
    {
      id: "34-2",
      question: "You can cross a river on it.",
      scrambledAnswer: "gbride",
      unscrambledAnswer: "bridge",
      gradeLevel: "3-4",
      hint: "Starts with b",
    },
    {
      id: "34-3",
      question: "A living creature that is not a plant.",
      scrambledAnswer: "niamla",
      unscrambledAnswer: "animal",
      gradeLevel: "3-4",
      hint: "Can move on its own",
    },
    {
      id: "34-4",
      question: "A round shape with no corners.",
      scrambledAnswer: "rcelci",
      unscrambledAnswer: "circle",
      gradeLevel: "3-4",
      hint: "Like a coin",
    },
    {
      id: "34-5",
      question: "A place where students learn.",
      scrambledAnswer: "sochol",
      unscrambledAnswer: "school",
      gradeLevel: "3-4",
      hint: "You go there on weekdays",
    },
    {
      id: "34-6",
      question: "A large area filled with many trees.",
      scrambledAnswer: "sefrot",
      unscrambledAnswer: "forest",
      gradeLevel: "3-4",
      hint: "Home to many animals",
    },
    {
      id: "34-7",
      question: "A large body of salt water.",
      scrambledAnswer: "enaco",
      unscrambledAnswer: "ocean",
      gradeLevel: "3-4",
      hint: "Covers most of Earth",
    },
    {
      id: "34-8",
      question: "A place with flowers and plants.",
      scrambledAnswer: "gdaern",
      unscrambledAnswer: "garden",
      gradeLevel: "3-4",
      hint: "You can grow vegetables here",
    },
    {
      id: "34-9",
      question: "A place where you can borrow books.",
      scrambledAnswer: "rlibray",
      unscrambledAnswer: "library",
      gradeLevel: "3-4",
      hint: "Quiet reading place",
    },
    {
      id: "34-10",
      question: "A value that tells how many.",
      scrambledAnswer: "beurnm",
      unscrambledAnswer: "number",
      gradeLevel: "3-4",
      hint: "Used in math",
    },
    {
      id: "34-11",
      question: "A game or problem you try to solve.",
      scrambledAnswer: "zlpzeu",
      unscrambledAnswer: "puzzle",
      gradeLevel: "3-4",
      hint: "Has pieces or clues",
    },
    {
      id: "34-12",
      question: "A dark shape made by blocking light.",
      scrambledAnswer: "sdowah",
      unscrambledAnswer: "shadow",
      gradeLevel: "3-4",
      hint: "Follows you on sunny days",
    },
    {
      id: "34-13",
      question: "Power used to do work or move things.",
      scrambledAnswer: "yegren",
      unscrambledAnswer: "energy",
      gradeLevel: "3-4",
      hint: "Comes from food or fuel",
    },
    {
      id: "34-14",
      question: "The warmest season of the year.",
      scrambledAnswer: "smemru",
      unscrambledAnswer: "summer",
      gradeLevel: "3-4",
      hint: "School vacation time",
    },
    {
      id: "34-15",
      question: "A dry, sandy place with little rain.",
      scrambledAnswer: "trdese",
      unscrambledAnswer: "desert",
      gradeLevel: "3-4",
      hint: "Very hot during the day",
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
    {
      id: "56-3",
      question: "A part of a whole number.",
      scrambledAnswer: "tacoinrf",
      unscrambledAnswer: "fraction",
      gradeLevel: "5-6",
      hint: "Used with numerator and denominator",
    },
    {
      id: "56-4",
      question: "A trip from one place to another.",
      scrambledAnswer: "yrujeno",
      unscrambledAnswer: "journey",
      gradeLevel: "5-6",
      hint: "Often takes time",
    },
    {
      id: "56-5",
      question: "Something difficult to understand or explain.",
      scrambledAnswer: "eytrysm",
      unscrambledAnswer: "mystery",
      gradeLevel: "5-6",
      hint: "A detective solves this",
    },
    {
      id: "56-6",
      question: "Study of the natural world.",
      scrambledAnswer: "icesenc",
      unscrambledAnswer: "science",
      gradeLevel: "5-6",
      hint: "Involves experiments",
    },
    {
      id: "56-7",
      question: "A serious student or academic person.",
      scrambledAnswer: "hlocrsa",
      unscrambledAnswer: "scholar",
      gradeLevel: "5-6",
      hint: "Rhymes with dollar",
    },
    {
      id: "56-8",
      question: "Study of past events.",
      scrambledAnswer: "otysirh",
      unscrambledAnswer: "history",
      gradeLevel: "5-6",
      hint: "About things that already happened",
    },
    {
      id: "56-9",
      question: "A number written with a point to show tenths or hundredths.",
      scrambledAnswer: "mleiacd",
      unscrambledAnswer: "decimal",
      gradeLevel: "5-6",
      hint: "Used with place value",
    },
    {
      id: "56-10",
      question: "A land ruled by a king or queen.",
      scrambledAnswer: "okmingd",
      unscrambledAnswer: "kingdom",
      gradeLevel: "5-6",
      hint: "Found in many fantasy stories",
    },
    {
      id: "56-11",
      question: "Success in a game, battle, or contest.",
      scrambledAnswer: "vtriyco",
      unscrambledAnswer: "victory",
      gradeLevel: "5-6",
      hint: "Opposite of defeat",
    },
    {
      id: "56-12",
      question: "To keep someone or something safe.",
      scrambledAnswer: "tcteorp",
      unscrambledAnswer: "protect",
      gradeLevel: "5-6",
      hint: "Starts with p",
    },
    {
      id: "56-13",
      question: "Having to do with electricity.",
      scrambledAnswer: "elitrcce",
      unscrambledAnswer: "electric",
      gradeLevel: "5-6",
      hint: "Describes wires and circuits",
    },
    {
      id: "56-14",
      question: "A math statement showing two values are equal.",
      scrambledAnswer: "etqonaui",
      unscrambledAnswer: "equation",
      gradeLevel: "5-6",
      hint: "Has an equals sign",
    },
    {
      id: "56-15",
      question: "The line where the sky seems to meet the land or sea.",
      scrambledAnswer: "hoirzon",
      unscrambledAnswer: "horizon",
      gradeLevel: "5-6",
      hint: "You see the sun set here",
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
