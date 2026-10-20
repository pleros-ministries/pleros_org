import { permanentRedirect } from "next/navigation";

// Reads the session or params on every request (Cache Components).
export const instant = false;

/** Structure is Oversight's first tab now (Pastor, 20 October); branch setup moved to `/branches`. */
export default function OversightStructurePage() {
  permanentRedirect("/dashboard/community/oversight");
}
