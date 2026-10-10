"use client";

import Link from "next/link";
import { PanelsTopLeftIcon } from "lucide-react";
import { useDemo } from "./demo-context";
import { EmptyState, PageHeader, buttonSecondary } from "./ui";

export function DestinationView({ title }: { title: string }) {
  const { href } = useDemo();
  return (
    <div className="grid gap-6">
      <PageHeader title={title} />
      <EmptyState icon={<PanelsTopLeftIcon className="size-5" aria-hidden />} title="Not included in this demo" action={<Link href={href("")} className={buttonSecondary}>Back to overview</Link>} />
    </div>
  );
}
