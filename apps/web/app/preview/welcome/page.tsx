import { WelcomeLandingPage } from "@/components/home/welcome-landing-page";

export const metadata = {
  title: "Welcome page preview",
};

export default function WelcomePreviewPage() {
  return <WelcomeLandingPage hasWelcomeAccess={false} />;
}
