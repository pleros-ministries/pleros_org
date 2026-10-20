"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { PlusIcon, UserPlusIcon } from "lucide-react";

import styles from "@/components/community/discipleship/discipleship-group.module.css";
import type { ChurchBranchSummary } from "@/lib/db/queries/church-home";

import { PlaceChurchMember, RenamePlace } from "./church-flows";
import { ChurchPage as Page, ChurchHeading as Heading } from "./church-ui";
import { Strip } from "./oversight-view";

/**
 * The Pastor's church structure under groups as oversight (19 October):
 * branches and their branch pastors, and which branch each member is placed
 * in. Units and workers are retired; groups carry everyone else's oversight.
 */
export function ChurchStructureView({ branches, header }: { branches: ChurchBranchSummary[]; header?: ReactNode }) {
  const pastors = branches.reduce((n, branch) => n + branch.pastors.length, 0);
  const needPastor = branches.filter(branch => !branch.pastors.length).length;
  return <Page bare={Boolean(header)}>
    {header ?? <Heading title="Church structure" sub="Branches and branch pastors" />}
    <Strip items={[["Branches", branches.length], ["Branch pastors", pastors], ["Need a pastor", needPastor, needPastor > 0]]} />
    <div className={styles.sectionTitle}><h2>Branches</h2><Link href="/dashboard/church/branches/new" className={`${styles.quiet} inline-flex items-center gap-1`}><PlusIcon className="size-3.5" strokeWidth={2.2} />Add branch</Link></div>
    {branches.length ? branches.map(branch => <section key={branch.id} className={`${styles.panel} pb-2`} aria-label={branch.name}>
      <div className="px-3.5 pt-3.5 pb-1">
        <span className={styles.rowCopy}>
          <span className="font-[family-name:var(--font-dashboard-heading)] text-[15px] leading-[22px] font-medium">{branch.name}</span>
          <span className={styles.rowMeta}>{branch.pastors.length ? `${branch.pastors.map(row => row.name).join(", ")} · Branch pastor` : "No branch pastor yet"}</span>
        </span>
      </div>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2.5 px-3.5 py-1">
        <RenamePlace key={branch.name} kind="branch" id={branch.id} name={branch.name} />
        {branch.pastors.length ? null : <Link className={`${styles.quiet} inline-flex items-center gap-1`} href={`/dashboard/church/branches/${branch.id}/pastor`}><UserPlusIcon className="size-3.5" strokeWidth={2.2} />Appoint a branch pastor</Link>}
      </div>
    </section>) : <p className={`${styles.panel} ${styles.empty}`}>No branches yet. Add the first branch to start.</p>}
    <div className={`${styles.panel} px-3.5 pt-3.5 pb-3.5`}><PlaceChurchMember branches={branches} /></div>
  </Page>;
}
