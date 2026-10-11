import { notFound } from "next/navigation";
import { DestinationView } from "@/components/preview/pleros/destination-view";
import { unavailableDestinations } from "@/lib/preview/pleros/navigation";

export default async function DestinationPage({ params }: { params: Promise<{ destination: string }> }) {
  const { destination } = await params;
  const item = unavailableDestinations.find((candidate) => candidate.key === destination);
  if (!item) notFound();
  return <DestinationView title={item.label} />;
}
