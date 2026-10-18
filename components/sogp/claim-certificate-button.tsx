"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { claimCertificate } from "@/app/(site)/dashboard/sogp/readiness/actions";
import styles from "./learning-tools.module.css";

export function ClaimCertificateButton() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);
  if (claimed) return <Link href="/dashboard/sogp/certificate" className={styles.btn} data-block="">View your issued certificate</Link>;
  return <div className="grid gap-2">
    <button
      type="button"
      className={styles.btn}
      data-block=""
      disabled={pending}
      onClick={() => start(async () => {
        setMessage(null);
        try {
          const result = await claimCertificate();
          if (result.ok) setClaimed(true);
          else setMessage(result.error);
        } catch { setMessage("Could not issue your certificate. Try again."); }
      })}
    >{pending ? "Issuing…" : "Get your certificate"}</button>
    {message ? <p role="status" className={styles.note}>{message}</p> : null}
  </div>;
}
