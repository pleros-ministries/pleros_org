export type BibleTestament = "Old Testament" | "New Testament";

export type BibleBook = {
  name: string;
  testament: BibleTestament;
  chapters: number;
};

export type BibleReadingLogInput = {
  dateKey: string;
  chaptersRead: number;
};

export type BibleReadingProjectionInput = {
  asOfDateKey: string;
  currentBook: string;
  currentChapter: number;
  logs: BibleReadingLogInput[];
};

export type BibleReadingProjection = {
  testament: BibleTestament;
  completionDateLabel: string;
  footnote: string;
};

export const BIBLE_BOOKS: BibleBook[] = [
  { name: "Genesis", testament: "Old Testament", chapters: 50 },
  { name: "Exodus", testament: "Old Testament", chapters: 40 },
  { name: "Leviticus", testament: "Old Testament", chapters: 27 },
  { name: "Numbers", testament: "Old Testament", chapters: 36 },
  { name: "Deuteronomy", testament: "Old Testament", chapters: 34 },
  { name: "Joshua", testament: "Old Testament", chapters: 24 },
  { name: "Judges", testament: "Old Testament", chapters: 21 },
  { name: "Ruth", testament: "Old Testament", chapters: 4 },
  { name: "1 Samuel", testament: "Old Testament", chapters: 31 },
  { name: "2 Samuel", testament: "Old Testament", chapters: 24 },
  { name: "1 Kings", testament: "Old Testament", chapters: 22 },
  { name: "2 Kings", testament: "Old Testament", chapters: 25 },
  { name: "1 Chronicles", testament: "Old Testament", chapters: 29 },
  { name: "2 Chronicles", testament: "Old Testament", chapters: 36 },
  { name: "Ezra", testament: "Old Testament", chapters: 10 },
  { name: "Nehemiah", testament: "Old Testament", chapters: 13 },
  { name: "Esther", testament: "Old Testament", chapters: 10 },
  { name: "Job", testament: "Old Testament", chapters: 42 },
  { name: "Psalms", testament: "Old Testament", chapters: 150 },
  { name: "Proverbs", testament: "Old Testament", chapters: 31 },
  { name: "Ecclesiastes", testament: "Old Testament", chapters: 12 },
  { name: "Song of Solomon", testament: "Old Testament", chapters: 8 },
  { name: "Isaiah", testament: "Old Testament", chapters: 66 },
  { name: "Jeremiah", testament: "Old Testament", chapters: 52 },
  { name: "Lamentations", testament: "Old Testament", chapters: 5 },
  { name: "Ezekiel", testament: "Old Testament", chapters: 48 },
  { name: "Daniel", testament: "Old Testament", chapters: 12 },
  { name: "Hosea", testament: "Old Testament", chapters: 14 },
  { name: "Joel", testament: "Old Testament", chapters: 3 },
  { name: "Amos", testament: "Old Testament", chapters: 9 },
  { name: "Obadiah", testament: "Old Testament", chapters: 1 },
  { name: "Jonah", testament: "Old Testament", chapters: 4 },
  { name: "Micah", testament: "Old Testament", chapters: 7 },
  { name: "Nahum", testament: "Old Testament", chapters: 3 },
  { name: "Habakkuk", testament: "Old Testament", chapters: 3 },
  { name: "Zephaniah", testament: "Old Testament", chapters: 3 },
  { name: "Haggai", testament: "Old Testament", chapters: 2 },
  { name: "Zechariah", testament: "Old Testament", chapters: 14 },
  { name: "Malachi", testament: "Old Testament", chapters: 4 },
  { name: "Matthew", testament: "New Testament", chapters: 28 },
  { name: "Mark", testament: "New Testament", chapters: 16 },
  { name: "Luke", testament: "New Testament", chapters: 24 },
  { name: "John", testament: "New Testament", chapters: 21 },
  { name: "Acts", testament: "New Testament", chapters: 28 },
  { name: "Romans", testament: "New Testament", chapters: 16 },
  { name: "1 Corinthians", testament: "New Testament", chapters: 16 },
  { name: "2 Corinthians", testament: "New Testament", chapters: 13 },
  { name: "Galatians", testament: "New Testament", chapters: 6 },
  { name: "Ephesians", testament: "New Testament", chapters: 6 },
  { name: "Philippians", testament: "New Testament", chapters: 4 },
  { name: "Colossians", testament: "New Testament", chapters: 4 },
  { name: "1 Thessalonians", testament: "New Testament", chapters: 5 },
  { name: "2 Thessalonians", testament: "New Testament", chapters: 3 },
  { name: "1 Timothy", testament: "New Testament", chapters: 6 },
  { name: "2 Timothy", testament: "New Testament", chapters: 4 },
  { name: "Titus", testament: "New Testament", chapters: 3 },
  { name: "Philemon", testament: "New Testament", chapters: 1 },
  { name: "Hebrews", testament: "New Testament", chapters: 13 },
  { name: "James", testament: "New Testament", chapters: 5 },
  { name: "1 Peter", testament: "New Testament", chapters: 5 },
  { name: "2 Peter", testament: "New Testament", chapters: 3 },
  { name: "1 John", testament: "New Testament", chapters: 5 },
  { name: "2 John", testament: "New Testament", chapters: 1 },
  { name: "3 John", testament: "New Testament", chapters: 1 },
  { name: "Jude", testament: "New Testament", chapters: 1 },
  { name: "Revelation", testament: "New Testament", chapters: 22 },
];

