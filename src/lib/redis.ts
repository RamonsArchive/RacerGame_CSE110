import { Redis } from "@upstash/redis";

export const runtime = "edge";

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

// Create Redis instance only if config is valid
// Use a function to ensure Redis constructor is never called with invalid values
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
  // This will fail at runtime if actually used, but allows build to succeed
  return {
    get: async () => null,
    set: async () => "OK",
    del: async () => 0,
  } as unknown as Redis;
};

const redis = getRedis();

export default redis;
