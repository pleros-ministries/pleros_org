import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CheckIcon, DownloadIcon, LockIcon } from "lucide-react";

import type { WelcomePackGift } from "@/lib/welcome-pack-gifts";
import type { WelcomePackHubCard } from "@/lib/welcome-pack-hub";
import { cn } from "@/lib/utils";

import { buttonPrimary, buttonSecondary, eyebrowText, focusRing, panel } from "./ui";

/**
 * Welcome Pack presenters shared by the live pages
 * (`components/dashboard/welcome-pack-pages.tsx`) and the public demo
 * (`components/preview/pleros/destinations/welcome.tsx`).
 *
 * They are pure: no hooks, no server actions, no auth, database or push
 * imports. Each caller resolves its own hrefs (live routes or preview links)
 * and passes its own actions as slots (protected downloads live, labelled
 * samples in the demo).
 */

// ─── Hub ─────────────────────────────────────────────────────────────────

export type WelcomePackHubItem = Pick<WelcomePackHubCard, "id" | "title" | "description" | "imageSrc"> & {
  /** Already resolved for the caller: a live route or a preview link. */
  href: string;
  done?: boolean;
};

export function WelcomePackHubGrid({ items }: { items: WelcomePackHubItem[] }) {
  return (
    <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
      {items.map((item, index) => (
        <li key={item.id} className="min-w-0">
          <Link
            href={item.href}
            className={cn(
              panel,
              "group grid h-full overflow-hidden transition-shadow hover:shadow-[var(--shadow-md)]",
              focusRing,
            )}
          >
            <span className="relative aspect-[16/9] overflow-hidden bg-(--color-brand-sky-soft)">
              <Image
                src={item.imageSrc}
                alt=""
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                priority={index === 0}
              />
              {item.done ? (
                <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-(--color-brand-lime) px-2 py-0.5 text-[11px] font-medium text-(--color-brand-blue)">
                  <CheckIcon className="size-3" strokeWidth={2.5} aria-hidden />
                  Done
                </span>
              ) : null}
            </span>
            <span className="grid content-start gap-1 px-4 py-3.5">
              <span className={eyebrowText}>Step {index + 1}</span>
              <span className="text-[15px] font-medium text-(--color-text-strong)">{item.title}</span>
              <span className="text-[12.5px] leading-snug text-(--color-text-muted)">{item.description}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ─── Media ───────────────────────────────────────────────────────────────

/**
 * Welcome Pack video. `square` keeps the full 720px square welcome frame
 * (object-contain); `wide` is the 16:9 orientation video. Metadata-only
 * preload in both cases.
 */
export function WelcomePackVideo({
  src,
  poster,
  shape,
}: {
  src: string;
  poster?: string | null;
  shape: "square" | "wide";
}) {
  return (
    <video
      controls
      playsInline
      preload="metadata"
      src={src}
      poster={poster ?? undefined}
      className={cn(
        "w-full max-w-full rounded-[var(--radius-md)] bg-black",
        shape === "square" ? "aspect-square object-contain" : "aspect-video object-cover",
      )}
    />
  );
}

export function WelcomePackVideoPlaceholder() {
  return (
    <div className={cn(panel, "grid min-w-0 aspect-video place-items-center p-5 text-center")}>
      <div className="grid gap-1">
        <strong className="text-[15px] font-medium text-(--color-text-strong)">
          Welcome message video coming soon
        </strong>
        <span className="text-[13px] text-(--color-text-muted)">
          The final welcome message will appear here.
        </span>
      </div>
    </div>
  );
}

/** "Next" links under the orientation video. */
export function WelcomePackOrientationNext({ giftsHref, hubHref }: { giftsHref: string; hubHref: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={giftsHref} className={buttonPrimary}>Open your gifts</Link>
      <Link href={hubHref} className={buttonSecondary}>Welcome Pack</Link>
    </div>
  );
}

// ─── Gifts ───────────────────────────────────────────────────────────────

/** A gift with nothing to open yet (no route, or held back for this learner). */
export function isWelcomePackGiftLocked(gift: WelcomePackGift, unlocked = true): boolean {
  return Boolean(gift.locked) || !unlocked || gift.href === "#";
}

export function WelcomePackGiftCard({
  gift,
  locked,
  action,
  priority = false,
}: {
  gift: WelcomePackGift;
  locked: boolean;
  /** The caller's action: the protected original live, a labelled sample in the demo. */
  action?: ReactNode;
  priority?: boolean;
}) {
  return (
    <article className={cn(panel, "grid min-w-0 content-start overflow-hidden")}>
      <div
        className="relative"
        style={gift.imageBackgroundColor ? { backgroundColor: gift.imageBackgroundColor } : undefined}
      >
        <Image
          src={gift.imageSrc}
          alt={gift.title}
          width={253}
          height={355}
          priority={priority}
          className={cn("h-auto w-full", locked && "opacity-55 saturate-[0.65]")}
        />
        {locked ? (
          <span className="absolute inset-0 grid place-items-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-(--color-brand-blue)">
              <LockIcon className="size-3" aria-hidden />
              Coming soon
            </span>
          </span>
        ) : null}
      </div>
      <div className="grid content-start gap-1.5 px-3 pb-4 pt-3">
        <h3 className="text-[13.5px] font-medium leading-snug text-(--color-text-strong)">{gift.title}</h3>
        <p className="text-[12px] leading-snug text-(--color-text-muted)">{gift.description}</p>
        <div className="mt-1">
          {locked ? (
            <span className="text-[12px] font-medium text-(--color-text-muted)">Coming soon</span>
          ) : (
            action
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * The live gift action: protected API downloads use a plain anchor (never a
 * prefetched route link); dashboard routes use `Link`.
 */
export function WelcomePackGiftLink({ gift, href = gift.href }: { gift: WelcomePackGift; href?: string }) {
  if (href.startsWith("/api/")) {
    return (
      <a href={href} className={buttonPrimary}>
        <DownloadIcon className="size-3.5" aria-hidden />
        {gift.buttonLabel}
      </a>
    );
  }
  return (
    <Link href={href} className={buttonPrimary}>
      {gift.buttonLabel}
    </Link>
  );
}

export function WelcomePackGiftGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-4">{children}</div>;
}
