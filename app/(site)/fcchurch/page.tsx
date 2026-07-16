import type { Metadata } from "next";

import { FcchurchPageView } from "../../../components/home/fcchurch-page-view";

export const metadata: Metadata = {
  title: "Fullness of Christ Church",
  description:
    "Find an FCC location near you, service times, and how to join us online.",
};

export default function FcchurchPage() {
  return <FcchurchPageView />;
}
