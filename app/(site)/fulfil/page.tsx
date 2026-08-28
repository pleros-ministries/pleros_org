import type { Metadata } from "next";

import { FulfillPageView } from "../../../components/home/fulfill-page-view";

export const metadata: Metadata = {
  title: "Fulfil Purpose",
  description:
    "Take the next step into spiritual growth and see how SOGP helps you fulfil God's purpose.",
};

export default function FulfilPage() {
  return <FulfillPageView />;
}
