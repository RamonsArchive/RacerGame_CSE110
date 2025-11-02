import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { cookies, headers } from "next/headers";
import crypto from "crypto";

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
  limiter: Ratelimit.slidingWindow(100, "40 s"),
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
  limiter: Ratelimit.slidingWindow(30, "60 s"),
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
  limiter: Ratelimit.slidingWindow(10, "60 s"),
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
  limiter: Ratelimit.slidingWindow(30, "60 s"),
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
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  analytics: true,
  prefix: "tq:ratelimit:general",
});

/**
 * Get unique client identifier from cookies or IP hash
 * Priority: userId cookie > IP + fingerprint hash
 */
export const getClientId = async (): Promise<string> => {
  try {
    // Try session cookie first (from middleware)
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (userId) {
      return `user:${userId}`;
    }

    // Fallback to IP + fingerprint hash
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
    const userAgent = headersList.get("user-agent") || "";
    const acceptLanguage = headersList.get("accept-language") || "";

    const fingerprint = crypto
      .createHash("sha256")
      .update(`${ip}-${userAgent}-${acceptLanguage}`)
      .digest("hex")
      .substring(0, 16); // Shorter hash for cleaner keys

    return `guest:${fingerprint}`;
  } catch (error) {
    console.error("Failed to get client ID:", error);
    return `fallback:${Date.now()}`; // Emergency fallback
  }
};

/**
 * Check rate limit for a specific action
 * Returns: { success: boolean, error?: string }
 */
export const checkRateLimit = async (
  limiter: Ratelimit,
  action: string
): Promise<{ success: boolean; error?: string; limit?: number; remaining?: number }> => {
  try {
    const clientId = await getClientId();
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

