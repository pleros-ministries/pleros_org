import { WelcomePackOrientationPage } from "@/components/dashboard/welcome-pack-pages";

// Reads the session or params on every request (Cache Components).
export const instant = false;

export default function DashboardWelcomePackOrientationPage() {
  return (
    <WelcomePackOrientationPage videoSrc="/site/sogp/sogp-welcome-WaXgk9zqi78.mp4" />
  );
}