export function getBibleBook(bookName: string): BibleBook | null {
  return BIBLE_BOOKS.find((book) => book.name === bookName) ?? null;
}

export function getBibleTestament(bookName: string): BibleTestament | null {
  return getBibleBook(bookName)?.testament ?? null;
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(dateKey: string, days: number): Date {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return date;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getTestamentChapterTotal(testament: BibleTestament): number {
  return BIBLE_BOOKS.filter((book) => book.testament === testament).reduce(
    (total, book) => total + book.chapters,
    0,
  );
}

function getCompletedChaptersInTestament(
  currentBook: BibleBook,
  currentChapter: number,
): number {
  const priorChapters = BIBLE_BOOKS.filter(
    (book) =>
      book.testament === currentBook.testament &&
      BIBLE_BOOKS.indexOf(book) < BIBLE_BOOKS.indexOf(currentBook),
  ).reduce((total, book) => total + book.chapters, 0);

  return priorChapters + Math.min(Math.max(currentChapter, 1), currentBook.chapters);
}

export function buildBibleReadingProjection({
  asOfDateKey,
  currentBook,
  currentChapter,
  logs,
}: BibleReadingProjectionInput): BibleReadingProjection | null {
  const book = getBibleBook(currentBook);

  if (!book) {
    return null;
  }

  const totalChaptersRead = logs.reduce(
    (total, log) => total + Math.max(0, log.chaptersRead),
    0,
  );

  if (totalChaptersRead <= 0) {
    return null;
  }

  const sortedLogs = [...logs].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  const firstDate = parseDateKey(sortedLogs[0]?.dateKey ?? asOfDateKey);
  const asOfDate = parseDateKey(asOfDateKey);
  const elapsedMs = asOfDate.getTime() - firstDate.getTime();
  const elapsedDays = Math.max(1, Math.floor(elapsedMs / 86_400_000) + 1);
  const pace = totalChaptersRead / elapsedDays;

  if (pace <= 0) {
    return null;
  }

  const testamentTotal = getTestamentChapterTotal(book.testament);
  const completed = getCompletedChaptersInTestament(book, currentChapter);
  const remaining = Math.max(0, testamentTotal - completed);
  const daysToComplete = Math.ceil(remaining / pace);
  const completionDateLabel = formatDateLabel(addDays(asOfDateKey, daysToComplete));

  return {
    testament: book.testament,
    completionDateLabel,
    footnote: `You're on track to complete the ${book.testament} on ${completionDateLabel} at this pace.`,
  };
}
