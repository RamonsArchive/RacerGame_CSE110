import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";
// Only initialize Redis if we have valid URLs (not "dummy" values)
const getRedisUrl = () => process.env.UPSTASH_REDIS_REST_URL;
const getRedisToken = () => process.env.UPSTASH_REDIS_REST_TOKEN;

const isValidRedisConfig = () => {
  const url = getRedisUrl();
  const token = getRedisToken();

  // Strict validation: must be a valid HTTPS URL and not dummy/empty
  if (!url || !token) return false;
  if (url === "dummy" || token === "dummy") return false;
  if (url.trim() === "" || token.trim() === "") return false;
  if (!url.startsWith("https://")) return false;

  return true;
};

// Lazy initialization to prevent Redis constructor from being called with invalid values
let redisInstance: Redis | null = null;

const getRedis = (): Redis => {
  if (redisInstance) return redisInstance;

  if (isValidRedisConfig()) {
    const url = getRedisUrl()!;
    const token = getRedisToken()!;

    // Double-check before calling constructor - never call with "dummy" or invalid values
    if (
      url &&
      token &&
      url.startsWith("https://") &&
      url !== "dummy" &&
      token !== "dummy"
    ) {
      redisInstance = new Redis({ url, token });
      return redisInstance;
    }
  }

  // Return a mock Redis for build time when secrets aren't available
  return {
    get: async () => null,
    set: async () => "OK",
    del: async () => 0,
  } as unknown as Redis;
};

const redis = getRedis();

// Helper to create rate limiters only if Redis is valid
const createLimiter = (
  window: number,
  windowSize: Duration,
  prefix: string
) => {
  if (!isValidRedisConfig()) {
    // Return a no-op limiter for build time
    return {
      limit: async () => ({
        success: true,
        limit: Infinity,
        remaining: Infinity,
        reset: Date.now(),
      }),
    } as unknown as Ratelimit;
  }
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(window, windowSize),
    analytics: true,
    prefix,
  });
};

/**
 * 🎮 GAME PROGRESS RATE LIMITER
 * Used for: /api/game/progress (opponent polling + answer submissions)
 *
 * Very lenient - players need to poll every 1s and submit ~10-15 answers
 * Limit: 100 requests per minute (1.67 req/sec avg)
 */
export const gameProgressLimiter = createLimiter(
  100,
  "20 s",
  "tq:ratelimit:game"
);

/**
 * 🏟️ LOBBY/MATCH RATE LIMITER
 * Used for: /api/lobby, /api/match (join, leave, send requests, accept)
 *
 * Moderate - players shouldn't spam lobby joins or match requests
 * Limit: 30 requests per minute
 */
export const lobbyMatchLimiter = createLimiter(
  30,
  "20 s",
  "tq:ratelimit:lobby"
);

/**
 * 🎯 GAME ROOM RATE LIMITER
 * Used for: /api/game (creating/fetching game rooms)
 *
 * Low frequency - only called once per game start
 * Limit: 10 requests per minute
 */
export const gameRoomLimiter = createLimiter(10, "20 s", "tq:ratelimit:room");

/**
 * 🏆 LEADERBOARD RATE LIMITER
 * Used for: /api/leaderboard (GET/POST/DELETE)
 *
 * Moderate - players might check leaderboard multiple times
 * Limit: 30 requests per minute
 */
export const leaderboardLimiter = createLimiter(
  30,
  "30 s",
  "tq:ratelimit:leaderboard"
);

/**
 * 🔒 GENERAL RATE LIMITER (fallback)
 * Used for: Any other API routes not covered above
 * Limit: 60 requests per minute
 */
export const generalLimiter = createLimiter(60, "30 s", "tq:ratelimit:general");

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
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    const acceptLanguage = req.headers.get("accept-language") || "";

    const data = `${ip}-${userAgent}-${acceptLanguage}`;
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
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
): Promise<{
  success: boolean;
  error?: string;
  limit?: number;
  remaining?: number;
}> => {
  try {
    const clientId = await getClientId(req);
    const identifier = `${clientId}:${action}`;

    const { success, limit, remaining, reset } =
      await limiter.limit(identifier);

    if (!success) {
      const resetDate = new Date(reset);
      const secondsUntilReset = Math.ceil(
        (resetDate.getTime() - Date.now()) / 1000
      );

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
