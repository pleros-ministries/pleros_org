"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  BellIcon,
  CheckIcon,
  ClockIcon,
  DownloadIcon,
  PauseIcon,
  PlayIcon,
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
import { SOGP_ORIENTATION_REASONS } from "@/lib/sogp/orientation-survey";
import { welcomeAudiobookTracks } from "@/lib/welcome-audiobook";
import { extraGifts, mainGifts } from "@/lib/welcome-pack-gifts";
import { WELCOME_PACK_JOIN_POSTER_SRC, WELCOME_PACK_JOIN_VIDEO_SRC, getWelcomePackHubCards } from "@/lib/welcome-pack-hub";
import { cn } from "@/lib/utils";

import { useDemo } from "../demo-context";
import { Badge, PageHeader, buttonPrimary, buttonSecondary, focusRing, panel } from "../ui";
import { Field, IconChip, Section, Tick, selectControl } from "./parts";

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
  const [reason, setReason] = useState("");
  const [answered, setAnswered] = useState(false);
  return (
    <div className="grid max-w-[38rem] gap-6">
      <PageHeader eyebrow="Welcome to SOGP" title="Your journey of Purpose starts here" />
      <WelcomePackVideo src={WELCOME_PACK_JOIN_VIDEO_SRC} poster={WELCOME_PACK_JOIN_POSTER_SRC} shape="square" />
      {answered ? (
        <section className={cn(panel, "grid gap-3 p-4 sm:p-5")}>
          <p className="text-[13.5px] leading-relaxed text-(--color-text)">Join your cohort community on Telegram for your orientation pack and the next steps to take.</p>
          <a href={TELEGRAM_URL} target="_blank" rel="noreferrer" className={cn(buttonPrimary, "w-fit")}>Join the orientation group</a>
          <Link href={href("destinations/reminders")} className="w-fit text-[12.5px] font-medium text-(--color-brand-blue) hover:underline">Next: app and reminders</Link>
        </section>
      ) : (
        <form
          className={cn(panel, "grid gap-4 p-4 sm:p-5")}
          onSubmit={(event) => {
            event.preventDefault();
            if (!reason) return;
            setAnswered(true);
            notify("Answer kept in this demo tab.");
          }}
        >
          <Field label="What brings you to SOGP?">
            <select className={cn(selectControl, !reason && "text-(--color-text-muted)")} value={reason} onChange={(event) => setReason(event.target.value)}>
              <option value="">Choose one</option>
              {SOGP_ORIENTATION_REASONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </Field>
          <button type="submit" className={cn(buttonPrimary, "w-fit")} disabled={!reason}>Continue</button>
        </form>
      )}
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
  const [currentId, setCurrentId] = useState(welcomeAudiobookTracks[0]?.id ?? "");
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState<Record<string, boolean>>({});
  const current = welcomeAudiobookTracks.find((track) => track.id === currentId) ?? welcomeAudiobookTracks[0]!;

  return (
    <div className="grid max-w-[40rem] gap-6">
      <PageHeader eyebrow="Welcome to Purpose" title="Audiobook" />
      <section className={cn(panel, "grid gap-3 p-4 sm:p-5")} aria-label="Now playing">
        <div className="flex items-center gap-3">
          <Image src="/assets/dashboard/welcome-pack-main-gift/audiobook-purpose-welcome-card.png" alt="" width={56} height={78} className="h-[78px] w-[56px] rounded-[var(--radius-sm)] bg-[#016dd5] object-cover" />
          <div className="grid gap-0.5">
            <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-text-muted)">Now playing</span>
            <span className="text-[15px] font-medium text-(--color-text-strong)">{current.title}</span>
          </div>
        </div>
        <audio
          key={current.id}
          controls
          preload="none"
          src={current.audioUrl}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setFinished((value) => ({ ...value, [current.id]: true }))}
          className="w-full"
        />
      </section>
      <Section title="Chapters" detail={`${Object.values(finished).filter(Boolean).length} of ${welcomeAudiobookTracks.length} finished`}>
        <ol className={cn(panel, "divide-y divide-(--color-line) overflow-hidden")}>
          {welcomeAudiobookTracks.map((track, index) => {
            const active = track.id === current.id;
            return (
              <li key={track.id} className={cn("flex items-center gap-3 px-4 py-2.5 sm:px-5", active && "bg-(--color-brand-sky-soft)")}>
                <button
                  type="button"
                  aria-label={`Play ${track.title}`}
                  onClick={() => setCurrentId(track.id)}
                  className={cn("grid size-8 shrink-0 place-items-center rounded-full bg-(--color-brand-sky) text-(--color-brand-blue)", focusRing)}
                >
                  {active && playing ? <PauseIcon className="size-3.5" aria-hidden /> : <PlayIcon className="size-3.5" aria-hidden />}
                </button>
                <span className="w-6 text-[12px] tabular-nums text-(--color-text-muted)">{index + 1}</span>
                <span className="flex-1 text-[13.5px] font-medium text-(--color-text-strong)">{track.title}</span>
                <Tick done={Boolean(finished[track.id])} label={`Mark ${track.title} finished`} onToggle={() => setFinished((value) => ({ ...value, [track.id]: !value[track.id] }))} />
              </li>
            );
          })}
        </ol>
      </Section>
    </div>
  );
}

