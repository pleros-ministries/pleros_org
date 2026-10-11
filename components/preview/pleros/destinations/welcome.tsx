"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  BellIcon,
  ClockIcon,
  DownloadIcon,
  SmartphoneIcon,
  SunriseIcon,
} from "lucide-react";

import {
  WelcomePackGiftCard,
  WelcomePackGiftGrid,
  WelcomePackGiftLink,
  WelcomePackHubGrid,
  WelcomePackOrientationNext,
  WelcomePackVideo,
  isWelcomePackGiftLocked,
} from "@/components/dashboard/shared/welcome-pack";
import { SetupStepCard, SetupReminderChoice } from "@/components/dashboard/shared/setup-step";
import { OrientationSurveyView, REQUIRED_ORIENTATION_REASONS } from "@/components/dashboard/shared/orientation-survey";
import { WelcomeAudiobookPage } from "@/components/dashboard/welcome-audiobook-page";
import { extraGifts, mainGifts } from "@/lib/welcome-pack-gifts";
import { WELCOME_PACK_JOIN_POSTER_SRC, WELCOME_PACK_JOIN_VIDEO_SRC, getWelcomePackHubCards } from "@/lib/welcome-pack-hub";
import { cn } from "@/lib/utils";

import { useDemo } from "../demo-context";
import { PageHeader, buttonPrimary, buttonSecondary, panel } from "../ui";
import { Field, Section, selectControl } from "./parts";

const TELEGRAM_URL = "https://t.me/pleros_sogp";
const ORIENTATION_VIDEO_SRC = "/site/sogp/sogp-welcome-WaXgk9zqi78.mp4";
const ORIENTATION_POSTER_SRC = "/site/sogp/sogp-welcome-WaXgk9zqi78.jpg";

/** Welcome Pack card ids mapped to the demo's own destinations. */
const CARD_DESTINATION: Record<string, string> = {
  join: "destinations/join",
  orientation: "destinations/orientation",
  gifts: "destinations/gifts",
  setup: "destinations/reminders",
};

export function WelcomePackDestination() {
  const { href } = useDemo();
  // Same cards and presenter as the live hub; only the links point at preview destinations.
  const items = getWelcomePackHubCards().map((card) => ({ ...card, href: href(CARD_DESTINATION[card.id] ?? "") }));
  return (
    <div className="grid max-w-[54rem] gap-6">
      <PageHeader eyebrow="Start here" title="Your Welcome Pack" />
      <WelcomePackHubGrid items={items} />
    </div>
  );
}

export function JoinDestination() {
  const { href, notify } = useDemo();
  const [reasons, setReasons] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [answered, setAnswered] = useState(false);
  return (
    <div className="grid max-w-[38rem] gap-6">
      <PageHeader eyebrow="Welcome to SOGP" title="Your journey of Purpose starts here" />
      <WelcomePackVideo src={WELCOME_PACK_JOIN_VIDEO_SRC} poster={WELCOME_PACK_JOIN_POSTER_SRC} shape="square" />
      <section className={cn(panel, "grid gap-3 p-4 sm:p-5")}>
        <OrientationSurveyView completed={answered} reasons={reasons} question={question} telegramUrl={TELEGRAM_URL}
          onToggle={(value) => setReasons(current => current.includes(value) ? current.filter(item => item !== value) : current.length < REQUIRED_ORIENTATION_REASONS ? [...current, value] : current)}
          onQuestionChange={setQuestion}
          onSubmit={() => { if (reasons.length === REQUIRED_ORIENTATION_REASONS && question.trim()) { setAnswered(true); notify("Answers kept in this demo tab."); } }} />
        {answered ? <Link href={href("destinations/reminders")} className="w-fit text-[12.5px] font-medium text-(--color-brand-blue) hover:underline">Next: app and reminders</Link> : null}
      </section>
    </div>
  );
}

export function OrientationDestination() {
  const { href } = useDemo();
  return (
    <div className="grid max-w-[46rem] gap-6">
      <PageHeader eyebrow={<Link href={href("destinations/welcome-pack")} className="hover:text-(--color-brand-blue)">Welcome Pack</Link>} title="Orientation video" />
      <WelcomePackVideo src={ORIENTATION_VIDEO_SRC} poster={ORIENTATION_POSTER_SRC} shape="wide" />
      <WelcomePackOrientationNext giftsHref={href("destinations/gifts")} hubHref={href("destinations/welcome-pack")} />
    </div>
  );
}

export function GiftsDestination() {
  const { href, viewer } = useDemo();
  function downloadSample(title: string) {
    const content = `${title}\n\nWelcome Pack sample for ${viewer.firstName}.\n\nThis is a presentation sample. The complete book remains available through the signed-in Welcome Pack.\n`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "pleros-welcome-pack-sample.txt"; link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="grid max-w-[44rem] gap-8">
      <PageHeader eyebrow={<Link href={href("destinations/welcome-pack")} className="hover:text-(--color-brand-blue)">Welcome Pack</Link>} title="Your gifts" />
      <Section title="Main gifts">
        <WelcomePackGiftGrid>
          {mainGifts.map((gift, index) => (
            <WelcomePackGiftCard
              key={gift.id}
              gift={gift}
              locked={isWelcomePackGiftLocked(gift)}
              priority={index === 0}
              action={
                gift.href.startsWith("/dashboard/welcomepack/audiobook") ? (
                  <WelcomePackGiftLink gift={gift} href={href("destinations/audiobook")} />
                ) : (
                  // The protected original stays behind sign-in; the demo offers a labelled sample.
                  <button type="button" className={buttonPrimary} onClick={() => downloadSample(gift.title)}>
                    <DownloadIcon className="size-3.5" aria-hidden />
                    Download sample
                  </button>
                )
              }
            />
          ))}
        </WelcomePackGiftGrid>
      </Section>
      <Section title="Extra gifts" detail="Supplementary resources are being prepared.">
        <WelcomePackGiftGrid>
          {extraGifts.map((gift) => (
            <WelcomePackGiftCard key={gift.id} gift={gift} locked={isWelcomePackGiftLocked(gift, false)} />
          ))}
        </WelcomePackGiftGrid>
      </Section>
    </div>
  );
}

