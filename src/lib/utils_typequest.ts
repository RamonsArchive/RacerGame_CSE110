import { QuestionResult, Question, GameMode, GradeLevel, GameState, GameResult, GAME_CONFIG, WORD_BANK} from "@/app/constants/index_typequest";

// Points calculation
export const calculateQuestionPoints = (
    timeInSeconds: number,
    mistakes: number,
    targetTime: number,
    basePoints: number = GAME_CONFIG.BASE_POINTS
  ): number => {
    // Speed bonus: earn points for being faster than target
    const timeDiff = targetTime - timeInSeconds;
    const speedBonus = timeDiff > 0 
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
    hadPerfectGame: boolean
  ): number => {
    const baseScore = questionResults.reduce((total, q) => total + q.points, 0);
    const perfectBonus = hadPerfectGame ? GAME_CONFIG.PERFECT_BONUS : 0;
    return baseScore + perfectBonus;
  };


// Game initialization
export const initializeGame = (
    mode: GameMode,
    gradeLevel: GradeLevel,
    playerName: string,
    questionCount: number = GAME_CONFIG.DEFAULT_QUESTIONS
  ): GameState => {
    const questions = getGameQuestions(gradeLevel, questionCount);

      const questionsWithChoices = questions.map((question) => {
        return {
          ...question,
          choices: getChoices(question, gradeLevel, 4),
        };
      });
    
    return {
      gameId: generateGameId(),
      mode,
      gradeLevel,
      status: 'setup',
      questions: questionsWithChoices,
      totalQuestions: questionCount,
      startTime: null,
      endTime: null,
      targetTimePerQuestion: GAME_CONFIG.TARGET_TIMES[gradeLevel],
      currentPlayer: {
        playerId: generatePlayerId(),
        playerName,
        currentQuestionIndex: 0,
        questionsAnswered: 0,
        totalPoints: 0,
        totalMistakes: 0,
        questionResults: [],
        isFinished: false,
        questionStartTime: null,
        currentQuestionMistakes: 0,
      },
      opponent: mode === 'solo' ? {
        playerId: 'cpu',
        playerName: 'CPU',
        currentQuestionIndex: 0,
        questionsAnswered: 0,
        totalPoints: 0,
        totalMistakes: 0,
        questionResults: [],
        isFinished: false,
        questionStartTime: null,
        currentQuestionMistakes: 0,
      } : undefined,
      allowSkip: false,
    };
  };

  export const getRandomQuestions = (
    gradeLevel: GradeLevel,
    count: number,
    category?: string
  ): Question[] => {
    const pool = WORD_BANK[gradeLevel].filter(q => q.category === category);
    if (pool.length === 0) {
      console.warn(`No questions available for grade ${gradeLevel}`);
      return [];
    }
    
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, pool.length));
  };

  export const getGameQuestions = (gradeLevel: GradeLevel, questionCount: number = GAME_CONFIG.DEFAULT_QUESTIONS): Question[] => {
    const pool = WORD_BANK[gradeLevel];
    if (pool.length === 0) {
      console.warn(`No questions available for grade ${gradeLevel}`);
      return [];
    }
    
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(questionCount, pool.length));
  }
  
  // Answer validation
  export const checkAnswer = (
    userAnswer: string,
    correctAnswer: string,
    caseSensitive: boolean = false
  ): boolean => {
    const userClean = userAnswer.trim();
    const correctClean = correctAnswer.trim();
    
    if (caseSensitive) {
      return userClean === correctClean;
    }
    
    return userClean.toLowerCase() === correctClean.toLowerCase();
  };
  
  // Metrics calculations
  export const calculateAccuracy = (
    correctAnswers: number,
    totalAttempts: number
  ): number => {
    if (totalAttempts === 0) return 100;
    return Math.round((correctAnswers / totalAttempts) * 100);
  };
  
  export const calculateCharactersPerSecond = (
    totalCharacters: number,
    timeInSeconds: number
  ): number => {
    if (timeInSeconds === 0) return 0;
    return Math.round((totalCharacters / timeInSeconds) * 10) / 10;
  };
  
  export const calculateAverageTime = (
    totalTime: number,
    questionCount: number
  ): number => {
    if (questionCount === 0) return 0;
    return Math.round((totalTime / questionCount) * 10) / 10;
  };
  
  // Game result creation
  export const createGameResult = (gameState: GameState): GameResult => {
    const { currentPlayer, opponent, startTime, endTime, gradeLevel, mode, totalQuestions } = gameState;
    
    const totalTime = endTime && startTime ? (endTime - startTime) / 1000 : 0;
    const correctAnswers = currentPlayer.questionResults.filter(q => q.correct).length;
    const totalCharacters = currentPlayer.questionResults.reduce(
      (sum, q) => sum + q.correctAnswer.length, 0
    );
    
    const hadPerfectGame = currentPlayer.totalMistakes === 0;
    const finalPoints = calculateGameScore(currentPlayer.questionResults, hadPerfectGame);
    
    const result: GameResult = {
      gameId: gameState.gameId,
      date: Date.now(),
      gradeLevel,
      mode,
      playerName: currentPlayer.playerName,
      totalPoints: finalPoints,
      totalQuestions,
      correctAnswers,
      totalMistakes: currentPlayer.totalMistakes,
      totalTime,
      accuracy: calculateAccuracy(correctAnswers, correctAnswers + currentPlayer.totalMistakes),
      averageTimePerQuestion: calculateAverageTime(totalTime, totalQuestions),
      charactersPerSecond: calculateCharactersPerSecond(totalCharacters, totalTime),
    };
    
    // Add opponent data for multiplayer
    if (opponent && mode === 'solo') {
      const opponentPerfect = opponent.totalMistakes === 0;
      const opponentPoints = calculateGameScore(opponent.questionResults, opponentPerfect);
      
      result.opponent = {
        name: opponent.playerName,
        points: opponentPoints,
      };
      result.won = finalPoints > opponentPoints;
      result.pointMargin = finalPoints - opponentPoints;
    }
    
    return result;
  };
  
  // Helper functions
  const generateGameId = () => `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const generatePlayerId = () => `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Session storage helpers
  export const saveGameState = (gameState: GameState): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(GAME_CONFIG.SESSION_STORAGE_KEY, JSON.stringify(gameState));
    }
  };
  
  export const loadGameState = (): GameState | null => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(GAME_CONFIG.SESSION_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  };
  
  export const clearGameState = (): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(GAME_CONFIG.SESSION_STORAGE_KEY);
    }
  };
  
  // Leaderboard helpers
  export const saveGameResult = (result: GameResult): void => {
    if (typeof window !== 'undefined') {
      const existing: GameResult[] = JSON.parse(
        localStorage.getItem(GAME_CONFIG.LEADERBOARD_KEY) || '[]'
      );
      existing.push(result);
      
      // Sort by points (descending) and keep top entries
      const sorted = existing
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, GAME_CONFIG.MAX_LEADERBOARD_ENTRIES);
      
      localStorage.setItem(GAME_CONFIG.LEADERBOARD_KEY, JSON.stringify(sorted));
    }
  };
  
  export const getLeaderboard = (
    gradeLevel?: GradeLevel,
    mode?: GameMode,
    limit: number = 10
  ): GameResult[] => {
    if (typeof window !== 'undefined') {
      let results: GameResult[] = JSON.parse(
        localStorage.getItem(GAME_CONFIG.LEADERBOARD_KEY) || '[]'
      );
      
      // Filter by grade and mode if specified
      if (gradeLevel) {
        results = results.filter(r => r.gradeLevel === gradeLevel);
      }
      if (mode) {
        results = results.filter(r => r.mode === mode);
      }
      
      // Return top results
      return results.slice(0, limit);
    }
    return [];
  };
  
  export const clearLeaderboard = (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GAME_CONFIG.LEADERBOARD_KEY);
    }
  };
  
  // CPU opponent simulation (for solo mode)
  export const simulateCPUAnswer = (
    question: Question,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): { timeSpent: number; mistakes: number; correct: boolean } => {
    const config = GAME_CONFIG.CPU_DIFFICULTY[difficulty];
    const baseTime = question.correctAnswer.length * 0.3; // ~0.3s per character
    
    const timeSpent = baseTime / config.speedMultiplier;
    const willMakeMistake = Math.random() < config.mistakeRate;
    const mistakes = willMakeMistake ? Math.floor(Math.random() * 2) + 1 : 0;
    
    return {
      timeSpent: Math.round(timeSpent * 10) / 10,
      mistakes,
      correct: true, // CPU always gets it eventually
    };
  };

