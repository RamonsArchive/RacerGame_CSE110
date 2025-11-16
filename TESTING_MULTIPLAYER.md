# 🎮 Testing Multiplayer Lobby System

## Step 1: Set Up Redis (Upstash) - FREE ✅

### 1.1 Create Upstash Account

1. Go to [https://upstash.com/](https://upstash.com/)
2. Sign up with GitHub (easiest) or email
3. Click **"Create Database"**
4. Choose:
   - **Name**: `typequest-lobby` (or whatever you want)
   - **Type**: Redis
   - **Region**: Choose closest to you (e.g., `us-east-1`)
   - **Plan**: Free tier (10,000 requests/day - plenty for testing!)
5. Click **"Create"**

### 1.2 Get Your Environment Variables

1. Once created, click on your database
2. Scroll down to **"REST API"** section
3. Click the **.env** tab
4. Copy the two lines that look like:

```bash
UPSTASH_REDIS_REST_URL="https://xxxxxxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AxxxxxxxxxxxxxxxxxxxxxxxxxxxYZ"
```

### 1.3 Create Local `.env.local` File

1. In your project root (`my-project/`), create a file called `.env.local`
2. Paste the two lines from Upstash
3. Save the file

**Example `.env.local`:**

```bash
UPSTASH_REDIS_REST_URL="https://cool-pigeon-12345.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AYOxNTxxxxxxxxxxxxxxxxxxxxxxxxxxxxYZ"
```

⚠️ **IMPORTANT**: `.env.local` is already in `.gitignore` - never commit this file!

---

## Step 2: Test Locally (Two Browser Windows)

### 2.1 Start Your Dev Server

```bash
npm run dev
```

### 2.2 Open Two Browser Windows

1. **Window 1**: `http://localhost:3000/typequest` (Player 1)
2. **Window 2**: `http://localhost:3000/typequest` (Player 2)

OR use:

- **Window 1**: Chrome normal
- **Window 2**: Chrome Incognito (separate session)

### 2.3 Test Flow

1. **In Window 1**:
   - Enter name: "Alice"
   - Select grade level: "K"
   - Select game mode: "Multiplayer"
   - Click "Start Game"
   - ✅ Modal should open showing "No players available"

2. **In Window 2**:
   - Enter name: "Bob"
   - Select grade level: "K" (same as Alice)
   - Select game mode: "Multiplayer"
   - Click "Start Game"
   - ✅ Modal should open

3. **Back to Window 1**:
   - ✅ After ~2 seconds, you should see "Bob" appear in the player list!

4. **Click "Connect" on Bob**:
   - ✅ Should send match request
   - (Currently Bob needs to accept - see next section)

---

## Step 3: Test on Vercel (Real Multiplayer)

### Why Deploy?

- Test from different devices (your laptop + phone)
- Share with friends for real testing
- Vercel automatically uses your env variables

### 3.1 Deploy to Vercel

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Deploy (first time)
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? typequest (or whatever)
# - Directory? ./ (press enter)
# - Settings? No (press enter)
```

### 3.2 Add Environment Variables to Vercel

**Option A: Via Dashboard**

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Add both variables:
   - `UPSTASH_REDIS_REST_URL` = your URL
   - `UPSTASH_REDIS_REST_TOKEN` = your token
5. Click **Save**
6. Redeploy: `vercel --prod`

**Option B: Via CLI**

```bash
vercel env add UPSTASH_REDIS_REST_URL
# Paste your URL, select Production

vercel env add UPSTASH_REDIS_REST_TOKEN
# Paste your token, select Production

# Redeploy
vercel --prod
```

### 3.3 Test from Two Devices

1. **Your Laptop**: Open your Vercel URL
2. **Your Phone**: Open same Vercel URL
3. Both join as multiplayer - see each other!

---

## Step 4: Debug & Monitor

### 4.1 Check Upstash Dashboard

1. Go to Upstash dashboard
2. Click **"Data Browser"**
3. You should see keys like:
   - `tq:lobby:v1` (Set of player IDs)
   - `tq:player:xxxxx-xxxx-xxxx` (Player data)
   - `tq:match:xxxxx_yyyyy` (Match requests)

### 4.2 Check Browser Console

Press **F12** → **Console** tab to see:

- Network requests to `/api/lobby`
- Player data being polled
- Any errors

### 4.3 Common Issues & Fixes

#### ❌ "Cannot find module '@upstash/redis'"

```bash
npm install @upstash/redis
```

#### ❌ "Failed to connect to lobby"

- Check `.env.local` exists and has correct values
- Restart dev server (`npm run dev`)
- Check Upstash dashboard - is database active?

#### ❌ "No players showing up"

- Open browser console - any errors?
- Check Network tab - is `/api/lobby?exclude=xxx` returning data?
- Try refreshing both windows

#### ❌ Players show up but Connect doesn't work

- This is expected! You need to implement the "accept match" flow (next step)

---

## Step 5: Current Limitations (What's Missing)

### ✅ What Works Now:

- Join lobby with name, grade, mode
- See other players in real-time
- Send match request (click Connect)

### ⚠️ What You Need to Add:

1. **Target player receives match request notification**
   - Show a popup: "Alice wants to play! Accept?"
2. **Accept/Reject buttons**
   - Call `PATCH /api/match` with status
3. **Both players start game when accepted**
   - Currently only requester gets notified

---

## Step 6: What to Build Next

### Option A: Simple "Auto-Accept" (Quick Win)

- Remove accept/reject flow
- When someone clicks "Connect", both games start immediately
- Simpler for kids!

### Option B: Request/Accept Flow (What you have now)

1. Add incoming request detection to frontend
2. Show accept/reject modal to target player
3. Poll for incoming requests alongside player list

I can help you implement either! Let me know which you prefer.

---

## Quick Test Checklist ✅

Before moving to game sync logic:

- [ ] Two browser windows can see each other in lobby
- [ ] Player names display correctly
- [ ] "Joined Xs ago" updates
- [ ] Clicking Connect sends match request (check console)
- [ ] Cancel button leaves lobby properly
- [ ] Can test from two different devices (Vercel)

Once these work, you're ready for **game state syncing**! 🎮🔥

---

## Next: Game State Syncing Strategy

Once lobby works, you'll need to decide how to sync game state:

### Option 1: Redis Polling (Simpler)

- Store game state in Redis
- Both players poll for updates every 100ms
- Good enough for turn-based typing game

### Option 2: WebRTC (Lower latency)

- Direct P2P connection
- Real-time updates
- More complex but better performance

I recommend **Option 1 first** to get it working, then upgrade to WebRTC if needed.

---

## Need Help?

If something isn't working:

1. Check browser console (F12)
2. Check Upstash Data Browser (see what's in Redis)
3. Check Network tab for API responses
4. Let me know and I'll debug with you!
