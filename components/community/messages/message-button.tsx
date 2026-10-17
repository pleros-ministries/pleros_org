"use client";

import { MessageCircleIcon } from "lucide-react";

import { useOpenConversation } from "./use-open-conversation";

/** Starts a private conversation with one member. */
export function MessageButton({
  userId,
  label = "Message",
  className = "",
}: {
  userId: string;
  label?: string;
  className?: string;
}) {
  const { open, pending, error } = useOpenConversation();

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => open(userId)}
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--color-community-edge)] bg-white px-4 text-[14px] font-medium text-[var(--color-community-blue)] transition-colors disabled:opacity-60 ${className}`}
      >
        <MessageCircleIcon className="size-3.5" strokeWidth={2} />
        {pending ? "Opening…" : label}
      </button>
      {error ? (
        <span role="alert" className="max-w-48 text-right text-xs text-red-700">
          {error}
        </span>
      ) : null}
    </span>
  );
}
