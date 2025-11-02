import { Redis } from "@upstash/redis";

export const runtime = "edge";

// Option 1: Use fromEnv() if your .env.local has UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
// const redis = Redis.fromEnv();

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default redis;