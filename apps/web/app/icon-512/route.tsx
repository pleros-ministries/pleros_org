import { createAppIconResponse } from "@/lib/generate-app-icon";

export const runtime = "nodejs";

export async function GET() {
  return createAppIconResponse(512);
}
