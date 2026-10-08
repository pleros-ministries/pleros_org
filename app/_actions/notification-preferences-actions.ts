"use server";

import { revalidatePath } from "next/cache";

import { getDashboardActionSession } from "@/lib/dashboard-action-session";
import {
  markAppInstalled,
  saveReminderPreferences,
  saveTeachingTime,
} from "@/lib/db/queries/notification-preferences";
import {
  REMINDER_FORM_FIELDS,
  normaliseTimeZone,
  parseReminderChoices,
  parseTeachingTime,
  type ReminderActionState,
} from "@/lib/notifications/reminder-preferences";

const SAVE_FAILED = "We could not save that. Please try again.";

/** Every page that shows a learner's reminder settings. */
function revalidateReminderSurfaces() {
  revalidatePath("/dashboard/welcomepack");
  revalidatePath("/dashboard/welcomepack/setup");
  revalidatePath("/dashboard/sogp");
  revalidatePath("/dashboard/pre-sogp");
}

function saved(): ReminderActionState {
  return { error: null, savedAt: new Date().toISOString() };
}

function failed(error: string): ReminderActionState {
  return { error, savedAt: null };
}

export async function saveTeachingTimeAction(
  _previousState: ReminderActionState,
  formData: FormData,
): Promise<ReminderActionState> {
  const session = await getDashboardActionSession();
  if (!session) {
    return failed("You need to be signed in to save your teaching time.");
  }

  const teachingTimeMinutes = parseTeachingTime(
    formData.get(REMINDER_FORM_FIELDS.teachingTime),
  );
  if (teachingTimeMinutes === null) {
    return failed("Choose a time for your daily teaching.");
  }

  try {
    await saveTeachingTime({
      userId: session.user.id,
      // An unreadable zone falls back to Lagos, the programme's own clock.
      timeZone: normaliseTimeZone(formData.get(REMINDER_FORM_FIELDS.timeZone)),
      teachingTimeMinutes,
    });
  } catch (error) {
    console.error("Teaching time could not be saved:", error);
    return failed(SAVE_FAILED);
  }

  revalidateReminderSurfaces();
  return saved();
}

export async function saveReminderPreferencesAction(
  _previousState: ReminderActionState,
  formData: FormData,
): Promise<ReminderActionState> {
  const session = await getDashboardActionSession();
  if (!session) {
    return failed("You need to be signed in to save your reminders.");
  }

  try {
    await saveReminderPreferences({
      userId: session.user.id,
      timeZone: normaliseTimeZone(formData.get(REMINDER_FORM_FIELDS.timeZone)),
      choices: parseReminderChoices(formData),
    });
  } catch (error) {
    console.error("Reminder preferences could not be saved:", error);
    return failed(SAVE_FAILED);
  }

  revalidateReminderSurfaces();
  return saved();
}

/** Called once the learner is using the installed app, or says they are. */
export async function markAppInstalledAction(): Promise<ReminderActionState> {
  const session = await getDashboardActionSession();
  if (!session) {
    return failed("You need to be signed in to update your setup.");
  }

  try {
    await markAppInstalled(session.user.id);
  } catch (error) {
    console.error("App install could not be recorded:", error);
    return failed(SAVE_FAILED);
  }

  revalidateReminderSurfaces();
  return saved();
}
