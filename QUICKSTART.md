# 🚀 Quick Start: Test Multiplayer in 5 Minutes

## ✅ What's Built So Far

- **Lobby system**: Join/leave with Redis
- **Player discovery**: See who's online in real-time
- **Match requests**: Click Connect → they Accept/Decline
- **Full flow**: Both games start when match accepted

---

## 🔥 5-Minute Setup

### 1. Get Redis (2 min)

1. Go to [https://upstash.com/](https://upstash.com/)
2. Sign up (free, use GitHub)
3. Create database → Copy `.env` tab

### 2. Create `.env.local` (30 sec)

In your project root, create `.env.local` and paste:

```bash
UPSTASH_REDIS_REST_URL="https://xxxxxxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AxxxxxxxxxxxYZ"
```

### 3. Install & Run (1 min)

```bash
npm install
npm run dev
```

### 4. Test with Two Windows (2 min)

1. **Window 1**: `http://localhost:3000/typequest`

   - Name: Alice | Grade: K | Mode: Multiplayer → Start Game

2. **Window 2**: `http://localhost:3000/typequest`

   - Name: Bob | Grade: K | Mode: Multiplayer → Start Game

3. **In Window 1**: You'll see "Bob" appear → Click **Connect**

4. **In Window 2**: Yellow popup appears: "Alice wants to play!" → Click **Accept**

5. **Both games start!** 🎉

---

## 🐛 Troubleshooting

### "Cannot find module @upstash/redis"

```bash
npm install @upstash/redis
```

### "Failed to connect to lobby"

- Check `.env.local` exists with correct values
- Restart dev server: `Ctrl+C` then `npm run dev`

### Players don't see each other

- Open browser console (F12) → check for errors
- Make sure both selected same grade level
- Refresh both pages

---

## ✅ What Works Now

- [x] Join lobby
- [x] See other players
- [x] Send match request
- [x] Receive & accept/reject request
- [x] Both games start when accepted
- [x] Leave lobby properly
- [x] Players expire after 90s (auto-cleanup)

---

## 🎮 Next: Game State Syncing

Once both players are in-game, you'll need to sync:

- Player positions (car progress)
- Typed text / words completed
- Race finish times
- Live leaderboard updates

**Two Options:**

1. **Redis Polling** (easier): Store game state in Redis, poll every 100ms
2. **WebRTC** (better): Direct P2P connection for real-time sync

I can help implement either once you confirm multiplayer lobby works!

---

## 📦 Deploy to Vercel

Test from different devices:

```bash
vercel --prod
```

Then add env vars in Vercel dashboard:

- Settings → Environment Variables
- Add both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Redeploy

Now you can test from your laptop + phone! 📱💻

---

## 💡 Current Flow

```
Player A                          Player B
   |                                 |
   | Join lobby (POST /api/lobby)    |
   |─────────────────────────────────|
   |                                 | Join lobby
   |                                 |
   | Poll players (GET /api/lobby)   | Poll players
   |◄───sees B───────────────sees A──|
   |                                 |
   | Click "Connect"                 |
   | (POST /api/match)               |
   |─────────────────────────────────|
   |                                 | Sees "A wants to play!"
   |                                 | Click "Accept"
   |                                 | (PATCH /api/match)
   |                                 |
   | Poll detects "accepted"         |
   | → START GAME                    | → START GAME
```

---

Ready to test? Follow the 5-minute setup above! 🚀
