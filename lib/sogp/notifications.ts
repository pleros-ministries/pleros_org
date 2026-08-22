export type SogpChannelReminder = {
  key: string;
  kind: "preparation" | "track_release" | "live_class";
  message: string;
};

type ReminderInput = {
  now: Date;
  cohort: {
    id: number;
    title: string;
    status: string;
    startsAt: Date;
  };
  tracks: Array<{
    id: number;
    dayNumber: number;
    releaseAt: Date;
    title: string;
  }>;
  liveClasses: Array<{
    id: number;
    title: string;
    startsAt: Date;
    youtubeLiveUrl: string | null;
  }>;
};

function withinMinutes(value: Date, target: Date, minutes: number) {
  return Math.abs(value.getTime() - target.getTime()) <= minutes * 60_000;
}

export function buildSogpChannelReminderCandidates(
  input: ReminderInput,
): SogpChannelReminder[] {
  const events: SogpChannelReminder[] = [];
  const oneHourAgo = new Date(input.now.getTime() - 60 * 60_000);

  for (const track of input.tracks) {
    if (track.releaseAt <= input.now && track.releaseAt > oneHourAgo) {
      events.push({
        key: `sogp:${input.cohort.id}:track:${track.id}:released`,
        kind: "track_release",
        message: `Day ${track.dayNumber} is ready: ${track.title}\n\nOpen your dashboard: https://pleros.org/dashboard/sogp`,
      });
    }
  }

  for (const liveClass of input.liveClasses) {
    const twentyFourHoursBefore = new Date(
      liveClass.startsAt.getTime() - 24 * 60 * 60_000,
    );
    const oneHourBefore = new Date(liveClass.startsAt.getTime() - 60 * 60_000);
    const suffix = liveClass.youtubeLiveUrl
      ? `\n\nWatch: ${liveClass.youtubeLiveUrl}`
      : "\n\nYour joining link will appear in the SOGP dashboard.";
    if (withinMinutes(input.now, twentyFourHoursBefore, 30)) {
      events.push({
        key: `sogp:${input.cohort.id}:live:${liveClass.id}:24h`,
        kind: "live_class",
        message: `${liveClass.title} starts in 24 hours.${suffix}`,
      });
    }
    if (withinMinutes(input.now, oneHourBefore, 30)) {
      events.push({
        key: `sogp:${input.cohort.id}:live:${liveClass.id}:1h`,
        kind: "live_class",
        message: `${liveClass.title} starts in one hour.${suffix}`,
      });
    }
  }

  if (input.cohort.status === "preparing" && input.now.getUTCHours() === 7) {
    const days = Math.ceil(
      (input.cohort.startsAt.getTime() - input.now.getTime()) / 86_400_000,
    );
    if (days > 0) {
      const dayKey = input.now.toISOString().slice(0, 10);
      events.push({
        key: `sogp:${input.cohort.id}:preparation:${dayKey}`,
        kind: "preparation",
        message: `${days} day${days === 1 ? "" : "s"} until ${input.cohort.title} begins. Prepare with today's resources in your dashboard.\n\nhttps://pleros.org/dashboard/sogp`,
      });
    }
  }

  return events;
}
