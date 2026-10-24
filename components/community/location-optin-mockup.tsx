"use client";

import Link from "next/link";
import { useState } from "react";
import { LockIcon, LogOutIcon, MapPinIcon, UsersRoundIcon } from "lucide-react";

import groupStyles from "./discipleship/discipleship-group.module.css";
import { Initials } from "./discipleship/shared";
import { GroupCard } from "./community-home-cards";
import { GroupHero, GroupTabs } from "./groups/group-hero";
import homeStyles from "./community-home-v3.module.css";
import { ActionMenu } from "./action-menu";

/**
 * Mockup (sample data, nothing saved): location groups become opt-in (Pastor,
 * 22 October: seeing everyone near you "is good for us but not good for
 * people"). You're placed by your location as now, but no one sees you there
 * until you join; you can leave any time. Only people who joined see each
 * other, and the group's pastor sees them there too.
 */

const JOINED = ["Sample Ade", "Sample Bisi", "Sample Chidi", "Sample Dayo", "Sample Efe"];

export function LocationOptInMockup({ screen }: { screen: "home" | "invite" | "joined" }) {
  const [tab, setTab] = useState<"discussions" | "members" | "about">("members");

  if (screen === "home") return <div className={homeStyles.home}>
    <header className={homeStyles.heading}><h1>Your Pleros Community</h1></header>
    <section className={homeStyles.block}>
      <div className={homeStyles.blockHeading}><h2>Groups you’re under</h2></div>
      <div className={homeStyles.groupGrid}>
        <GroupCard href="#" art="discipleship" tag="Your group" title="Sample leaders’ group" meta="Led by Sample" />
        {/* Not joined: the card offers the group instead of opening it as yours. */}
        <Link href="?screen=invite" className={`${homeStyles.groupCard} no-underline`} data-art="location" title="Oyo, Nigeria">
          <span className={homeStyles.groupTop}><span className={homeStyles.groupTag}>Near you</span><h3>Oyo, Nigeria</h3></span>
          <span className={homeStyles.groupMeta}>Join if you’d like · 31 joined</span>
        </Link>
      </div>
    </section>
  </div>;

  const joined = screen === "joined";
  return <div className="grid gap-4 px-4 pt-4 pb-10">
    <GroupHero art="location" tag={joined ? "Location" : "Near you"} title="Oyo, Nigeria"
      meta={<>{joined ? "32 joined" : "31 joined"} · Pastor Sample</>}
      actions={joined
        ? <ActionMenu label="Location group options" className="!size-8 !rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white" actions={[
          { key: "leave", label: "Leave this group", icon: LogOutIcon, danger: true, onSelect: () => window.alert("Preview: you’d leave, and no one here would see you any more.") },
        ]} />
        : null} />

    {joined ? <>
      <GroupTabs tabs={[{ key: "discussions", label: "Discussions" }, { key: "members", label: "Members", count: 32 }, { key: "about", label: "About" }]} value={tab} onChange={setTab} />
      {tab === "members" ? <>
        <div className={groupStyles.panel}><ul className={groupStyles.list}>
          {JOINED.map(name => <li key={name} className={groupStyles.row}>
            <Initials name={name} />
            <span className={groupStyles.rowCopy}><span className={groupStyles.rowTitle}>{name}</span><span className={groupStyles.rowMeta}>Joined October</span></span>
          </li>)}
        </ul></div>
        <p className={`${groupStyles.note} inline-flex items-start gap-1.5`}><LockIcon className="mt-0.5 size-3 shrink-0" strokeWidth={2.2} aria-hidden="true" />Only people who joined appear here, and only to each other and the group’s pastor. Leave any time from the ··· menu.</p>
      </> : <p className={`${groupStyles.panel} ${groupStyles.empty}`}>{tab === "discussions" ? "The group’s discussions, as now." : "About the group, as now."}</p>}
    </> : <>
      {/* Not joined: what it is, who's there in numbers only, and Join. */}
      <div className={`${groupStyles.panel} grid gap-3 p-4`}>
        <span className="flex items-center gap-2.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#e4ebfd] text-[#2331ae]" aria-hidden="true"><MapPinIcon className="size-[18px]" strokeWidth={2} /></span>
          <span className={groupStyles.rowCopy}><span className={groupStyles.rowTitle}>People in Pleros near you</span><span className={groupStyles.rowMeta} style={{ whiteSpace: "normal" }}>Join to see each other, talk together and be known to your location’s pastor</span></span>
        </span>
        <ul className="m-0 grid list-none gap-1.5 p-0 text-[13px] leading-5 text-(--color-text-muted)">
          <li className="flex gap-2"><UsersRoundIcon className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden="true" />31 people have joined</li>
          <li className="flex gap-2"><LockIcon className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden="true" />Until you join, no one here sees you</li>
          <li className="flex gap-2"><LogOutIcon className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden="true" />You can leave any time</li>
        </ul>
        <Link href="?screen=joined" className={`${groupStyles.btn} h-[38px] justify-self-stretch text-[13.5px] no-underline`} data-primary="">Join Oyo, Nigeria</Link>
      </div>
      <p className={groupStyles.note}>Your discipleship group and the people who lead you are separate, and don’t change.</p>
    </>}
  </div>;
}
