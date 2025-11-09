import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
import { checkRateLimit, leaderboardLimiter } from "@/lib/rateLimiter";

export const runtime = "edge";

/**
 * Leaderboard Key Structure: tq:leaderboard:{mode}:{gradeLevel}
 * Uses Redis Sorted Sets (ZADD/ZREVRANGE) for efficient ranking
 * Score = totalPoints (for sorting)
 * Member = JSON-stringified game result
 */
const LEADERBOARD_KEY = (mode: string, gradeLevel: string) =>
  `tq:leaderboard:${mode}:${gradeLevel}`;
const LEADERBOARD_TTL = 7776000; // 90 days
const MAX_ENTRIES_PER_BOARD = 100; // Keep top 100 per board

/**
 * GET /api/leaderboard?mode=multiplayer&gradeLevel=K&limit=10
 * Fetches top N entries from leaderboard
 */
export async function GET(req: NextRequest) {
  try {
    // ✅ Check rate limit FIRST
    const rateLimitCheck = await checkRateLimit(leaderboardLimiter, "leaderboard:get", req);
    if (!rateLimitCheck.success) {
      return NextResponse.json(
        { ok: false, error: rateLimitCheck.error },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "solo";
    const gradeLevel = searchParams.get("gradeLevel") || "K";
    const limit = parseInt(searchParams.get("limit") || "10");

    const key = LEADERBOARD_KEY(mode, gradeLevel);

    // ZREVRANGE: Get top N scores (highest to lowest)
    const results = await redis.zrange(key, 0, limit - 1, {
      rev: true, // Reverse order (highest first)
      withScores: false,
    });

    // Parse JSON results
    const leaderboard = results.map((entry: any) => {
      try {
        return typeof entry === "string" ? JSON.parse(entry) : entry;
      } catch (err) {
        console.error("Failed to parse leaderboard entry:", err);
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({
      ok: true,
      leaderboard,
      count: leaderboard.length,
    });
  } catch (error: any) {
    console.error("Failed to get leaderboard:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to get leaderboard" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leaderboard
 * Body: GameResult object
 * Adds entry to leaderboard (sorted by totalPoints)
 */
export async function POST(req: NextRequest) {
  try {
    // ✅ Check rate limit FIRST
    const rateLimitCheck = await checkRateLimit(leaderboardLimiter, "leaderboard:save", req);
    if (!rateLimitCheck.success) {
      return NextResponse.json(
        { ok: false, error: rateLimitCheck.error },
        { status: 429 }
      );
    }

    const gameResult = await req.json();

    const { mode, gradeLevel, totalPoints } = gameResult;

    if (!mode || !gradeLevel || totalPoints === undefined) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: mode, gradeLevel, totalPoints" },
        { status: 400 }
      );
    }

    const key = LEADERBOARD_KEY(mode, gradeLevel);

    // Add to sorted set (score = totalPoints)
    await redis.zadd(key, {
      score: totalPoints,
      member: JSON.stringify(gameResult),
    });

    // Set TTL
    await redis.expire(key, LEADERBOARD_TTL);

    // Trim to keep only top MAX_ENTRIES_PER_BOARD
    // ZREMRANGEBYRANK removes entries outside the top N
    const totalCount = await redis.zcard(key);
    if (totalCount > MAX_ENTRIES_PER_BOARD) {
      await redis.zremrangebyrank(key, 0, totalCount - MAX_ENTRIES_PER_BOARD - 1);
    }

    return NextResponse.json({
      ok: true,
      message: "Game result saved to leaderboard",
    });
  } catch (error: any) {
    console.error("Failed to save to leaderboard:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to save to leaderboard" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/leaderboard?mode=multiplayer&gradeLevel=K
 * Deletes specific leaderboard or all if no params
 */
export async function DELETE(req: NextRequest) {
  try {
    // ✅ Check rate limit FIRST
    const rateLimitCheck = await checkRateLimit(leaderboardLimiter, "leaderboard:delete", req);
    if (!rateLimitCheck.success) {
      return NextResponse.json(
        { ok: false, error: rateLimitCheck.error },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");
    const gradeLevel = searchParams.get("gradeLevel");

    if (mode && gradeLevel) {
      // Delete specific leaderboard
      const key = LEADERBOARD_KEY(mode, gradeLevel);
      await redis.del(key);

      return NextResponse.json({
        ok: true,
        message: `Deleted leaderboard for ${mode} - ${gradeLevel}`,
      });
    } else {
      // Delete ALL leaderboards (use with caution!)
      const pattern = "tq:leaderboard:*";
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
      }

      return NextResponse.json({
        ok: true,
        message: `Deleted ${keys.length} leaderboard(s)`,
        deletedCount: keys.length,
      });
    }
  } catch (error: any) {
    console.error("Failed to delete leaderboard:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to delete leaderboard" },
      { status: 500 }
    );
  }
}