"use client";

import { useState } from "react";
import { DownloadIcon, ShareIcon, SquarePlusIcon } from "lucide-react";

import { useInstallPrompt } from "@/lib/pwa/use-install-prompt";

/**
 * "Download Pleros" (Pastor, 20 October: a real install button, always to
 * hand but not in the way). Where the browser can install, it triggers the
 * install prompt itself; on iPhone, where no browser can, it shows the two
 * Add-to-Home-Screen steps. Hidden once the app is installed on this device.
 */
export function GetAppButton({ tone = "light", className = "" }: {
  /** light: blue button; dark: white on the blue footer; quiet: an outlined row for menus. */
  tone?: "light" | "dark" | "quiet"; className?: string;
}) {
  const { status, promptInstall } = useInstallPrompt();
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState(false);
  if (status === "installed" || status === "pending") return null;

  const base = "inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-[13px] font-medium transition-opacity disabled:opacity-60";
  const look = tone === "dark" ? "bg-white text-[var(--color-brand-blue)]"
    : tone === "quiet" ? "border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white text-[var(--color-community-ink)] hover:border-[var(--color-community-edge-strong)]"
    : "bg-[var(--color-community-blue,#2056d6)] text-white";
  const button = (onClick: () => void, label: string) => <button type="button" className={`${base} ${look} ${className}`} disabled={busy} onClick={onClick}>
    <DownloadIcon className="size-4" strokeWidth={2.2} aria-hidden="true" />{label}
  </button>;

  if (status === "installable") return button(async () => {
    setBusy(true);
    try { await promptInstall(); } finally { setBusy(false); }
  }, busy ? "Installing…" : "Download Pleros");

  // iPhone and iPad: Safari installs from its Share menu only.
  const hint = tone === "dark" ? "text-white/85" : "text-[var(--color-community-muted)]";
  return <div className={`grid gap-2 ${className.includes("w-full") ? "w-full" : "justify-items-start"}`}>
    {button(() => setSteps(open => !open), "Download Pleros")}
    {steps ? <ol className={`m-0 grid gap-1.5 p-0 text-[12.5px] leading-[18px] ${hint}`} style={{ listStyle: "none" }}>
      {status === "ios-manual" ? <>
        <li className="flex items-center gap-2"><ShareIcon className="size-3.5 shrink-0" strokeWidth={2.2} aria-hidden="true" />Tap Share in Safari.</li>
        <li className="flex items-center gap-2"><SquarePlusIcon className="size-3.5 shrink-0" strokeWidth={2.2} aria-hidden="true" />Choose Add to Home Screen.</li>
      </> : <li>Open pleros.org in Chrome or Safari, then choose Install from the browser menu.</li>}
    </ol> : null}
  </div>;
}
