"use client";

import { useId, useRef, useState, useTransition } from "react";
import { BanknoteIcon, CheckIcon, CreditCardIcon, HandCoinsIcon, HeartHandshakeIcon, Trash2Icon } from "lucide-react";

import { ReportSheet, Segmented, sheetStyles } from "@/components/community/report/report-sheet";
import { addPartnerGiftAction, removePartnerGiftAction } from "@/app/(site)/dashboard/_actions/partner-gifts";
import {
  GIFT_NOTE_MAX, formatGiftAmount, giftChannelLabels, giftChannels, giftCurrencies, localIsoDate, sortGifts,
  validateGiftInput, yearTotals, type GiftChannel, type GiftCurrency, type PartnerGift,
} from "@/lib/partner-gifts";

import styles from "./library.module.css";

const SHOWN = 5;

const channelLooks: Record<GiftChannel, { icon: typeof BanknoteIcon; bg: string; ink: string }> = {
  bank: { icon: BanknoteIcon, bg: "#fde3cf", ink: "#7a3a10" },
  online: { icon: CreditCardIcon, bg: "#e4ebfd", ink: "#2331ae" },
  cash: { icon: HandCoinsIcon, bg: "#f6ecd9", ink: "#5a3d0c" },
  other: { icon: HeartHandshakeIcon, bg: "#f6d9de", ink: "#7a2e45" },
};

type Draft = { amount: string; currency: GiftCurrency; channel: GiftChannel; givenOn: string; note: string };

const emptyDraft = (): Draft => ({ amount: "", currency: "NGN", channel: "bank", givenOn: localIsoDate(), note: "" });

function formatDay(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * "Your gifts" on the Partner tab (user, 10 November): a giver's own record.
 * Bank transfers, cash and other gifts are added by hand; online gifts Paystack
 * confirms are added for them. Saves and removals show at once and roll back
 * with a message.
 */
export function PartnerGifts({ initialGifts, preview = false }: { initialGifts: PartnerGift[]; preview?: boolean }) {
  const [gifts, setGifts] = useState(initialGifts);
  const [seen, setSeen] = useState(initialGifts);
  // A refresh (for example after an online gift) brings the saved truth.
  if (seen !== initialGifts) { setSeen(initialGifts); setGifts(initialGifts); }

  const [draft, setDraft] = useState<Draft | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [, startTransition] = useTransition();
  const tempId = useRef(-1);

  const sorted = sortGifts(gifts);
  const shown = showAll ? sorted : sorted.slice(0, SHOWN);
  const totals = yearTotals(gifts);

  const open = () => { setSheetError(null); setPageError(null); setDraft(emptyDraft()); };

  const save = (value: Draft) => {
    const checked = validateGiftInput(value);
    if (!checked.ok) { setSheetError(checked.error); return; }
    const id = tempId.current--;
    setGifts(current => [...current, { id, ...checked.gift }]);
    setDraft(null);
    setPageError(null);
    startTransition(async () => {
      const result = await (preview ? previewAdd(id, checked.gift) : addPartnerGiftAction(value)).catch(() => ({ ok: false as const, error: "Couldn't save that. Check your connection and try again." }));
      if (result.ok) {
        setGifts(current => current.map(gift => (gift.id === id ? result.gift : gift)));
      } else {
        setGifts(current => current.filter(gift => gift.id !== id));
        setSheetError(result.error);
        setDraft(value);
      }
    });
  };

  const remove = (gift: PartnerGift) => {
    setConfirming(null);
    setPageError(null);
    setGifts(current => current.filter(item => item.id !== gift.id));
    startTransition(async () => {
      const result = await (preview ? previewRemove() : removePartnerGiftAction(gift.id)).catch(() => ({ ok: false as const, error: "Couldn't remove that. Check your connection and try again." }));
      if (!result.ok) {
        setGifts(current => (current.some(item => item.id === gift.id) ? current : [...current, gift]));
        setPageError(result.error);
      }
    });
  };

  return <>
    <div className={styles.section}>
      <h2>Your gifts</h2>
      <button type="button" className={styles.compact} onClick={open}>Add a gift</button>
    </div>
    {totals.length ? <p className={styles.note} style={{ margin: "-4px 2px 0" }}>
      This year: {totals.map(total => formatGiftAmount(total.amountMinor, total.currency)).join(" · ")}
    </p> : null}

    {sorted.length === 0
      ? <div className={`${styles.panel} ${styles.empty}`}>Given by bank transfer or cash? Add it here to keep a record. Online gifts made while you’re logged in appear here on their own.</div>
      : <div className={styles.panel}>
        {shown.map(gift => {
          const look = channelLooks[gift.channel];
          const Icon = look.icon;
          const amount = formatGiftAmount(gift.amountMinor, gift.currency);
          const pending = gift.id < 0;
          return <div key={gift.id} className={styles.row} aria-busy={pending || undefined}>
            <span className={styles.icon} style={{ background: look.bg, color: look.ink }} aria-hidden="true"><Icon className="size-4" strokeWidth={2} /></span>
            <span className={styles.copy}>
              <b>{amount}</b>
              <span>{giftChannelLabels[gift.channel]} · {formatDay(gift.givenOn)}{pending ? " · Saving…" : ""}</span>
              {gift.note ? <span>{gift.note}</span> : null}
            </span>
            {pending ? null : confirming === gift.id
              ? <button type="button" className={styles.copyBtn} style={{ color: "var(--destructive)" }} onClick={() => remove(gift)} onBlur={() => setConfirming(null)} autoFocus>Remove</button>
              : <button type="button" className={styles.iconBtn} onClick={() => setConfirming(gift.id)} aria-label={`Remove gift of ${amount} on ${formatDay(gift.givenOn)}`}><Trash2Icon className="size-4" aria-hidden="true" /></button>}
          </div>;
        })}
        {sorted.length > SHOWN ? <button type="button" className={`${styles.row} ${styles.more}`} onClick={() => setShowAll(value => !value)}>
          {showAll ? "Show fewer" : `Show all ${sorted.length}`}
        </button> : null}
      </div>}
    {pageError ? <p className={styles.alert} role="alert">{pageError}</p> : null}
    <p className={styles.note}>Your own record of what you’ve given. Adding a gift here doesn’t move any money.</p>

    {draft ? <GiftSheet initial={draft} error={sheetError} onSave={save} onClose={() => { setDraft(null); setSheetError(null); }} /> : null}
  </>;
}

/** The preview page never saves: it pretends to, after a short wait. */
const wait = () => new Promise(resolve => window.setTimeout(resolve, 600));
async function previewAdd(id: number, gift: Omit<PartnerGift, "id">) { await wait(); return { ok: true as const, gift: { id: -id + 1000, ...gift } }; }
async function previewRemove() { await wait(); return { ok: true as const }; }

const currencyOptions = giftCurrencies.map(key => ({ key, label: key === "NGN" ? "Naira (₦)" : "US Dollars ($)" }));

function GiftSheet({ initial, error, onSave, onClose }: {
  initial: Draft; error: string | null; onSave: (draft: Draft) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const ids = useId();
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft(current => ({ ...current, [key]: value }));
  const symbol = draft.currency === "NGN" ? "₦" : "$";

  return <ReportSheet title="Add a gift" subtitle="Record a gift you’ve made to Pleros" onClose={onClose}
    footer={() => <button type="submit" form={`${ids}-form`} className={sheetStyles.primary}>Save</button>}>
    {() => <form id={`${ids}-form`} noValidate style={{ display: "grid", gap: 16 }}
      onSubmit={event => { event.preventDefault(); onSave(draft); }}>
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
