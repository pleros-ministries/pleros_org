import { CheckIcon } from "lucide-react";

import {
  DISCIPLESHIP_STATUS_LABELS,
  SALVATION_STATUS_LABELS,
  isFollowUpDue,
  type DiscipleshipStatus,
  type SalvationStatus,
} from "@/lib/community/outreach-contacts";
import { dateKeyLabel } from "@/lib/community/time";

const badge = "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-medium";

const SALVATION_TONE: Record<SalvationStatus, string | null> = {
  unknown: null,
  not_saved: "bg-zinc-100 text-zinc-600",
  saved: "bg-emerald-50 text-emerald-700",
  believer: "bg-sky-50 text-sky-700",
};

const DISCIPLESHIP_TONE: Record<DiscipleshipStatus, string | null> = {
  not_started: null,
  following_up: "bg-sky-50 text-sky-700",
  in_discipleship: "bg-indigo-50 text-indigo-700",
  in_sogp: "bg-indigo-50 text-indigo-700",
  in_church: "bg-emerald-50 text-emerald-700",
  lost_contact: "bg-zinc-100 text-zinc-500",
};

/** Where a person is with God and with us, and when they are next due. Quiet when nothing is set. */
export function ContactStatusBadges({
  contact,
  today,
}: {
  contact: {
    salvationStatus: SalvationStatus;
    discipleshipStatus: DiscipleshipStatus;
    nextFollowUpDate: string | null;
    followedUpAt: string | null;
  };
  today: string;
}) {
  const salvation = SALVATION_TONE[contact.salvationStatus];
  const discipleship = DISCIPLESHIP_TONE[contact.discipleshipStatus];
  const due = isFollowUpDue(contact, today);
  const items = [
    salvation ? (
      <span key="salvation" className={`${badge} ${salvation}`}>
        {SALVATION_STATUS_LABELS[contact.salvationStatus]}
      </span>
    ) : null,
    discipleship ? (
      <span key="discipleship" className={`${badge} ${discipleship}`}>
        {DISCIPLESHIP_STATUS_LABELS[contact.discipleshipStatus]}
      </span>
    ) : null,
    contact.nextFollowUpDate ? (
      <span
        key="next"
        className={`${badge} ${
          due ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-600"
        }`}
      >
        {due ? "Follow-up due" : "Next"} {dateKeyLabel(contact.nextFollowUpDate)}
      </span>
    ) : null,
    contact.followedUpAt ? (
      <span key="done" className={`${badge} bg-emerald-50 text-emerald-700`}>
        <CheckIcon className="size-3" strokeWidth={2.5} aria-hidden />
        Followed up
      </span>
    ) : null,
  ].filter(Boolean);

  if (items.length === 0) return null;
  return <p className="flex flex-wrap items-center gap-1.5">{items}</p>;
}