// ─── App and reminders ────────────────────────────────────────────────────

const PRAYER_SESSIONS = [
  { key: "morning", label: "Morning", time: "5:30 am", reminder: "5:20 am" },
  { key: "afternoon", label: "Afternoon", time: "12:30 pm", reminder: "12:20 pm" },
  { key: "evening", label: "Evening", time: "8:30 pm", reminder: "8:20 pm" },
] as const;

const TEACHING_TIMES = ["6:00 am", "7:00 am", "12:00 pm", "6:00 pm", "8:00 pm", "9:00 pm"];
const ZONES = ["Africa/Lagos", "Europe/London", "America/New_York", "America/Toronto", "Africa/Johannesburg"];

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors duration-150", focusRing, checked ? "bg-(--color-brand-blue)" : "bg-(--color-line-strong)")}
    >
      <span aria-hidden className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left] duration-150", checked ? "left-[18px]" : "left-0.5")} />
    </button>
  );
}

function StepCard({ index, title, done, icon, children }: { index: number; title: string; done: boolean; icon: typeof BellIcon; children: ReactNode }) {
  return (
    <section className={cn(panel, "grid gap-3 p-4 sm:p-5")} aria-labelledby={`setup-step-${index}`}>
      <div className="flex items-center gap-3">
        <IconChip icon={icon} />
        <h2 id={`setup-step-${index}`} className="flex-1 text-[15px] font-medium text-(--color-text-strong)">{index}. {title}</h2>
        {done ? <Badge tone="done"><CheckIcon className="size-3" aria-hidden />Done</Badge> : null}
      </div>
      {children}
    </section>
  );
}

export function RemindersDestination() {
  const { href, notify } = useDemo();
  const [installed, setInstalled] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [teachingTime, setTeachingTime] = useState("7:00 am");
  const [zone, setZone] = useState("Africa/Lagos");
  const [prayer, setPrayer] = useState<Record<string, boolean>>({ morning: true, afternoon: false, evening: false });
  const [teachingReminder, setTeachingReminder] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [weekly, setWeekly] = useState(false);
  const [community, setCommunity] = useState(true);
  const [saved, setSaved] = useState(false);

  return (
    <div className="grid max-w-[42rem] gap-5">
      <PageHeader eyebrow={<Link href={href("destinations/welcome-pack")} className="hover:text-(--color-brand-blue)">Welcome Pack</Link>} title="Set up your app and reminders" />

      <StepCard index={1} title="Install the app" done={installed} icon={SmartphoneIcon}>
        <p className="text-[13px] leading-relaxed text-(--color-text-muted)">On iPhone, tap Share then Add to Home Screen. On Android, open the browser menu and choose Install app.</p>
        <button type="button" className={cn(buttonSecondary, "w-fit")} onClick={() => setInstalled((value) => !value)}>{installed ? "Mark as not installed" : "I've installed it"}</button>
      </StepCard>

      <StepCard index={2} title="Turn on notifications" done={notifications} icon={BellIcon}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] text-(--color-text-muted)">The demo never asks your browser for permission.</p>
          <Switch checked={notifications} onChange={setNotifications} label="Notifications on this device" />
        </div>
      </StepCard>

      <StepCard index={3} title="Choose a teaching time" done={saved} icon={ClockIcon}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Teaching time">
            <select className={selectControl} value={teachingTime} onChange={(event) => setTeachingTime(event.target.value)}>
              {TEACHING_TIMES.map((time) => <option key={time}>{time}</option>)}
            </select>
          </Field>
          <Field label="Time zone">
            <select className={selectControl} value={zone} onChange={(event) => setZone(event.target.value)}>
              {ZONES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
        </div>
        <p className="text-[12px] text-(--color-text-muted)">Monday teachings open at 6:00 am WAT.</p>
      </StepCard>

      <StepCard index={4} title="Set reminders" done={saved} icon={SunriseIcon}>
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-[13px] font-medium text-(--color-text-strong)">Prayer Watch, ten minutes before (Lagos time)</legend>
          {PRAYER_SESSIONS.map((session) => (
            <div key={session.key} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-(--color-line) px-3 py-2">
              <span className="text-[13.5px] text-(--color-text-strong)">{session.label} · {session.time}<span className="text-(--color-text-muted)"> · reminder {session.reminder}</span></span>
              <Switch checked={Boolean(prayer[session.key])} onChange={(value) => setPrayer((current) => ({ ...current, [session.key]: value }))} label={`${session.label} Prayer Watch reminder`} />
            </div>
          ))}
        </fieldset>
        {[
          { label: `Teaching reminder at ${teachingTime}`, checked: teachingReminder, set: setTeachingReminder },
          { label: "Evening nudge at 7:00 pm", checked: nudge, set: setNudge },
          { label: "Monday summary at 8:00 am", checked: weekly, set: setWeekly },
          { label: "Community notifications", checked: community, set: setCommunity },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3">
            <span className="text-[13.5px] text-(--color-text-strong)">{item.label}</span>
            <Switch checked={item.checked} onChange={item.set} label={item.label} />
          </div>
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
