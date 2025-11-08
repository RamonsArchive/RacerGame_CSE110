import { QuestionResult, Question, GameMode, GradeLevel, GameState, GameResult, GAME_CONFIG, WORD_BANK, PlayerProgress} from "@/app/constants/index_typequest";

// Points calculation
export const calculateQuestionPoints = (
    timeInSeconds: number,
    mistakes: number,
    targetTime: number,
    basePoints: number = GAME_CONFIG.BASE_POINTS,
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
    hadPerfectGame: boolean,
    startTime: number,
    endTime: number,
    targetTimePerQuestion: number,
    totalQuestions: number
  ): number => {
    const baseScore = questionResults.reduce((total, q) => total + q.points, 0);
    const perfectBonus = hadPerfectGame ? GAME_CONFIG.PERFECT_BONUS : 0;
    
    // ✅ Speed bonus: reward finishing FASTER than target time
    const actualTime = (endTime - startTime) / 1000; // in seconds
    const expectedTime = targetTimePerQuestion * totalQuestions;
    const timeSaved = expectedTime - actualTime;
    
    // Only give bonus if finished faster than expected (timeSaved > 0)
    const speedBonus = timeSaved > 0 
      ? Math.round(timeSaved * GAME_CONFIG.SPEED_BONUS_MULTIPLIER)
      : 0;
    
    return baseScore + perfectBonus + speedBonus;
  };


/**
 * Initialize multiplayer game - creates or fetches shared game room
 * Returns game state with shared questions for both players
 */
export const initializeGameMultiplayer = async (
  matchId: string,
  myPlayerId: string,
  myPlayerName: string,
  opponentPlayerId: string,
  opponentPlayerName: string,
  gradeLevel: GradeLevel,
  questionCount: number = GAME_CONFIG.DEFAULT_QUESTIONS
): Promise<GameState | null> => {
  try {
    // Try to fetch existing game room first
    const fetchRes = await fetch(`/api/game?roomId=${matchId}`);
    const fetchData = await fetchRes.json();

    let questions: Question[];
    let roomId = matchId;

    if (fetchData.ok && fetchData.gameRoom) {
      // Game room already exists, use those questions
      
      // ✅ Safe parsing: check if questions is string or already parsed
      const rawQuestions = fetchData.gameRoom.questions;
      if (typeof rawQuestions === 'string') {
        try {
          questions = JSON.parse(rawQuestions);
        } catch (err) {
          console.error("❌ Failed to parse questions string:", err);
          questions = getGameQuestions(gradeLevel, questionCount);
        }
      } else if (Array.isArray(rawQuestions)) {
        questions = rawQuestions;
      } else {
        console.warn("⚠️ Unexpected questions format, generating new ones");
        questions = getGameQuestions(gradeLevel, questionCount);
      }
    } else {
      // Create new game room with shared questions
      questions = getGameQuestions(gradeLevel, questionCount);
      const createRes = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: matchId,  // Use matchId as roomId to ensure consistency
          player1Id: myPlayerId,
          player1Name: myPlayerName,
          player2Id: opponentPlayerId,
          player2Name: opponentPlayerName,
          gradeLevel,
          questions: JSON.stringify(questions), // Store as JSON string
        }),
      });

      if (!createRes.ok) {
        const errorText = await createRes.text();
        console.error("❌ POST request failed:", {
          status: createRes.status,
          statusText: createRes.statusText,
          body: errorText
        });
        return null;
      }

      const createData = await createRes.json();

      if (!createData.ok) {
        console.error("❌ Failed to create game room:", createData.error);
        return null;
      }
      roomId = createData.roomId;
      
      // Use the questions from the response if room already existed
      if (createData.message === "Game room already exists" && createData.questions) {
        
        // ✅ Safe parsing: check if questions is string or already parsed
        const rawQuestions = createData.questions;
        if (typeof rawQuestions === 'string') {
          try {
            questions = JSON.parse(rawQuestions);
          } catch (err) {
            console.error("❌ Failed to parse questions from POST response:", err);
            // Keep the questions we already generated
          }
        } else if (Array.isArray(rawQuestions)) {
          questions = rawQuestions;
        }
      }
    }

    // ✅ Push initial player state to Redis (so opponent sees 0s immediately)
    // This also OVERWRITES any old progress from previous games with the same matchId
    try {
      await fetch("/api/game/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: matchId,
          playerId: myPlayerId,
          playerName: myPlayerName,
          progress: {
            currentQuestionIndex: 0,
            questionsAnswered: 0,
            totalPoints: 0,
            totalMistakes: 0,
            isFinished: false,
            finishTime: null,
            questionResults: [],
            isActive: true, // ✅ Player is active at game start
          },
        }),
      });
    } catch (err) {
      console.error("⚠️ Failed to push initial state:", err);
      // Don't fail the game initialization if this fails
    }
    
    // ✅ Also push initial state for opponent (as null/inactive) to clear old data
    // This prevents Player B from seeing Player A's old progress before Player A starts
    try {
      await fetch("/api/game/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: matchId,
          playerId: opponentPlayerId,
          playerName: opponentPlayerName,
          progress: {
            currentQuestionIndex: 0,
            questionsAnswered: 0,
            totalPoints: 0,
            totalMistakes: 0,
            isFinished: false,
            finishTime: null,
            questionResults: [],
            isActive: true, // ✅ Set opponent as active initially (they're joining the game)
          },
        }),
      });
    } catch (err) {
      console.error("⚠️ Failed to pre-initialize opponent state:", err);
    }

    // Build game state with shared questions
    return {
      gameId: roomId,
      mode: "multiplayer",
      gradeLevel,
      status: "active",
      questions,
      totalQuestions: questionCount,
      startTime: Date.now(),
      endTime: null,
      targetTimePerQuestion: GAME_CONFIG.TARGET_TIMES[gradeLevel],
      currentPlayer: {
        playerId: myPlayerId,
        playerName: myPlayerName,
        currentQuestionIndex: 0,
        questionsAnswered: 0,
        totalPoints: 0,
        totalMistakes: 0,
        questionResults: [],
        isFinished: false,
        finishTime: null,
        questionStartTime: Date.now(),
        currentQuestionMistakes: 0,
      },
      opponent: {
        playerId: opponentPlayerId,
        playerName: opponentPlayerName,
        currentQuestionIndex: 0,
        questionsAnswered: 0,
        totalPoints: 0,
        totalMistakes: 0,
        questionResults: [],
        isFinished: false,
        finishTime: null,
        questionStartTime: Date.now(),
        currentQuestionMistakes: 0,
      },
      allowSkip: false,
    };
  } catch (err: any) {
    console.error("❌ Failed to initialize multiplayer game:", {
      error: err,
      message: err?.message,
      stack: err?.stack
    });
    return null;
  }
};




