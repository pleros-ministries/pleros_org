import type { Metadata } from "next";
import { connection } from "next/server";

import { ContactPageView } from "../../../components/home/contact-page-view";


export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Reach out to Pleros Ministries and Missions for your next step and spiritual journey.",
};

// Was force-dynamic: the form stamps its start time per request.
export const instant = false;

export default async function ContactPage() {
  await connection();
  return <ContactPageView />;
}
