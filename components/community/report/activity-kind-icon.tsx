import {
  BookOpenIcon,
  ChurchIcon,
  HeartHandshakeIcon,
  MegaphoneIcon,
  SparklesIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import type { ActivityKind } from "@/lib/community/ministry-activities";

export const ACTIVITY_KIND_ICONS: Record<ActivityKind, LucideIcon> = {
  outreach: MegaphoneIcon,
  teaching_meeting: BookOpenIcon,
  prayer_meeting: HeartHandshakeIcon,
  follow_up: UsersIcon,
  church_service: ChurchIcon,
  other: SparklesIcon,
};

export function ActivityKindIcon({
  kind,
  className = "size-4",
}: {
  kind: ActivityKind;
  className?: string;
}) {
  const Icon = ACTIVITY_KIND_ICONS[kind];
  return <Icon className={className} strokeWidth={2} aria-hidden />;
}
