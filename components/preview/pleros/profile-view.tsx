"use client";

import { useRef, useState, type FormEvent } from "react";
import { saveDemoProfile } from "@/lib/preview/pleros/store";
import { useDemo } from "./demo-context";
import { Initials, PageHeader, buttonPrimary, buttonQuiet, buttonSecondary, focusRing, panel } from "./ui";
import { cn } from "@/lib/utils";
import type { DemoPerson } from "@/lib/preview/pleros/types";

async function photoFor(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
    throw new Error("Choose a JPG, PNG or WebP photo under 10 MB.");
  }
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    const edge = Math.min(bitmap.width, bitmap.height);
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Photo unavailable. Try again.");
    ctx.drawImage(bitmap, (bitmap.width - edge) / 2, (bitmap.height - edge) / 2, edge, edge, 0, 0, 256, 256);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally {
    bitmap.close();
  }
}

export function ProfileView() {
  const { viewer } = useDemo();
  return <ProfileForm key={viewer.id} person={viewer} />;
}

function ProfileForm({ person }: { person: DemoPerson }) {
  const { run } = useDemo();
  const [name, setName] = useState(person.name);
  const [photo, setPhoto] = useState(person.photoDataUrl);
  const [error, setError] = useState<string | null>(null);
  const [readingPhoto, setReadingPhoto] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadGeneration = useRef(0);

  function save(event: FormEvent) {
    event.preventDefault();
    const outcome = run((state) => saveDemoProfile(state, person.id, { name, photoDataUrl: photo }));
    setError(outcome.ok ? null : outcome.error);
    if (!outcome.ok && !name.trim()) nameInput.current?.focus();
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Profile settings" />
      <form onSubmit={save} className={cn(panel, "grid max-w-xl gap-5 p-4 sm:p-5")}>
        <div className="flex flex-wrap items-center gap-3">
          <Initials name={name || person.name} imageSrc={photo} size="lg" />
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Profile photo" className="sr-only" tabIndex={-1} onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            const generation = ++uploadGeneration.current;
            setReadingPhoto(true);
            try {
              const data = await photoFor(file);
              if (generation === uploadGeneration.current) { setPhoto(data); setError(null); }
            } catch (cause) {
              if (generation === uploadGeneration.current) setError(cause instanceof Error ? cause.message : "Photo unavailable. Try again.");
            } finally {
              if (generation === uploadGeneration.current) setReadingPhoto(false);
            }
          }} />
          <button type="button" className={buttonSecondary} onClick={() => fileInput.current?.click()} disabled={readingPhoto}>{readingPhoto ? "Preparing photo…" : "Upload photo"}</button>
          {photo ? <button type="button" className={buttonQuiet} onClick={() => { uploadGeneration.current++; setReadingPhoto(false); setPhoto(undefined); }}>Remove photo</button> : null}
        </div>
        <label className="grid gap-1.5 text-[13px] font-medium text-(--color-text-strong)">
          Name
          <input ref={nameInput} value={name} onChange={(event) => setName(event.target.value)} maxLength={80} autoComplete="off" aria-invalid={Boolean(error && !name.trim())} className={cn("min-h-10 w-full rounded-lg border border-(--color-line-strong) bg-white px-3 text-[16px] font-normal", focusRing)} />
        </label>
        {error ? <p role="alert" className="text-[12px] text-red-700">{error}</p> : null}
        <button type="submit" className={cn(buttonPrimary, "justify-self-start")} disabled={readingPhoto}>Save profile</button>
      </form>
      <section className={cn(panel, "grid max-w-xl justify-items-start gap-3 p-4 sm:p-5")}>
        <div className="flex w-full items-center justify-between gap-3">
          <h2 className="text-[15px] font-medium text-(--color-text-strong)">Password</h2>
          <span className="text-[12px] text-(--color-text-muted)">Not connected</span>
        </div>
        <button type="button" className={buttonSecondary} disabled title="Password reset requires a real account and is not connected in this demo">Reset password</button>
      </section>
    </div>
  );
}
