import type { Metadata } from "next";

import { FulfillPageView } from "../../../components/home/fulfill-page-view";

export const metadata: Metadata = {
  title: "Fulfill Purpose",
  description:
    "Take the next step into spiritual growth and see how PPC helps you fulfill God's purpose.",
};

export default function FulfillPage() {
  return <FulfillPageView />;
}
