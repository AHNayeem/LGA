import { collection, COLLECTIONS } from "@/lib/db/collections";
import { toObjectId } from "@/lib/validation/common";
import { RECORDING_STATUS } from "@/lib/media/recording";

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

// --- Curriculum media (admin uploads: source native | licensed) ------------------------
// Never matches learner recordings or generated TTS, whatever id is passed in.

export const CURRICULUM_UPLOAD_SOURCES = Object.freeze(["native", "licensed"]);
const UPLOADS = { source: { $in: CURRICULUM_UPLOAD_SOURCES } };

export async function findCurriculumUploadById(id) {
  const _id = toObjectId(id);
  if (!_id) return null;
  return (await media()).findOne({ _id, ...UPLOADS });
}

export async function findCurriculumUploadsByIds(ids) {
  const _ids = [...new Set(ids.map(String))].map(toObjectId).filter(Boolean);
  if (_ids.length === 0) return [];
  return (await media()).find({ _id: { $in: _ids }, ...UPLOADS }).limit(500).toArray();
}

// Admin media library. `filter` is built by mediaService from validated values only; it
// is always combined with "not a learner recording".
export async function listCurriculumMedia(filter, { page = 1, pageSize = 50 } = {}) {
  const size = Math.min(Math.max(1, pageSize), 100);
  const skip = (Math.max(1, page) - 1) * size;
  const full = { $and: [{ source: { $ne: "learner" } }, filter] };
  const c = await media();
  const [items, total] = await Promise.all([
    c.find(full, { projection: { ttsHash: 0 } }).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(size).toArray(),
    c.countDocuments(full),
  ]);
  return { items, total, page: Math.max(1, page), pageSize: size };
}

export async function updateCurriculumUpload(id, patch) {
  return (await media()).findOneAndUpdate({ _id: toObjectId(id), ...UPLOADS }, { $set: patch }, { returnDocument: "after" });
}

// Swaps the stored file only if nobody swapped it in the meantime (same old key).
export async function replaceCurriculumUploadFile(id, oldStorage, patch) {
  return (await media()).findOneAndUpdate(
    { _id: toObjectId(id), ...UPLOADS, "storage.driver": oldStorage.driver, "storage.key": oldStorage.key },
    { $set: patch },
    { returnDocument: "after" },
  );
}

export async function deleteMediaAsset(id) {
  const _id = toObjectId(id);
  if (!_id) return false;
  const { deletedCount } = await (await media()).deleteOne({ _id });
  return deletedCount === 1;
}

// --- Speaking recordings (source "learner", subdocument `recording`) ------------------
// Every query is scoped by ownerId, so one learner's id can never select another's file.

export async function findOwnRecording(ownerId, id) {
  const _id = toObjectId(id);
  const owner = toObjectId(ownerId);
  if (!_id || !owner) return null;
  return (await media()).findOne({ _id, ownerId: owner, source: "learner", recording: { $exists: true } });
}

// Recordings of one learner for one exercise, filtered by status, newest first.
export async function listRecordingsForTarget(ownerId, { exerciseId, itemId, status, excludeId } = {}) {
  const filter = { ownerId: toObjectId(ownerId), source: "learner", "recording.exerciseId": toObjectId(exerciseId) };
  if (itemId) filter["recording.itemId"] = String(itemId);
  if (status) filter["recording.status"] = status;
  if (excludeId) filter._id = { $ne: toObjectId(excludeId) };
  return (await media()).find(filter).sort({ createdAt: -1 }).limit(100).toArray();
}

// Pending -> attached, only if it still belongs to this learner and target.
export async function attachRecording(ownerId, id, { exerciseId, itemId, attemptId, now = new Date() }) {
  return (await media()).findOneAndUpdate(
    {
      _id: toObjectId(id),
      ownerId: toObjectId(ownerId),
      source: "learner",
      "recording.exerciseId": toObjectId(exerciseId),
      "recording.itemId": String(itemId),
    },
    { $set: { "recording.status": RECORDING_STATUS.attached, "recording.attemptId": toObjectId(attemptId), "recording.attachedAt": now } },
    { returnDocument: "after" },
  );
}

export async function listStalePendingRecordings({ ownerId, olderThan, limit = 100 }) {
  const filter = { source: "learner", "recording.status": RECORDING_STATUS.pending, createdAt: { $lt: olderThan } };
  if (ownerId) filter.ownerId = toObjectId(ownerId);
  return (await media()).find(filter).sort({ createdAt: 1 }).limit(Math.min(limit, 1000)).toArray();
}
