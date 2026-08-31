"use client";

import { Eye, EyeOff, LoaderCircle, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";

export function LearnerLoginForm({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "code">("password");
  const [codeSent, setCodeSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = () => {
    router.replace(returnTo);
    router.refresh();
  };

  async function passwordLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = await authClient.signIn.email({ email, password });
    setPending(false);

    if (result.error) {
      setError("Email or password is incorrect.");
      return;
    }
    finish();
  }

  async function sendCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });
    setPending(false);

    if (result.error) {
      setError("A sign-in code could not be sent. Try again shortly.");
      return;
    }
    setCodeSent(true);
  }

  async function codeLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the six-digit code from your email.");
      return;
    }

    setPending(true);
    const result = await authClient.signIn.emailOtp({ email, otp });
    setPending(false);
    if (result.error) {
      setError("That code is invalid or expired.");
      return;
    }
    finish();
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="font-[var(--font-sen)] text-3xl font-semibold tracking-[-0.045em] text-[var(--color-text-strong)]">Welcome back</h1>
        <p className="font-[var(--font-be-vietnam-pro)] text-sm leading-[1.6] text-[var(--color-text-muted)]">Log in to continue your SOGP journey.</p>
      </div>

      {mode === "password" ? (
        <form className="grid gap-4" noValidate onSubmit={passwordLogin}>
          <label className="grid gap-2" htmlFor="learner-email">
            <span className="text-sm font-medium text-[var(--color-text-strong)]">Email address</span>
            <Input id="learner-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <div className="grid gap-2">
            <label htmlFor="learner-password" className="text-sm font-medium text-[var(--color-text-strong)]">Password</label>
            <div className="relative">
              <Input id="learner-password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="pr-12" />
              <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-[var(--color-text-muted)]">
                {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
          {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
          <Button type="submit" size="lg" disabled={pending} className="min-h-12 w-full rounded-full bg-[var(--color-brand-blue)] text-white">
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
            {pending ? "Logging in" : "Log in"}
          </Button>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <button type="button" onClick={() => { setMode("code"); setError(null); }} className="font-medium text-[var(--color-brand-blue)]">Email me a sign-in code</button>
            <Link href="/forgot-password" className="font-medium text-[var(--color-brand-blue)]">Create or reset your password</Link>
          </div>
        </form>
      ) : (
        <form className="grid gap-4" noValidate onSubmit={codeSent ? codeLogin : sendCode}>
          <label className="grid gap-2" htmlFor="code-email">
            <span className="text-sm font-medium text-[var(--color-text-strong)]">Email address</span>
            <Input id="code-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={codeSent} required />
          </label>
          {codeSent ? (
            <label className="grid gap-2" htmlFor="login-code">
              <span className="text-sm font-medium text-[var(--color-text-strong)]">Sign-in code</span>
              <Input id="login-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} className="h-14 text-center text-xl tracking-[0.3em]" />
            </label>
          ) : null}
          {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
          <Button type="submit" size="lg" disabled={pending} className="min-h-12 w-full rounded-full bg-[var(--color-brand-blue)] text-white">
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Mail className="size-4" aria-hidden="true" />}
            {pending ? "Please wait" : codeSent ? "Log in with code" : "Send sign-in code"}
          </Button>
          <button type="button" onClick={() => { setMode("password"); setCodeSent(false); setError(null); }} className="min-h-10 text-sm font-medium text-[var(--color-brand-blue)]">Use your password instead</button>
        </form>
      )}

      <div className="grid gap-3 border-t border-[var(--color-line)] pt-5">
        <p className="font-[var(--font-sen)] text-lg font-semibold text-[var(--color-text-strong)]">New to SOGP?</p>
        <p className="text-sm leading-[1.55] text-[var(--color-text-muted)]">Enrol to create your account and access your dashboard.</p>
        <Link href="/signup" className="site-button-text inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-brand-blue)] px-5 text-sm font-semibold text-[var(--color-brand-blue)]">Enrol for SOGP</Link>
      </div>
    </div>
  );
}
