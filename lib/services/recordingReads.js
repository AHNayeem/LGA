import { RECORDING_STATUS } from "@/lib/media/recording";
import { publicMediaView } from "@/lib/services/mediaService";
import * as mediaRepo from "@/lib/repositories/mediaAssetRepository";

// Read side of speaking recordings, kept apart from recordingService so the lesson
// reader (curriculumService) can use it without an import cycle.

// Latest submitted recording per item, for the learner's own playback.
// Returns { [exerciseId]: { [itemId]: publicMediaView } }.
export async function listOwnRecordings(actorId, exerciseIds) {
  const out = {};
  for (const exerciseId of exerciseIds) {
    const docs = await mediaRepo.listRecordingsForTarget(actorId, { exerciseId, status: RECORDING_STATUS.attached });
    const byItem = {};
    for (const d of docs) byItem[d.recording.itemId] ??= publicMediaView(d); // newest first
    if (Object.keys(byItem).length) out[String(exerciseId)] = byItem;
  }
  return out;
}
