type TrackBlock = {
  trackNumber: number;
  body: string;
};

export type ParsedPpcMcqQuestion = {
  questionText: string;
  options: string[];
  correctAnswer: string;
  sortOrder: number;
};

export type ParsedPpcTrackQuiz = {
  trackNumber: number;
  title: string;
  questions: ParsedPpcMcqQuestion[];
};

export type ParsedPpcTrackResponse = {
  trackNumber: number;
  title: string;
  responsePromptHtml: string | null;
  responseMarkingGuideHtml: string | null;
};

export type ParsedPpcTrackNotes = {
  trackNumber: number;
  title: string;
  notesHtml: string;
};

type TrackNumberSource = {
  trackNumber: number;
};

type ResponseTrackNumberSource = TrackNumberSource & {
  responsePromptHtml?: string | null;
  responseMarkingGuideHtml?: string | null;
};

type PpcImportReadinessInput = {
  trackNumbers: number[];
  releaseTrackNumbers: number[];
  audioTrackNumbers: number[];
  quizTracks: TrackNumberSource[];
  responseTracks: ResponseTrackNumberSource[];
  noteTracks: TrackNumberSource[];
};

type PpcImportMissingPart = "audio" | "mcqs" | "saqs" | "notes";

type PpcImportReadinessStatus =
  | "ready_to_publish"
  | "complete_locked"
  | "missing_data";

function normalizeText(text: string) {
  return text.replace(/\uFEFF/g, "").replace(/\r\n?/g, "\n");
}

function splitTrackBlocks(text: string): TrackBlock[] {
  const normalized = normalizeText(text);
  const matches = [...normalized.matchAll(/^track\s+(\d+)\s*$/gim)];

  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? normalized.length;
    const trackNumber = Number(match[1]);
    const body = normalized.slice(start + match[0].length, end).trim();

    return { trackNumber, body };
  });
}

