"use client";

import { useId, useState, useTransition } from "react";
import { CheckIcon, LockIcon } from "lucide-react";

import { ReportSheet, Segmented, sheetStyles } from "@/components/community/report/report-sheet";
import { reportGivingAction } from "@/app/(site)/dashboard/_actions/partner-gifts";
import {
  GIFT_NOTE_MAX, formatGiftAmount, giftChannelLabels, giftChannels, giftCurrencies, localIsoDate,
  validateGiftInput, type GiftChannel, type GiftCurrency,
} from "@/lib/partner-gifts";

import styles from "./library.module.css";

type Draft = { amount: string; currency: GiftCurrency; channel: GiftChannel; givenOn: string; note: string };

const emptyDraft = (): Draft => ({ amount: "", currency: "NGN", channel: "bank", givenOn: localIsoDate(), note: "" });

const genericError = "Couldn't send that. Check your connection and try again.";


export function ReportGiving({ preview = false }: { preview?: boolean }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reported, setReported] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const open = () => { setError(null); setDraft(emptyDraft()); };

  const send = (value: Draft) => {
    const checked = validateGiftInput(value);
    if (!checked.ok) { setError(checked.error); return; }
    const summary = `${formatGiftAmount(checked.gift.amountMinor, checked.gift.currency)} by ${giftChannelLabels[checked.gift.channel].toLowerCase()}`;
    setDraft(null);
    setReported(summary);
    startTransition(async () => {
      const result = await (preview ? previewSend() : reportGivingAction(value)).catch(() => ({ ok: false as const, error: genericError }));
      if (!result.ok) {
        setReported(current => (current === summary ? null : current));
        setError(result.error);
        setDraft(value);
      }
    });
  };

  return <>
    <div className={styles.section}><h2>Report giving</h2></div>
    <div className={styles.panel}>
      <div className={styles.row}>
        <span className={styles.copy}>
          <b>{reported ? "Thank you for your gift" : "Given by transfer or cash?"}</b>
          <span>{reported ? `We’ve let Pleros know about ${reported}.` : "Let Pleros know so your gift can be recognised."}</span>
        </span>
        <button type="button" className={styles.compact} onClick={open}>{reported ? "Report another" : "Report giving"}</button>
      </div>
    </div>
    <p className={styles.note}><LockIcon className="mr-1 inline size-3 align-[-1px]" aria-hidden="true" />Only Pleros admins see what you report. Online gifts are recorded for you.</p>

    {draft ? <GivingSheet initial={draft} error={error} onSend={send} onClose={() => { setDraft(null); setError(null); }} /> : null}
  </>;
}

/** The preview page never sends: it pretends to, after a short wait. */
async function previewSend() {
  await new Promise(resolve => window.setTimeout(resolve, 600));
  return { ok: true as const };
}

const currencyOptions = giftCurrencies.map(key => ({ key, label: key === "NGN" ? "Naira (₦)" : "US Dollars ($)" }));

function GivingSheet({ initial, error, onSend, onClose }: {
  initial: Draft; error: string | null; onSend: (draft: Draft) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const ids = useId();
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft(current => ({ ...current, [key]: value }));
  const symbol = draft.currency === "NGN" ? "₦" : "$";

  return <ReportSheet title="Report giving" subtitle="Tell Pleros about a gift you’ve made" onClose={onClose}
    footer={() => <button type="submit" form={`${ids}-form`} className={sheetStyles.primary}>Send</button>}>
    {() => <form id={`${ids}-form`} noValidate style={{ display: "grid", gap: 16 }}
      onSubmit={event => { event.preventDefault(); onSend(draft); }}>
      <Segmented label="Currency" options={currencyOptions} value={draft.currency} onChange={value => set("currency", value)} />
      <label className={sheetStyles.field}>
        <span className={sheetStyles.label}>Amount ({symbol})</span>
        <input className={sheetStyles.input} type="text" inputMode="decimal" autoComplete="off" placeholder="For example 5,000"
          value={draft.amount} onChange={event => set("amount", event.currentTarget.value)} aria-invalid={error?.startsWith("Enter the amount") || undefined} />
      </label>
      <fieldset className={sheetStyles.field}>
        <legend className={sheetStyles.label} style={{ marginBottom: 6 }}>How you gave</legend>
        <div className={sheetStyles.chips}>
          {giftChannels.map(channel => <button key={channel} type="button" className={sheetStyles.chip} aria-pressed={draft.channel === channel} onClick={() => set("channel", channel)}>
            {draft.channel === channel ? <CheckIcon className="size-3.5" aria-hidden="true" /> : null}{giftChannelLabels[channel]}
          </button>)}
        </div>
      </fieldset>
      <label className={sheetStyles.field}>
        <span className={sheetStyles.label}>Day you gave</span>
        <input className={sheetStyles.input} type="date" max={localIsoDate()} value={draft.givenOn} onChange={event => set("givenOn", event.currentTarget.value)} />
      </label>
      <label className={sheetStyles.field}>
        <span className={sheetStyles.label}>Note <em>Optional</em></span>
        <textarea className={sheetStyles.textarea} maxLength={GIFT_NOTE_MAX} placeholder="Thanksgiving, a pledge or a project"
          value={draft.note} onChange={event => set("note", event.currentTarget.value)} />
      </label>
      {error ? <p className={sheetStyles.error} role="alert">{error}</p> : null}
    </form>}
  </ReportSheet>;
}
