"use client";
import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { DashboardHomeView } from "@/components/dashboard/v3/home-view";
import { LearningHub } from "@/components/sogp/learning/learning-hub";
import { PathChooser } from "@/components/sogp/learning/path-chooser";
import { PlanEditor } from "@/components/sogp/learning/plan-editor";
import { isPlanPath } from "@/lib/sogp/learning-input";

import { DEMO_NAME, DEMO_ROUTES, demoHome, demoHub, demoLearning } from "./demo-data";
import { useDemo } from "./demo-shell";

const subscribe = () => () => undefined;

/**
 * One of the tour's four pages, the real component on the demo's sample data.
 * Drawn in the browser only: the sample dates count from today, and nothing
 * here comes from the server.
 */
export function DemoScreen({ screen }: { screen: "home" | "choose" | "plan" | "learning" }) {
  const browser = useSyncExternalStore(subscribe, () => true, () => false);
  const { arrival, state } = useDemo();
  const router = useRouter();
  const data = demoLearning(arrival, state);
  // Like the real plan page: no plan path saved yet means choosing one first.
  const needsPath = screen === "plan" && !isPlanPath(state?.path);
  useEffect(() => { if (needsPath) router.replace(DEMO_ROUTES.choose); }, [needsPath, router]);

  if (!browser) return null;
  if (screen === "home") return <DashboardHomeView name={DEMO_NAME} greeting="Good morning" data={demoHome(state)} />;
  if (screen === "choose") return <PathChooser key={state?.revision ?? 0} data={data} />;
  if (screen === "plan") return needsPath ? null : <PlanEditor key={state?.path} data={data} />;
  return <LearningHub hub={demoHub(state)} learning={data} />;
}
