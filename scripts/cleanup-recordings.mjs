// Usage: bun run media:cleanup
// Removes speaking recordings that were uploaded but never submitted with an attempt
// (older than 24 hours). Uploads already clean up the uploading learner's own stale
// takes; this sweeps learners who never came back. Safe to run on a schedule.
import { closeClient } from "@/lib/db/client";
import { cleanupStaleRecordings } from "@/lib/services/recordingService";

try {
  let total = 0;
  for (;;) {
    const { removed } = await cleanupStaleRecordings({ limit: 500 });
    total += removed;
    if (removed < 500) break;
  }
  console.log(`Removed ${total} stale unsubmitted recording(s).`);
} catch (err) {
  console.error("media:cleanup failed:", err.message);
  process.exitCode = 1;
} finally {
  await closeClient();
}
