"use client";
import { useId, useState, type ReactNode } from "react";
import { StatusPill } from "@/components/dashboard/v3/primitives";
import styles from "./discipleship-v3.module.css";

/** White, hairline-separated sections shared by leader and member tools. */
export function DiscipleshipSection({ id,title,description,icon,action,children }: {
  id?: string; title: string; description?: string; icon?: ReactNode; action?: ReactNode; children: ReactNode;
}) {
  return <section id={id} className={styles.section}>
    <header className={styles.sectionHeader}>
      <div><h2>{icon ? <span aria-hidden="true">{icon}</span> : null}{title}</h2>{description ? <p>{description}</p> : null}</div>
      {action}
    </header>
    <div className={styles.sectionBody}>{children}</div>
  </section>;
}

/** Pleros-disciple's identity block; never fills gaps with mock learning facts. */
export function DiscipleProfile({ name,groupName,paused = false,actions,checkIns,reviews,children }: {
  name: string; groupName: string; paused?: boolean; actions?: ReactNode; checkIns?: ReactNode; reviews?: ReactNode; children: ReactNode;
}) {
  const id = useId();
  const [view,setView] = useState("overview");
  const panels = [{ key: "overview",label: "Overview",body: children },...(checkIns ? [{ key: "checkins",label: "Check-ins",body: checkIns }] : []),...(reviews ? [{ key: "reviews",label: "Reviews",body: reviews }] : [])];
  const activePanel = panels.find(panel => panel.key === view) ?? panels[0]!;
  const initials = name.trim().split(/\s+/).slice(0,2).map(part => part[0]).join("").toUpperCase() || "?";
  return <section className={styles.profile} aria-label={`${name} progress and follow-up`}>
    <header className={styles.profileHeader}>
      <span className={styles.avatar} aria-hidden="true">{initials}</span>
      <h3 className={styles.profileName}>{name}</h3>
      <p>{groupName}</p>
      <StatusPill tone={paused ? "amber" : "green"}>{paused ? "Group paused" : "Connected"}</StatusPill>
    </header>
    {actions ? <div className={styles.profileActions}>{actions}</div> : null}
    {panels.length > 1 ? <>
      <div role="tablist" aria-label={`${name}'s details`} className={`${styles.tabs} ${styles.profileTabs}`}>
        {panels.map((panel,index) => <button key={panel.key} type="button" role="tab" id={`${id}-${panel.key}`} data-profile-tab={panel.key} aria-controls={`${id}-panel`} aria-selected={activePanel.key === panel.key} tabIndex={activePanel.key === panel.key ? 0 : -1} onClick={() => setView(panel.key)} onKeyDown={event => {
          if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
          event.preventDefault();
          const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? panels.length - 1 : (index + (event.key === "ArrowLeft" ? -1 : 1) + panels.length) % panels.length;
          const next = panels[nextIndex]!; setView(next.key);
          event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-profile-tab="${next.key}"]`)?.focus();
        }}>{panel.label}</button>)}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${activePanel.key}`} tabIndex={0} className={styles.profilePanel}>{activePanel.body}</div>
    </> : <div className={styles.profilePanel}>{children}</div>}
  </section>;
}
