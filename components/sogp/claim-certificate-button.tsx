"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { claimCertificate } from "@/app/(site)/dashboard/sogp/readiness/actions";
import styles from "./group-reviews.module.css";

export function ClaimCertificateButton() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);
  if (claimed) return <Link href="/dashboard/sogp/certificate" className={styles.rowLink}>View your issued certificate</Link>;
  return <div className={styles.reviewCard}>
    <button
      type="button"
      className={styles.primary}
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
    {message ? <p role="status" className={styles.meta}>{message}</p> : null}
  </div>;
}
