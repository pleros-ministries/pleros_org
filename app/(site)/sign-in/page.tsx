import { permanentRedirect } from "next/navigation";

export default function LegacySignInPage() {
  permanentRedirect("/login");
}
