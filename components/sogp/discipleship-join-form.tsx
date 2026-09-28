"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { joinDiscipleshipGroupAction } from "@/app/(site)/dashboard/sogp/discipleship/_actions";
import { Button } from "@/components/ui/button";

export function DiscipleshipJoinForm({
  code,
  leaderFirstName,
}: {
  code: string;
  leaderFirstName: string;
}) {
  const router = useRouter();
  const [sharesPhone, setSharesPhone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function join(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await joinDiscipleshipGroupAction({ code, sharesPhone });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/dashboard/sogp/discipleship");
    });
  }

  return (
    <form className="grid gap-4" onSubmit={join}>
      <label className="flex items-start gap-3 [font-size:0.8125rem] leading-[1.5] text-[var(--color-text-strong)]">
        <input
          type="checkbox"
          checked={sharesPhone}
          onChange={(event) => setSharesPhone(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-[var(--color-brand-blue)]"
        />
        <span>
          Let {leaderFirstName} contact me on WhatsApp
          <span className="block [font-size:0.75rem] text-[var(--color-text-muted)]">
            Optional. Shares the phone number from your enrolment. You can change this later.
          </span>
        </span>
      </label>
      {error ? (
        <p role="alert" className="[font-size:0.8125rem] text-red-700">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="min-h-12 w-full rounded-full bg-[var(--color-brand-blue)] [font-size:0.875rem] text-white"
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
        Join {leaderFirstName}&apos;s group
      </Button>
    </form>
  );
}
