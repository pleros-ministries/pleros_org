import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicPreparationPost } from "@/components/sogp/public-preparation-post";
import { SharePreparationDay } from "@/components/sogp/share-preparation-day";
import { getAppSession } from "@/lib/app-session";
import {
  getOpenSogpCohort,
  getSogpEnrollmentByUserId,
} from "@/lib/db/queries/sogp";
import { getPublicPreparationPost } from "@/lib/db/queries/sogp-journey";
import { forwardUtmParams } from "@/lib/sogp/share";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

type PageProps = {
  params: Promise<{ date: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const loadPost = cache(async (date: string) => {
  if (!DATE_KEY.test(date)) return null;
  const cohort = await getOpenSogpCohort();
  if (!cohort) return null;
  return getPublicPreparationPost(cohort, date);
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { date } = await params;
  const post = await loadPost(date);
  if (!post) return { title: "Pre-SOGP" };

  const title = post.title ?? `Pre-SOGP · Day ${post.dayNumber}`;
  const description = post.introduction.slice(0, 200);
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PreparePostPage({
  params,
  searchParams,
}: PageProps) {
  const { date } = await params;
  const post = await loadPost(date);
  if (!post) notFound();

  const query = forwardUtmParams(await searchParams);
  const enrolHref = `/sogp/enrol${query ? `?${query}` : ""}`;

  const session = await getAppSession();
  const enrollment = session
    ? await getSogpEnrollmentByUserId(session.user.id)
    : null;
  const dashboardHref = enrollment
    ? `/dashboard/pre-sogp?date=${post.dateKey}`
    : null;

  return (
    <PublicPreparationPost
      dayNumber={post.dayNumber}
      title={post.title}
      countdownLabel={post.countdownLabel}
      introduction={post.introduction}
      cohortTitle={post.cohortTitle}
      enrolHref={enrolHref}
      dashboardHref={dashboardHref}
      shareBar={
        <SharePreparationDay
          dateKey={post.dateKey}
          dayLabel={`Day ${post.dayNumber}`}
          title={post.title ?? `Day ${post.dayNumber}`}
        />
      }
    />
  );
}
