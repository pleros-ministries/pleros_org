"use client";
import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SogpErrorBoundary } from "@/components/sogp/sogp-error-boundary";
import { LearningHome, PathChooser } from "./learning-home";
import { PlanEditor } from "./plan-editor";
import { ListeningPage } from "./listening-page";
import type { LearningViewData } from "@/lib/sogp/learning-view";
import styles from "./learning.module.css";

const learningQueryKey = ["sogp","learning-v3"] as const;
async function fetchLearning(): Promise<LearningViewData> {
  const response = await fetch("/api/sogp/learning",{ credentials: "same-origin",cache: "no-store" });
  if (!response.ok) throw new Error("Your learning could not load. Sign in again if your session has ended.");
  return response.json();
}
function useLearningView(initialData?: LearningViewData) {
  return useSuspenseQuery({ queryKey: learningQueryKey,queryFn: fetchLearning,initialData }).data;
}
function LearningRoute({ mode,initialData,requestedPath,requestedDay }: { mode: "home" | "path" | "plan" | "listen"; initialData?: LearningViewData; requestedPath?: "podcast_one" | "podcast_two";requestedDay?: number }) {
  const data = useLearningView(initialData);
  if (mode === "plan") return <PlanEditor data={data} requestedPath={requestedPath} />;
  if (mode === "listen") return <ListeningPage data={data} requestedDay={requestedDay} />;
  return mode === "path" ? <PathChooser data={data} /> : <LearningHome data={data} />;
}
export function LearningBoundary({ mode = "home",initialData,requestedPath,requestedDay }: { mode?: "home" | "path" | "plan" | "listen";initialData?: LearningViewData;requestedPath?: "podcast_one" | "podcast_two";requestedDay?: number }) {
  return <SogpErrorBoundary><Suspense fallback={<section className={styles.page} aria-busy="true"><h1>My SOGP</h1><p role="status">Loading your learning…</p></section>}><LearningRoute mode={mode} initialData={initialData} requestedPath={requestedPath} requestedDay={requestedDay} /></Suspense></SogpErrorBoundary>;
}
