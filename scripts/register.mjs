// Loaded with `node --import ./scripts/register.mjs`. Also loads .env.local / .env
// the way Next.js does, without overriding variables already set in the shell.
import { register } from "node:module";
import { existsSync } from "node:fs";

register("./node-hooks.mjs", import.meta.url);

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}
