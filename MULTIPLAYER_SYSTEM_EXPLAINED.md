# 🎮 Multiplayer System - Complete Explanation

## Overview

Your multiplayer system uses **Redis as a central coordination server** with **event-based polling** to sync game state between two players. Here's how everything works together.

---

## 🏗️ Architecture

```
Player A Browser          Redis Server          Player B Browser
─────────────────        ──────────────        ─────────────────
     Lobby                   Lobby                   Lobby
       ↓                       ↓                       ↓
   Match Request  ────────> Redis ────────> Match Accept
       ↓                       ↓                       ↓
   Game Room      <──────── Redis ────────> Game Room
  (fetch shared            (store                (fetch shared
   questions)            questions)              questions)
       ↓                       ↓                       ↓
   Push Progress  ────────> Redis <──────── Push Progress
       ↓                       ↓                       ↓
   Poll Opponent  <──────── Redis ────────> Poll Opponent
     Progress                                   Progress
```

---

## 📁 API Routes Created

### 1. `/api/game/route.ts` - Game Room Management

**Purpose**: Creates and manages game rooms with shared questions

#### POST - Create Game Room

```typescript
Body: {
  matchId: string,        // Unique room ID (reuses matchId)
  player1Id: string,
  player1Name: string,
  player2Id: string,
  player2Name: string,
  gradeLevel: string,
  questions: string       // JSON stringified questions
}

Returns: {
  ok: true,
  roomId: string,
  questions: Question[],
  message: "Game room created"
}
```

**What it does:**

- Stores game room in Redis with shared questions
- Both players fetch from this to get the SAME questions
- Expires after 1 hour

#### GET - Fetch Game Room

```typescript
Query: ?roomId=xxx

Returns: {
  ok: true,
  gameRoom: {
    roomId, player1Id, player1Name, player2Id, player2Name,
    gradeLevel, questions, createdAt, status
  }
}
```

**What it does:**

- Returns the game room details
- Used when second player joins to get shared questions

---

### 2. `/api/game/progress/route.ts` - Real-time Progress Updates

**Purpose**: Sync player progress in real-time

#### POST - Push Your Progress

```typescript
Body: {
  roomId: string,
  playerId: string,
  playerName: string,
  progress: {
    currentQuestionIndex: number,
    questionsAnswered: number,
    totalPoints: number,
    totalMistakes: number,
    isFinished: boolean,
    finishTime: number | null
  }
}

Returns: {
  ok: true,
  message: "Progress updated"
}
```

**What it does:**

- Stores YOUR progress in Redis
- Called EVERY TIME you answer correctly
- Your opponent polls this to see your progress

#### GET - Fetch Opponent's Progress

```typescript
Query: ?roomId=xxx&playerId=yyy

Returns: {
  ok: true,
  opponentProgress: {
    playerId, playerName,
    currentQuestionIndex,
    questionsAnswered,
    totalPoints,
    totalMistakes,
    isFinished,
    finishTime,
    lastUpdate
  }
}
```

**What it does:**

- Returns opponent's latest progress
- Polled every 1 second by your game
- Updates opponent's car position and score

---

## 🔄 Complete Flow Explained

### Phase 1: Match Acceptance

```typescript
// Player A clicks "Connect" on Player B
handleConnect(opponentId, opponentName) {
  // Create match request in Redis
  POST /api/match → { matchId, requesterId, targetId, status: "pending" }

  // Start polling for acceptance
  waitForMatchAcceptance(matchId, opponentId, opponentName)
}

// Player B sees request and clicks "Accept"
handleAcceptMatch() {
  // Update match status to "accepted"
  PATCH /api/match → { matchId, status: "accepted" }

  // Start game initialization
  initializeGameMultiplayer(...)
}

// Player A's poll detects acceptance
waitForMatchAcceptance() {
  // Every 1 second: GET /api/match?matchId=xxx
  if (status === "accepted") {
    // Start game initialization
    initializeGameMultiplayer(...)
  }
}
```

**Key Point:** Both browsers detect the match is accepted and BOTH call `initializeGameMultiplayer` independently.

---

### Phase 2: Game Initialization (Shared Questions)

```typescript
// In utils_typequest.ts
async initializeGameMultiplayer(
  matchId, myPlayerId, myPlayerName,
  opponentPlayerId, opponentPlayerName, gradeLevel
) {
  // 1. Try to fetch existing game room
  const fetchRes = await fetch(`/api/game?roomId=${matchId}`)

  if (fetchRes.ok && fetchRes.gameRoom) {
    // Game room exists! Use those questions
    questions = JSON.parse(fetchRes.gameRoom.questions)
  } else {
    // Create new game room with questions
    questions = getGameQuestions(gradeLevel, 10)

    await fetch("/api/game", {
      method: "POST",
      body: { matchId, player1Id, player2Id, gradeLevel, questions }
    })
  }

  // 2. Return game state with shared questions
  return {
    gameId: matchId,
    mode: "multiplayer",
    questions,  // ✅ SAME for both players!
    currentPlayer: { /* my data */ },
    opponent: { /* opponent data */ }
  }
}
```

