# PPC level 2 import contract

Use this when the remaining level 2 question data is ready.

## Current release scope

- Level 1 tracks 1-5 are published.
- Level 2 tracks 1-2 are published.
- Level 2 tracks 3-11 stay draft/locked until their MCQs and SAQs are imported and reviewed.
- Level 3 stays draft/locked.

## Source files expected by the importer

| Source | Path |
|--------|------|
| Level 2 questions, MCQs, SAQs, marking schemes | `tmp/ppc-l2-questions.txt` |
| Level 2 transcript notes | `tmp/ppc-l2-notes.txt` |
| Level 2 audio manifest | `docs/level-2-ppc-teachings.json` |

Each question track should use this structure:

```text
Track 3
Lesson title

Section A: MCQs

1. Question text
A. Option
B. Option
C. Option
D. Option

Section B: SAQs

1. Short-answer question text.
Marking Scheme (4 marks):

- Marking point
- Marking point

Section C: Answer Key and Marking Guide

MCQs:
1. B

SAQs:
Use the marking schemes above.
```

## Prompt to use when the remaining data is ready

```text
Continue PPC content import.

I have added the remaining level 2 data for tracks 3-11:
- MCQs, SAQs, and marking schemes are in tmp/ppc-l2-questions.txt
- transcript notes are in tmp/ppc-l2-notes.txt
- audio is already wired from docs/level-2-ppc-teachings.json

Please:
1. Run the PPC import readiness report.
2. Import level 2 tracks 3-11 only if each track has audio, notes, MCQs, SAQs, and marking guides.
3. Keep the release scope locked unless I explicitly approve publishing tracks 3-11.
4. Report exactly which tracks are complete, missing, ready to publish, or still locked.
5. Run focused tests, lint, and build.
```

## Commands

```bash
npx tsx scripts/import-ppc-content.ts
npx tsx scripts/sync-ppc-teachings.ts
npm test -- lib/ppc-content-import.test.ts lib/ppc-teaching-sync.test.ts lib/ppc-content-cms.test.ts
npm run lint
npm run build
```
