import { renderToStaticMarkup } from "react-dom/server";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test, vi } from "vitest";

// welcome-pack-pages also exports the join page, whose survey gate calls
// useRouter and so needs a mounted app router.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { WelcomePackSetupPage } from "../components/dashboard/welcome-pack-pages";
import { SetupSteps } from "../components/dashboard/welcome-pack-setup/setup-steps";
import {
  DEFAULT_REMINDER_PREFERENCES,
  INITIAL_REMINDER_ACTION_STATE,
  toReminderSetupView,
  type ReminderSetupActions,
} from "./notifications/reminder-preferences";

const STEP_TITLES = [
  "Install the Pleros app",
  "Turn on notifications",
  "Choose your teaching time",
  "Set your reminders",
];

// Stand-ins for the server actions the live route passes in.
const stubActions: ReminderSetupActions = {
  saveTeachingTime: async (state) => state,
  saveReminderPreferences: async (state) => state,
  markAppInstalled: async () => INITIAL_REMINDER_ACTION_STATE,
};

function source(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

describe("Welcome Pack setup page", () => {
  test("renders the four steps in order inside the Welcome Pack frame", () => {
    const html = renderToStaticMarkup(
      <WelcomePackSetupPage>
        <SetupSteps
          view={toReminderSetupView(DEFAULT_REMINDER_PREFERENCES)}
          hasPushOnAnyDevice={false}
          enrolled
          continueHref="/dashboard/pre-sogp"
          continueLabel="Continue to Pre-SOGP"
          actions={stubActions}
        />
      </WelcomePackSetupPage>,
    );

    expect(html).toContain("Set up your app and reminders");
    expect(html).toContain("site-hero-heading");
    // The back link to the hub.
    expect(html).toContain('href="/dashboard/welcomepack"');

    const positions = STEP_TITLES.map((title) => html.indexOf(title));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);

    expect(html).not.toContain("font-bold");
    expect(html).not.toContain("Preview mode");
  });

  test("never blocks the way forward", () => {
    const html = renderToStaticMarkup(
      <SetupSteps
        view={toReminderSetupView(DEFAULT_REMINDER_PREFERENCES)}
        hasPushOnAnyDevice={false}
        enrolled
        continueHref="/dashboard/pre-sogp"
        continueLabel="Continue to Pre-SOGP"
        actions={stubActions}
      />,
    );

    // Nothing is done yet, and the continue link is still an ordinary link.
    expect(html).toContain('href="/dashboard/pre-sogp"');
    expect(html).toContain("Continue to Pre-SOGP");
  });

  test("waits for the browser before saying what this device supports", () => {
    const html = renderToStaticMarkup(
      <SetupSteps
        view={toReminderSetupView(DEFAULT_REMINDER_PREFERENCES)}
        hasPushOnAnyDevice={false}
        enrolled
        continueHref="/dashboard/sogp"
        continueLabel="Open your SOGP dashboard"
        actions={stubActions}
      />,
    );

    // On the server nothing is known about the device, so neither step may
    // claim that installing or notifications are unsupported.
    expect(html).toContain("Checking this device");
    expect(html).not.toContain("cannot show notifications");
    expect(html).not.toContain("Use your browser menu");
    expect(html).not.toContain("Install app");
  });

  test("offers a native time field and the learner's saved choices", () => {
    const view = toReminderSetupView({
      ...DEFAULT_REMINDER_PREFERENCES,
      timeZone: "Europe/London",
      teachingTimeMinutes: 390,
      teachingReminderEnabled: true,
      prayerWatch: { morning: true, afternoon: false, evening: true },
      remindersSavedAt: new Date("2026-10-02T10:00:00Z"),
    });
    const html = renderToStaticMarkup(
      <SetupSteps
        view={view}
        hasPushOnAnyDevice
        enrolled
        continueHref="/dashboard/sogp"
        continueLabel="Open your SOGP dashboard"
        actions={stubActions}
      />,
    );

    expect(html).toContain('type="time"');
    expect(html).toContain('value="06:30"');
    // Until the browser reports its own zone, the saved one is submitted.
    expect(html).toContain('name="timeZone"');
    expect(html).toContain('value="Europe/London"');
    expect(html).toContain("teachings open on Monday at 6:00 am WAT");

    for (const field of [
      "prayerWatchMorning",
      "prayerWatchAfternoon",
      "prayerWatchEvening",
      "teachingReminder",
      "community",
      "progressNudges",
      "newContent",
      "weeklySummary",
    ]) {
      expect(html).toContain(`name="${field}"`);
    }
    expect(html).toContain("Morning, 5:30 am");
    expect(html).toContain("Evening, 8:30 pm");
    expect(html).toContain("SOGP teaching at 6:30 am");
    expect(html).toContain("accent-[var(--color-brand-blue)]");
  });

  test("explains what is missing before a teaching reminder can be set", () => {
    const html = renderToStaticMarkup(
      <SetupSteps
        view={toReminderSetupView(DEFAULT_REMINDER_PREFERENCES)}
        hasPushOnAnyDevice={false}
        enrolled={false}
        continueHref="/dashboard"
        continueLabel="Back to your dashboard"
        actions={stubActions}
      />,
    );

    expect(html).toContain("Choose a time in step 3 first.");
    expect(html).toContain("SOGP teaching at your chosen time");
    expect(html).toContain("Your teaching reminder starts once you enrol in SOGP.");
    expect(html).toContain("Reminders arrive on devices where notifications are on (step 2).");
  });

  test("the preview saves and sends nothing", () => {
    const html = renderToStaticMarkup(
      <SetupSteps
        view={toReminderSetupView(DEFAULT_REMINDER_PREFERENCES)}
        hasPushOnAnyDevice={false}
        enrolled
        continueHref="/preview/dashboard/welcomepack"
        continueLabel="Back to the Welcome Pack"
        preview
      />,
    );

    expect(html).toContain("Preview mode · Choices are not saved.");
    expect(html).toContain("Preview mode · Notifications are unavailable in this preview.");
    expect(html).toContain('href="/preview/dashboard/welcomepack"');
    for (const title of STEP_TITLES) expect(html).toContain(title);
  });
});

