// Shared by the Atlas test commands. The URI is taken ONLY from an explicit setting:
// ATLAS_TEST_URI, or MONGODB_URI from the shell / .env.local. There is no fallback to an
// in-memory server: without a URI these commands fail. The URI is never printed.
import { randomBytes } from "node:crypto";
import { MongoClient } from "mongodb";

export function resolveAtlasUri() {
  const uri = process.env.ATLAS_TEST_URI || process.env.MONGODB_URI;
  const source = process.env.ATLAS_TEST_URI ? "ATLAS_TEST_URI" : "MONGODB_URI";
  if (!uri) {
    throw new Error(
      "No MongoDB Atlas URI configured. Set ATLAS_TEST_URI (or MONGODB_URI in .env.local) to a DEVELOPMENT/TEST cluster. " +
        "These commands never fall back to an in-memory database.",
    );
  }
  let host;
  try {
    host = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, "https://")).hostname;
  } catch {
    throw new Error(`${source} is not a valid MongoDB connection string.`);
  }
  const isAtlas = uri.startsWith("mongodb+srv://") || host.endsWith(".mongodb.net");
  if (!isAtlas && process.env.ATLAS_ALLOW_NON_ATLAS !== "1") {
    throw new Error(`${source} does not point to MongoDB Atlas (host ${host}). Set ATLAS_ALLOW_NON_ATLAS=1 to run against another real server.`);
  }
  return { uri, source, host };
}

export const newRunId = () => `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;

// Drops every database whose name starts with `prefix` (throwaway test databases only).
export async function dropDatabasesWithPrefix(uri, prefix) {
  if (!/^lga_(itest|e2e)_/.test(prefix)) throw new Error(`Refusing to drop databases with prefix "${prefix}".`);
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15_000, appName: "lga-atlas-cleanup" });
  try {
    await client.connect();
    let names;
    try {
      const { databases } = await client.db("admin").admin().listDatabases({ nameOnly: true });
      names = databases.map((d) => d.name).filter((n) => n.startsWith(prefix));
    } catch {
      return { dropped: [], listed: false }; // user lacks listDatabases; tests drop their own
    }
    for (const n of names) await client.db(n).dropDatabase();
    return { dropped: names, listed: true };
  } finally {
    await client.close();
  }
}
