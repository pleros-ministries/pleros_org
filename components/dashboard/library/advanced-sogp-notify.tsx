"use client";

import { CheckIcon } from "lucide-react";
import { useState, useTransition } from "react";

import { registerAdvancedSogpInterestAction } from "@/app/(site)/dashboard/_actions/advanced-sogp";

import styles from "./advanced-sogp-notify.module.css";

/**
 * "Notify me when Advanced SOGP opens". `card` is the white pill on the purple
 * Library card; `panel` is the purple pill on Learning's pale panel.
 */
export function AdvancedSogpNotify({ initialRegistered, variant }: { initialRegistered: boolean; variant: "card" | "panel" }) {
  const [registered, setRegistered] = useState(initialRegistered);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const register = () => {
    setError(null);
    startTransition(async () => {
      const result = await registerAdvancedSogpInterestAction();
      if (result.ok) setRegistered(true);
      else setError(result.error);
    });
  };

  return <div className={styles.wrap} data-variant={variant}>
    <button type="button" className={styles.button} onClick={register} disabled={registered || pending}>
      {registered ? <><CheckIcon className="size-3.5" strokeWidth={2.4} aria-hidden="true" /> We’ll let you know</> : pending ? "Saving…" : "Notify me"}
    </button>
    {error ? <span className={styles.error} role="alert">{error}</span> : null}
  </div>;
}
