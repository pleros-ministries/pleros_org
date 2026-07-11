import { ThankYouPage } from "@/components/home/thank-you-page";

export default async function ThankYouRoute() {
  return <ThankYouPage downloadUrl="/api/welcome-pack/download" />;
}
