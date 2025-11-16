import {
  TreasureHuntGameState,
  GradeLevel,
  GameResult,
  GameMode,
  GAME_CONFIG,
  GRAMMAR_QUESTIONS_BANK,
  getRandomGrammarQuestions,
  QuestionProgress,
  GrammarQuestion,
  PlayerProgress,
  QuestionResult,
} from "@/app/constants/index_treasurehunt";

// Generate unique game ID
const generateGameId = (): string => {
  return `th_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Generate unique player ID
const generatePlayerId = (): string => {
  const timestamp = Date.now();
  const random1 = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 15);

  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return `player_${timestamp}_${window.crypto.randomUUID()}`;
  }

  return `player_${timestamp}_${random1}${random2}`;
};

// Points calculation
export const calculateQuestionPoints = (
  timeInSeconds: number,
  mistakes: number,
  targetTime: number,
  basePoints: number = GAME_CONFIG.BASE_POINTS
): number => {
  // Speed bonus: earn points for being faster than target
  const timeDiff = targetTime - timeInSeconds;
  const speedBonus =
    timeDiff > 0
      ? Math.round(timeDiff * GAME_CONFIG.SPEED_BONUS_MULTIPLIER)
      : 0;

  // Mistake penalty
  const mistakePenalty = mistakes * GAME_CONFIG.MISTAKE_PENALTY;

  // Calculate total (minimum 0)
  const totalPoints = Math.max(0, basePoints + speedBonus - mistakePenalty);

  return totalPoints;
};

export const calculateGameScore = (
  questionResults: QuestionResult[],
  hadPerfectGame: boolean,
  startTime: number,
  endTime: number,
  targetTimePerQuestion: number,
  totalQuestions: number
): number => {
  const baseScore = questionResults.reduce((total, q) => total + q.points, 0);
  const perfectBonus = hadPerfectGame ? GAME_CONFIG.PERFECT_BONUS : 0;

  // Speed bonus: reward finishing FASTER than target time
  const actualTime = (endTime - startTime) / 1000; // in seconds
  const expectedTime = targetTimePerQuestion * totalQuestions;
  const timeSaved = expectedTime - actualTime;

  // Only give bonus if finished faster than expected (timeSaved > 0)
  const speedBonus =
    timeSaved > 0
      ? Math.round(timeSaved * GAME_CONFIG.SPEED_BONUS_MULTIPLIER)
      : 0;

  return baseScore + perfectBonus + speedBonus;
};

// CPU opponent simulation (for solo mode)
export const simulateCPUAnswer = (
  question: GrammarQuestion,
  opponent: PlayerProgress,
  difficulty: keyof typeof GAME_CONFIG.CPU_DIFFICULTY = "medium"
): { timeSpent: number; mistakes: number; correct: boolean } => {
  const config = GAME_CONFIG.CPU_DIFFICULTY[difficulty];
  const timeSpent = opponent.questionStartTime
    ? (Date.now() - opponent.questionStartTime) / 1000
    : GAME_CONFIG.TARGET_TIMES[question.gradeLevel] * config.speedMultiplier;
  const willMakeMistake = Math.random() < config.mistakeRate;
  const mistakes = willMakeMistake ? Math.floor(Math.random() * 2) + 1 : 0;

  return {
    timeSpent: Math.round(timeSpent * 10) / 10,
    mistakes,
    correct: true, // CPU always gets it eventually
  };
};

// Update CPU progress (similar to TypeQuest)
export const updateCPUProgress = (
  currentGameState: TreasureHuntGameState,
  difficulty: keyof typeof GAME_CONFIG.CPU_DIFFICULTY = "medium"
): TreasureHuntGameState => {
  if (!currentGameState.opponent || currentGameState.opponent.isFinished) {
    return currentGameState;
  }

  // If player finished, snapshot opponent and stop
  if (currentGameState.currentPlayer.isFinished) {
    return {
      ...currentGameState,
      opponent: {
        ...currentGameState.opponent,
        isFinished: true,
      },
    };
  }

  const currentQuestion =
    currentGameState.questions[currentGameState.opponent.currentQuestionIndex];

  if (!currentQuestion) {
    return currentGameState;
  }

  // Calculate time spent based on when CPU started this question
  const questionStartTime =
    currentGameState.opponent.questionStartTime || Date.now();
  const timeSpent = (Date.now() - questionStartTime) / 1000;

  const cpuResult = simulateCPUAnswer(
    currentQuestion,
    currentGameState.opponent,
    difficulty
  );

  // Use the actual time spent, not the simulated one
  const actualTimeSpent = Math.max(timeSpent, cpuResult.timeSpent);

  const cpuPoints = calculateQuestionPoints(
    actualTimeSpent,
    cpuResult.mistakes,
    currentGameState.targetTimePerQuestion,
    GAME_CONFIG.BASE_POINTS
  );

  // Simulate answer mistakes
  const answerMistakes: QuestionResult[] = [];
  for (let i = 0; i < cpuResult.mistakes; i++) {
    const answerMistake: QuestionResult = {
      questionId: currentQuestion.id,
      prompt: currentQuestion.incorrectSentence,
      userAnswer: Array.isArray(currentQuestion.correctSentence)
        ? currentQuestion.correctSentence[0]
        : currentQuestion.correctSentence,
      correctAnswer: currentQuestion.correctSentence,
      correct: false,
      timeSpent: actualTimeSpent + i * 0.1,
      mistakes: 1,
      points: 0,
      timestamp: Date.now(),
    };
    answerMistakes.push(answerMistake);
  }

  const cpuQuestionResult: QuestionResult = {
    questionId: currentQuestion.id,
    prompt: currentQuestion.incorrectSentence,
    userAnswer: Array.isArray(currentQuestion.correctSentence)
      ? currentQuestion.correctSentence[0]
      : currentQuestion.correctSentence,
    correctAnswer: currentQuestion.correctSentence,
    correct: true,
    timeSpent: actualTimeSpent,
    mistakes: cpuResult.mistakes,
    points: cpuPoints,
    timestamp: Date.now(),
  };

  const allQuestionResults: QuestionResult[] = [
    ...currentGameState.opponent.questionResults,
    ...answerMistakes,
    cpuQuestionResult,
  ];

  const newQuestionIndex = currentGameState.opponent.currentQuestionIndex + 1;
  const newQuestionsAnswered = currentGameState.opponent.questionsAnswered + 1;
  const isOpponentFinished =
    newQuestionsAnswered >= currentGameState.totalQuestions;

  const updatedOpponent: PlayerProgress = {
    ...currentGameState.opponent,
    currentQuestionIndex: newQuestionIndex,
    questionsAnswered: newQuestionsAnswered,
    totalPoints: currentGameState.opponent.totalPoints + cpuPoints,
    totalMistakes: currentGameState.opponent.totalMistakes + cpuResult.mistakes,
    questionResults: allQuestionResults,
    isFinished: isOpponentFinished,
    finishTime: isOpponentFinished ? Date.now() : null,
    questionStartTime: Date.now(), // Start timer for next question
  };

  const shouldEndGame =
    currentGameState.currentPlayer.isFinished && updatedOpponent.isFinished;

  return {
    ...currentGameState,
    opponent: updatedOpponent,
    status: shouldEndGame ? "finished" : "active",
    endTime: shouldEndGame ? Date.now() : null,
  };
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
  mode: GameMode,
  gradeLevel: GradeLevel,
  playerName: string,
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

  const targetTimePerQuestion = GAME_CONFIG.TARGET_TIMES[gradeLevel];

  return {
    gameId: generateGameId(),
    mode,
    gradeLevel,
    status: "setup",
    questions,
    totalQuestions: questions.length,
    startTime: null,
    endTime: null,
    targetTimePerQuestion,
    currentPlayer: {
      playerId: generatePlayerId(),
      playerName,
      currentQuestionIndex: 0,
      questionsAnswered: 0,
      totalPoints: 0,
      totalMistakes: 0,
      questionResults: [],
      isFinished: false,
      finishTime: null,
      questionStartTime: null,
      currentQuestionMistakes: 0,
    },
    opponent:
      mode === "solo"
        ? {
            playerId: "cpu",
            playerName: "CPU",
            currentQuestionIndex: 0,
            questionsAnswered: 0,
            totalPoints: 0,
            totalMistakes: 0,
            questionResults: [],
            isFinished: false,
            finishTime: null,
            questionStartTime: null,
            currentQuestionMistakes: 0,
          }
        : undefined,
    // Legacy fields for backward compatibility
    currentQuestionIndex: 0,
    score: 0,
    mistakes: 0,
    isGameFinished: false,
    questionProgress,
    answerLog: [],
  };
};

// Check if game is finished
export const isGameFinished = (gameState: TreasureHuntGameState): boolean => {
  return (
    gameState.currentPlayer.isFinished ||
    (gameState.currentQuestionIndex !== undefined &&
      gameState.currentQuestionIndex >= gameState.totalQuestions) ||
    gameState.isGameFinished === true
  );
};

// Advance to next question
export const advanceToNextQuestion = (
  gameState: TreasureHuntGameState
): TreasureHuntGameState => {
  const currentIndex = gameState.currentPlayer.currentQuestionIndex;
  const nextIndex = currentIndex + 1;
  const isFinished = nextIndex >= gameState.totalQuestions;

  return {
    ...gameState,
    currentPlayer: {
      ...gameState.currentPlayer,
      currentQuestionIndex: nextIndex,
      isFinished: isFinished,
      finishTime: isFinished ? Date.now() : null,
    },
    // Legacy fields for backward compatibility
    currentQuestionIndex: nextIndex,
    isGameFinished: isFinished,
    endTime: isFinished ? Date.now() : null,
  };
};

// Handle correct answer
export const handleCorrectAnswer = (
  gameState: TreasureHuntGameState,
  timeSpent?: number
): TreasureHuntGameState => {
  const currentIndex = gameState.currentPlayer.currentQuestionIndex;
  const currentQuestion = gameState.questions[currentIndex];
  const questionStartTime =
    gameState.currentPlayer.questionStartTime || Date.now();
  const actualTimeSpent = timeSpent || (Date.now() - questionStartTime) / 1000;

  // Calculate points for this question
  const points = calculateQuestionPoints(
    actualTimeSpent,
    gameState.currentPlayer.currentQuestionMistakes,
    gameState.targetTimePerQuestion,
    GAME_CONFIG.BASE_POINTS
  );

  // Create question result
  const questionResult: QuestionResult = {
    questionId: currentQuestion.id,
    prompt: currentQuestion.incorrectSentence,
    userAnswer: Array.isArray(currentQuestion.correctSentence)
      ? currentQuestion.correctSentence[0]
      : currentQuestion.correctSentence,
    correctAnswer: currentQuestion.correctSentence,
    correct: true,
    timeSpent: actualTimeSpent,
    mistakes: gameState.currentPlayer.currentQuestionMistakes,
    points: points,
    timestamp: Date.now(),
  };

  // Reset question progress for current question when answered correctly
  const updatedProgress = (gameState.questionProgress || []).map((p) =>
    p.questionId === currentQuestion.id
      ? { ...p, mistakes: 0, hintShown: false, gaveUp: false }
      : p
  );

  const updated = advanceToNextQuestion({
    ...gameState,
    currentPlayer: {
      ...gameState.currentPlayer,
      questionsAnswered: gameState.currentPlayer.questionsAnswered + 1,
      totalPoints: gameState.currentPlayer.totalPoints + points,
      questionResults: [
        ...gameState.currentPlayer.questionResults,
        questionResult,
      ],
      currentQuestionMistakes: 0,
      questionStartTime: Date.now(),
    },
    // Legacy fields for backward compatibility
    score: (gameState.score || 0) + 1,
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

  const currentIndex = gameState.currentPlayer.currentQuestionIndex;
  const currentQuestion = gameState.questions[currentIndex];
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

  // Create a QuestionResult entry for this incorrect attempt so accuracy
  // counts attempts (correct / total submissions) rather than only scored answers.
  const questionStartTime =
    gameState.currentPlayer.questionStartTime || Date.now();
  const attemptTime = (Date.now() - questionStartTime) / 1000;

  const incorrectResult = {
    questionId: currentQuestion.id,
    prompt: currentQuestion.incorrectSentence,
    userAnswer: userAnswer || "",
    correctAnswer: currentQuestion.correctSentence,
    correct: false,
    timeSpent: Math.round(attemptTime * 10) / 10,
    mistakes: 1,
    points: 0,
    timestamp: Date.now(),
  } as QuestionResult;

  return {
    ...gameState,
    currentPlayer: {
      ...gameState.currentPlayer,
      currentQuestionMistakes:
        gameState.currentPlayer.currentQuestionMistakes + 1,
      totalMistakes: gameState.currentPlayer.totalMistakes + 1,
      // append the incorrect attempt to questionResults so totalAttempts increases
      questionResults: [
        ...gameState.currentPlayer.questionResults,
        incorrectResult,
      ],
    },
    // Legacy fields for backward compatibility
    mistakes: (gameState.mistakes || 0) + 1,
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

  const currentIndex = gameState.currentPlayer.currentQuestionIndex;
  const currentQuestion = gameState.questions[currentIndex];
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

  const currentIndex = gameState.currentPlayer.currentQuestionIndex;
  const currentQuestion = gameState.questions[currentIndex];
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

  // Create question result for give up (0 points)
  const questionResult: QuestionResult = {
    questionId: currentQuestion.id,
    prompt: currentQuestion.incorrectSentence,
    userAnswer: "",
    correctAnswer: currentQuestion.correctSentence,
    correct: false,
    timeSpent: gameState.currentPlayer.questionStartTime
      ? (Date.now() - gameState.currentPlayer.questionStartTime) / 1000
      : 0,
    mistakes: gameState.currentPlayer.currentQuestionMistakes,
    points: 0,
    timestamp: Date.now(),
  };

  // Advance without scoring
  const updated = advanceToNextQuestion({
    ...gameState,
    currentPlayer: {
      ...gameState.currentPlayer,
      questionsAnswered: gameState.currentPlayer.questionsAnswered + 1,
      questionResults: [
        ...gameState.currentPlayer.questionResults,
        questionResult,
      ],
      currentQuestionMistakes: 0,
      questionStartTime: Date.now(),
    },
    questionProgress: updatedProgress,
    answerLog: newAnswerLog,
  });

  return updated;
};

// Get current question progress
export const getCurrentQuestionProgress = (
  gameState: TreasureHuntGameState
): QuestionProgress | null => {
  // Safety check for undefined questionProgress
  if (!gameState.questionProgress || !gameState.questionProgress.length) {
    return null;
  }

  const currentIndex =
    gameState.currentPlayer?.currentQuestionIndex ??
    gameState.currentQuestionIndex ??
    0;
  const currentQuestion = gameState.questions?.[currentIndex];
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
  const {
    currentPlayer,
    opponent,
    startTime,
    endTime,
    gradeLevel,
    mode,
    totalQuestions,
    targetTimePerQuestion,
  } = gameState;

  // Use player's individual finish time for accurate speed bonus calculation
  const playerEndTime = currentPlayer.finishTime || endTime || Date.now();
  const totalTime = startTime ? (playerEndTime - startTime) / 1000 : 0;
  const correctAnswers = currentPlayer.questionResults.filter(
    (q) => q.correct
  ).length;

  const hadPerfectGame = currentPlayer.totalMistakes === 0;
  const finalPoints = calculateGameScore(
    currentPlayer.questionResults,
    hadPerfectGame,
    startTime!,
    playerEndTime,
    targetTimePerQuestion,
    totalQuestions
  );

  const averageTimePerQuestion =
    currentPlayer.questionsAnswered > 0
      ? currentPlayer.questionResults.reduce((sum, q) => sum + q.timeSpent, 0) /
        currentPlayer.questionsAnswered
      : 0;
  // Total attempts should count every submission (correct + incorrect attempts)
  const totalAttempts = currentPlayer.questionResults.length;

  const result: GameResult = {
    gameId: gameState.gameId,
    date: Date.now(),
    gradeLevel,
    mode,
    playerName: currentPlayer.playerName,
    startTime: startTime!,
    endTime: playerEndTime,
    totalPoints: finalPoints,
    totalQuestions,
    correctAnswers,
    totalMistakes: currentPlayer.totalMistakes,
    totalTime,
    // Use calculateAccuracy to compute correct submissions / total submissions
    accuracy: calculateAccuracy(correctAnswers, totalAttempts),
    averageTimePerQuestion: Math.round(averageTimePerQuestion * 10) / 10,
  };

  // Add opponent data for solo mode
  if (opponent && mode === "solo") {
    const opponentPerfect = opponent.totalMistakes === 0;
    const opponentEndTime = opponent.finishTime || endTime || Date.now();
    const opponentPoints = calculateGameScore(
      opponent.questionResults,
      opponentPerfect,
      startTime!,
      opponentEndTime,
      targetTimePerQuestion,
      totalQuestions
    );

    result.opponent = {
      name: opponent.playerName,
      points: opponentPoints,
    };
    result.won = finalPoints > opponentPoints;
    result.pointMargin = finalPoints - opponentPoints;
  }

  return result;
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

        // Migrate old game state structure to new structure
        if (!gameState.currentPlayer) {
          // Create currentPlayer from legacy fields
          gameState.currentPlayer = {
            playerId: generatePlayerId(),
            playerName: "Player", // Default name for old games
            currentQuestionIndex: gameState.currentQuestionIndex ?? 0,
            questionsAnswered: gameState.score ?? 0,
            totalPoints: 0, // Old games didn't have points
            totalMistakes: gameState.mistakes ?? 0,
            questionResults: [],
            isFinished: gameState.isGameFinished ?? false,
            finishTime: gameState.endTime ?? null,
            questionStartTime: null,
            currentQuestionMistakes: 0,
          };
        }

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

        // Ensure mode exists (default to solo for old games)
        if (!gameState.mode) {
          gameState.mode = "solo";
        }

        // Ensure targetTimePerQuestion exists
        if (!gameState.targetTimePerQuestion) {
          gameState.targetTimePerQuestion =
            GAME_CONFIG.TARGET_TIMES[gameState.gradeLevel];
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

// Metrics calculations
export const calculateAccuracy = (
  correctAnswers: number,
  totalAttempts: number
): number => {
  if (totalAttempts === 0) return 100;
  return Math.round((correctAnswers / totalAttempts) * 100);
};

export const calculateAverageTime = (
  totalTime: number,
  questionCount: number
): number => {
  if (questionCount === 0) return 0;
  return Math.round((totalTime / questionCount) * 10) / 10;
};
