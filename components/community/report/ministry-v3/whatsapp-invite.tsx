"use client";
import { useState } from "react";
import { DashboardIcon, StatusPill } from "@/components/dashboard/v3/primitives";
import styles from "@/components/sogp/follow-up-invitations.module.css";

export type WhatsAppInviteGroup = { id: number; name: string; inviteUrl: string };

/**
 * Paper: Pleros-invite-whatsapp-link. The leader opens WhatsApp with a group
 * invite link for a private saved contact. Nothing is stored or sent by Pleros;
 * the recipient still creates an account and accepts the invitation to join.
 */
export function WhatsAppGroupInvite({ contact, groups, leaderName, whatsappBase }: {
  contact: { name: string; phone: string }; groups: WhatsAppInviteGroup[]; leaderName: string; whatsappBase: string | null;
}) {
  const [groupId, setGroupId] = useState(groups[0]?.id ?? 0);
  const group = groups.find(item => item.id === groupId);
  const first = contact.name.trim().split(/\s+/)[0] || contact.name;
  const message = group ? `Hi ${first}, join ${group.name} on Pleros. Create an account, then accept the group invitation when you’re ready. ${group.inviteUrl}` : "";
  const href = whatsappBase && group ? `${whatsappBase}?text=${encodeURIComponent(message)}` : null;
  return <section className={styles.page}>
    <div className={styles.heading}><h1>Invite {first}</h1><p>Share a group invitation link.</p></div>
    <div className={styles.heading}><StatusPill tone="neutral">No message sent</StatusPill></div>
    <div className={styles.card}><strong>{contact.name}</strong><span className={styles.meta}>{contact.phone}</span><span className={styles.meta}>No Pleros account · Private saved contact</span></div>
    <div className={styles.section}><h2>Discipleship group</h2>
      {groups.length ? groups.map(item => <label key={item.id} className={styles.card}><span className={styles.person}>{groups.length > 1 ? <input type="radio" name="group" checked={groupId === item.id} onChange={() => setGroupId(item.id)} /> : null}<span><strong>{item.name}</strong><span className={styles.meta}>Led by {leaderName}</span></span></span></label>)
        : <p className={styles.muted}>You don’t lead an active group yet. Open My disciples to start one.</p>}
    </div>
    {group ? <div className={styles.section}><h2>Message preview</h2><div className={styles.panel}><p>Hi {first}, join {group.name} on Pleros.</p><p>Create an account, then accept the group invitation when you’re ready.</p><p className={styles.textLink} style={{ justifyContent: "flex-start", overflowWrap: "anywhere" }}>{group.inviteUrl}</p></div></div> : null}
    <div className={styles.info}><DashboardIcon name="shield" size={16} /><p>An account alone doesn’t make them a member. They must accept the group invitation. Your saved contact notes stay private.</p></div>
    <footer className={styles.footer}><p className={styles.meta} style={{ textAlign: "center" }}>{href ? "Choose a chat and send it in WhatsApp." : "This phone number can’t open WhatsApp. Copy the link instead."}</p>
      {href ? <a className={styles.primary} href={href} target="_blank" rel="noopener noreferrer">Share on WhatsApp<DashboardIcon name="send" /></a>
        : group ? <button type="button" className={styles.primary} onClick={() => navigator.clipboard?.writeText(message).catch(() => undefined)}>Copy invitation message<DashboardIcon name="check" /></button> : null}</footer>
  </section>;
}
