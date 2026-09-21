"use client";

import type { ComponentType, SVGProps } from "react";
import { useEffect, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { CheckIcon, CopyIcon, SendIcon, Share2Icon } from "lucide-react";

import type { PreSogpShareIntentPlatform } from "@/lib/sogp/share";

const shareButtonClassName =
  "inline-flex min-h-8 items-center gap-1.5 rounded-full bg-[var(--color-brand-blue)] px-3 text-xs font-semibold text-white transition-transform duration-150 active:scale-[0.98]";

type Glyph = ComponentType<SVGProps<SVGSVGElement>>;

const WhatsAppGlyph: Glyph = (props) => (
  <svg viewBox="0 0 27 27" fill="currentColor" aria-hidden {...props}>
    <path d="M0 26.8421L1.88678 19.9493C0.7225 17.9316 0.110724 15.6445 0.111842 13.2991C0.115197 5.96678 6.08197 0 13.4132 0C16.9709 0.00111842 20.3105 1.38684 22.8225 3.90105C25.3334 6.41526 26.7157 9.75711 26.7146 13.3114C26.7113 20.6449 20.7445 26.6117 13.4132 26.6117C11.1876 26.6106 8.99434 26.0525 7.05164 24.9922L0 26.8421ZM7.37822 22.5843C9.2527 23.6971 11.0422 24.3637 13.4087 24.3648C19.5019 24.3648 24.4655 19.4057 24.4688 13.3092C24.4711 7.20039 19.531 2.24803 13.4177 2.24579C7.32007 2.24579 2.35987 7.20487 2.35763 13.3003C2.35651 15.7888 3.08572 17.652 4.31039 19.6014L3.19309 23.6814L7.37822 22.5843ZM20.1137 16.4732C20.0309 16.3345 19.8095 16.2518 19.4762 16.0851C19.144 15.9185 17.51 15.1143 17.2047 15.0036C16.9005 14.8929 16.679 14.837 16.4564 15.1703C16.235 15.5024 15.5975 16.2518 15.404 16.4732C15.2105 16.6947 15.0159 16.7226 14.6838 16.556C14.3516 16.3893 13.2801 16.0393 12.0107 14.9063C11.0232 14.025 10.3555 12.9368 10.162 12.6035C9.96849 12.2713 10.1418 12.0913 10.3074 11.9257C10.4572 11.777 10.6395 11.5376 10.8062 11.343C10.9751 11.1507 11.0299 11.012 11.1417 10.7894C11.2524 10.568 11.1976 10.3734 11.1138 10.2067C11.0299 10.0412 10.3655 8.40493 10.0893 7.73947C9.81862 7.09191 9.54461 7.17914 9.34105 7.16908L8.70355 7.1579C8.48211 7.1579 8.12197 7.24066 7.81776 7.57395C7.51355 7.90724 6.65461 8.71026 6.65461 10.3465C6.65461 11.9828 7.84572 13.5631 8.01125 13.7845C8.17789 14.006 10.3543 17.3635 13.6884 18.8029C14.4813 19.1451 15.1009 19.3498 15.583 19.503C16.3793 19.7558 17.104 19.72 17.6766 19.635C18.3153 19.5399 19.6428 18.8309 19.9202 18.0547C20.1976 17.2774 20.1976 16.6119 20.1137 16.4732Z" />
  </svg>
);

const FacebookGlyph: Glyph = (props) => (
  <svg viewBox="0 0 27 27" fill="currentColor" aria-hidden {...props}>
    <path d="M13.4211 0C6.00887 0 0 6.00887 0 13.4211C0 19.715 4.33339 24.9964 10.1791 26.447V17.5225H7.41164V13.4211H10.1791V11.6538C10.1791 7.08578 12.2464 4.96847 16.7312 4.96847C17.5816 4.96847 19.0488 5.13543 19.649 5.30185V9.01948C19.3322 8.9862 18.782 8.96956 18.0986 8.96956C15.898 8.96956 15.0477 9.80327 15.0477 11.9705V13.4211H19.4315L18.6783 17.5225H15.0477V26.7439C21.6933 25.9413 26.8426 20.283 26.8426 13.4211C26.8421 6.00887 20.8332 0 13.4211 0Z" />
  </svg>
);

const XGlyph: Glyph = (props) => (
  <svg viewBox="0 0 27 27" fill="currentColor" aria-hidden {...props}>
    <path d="M20.4967 2.12939H24.2697L16.0269 11.5504L25.7239 24.3703H18.1312L12.1844 16.5951L5.37978 24.3703H1.60453L10.421 14.2934L1.11865 2.12939H8.9041L14.2796 9.23621L20.4967 2.12939ZM19.1725 22.112H21.2632L7.76811 4.26908H5.52463L19.1725 22.112Z" />
  </svg>
);

const CHIPS: Array<{
  platform: PreSogpShareIntentPlatform;
  label: string;
  bg: string;
  Glyph: Glyph;
}> = [
  { platform: "whatsapp", label: "Share on WhatsApp", bg: "#25D366", Glyph: WhatsAppGlyph },
  { platform: "facebook", label: "Share on Facebook", bg: "#1877F2", Glyph: FacebookGlyph },
  { platform: "x", label: "Share on X", bg: "#000000", Glyph: XGlyph },
  {
    platform: "telegram",
    label: "Share on Telegram",
    bg: "#229ED9",
    Glyph: (props) => <SendIcon {...props} strokeWidth={2} />,
  },
];

export function ShareIntentButtons({
  hrefs,
  copyValue,
  nativeShare,
}: {
  hrefs: Record<PreSogpShareIntentPlatform, string>;
  copyValue: string;
  nativeShare?: { title: string; text: string; url: string };
}) {
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCanNativeShare(
        typeof navigator !== "undefined" &&
          typeof navigator.share === "function",
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function handleNativeShare() {
    if (!nativeShare) return;
    try {
      await navigator.share(nativeShare);
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") {
        console.error("Share failed:", error);
      }
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  const chipsAndCopy = (
    <>
      {CHIPS.map(({ platform, label, bg, Glyph }) => (
        <a
          key={platform}
          href={hrefs[platform]}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          style={{ backgroundColor: bg }}
          className="inline-flex size-8 items-center justify-center rounded-full text-white transition-transform duration-150 hover:-translate-y-px active:scale-[0.98]"
        >
          <Glyph className="size-3.5" />
        </a>
      ))}
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Link copied" : "Copy link"}
        className="inline-flex size-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-zinc-300"
      >
        {copied ? (
          <CheckIcon className="size-4 text-green-600" />
        ) : (
          <CopyIcon className="size-4" />
        )}
      </button>
    </>
  );

  // Native share covers every platform (plus copy) through the OS sheet, so a
  // single tap is the whole interaction — no need to also show the chips.
  if (nativeShare && canNativeShare) {
    return (
      <button type="button" onClick={handleNativeShare} className={shareButtonClassName}>
        <Share2Icon className="size-3.5" strokeWidth={2} />
        Share
      </button>
    );
  }

  // No native share (desktop): collapse the chips behind a single "Share"
  // button that reveals them in a popover.
  return (
    <Popover.Root>
      <Popover.Trigger className={shareButtonClassName}>
        <Share2Icon className="size-3.5" strokeWidth={2} />
        Share
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="start">
          <Popover.Popup className="z-50 origin-top-left rounded-full border border-zinc-200 bg-white p-1.5 shadow-lg outline-none transition-[opacity,transform] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <div className="flex items-center gap-1.5">{chipsAndCopy}</div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
