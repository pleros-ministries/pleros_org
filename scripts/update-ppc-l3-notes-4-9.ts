import { readFileSync } from "node:fs";
import { and, eq } from "drizzle-orm";

// Dynamic imports: tsx loads the static form as ESM and can't see the db module's named export.
// Loads the teaching notes for L3.4-L3.9 from the markdown source. Dry run by default; `--apply` writes.
// `--force` also replaces notes that are no longer the holding line.
const apply = process.argv.includes("--apply");
const force = process.argv.includes("--force");

const LEVEL_ID = 3;
const SOURCE_DOC_PATH = "tmp/ppc-l3-lessons4-9-notes.md";
const HOLDING_NOTES = "<p>Transcripts would be uploaded soon.</p>";
// Source heading -> lesson. The stored title keeps the lesson's own spelling.
const LESSONS = [
  { lessonNumber: 4, heading: "The Life of Prayer", title: "The Life of Prayer" },
  { lessonNumber: 5, heading: "Believer's Authority", title: "Believer’s Authority" },
  { lessonNumber: 6, heading: "Healing in the Newness of Life", title: "Healing in the Newness of Life" },
  { lessonNumber: 7, heading: "Natural Assignment in the Newness of Life", title: "Natural Assignment in the Newness of Life" },
  { lessonNumber: 8, heading: "Spiritual Assignment in the Newness of Life", title: "Spiritual Assignment in the Newness of Life" },
  { lessonNumber: 9, heading: "Supernatural in the Newness of Life", title: "Supernatural in the Newness of Life" },
];

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Plain text of one markdown block: drops markdown's backslash escapes and joins wrapped lines. */
function blockText(block: string) {
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\\([\\`*_{}[\]()#+\-.!>~|])/g, "$1");
}

/** Same shape as the earlier levels' notes: h2 title, h3 section headings, p paragraphs. */
function toNotesHtml(title: string, body: string) {
  const blocks = body
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  const html = [`<h2>${escapeHtml(title)}</h2>`];
  for (const block of blocks) {
    const heading = block.match(/^#{2,6}\s+(.+)$/);
    html.push(
      heading
        ? `<h3>${escapeHtml(blockText(heading[1]!))}</h3>`
        : `<p>${escapeHtml(blockText(block))}</p>`,
    );
  }
  return html.join("\n");
}

async function main() {
  const { db } = await import("../lib/db");
  const schema = await import("../lib/db/schema");

  const source = readFileSync(SOURCE_DOC_PATH, "utf8");
  const sections = new Map<string, string>();
  for (const part of source.split(/^# (?=\S)/m).filter((value) => value.trim())) {
    const newline = part.indexOf("\n");
    sections.set(part.slice(0, newline).trim(), part.slice(newline + 1));
  }

  const rows = await db.select().from(schema.lessons).where(eq(schema.lessons.levelId, LEVEL_ID));
  const plans = LESSONS.map((lesson) => {
    const body = sections.get(lesson.heading);
    const existing = rows.find((row) => row.lessonNumber === lesson.lessonNumber);
    if (!body) throw new Error(`No "${lesson.heading}" section in the source document.`);
    if (!existing) throw new Error(`Lesson L${LEVEL_ID}.${lesson.lessonNumber} not found.`);
    const isHolding = (existing.notesContent ?? "").trim() === HOLDING_NOTES;
    if (!isHolding && !force) {
      throw new Error(`L${LEVEL_ID}.${lesson.lessonNumber} already has notes; use --force to replace them.`);
    }
    const notesHtml = toNotesHtml(lesson.title, body);
    console.log(
      `L${LEVEL_ID}.${lesson.lessonNumber} ${lesson.title}: ${body.trim().split(/\s+/).length} words, ` +
        `${(notesHtml.match(/<h3>/g) ?? []).length} sections, ${(notesHtml.match(/<p>/g) ?? []).length} paragraphs, ${notesHtml.length} chars`,
    );
    return { existing, notesHtml };
  });
  if (sections.size !== LESSONS.length) {
    throw new Error(`Expected ${LESSONS.length} sections in the source, found ${sections.size}: ${[...sections.keys()].join(" | ")}`);
  }

  if (!apply) {
    console.log("[dry run] no changes written; re-run with --apply.");
    return;
  }
  for (const { existing, notesHtml } of plans) {
    await db
      .update(schema.lessons)
      .set({ notesContent: notesHtml, updatedAt: new Date() })
      .where(and(eq(schema.lessons.id, existing.id), eq(schema.lessons.levelId, LEVEL_ID)));
  }
  console.log(`Updated notes for ${plans.length} lessons.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
