import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
import { checkRateLimit, lobbyMatchLimiter } from "@/lib/rateLimiter";

export const runtime = "edge";

const MATCH_KEY = (matchId: string) => `tq:match:${matchId}`;
const MATCH_TTL = 300; // 5 minutes

type MatchRequest = {
  requesterId: string;
  targetId: string;
  gradeLevel: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: number;
};

// POST: Create match request
export async function POST(req: NextRequest) {
  // ✅ Check rate limit FIRST
  const rateLimitCheck = await checkRateLimit(lobbyMatchLimiter, "match:create", req);
  if (!rateLimitCheck.success) {
    return NextResponse.json(
      { ok: false, error: rateLimitCheck.error },
      { status: 429 }
    );
  }

  const { requesterId, targetId, gradeLevel } = await req.json();

  const matchId = `${requesterId}_${targetId}`;
  
  // ✅ Check if match already exists
  const existingMatch = await redis.hgetall(MATCH_KEY(matchId));
  
  // ✅ If match exists and is not rejected, return error (can't overwrite pending/accepted)
  if (existingMatch && existingMatch.status && existingMatch.status !== "rejected") {
    return NextResponse.json(
      { ok: false, error: "Match request already exists" },
      { status: 409 }
    );
  }
  
  // ✅ Delete existing rejected match (if any) before creating new one
  if (existingMatch && existingMatch.status === "rejected") {
    await redis.del(MATCH_KEY(matchId));
  }

  const match: MatchRequest = {
    requesterId,
    targetId,
    gradeLevel,
    status: "pending",
    createdAt: Date.now(),
  };

  await redis.hset(MATCH_KEY(matchId), match as Record<string, string | number>);
  await redis.expire(MATCH_KEY(matchId), MATCH_TTL);

  return NextResponse.json({ ok: true, matchId });
}


// GET: Check match status by matchId
export async function GET(req: NextRequest) {
  try {
    // ✅ Check rate limit FIRST
    const rateLimitCheck = await checkRateLimit(lobbyMatchLimiter, "match:check", req);
    if (!rateLimitCheck.success) {
      return NextResponse.json(
        { ok: false, error: rateLimitCheck.error },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
      return NextResponse.json({ ok: false, error: "matchId required" }, { status: 400 });
    }

    const match = await redis.hgetall(MATCH_KEY(matchId));
    
    if (!match || !match.status) {
      return NextResponse.json({ ok: false, error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, match });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Failed to process match request" }, { status: 500 });
  }
}


// PATCH: Accept/reject match
export async function PATCH(req: NextRequest) {
  // ✅ Check rate limit FIRST
  const rateLimitCheck = await checkRateLimit(lobbyMatchLimiter, "match:respond", req);
  if (!rateLimitCheck.success) {
    return NextResponse.json(
      { ok: false, error: rateLimitCheck.error },
      { status: 429 }
    );
  }

  const { matchId, status } = await req.json();

  await redis.hset(MATCH_KEY(matchId), { status });

  return NextResponse.json({ ok: true });
}

// DELETE: Remove match request (cleanup after game starts)
export async function DELETE(req: NextRequest) {
  try {
    // ✅ Check rate limit FIRST
    const rateLimitCheck = await checkRateLimit(lobbyMatchLimiter, "match:delete", req);
    if (!rateLimitCheck.success) {
      return NextResponse.json(
        { ok: false, error: rateLimitCheck.error },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
      return NextResponse.json({ ok: false, error: "matchId required" }, { status: 400 });
    }

    await redis.del(MATCH_KEY(matchId));

    return NextResponse.json({ ok: true, message: "Match request deleted" });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Failed to process match request" }, { status: 500 });
  }
}