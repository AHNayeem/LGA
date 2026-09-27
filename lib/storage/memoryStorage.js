// In-process storage for tests. Not persistent; never use in production.
export function createMemoryStorage() {
  const files = new Map();
  return {
    name: "memory",
    readOnly: false,
    async put({ key, body, contentType }) {
      files.set(String(key), { body: new Uint8Array(body), contentType });
      return { driver: "memory", key: String(key), size: body.byteLength };
    },
    async get(key) {
      const f = files.get(String(key));
      return f ? { body: f.body, contentType: f.contentType, size: f.body.byteLength } : null;
    },
    async delete(key) {
      return files.delete(String(key));
    },
    publicUrl() {
      return null;
    },
  };
}
