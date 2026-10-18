import type { ReactNode } from "react";

import { getWelcomePackHubCards } from "../../lib/welcome-pack-hub";
import { extraGifts, mainGifts } from "../../lib/welcome-pack-gifts";
import { cn } from "../../lib/utils";
import {
  DashboardPageFrame,
  DashboardPageHeader,
  DashboardSection,
} from "./shared/page";
import { dashboardFont } from "./shared/ui";
import {
  WelcomePackGiftCard,
  WelcomePackGiftGrid,
  WelcomePackGiftLink,
  WelcomePackHubGrid,
  WelcomePackOrientationNext,
  WelcomePackVideo,
  WelcomePackVideoPlaceholder,
  isWelcomePackGiftLocked,
} from "./shared/welcome-pack";
import { OrientationSurveyGate } from "./orientation-survey-gate";

const hubPath = "/dashboard/welcomepack";

/** Eyebrow leading back to the hub on every Welcome Pack subpage. */
export function WelcomePackHubPage({
  basePath = hubPath,
  setupComplete = false,
}: {
  basePath?: string;
  /** The learner has saved their reminders, so the setup card shows "Done". */
  setupComplete?: boolean;
}) {
  const items = getWelcomePackHubCards(basePath).map((card) => ({
    ...card,
    done: card.id === "setup" && setupComplete,
  }));

  return (
    <DashboardPageFrame className="grid max-w-[54rem] gap-6">
      <DashboardPageHeader eyebrow="Start here" title="Your Welcome Pack" />
      <WelcomePackHubGrid items={items} />
    </DashboardPageFrame>
  );
}

export function WelcomePackJoinPage({
  telegramUrl,
  videoSrc,
  videoPosterSrc,
  surveyCompleted,
  embedded = false,
}: {
  telegramUrl: string;
  videoSrc: string | null;
  videoPosterSrc?: string | null;
  surveyCompleted: boolean;
  /** Inside the dashboard shell, which already provides `<main>` and the top bar. */
  embedded?: boolean;
}) {
  const Root = embedded ? "div" : "main";
  return (
    <Root className={cn("min-w-0 bg-white", dashboardFont, !embedded && "min-h-screen")}>
      <DashboardPageFrame className="grid grid-cols-[minmax(0,1fr)] gap-6 sm:max-w-[38rem]">
        <DashboardPageHeader title="Your journey of purpose starts here" />

        {videoSrc ? (
          <WelcomePackVideo src={videoSrc} poster={videoPosterSrc} shape="square" />
        ) : (
          <WelcomePackVideoPlaceholder />
        )}

        {/* Live and public adapters share the survey presenter. */}
        <section className="grid min-w-0 max-w-full rounded-[var(--radius-lg)] border border-(--color-line) bg-white p-4 sm:p-5">
          <OrientationSurveyGate
            telegramUrl={telegramUrl}
            initialCompleted={surveyCompleted}
          />
        </section>
      </DashboardPageFrame>
    </Root>
  );
}

export function WelcomePackOrientationPage({
  videoSrc,
  basePath = hubPath,
}: {
  videoSrc: string;
  basePath?: string;
}) {
  return (
    <DashboardPageFrame className="grid max-w-[46rem] gap-6">
      <DashboardPageHeader title="Orientation video" />
      <WelcomePackVideo
        src={videoSrc}
        poster="/site/sogp/sogp-welcome-WaXgk9zqi78.jpg"
        shape="wide"
      />
      <WelcomePackOrientationNext giftsHref={`${basePath}/gifts`} hubHref={basePath} />
    </DashboardPageFrame>
  );
}

/**
 * Page frame for "App and reminders". The steps themselves are client
 * components passed in as children, which keeps this file free of anything
 * that needs a browser or a database.
 */
export function WelcomePackSetupPage({
  children,
}: {
  children: ReactNode;
  basePath?: string;
}) {
  return (
    <DashboardPageFrame className="grid max-w-[46rem] gap-6">
      <DashboardPageHeader title="Set up your app and reminders" />
      {children}
    </DashboardPageFrame>
  );
}

export function WelcomePackGiftsPage({
  extraGiftsUnlocked,
}: {
  extraGiftsUnlocked: boolean;
  basePath?: string;
}) {
  return (
    <DashboardPageFrame className="grid max-w-[44rem] gap-8">
      <DashboardPageHeader title="Your gifts" />

      <DashboardSection title="Main gifts">
        <WelcomePackGiftGrid>
          {mainGifts.map((gift, index) => (
            <WelcomePackGiftCard
              key={gift.id}
              gift={gift}
              locked={isWelcomePackGiftLocked(gift)}
              priority={index === 0}
              action={<WelcomePackGiftLink gift={gift} />}
            />
          ))}
        </WelcomePackGiftGrid>
      </DashboardSection>

      <DashboardSection
        title="Extra gifts"
        detail={
          extraGiftsUnlocked
            ? "Your extra gifts are unlocked."
            : "Supplementary resources are being prepared."
        }
      >
        <WelcomePackGiftGrid>
          {extraGifts.map((gift) => (
            <WelcomePackGiftCard
              key={gift.id}
              gift={gift}
              locked={isWelcomePackGiftLocked(gift, extraGiftsUnlocked)}
              action={<WelcomePackGiftLink gift={gift} />}
            />
          ))}
        </WelcomePackGiftGrid>
      </DashboardSection>
    </DashboardPageFrame>
  );
}
