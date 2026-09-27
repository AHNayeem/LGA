import { GridFSBucket } from "mongodb";
import { Readable } from "node:stream";
import { getDb } from "@/lib/db/client";
import { MEDIA_BUCKET } from "@/lib/db/collections";

// Stores binaries in MongoDB Atlas via GridFS. Works on Vercel (no local disk) with no
// extra infrastructure. Suited to small learner recordings; move to object storage
// if volume grows.
export function createGridFsStorage() {
  async function bucket() {
    return new GridFSBucket(await getDb(), { bucketName: MEDIA_BUCKET });
  }

  async function findFile(key) {
    const b = await bucket();
    const [file] = await b.find({ filename: String(key) }).limit(1).toArray();
    return { b, file };
  }

  return {
    name: "gridfs",
    readOnly: false,

    async put({ key, body, contentType }) {
      const b = await bucket();
      await new Promise((resolve, reject) => {
        const upload = b.openUploadStream(String(key), { metadata: { contentType } });
        Readable.from([Buffer.from(body)]).pipe(upload).on("error", reject).on("finish", resolve);
      });
      return { driver: "gridfs", key: String(key), size: body.byteLength };
    },

    async get(key) {
      const { b, file } = await findFile(key);
      if (!file) return null;
      const stream = b.openDownloadStream(file._id);
      return {
        body: Readable.toWeb(stream),
        contentType: file.metadata?.contentType ?? "application/octet-stream",
        size: file.length,
      };
    },

    async delete(key) {
      const { b, file } = await findFile(key);
      if (!file) return false;
      await b.delete(file._id);
      return true;
    },

    publicUrl() {
      return null;
    },
  };
}
