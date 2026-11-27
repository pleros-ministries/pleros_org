"use client";

import { useMemo, useState } from "react";

import type {
  DistributionNote,
  DistributionRole,
} from "@/lib/sogp/discipleship-distribution-draft";

import styles from "./sogp-distribution-view.module.css";

export type DistributionGroup = {
  id: number;
  name: string;
  role: DistributionRole;
  location: string;
  enrolees: {
    id: number;
    name: string;
    region: string;
    birthYear: number | null;
    whatsappConsent: boolean;
    notes: DistributionNote[];
  }[];
};

const ROLES: DistributionRole[] = ["Pastor", "General Leader", "Worker", "Member", "Added by you"];
const LOCATIONS = ["Lagos", "Ibadan", "Ife", "Osogbo", "Sagamu", "Calabar", "Kwara", "North"];

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

function Chips<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | "All";
  options: [T | "All", number][];
  onChange: (v: T | "All") => void;
}) {
  return (
    <div className={styles.chips} role="group" aria-label={label}>
      {options.map(([v, count]) => (
        <button
          key={v}
          type="button"
          className={styles.chip}
          aria-pressed={value === v}
          onClick={() => onChange(v)}
        >
          {value === v ? <Check /> : null}
          {v} <span className={styles.chipCount}>{count}</span>
        </button>
      ))}
    </div>
  );
}

export function SogpDistributionView({ groups }: { groups: DistributionGroup[] }) {
  const [location, setLocation] = useState<string>("All");
  const [role, setRole] = useState<DistributionRole | "All">("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<number>>(() => new Set());

  const kpis = useMemo(() => {
    const enrolees = groups.flatMap((g) => g.enrolees);
    return [
      ["Leaders", groups.length, false],
      ["Enrolees", enrolees.length, false],
      ["No WhatsApp consent", enrolees.filter((e) => !e.whatsappConsent).length, true],
    ] as [string, number, boolean][];
  }, [groups]);

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      groups.filter(
        (g) =>
          (role === "All" || g.role === role) &&
          (!q ||
            g.name.toLowerCase().includes(q) ||
            g.enrolees.some((e) => e.name.toLowerCase().includes(q))),
      ),
    [groups, role, q],
  );

  const sections = LOCATIONS.filter((l) => location === "All" || location === l)
    .map((l) => ({
      location: l,
      leaders: visible
        .filter((g) => g.location === l)
        .sort(
          (a, b) =>
            ROLES.indexOf(a.role) - ROLES.indexOf(b.role) ||
            b.enrolees.length - a.enrolees.length,
        ),
    }))
    .filter((s) => s.leaders.length);

  const toggle = (id: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>SOGP group distribution</h1>

      <dl className={styles.strip}>
        {kpis.map(([label, value, warn]) => (
          <div key={label} data-warn={warn && value > 0 ? "" : undefined}>
            <dd>{value}</dd>
            <dt>{label}</dt>
          </div>
        ))}
      </dl>

      <div className={styles.tools}>
        <Chips
          label="Location"
          value={location}
          onChange={setLocation}
          options={[
            ["All", groups.length],
            ...LOCATIONS.map(
              (l) => [l, groups.filter((g) => g.location === l).length] as [string, number],
            ).filter(([, n]) => n),
          ]}
        />
        <Chips
          label="Role"
          value={role}
          onChange={setRole}
          options={[
            ["All", groups.length],
            ...ROLES.map(
              (r) => [r, groups.filter((g) => g.role === r).length] as [DistributionRole, number],
            ),
          ]}
        />
        <input
          className={styles.search}
          type="search"
          placeholder="Search a leader or enrolee"
          aria-label="Search names"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {sections.length === 0 ? (
        <p className={styles.empty}>No one matches that search.</p>
      ) : (
        sections.map((s) => (
          <section key={s.location} className={styles.section}>
            <div className={styles.sectionTitle}>
              <h2>{s.location}</h2>
              <span>
                {s.leaders.length} leader{s.leaders.length === 1 ? "" : "s"} ·{" "}
                {s.leaders.reduce((n, g) => n + g.enrolees.length, 0)} enrolees
              </span>
            </div>
            <div className={styles.grid}>
              {s.leaders.map((g) => {
                const isOpen =
                  open.has(g.id) ||
                  (!!q && g.enrolees.some((e) => e.name.toLowerCase().includes(q)));
                const noWhatsapp = g.enrolees.filter((e) => !e.whatsappConsent).length;
                return (
                  <article key={g.id} className={styles.card} data-open={isOpen || undefined}>
                    <button
                      type="button"
                      className={styles.cardHead}
                      aria-expanded={isOpen}
                      onClick={() => toggle(g.id)}
                    >
                      <span className={styles.cardMain}>
                        <span className={styles.name}>{g.name}</span>
                        <span className={styles.meta}>
                          {g.location} · {g.enrolees.length} SOGP enrolee
                          {g.enrolees.length === 1 ? "" : "s"}
                          {noWhatsapp ? (
                            <span className={styles.warnText}> · {noWhatsapp} no WhatsApp consent</span>
                          ) : null}
                        </span>
                      </span>
                      <span className={styles.cardSide}>
                        <span className={styles.role} data-pastor={g.role === "Pastor" || undefined}>
                          {g.role}
                        </span>
                        <svg className={styles.chevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </span>
                    </button>
                    {isOpen && g.enrolees.length ? (
                      <ul className={styles.list}>
                        {g.enrolees.map((e) => (
                          <li key={e.id}>
                            <span className={styles.who}>
                              <span className={styles.enrolee}>{e.name}</span>
                              <span className={styles.enroleeMeta}>
                                {e.region || "No region"}
                                {e.birthYear ? ` · born ${e.birthYear}` : ""}
                              </span>
                            </span>
                            <span className={styles.tags}>
                              {!e.whatsappConsent ? <span className={styles.dotWarn}>No WhatsApp consent</span> : null}
                              {e.notes.includes("placed") ? <span className={styles.pin}>Placed by you</span> : null}
                              {e.notes.includes("pastor") ? <span className={styles.pin}>Moved to a pastor</span> : null}
                              {e.notes.includes("elsewhere") ? <span className={styles.dotWarn}>Elsewhere</span> : null}
                              {e.notes.includes("nearby") ? <span className={styles.dotWarn}>Nearby</span> : null}
                              {e.notes.includes("older") ? <span className={styles.dotWarn}>Older</span> : null}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}

      <p className={styles.note}>
        Buckets: Pastor 10–20, General Leader 8–15, Worker 4–10, Member 1–3, counting people
        each already leads. Same location first, then nearby south-west states, then anywhere.
        Within that, enrolees go to an older leader where possible. Anyone born before 1990, or 8+
        years older than their leader, goes to a pastor.
      </p>
    </main>
  );
}
