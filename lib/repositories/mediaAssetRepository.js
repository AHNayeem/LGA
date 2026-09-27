import { collection, COLLECTIONS } from "@/lib/db/collections";
import { toObjectId } from "@/lib/validation/common";

const media = () => collection(COLLECTIONS.mediaAssets);

export async function insertMediaAsset(doc) {
  const { insertedId } = await (await media()).insertOne(doc);
  return { ...doc, _id: insertedId };
}

export async function findMediaAssetById(id) {
  const _id = toObjectId(id);
  if (!_id) return null;
  return (await media()).findOne({ _id });
}

export async function findTtsAssetsByHashes(hashes) {
  const list = [...new Set(hashes.map(String))];
  if (list.length === 0) return [];
  return (await media())
    .find({ ttsHash: { $in: list } }, { projection: { ttsHash: 1 } })
    .limit(1000)
    .toArray();
}

// Generated audio is identified by its cue hash; re-registering updates the record.
export async function upsertTtsAsset(doc) {
  const { ttsHash, createdAt, ...rest } = doc;
  return (await media()).findOneAndUpdate(
    { ttsHash },
    { $set: { ...rest, ttsHash }, $setOnInsert: { createdAt: createdAt ?? new Date() } },
    { upsert: true, returnDocument: "after" },
  );
}

export async function deleteMediaAsset(id) {
  const _id = toObjectId(id);
  if (!_id) return false;
  const { deletedCount } = await (await media()).deleteOne({ _id });
  return deletedCount === 1;
}
