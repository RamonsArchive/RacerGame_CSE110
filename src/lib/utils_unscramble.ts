import {
  UnscrambleGameState,
  GradeLevel,
  GameResult,
  GAME_CONFIG,
  UNSCRAMBLE_QUESTIONS_BANK,
  getRandomUnscrambleQuestions,
  QuestionProgress,
} from "@/app/constants/index_unscramble";

// Generate unique game ID
const generateGameId = (): string => {
  return `un_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Validate unscramble answer
export const validateUnscrambleWord = (
  userAnswer: string,
  correctAnswer: string
): boolean => {
  const normalize = (s: string) => s.trim().replace(/\s+/g, " ");
  return normalize(userAnswer) === normalize(correctAnswer);
};

// Initialize game state
export const initializeGame = (
  gradeLevel: GradeLevel,
  questionCount: number = GAME_CONFIG.DEFAULT_QUESTIONS
): UnscrambleGameState => {
  const questions = getRandomUnscrambleQuestions(
    gradeLevel,
    Math.min(questionCount, UNSCRAMBLE_QUESTIONS_BANK[gradeLevel].length)
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
    totalAttempts: 0, // ✅ Initialize totalAttempts
    isGameFinished: false,
    startTime: Date.now(),
    endTime: null,
    questionProgress,
    answerLog: [],
  };
};

// Check if game is finished
export const isGameFinished = (gameState: UnscrambleGameState): boolean => {
  return (
    gameState.currentQuestionIndex >= gameState.totalQuestions ||
    gameState.isGameFinished
  );
};

// Advance to next question
export const advanceToNextQuestion = (
  gameState: UnscrambleGameState
): UnscrambleGameState => {
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
  gameState: UnscrambleGameState
): UnscrambleGameState => {
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
  gameState: UnscrambleGameState,
  userAnswer?: string
): UnscrambleGameState => {
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

  const promptText = `${currentQuestion.question} [${currentQuestion.scrambledAnswer}]`;

  const newAnswerLog = existingLog
    ? [...(gameState.answerLog || [])]
    : [
        ...(gameState.answerLog || []),
        {
          questionId: currentQuestion.id,
          prompt: promptText,
          userAnswer: userAnswer || "",
          correctAnswer: currentQuestion.unscrambledAnswer,
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
  gameState: UnscrambleGameState
): UnscrambleGameState => {
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
  gameState: UnscrambleGameState
): UnscrambleGameState => {
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
  const promptText = `${currentQuestion.question} [${currentQuestion.scrambledAnswer}]`;

  // Add to answer log for give up
  const newAnswerLog = [
    ...(gameState.answerLog || []),
    {
      questionId: currentQuestion.id,
      prompt: promptText,
      userAnswer: "",
      correctAnswer: currentQuestion.unscrambledAnswer,
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
  gameState: UnscrambleGameState
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
  gameState: UnscrambleGameState
): GameResult => {
  const totalTime =
    gameState.endTime && gameState.startTime
      ? (gameState.endTime - gameState.startTime) / 1000 // Convert to seconds
      : 0;

  // ✅ Calculate accuracy: correct answers / total attempts
  const totalAttempts =
    gameState.totalAttempts || gameState.totalQuestions || 1;
  const accuracy =
    totalAttempts > 0 ? (gameState.score / totalAttempts) * 100 : 100; // Default to 100% if no attempts

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
export const saveGameState = (gameState: UnscrambleGameState): void => {
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

export const loadGameState = (): UnscrambleGameState | null => {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(GAME_CONFIG.SESSION_STORAGE_KEY);
      if (saved) {
        const gameState = JSON.parse(saved) as UnscrambleGameState;

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
