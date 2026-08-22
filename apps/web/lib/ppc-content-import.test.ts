import { describe, expect, it } from "vitest";

import {
  getPpcImportReadiness,
  parsePpcMcqDocument,
  parsePpcShortAnswerDocument,
  parsePpcTranscriptNotes,
} from "./ppc-content-import";

describe("parsePpcMcqDocument", () => {
  it("parses MCQs and resolves correct answers to option text", () => {
    const parsed = parsePpcMcqDocument(`
Track 1
Sample Title

Section A: MCQs

1. What is true about truth?
A. It changes
B. It is stable
C. It is consensus
D. It is unclear

2. What follows salvation
in the teaching flow?
A. Delay
B. Growth
C. Confusion
D. Silence

Section B: SAQs

Section C: Answer Key and Marking Guide

MCQs:
1. B
2. B
`);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      trackNumber: 1,
      title: "Sample Title",
    });
    expect(parsed[0].questions).toHaveLength(2);
    expect(parsed[0].questions[0]).toMatchObject({
      questionText: "What is true about truth?",
      correctAnswer: "It is stable",
      sortOrder: 1,
    });
    expect(parsed[0].questions[1]).toMatchObject({
      questionText: "What follows salvation in the teaching flow?",
      correctAnswer: "Growth",
      sortOrder: 2,
    });
  });
});

describe("parsePpcTranscriptNotes", () => {
  it("converts transcript blocks into structured HTML", () => {
    const parsed = parsePpcTranscriptNotes(`
track 2
Transcript
God’s Purpose: Why We Exist

The Universal Question of Purpose and the Necessity of Revelation

[00:00] We are looking at God's purpose.

05:00 - Discovering God's Revealed Purpose in Scripture

What has He shown us from the Word is His purpose.
`);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].trackNumber).toBe(2);
    expect(parsed[0].title).toBe("God’s Purpose: Why We Exist");
    expect(parsed[0].notesHtml).toContain("<h2>God’s Purpose: Why We Exist</h2>");
    expect(parsed[0].notesHtml).toContain(
      "<h3>The Universal Question of Purpose and the Necessity of Revelation</h3>",
    );
    expect(parsed[0].notesHtml).toContain("<h3>05:00 - Discovering God&#39;s Revealed Purpose in Scripture</h3>");
    expect(parsed[0].notesHtml).toContain("<p>What has He shown us from the Word is His purpose.</p>");
  });

  it("falls back cleanly when a track starts with timestamped content", () => {
    const parsed = parsePpcTranscriptNotes(`
track 3
00:00 – God and His Eternal Purpose

All right brothers and sisters, we are on level two.
`);

    expect(parsed[0].title).toBe("Track 3");
    expect(parsed[0].notesHtml).toContain("<h3>00:00 - God and His Eternal Purpose</h3>");
    expect(parsed[0].notesHtml).toContain(
      "<p>All right brothers and sisters, we are on level two.</p>",
    );
  });
});

describe("parsePpcShortAnswerDocument", () => {
  it("extracts response prompts and marking guides", () => {
    const parsed = parsePpcShortAnswerDocument(`
Track 4
Faith Stand: How to Grow in Christ

Section A: MCQs

Section B: SAQs

1. Explain the relationship between being a new creation and the instruction to walk in the Spirit.
Marking Scheme (4 marks):

- New creation is identity
- Walk is the required response

2. Define the process of growth as presented in the manuscript.
Marking Scheme (4 marks):

• Growth requires knowledge
• Growth produces stature

Section C: Answer Key and Marking Guide
`);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe("Faith Stand: How to Grow in Christ");
    expect(parsed[0].responsePromptHtml).toContain("<li>Explain the relationship between being a new creation and the instruction to walk in the Spirit.</li>");
    expect(parsed[0].responsePromptHtml).toContain("<li>Define the process of growth as presented in the manuscript.</li>");
    expect(parsed[0].responseMarkingGuideHtml).toContain("<strong>Marking scheme:</strong> 4 marks");
    expect(parsed[0].responseMarkingGuideHtml).toContain("<li>New creation is identity</li>");
    expect(parsed[0].responseMarkingGuideHtml).toContain("<li>Growth produces stature</li>");
  });
});

describe("getPpcImportReadiness", () => {
  it("reports ready, locked, and missing import tracks", () => {
    expect(
      getPpcImportReadiness({
        trackNumbers: [1, 2, 3, 4, 5],
        releaseTrackNumbers: [1, 2],
        audioTrackNumbers: [1, 2, 3, 4, 5],
        quizTracks: [
          { trackNumber: 1 },
          { trackNumber: 2 },
          { trackNumber: 4 },
          { trackNumber: 5 },
        ],
        responseTracks: [
          {
            trackNumber: 1,
            responsePromptHtml: "<ol><li>Question</li></ol>",
            responseMarkingGuideHtml: "<ol><li>Guide</li></ol>",
          },
          {
            trackNumber: 2,
            responsePromptHtml: "<ol><li>Question</li></ol>",
            responseMarkingGuideHtml: "<ol><li>Guide</li></ol>",
          },
          {
            trackNumber: 3,
            responsePromptHtml: "<ol><li>Question</li></ol>",
            responseMarkingGuideHtml: "<ol><li>Guide</li></ol>",
          },
          {
            trackNumber: 5,
            responsePromptHtml: "<ol><li>Question</li></ol>",
            responseMarkingGuideHtml: "<ol><li>Guide</li></ol>",
          },
        ],
        noteTracks: [
          { trackNumber: 1 },
          { trackNumber: 2 },
          { trackNumber: 3 },
          { trackNumber: 4 },
          { trackNumber: 5 },
        ],
      }),
    ).toEqual({
      readyToPublish: 2,
      completeLocked: 1,
      missingData: 2,
      tracks: [
        {
          trackNumber: 1,
          status: "ready_to_publish",
          missing: [],
        },
        {
          trackNumber: 2,
          status: "ready_to_publish",
          missing: [],
        },
        {
          trackNumber: 3,
          status: "missing_data",
          missing: ["mcqs"],
        },
        {
          trackNumber: 4,
          status: "missing_data",
          missing: ["saqs"],
        },
        {
          trackNumber: 5,
          status: "complete_locked",
          missing: [],
        },
      ],
    });
  });
});
