import { createRouteHandler } from "uploadthing/next";
import { uploadRouter } from "@/lib/upload/uploadthing";

export const { GET, POST } = createRouteHandler({ router: uploadRouter });
