import type { ReactNode } from "react";
import { BellIcon, CheckIcon, ClockIcon, SmartphoneIcon, SunriseIcon, type LucideIcon } from "lucide-react";
import { IconChip } from "./page";
import { panel, sectionTitleText } from "./ui";
const STEP_ICONS = [SmartphoneIcon, BellIcon, ClockIcon, SunriseIcon];

/** Shared setup card; live hooks/actions stay in the caller's children. */
export function SetupStepCard({ number, title, description, done, children, icon, as: Tag = "li" }: {
  number: number; title: string; description?: string; done: boolean; children: ReactNode; icon?: LucideIcon; as?: "li" | "section";
}) {
  return <Tag className={`${panel} grid gap-3 p-4 sm:p-5`}>
    <div className="flex items-center gap-3">
      <IconChip icon={icon ?? STEP_ICONS[number - 1] ?? BellIcon} />
      <div className="grid min-w-0 flex-1 gap-1">
        <h2 className={sectionTitleText}>{number}. {title}</h2>
        {description ? <p className="text-[13px] leading-relaxed text-(--color-text-muted)">{description}</p> : null}
      </div>
      {done ? <span className="inline-flex h-6 items-center gap-1 rounded-full bg-(--color-brand-sky) px-2 text-[11.5px] font-medium text-(--color-brand-blue)"><CheckIcon className="size-3" aria-hidden />Done</span> : null}
    </div>
    <div className="grid min-w-0 gap-3 text-[13px] leading-relaxed">{children}</div>
  </Tag>;
}

export function SetupReminderChoice({ name, label, helper, checked, disabled, onChange }: {
  name?: string; label: string; helper?: string | null; checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void;
}) {
  return <label className={`flex items-start gap-3 text-[13px] ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
    <input type="checkbox" name={name} checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--color-brand-blue)]" />
    <span className="grid min-w-0 gap-0.5"><span>{label}</span>{helper ? <span className="text-[12px] text-(--color-text-muted)">{helper}</span> : null}</span>
  </label>;
}
