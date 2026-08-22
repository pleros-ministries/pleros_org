"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CopyToClipboardButton({
  value,
  label,
  icon: Icon = CopyIcon,
}: {
  value: string;
  label: string;
  icon?: LucideIcon;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      aria-label={label}
    >
      {copied ? <CheckIcon className="size-4" /> : <Icon className="size-4" />}
    </Button>
  );
}
