"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";

export function LearnerPasswordRecovery({
  initialMode = "request",
}: {
  initialMode?: "request" | "reset";
}) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function requestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await authClient.emailOtp.requestPasswordReset({ email });
      if (result.error) {
        setError("A reset code could not be sent. Try again shortly.");
        return;
      }
      setMode("reset");
    } catch {
      setError("A reset code could not be sent. Try again shortly.");
    } finally {
      setPending(false);
    }
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the six-digit code from your email.");
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError("Use a password between 8 and 128 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const result = await authClient.emailOtp.resetPassword({
        email,
        otp,
        password,
      });
      if (result.error) {
        setError("That code is invalid or expired.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Your password could not be updated. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="grid gap-4 text-center">
        <h1 className="font-[var(--font-sen)] text-3xl font-semibold text-[var(--color-text-strong)]">Password updated</h1>
        <p className="text-sm text-[var(--color-text-muted)]">You can now log in with your new password.</p>
        <Link href="/login" className="site-button-text inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--color-brand-blue)] px-6 text-sm font-semibold text-white">Continue to login</Link>
      </div>
    );
  }

  return (
    <form className="grid gap-5" noValidate onSubmit={mode === "request" ? requestCode : resetPassword}>
      <div className="grid gap-2">
        <h1 className="font-[var(--font-sen)] text-3xl font-semibold tracking-[-0.045em] text-[var(--color-text-strong)]">{mode === "request" ? "Create or reset your password" : "Set your password"}</h1>
        <p className="text-sm leading-[1.6] text-[var(--color-text-muted)]">{mode === "request" ? "Enter your enrolled email and we’ll send a verification code." : "Enter the code from your email and choose a password."}</p>
      </div>
      <label htmlFor="recovery-email" className="grid gap-2 text-sm font-medium text-[var(--color-text-strong)]">
        Email address
        <Input id="recovery-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      {mode === "reset" ? (
        <>
          <label htmlFor="recovery-code" className="grid gap-2 text-sm font-medium text-[var(--color-text-strong)]">
            Verification code
            <Input id="recovery-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} className="h-14 text-center text-xl tracking-[0.3em]" />
          </label>
          <label htmlFor="recovery-password" className="grid gap-2 text-sm font-medium text-[var(--color-text-strong)]">
            New password
            <Input id="recovery-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <label htmlFor="recovery-confirmation" className="grid gap-2 text-sm font-medium text-[var(--color-text-strong)]">
            Confirm password
            <Input id="recovery-confirmation" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </label>
        </>
      ) : null}
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" size="lg" disabled={pending} className="min-h-12 w-full rounded-full bg-[var(--color-brand-blue)] text-white">
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
        {pending ? "Please wait" : mode === "request" ? "Send verification code" : "Save new password"}
      </Button>
      <Link href="/login" className="text-center text-sm font-medium text-[var(--color-brand-blue)]">Back to login</Link>
    </form>
  );
}
