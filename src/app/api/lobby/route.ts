// app/api/lobby/route.ts
import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
import { GradeLevel, GameMode } from "@/app/constants/index_typequest";
import { checkRateLimit, lobbyMatchLimiter } from "@/lib/rateLimiter";

// Run on Edge for snappy responses
export const runtime = "edge";
// Keys
const LOBBY_SET = "tq:lobby:v1";      // Set of active player IDs
const PLAYER_KEY = (id: string) => `tq:player:${id}`;
// TTL in seconds (players auto-expire if no heartbeat)
const PLAYER_TTL = 90;

type Player = { id: string; name: string; joinedAt: number; gradeLevel: GradeLevel; gameMode: GameMode };

function json(data: any, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

function bad(msg: string, code = 400) {
  return json({ ok: false, error: msg }, { status: code });
}

/**
 * POST /api/lobby
 * Body: { name: string, gradeLevel: GradeLevel, gameMode: GameMode }
 * Joins the lobby, returns { ok, player: { id, name }, ttl }
 */
// might want to check if existing already exists 
export async function POST(req: NextRequest) {
  try {
    // ✅ Check rate limit FIRST
    const rateLimitCheck = await checkRateLimit(lobbyMatchLimiter, "lobby:join", req);
    if (!rateLimitCheck.success) {
      return json(
        { ok: false, error: rateLimitCheck.error },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const name = (body?.name || "").toString().trim();
    const gradeLevel = body?.gradeLevel || "K";
    const gameMode = body?.gameMode || "solo";

    if (!name || name.length < 3) {
      return bad("Name must be at least 3 characters.");
    }
    if (!gradeLevel || !gameMode) {
      return bad("Grade level and game mode are required.");
    }

    const id = crypto.randomUUID();
    const player: Player = { id, name, joinedAt: Date.now(), gradeLevel: gradeLevel as GradeLevel, gameMode: gameMode as GameMode };

    // Store player, add to lobby set, set TTL
    await Promise.all([
      redis.hset(PLAYER_KEY(id), player as any),
      redis.sadd(LOBBY_SET, id),
      redis.expire(PLAYER_KEY(id), PLAYER_TTL),
    ]);

    return json({ ok: true, player: { id, name }, ttl: PLAYER_TTL });
  } catch (err: any) {
    return bad(err?.message ?? "Failed to join lobby.", 500);
  }
}

/**
 * GET /api/lobby?exclude=<playerId>
 * Returns active players (excluding requester if provided).
 */
export async function GET(req: NextRequest) {
  try {
    // ✅ Check rate limit FIRST
    const rateLimitCheck = await checkRateLimit(lobbyMatchLimiter, "lobby:list", req);
    if (!rateLimitCheck.success) {
      return json(
        { ok: false, error: rateLimitCheck.error },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const exclude = searchParams.get("exclude") || "";

    // Get current ids in the lobby
    const ids = ((await redis.smembers(LOBBY_SET)) || []) as string[];

    // Fetch players in parallel
    const playersRaw = await Promise.all(
      ids.map((id: string) => redis.hgetall<Record<string, string>>(PLAYER_KEY(id)))
    );

    // Filter out expired/null and format
    const now = Date.now();
    const players: Player[] = [];
    const toRemoveFromSet: string[] = [];

    playersRaw.forEach((data: any, idx: number) => {
      const id = ids[idx];
      if (!data || !data.id || !data.name || !data.joinedAt || !data.gradeLevel || !data.gameMode) {
        // player hash missing — probably expired; clean from set
        toRemoveFromSet.push(id);
        return;
      }
      players.push({
        id,
        name: data.name,
        joinedAt: Number(data.joinedAt),
        gradeLevel: data.gradeLevel as GradeLevel,
        gameMode: data.gameMode as GameMode,
      });
    });

    // Cleanup dead IDs out of the set (best-effort)
    if (toRemoveFromSet.length) {
      await redis.srem(LOBBY_SET, ...toRemoveFromSet);
    }

    // Exclude requester if present
    const filtered = exclude ? players.filter((p) => p.id !== exclude) : players;

    // Sort by join time (newest first)
    filtered.sort((a, b) => b.joinedAt - a.joinedAt);

    return json({ ok: true, players: filtered, now });
  } catch (err: any) {
    return bad(err?.message ?? "Failed to list lobby.", 500);
  }
}

/**
 * PATCH /api/lobby
 * Body: { id: string }
 * Heartbeat to extend your TTL.
 */
export async function PATCH(req: NextRequest) {
  try {
    // ✅ Check rate limit FIRST
    const rateLimitCheck = await checkRateLimit(lobbyMatchLimiter, "lobby:heartbeat", req);
    if (!rateLimitCheck.success) {
      return json(
        { ok: false, error: rateLimitCheck.error },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const id = (body?.id || "").toString();

    if (!id) return bad("Missing id.");

    // Touch TTL and bump joinedAt so you float to the top
    const key = PLAYER_KEY(id);
    const exists = await redis.exists(key);
    if (!exists) return bad("Player not found (expired or left).", 404);

    await Promise.all([
      redis.hset(key, { joinedAt: Date.now() }),
      redis.expire(key, PLAYER_TTL),
    ]);
    return json({ ok: true, ttl: PLAYER_TTL });
  } catch (err: any) {
    return bad(err?.message ?? "Failed to heartbeat.", 500);
  }
}

/**
 * DELETE /api/lobby
 * Body: { id: string }
 * Leaves the lobby (manual cleanup).
 */
export async function DELETE(req: NextRequest) {
  try {
    // ✅ Check rate limit FIRST
    const rateLimitCheck = await checkRateLimit(lobbyMatchLimiter, "lobby:leave", req);
    if (!rateLimitCheck.success) {
      return json(
        { ok: false, error: rateLimitCheck.error },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const id = (body?.id || "").toString();

    if (!id) return bad("Missing id.");

    await Promise.all([redis.del(PLAYER_KEY(id)), redis.srem(LOBBY_SET, id)]);
    return json({ ok: true });
  } catch (err: any) {
    return bad(err?.message ?? "Failed to leave lobby.", 500);
  }
}