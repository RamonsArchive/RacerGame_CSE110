import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
import { checkRateLimit, gameProgressLimiter } from "@/lib/rateLimiter";

export const runtime = "edge";

const PROGRESS_KEY = (roomId: string, playerId: string) =>
  `tq:progress:${roomId}:${playerId}`;
const PROGRESS_TTL = 3600; // 1 hour

type QuestionResult = {
  questionId: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  correct: boolean;
  timeSpent: number;
  mistakes: number;
  points: number;
  timestamp: number;
};

/**
 * POST /api/game/progress
 * Body: { roomId, playerId, playerName, progress }
 * Updates player's progress in the game
 */
export async function POST(req: NextRequest) {
  try {
    // ✅ Check rate limit FIRST
    const rateLimitCheck = await checkRateLimit(
      gameProgressLimiter,
      "progress:post",
      req
    );
    if (!rateLimitCheck.success) {
      return NextResponse.json(
        { ok: false, error: rateLimitCheck.error },
        { status: 429 } // Too Many Requests
      );
    }

    const body = await req.json();
    const { roomId, playerId, playerName, progress } = body;

    if (!roomId || !playerId || !progress) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const playerProgress = {
      playerId,
      playerName: playerName || "Player",
      currentQuestionIndex: progress.currentQuestionIndex || 0,
      questionsAnswered: progress.questionsAnswered || 0,
      totalPoints: progress.totalPoints || 0,
      totalMistakes: progress.totalMistakes || 0,
      isFinished: progress.isFinished || false,
      finishTime: progress.finishTime || null,
      questionResults: JSON.stringify(progress.questionResults || []), // ✅ Stringify for Redis
      isActive: progress.isActive !== undefined ? progress.isActive : true, // ✅ Default to active
      lastUpdate: Date.now(),
    };

    // Store progress in Redis
    await redis.hset(
      PROGRESS_KEY(roomId, playerId),
      playerProgress as Record<string, string | number | boolean>
    );
    await redis.expire(PROGRESS_KEY(roomId, playerId), PROGRESS_TTL);

    return NextResponse.json({
      ok: true,
      message: "Progress updated",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to update progress",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/game/progress?roomId=xxx&playerId=yyy
 * Fetches opponent's progress (excludes requesting player)
 */
export async function GET(req: NextRequest) {
  try {
    // ✅ Check rate limit FIRST
    const rateLimitCheck = await checkRateLimit(
      gameProgressLimiter,
      "progress:get",
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
    const playerId = searchParams.get("playerId");

    if (!roomId || !playerId) {
      return NextResponse.json(
        { ok: false, error: "roomId and playerId required" },
        { status: 400 }
      );
    }

    // Get game room to find opponent ID
    const gameRoom = await redis.hgetall(`tq:gameroom:${roomId}`);

    if (!gameRoom || !gameRoom.roomId) {
      return NextResponse.json(
        { ok: false, error: "Game room not found" },
        { status: 404 }
      );
    }

    // Determine opponent ID
    const opponentId =
      gameRoom.player1Id === playerId ? gameRoom.player2Id : gameRoom.player1Id;

    // Fetch opponent's progress
    const opponentProgress = await redis.hgetall(
      PROGRESS_KEY(roomId, opponentId as string)
    );

    if (!opponentProgress || !opponentProgress.playerId) {
      // Opponent hasn't submitted progress yet
      return NextResponse.json({
        ok: true,
        opponentProgress: null,
        message: "Opponent hasn't started yet",
      });
    }

    return NextResponse.json({
      ok: true,
      opponentProgress: {
        playerId: opponentProgress.playerId,
        playerName: opponentProgress.playerName,
        currentQuestionIndex: Number(opponentProgress.currentQuestionIndex),
        questionsAnswered: Number(opponentProgress.questionsAnswered),
        totalPoints: Number(opponentProgress.totalPoints),
        totalMistakes: Number(opponentProgress.totalMistakes),
        isFinished:
          opponentProgress.isFinished === "true" ||
          opponentProgress.isFinished === true,
        finishTime: opponentProgress.finishTime
          ? Number(opponentProgress.finishTime)
          : null,
        questionResults: opponentProgress.questionResults, // ✅ Parse for client
        isActive:
          opponentProgress.isActive === "true" ||
          opponentProgress.isActive === true ||
          opponentProgress.isActive === undefined, // ✅ Default to true for backward compatibility
        lastUpdate: Number(opponentProgress.lastUpdate),
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch opponent progress",
      },
      { status: 500 }
    );
  }
}
