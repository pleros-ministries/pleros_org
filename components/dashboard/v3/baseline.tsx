"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { buildDashboardNavigation } from "@/lib/dashboard/navigation";
import type { DashboardArea } from "@/lib/dashboard/swipe-tabs";
import { useTabSwipe } from "./use-tab-swipe";
import { DashboardIcon, LearningCard, ReportRow, RootHeader } from "./primitives";
import styles from "./dashboard.module.css";

const panels: Record<string, { title: string; copy: string; href?: string }> = {
  notifications: { title: "Notifications", copy: "No new notifications in this sample." },
  plan: { title: "Plan & weekly reviews", copy: "7 of 24 tracks complete. Weekly group reviews are required. Scheduling will be connected in the reviews slice.", href: "/dashboard/sogp" },
  lesson: { title: "The life of faith", copy: "Sample playback position: 12:24 of 1:00:00. Open your signed-in lesson to continue actual playback.", href: "/dashboard/sogp/course" },
  reports: { title: "My reports", copy: "Sample day: Devotional not confirmed, Ministry Nil declared, Meetings reported.", href: "/dashboard/community/report" },
  message: { title: "Message Efe", copy: "Efe Daniels is a fictional support person. Open your signed-in inbox to message your actual contacts.", href: "/dashboard/community/messages" },
  community: { title: "Community", copy: "Your existing feed, groups, private messages and Ask Pleros are retained. This baseline reviews the You screen.", href: "/dashboard/community" },
};