function getFirstMeaningfulLine(lines: string[]) {
  return (
    lines.find((line) => {
      const trimmed = line.trim();
      return (
        trimmed.length > 0 &&
        trimmed.toLowerCase() !== "questions" &&
        trimmed.toLowerCase() !== "transcript"
      );
    }) ?? ""
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function titleCaseTrackTitle(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function toTrackNumberSet(tracks: TrackNumberSource[] | number[]) {
  return new Set(
    tracks.map((track) =>
      typeof track === "number" ? track : track.trackNumber,
    ),
  );
}

export function getPpcImportReadiness(input: PpcImportReadinessInput) {
  const releaseSet = new Set(input.releaseTrackNumbers);
  const audioSet = new Set(input.audioTrackNumbers);
  const quizSet = toTrackNumberSet(input.quizTracks);
  const noteSet = toTrackNumberSet(input.noteTracks);
  const responseSet = new Set(
    input.responseTracks
      .filter(
        (track) =>
          Boolean(track.responsePromptHtml?.trim()) &&
          Boolean(track.responseMarkingGuideHtml?.trim()),
      )
      .map((track) => track.trackNumber),
  );

  const tracks = input.trackNumbers.map((trackNumber) => {
    const missing: PpcImportMissingPart[] = [];

    if (!audioSet.has(trackNumber)) missing.push("audio");
    if (!quizSet.has(trackNumber)) missing.push("mcqs");
    if (!responseSet.has(trackNumber)) missing.push("saqs");
    if (!noteSet.has(trackNumber)) missing.push("notes");

    const status: PpcImportReadinessStatus =
      missing.length > 0
        ? "missing_data"
        : releaseSet.has(trackNumber)
          ? "ready_to_publish"
          : "complete_locked";

    return {
      trackNumber,
      status,
      missing,
    };
  });

  return {
    readyToPublish: tracks.filter(
      (track) => track.status === "ready_to_publish",
    ).length,
    completeLocked: tracks.filter((track) => track.status === "complete_locked")
      .length,
    missingData: tracks.filter((track) => track.status === "missing_data")
      .length,
    tracks,
  };
}

function parseAnswerKey(block: string) {
  const answersSectionMatch = block.match(/MCQs:\s*([\s\S]*?)(?:SAQs:|$)/i);
  if (!answersSectionMatch) {
    throw new Error("Could not find MCQ answer key section.");
  }

  const answerMap = new Map<number, string>();

  for (const line of answersSectionMatch[1].split("\n")) {
    const match = line.trim().match(/^(\d+)\.\s*([A-D])$/);
    if (!match) continue;
    answerMap.set(Number(match[1]), match[2]);
  }

  return answerMap;
}

function finalizeMcqQuestion(
  questions: Array<{
    questionTextParts: string[];
    options: string[];
  }>,
  current: {
    questionTextParts: string[];
    options: string[];
  } | null,
) {
  if (!current) return;

  questions.push({
    questionTextParts: current.questionTextParts
      .map((part) => part.trim())
      .filter(Boolean),
    options: current.options.map((option) => option.trim()).filter(Boolean),
  });
}

export function parsePpcMcqDocument(
  text: string,
  trackNumbers?: number[],
): ParsedPpcTrackQuiz[] {
  const allowedTrackNumbers = trackNumbers ? new Set(trackNumbers) : null;

  return splitTrackBlocks(text)
    .filter((trackBlock) =>
      allowedTrackNumbers ? allowedTrackNumbers.has(trackBlock.trackNumber) : true,
    )
    .map((trackBlock) => {
    const lines = trackBlock.body.split("\n");
    const title = titleCaseTrackTitle(getFirstMeaningfulLine(lines));
    const mcqSectionMatch = trackBlock.body.match(
      /Section A:\s*MCQs\s*([\s\S]*?)Section B:\s*SAQs/i,
    );

    if (!mcqSectionMatch) {
      throw new Error(`Could not find MCQ section for track ${trackBlock.trackNumber}.`);
    }

    const answerMap = parseAnswerKey(trackBlock.body);
    const parsedQuestions: Array<{
      questionTextParts: string[];
      options: string[];
    }> = [];
    let currentQuestion: {
      questionTextParts: string[];
      options: string[];
    } | null = null;

    for (const rawLine of mcqSectionMatch[1].split("\n")) {
      const line = rawLine.trim();
      if (!line) continue;

      const questionMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (questionMatch) {
        finalizeMcqQuestion(parsedQuestions, currentQuestion);
        currentQuestion = {
          questionTextParts: [questionMatch[2]],
          options: [],
        };
        continue;
      }

      const optionMatch = line.match(/^([A-D])\.\s+(.+)$/);
      if (optionMatch) {
        if (!currentQuestion) {
          throw new Error(
            `Encountered option before question in track ${trackBlock.trackNumber}.`,
          );
        }
        currentQuestion.options.push(optionMatch[2]);
        continue;
      }

      if (!currentQuestion) {
        continue;
      }

      if (currentQuestion.options.length === 0) {
        currentQuestion.questionTextParts.push(line);
      } else {
        const lastIndex = currentQuestion.options.length - 1;
        currentQuestion.options[lastIndex] = `${currentQuestion.options[lastIndex]} ${line}`;
      }
    }

    finalizeMcqQuestion(parsedQuestions, currentQuestion);

    const questions = parsedQuestions.map((question, index) => {
      if (question.options.length !== 4) {
        throw new Error(
          `Track ${trackBlock.trackNumber} question ${index + 1} does not have 4 options.`,
        );
      }

      const answerLetter = answerMap.get(index + 1);
      if (!answerLetter) {
        throw new Error(
          `Missing answer key for track ${trackBlock.trackNumber} question ${index + 1}.`,
        );
      }

      const answerIndex = answerLetter.charCodeAt(0) - "A".charCodeAt(0);
      const correctAnswer = question.options[answerIndex];
      if (!correctAnswer) {
        throw new Error(
          `Answer key ${answerLetter} is invalid for track ${trackBlock.trackNumber} question ${index + 1}.`,
        );
      }

      return {
        questionText: collapseWhitespace(question.questionTextParts.join(" ")),
        options: question.options.map((option) => collapseWhitespace(option)),
        correctAnswer,
        sortOrder: index + 1,
      };
    });

    return {
      trackNumber: trackBlock.trackNumber,
      title,
      questions,
    };
  });
}

type ParsedSaqItem = {
  questionText: string;
  markingSchemeLabel: string;
  markingPoints: string[];
};

function parseSaqItems(block: string, trackNumber: number) {
  const saqSectionMatch = block.match(
    /Section B:\s*SAQs\s*([\s\S]*?)Section C:\s*Answer Key and Marking Guide/i,
  );

  if (!saqSectionMatch) {
    throw new Error(`Could not find SAQ section for track ${trackNumber}.`);
  }

  const items: ParsedSaqItem[] = [];
  const matches = [
    ...saqSectionMatch[1].matchAll(
      /(?:^|\n)\s*(\d+)\.\s+([\s\S]*?)Marking Scheme\s*\(([^)]+)\):\s*([\s\S]*?)(?=(?:\n\s*\d+\.\s+)|$)/g,
    ),
  ];

  for (const match of matches) {
    const questionText = collapseWhitespace(match[2]);
    const markingSchemeLabel = collapseWhitespace(match[3]);
    const markingPoints = match[4]
      .split("\n")
      .map((line) => line.replace(/^[\s•\-–]+/, "").trim())
      .filter(Boolean)
      .map(collapseWhitespace);

    items.push({
      questionText,
      markingSchemeLabel,
      markingPoints,
    });
  }

  return items;
}

export function parsePpcShortAnswerDocument(
  text: string,
  trackNumbers?: number[],
): ParsedPpcTrackResponse[] {
  const allowedTrackNumbers = trackNumbers ? new Set(trackNumbers) : null;

  return splitTrackBlocks(text)
    .filter((trackBlock) =>
      allowedTrackNumbers ? allowedTrackNumbers.has(trackBlock.trackNumber) : true,
    )
    .map((trackBlock) => {
      const lines = trackBlock.body.split("\n");
      const title = titleCaseTrackTitle(getFirstMeaningfulLine(lines));
      const items = parseSaqItems(trackBlock.body, trackBlock.trackNumber);

      if (items.length === 0) {
        return {
          trackNumber: trackBlock.trackNumber,
          title,
          responsePromptHtml: null,
          responseMarkingGuideHtml: null,
        };
      }

      const responsePromptHtml = [
        `<h2>${escapeHtml(title)}</h2>`,
        "<ol>",
        ...items.map((item) => `<li>${escapeHtml(item.questionText)}</li>`),
        "</ol>",
      ].join("\n");

      const responseMarkingGuideHtml = [
        `<h2>${escapeHtml(title)} marking guide</h2>`,
        "<ol>",
        ...items.map((item) => {
          const points = item.markingPoints.length
            ? `<ul>\n${item.markingPoints
                .map((point) => `<li>${escapeHtml(point)}</li>`)
                .join("\n")}\n</ul>`
            : "";

          return [
            "<li>",
            `<p>${escapeHtml(item.questionText)}</p>`,
            `<p><strong>Marking scheme:</strong> ${escapeHtml(item.markingSchemeLabel)}</p>`,
            points,
            "</li>",
          ]
            .filter(Boolean)
            .join("\n");
        }),
        "</ol>",
      ].join("\n");

      return {
        trackNumber: trackBlock.trackNumber,
        title,
        responsePromptHtml,
        responseMarkingGuideHtml,
      };
    });
}

function buildNotesParagraphs(blockBody: string) {
  const paragraphs = normalizeText(blockBody)
    .split(/\n\s*\n/g)
    .map((paragraph) =>
      paragraph
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join(" "),
    )
    .filter(Boolean);

  const pieces: string[] = [];

  for (const paragraph of paragraphs) {
    const lowered = paragraph.toLowerCase();
    if (lowered === "questions" || lowered === "transcript") {
      continue;
    }

    if (
      lowered.startsWith("here is the transcript with thematic sectional headings")
    ) {
      continue;
    }

    if (/^track\s+\d+\s*[-–]\s*/i.test(paragraph)) {
      continue;
    }

    const timestampMatch = paragraph.match(
      /^\[?(\d{2}:\d{2}(?::\d{2})?)\]?\s*[-–]?\s*(.*)$/,
    );
    if (timestampMatch && paragraph.length <= 160) {
      const label = timestampMatch[2].trim();
      pieces.push(
        `<h3>${escapeHtml(label ? `${timestampMatch[1]} - ${label}` : timestampMatch[1])}</h3>`,
      );
      continue;
    }

    if (
      !/[.!?]$/.test(paragraph) &&
      paragraph.length <= 120 &&
      !paragraph.includes(": ")
    ) {
      pieces.push(`<h3>${escapeHtml(paragraph)}</h3>`);
      continue;
    }

    pieces.push(`<p>${escapeHtml(paragraph)}</p>`);
  }

  return pieces.join("\n");
}

export function parsePpcTranscriptNotes(
  text: string,
  trackNumbers?: number[],
): ParsedPpcTrackNotes[] {
  const allowedTrackNumbers = trackNumbers ? new Set(trackNumbers) : null;

  return splitTrackBlocks(text)
    .filter((trackBlock) =>
      allowedTrackNumbers ? allowedTrackNumbers.has(trackBlock.trackNumber) : true,
    )
    .map((trackBlock) => {
    const lines = trackBlock.body
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    let title = "";
    const titleCandidate = getFirstMeaningfulLine(lines);
    if (/^track\s+\d+\s*[-–]\s*/i.test(titleCandidate)) {
      title = titleCaseTrackTitle(
        titleCandidate.replace(/^track\s+\d+\s*[-–]\s*/i, ""),
      );
    } else if (/^\[?\d{2}:\d{2}(?::\d{2})?\]?/.test(titleCandidate)) {
      title = `Track ${trackBlock.trackNumber}`;
    } else {
      title = titleCaseTrackTitle(titleCandidate || `Track ${trackBlock.trackNumber}`);
    }

    const notesHtml = [
      `<h2>${escapeHtml(title)}</h2>`,
      buildNotesParagraphs(trackBlock.body),
    ]
      .filter(Boolean)
      .join("\n");

      return {
        trackNumber: trackBlock.trackNumber,
        title,
        notesHtml,
      };
    });
}
