import type { ReactNode } from "react";
import icons from "./lucide-icons.json";
import styles from "./dashboard.module.css";

export function DashboardIcon({ name, size = 20, strokeWidth }: { name: keyof typeof icons; size?: 16 | 20 | 24; strokeWidth?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth ?? 1.75 * 24 / size} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: icons[name] }} />;
}

export type StatusTone = "amber" | "green" | "blue" | "neutral" | "lilac";
export function StatusPill({ children, tone }: { children: ReactNode; tone: StatusTone }) {
  return <span className={styles.pill} data-tone={tone}>{children}</span>;
}

export function RootHeader({ active, onMenu, onNotifications, onTab, menuControl, notifications, communityAvailable = true, className = "" }: {
  active: "you" | "community";
  onMenu: () => void;
  onNotifications?: () => void;
  onTab: (tab: "you" | "community", animated?: boolean) => void;
  menuControl?: ReactNode;
  notifications?: ReactNode;
  communityAvailable?: boolean;
  className?: string;
}) {
  return <header className={`${styles.header} ${className}`}>
    {menuControl ?? <button className={styles.iconButton} onClick={onMenu} aria-label="Open menu" aria-haspopup="dialog"><DashboardIcon name="menu" /></button>}
    <nav aria-label="Dashboard areas" className={styles.tabs}>
      <button onClick={event => onTab("you", event.detail !== 0)} aria-current={active === "you" ? "page" : undefined}>You</button>
      <button disabled={!communityAvailable} aria-disabled={!communityAvailable} title={communityAvailable ? undefined : "Community access is not available for this account"} onClick={event => onTab("community", event.detail !== 0)} aria-current={active === "community" ? "page" : undefined}>Community</button>
    </nav>
    {notifications ?? <button className={styles.iconButton} onClick={onNotifications} aria-label="Notifications" aria-haspopup="dialog"><DashboardIcon name="bell" /><span className={styles.unread} /></button>}
  </header>;
}

export function LearningCard({ onContinue, lesson, actionLabel = "Continue lesson" }: { onContinue: () => void; lesson: {
  title: string; pathLabel: string; elapsedLabel: string; durationLabel: string;
  elapsedSeconds: number; durationSeconds: number;
  leftLabel?: string; rightLabel?: string; progressLabel?: string;
}; actionLabel?: string }) {
  return <article className={styles.learningCard} aria-label="Current lesson">
    <p className={styles.learningMeta}>{lesson.pathLabel}</p>
    <h2 className={styles.lessonTitle} data-dashboard-learning-title>{lesson.title}</h2>
    <div className={styles.progress} role={lesson.durationSeconds > 0 ? "progressbar" : undefined} aria-label={lesson.durationSeconds > 0 ? lesson.progressLabel ?? "Lesson playback" : undefined} aria-valuemin={lesson.durationSeconds > 0 ? 0 : undefined} aria-valuemax={lesson.durationSeconds > 0 ? lesson.durationSeconds : undefined} aria-valuenow={lesson.durationSeconds > 0 ? lesson.elapsedSeconds : undefined}><span style={{ width: `${Math.min(100, Math.max(0, lesson.durationSeconds > 0 ? lesson.elapsedSeconds / lesson.durationSeconds * 100 : 0))}%` }} /></div>
    <div className={styles.playbackMeta}><span>{lesson.leftLabel ?? `${lesson.elapsedLabel} elapsed`}</span><span>{lesson.rightLabel ?? `${lesson.durationLabel} total`}</span></div>
    <button className={styles.lessonAction} onClick={onContinue}>{actionLabel}<DashboardIcon name="play" size={24} /></button>
  </article>;
}

export function ReportRow({ title, description, status, tone, icon, onClick }: {
  title: string; description: string; status: string; tone: StatusTone;
  icon: keyof typeof icons; onClick: () => void;
}) {
  return <button className={styles.reportRow} onClick={onClick}>
    <span className={styles.rowIcon}><DashboardIcon name={icon} /></span>
    <span className={styles.rowCopy}><span className={styles.rowTitle}>{title}</span><span className={styles.metadata}>{description}</span></span>
    <StatusPill tone={tone}>{status}</StatusPill>
  </button>;
}
