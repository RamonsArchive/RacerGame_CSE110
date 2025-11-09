import {
  TreasureHuntGameState,
  GradeLevel,
  GameResult,
  GAME_CONFIG,
  GRAMMAR_QUESTIONS_BANK,
  getRandomGrammarQuestions,
  QuestionProgress,
} from "@/app/constants/index_treasurehunt";

// Generate unique game ID
const generateGameId = (): string => {
  return `th_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get sentence parts with underline information
// This function returns an array of text segments with underline flags
export interface SentencePart {
  text: string;
  shouldUnderline: boolean;
}

export const getSentencePartsWithUnderline = (
  sentence: string,
  wordToUnderline?: string | string[]
): SentencePart[] => {
  if (!wordToUnderline) {
    return [{ text: sentence, shouldUnderline: false }];
  }

  const wordsToUnderline = Array.isArray(wordToUnderline)
    ? wordToUnderline
    : [wordToUnderline];

  // Normalize words for comparison (remove punctuation for matching, case insensitive)
  const normalizeWord = (word: string): string => {
    return word
      .toLowerCase()
      .replace(/[.,!?;:]/g, "")
      .trim();
  };

  const parts: SentencePart[] = [];
  const wordsNormalized = wordsToUnderline.map((w) => normalizeWord(w));

  // Split sentence into words and punctuation, preserving whitespace
  // Use word boundaries to properly split words from punctuation
  const regex = /(\S+|\s+)/g;
  const sentenceParts = sentence.match(regex) || [];

  sentenceParts.forEach((part) => {
    if (/^\s+$/.test(part)) {
      // Whitespace only
      parts.push({ text: part, shouldUnderline: false });
    } else {
      // Word (possibly with punctuation)
      const normalizedPart = normalizeWord(part);
      const shouldUnderline = wordsNormalized.some((w) => normalizedPart === w);
      parts.push({ text: part, shouldUnderline });
    }
  });

  return parts;
};

// Validate grammar sentence - strict matching requiring proper capitalization and punctuation
export const validateGrammarSentence = (
  userAnswer: string,
  correctSentence: string | string[]
): boolean => {
  // Helper to normalize only internal whitespace (not leading/trailing)
  const normalize = (str: string): string => {
    return str.trim().replace(/\s+/g, " ");
  };

  const answers = Array.isArray(correctSentence)
    ? correctSentence
    : [correctSentence];

  const userA = normalize(userAnswer);

  // Check for exact match with each possible correct answer
  for (const a of answers) {
    const corr = normalize(a);
    if (userA === corr) {
      return true;
    }
  }

  return false;
};

// Initialize game state
export const initializeGame = (
  gradeLevel: GradeLevel,
  questionCount: number = GAME_CONFIG.DEFAULT_QUESTIONS
): TreasureHuntGameState => {
  const questions = getRandomGrammarQuestions(
    gradeLevel,
    Math.min(questionCount, GRAMMAR_QUESTIONS_BANK[gradeLevel].length)
  );

  // Initialize question progress tracking
  const questionProgress: QuestionProgress[] = questions.map((q) => ({
    questionId: q.id,
    mistakes: 0,
    hintShown: false,
    gaveUp: false,
  }));

  return {
    gameId: generateGameId(),
    gradeLevel,
    status: "active",
    currentQuestionIndex: 0,
    questions,
    totalQuestions: questions.length,
    score: 0,
    mistakes: 0,
    isGameFinished: false,
    startTime: Date.now(),
    endTime: null,
    questionProgress,
    answerLog: [],
  };
};

// Check if game is finished
export const isGameFinished = (gameState: TreasureHuntGameState): boolean => {
  return (
    gameState.currentQuestionIndex >= gameState.totalQuestions ||
    gameState.isGameFinished
  );
};

// Advance to next question
export const advanceToNextQuestion = (
  gameState: TreasureHuntGameState
): TreasureHuntGameState => {
  const nextIndex = gameState.currentQuestionIndex + 1;
  const isFinished = nextIndex >= gameState.totalQuestions;

  return {
    ...gameState,
    currentQuestionIndex: nextIndex,
    isGameFinished: isFinished,
    endTime: isFinished ? Date.now() : null,
  };
};

// Handle correct answer
export const handleCorrectAnswer = (
  gameState: TreasureHuntGameState
): TreasureHuntGameState => {
  // Reset question progress for current question when answered correctly
  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
  const updatedProgress = gameState.questionProgress.map((p) =>
    p.questionId === currentQuestion.id
      ? { ...p, mistakes: 0, hintShown: false, gaveUp: false }
      : p
  );

  const updated = advanceToNextQuestion({
    ...gameState,
    score: gameState.score + 1,
    questionProgress: updatedProgress,
  });

  return updated;
};

// Handle incorrect answer
export const handleIncorrectAnswer = (
  gameState: TreasureHuntGameState,
  userAnswer?: string
): TreasureHuntGameState => {
  // Ensure questionProgress exists
  if (!gameState.questionProgress) {
    gameState.questionProgress = gameState.questions.map((q) => ({
      questionId: q.id,
      mistakes: 0,
      hintShown: false,
      gaveUp: false,
    }));
  }

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
  const progressIndex = gameState.questionProgress.findIndex(
    (p) => p.questionId === currentQuestion.id
  );

  // Update question progress
  const updatedProgress = [...gameState.questionProgress];
  if (progressIndex !== -1) {
    updatedProgress[progressIndex] = {
      ...updatedProgress[progressIndex],
      mistakes: updatedProgress[progressIndex].mistakes + 1,
    };
  } else {
    // Create new progress entry if not found
    updatedProgress.push({
      questionId: currentQuestion.id,
      mistakes: 1,
      hintShown: false,
      gaveUp: false,
    });
  }

  // Append to answer log once per question (first wrong attempt)
  const existingLog = gameState.answerLog?.some(
    (e) => e.questionId === currentQuestion.id
  );
  const newAnswerLog = existingLog
    ? [...(gameState.answerLog || [])]
    : [
        ...(gameState.answerLog || []),
        {
          questionId: currentQuestion.id,
          prompt: currentQuestion.incorrectSentence,
          userAnswer: userAnswer || "",
          correctAnswer: currentQuestion.correctSentence,
        },
      ];

  return {
    ...gameState,
    mistakes: gameState.mistakes + 1,
    questionProgress: updatedProgress,
    answerLog: newAnswerLog,
  };
};

// Show hint for current question
export const showHint = (
  gameState: TreasureHuntGameState
): TreasureHuntGameState => {
  // Ensure questionProgress exists
  if (!gameState.questionProgress) {
    gameState.questionProgress = gameState.questions.map((q) => ({
      questionId: q.id,
      mistakes: 0,
      hintShown: false,
      gaveUp: false,
    }));
  }

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
  const progressIndex = gameState.questionProgress.findIndex(
    (p) => p.questionId === currentQuestion.id
  );

  const updatedProgress = [...gameState.questionProgress];
  if (progressIndex !== -1) {
    updatedProgress[progressIndex] = {
      ...updatedProgress[progressIndex],
      hintShown: true,
    };
  } else {
    // Create new progress entry if not found
    updatedProgress.push({
      questionId: currentQuestion.id,
      mistakes: 0,
      hintShown: true,
      gaveUp: false,
    });
  }

  return {
    ...gameState,
    questionProgress: updatedProgress,
  };
};

// Handle give up - advance to next question without scoring
export const handleGiveUp = (
  gameState: TreasureHuntGameState
): TreasureHuntGameState => {
  // Ensure questionProgress exists
  if (!gameState.questionProgress) {
    gameState.questionProgress = gameState.questions.map((q) => ({
      questionId: q.id,
      mistakes: 0,
      hintShown: false,
      gaveUp: false,
    }));
  }

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
  const progressIndex = gameState.questionProgress.findIndex(
    (p) => p.questionId === currentQuestion.id
  );

  const updatedProgress = [...gameState.questionProgress];
  if (progressIndex !== -1) {
    updatedProgress[progressIndex] = {
      ...updatedProgress[progressIndex],
      gaveUp: true,
    };
  } else {
    // Create new progress entry if not found
    updatedProgress.push({
      questionId: currentQuestion.id,
      mistakes: 0,
      hintShown: false,
      gaveUp: true,
    });
  }

  // Add to answer log for give up
  const newAnswerLog = [
    ...(gameState.answerLog || []),
    {
      questionId: currentQuestion.id,
      prompt: currentQuestion.incorrectSentence,
      userAnswer: "",
      correctAnswer: currentQuestion.correctSentence,
      gaveUp: true,
    },
  ];

  // Advance without scoring
  const updated = advanceToNextQuestion(gameState);
  return {
    ...updated,
    questionProgress: updatedProgress,
    answerLog: newAnswerLog,
  };
};

// Get current question progress
export const getCurrentQuestionProgress = (
  gameState: TreasureHuntGameState
): QuestionProgress | null => {
  // Safety check for undefined questionProgress
  if (!gameState.questionProgress || !gameState.questionProgress.length) {
    return null;
  }

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
  if (!currentQuestion) {
    return null;
  }

  return (
    gameState.questionProgress.find(
      (p) => p.questionId === currentQuestion.id
    ) || null
  );
};

// Create game result for completion
export const createGameResult = (
  gameState: TreasureHuntGameState
): GameResult => {
  const totalTime =
    gameState.endTime && gameState.startTime
      ? (gameState.endTime - gameState.startTime) / 1000 // Convert to seconds
      : 0;

  const accuracy =
    gameState.totalQuestions > 0
      ? (gameState.score / gameState.totalQuestions) * 100
      : 0;

  return {
    gameId: gameState.gameId,
    date: gameState.endTime || Date.now(),
    gradeLevel: gameState.gradeLevel,
    totalQuestions: gameState.totalQuestions,
    score: gameState.score,
    mistakes: gameState.mistakes,
    totalTime,
    accuracy: Math.round(accuracy * 100) / 100, // Round to 2 decimal places
  };
};

// Local storage helpers
export const saveGameState = (gameState: TreasureHuntGameState): void => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        GAME_CONFIG.SESSION_STORAGE_KEY,
        JSON.stringify(gameState)
      );
    } catch (error) {
      console.error("Error saving game state:", error);
    }
  }
};

export const loadGameState = (): TreasureHuntGameState | null => {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(GAME_CONFIG.SESSION_STORAGE_KEY);
      if (saved) {
        const gameState = JSON.parse(saved) as TreasureHuntGameState;

        // Initialize questionProgress if it doesn't exist (backward compatibility)
        if (!gameState.questionProgress && gameState.questions) {
          gameState.questionProgress = gameState.questions.map((q) => ({
            questionId: q.id,
            mistakes: 0,
            hintShown: false,
            gaveUp: false,
          }));
        }
        if (!gameState.answerLog) {
          gameState.answerLog = [];
        }

        return gameState;
      }
    } catch (error) {
      console.error("Error loading game state:", error);
    }
  }
  return null;
};

export const clearGameState = (): void => {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(GAME_CONFIG.SESSION_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing game state:", error);
    }
  }
};
