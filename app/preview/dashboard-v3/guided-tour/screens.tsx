"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DashboardHomeView } from "@/components/dashboard/v3/home-view";
import { LearningHub } from "@/components/sogp/learning/learning-hub";
import { PathChooser } from "@/components/sogp/learning/path-chooser";
import { PlanEditor } from "@/components/sogp/learning/plan-editor";

import { HUB, home, learningView, type Arrival, type TourPath } from "./sample";

export type Screen = "home" | "choose" | "plan-podcast" | "plan-doctrinal" | `learning-${TourPath}` | `home-${TourPath}`;

/** The real dashboard screens on sample data, one per tour stop. Nothing saves. */
export function TourScreens({ screen, arrival }: { screen: Screen; arrival: Arrival }) {
  const [client] = useState(() => new QueryClient());
  const data = learningView(arrival);
  const name = "Sam";
  const view = screen === "home" ? <DashboardHomeView name={name} greeting="Good morning" data={home(null)} />
    : screen === "choose" ? <PathChooser data={data} />
    : screen === "plan-podcast" ? <PlanEditor data={data} requestedPath="podcast_two" />
    : screen === "plan-doctrinal" ? <PlanEditor data={data} requestedPath="doctrinal" />
    : screen.startsWith("learning-") ? <LearningHub hub={HUB[screen.slice(9) as TourPath]} learning={data} />
    : <DashboardHomeView name={name} greeting="Good morning" data={home(screen.slice(5) as TourPath)} />;
  return <QueryClientProvider client={client}>{view}</QueryClientProvider>;
}
