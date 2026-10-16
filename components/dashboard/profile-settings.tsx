"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useUploadThing } from "@/lib/upload/uploadthing-client";
import { saveProfile, saveReportPushPreference } from "@/app/(site)/dashboard/profile/actions";
import { PrayerReminderPrompt } from "@/components/dashboard/prayer-reminder-prompt";
import { compactButton, primaryButton } from "./shell/styles";
import { inputClass } from "@/components/community/report/styles";

export function ProfileSettings({ initialName, initialImage, reportPreferences, pushEnabled }: { initialName: string; initialImage: string | null; reportPreferences: boolean; pushEnabled: boolean }) {
  const router = useRouter(); const [name, setName] = useState(initialName); const [image, setImage] = useState(initialImage);
  const [message, setMessage] = useState<string | null>(null); const [pending, start] = useTransition();
  const [reportPush, setReportPush] = useState(pushEnabled);
  const { startUpload, isUploading } = useUploadThing("profilePhoto", { onUploadError: () => setMessage("Photo upload failed. Try again.") });
  return <div className="mx-auto grid max-w-xl gap-6 p-4 sm:p-6"><h1 className="font-medium">Profile settings</h1>
    <form className="grid gap-4 rounded-xl border border-(--color-line) p-4" onSubmit={(event) => { event.preventDefault(); setMessage(null); start(async () => { try { const result = await saveProfile({ name, image }); setMessage(result.ok ? "Profile saved." : result.error); if (result.ok) router.refresh(); } catch { setMessage("Could not save your profile. Try again."); } }); }}>
      <div className="flex flex-wrap items-center gap-3">{image ? <Image src={image} alt="Your profile photo" width={64} height={64} unoptimized className="size-16 rounded-full object-cover" /> : <span className="grid size-16 place-items-center rounded-full bg-(--color-brand-sky) text-(--color-brand-blue)">{name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")}</span>}
        <label className={compactButton}>{isUploading ? "Uploading…" : "Upload photo"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={isUploading || pending} className="sr-only" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024) { setMessage("Choose a JPG, PNG or WebP photo under 4 MB."); return; } try { const result = await startUpload([file]); const url = result?.[0]?.serverData.url; if (url) { setImage(url); setMessage(null); } else setMessage("Photo upload failed. Try again."); } catch { setMessage("Photo upload failed. Try again."); } event.target.value = ""; }} /></label>
        {image ? <button type="button" className={compactButton} onClick={() => setImage(null)}>Remove photo</button> : null}
      </div>
      <label className="grid gap-1 text-[13px] font-medium" htmlFor="profile-name">Name<input id="profile-name" required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} /></label>
      <button disabled={pending || isUploading} className={`${primaryButton} w-fit`}>{pending ? "Saving…" : "Save"}</button>
    </form>
    <div className="flex flex-wrap gap-2"><Link href="/forgot-password" className={compactButton}>Reset password</Link><Link href="/dashboard/welcomepack/setup" className={compactButton}>App and reminders</Link></div>
    {reportPreferences ? <form className="grid gap-3 rounded-xl border border-(--color-line) p-4" onSubmit={(event) => { event.preventDefault(); start(async () => { try { const result = await saveReportPushPreference(reportPush); setMessage(result.ok ? "Reminder preference saved." : result.error); if (result.ok) router.refresh(); } catch { setMessage("Could not save your reminder preference."); } }); }}><label className="flex items-start gap-2 text-[13px]"><input type="checkbox" checked={reportPush} onChange={(event) => setReportPush(event.target.checked)} />Send push reminders for missing reports at 8 pm</label><button className={`${compactButton} w-fit`} disabled={pending}>Save reminders</button><PrayerReminderPrompt variant="row" /></form> : null}
    {message ? <p role="status" className="text-[13px]">{message}</p> : null}
  </div>;
}