export const getProgressPercentage = (current: number, total: number): number => {
  return Math.round((current / total) * 100);
}

export const getChoices = (
  currentQuestion: Question | null,
  gradeLevel: GradeLevel,
  choiceCount: number = 4 // Changed from questionCount for clarity
): string[] => {
  if (!currentQuestion) return [];
  
  const category = currentQuestion.category;
  const pool = WORD_BANK[gradeLevel].filter(q => q.category === category);
  
  // Start with the correct answer
  const uniqueChoices = new Set<string>([currentQuestion.correctAnswer]);
  
  // Keep trying until we have enough unique choices
  const maxAttempts = pool.length * 2; // Prevent infinite loop
  let attempts = 0;
  
  while (uniqueChoices.size < choiceCount && attempts < maxAttempts) {
    // Get random questions from pool
    const randomQuestions = getRandomQuestions(
      gradeLevel, 
      choiceCount - uniqueChoices.size + 2, // Get extras in case of duplicates
      category
    );
    
    // Add their answers to the set (automatically handles duplicates)
    randomQuestions.forEach(q => {
      // Don't add the current question's answer again or same question
      if (q.id !== currentQuestion.id) {
        uniqueChoices.add(q.correctAnswer);
      }
    });
    
    attempts++;
  }
  
  // Convert Set to Array and shuffle
  const choicesArray = Array.from(uniqueChoices).slice(0, choiceCount);
  
  // If we still don't have enough choices, log a warning
  if (choicesArray.length < choiceCount) {
    console.warn(
      `Only ${choicesArray.length} unique choices available for question "${currentQuestion.prompt}"`
    );
  }
  
  console.log('Final choices:', choicesArray);
  return shuffle(choicesArray);
};


export const shuffle = (array: string[]): string[] => {
  return array.sort(() => Math.random() - 0.5);
}

// Helper to get all grade levels for UI
export const getAllGradeLevels = (): GradeLevel[] => {
    return ['K', '1-2', '3-4', '5-6'];
  };
  
  // Helper to check if a grade level exists
  export const isValidGradeLevel = (level: string): level is GradeLevel => {
    return ['K', '1-2', '3-4', '5-6'].includes(level);
  };
  