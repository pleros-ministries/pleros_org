import Link from "next/link";
import { ChevronRightIcon, ContactRoundIcon, GraduationCapIcon } from "lucide-react";

import homeStyles from "../community-home-v3.module.css";
import peopleStyles from "../discipleship/discipleship-group.module.css";

export type PeopleToBringIn = {
  contacts: number | null;
  enrollees: { total: number; free: number } | null;
};

/** Saved contacts and My enrollees: people on their way into the viewer's groups. Null rows are hidden. */
export function PeopleToBringInPanel({ people, id }: { people: PeopleToBringIn; id: string }) {
  if (people.contacts === null && people.enrollees === null) return null;
  return <section className={homeStyles.block} aria-labelledby={id}>
        <div className={homeStyles.blockHeading}><h2 id={id}>People to bring in</h2></div>
        <div className={peopleStyles.panel}>
          <ul className={peopleStyles.list}>
            {people.contacts !== null ? <li><Link href="/dashboard/community/contacts" className={peopleStyles.row}>
              <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#e4ebfd] text-[#2331ae]"><ContactRoundIcon className="size-4" strokeWidth={2} /></span>
              <span className={peopleStyles.rowCopy}><span className={peopleStyles.rowTitle} style={{ fontWeight: 500 }}>Saved contacts</span><span className={peopleStyles.rowMeta}>{people.contacts ? `${people.contacts} ${people.contacts === 1 ? "person" : "people"} you’ve met · invite them to a group` : "People you meet in ministry"}</span></span>
              <ChevronRightIcon className={`${peopleStyles.chev} size-4`} strokeWidth={2} />
            </Link></li> : null}
            {people.enrollees !== null ? <li><Link href="/dashboard/community/enrollees" className={peopleStyles.row}>
              <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#fde3cf] text-[#7a3a10]"><GraduationCapIcon className="size-4" strokeWidth={2} /></span>
              <span className={peopleStyles.rowCopy}><span className={peopleStyles.rowTitle} style={{ fontWeight: 500 }}>My enrollees</span><span className={peopleStyles.rowMeta}>{people.enrollees.free ? `${people.enrollees.free} signed up with your link, not in a group yet` : "People who sign up with your link"}</span></span>
              {people.enrollees.free ? <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-community-blue)] px-1.5 text-[11px] leading-none font-semibold tabular-nums text-white">{people.enrollees.free}</span> : null}
              <ChevronRightIcon className={`${peopleStyles.chev} size-4`} strokeWidth={2} />
            </Link></li> : null}
          </ul>
        </div>
        <p className={peopleStyles.note} style={{ marginTop: 10 }}>Contacts are people you’ve met; enrollees signed up with your link. Invite either into a group you lead.</p>
      </section>;
}
