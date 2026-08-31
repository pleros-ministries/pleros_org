import { permanentRedirect } from "next/navigation";

export default function LegacySignUpPage() {
  permanentRedirect("/signup");
}
