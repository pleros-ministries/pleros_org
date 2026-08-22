"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { partnerPayOnlineCopy } from "@/lib/partner-page-content";
import { cn } from "@/lib/utils";
import { validateEmail, validateFirstName } from "@/lib/welcome-flow";

type CurrencyCode = keyof typeof partnerPayOnlineCopy.currencies;

type FormStatus = "idle" | "submitting" | "verifying" | "success" | "error";

export function PaystackDonateForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("NGN");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const normalizedName = useMemo(() => name.trim(), [name]);
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const isBusy = status === "submitting" || status === "verifying";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isBusy) {
      return;
    }

    if (!validateFirstName(normalizedName)) {
      setError("Enter your name.");
      return;
    }

    if (!validateEmail(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    const parsedAmount = Number.parseFloat(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount < partnerPayOnlineCopy.minimumAmount) {
      setError(
        `Enter an amount of at least ${partnerPayOnlineCopy.currencies[currency].symbol}${partnerPayOnlineCopy.minimumAmount}.`,
      );
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

    if (!publicKey) {
      setError(partnerPayOnlineCopy.genericErrorMessage);
      return;
    }

    setError(null);
    setStatus("submitting");

    const { default: PaystackPop } = await import("@paystack/inline-js");
    const paystackInstance = new PaystackPop();

    paystackInstance.newTransaction({
      key: publicKey,
      email: normalizedEmail,
      amount: Math.round(parsedAmount * 100),
      currency,
      reference: crypto.randomUUID(),
      metadata: { name: normalizedName },
      onSuccess: (transaction) => {
        void verifyTransaction(transaction.reference);
      },
      onCancel: () => {
        setStatus("idle");
      },
      onError: () => {
        setStatus("error");
        setError(partnerPayOnlineCopy.genericErrorMessage);
      },
    });
  }

  async function verifyTransaction(reference: string) {
    setStatus("verifying");

    try {
      const response = await fetch("/api/paystack/verify", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ reference }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { verified?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.verified) {
        setStatus("error");
        setError(payload?.error ?? partnerPayOnlineCopy.genericErrorMessage);
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setError(partnerPayOnlineCopy.genericErrorMessage);
    }
  }

  if (status === "success") {
    return (
      <div className="grid gap-1">
        <p className="font-[var(--font-sen)] text-[1.125rem] leading-[0.95] tracking-[-0.04em] text-[var(--color-brand-indigo)]">
          {partnerPayOnlineCopy.successTitle}
        </p>
        <p className="text-[0.9375rem] text-[var(--color-text-muted)]">
          {partnerPayOnlineCopy.successMessage}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <p className="text-[0.8125rem] text-[var(--color-text-muted)]">
        {partnerPayOnlineCopy.helperText}
      </p>

      <div className="inline-flex w-fit items-center gap-1 rounded-full border border-[rgba(6,16,86,0.14)] bg-[var(--color-surface-muted)] p-1">
        {(Object.keys(partnerPayOnlineCopy.currencies) as CurrencyCode[]).map(
          (code) => (
            <button
              key={code}
              type="button"
              onClick={() => setCurrency(code)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[0.75rem] font-semibold transition-colors duration-150",
                currency === code
                  ? "bg-[var(--color-brand-blue)] text-white"
                  : "text-[var(--color-text-muted)]",
              )}
            >
              {code}
            </button>
          ),
        )}
      </div>

      <Input
        type="text"
        autoComplete="name"
        placeholder="Full name"
        value={name}
        onChange={(event) => setName(event.currentTarget.value)}
      />

      <Input
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="Email address"
        value={email}
        onChange={(event) => setEmail(event.currentTarget.value)}
      />

      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        placeholder={`Amount (${partnerPayOnlineCopy.currencies[currency].symbol})`}
        value={amount}
        onChange={(event) => setAmount(event.currentTarget.value)}
      />

      {error ? (
        <p className="text-[0.8125rem] font-medium leading-[1.25] text-[var(--destructive)]">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="primary" disabled={isBusy}>
        {status === "submitting"
          ? partnerPayOnlineCopy.submittingLabel
          : status === "verifying"
            ? partnerPayOnlineCopy.verifyingLabel
            : partnerPayOnlineCopy.submitLabel}
      </Button>
    </form>
  );
}
