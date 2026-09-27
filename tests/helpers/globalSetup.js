import { MongoMemoryServer } from "mongodb-memory-server";

// One in-memory mongod for the whole run; no local MongoDB installation or Atlas needed.
let server;

export async function setup({ provide }) {
  server = await MongoMemoryServer.create();
  provide("mongoUri", server.getUri());
}

export async function teardown() {
  await server?.stop();
}
