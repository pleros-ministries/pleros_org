"use client";

import { Eye, EyeOff, LoaderCircle, MailCheck, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SetupStep = "verify" | "password";

type ApiError = {
  error?: string;
  errors?: Record<string, string>;
  nextStep?: "password";
  redirectTo?: string;
};

async function postJson(path: string, body: Record<string, unknown> = {}) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as ApiError | null;
    throw errorPayload ?? { error: "Something went wrong. Try again." };
  }
  return ((await response.json().catch(() => null)) as ApiError | null) ?? {};
}

export function SogpSetupForm({
  maskedEmail,
  initialStep,
}: {
  maskedEmail: string;
  initialStep: SetupStep;
}) {
  const [step, setStep] = useState<SetupStep>(initialStep);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);

  useEffect(() => {
    if (step !== "verify" || resendSeconds <= 0) return undefined;
    const timer = window.setInterval(
      () => setResendSeconds((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [resendSeconds, step]);

  async function verifyEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the six-digit code from your email.");
      document.getElementById("sogp-verification-code")?.focus();
      return;
    }

    setPending(true);
    try {
      await postJson("/api/sogp/enrol/verify", { otp });
      setStep("password");
    } catch (caught) {
      setError((caught as ApiError)?.error ?? "That code could not be verified.");
    } finally {
      setPending(false);
    }
  }

  async function resendCode() {
    setError(null);
    setPending(true);
    try {
      await postJson("/api/sogp/enrol/resend");
      setResendSeconds(60);
    } catch (caught) {
      setError((caught as ApiError)?.error ?? "Another code could not be sent.");
    } finally {
      setPending(false);
    }
  }

  async function createPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setPending(true);

    try {
      const payload = await postJson("/api/sogp/enrol/complete", {
        password,
        confirmation,
      });
      window.location.assign(
        payload.redirectTo ?? "/dashboard/welcomepack/join",
      );
    } catch (caught) {
      const apiError = caught as ApiError;
      setFieldErrors(apiError?.errors ?? {});
      setError(apiError?.error ?? null);
    } finally {
      setPending(false);
    }
  }

  if (step === "verify") {
    return (
      <form className="grid gap-5" noValidate onSubmit={verifyEmail}>
        <div className="grid gap-2">
          <span className="grid size-11 place-items-center rounded-full bg-[var(--color-brand-sky)] text-[var(--color-brand-blue)]">
            <MailCheck className="size-5" aria-hidden="true" />
          </span>
          <h1 className="font-[var(--font-sen)] text-2xl font-semibold tracking-[-0.04em] text-[var(--color-text-strong)]">
            Verify your email
          </h1>
          <p className="font-[var(--font-be-vietnam-pro)] [font-size:0.875rem] leading-[1.55] text-[var(--color-text-muted)]">
            Enter the six-digit code sent to {maskedEmail}.
          </p>
        </div>

        <div className="grid gap-2">
          <label htmlFor="sogp-verification-code" className="font-[var(--font-be-vietnam-pro)] [font-size:0.8125rem] font-medium text-[var(--color-text-strong)]">
            Verification code
          </label>
          <Input
            id="sogp-verification-code"
            value={otp}
            onChange={(event) =>
              setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "setup-error" : undefined}
            className="h-14 text-center text-lg tracking-[0.3em]"
          />
        </div>

        {error ? <p id="setup-error" role="alert" className="[font-size:0.8125rem] text-red-700">{error}</p> : null}

        <Button type="submit" size="lg" disabled={pending} className="min-h-12 w-full rounded-full bg-[var(--color-brand-blue)] [font-size:0.875rem] text-white">
          {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
          {pending ? "Verifying" : "Verify email"}
        </Button>
        <button
          type="button"
          disabled={pending || resendSeconds > 0}
          onClick={resendCode}
          className="min-h-10 [font-size:0.8125rem] font-medium text-[var(--color-brand-blue)] disabled:text-[var(--color-text-muted)]"
        >
          {resendSeconds > 0 ? `Send another code in ${resendSeconds}s` : "Send another code"}
        </button>
      </form>
    );
  }

  return (
    <form className="grid gap-5" noValidate onSubmit={createPassword}>
      <div className="grid gap-2">
        <span className="grid size-11 place-items-center rounded-full bg-[var(--color-brand-sky)] text-[var(--color-brand-blue)]">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <h1 className="font-[var(--font-sen)] text-2xl font-semibold tracking-[-0.04em] text-[var(--color-text-strong)]">
          Create your password
        </h1>
        <p className="font-[var(--font-be-vietnam-pro)] [font-size:0.875rem] leading-[1.55] text-[var(--color-text-muted)]">
          Use this password whenever you return to your SOGP dashboard.
        </p>
      </div>

      <div className="grid gap-2">
        <label htmlFor="sogp-password" className="[font-size:0.8125rem] font-medium text-[var(--color-text-strong)]">Password</label>
        <div className="relative">
          <Input
            id="sogp-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "password-error" : "password-help"}
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-[var(--color-text-muted)]"
          >
            {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        </div>
        <p id="password-help" className="[font-size:0.75rem] text-[var(--color-text-muted)]">Use at least 8 characters.</p>
        {fieldErrors.password ? <p id="password-error" className="[font-size:0.75rem] text-red-700">{fieldErrors.password}</p> : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="sogp-password-confirmation" className="[font-size:0.8125rem] font-medium text-[var(--color-text-strong)]">Confirm password</label>
        <Input
          id="sogp-password-confirmation"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          aria-invalid={Boolean(fieldErrors.confirmation)}
          aria-describedby={fieldErrors.confirmation ? "confirmation-error" : undefined}
        />
        {fieldErrors.confirmation ? <p id="confirmation-error" className="[font-size:0.75rem] text-red-700">{fieldErrors.confirmation}</p> : null}
      </div>

      {error ? <p role="alert" className="[font-size:0.8125rem] text-red-700">{error}</p> : null}
      <Button type="submit" size="lg" disabled={pending} className="min-h-12 w-full rounded-full bg-[var(--color-brand-blue)] [font-size:0.875rem] text-white">
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
        {pending ? "Creating password" : "Create password and continue"}
      </Button>
    </form>
  );
}
