// Read-only driver for curriculum assets that ship with the deployment, e.g. pre-generated
// TTS audio under public/media/. Files are served by the CDN directly; nothing is written
// at runtime (Vercel's filesystem is read-only).
const KEY_PATTERN = /^[a-z0-9][a-z0-9/_.-]*$/i;

export function createStaticStorage({ basePath = "/media" } = {}) {
  function assertKey(key) {
    if (!KEY_PATTERN.test(key) || key.includes("..")) throw new Error(`Invalid static media key: ${key}`);
  }
  return {
    name: "static",
    readOnly: true,
    async put() {
      throw new Error("Static storage is read-only. Add files to public/media and register them.");
    },
    async get() {
      return null; // served via publicUrl
    },
    async delete() {
      throw new Error("Static storage is read-only.");
    },
    publicUrl(key) {
      assertKey(key);
      return `${basePath}/${key}`;
    },
  };
}
