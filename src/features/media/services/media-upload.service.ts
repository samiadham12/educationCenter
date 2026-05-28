import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { Media, type IMedia } from "@/features/media/models/Media.model";
import { localFileExists } from "@/shared/lib/local-storage";
import { getR2Bucket, isR2Usable } from "@/shared/lib/r2";
import { getR2Client } from "@/shared/lib/r2-client";

export async function uploadedMediaFileExists(
  media: Pick<IMedia, "fileKey" | "storageProvider">,
): Promise<boolean> {
  if (await localFileExists(media.fileKey)) {
    return true;
  }

  const provider = media.storageProvider ?? "r2";
  if (provider === "local" || !isR2Usable()) {
    return false;
  }

  try {
    await getR2Client().send(
      new HeadObjectCommand({
        Bucket: getR2Bucket(),
        Key: media.fileKey,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Fixes orphan PENDING rows (presign without successful upload/confirm).
 * - No file on disk/R2 → FAILED
 * - File present but still PENDING → kick off processing once
 */
/** Retry FAILED video/audio when the source file still exists. */
export async function reconcileFailedMedia(
  lectureId?: string,
): Promise<void> {
  const filter = {
    uploadStatus: "FAILED" as const,
    fileType: { $in: ["VIDEO", "AUDIO"] as const },
    ...(lectureId ? { lectureId } : {}),
  };

  const failed = await Media.find(filter).lean();
  for (const record of failed) {
    const id = String(record._id);
    const exists = await uploadedMediaFileExists(record);
    if (!exists) continue;

    const updated = await Media.findOneAndUpdate(
      { _id: record._id, uploadStatus: "FAILED" },
      { uploadStatus: "PROCESSING", $unset: { hlsManifestKey: 1 } },
      { new: true },
    );

    if (updated) {
      const { processMediaAfterUpload } = await import("./transcode.service");
      void processMediaAfterUpload(id);
    }
  }
}

export async function reconcilePendingMedia(
  lectureId?: string,
): Promise<void> {
  const filter = {
    uploadStatus: "PENDING" as const,
    ...(lectureId ? { lectureId } : {}),
  };

  const pending = await Media.find(filter).lean();
  for (const record of pending) {
    const id = String(record._id);
    const exists = await uploadedMediaFileExists(record);

    if (!exists) {
      await Media.findOneAndUpdate(
        { _id: record._id, uploadStatus: "PENDING" },
        { uploadStatus: "FAILED" },
      );
      continue;
    }

    const updated = await Media.findOneAndUpdate(
      { _id: record._id, uploadStatus: "PENDING" },
      { uploadStatus: "PROCESSING" },
      { new: true },
    );

    if (updated) {
      const { processMediaAfterUpload } = await import(
        "./transcode.service"
      );
      void processMediaAfterUpload(id);
    }
  }
}
