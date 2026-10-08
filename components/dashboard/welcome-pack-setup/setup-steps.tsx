"use client";

import Link from "next/link";

import type {
  ReminderFormAction,
  ReminderSetupActions,
  ReminderSetupView,
} from "@/lib/notifications/reminder-preferences";
import { usePushSubscription } from "@/lib/push/use-push";
import { useInstallPrompt } from "@/lib/pwa/use-install-prompt";

import { InstallStep } from "./install-step";
import { NotificationsStep } from "./notifications-step";
import { RemindersStep } from "./reminders-step";
import { StepCard } from "./step-card";
import { SETUP_NOTE, SETUP_PRIMARY_BUTTON } from "./styles";
import { TeachingTimeStep } from "./teaching-time-step";
import { useBrowserTimeZone, useHydrated } from "./use-browser";

// The preview has no signed-in learner, so its forms post to nothing. (A
// server page may only hand a client component real server actions, never an
// ordinary function, which is why this lives here.)
const previewFormAction: ReminderFormAction = async (state) => state;

/**
 * The four Welcome Pack setup steps: install the app, turn on notifications,
 * choose a teaching time and set reminders. Every step is optional and the
 * learner can always continue.
 */
export function SetupSteps({
  view,
  hasPushOnAnyDevice,
  enrolled,
  continueHref,
  continueLabel,
  actions,
  preview = false,
}: {
  view: ReminderSetupView;
  /** The learner has notifications on for at least one device. */
  hasPushOnAnyDevice: boolean;
  /** The learner has an SOGP enrolment. */
  enrolled: boolean;
  continueHref: string;
  continueLabel: string;
  /** Server actions from the live route; omitted in the preview. */
  actions?: ReminderSetupActions;
  preview?: boolean;
}) {
  const install = useInstallPrompt();
  const push = usePushSubscription();
  const hydrated = useHydrated();
  const timeZone = useBrowserTimeZone();

  const installed = install.status === "installed" || view.appInstalled;

  return (
    <div className="grid gap-6">
      <ol className="grid gap-4">
        <StepCard
          number={1}
          title="Install the Pleros app"
          description="Open Pleros from your Home Screen, full screen, like any other app."
          done={installed}
        >
          <InstallStep
            status={install.status}
            installRecorded={view.appInstalled}
            onInstall={install.promptInstall}
            onMarkInstalled={actions?.markAppInstalled}
            preview={preview}
          />
        </StepCard>

        <StepCard
          number={2}
          title="Turn on notifications"
          description="Reminders reach each device where you turn them on."
          done={!preview && push.isSubscribed}
        >
          <NotificationsStep
            push={push}
            installStatus={install.status}
            hasPushOnAnyDevice={hasPushOnAnyDevice}
            hydrated={hydrated}
            preview={preview}
          />
        </StepCard>

        <StepCard
          number={3}
          title="Choose your teaching time"
          description="One reminder a day, at the time you plan to study."
          done={view.teachingTimeMinutes !== null}
        >
          <TeachingTimeStep
            view={view}
            timeZone={timeZone}
            enrolled={enrolled}
            action={actions?.saveTeachingTime ?? previewFormAction}
            preview={preview}
          />
        </StepCard>

        <StepCard
          number={4}
          title="Set your reminders"
          description="Choose what Pleros reminds you about. You can change this at any time."
          done={view.remindersSaved}
        >
          <RemindersStep
            view={view}
            timeZone={timeZone}
            hasPushOnAnyDevice={hasPushOnAnyDevice || push.isSubscribed}
            action={actions?.saveReminderPreferences ?? previewFormAction}
            preview={preview}
          />
        </StepCard>
      </ol>

      <div className="grid gap-2">
        <Link href={continueHref} className={SETUP_PRIMARY_BUTTON}>
          {continueLabel}
        </Link>
        <p className={`font-[var(--font-be-vietnam-pro)] ${SETUP_NOTE}`}>
          You can come back to these steps from your Welcome Pack at any time.
        </p>
      </div>
    </div>
  );
}
