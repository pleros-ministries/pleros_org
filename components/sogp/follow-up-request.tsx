"use client";
import Link from "next/link";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { sendFollowUpRequest } from "@/app/_actions/sogp-follow-up-actions";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import type { FollowUpView } from "@/lib/db/queries/sogp-follow-up-requests";
import styles from "./follow-up-request.module.css";

function StatusPill({ children, tone }: { children: ReactNode; tone: "blue" | "green" | "amber" | "neutral" | "lilac" }) {
  return <span className={styles.pill} data-tone={tone === "amber" ? "todo" : tone === "blue" || tone === "green" ? "done" : undefined}>{children}</span>;
}

export function FollowUpRequest({ data, preview = false }: { data: FollowUpView; preview?: boolean }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const field = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const query = useQueryClient();
  const pending = data.request?.status === "pending";
  const initials = data.currentName?.trim().split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
  function submit() {
    if (preview) { setError("This is a visual preview; no request will be sent."); return; }
    if (!reason.trim()) { setError("Tell us what would help with your follow-up."); field.current?.focus(); return; }
    startSave(async () => {
      try {
        const result = await sendFollowUpRequest(reason);
        if (!result.ok) { setError(result.error); return; }
        await query.invalidateQueries({ queryKey: ["sogp", "learning-v3"] });
        router.push("/dashboard/sogp/follow-up/request"); router.refresh();
      } catch { setError("Your request could not be sent. Your reason is still here; try again."); }
    });
  }

  if (pending && data.request) return <section className={styles.page}>
    <header className={styles.pendingHero}>
      <span className={styles.clock}><DashboardIcon name="clock" /></span>
      <h1>Request received</h1><p>Your request is with a coordinator.</p>
      <StatusPill tone="amber">Request pending</StatusPill>
    </header>
    <article className={styles.requestCard}>
      <p className={styles.meta}>Your request</p><p className={styles.reason}>{data.request.reason}</p>
      <p className={styles.meta}>Sent {new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(data.request.createdAt))} (Lagos)</p>
      <div className={styles.ownerRow}><span className={styles.meta}>Current follow-up person</span><strong>{data.currentName ?? "Not yet assigned"}</strong></div>
    </article>
    <section className={styles.steps}><h2>What happens next</h2><ol><li><span>1</span>A coordinator reviews your request.</li><li><span>2</span>Your updated follow-up assignment will appear here.</li></ol></section>
    <div className={styles.info}><DashboardIcon name="people" size={16} /><p>{data.currentName ? `${data.currentName} continues to follow up with you until your assignment changes.` : "Your learning continues while your request is reviewed."}</p></div>
    <footer className={styles.footer}><Link className={styles.primary} href={preview ? "/preview/dashboard-v3" : "/dashboard/sogp"}>Continue learning<DashboardIcon name="arrow" /></Link><button type="button" className={styles.refresh} onClick={() => router.refresh()}>Refresh request status</button></footer>
  </section>;

  return <form className={styles.page} noValidate onSubmit={event => { event.preventDefault(); submit(); }}>
    <header className={styles.heading}><h1>Request someone else</h1><p>Tell a coordinator what would help.</p></header>
    {data.request ? <p role="status" className={styles.info}>{data.request.status === "resolved" ? "Your previous request was approved. Your current follow-up person is shown below." : "Your previous request was declined. Your current follow-up assignment is unchanged."}</p> : null}
    <div className={styles.currentPanel}><div className={styles.person}><span className={styles.avatar} aria-hidden="true">{initials || "?"}</span><span><strong>{data.currentName ?? "Not yet assigned"}</strong><span className={styles.meta}>Your current follow-up person</span></span></div>{data.assignedBy ? <p className={styles.meta} style={{ marginTop: 8 }}>{data.assignedBy}</p> : null}</div>
    <label className={styles.field} htmlFor="follow-up-reason">Reason for your request<textarea id="follow-up-reason" ref={field} value={reason} onChange={event => setReason(event.target.value)} maxLength={2000} rows={5} aria-invalid={Boolean(error)} aria-describedby={error ? "follow-up-error" : undefined} /></label>
    {error ? <p id="follow-up-error" role="alert" className={styles.error}>{error}</p> : null}
    <section className={styles.steps}><h2>While your request is reviewed</h2><p>{data.currentName ? `${data.currentName} continues to follow up with you until a coordinator changes the assignment.` : "You can continue learning before a follow-up person is assigned."}</p><p className={styles.muted}>Your learning and history continue.</p></section>
    <div className={styles.info}><DashboardIcon name="people" size={16} /><p>This request does not change your accepted group memberships.</p></div>
    {!data.canRequest ? <p className={styles.muted}>This enrolment is withdrawn. Your history remains available, but you cannot send a new request.</p> : null}
    <footer className={styles.footer}><button className={styles.primary} type="submit" disabled={saving || !data.canRequest}>{saving ? "Sending request…" : "Send reassignment request"}<DashboardIcon name="arrow" /></button></footer>
  </form>;
}
