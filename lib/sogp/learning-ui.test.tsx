import { expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LearningHome, PathChooser } from "@/components/sogp/learning/learning-home";
import { PlanEditor } from "@/components/sogp/learning/plan-editor";
import { ListeningPage } from "@/components/sogp/learning/listening-page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { LearningViewData } from "./learning-view";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(),refresh: vi.fn() }) }));
vi.mock("@/app/_actions/sogp-learning-actions", () => ({ chooseSogpPathAction: vi.fn(),editSogpPlanAction: vi.fn(),setSogpListenedAction: vi.fn(),saveSogpPlaybackAction: vi.fn() }));
const data: LearningViewData = { state: { path: "podcast_two", revision: 3, plan: { episodesPerDay: 2, episodeGuids: ["a","b"], historyEpisodeGuids: [] }, progress: { listenedEpisodeGuids: ["a"], playbackPositions: [] } }, episodes: [], canWrite: true,writeBlockReason: null, traditional: { completed: 2,total: 24,nextTitle: "Saved traditional lesson",resumeHref: "/dashboard/sogp/course/day/3" } };
test("resume exposes the incomplete podcast day and retains traditional tools", () => {
  const html = renderToStaticMarkup(<LearningHome data={data} />);
  expect(html).toContain('href="/dashboard/sogp/listen?day=1"');
  expect(html).toContain("1 of 2 episodes marked listened");
  expect(html).toContain('href="/dashboard/sogp/traditional"');
  expect(html).toContain('href="/dashboard/sogp/referrals"');
});
test("editor locks completed slots and exposes full-plan replacement and accessible reorder controls", () => {
  const html = renderToStaticMarkup(<QueryClientProvider client={new QueryClient()}><PlanEditor data={{ ...data,episodes: [{ guid: "a",title: "First episode",duration: "15:33",audioUrl: "" },{ guid: "b",title: "Second episode",duration: "14:13",audioUrl: "" }] }} /></QueryClientProvider>);
  expect(html).toContain("Listened · Locked");
  expect(html).toContain("Move or replace Second episode");
  expect(html).not.toContain("Move or replace First episode");
  expect(html).toContain("Save plan changes");
});
test("two-episode player shows individual completion and accessible media controls without a required quiz", () => {
  const client = new QueryClient();
  const html = renderToStaticMarkup(<QueryClientProvider client={client}><ListeningPage data={{ ...data,episodes: [{ guid: "a",title: "First episode",duration: "15:33",audioUrl: "https://example.test/a.mp3" },{ guid: "b",title: "Second episode",duration: "14:13",audioUrl: "https://example.test/b.mp3" }] }} /></QueryClientProvider>);
  expect(html).toContain("1 of 2 episodes marked listened");
  expect(html).toContain("Undo listened mark");
  expect(html).toContain("Mark listened");
  expect(html).toContain('aria-label="Play podcast"');
  expect(html).toContain("Mark both listened to complete this day.");
  expect(html).not.toContain("Take quiz");
});
test("traditional resume uses its own saved lesson, not podcast marks", () => {
  const html = renderToStaticMarkup(<LearningHome data={{ ...data,state: { ...data.state!,path: "traditional" } }} />);
  expect(html).toContain('href="/dashboard/sogp/course/day/3"');
  expect(html).toContain("2 of 24 tracks completed");
});
test("all three path choices remain available with a read-only explanation during activation rollback", () => {
  const html = renderToStaticMarkup(<QueryClientProvider client={new QueryClient()}><PathChooser data={{ ...data,canWrite: false }} /></QueryClientProvider>);
  expect((html.match(/type="radio"/g) ?? []).length).toBe(3);
  expect(html).toContain("Your existing learning remains available");
  expect(html).toContain("Both paths keep their own history");
});
test("withdrawn learners get an access explanation rather than a rollout message", () => {
  const html = renderToStaticMarkup(<QueryClientProvider client={new QueryClient()}><PathChooser data={{ ...data,canWrite: false,writeBlockReason: "withdrawn" }} /></QueryClientProvider>);
  expect(html).toContain("This enrolment is withdrawn");
  expect(html).not.toContain("not enabled here yet");
});
