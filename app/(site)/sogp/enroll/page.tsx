import { permanentRedirect } from "next/navigation";

export default function LegacySogpEnrollPage() {
  permanentRedirect("/sogp/enrol");
}
