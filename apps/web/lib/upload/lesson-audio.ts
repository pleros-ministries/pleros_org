import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function deleteManagedLessonAudio(uploadKey: string | null) {
  if (!uploadKey) {
    return false;
  }

  try {
    const result = await utapi.deleteFiles(uploadKey);
    return result.success;
  } catch (error) {
    console.error("Failed to delete UploadThing lesson audio", {
      uploadKey,
      error,
    });
    return false;
  }
}
