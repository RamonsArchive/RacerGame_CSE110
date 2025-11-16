import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
import { checkRateLimit, gameRoomLimiter } from "@/lib/rateLimiter";

const GAME_ROOM_KEY = (roomId: string) => `tq:gameroom:${roomId}`;
const GAME_TTL = 3600; // 1 hour

type GameRoom = {
  roomId: string;
  player1Id: string;
  player1Name: string;
  player2Id: string;
  player2Name: string;
  gradeLevel: string;
  questions: unknown[]; // Shared questions for both players
  createdAt: number;
  status: "waiting" | "active" | "finished";
};

/**
 * POST /api/game
 * Body: { matchId, player1Id, player1Name, player2Id, player2Name, gradeLevel, questions }
 * Creates a game room with shared questions
 */
export async function POST(req: NextRequest) {
  try {
    // ✅ Check rate limit FIRST
    const rateLimitCheck = await checkRateLimit(
      gameRoomLimiter,
      "room:create",
      req
    );
    if (!rateLimitCheck.success) {
      return NextResponse.json(
        { ok: false, error: rateLimitCheck.error },
        { status: 429 } // Too Many Requests
      );
    }

    const body = await req.json();
    const {
      roomId,
      player1Id,
      player1Name,
      player2Id,
      player2Name,
      gradeLevel,
      questions,
    } = body;

    console.log("🎮 POST request body of game room:", body);
    if (!roomId || !player1Id || !player2Id || !questions) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // roomId passed in from client (should be matchId)

    // Check if room already exists (handle race condition)
    const existing = await redis.hgetall(GAME_ROOM_KEY(roomId));
    console.log("🎮 Existing game room:", existing);
    if (existing && existing.roomId) {
      console.log("Game room already exists, returning existing:", roomId);
      return NextResponse.json({
        ok: true,
        roomId,
        questions: existing.questions,
        createdAt: existing.createdAt, // ✅ Return createdAt as startTime
        message: "Game room already exists",
      });
    }

    console.log("🎮 Creating new game room:", roomId);
    const gameRoom: GameRoom = {
      roomId,
      player1Id,
      player1Name: player1Name || "Player 1",
      player2Id,
      player2Name: player2Name || "Player 2",
      gradeLevel,
      questions,
      createdAt: Date.now(),
      status: "active",
    };

    // Store game room in Redis
    await redis.hset(
      GAME_ROOM_KEY(roomId),
      gameRoom as Record<string, string | number | unknown[]>
    );
    await redis.expire(GAME_ROOM_KEY(roomId), GAME_TTL);

    console.log("✅ Game room created:", roomId);

    return NextResponse.json({
      ok: true,
      roomId,
      questions,
      createdAt: gameRoom.createdAt, // ✅ Return createdAt as startTime
      message: "Game room created",
    });
  } catch (err: unknown) {
    console.error("❌ Failed to create game room: in match route", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "Failed to create game room",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/game?roomId=xxx
 * Fetches game room details including shared questions
 */
export async function GET(req: NextRequest) {
  try {
    // ✅ Check rate limit FIRST
    const rateLimitCheck = await checkRateLimit(
      gameRoomLimiter,
      "room:get",
      req
    );
    if (!rateLimitCheck.success) {
      return NextResponse.json(
        { ok: false, error: rateLimitCheck.error },
        { status: 429 } // Too Many Requests
      );
    }

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json(
        { ok: false, error: "roomId required" },
        { status: 400 }
      );
    }

    const gameRoom = await redis.hgetall(GAME_ROOM_KEY(roomId));

    if (!gameRoom || !gameRoom.roomId) {
      return NextResponse.json(
        { ok: false, error: "Game room not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      gameRoom,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to fetch game room",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/game?roomId=xxx
 * Deletes game room when game ends
 */
export async function DELETE(req: NextRequest) {
  try {
    // ✅ Check rate limit FIRST
    const rateLimitCheck = await checkRateLimit(
      gameRoomLimiter,
      "room:delete",
      req
    );
    if (!rateLimitCheck.success) {
      return NextResponse.json(
        { ok: false, error: rateLimitCheck.error },
        { status: 429 } // Too Many Requests
      );
    }

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json(
        { ok: false, error: "roomId required" },
        { status: 400 }
      );
    }

    await redis.del(GAME_ROOM_KEY(roomId));

    return NextResponse.json({ ok: true, message: "Game room deleted" });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "Failed to delete game room",
      },
      { status: 500 }
    );
  }
}
