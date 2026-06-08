import type { Metadata } from "next";

import { FulfilPageView } from "../../../components/home/fulfil-page-view";

export const metadata: Metadata = {
  title: "Fulfil Purpose | Pleros",
  description:
    "Take the next step into spiritual growth and see how PPC helps you fulfil God's purpose.",
};

export default function FulfilPage() {
  return <FulfilPageView />;
}
