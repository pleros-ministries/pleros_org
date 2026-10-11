"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { PanelsTopLeftIcon } from "lucide-react";

import { unavailableDestinations } from "@/lib/preview/pleros/navigation";

import { useDemo } from "./demo-context";
import { EmptyState, PageHeader, buttonSecondary } from "./ui";
import {
  AskDestination,
  DiscipleshipDiscussionsDestination,
  FeedDestination,
  GroupsDestination,
  LocationGroupDestination,
  MessagesDestination,
} from "./destinations/community";
import { PodcastDestination, PodcastLeaderboardDestination, PrayerWatchDestination } from "./destinations/devotion";
import { ChurchDestination, PartnershipDestination, ReportHistoryDestination } from "./destinations/personal";
import {
  CertificateDestination,
  DiscipleshipJourneyDestination,
  PreSogpDestination,
  ReferralsDestination,
  SogpCourseDestination,
  SogpLeaderboardDestination,
} from "./destinations/training";
import {
  AudiobookDestination,
  GiftsDestination,
  JoinDestination,
  OrientationDestination,
  RemindersDestination,
  WelcomePackDestination,
} from "./destinations/welcome";

/** Every mapped destination's synthetic screen, keyed by its navigation key. */
const SCREENS: Record<string, ComponentType> = {
  "report-history": ReportHistoryDestination,
  partnership: PartnershipDestination,
  "prayer-watch": PrayerWatchDestination,
  podcast: PodcastDestination,
  "podcast-leaderboard": PodcastLeaderboardDestination,
  "pre-sogp": PreSogpDestination,
  "sogp-course": SogpCourseDestination,
  "sogp-leaderboard": SogpLeaderboardDestination,
  "sogp-certificate": CertificateDestination,
  "sogp-referrals": ReferralsDestination,
  "discipleship-journey": DiscipleshipJourneyDestination,
  feed: FeedDestination,
  "location-group": LocationGroupDestination,
  groups: GroupsDestination,
  messages: MessagesDestination,
  ask: AskDestination,
  "discipleship-discussions": DiscipleshipDiscussionsDestination,
  "welcome-pack": WelcomePackDestination,
  join: JoinDestination,
  orientation: OrientationDestination,
  gifts: GiftsDestination,
  audiobook: AudiobookDestination,
  reminders: RemindersDestination,
  church: ChurchDestination,
};

export function DestinationView({ title }: { title: string }) {
  const { href, viewer } = useDemo();
  const key = unavailableDestinations.find((item) => item.label === title)?.key;
  const Screen = key ? SCREENS[key] : undefined;
  // Local demo state (posts, messages, ticks) belongs to the person being viewed as.
  if (Screen) return <Screen key={viewer.id} />;
  return (
    <div className="grid gap-6">
      <PageHeader title={title} />
      <EmptyState icon={<PanelsTopLeftIcon className="size-5" aria-hidden />} title="Choose another page" action={<Link href={href("")} className={buttonSecondary}>Back to overview</Link>} />
    </div>
  );
}