// Game initialization
export const initializeGame = (
    mode: GameMode,
    gradeLevel: GradeLevel,
    playerName: string,
    questionCount: number = GAME_CONFIG.DEFAULT_QUESTIONS
  ): GameState => {
    const questions = getGameQuestions(gradeLevel, questionCount);
    
    return {
      gameId: generateGameId(),
      mode,
      gradeLevel,
      status: 'setup',
      questions: questions,
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
        finishTime: null,
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
        finishTime: null,
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
    
    if (!pool || pool.length === 0) {
      console.error("❌ No questions available for grade", gradeLevel);
      return [];
    }
    
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questionCount, pool.length));
    return selected;
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
  
 // Game result creation - MUST call saveGameResult!
export const createGameResult = (gameState: GameState): GameResult => {
  const { currentPlayer, opponent, startTime, endTime, gradeLevel, mode, totalQuestions, targetTimePerQuestion } = gameState;
  
  // ✅ Use player's individual finish time for accurate speed bonus calculation
  const playerEndTime = currentPlayer.finishTime || endTime || Date.now();
  const totalTime = startTime ? (playerEndTime - startTime) / 1000 : 0;
  const correctAnswers = currentPlayer.questionResults.filter(q => q.correct).length;
  const totalCharacters = currentPlayer.questionResults.reduce(
    (sum, q) => sum + q.correctAnswer.length, 0
  );
  
  const hadPerfectGame = currentPlayer.totalMistakes === 0;
  const finalPoints = calculateGameScore(
    currentPlayer.questionResults, 
    hadPerfectGame, 
    startTime!, 
    playerEndTime, 
    targetTimePerQuestion, 
    totalQuestions
  );
  
  // ✅ For multiplayer, append playerId to gameId to ensure uniqueness in leaderboard
  // (Both players will have different gameIds even though they share the same matchId)
  const uniqueGameId = mode === "multiplayer" && currentPlayer.playerId
    ? `${gameState.gameId}_${currentPlayer.playerId}`
    : gameState.gameId;
  
  const result: GameResult = {
    gameId: uniqueGameId,
    date: Date.now(),
    gradeLevel,
    mode,
    playerName: currentPlayer.playerName,
    startTime: gameState.startTime!,
    endTime: playerEndTime, // ✅ Use individual finish time
    totalPoints: finalPoints,
    totalQuestions,
    correctAnswers,
    totalMistakes: currentPlayer.totalMistakes,
    totalTime,
    accuracy: calculateAccuracy(correctAnswers, correctAnswers + currentPlayer.totalMistakes),
    averageTimePerQuestion: calculateAverageTime(totalTime, currentPlayer.questionsAnswered),
    charactersPerSecond: calculateCharactersPerSecond(totalCharacters, totalTime),
  };
  
  // Add opponent data for solo mode
  if (opponent && mode === 'solo') {
    const opponentPerfect = opponent.totalMistakes === 0;
    const opponentEndTime = opponent.finishTime || endTime || Date.now();
    const opponentPoints = calculateGameScore(
      opponent.questionResults, 
      opponentPerfect, 
      startTime!, 
      opponentEndTime, // ✅ Use opponent's individual finish time
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
  
  // ✅ CRITICAL: Save to localStorage here!

  if (mode === "multiplayer") {
    saveGameResultMultiplayer(result);
  } else {
    saveGameResult(result);
  } 
  
  return result;
};

  export const getGameResults = (gameId: string): GameResult | null => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(GAME_CONFIG.LEADERBOARD_KEY);
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  };
  
  // Helper functions
  const generateGameId = (): string => {
    const timestamp = Date.now();
    const random1 = Math.random().toString(36).substring(2, 15);
    const random2 = Math.random().toString(36).substring(2, 15);
    const random3 = Math.random().toString(36).substring(2, 15);
    
    // Use crypto.randomUUID if available (modern browsers)
    if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
      return `game_${timestamp}_${window.crypto.randomUUID()}`;
    }
    
    return `game_${timestamp}_${random1}${random2}${random3}`;
  };
  
  const generatePlayerId = (): string => {
    const timestamp = Date.now();
    const random1 = Math.random().toString(36).substring(2, 15);
    const random2 = Math.random().toString(36).substring(2, 15);
    
    if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
      return `player_${timestamp}_${window.crypto.randomUUID()}`;
    }
    
    return `player_${timestamp}_${random1}${random2}`;
  };
  
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

  /**
   * Save multiplayer game result to Redis leaderboard
   */
  export const saveGameResultMultiplayer = async (result: GameResult): Promise<boolean> => {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result),
        });
        
        const data = await res.json();
        
        if (data.ok) {
          return true;
        } else {
          console.error("❌ Failed to save to leaderboard:", data.error);
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error("❌ Failed to save game result to leaderboard:", error);
      return false;
    }
  };

  /**
   * Fetch leaderboard from Redis (multiplayer) or localStorage (solo)
   */
  export const getLeaderboardMultiplayer = async (
    mode: GameMode,
    gradeLevel: GradeLevel,
    limit: number = 10
  ): Promise<GameResult[]> => {
    try {
      const res = await fetch(
        `/api/leaderboard?mode=${mode}&gradeLevel=${gradeLevel}&limit=${limit}`
      );
      
      const data = await res.json();
      
      if (data.ok) {
        return data.leaderboard || [];
      } else {
        console.error("❌ Failed to fetch leaderboard:", data.error);
        return [];
      }
    } catch (error) {
      console.error("❌ Failed to fetch leaderboard:", error);
      return [];
    }
  };

  /**
   * Clear Redis leaderboard (for manual cleanup)
   */
  export const clearLeaderboardMultiplayer = async (
    mode?: GameMode,
    gradeLevel?: GradeLevel
  ): Promise<boolean> => {
    try {
      const params = new URLSearchParams();
      if (mode) params.append("mode", mode);
      if (gradeLevel) params.append("gradeLevel", gradeLevel);
      
      const res = await fetch(`/api/leaderboard?${params.toString()}`, {
        method: "DELETE",
      });
      
      const data = await res.json();
      
      if (data.ok) {
        return true;
      } else {
        console.error("❌ Failed to clear leaderboard:", data.error);
        return false;
      }
    } catch (error) {
      console.error("❌ Failed to clear leaderboard:", error);
      return false;
    }
  };
  
  export const getLeaderboard = (
    gradeLevel?: GradeLevel,
    mode?: GameMode,
    limit: number = 10
  ): GameResult[] => {
    if (typeof window !== 'undefined') {
      try {
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
      } catch (error) {
        console.error('Error loading leaderboard:', error);
        return [];
      }
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
    opponent: PlayerProgress,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): { timeSpent: number; mistakes: number; correct: boolean } => {
    const config = GAME_CONFIG.CPU_DIFFICULTY[difficulty];
    const baseTimePerChar = 0.3;
    const timeSpent = (Date.now() - opponent.questionStartTime!) / 1000;
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
  