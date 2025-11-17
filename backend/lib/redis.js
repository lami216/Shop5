import Redis from "ioredis";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("./backend/.env") });

const url = process.env.UPSTASH_REDIS_URL;
if (!url) {
  console.warn("[Redis] UPSTASH_REDIS_URL is missing. Redis features will be disabled.");
}

// لو فيه URL نستخدمه، غير كذا لا ننشئ عميل
export const redis = url ? new Redis(url) : {
  get: async () => null,
  set: async () => {},
  del: async () => {},
};
