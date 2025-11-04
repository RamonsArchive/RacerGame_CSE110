import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

// Shared Redis instance (same as game data - perfectly fine!)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * 🎮 GAME PROGRESS RATE LIMITER
 * Used for: /api/game/progress (opponent polling + answer submissions)
 * 
 * Very lenient - players need to poll every 1s and submit ~10-15 answers
 * Limit: 100 requests per minute (1.67 req/sec avg)
 */
export const gameProgressLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "20 s"),
  analytics: true,
  prefix: "tq:ratelimit:game",
});

/**
 * 🏟️ LOBBY/MATCH RATE LIMITER
 * Used for: /api/lobby, /api/match (join, leave, send requests, accept)
 * 
 * Moderate - players shouldn't spam lobby joins or match requests
 * Limit: 30 requests per minute
 */
export const lobbyMatchLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "20 s"),
  analytics: true,
  prefix: "tq:ratelimit:lobby",
});

/**
 * 🎯 GAME ROOM RATE LIMITER
 * Used for: /api/game (creating/fetching game rooms)
 * 
 * Low frequency - only called once per game start
 * Limit: 10 requests per minute
 */
export const gameRoomLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "20 s"),
  analytics: true,
  prefix: "tq:ratelimit:room",
});

/**
 * 🏆 LEADERBOARD RATE LIMITER
 * Used for: /api/leaderboard (GET/POST/DELETE)
 * 
 * Moderate - players might check leaderboard multiple times
 * Limit: 30 requests per minute
 */
export const leaderboardLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "30 s"),
  analytics: true,
  prefix: "tq:ratelimit:leaderboard",
});

/**
 * 🔒 GENERAL RATE LIMITER (fallback)
 * Used for: Any other API routes not covered above
 * Limit: 60 requests per minute
 */
export const generalLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "30 s"),
  analytics: true,
  prefix: "tq:ratelimit:general",
});

/**
 * Get unique client identifier from cookies or IP hash
 * Priority: userId cookie > IP + fingerprint hash
 * ✅ Edge Runtime Compatible (uses Web Crypto API instead of Node.js crypto)
 */
export const getClientId = async (req: NextRequest): Promise<string> => {
  try {
    // Try session cookie first (from middleware)
    const userId = req.cookies.get("userId")?.value;

    if (userId) {
      return `user:${userId}`;
    }

    // Fallback to IP + fingerprint hash using Web Crypto API (Edge-compatible)
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    const acceptLanguage = req.headers.get("accept-language") || "";

    const data = `${ip}-${userAgent}-${acceptLanguage}`;
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    const fingerprint = hashHex.substring(0, 16); // Shorter hash for cleaner keys

    return `guest:${fingerprint}`;
  } catch (error) {
    console.error("Failed to get client ID:", error);
    return `fallback:${Date.now()}`; // Emergency fallback
  }
};

/**
 * Check rate limit for a specific action
 * ✅ Edge Runtime Compatible (uses Web Crypto API)
 * Returns: { success: boolean, error?: string }
 */
export const checkRateLimit = async (
  limiter: Ratelimit,
  action: string,
  req: NextRequest
): Promise<{ success: boolean; error?: string; limit?: number; remaining?: number }> => {
  try {
    const clientId = await getClientId(req);
    const identifier = `${clientId}:${action}`;

    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    if (!success) {
      const resetDate = new Date(reset);
      const secondsUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / 1000);

      return {
        success: false,
        error: `Rate limit exceeded. Try again in ${secondsUntilReset}s`,
        limit,
        remaining: 0,
      };
    }

    return {
      success: true,
      limit,
      remaining,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Fail open (allow request) if rate limiter has issues
    return { success: true };
  }
};

