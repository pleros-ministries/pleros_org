"use client";

import { useEffect, useId, useRef } from "react";

import { ReportSheet, Segmented, sheetStyles } from "@/components/community/report/report-sheet";
import { usePaystackDonation, type CurrencyCode } from "@/components/home/paystack-donate-form";
import { partnerPayOnlineCopy } from "@/lib/partner-page-content";

const currencyOptions = (Object.keys(partnerPayOnlineCopy.currencies) as CurrencyCode[]).map(key => ({ key, label: key }));

/**
 * Pay online from the dashboard's Partner tab (user, 10 November): the same
 * Paystack flow as the public Partner page, in a bottom sheet so giving
 * never leaves the dashboard. Name and email start from the signed-in account.
 * A confirmed gift is added to Your gifts by the verify route.
 */
export function PartnerPaySheet({ name, email, onPaid, onClose }: { name: string; email: string; onPaid?: () => void; onClose: () => void }) {
  const pay = usePaystackDonation({ name, email });
  // A confirmed gift is recorded on the server; refresh Your gifts to show it.
  const paid = useRef(onPaid);
  useEffect(() => { paid.current = onPaid; });
  useEffect(() => { if (pay.status === "success") paid.current?.(); }, [pay.status]);
  const ids = useId();
  const symbol = partnerPayOnlineCopy.currencies[pay.currency].symbol;

  if (pay.status === "success") {
    return <ReportSheet title="Thank you for your gift" onClose={onClose}
      footer={close => <button type="button" className={sheetStyles.primary} onClick={close}>Done</button>}>
      {() => <p className={sheetStyles.muted}>Your payment was received and confirmed. God bless you.</p>}
    </ReportSheet>;
  }

  return <ReportSheet title="Pay online" subtitle={partnerPayOnlineCopy.helperText} onClose={onClose}
    footer={() => <button type="submit" form={`${ids}-form`} className={sheetStyles.primary} disabled={pay.isBusy}>
      {pay.status === "submitting" ? partnerPayOnlineCopy.submittingLabel
        : pay.status === "verifying" ? partnerPayOnlineCopy.verifyingLabel
          : partnerPayOnlineCopy.submitLabel}
    </button>}>
    {() => <form id={`${ids}-form`} onSubmit={pay.handleSubmit} noValidate style={{ display: "grid", gap: 16 }}>
      <Segmented label="Currency" options={currencyOptions} value={pay.currency} onChange={pay.setCurrency} />
      <label className={sheetStyles.field}>
        <span className={sheetStyles.label}>Amount ({symbol})</span>
        <input className={sheetStyles.input} type="number" inputMode="decimal" min={0} step="0.01" placeholder={`At least ${symbol}${partnerPayOnlineCopy.minimumAmount}`} value={pay.amount} onChange={event => pay.setAmount(event.currentTarget.value)} />
      </label>
      <label className={sheetStyles.field}>
        <span className={sheetStyles.label}>Full name</span>
        <input className={sheetStyles.input} type="text" autoComplete="name" value={pay.name} onChange={event => pay.setName(event.currentTarget.value)} />
      </label>
      <label className={sheetStyles.field}>
        <span className={sheetStyles.label}>Email address</span>
        <input className={sheetStyles.input} type="email" inputMode="email" autoComplete="email" value={pay.email} onChange={event => pay.setEmail(event.currentTarget.value)} />
      </label>
      {pay.error ? <p className={sheetStyles.error} role="alert">{pay.error}</p> : null}
    </form>}
  </ReportSheet>;
}
