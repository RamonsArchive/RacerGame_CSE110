import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
const GAME_ROOM_KEY = (roomId: string) => `tq:gameroom:${roomId}`;
const GAME_TTL = 3600; // 1 hour

type GameRoom = {
  roomId: string;
  player1Id: string;
  player1Name: string;
  player2Id: string;
  player2Name: string;
  gradeLevel: string;
  questions: any[]; // Shared questions for both players
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
    await redis.hset(GAME_ROOM_KEY(roomId), gameRoom as any);
    await redis.expire(GAME_ROOM_KEY(roomId), GAME_TTL);

    console.log("✅ Game room created:", roomId);

    return NextResponse.json({
      ok: true,
      roomId,
      questions,
      message: "Game room created",
    });
  } catch (err: any) {
    console.error("❌ Failed to create game room: in match route", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to create game room" },
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
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to fetch game room" },
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
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to delete game room" },
      { status: 500 }
    );
  }
}