export function AudiobookDestination() {
  const { href } = useDemo();
  return <WelcomeAudiobookPage hubHref={href("destinations/welcome-pack")} embedded />;
}

// ─── App and reminders ────────────────────────────────────────────────────

const PRAYER_SESSIONS = [
  { key: "morning", label: "Morning", time: "5:30 am", reminder: "5:20 am" },
  { key: "afternoon", label: "Afternoon", time: "12:30 pm", reminder: "12:20 pm" },
  { key: "evening", label: "Evening", time: "8:30 pm", reminder: "8:20 pm" },
] as const;

const ZONES = ["Africa/Lagos", "Europe/London", "America/New_York", "America/Toronto", "Africa/Johannesburg"];

function StepCard({ index, title, done, icon, children }: { index: number; title: string; done: boolean; icon: typeof BellIcon; children: ReactNode }) {
  return <SetupStepCard number={index} title={title} done={done} icon={icon} as="section">{children}</SetupStepCard>;
}

export function RemindersDestination() {
  const { href, notify } = useDemo();
  const [installed, setInstalled] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [teachingTime, setTeachingTime] = useState("07:00");
  const [zone, setZone] = useState("Africa/Lagos");
  const [prayer, setPrayer] = useState<Record<string, boolean>>({ morning: true, afternoon: false, evening: false });
  const [teachingReminder, setTeachingReminder] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [timeSaved, setTimeSaved] = useState(false);
  const [newContent, setNewContent] = useState(false);
  const [weekly, setWeekly] = useState(false);
  const [community, setCommunity] = useState(true);
  const [saved, setSaved] = useState(false);

  return (
    <div className="grid max-w-[42rem] gap-5">
      <PageHeader eyebrow={<Link href={href("destinations/welcome-pack")} className="hover:text-(--color-brand-blue)">Welcome Pack</Link>} title="Set up your app and reminders" />

      <StepCard index={1} title="Install the Pleros app" done={installed} icon={SmartphoneIcon}>
        <p className="text-[13px] leading-relaxed text-(--color-text-muted)">On iPhone, tap Share then Add to Home Screen. On Android, open the browser menu and choose Install app.</p>
        <button type="button" className={cn(buttonSecondary, "w-fit")} onClick={() => setInstalled((value) => !value)}>{installed ? "Mark as not installed" : "I've installed it"}</button>
      </StepCard>

      <StepCard index={2} title="Turn on notifications" done={notifications} icon={BellIcon}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] text-(--color-text-muted)">The demo never asks your browser for permission.</p>
          <button type="button" className={buttonPrimary} onClick={() => setNotifications(value => !value)}>{notifications ? "Turn off notifications" : "Turn on notifications"}</button>
        </div>
      </StepCard>

      <StepCard index={3} title="Choose your teaching time" done={timeSaved} icon={ClockIcon}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Teaching time">
            <input type="time" step={300} value={teachingTime} onChange={(event) => setTeachingTime(event.target.value)} className="min-h-10 w-full rounded-lg border border-(--color-line-strong) bg-white px-3 text-[16px]" />
          </Field>
          <Field label="Time zone">
            <select className={selectControl} value={zone} onChange={(event) => setZone(event.target.value)}>
              {ZONES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
        </div>
        <p className="text-[12px] text-(--color-text-muted)">Monday teachings open at 6:00 am WAT.</p>
        <button type="button" className={`${buttonPrimary} w-fit`} disabled={!teachingTime} onClick={() => { setTimeSaved(true); notify("Teaching time saved in this demo tab."); }}>Save time</button>
      </StepCard>

      <StepCard index={4} title="Set your reminders" done={saved} icon={SunriseIcon}>
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-[13px] font-medium text-(--color-text-strong)">Prayer Watch, ten minutes before (Lagos time)</legend>
          {PRAYER_SESSIONS.map((session) => (
            <SetupReminderChoice key={session.key} label={`${session.label} Prayer Watch · ${session.time}`} helper={`Reminder ${session.reminder}, Lagos time`} checked={Boolean(prayer[session.key])} onChange={(value) => setPrayer(current => ({ ...current, [session.key]: value }))} />
          ))}
        </fieldset>
        {[
          { label: `Teaching reminder at ${teachingTime}`, checked: teachingReminder, set: setTeachingReminder },
          { label: "Evening nudge when today’s teaching is unfinished", checked: nudge, set: setNudge },
          { label: "Monday summary of your week", checked: weekly, set: setWeekly },
          { label: "New podcast episodes and videos", checked: newContent, set: setNewContent },
          { label: "Messages, replies and community updates", checked: community, set: setCommunity },
        ].map((item) => (
          <SetupReminderChoice key={item.label} label={item.label} checked={item.checked} onChange={item.set} />
        ))}
      </StepCard>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={buttonPrimary}
          onClick={() => {
            setSaved(true);
            notify("Preferences saved in this demo tab. No reminders are sent.");
          }}
        >
          Save reminders
        </button>
        <Link href={href("destinations/welcome-pack")} className={buttonSecondary}>Continue</Link>
      </div>
    </div>
  );
}
