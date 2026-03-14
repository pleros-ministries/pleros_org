## [2026-03-11] Session Note

### Mistake
- Tried to read the scratchpad before confirming the file existed.

### Correction
- Create and maintain `docs/ai_scratchpad.md` in this repo.

### Lesson
- If the scratchpad is missing, initialize it immediately and continue using it.

### Preference (if any)
- User wants the app reset to a minimal state with a blank home screen showing only "Pleros".

### Action Rule
- For reset requests, remove existing route pages/components and keep `app/page.tsx` minimal.

## [2026-03-13] PPC Full Implementation

### Lesson
- Use `npm` not `pnpm` when `package-lock.json` is canonical lockfile
- Server actions must use `revalidatePath("/ppc", "layout")` after mutations
- Demo auth resolves DB user ID from email via `resolveDbUserId()` in app-session.ts
- Quiz scoring: only MC questions scored automatically; short text graded manually
- Build passes with 21 routes including all student + staff pages

### Preference
- Dense Vercel dashboard style: h-7/h-8 buttons, text-xs, zinc palette
- Sentence case throughout
- `useTransition` for all action pending states

### Action Rule
- Always serialize Date objects to ISO strings before passing to client components
- Use `onConflictDoUpdate` for student progress upserts
- Check `getAppSession()` at top of every page, redirect to sign-in if null
