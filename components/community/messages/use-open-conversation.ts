"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { openConversation } from "@/app/(site)/dashboard/community/_actions/message-actions";

/** Opens (or creates) the conversation with a member and navigates to it. */
export function useOpenConversation() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function open(userId: string) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await openConversation(userId);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push(`/dashboard/community/messages/${result.conversationId}`);
      } catch {
        setError("Could not open the conversation. Try again.");
      }
    });
  }

  return { open, pending, error };
}
