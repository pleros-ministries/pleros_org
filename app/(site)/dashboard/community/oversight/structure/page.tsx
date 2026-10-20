import { permanentRedirect } from "next/navigation";

/** Structure is Oversight's first tab now (Pastor, 20 October); branch setup moved to `/branches`. */
export default function OversightStructurePage() {
  permanentRedirect("/dashboard/community/oversight");
}
