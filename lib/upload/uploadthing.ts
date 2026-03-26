import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getAppSession } from "@/lib/app-session";

const f = createUploadthing();

export const uploadRouter = {
  audioUploader: f({
    audio: { maxFileSize: "64MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await getAppSession();
      if (!session || (session.user.role !== "admin" && session.user.role !== "instructor")) {
        throw new Error("Unauthorized");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(({ file }) => {
      return {
        url: file.ufsUrl,
        uploadKey: file.key,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
      };
    }),
} satisfies FileRouter;

export type AppFileRouter = typeof uploadRouter;
