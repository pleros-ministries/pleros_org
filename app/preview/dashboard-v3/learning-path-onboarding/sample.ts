/** Sample data for the learning path onboarding mockup. Dates count from Tuesday 24 November 2026. */
export const TODAY = new Date(Date.UTC(2026, 10, 24));

export const addDays = (days: number) => new Date(TODAY.getTime() + days * 86_400_000);
export const shortDate = (date: Date) => date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
export const longDate = (date: Date) => date.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });

/** Levels taught so far. Level 4 hasn't been taught yet, so the path is 1–3 then Advanced SOGP (user, 24 November). */
export const LEVELS = ["Gospel foundations", "Doctrinal foundations", "Redemption and the new creation"] as const;
export type StartLevel = 1 | 2 | 3;

/** SOGP: one level a week (six teachings and a group review), then Advanced SOGP. */
export function sogpRoad(start: StartLevel) {
  const weeks = LEVELS.length + 1 - start;
  const rows = LEVELS.slice(start - 1).map((title, index) => ({ label: `Level ${start + index}`, title, when: index === 0 ? "This week" : `From ${shortDate(addDays(index * 7))}` }));
  // Level 4 shows as coming soon (user, 24 November); Advanced SOGP follows it.
  return { rows: [...rows, { label: "Level 4", title: "Practical walk and assignment", when: "Coming soon", soon: true }, { label: "Then", title: "Advanced SOGP", when: "After level 4", soon: true }], finish: addDays(weeks * 7 - 1) };
}

const dayDate = (date: Date) => date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
/** "24–30 Nov", or "28 Nov – 4 Dec" across months. */
export function dateRange(from: Date, to: Date) {
  const sameMonth = from.getUTCMonth() === to.getUTCMonth();
  return sameMonth ? `${from.getUTCDate()}–${shortDate(to)}` : `${shortDate(from)} – ${shortDate(to)}`;
}

export type LevelStop = { level: number; trackCount: number; range: string | null; soon: boolean; tracks: { title: string; when: string | null }[]; review: string | null };

/**
 * The road by level (user, 24 November): track count and start–end dates, each
 * opening to its tracks with the day each falls on. A level is a week: a track
 * a day for six days, then the group review. Level 4 isn't taught yet.
 */
export function sogpLevels(start: StartLevel, curriculum: { level: number; tracks: { title: string }[] }[]) {
  const stops: LevelStop[] = curriculum.filter(level => level.level >= start).map(level => {
    const soon = level.level === 4;
    const week = level.level - start;
    return {
      level: level.level, trackCount: level.tracks.length, soon,
      range: soon ? null : dateRange(addDays(week * 7), addDays(week * 7 + 6)),
      tracks: level.tracks.map((track, index) => ({ title: track.title, when: soon ? null : dayDate(addDays(week * 7 + index)) })),
      review: soon ? null : dayDate(addDays(week * 7 + 6)),
    };
  });
  const taught = stops.filter(stop => !stop.soon);
  return { stops, tracks: taught.reduce((sum, stop) => sum + stop.trackCount, 0), finish: addDays(taught.length * 7 - 1) };
}

/** Podcast: 30 days at either pace, then SOGP from level 1 (Pastor, 18 November). */
export function podcastRoad(pace: 1 | 2) {
  const finish = addDays(29);
  return { rows: [
    { label: "Days 1–30", title: `${pace * 30} episodes, ${pace === 2 ? "two" : "one"} a day`, when: "This month" },
    { label: "Then", title: "SOGP from level 1", when: `From ${shortDate(addDays(30))}` },
  ], finish, episodes: pace * 30 };
}

export type Episode = { guid: string; title: string; part: number; duration: string };
export type Series = { id: string; title: string; episodes: Episode[] };

const series = (id: string, title: string, parts: number, minutes: number[]): Series => ({ id, title,
  episodes: Array.from({ length: parts }, (_, index) => ({ guid: `${id}-${index + 1}`, title: `${title} (Part ${index + 1})`, part: index + 1, duration: `${minutes[index % minutes.length]}:${String((index * 17) % 60).padStart(2, "0")}` })) });

/** Real teaching series names from the public podcast; no people. */
export const SERIES: Series[] = [
  series("reality", "The Reality of God’s Purpose", 6, [15, 14, 13]),
  series("pursuit", "The Pursuit of God’s Purpose", 6, [16, 14, 15]),
  series("fulfil", "How to Fulfil God’s Purpose", 8, [14, 15, 13]),
  series("gospel", "The Place of the Gospel in Your Life", 10, [13, 16]),
  series("faith", "Walk of Faith", 12, [15, 14]),
  series("kingdom", "Kingdom Living", 10, [14, 13, 16]),
  series("hearing", "Hearing God", 8, [15, 16]),
];

/** The Foundations plan: the series in order until the slots are full. */
export function suggestedPlan(slots: number) {
  return SERIES.flatMap(item => item.episodes).slice(0, slots).map(episode => episode.guid);
}
export const EPISODES = new Map(SERIES.flatMap(item => item.episodes).map(episode => [episode.guid, episode]));