/** Frozen synthetic baseline. No session, DB, notification or media writes. */
export function DashboardBaseline({ role = "learner" }: { role?: "learner" | "pastor" | "unit-leader" }) {
  // These are display fixtures, never an authorisation source. Linked live
  // destinations still derive access from the real session on the server.
  const navigation = buildDashboardNavigation({ sogpEnrolled: true, community: true, reporting: true, communityUnitId: null, discipleshipDiscussions: true, managesLocationGroups: role === "pastor", staffConsole: role === "pastor", churchOversight: role !== "learner", churchAssignments: role === "pastor" });
  const links = navigation.flatMap(section => section.items);
  const [panel, setPanel] = useState<string | null>(null);
  const [area, setArea] = useState<DashboardArea>("you");
  const scrollPositions = useRef({ you: 0, community: 0 });
  const selectArea = (next: DashboardArea) => {
    if (next === area) return;
    scrollPositions.current[area] = document.scrollingElement?.scrollTop ?? window.scrollY;
    setPanel(null);
    setArea(next);
  };
  const { handlers: swipeHandlers, viewportRef, trackStyle, selectTab } = useTabSwipe(area, selectArea);
  useEffect(() => { document.scrollingElement?.scrollTo({ top: scrollPositions.current[area], behavior: "instant" }); }, [area]);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (panel && !dialog.current?.open) dialog.current?.showModal();
    if (!panel && dialog.current?.open) dialog.current.close();
  }, [panel]);
  const content = panel ? panels[panel] : null;
  const profile = <Link prefetch={false} href="/dashboard/profile" className={styles.profileLink}><span className={styles.profileAvatar}>TO</span><span className={styles.rowCopy}><span className={styles.profileName}>Tolu</span><span className={styles.profileAction}>Profile & settings</span></span><DashboardIcon name="right" size={16} /></Link>;
  const workspace = [
    { label: "My learning", icon: "book" as const, href: "/dashboard/sogp" },
    { label: "My disciples", icon: "leaf" as const, href: "/dashboard/sogp/discipleship" },
    { label: "Saved contacts", icon: "people" as const, href: "/dashboard/community/report/people" },
    ...(role !== "learner" ? [{ label: "Church oversight", icon: "building" as const, href: "/dashboard/church" }] : []),
  ];
  const nav = <>
    <nav aria-label="Dashboard areas" className={styles.drawerRoots}><Link prefetch={false} href="/dashboard" aria-current="page"><DashboardIcon name="grid" />You</Link><Link prefetch={false} href="/dashboard/community"><DashboardIcon name="people" />Community</Link></nav>
    <nav aria-label="Your workspace" className={styles.workspace}><p>Your workspace</p>{workspace.map(item => <Link prefetch={false} key={item.label} href={item.href}><DashboardIcon name={item.icon} /><span>{item.label}</span><DashboardIcon name="right" size={16} /></Link>)}</nav>
    <details className={styles.retained}><summary>More destinations</summary><nav aria-label="Retained dashboard destinations">{links.map(link => <Link prefetch={false} key={link.key} href={link.href}>{link.label}</Link>)}<Link prefetch={false} href="/forgot-password">Password recovery</Link></nav></details>
  </>;
  return <div className={styles.root} data-dashboard-v3>
    <aside className={styles.sidebar}>{profile}{nav}</aside>
    <div className={styles.frame}>
      <RootHeader active={area} onMenu={() => setPanel("menu")} onNotifications={() => setPanel("notifications")} onTab={selectTab} />
      <main className={styles.content} {...swipeHandlers}>
        <div className={styles.swipeViewport} ref={viewportRef}>
        <motion.div className={styles.swipeTrack} style={trackStyle} data-swipe-track>
        <div className={styles.swipePage} data-area="you" data-active={area === "you"} inert={area !== "you"} aria-hidden={area !== "you"}>
        <h1 className={styles.greeting}>Good morning, Tolu</h1>
        <section className={styles.learning} aria-label="Continue learning">
          <div className={styles.sectionHeader}><h2>Continue learning</h2><button className={styles.textAction} onClick={() => setPanel("plan")}>View plan</button></div>
          <LearningCard lesson={{ title: "The life of faith", pathLabel: "SOGP · 1 hr/day", elapsedLabel: "12:24", durationLabel: "1:00:00", elapsedSeconds: 744, durationSeconds: 3600 }} onContinue={() => setPanel("lesson")} />
          <button className={styles.planRow} onClick={() => setPanel("plan")}><span className={styles.rowIcon}><DashboardIcon name="book" /></span><span className={styles.rowCopy}><span className={styles.rowTitle}>Plan & weekly reviews</span><span className={styles.metadata}>7 of 24 tracks complete</span></span><span className={styles.rowIcon}><DashboardIcon name="right" size={16} /></span></button>
        </section>
        <section className={styles.reports} aria-label="My reports">
          <div className={styles.sectionHeader}><h2>My reports</h2><button className={styles.textAction} onClick={() => setPanel("reports")}>View day</button></div>
          <div className={styles.reportList}>
            <ReportRow icon="book" title="Devotional" description="3 activities logged" status="Not confirmed" tone="amber" onClick={() => setPanel("reports")} />
            <ReportRow icon="heart" title="Ministry" description="No activity declared" status="Nil declared" tone="neutral" onClick={() => setPanel("reports")} />
            <ReportRow icon="people" title="Meetings" description="1 meeting recorded" status="Reported" tone="green" onClick={() => setPanel("reports")} />
          </div>
        </section>
        <section className={styles.support} aria-label="My support"><h2>My support</h2><div className={styles.person}><span className={styles.avatar}>ED</span><span className={styles.rowCopy}><span className={styles.rowTitle}>Efe Daniels</span><span className={styles.metadata}>Your discipler · Connected</span></span><button className={styles.textAction} onClick={() => setPanel("message")}>Message</button></div></section>
        <p className={styles.previewNote}>Design baseline · Fictional sample data · Live dashboard unchanged</p>
        </div>
        <section className={styles.swipePage} data-area="community" data-active={area === "community"} inert={area !== "community"} aria-hidden={area !== "community"} aria-label="Community preview">
          <h1 className={styles.greeting}>{panels.community.title}</h1>
          <p className={styles.previewNote}>{panels.community.copy}</p>
          <Link prefetch={false} href="/dashboard/community" className={styles.textAction}>Open signed-in community</Link>
        </section>
        </motion.div>
        </div>
      </main>
    </div>
    <dialog ref={dialog} className={`${styles.dialog} ${panel === "menu" ? styles.drawer : ""}`} aria-labelledby="baseline-dialog-title" onClose={() => setPanel(null)}>
      <div className={styles.dialogHeading}><h2 id="baseline-dialog-title">{panel === "menu" ? "Menu" : content?.title}</h2><button className={styles.iconButton} onClick={() => setPanel(null)} aria-label={panel === "menu" ? "Close menu" : "Close dialog"}><DashboardIcon name="close" /></button></div>
      {panel === "menu" ? <>{profile}{nav}</> : <><p>{content?.copy}</p>{content?.href ? <Link prefetch={false} href={content.href}>Open signed-in dashboard</Link> : null}</>}
      {panel !== "menu" ? <button onClick={() => setPanel(null)}>Close</button> : null}
    </dialog>
  </div>;
}
