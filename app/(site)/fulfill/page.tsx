import { permanentRedirect } from "next/navigation";

export default function LegacyFulfillPage() {
  permanentRedirect("/fulfil");
}
