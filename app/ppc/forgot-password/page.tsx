import { permanentRedirect } from "next/navigation";

export default function RetiredPpcForgotPasswordPage() {
  permanentRedirect("/forgot-password");
}
