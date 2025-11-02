import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
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
  const { requesterId, targetId, gradeLevel } = await req.json();

  const matchId = `${requesterId}_${targetId}`;
  const match: MatchRequest = {
    requesterId,
    targetId,
    gradeLevel,
    status: "pending",
    createdAt: Date.now(),
  };

  await redis.hset(MATCH_KEY(matchId), match as any);
  await redis.expire(MATCH_KEY(matchId), MATCH_TTL);

  return NextResponse.json({ ok: true, matchId });
}


// GET: Check match status by matchId
export async function GET(req: NextRequest) {
  try {
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
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}


// PATCH: Accept/reject match
export async function PATCH(req: NextRequest) {
    const { matchId, status } = await req.json();
  
    await redis.hset(MATCH_KEY(matchId), { status });
  
    return NextResponse.json({ ok: true });
  }