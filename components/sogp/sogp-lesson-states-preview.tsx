"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DisciplerQuestion } from "./discipler-question";
import { SogpQuiz } from "./sogp-quiz";
import { SogpWrittenResponse } from "./sogp-written-response";
import lesson from "./sogp-lesson.module.css";

/** Synthetic adapter for states a test account rarely reaches: no API, session or database. */
const quiz = (bestScore: number | null) => ({
  dayNumber: 6,
  lessonTitle: "Baptism of the Holy Ghost",
  bestScore,
  questions: [
    { id: 1, questionType: "multiple_choice" as const, questionText: "What does the baptism of the Holy Ghost give the believer?", options: ["Power to witness", "A new name", "Wealth"] },
  ],
});
const prompt = "<ol><li>What is the difference between the indwelling and the baptism of the Holy Ghost?</li><li>What is the first sign of the baptism?</li></ol>";
const response = (dayNumber: number, status: "draft" | "submitted" | "approved" | "needs_revision" | null, reviewerNote: string | null = null) => ({
  dayNumber,
  lessonTitle: "Baptism of the Holy Ghost",
  prompt,
  submission: status ? { content: "The indwelling is the Spirit within every believer from salvation; the baptism is the Spirit coming upon us for power.", status, reviewerNote } : null,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="grid gap-3 border-t border-(--color-line) pt-5"><h2 className="m-0 text-[13px] font-medium text-(--color-text-muted)">{title}</h2>{children}</section>;
}

export function SogpLessonStatesPreview() {
  const [client] = useState(() => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    queryClient.setQueryData(["sogp", "quiz", 601], quiz(null));
    queryClient.setQueryData(["sogp", "quiz", 602], quiz(40));
    queryClient.setQueryData(["sogp", "response", 701], response(701, "draft"));
    queryClient.setQueryData(["sogp", "response", 702], response(702, "submitted"));
    queryClient.setQueryData(["sogp", "response", 703], response(703, "needs_revision", "Good start. Add a scripture for your second answer."));
    queryClient.setQueryData(["sogp", "response", 704], response(704, "approved"));
    return queryClient;
  });
  return <QueryClientProvider client={client}>
    <div className={lesson.page}>
      <Section title="Ask your discipler (learner in a group)"><DisciplerQuestion guid="sogp-lesson-preview" title="Baptism of the Holy Ghost" kind="lesson" previewRoute="discipler" /></Section>
      <Section title="Ask a question (no discipler)"><DisciplerQuestion guid="sogp-lesson-preview" title="Baptism of the Holy Ghost" kind="lesson" previewRoute="ask" /></Section>
      <Section title="Quiz result: passed"><SogpQuiz dayNumber={601} embedded previewResult={{ score: 80, passed: true }} /></Section>
      <Section title="Quiz result: not passed"><SogpQuiz dayNumber={602} embedded previewResult={{ score: 40, passed: false }} /></Section>
      <Section title="Response: draft saved"><SogpWrittenResponse dayNumber={701} embedded /></Section>
      <Section title="Response: submitted"><SogpWrittenResponse dayNumber={702} embedded /></Section>
      <Section title="Response: needs revision"><SogpWrittenResponse dayNumber={703} embedded /></Section>
      <Section title="Response: approved"><SogpWrittenResponse dayNumber={704} embedded /></Section>
    </div>
  </QueryClientProvider>;
}
