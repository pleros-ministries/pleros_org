import { permanentRedirect } from "next/navigation";

export default function RetiredPpcLoginPage() {
  permanentRedirect("/login");
}
