import { createAppIconResponse } from "@/lib/generate-app-icon";


export async function GET() {
  return createAppIconResponse(512);
}
