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

export async function deleteMediaAsset(id) {
  const _id = toObjectId(id);
  if (!_id) return false;
  const { deletedCount } = await (await media()).deleteOne({ _id });
  return deletedCount === 1;
}