describe("Welcome Pack setup wiring", () => {
  test("the live route hands the server actions to the steps as props", () => {
    const route = source(
      "app",
      "(site)",
      "dashboard",
      "welcomepack",
      "setup",
      "page.tsx",
    );

    expect(route).toContain("requireWelcomePackAccess");
    expect(route).toContain("getSogpDashboardAccess");
    expect(route).toContain("saveTeachingTime: saveTeachingTimeAction");
    expect(route).toContain(
      "saveReminderPreferences: saveReminderPreferencesAction",
    );
    expect(route).toContain("markAppInstalled: markAppInstalledAction");
  });

  test("the preview route passes no functions at all", () => {
    const route = source(
      "app",
      "preview",
      "dashboard",
      "welcomepack",
      "setup",
      "page.tsx",
    );

    expect(route).toContain("preview");
    expect(route).not.toContain("_actions");
    expect(route).not.toContain("actions=");
  });

  test("step components never import the actions or the database themselves", () => {
    const directory = join(
      process.cwd(),
      "components",
      "dashboard",
      "welcome-pack-setup",
    );
    const files = readdirSync(directory);
    expect(files).toContain("setup-steps.tsx");

    for (const file of files) {
      const contents = readFileSync(join(directory, file), "utf8");
      // Importing either would make every test that renders these connect to
      // the database at import time.
      expect(contents).not.toContain("@/app/_actions");
      expect(contents).not.toContain("@/lib/db");
    }
  });

  test("the actions write through the signed-in learner's own session", () => {
    const actions = source("app", "_actions", "notification-preferences-actions.ts");

    expect(actions.startsWith('"use server";')).toBe(true);
    expect(actions).toContain("getDashboardActionSession");
    expect(actions).toContain("session.user.id");
    expect(actions).toContain('revalidatePath("/dashboard/welcomepack/setup")');
  });
});