**How Shared Questions Work:**

1. **First player** (Player A) calls `initializeGameMultiplayer`
   - GET `/api/game` → 404 (doesn't exist yet)
   - Generates 10 random questions
   - POST `/api/game` → stores in Redis
2. **Second player** (Player B) calls `initializeGameMultiplayer`
   - GET `/api/game` → 200 (found it!)
   - Parses questions from Redis
   - Uses SAME questions as Player A

**Result:** Both players get identical questions! 🎯

---

### Phase 3: Active Game (Real-time Sync)

#### When YOU Answer Correctly:

```typescript
// In page.tsx - handleAnswerSubmit()
if (isCorrect) {
  // 1. Update local state
  setGameState(updatedGameState);

  // 2. Push progress to Redis
  if (gameState.mode === "multiplayer") {
    fetch("/api/game/progress", {
      method: "POST",
      body: {
        roomId: gameState.gameId,
        playerId: currentPlayer.playerId,
        progress: {
          currentQuestionIndex: 5,
          questionsAnswered: 5,
          totalPoints: 250,
          isFinished: false,
        },
      },
    });
  }
}
```

**What happens:**

- Your progress is immediately saved to Redis
- Opponent's next poll (1 second max) will see your update

---

#### Polling Opponent's Progress:

```typescript
// In page.tsx - useEffect polling hook
useEffect(() => {
  if (gameState.mode !== "multiplayer" || gameStatus !== "active") {
    return; // Only poll during multiplayer active game
  }

  const pollOpponentProgress = async () => {
    // Fetch opponent's latest progress
    const res = await fetch(
      `/api/game/progress?roomId=${gameId}&playerId=${myPlayerId}`
    );
    const data = await res.json();

    if (data.ok && data.opponentProgress) {
      // Update opponent state in your game
      setGameState((prevState) => ({
        ...prevState,
        opponent: {
          currentQuestionIndex: opponentProgress.currentQuestionIndex,
          questionsAnswered: opponentProgress.questionsAnswered,
          totalPoints: opponentProgress.totalPoints,
          isFinished: opponentProgress.isFinished,
        },
      }));
    }
  };

  // Poll every 1 second
  const interval = setInterval(pollOpponentProgress, 1000);

  return () => clearInterval(interval); // Cleanup
}, [gameState?.mode, gameStatus, gameState?.gameId]);
```

**What you see:**

- Every 1 second, you fetch opponent's progress from Redis
- Opponent's car position updates
- Opponent's score updates
- When opponent finishes, you see it

---

## 🎯 Key Concepts Explained

### 1. "Event-Based Polling"

**What does this mean?**

- Not truly "event-based" (would need WebSockets)
- It's **polling** (checking every 1 second)
- But we only update when **events occur** (correct answers)

```
Player A                    Redis                    Player B
───────                    ─────                    ───────
Answer Q1 ──────────────> Store progress
                             ↓
                          (waiting)
                             ↓
                          Poll ◄───────────────── Check every 1s
                          Return progress ──────> Update opponent
```

---

### 2. "Both Games Run Independently"

```
Player A's Browser            Player B's Browser
──────────────────           ──────────────────
Local React State            Local React State
├─ currentPlayer: {          ├─ currentPlayer: {
│    questionsAnswered: 5    │    questionsAnswered: 3
│    totalPoints: 250        │    totalPoints: 180
│  }                         │  }
├─ opponent: {               ├─ opponent: {
│    questionsAnswered: 3 ◄──┼────(from polling)
│    totalPoints: 180        │    questionsAnswered: 5 ◄──(from polling)
│  }                         │    totalPoints: 250
└─ questions: [Q1, Q2...]    └─ questions: [Q1, Q2...]
              ↑                              ↑
              └──────── SAME from Redis ─────┘
```

**Each browser:**

- Runs its OWN game loop
- Tracks its OWN progress locally
- Pushes updates to Redis
- Polls Redis for opponent's updates

---

### 3. "How Do They Stay Synced?"

**Answer: Redis + Polling**

```
Timeline:
─────────────────────────────────────────────────────────

0s:   Both players accept match
      └─> Both call initializeGameMultiplayer
      └─> Both fetch same questions from Redis ✅

2s:   Player A answers Q1 correctly
      └─> Updates local state (questionsAnswered: 1)
      └─> Pushes progress to Redis

3s:   Player B's poll runs (every 1s)
      └─> Fetches Player A's progress
      └─> Updates opponent state in Player B's game
      └─> Player B sees Player A's car move forward! 🚗

5s:   Player B answers Q1 correctly
      └─> Updates local state (questionsAnswered: 1)
      └─> Pushes progress to Redis

6s:   Player A's poll runs
      └─> Fetches Player B's progress
      └─> Player A sees Player B catch up! 🏁
```

---

## 🚀 What Happens When Game Starts

### Player A (Clicks "Connect"):

1. ✅ POST `/api/match` → creates match request
2. ⏳ Polls `/api/match` every 1s → waiting for acceptance
3. ✅ Detects `status: "accepted"`
4. 🎮 Calls `initializeGameMultiplayer`
5. 📝 POST `/api/game` → creates game room with questions
6. ▶️ Sets `gameStatus = "active"` → shows game screen
7. 🔄 Starts polling opponent progress every 1s

### Player B (Receives request, clicks "Accept"):

1. ✅ PATCH `/api/match` → sets `status: "accepted"`
2. 🎮 Calls `initializeGameMultiplayer`
3. 📝 GET `/api/game` → fetches existing game room with questions
4. ▶️ Sets `gameStatus = "active"` → shows game screen
5. 🔄 Starts polling opponent progress every 1s

**Both players now have:**

- ✅ Same 10 questions
- ✅ Local game state
- ✅ Opponent polling active
- ✅ Progress pushing on correct answers

---

## 📊 Data Flow Summary

### When YOU Type Correctly:

```
Your Browser                          Redis                          Opponent's Browser
────────────                          ─────                          ──────────────────
1. Answer "cat" correctly
2. Update local state:
   questionsAnswered: 5 ──────────────────────────────┐
   totalPoints: 250                                    │
3. See your car move forward locally                   │
                                                       ↓
                                    Store progress:
                                    tq:progress:roomId:yourId
                                    { questionsAnswered: 5,
                                      totalPoints: 250 }
                                                       ↓
                                    (waiting for poll...)
                                                       ↓
                                    Poll every 1s ◄────┤
                                    Return progress ───┤
                                                       ↓
                                              1. Receive progress
                                              2. Update opponent state
                                              3. See your car move! 🚗
```

---

## ❓ FAQs

### Q: Do both games start at the exact same time?

**A:** Almost! There's a 1-2 second difference depending on network speed, but both start within seconds of match acceptance.

### Q: Can they see each other's answers?

**A:** No! Only progress is synced (questions answered, points, position). Individual answers stay local.

### Q: What if one player refreshes the page?

**A:** They lose their game state (localStorage only). The other player's polling will stop receiving updates. You'd need to add reconnection logic.

### Q: How fast are updates?

**A:** 1 second max delay (polling interval). When you answer, opponent sees it within 1 second.

### Q: Can more than 2 players join?

**A:** Current system is 1v1 only. You'd need to modify the game room structure and UI for more players.

### Q: What happens when game ends?

**A:** Both players' `isFinished` flags are set. Both browsers detect this and show the finish screen independently.

---

## 🎯 Testing the System

### 1. Test Shared Questions:

```bash
# Open browser console in both windows
# When game starts, check:
console.log(gameState.questions)
# Both should log IDENTICAL question arrays
```

### 2. Test Progress Sync:

```bash
# Player A: Answer 3 questions
# Player B: Check console every second
# You should see opponent's questionsAnswered increase
```

### 3. Test Redis Data:

```bash
# Go to Upstash dashboard > Data Browser
# Look for keys:
tq:gameroom:matchId_here        # Game room with questions
tq:progress:matchId:player1Id   # Player 1's progress
tq:progress:matchId:player2Id   # Player 2's progress
```

---

## 🔧 Troubleshooting

| Problem               | Solution                                                      |
| --------------------- | ------------------------------------------------------------- |
| Different questions   | Check Redis - game room created twice?                        |
| Opponent not updating | Check polling interval, verify Redis progress keys exist      |
| Game won't start      | Check browser console for fetch errors, verify .env.local     |
| Progress not syncing  | Verify `gameState.mode === "multiplayer"` and `gameId` is set |

---

## 🚀 Next Steps (Optional Improvements)

1. **WebRTC for real-time sync** (0ms delay instead of 1s)
2. **Reconnection logic** (handle page refreshes)
3. **Spectator mode** (let others watch races)
4. **Game history** (save completed matches)
5. **Rankings/leaderboard** (track wins/losses)

---

You now have a fully functional multiplayer typing game! 🎮🔥
