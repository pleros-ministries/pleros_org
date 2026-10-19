"use client";

import styles from "@/components/community/discipleship/discipleship-group.module.css";

/** Small shared pieces of the Oversight screens: initials marks and the stat strip. */
const tones: Array<[string, string]> = [["#e6ecfc", "#1f3260"], ["#efe7fb", "#3e1876"], ["#f6e4ac", "#5a4508"], ["#fde3cf", "#7a3a10"], ["#cfe6fb", "#0e3f73"]];
export const short = (name: string) => {
  const words = name.trim().split(/\s+/);
  return (words.length > 1 ? words.slice(0, 2).map(part => part[0] ?? "").join("") : name.trim().slice(0, 2)).toUpperCase();
};

export function Mark({ text, index }: { text: string; index: number }) {
  const [bg, ink] = tones[index % tones.length]!;
  return <span className="grid size-10 shrink-0 place-items-center rounded-[10px] text-[13px] font-semibold" style={{ background: bg, color: ink, fontFamily: "var(--font-dashboard-heading)" }} aria-hidden="true">{text}</span>;
}

export function Strip({ items }: { items: Array<[string, number | string, boolean?]> }) {
  return <div className={styles.strip}>
    {items.map(([label, value, warn]) => <div key={label}><span>{label}</span><strong style={{ color: warn ? "#92400e" : undefined }}>{value}</strong></div>)}
  </div>;
}
