import { MongoClient } from "mongodb";
import { getEnv } from "@/lib/config/env";

// One client per process. On Vercel, warm function instances reuse it; in dev, it
// survives hot reloads via globalThis.
const g = globalThis;
g.__lgaMongo ??= { client: null, promise: null };
const state = g.__lgaMongo;

export async function getClient() {
  if (state.client) return state.client;
  if (!state.promise) {
    const { MONGODB_URI } = getEnv();
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
      appName: "lga",
    });
    state.promise = client.connect().then((c) => {
      state.client = c;
      return c;
    });
    state.promise.catch(() => {
      state.promise = null;
    });
  }
  return state.promise;
}

export async function getDb() {
  const client = await getClient();
  return client.db(getEnv().MONGODB_DB);
}

export async function closeClient() {
  if (state.client) await state.client.close();
  state.client = null;
  state.promise = null;
}

export async function pingDb() {
  const db = await getDb();
  await db.command({ ping: 1 });
  return true;
}
