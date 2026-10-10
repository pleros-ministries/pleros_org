import Link from "next/link";
import { CompassIcon } from "lucide-react";

import { EmptyState, buttonPrimary } from "@/components/preview/pleros/ui";

export default function DemoNotFound() {
  return (
    <EmptyState
      icon={<CompassIcon className="size-5" aria-hidden />}
      title="That page isn't part of the demo"
      action={
        <Link href="/preview/pleros" className={buttonPrimary}>
          Back to overview
        </Link>
      }
    >
      Daily reports has three parts: devotional, ministry and meetings.
    </EmptyState>
  );
}
