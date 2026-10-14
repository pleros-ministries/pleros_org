"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SogpDayView } from "./sogp-day-view";

/** Synthetic adapter: seeds the day query so no API or session is used. */
const track = (dayNumber: number, title: string, done: boolean) => ({ id: dayNumber, dayNumber, weekNumber: Math.ceil(dayNumber / 6), isRequired: true, liveSessionNumber: null, releaseAt: "2026-10-01T05:00:00Z",
  lesson: { id: dayNumber, title, audioUrl: null, notesContent: dayNumber === 8 ? "<h3>Faith begins with the Word</h3><p>Hear, trust and act on God’s Word in everyday life.</p>" : null, responsePrompt: null },
  progress: { audioListened: done, notesRead: done, quizPassed: done, writtenApproved: false }, completed: done, accessible: dayNumber <= 9 });
export function SogpLessonPreview() {
  const [client] = useState(() => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    const tracks = Array.from({ length: 24 }, (_, index) => track(index + 1, index === 7 ? "The life of faith" : `Track ${index + 1}`, index < 7));
    queryClient.setQueryData(["sogp", "day", 8], { dashboard: { cohort: { title: "October cohort", telegramDiscussionUrl: "https://t.me/example", telegramChannelUrl: null, telegramBotUsername: null }, tracks }, track: tracks[7], previousDay: tracks[6], nextDay: tracks[8], bestQuizScore: null, submission: null, generatedAt: "2026-10-13T08:00:00Z" });
    return queryClient;
  });
  return <QueryClientProvider client={client}><SogpDayView dayNumber={8} /></QueryClientProvider>;
}
