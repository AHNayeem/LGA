import { getEnv } from "@/lib/config/env";
import { createGridFsStorage } from "@/lib/storage/gridfsStorage";
import { createMemoryStorage } from "@/lib/storage/memoryStorage";
import { createStaticStorage } from "@/lib/storage/staticStorage";

// Storage driver contract (all methods async):
//   put({ key, body: Uint8Array, contentType }) -> { driver, key, size }
//   get(key) -> { body: Uint8Array | ReadableStream, contentType, size } | null
//   delete(key) -> boolean
//   publicUrl(key) -> string | null   (non-null only for publicly served drivers)
//   readOnly: boolean
//
// Media documents store { driver, key }, so adding an S3-compatible driver later
// means adding one file here and nothing else.

const drivers = new Map();

export function getStorage(driverName) {
  const name = driverName ?? getEnv().MEDIA_STORAGE_DRIVER;
  if (!drivers.has(name)) {
    if (name === "gridfs") drivers.set(name, createGridFsStorage());
    else if (name === "memory") drivers.set(name, createMemoryStorage());
    else if (name === "static") drivers.set(name, createStaticStorage());
    else throw new Error(`Unknown storage driver: ${name}`);
  }
  return drivers.get(name);
}

export function resetStorageDrivers() {
  drivers.clear();
}
