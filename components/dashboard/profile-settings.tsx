"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useUploadThing } from "@/lib/upload/uploadthing-client";
import { BellIcon, ChevronRightIcon, KeyRoundIcon } from "lucide-react";
import { saveProfile } from "@/app/(site)/dashboard/profile/actions";
import { compactButton, primaryButton } from "./shell/styles";
import { inputClass } from "@/components/community/report/styles";

export function ProfileSettings({ initialName, initialImage, reportPreferences }: { initialName: string; initialImage: string | null; reportPreferences: boolean; pushEnabled?: boolean }) {
  const router = useRouter(); const [name, setName] = useState(initialName); const [image, setImage] = useState(initialImage);
  const [message, setMessage] = useState<string | null>(null); const [pending, start] = useTransition();
  const { startUpload, isUploading } = useUploadThing("profilePhoto", { onUploadError: () => setMessage("Photo upload failed. Try again.") });
  const panel = "rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white";
  const row = "relative flex min-h-[58px] items-center gap-3 px-3.5 py-2.5 text-(--color-text-strong) no-underline transition-colors hover:bg-[#f8f9fb] [li+li>&]:before:absolute [li+li>&]:before:inset-x-3.5 [li+li>&]:before:top-0 [li+li>&]:before:h-px [li+li>&]:before:bg-[var(--color-line,#e7e9ec)] [li+li>&]:before:content-['']";
  const chip = "grid size-8 shrink-0 place-items-center rounded-[9px]";
  return <div className="mx-auto grid w-full max-w-xl gap-4 px-4 pb-8 pt-4 sm:p-6">
    <h1 className="m-0">Profile</h1>
    <form className={`${panel} grid gap-4 p-4`} onSubmit={(event) => { event.preventDefault(); setMessage(null); start(async () => { try { const result = await saveProfile({ name, image }); setMessage(result.ok ? "Profile saved." : result.error); if (result.ok) router.refresh(); } catch { setMessage("Could not save your profile. Try again."); } }); }}>
      <div className="flex items-center gap-3">
        {image ? <Image src={image} alt="Your profile photo" width={56} height={56} unoptimized className="size-14 rounded-full object-cover" /> : <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#e4ebfd] text-[17px] font-medium text-[#2331ae]">{name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")}</span>}
        <div className="flex flex-wrap gap-2">
          <label className={compactButton}>{isUploading ? "Uploading…" : image ? "Change photo" : "Upload photo"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={isUploading || pending} className="sr-only" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024) { setMessage("Choose a JPG, PNG or WebP photo under 4 MB."); return; } try { const result = await startUpload([file]); const url = result?.[0]?.serverData.url; if (url) { setImage(url); setMessage(null); } else setMessage("Photo upload failed. Try again."); } catch { setMessage("Photo upload failed. Try again."); } event.target.value = ""; }} /></label>
          {image ? <button type="button" className={compactButton} onClick={() => setImage(null)}>Remove</button> : null}
        </div>
      </div>
      <label className="grid gap-1.5 text-[13px] font-medium" htmlFor="profile-name">Name<input id="profile-name" required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} /></label>
      <div className="flex items-center gap-3"><button disabled={pending || isUploading} className={`${primaryButton} w-fit`}>{pending ? "Saving…" : "Save"}</button>{message ? <p role="status" className="m-0 text-[12.5px] text-(--color-text-muted)">{message}</p> : null}</div>
    </form>
    <h2 className="m-0 mt-2 text-[15px] font-medium">Settings</h2>
    <ul className={`${panel} m-0 list-none overflow-hidden p-0`}>
      <li><Link href="/dashboard/profile/reminders" className={row}><span className={chip} style={{ background: "#e4ebfd", color: "#2331ae" }}><BellIcon className="size-4" strokeWidth={2.2} /></span><span className="grid min-w-0 flex-1"><span className="text-[13.5px] font-medium">Notifications and reminders</span><span className="text-[12px] text-(--color-text-muted)">{reportPreferences ? "Prayer Watch, teaching time, daily report" : "Prayer Watch, teaching time, the app"}</span></span><ChevronRightIcon className="size-4 shrink-0 text-[#a6abb2]" /></Link></li>
      <li><Link href="/forgot-password" className={row}><span className={chip} style={{ background: "#eceef2", color: "#4a5568" }}><KeyRoundIcon className="size-4" strokeWidth={2.2} /></span><span className="grid min-w-0 flex-1"><span className="text-[13.5px] font-medium">Reset password</span><span className="text-[12px] text-(--color-text-muted)">We email you a six-digit code</span></span><ChevronRightIcon className="size-4 shrink-0 text-[#a6abb2]" /></Link></li>
    </ul>
  </div>;
}
