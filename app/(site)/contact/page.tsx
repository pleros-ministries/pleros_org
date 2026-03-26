import type { Metadata } from "next";

import { ContactPageView } from "../../../components/home/contact-page-view";

export const metadata: Metadata = {
  title: "Contact Us | Pleros",
  description:
    "Reach out to Pleros Ministries and Missions for your next step and spiritual journey.",
};

export default function ContactPage() {
  return <ContactPageView />;
}
