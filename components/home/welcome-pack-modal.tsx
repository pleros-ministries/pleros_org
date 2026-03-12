"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  WELCOME_PACK_STORAGE_KEY,
  buildWelcomePackDownloads,
  serializeWelcomePackState,
  shouldShowWelcomePackModal,
} from "@/lib/homepage-logic";
import { validateEmail } from "@/lib/welcome-flow";

type WelcomePackModalProps = {
  openRequest: number;
};

function triggerFileDownload(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function persistDismissedState() {
  localStorage.setItem(
    WELCOME_PACK_STORAGE_KEY,
    serializeWelcomePackState({
      status: "dismissed",
      updatedAt: new Date().toISOString(),
    }),
  );
}

function persistCompletedState(email: string) {
  localStorage.setItem(
    WELCOME_PACK_STORAGE_KEY,
    serializeWelcomePackState({
      status: "completed",
      email,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function WelcomePackModal({ openRequest }: WelcomePackModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCompletedThisSession, setIsCompletedThisSession] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(WELCOME_PACK_STORAGE_KEY);

    if (shouldShowWelcomePackModal(stored)) {
      const openTimer = window.setTimeout(() => {
        setOpen(true);
      }, 0);

      return () => {
        window.clearTimeout(openTimer);
      };
    }

    return undefined;
  }, []);

  useEffect(() => {
    if (openRequest > 0) {
      const openTimer = window.setTimeout(() => {
        setOpen(true);
      }, 0);

      return () => {
        window.clearTimeout(openTimer);
      };
    }

    return undefined;
  }, [openRequest]);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isCompletedThisSession) {
      persistDismissedState();
    }

    setOpen(nextOpen);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateEmail(normalizedEmail)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setEmailError(null);

    const downloads = buildWelcomePackDownloads(normalizedEmail);

    downloads.forEach((download, index) => {
      window.setTimeout(() => {
        triggerFileDownload(download.fileName, download.content);
      }, index * 180);
    });

    persistCompletedState(normalizedEmail);
    setIsCompletedThisSession(true);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome to Pleros</DialogTitle>
          <DialogDescription>
            Enter your email to access the Pleros free welcome pack now
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-3">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            placeholder="you@example.com"
          />

          {emailError ? (
            <p className="text-sm text-[var(--destructive)]">{emailError}</p>
          ) : null}

          <Button type="submit" variant="primary">
            Access your Welcome Pack
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
