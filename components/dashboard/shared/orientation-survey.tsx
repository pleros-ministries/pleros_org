import { SOGP_ORIENTATION_REASONS } from "@/lib/sogp/orientation-survey";
import { buttonPrimary, focusRing } from "./ui";

export const REQUIRED_ORIENTATION_REASONS = 3;

/** Pure form presentation; callers own persistence and completion. */
export function OrientationSurveyView({ completed, reasons, question, submitting = false, error, telegramUrl, onToggle, onQuestionChange, onSubmit, onContinue }: {
  completed: boolean; reasons: string[]; question: string; submitting?: boolean; error?: string | null;
  telegramUrl: string; onToggle: (value: string) => void; onQuestionChange: (value: string) => void;
  onSubmit: () => void; onContinue?: () => void;
}) {
  if (completed) return <div className="grid min-w-0 gap-3">
    <p className="text-[13px] leading-relaxed text-(--color-text-muted)">Join your cohort community on Telegram for your orientation pack and the next steps to take.</p>
    <a href={telegramUrl} target="_blank" rel="noreferrer" onClick={onContinue} className={`${buttonPrimary} w-fit`}>Join the orientation group</a>
  </div>;
  return <form className="grid min-w-0 gap-4" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
    <fieldset className="grid gap-2">
      <legend className="mb-3 text-[13px] font-medium text-(--color-text-strong)">Choose your top {REQUIRED_ORIENTATION_REASONS} reasons for joining SOGP *</legend>
      {SOGP_ORIENTATION_REASONS.map(reason => {
        const checked = reasons.includes(reason.value);
        const disabled = submitting || (!checked && reasons.length >= REQUIRED_ORIENTATION_REASONS);
        return <label key={reason.value} className={`flex items-start gap-3 rounded-lg border border-(--color-line) p-3 text-[13px] leading-relaxed ${checked ? "bg-(--color-brand-sky-soft)" : "bg-white"} ${disabled ? "opacity-50" : "cursor-pointer"}`}>
          <input type="checkbox" checked={checked} disabled={disabled} onChange={() => onToggle(reason.value)} className="mt-0.5 size-4 shrink-0 accent-(--color-brand-blue)" />
          <span>{reason.label}</span>
        </label>;
      })}
    </fieldset>
    <label className="grid gap-2 text-[13px] font-medium text-(--color-text-strong)">What questions would you like us to answer privately? *
      <textarea required value={question} disabled={submitting} onChange={event => onQuestionChange(event.target.value)} rows={4} maxLength={2000} placeholder="If you have no question, write Nil" className={`w-full resize-y rounded-lg border border-(--color-line-strong) bg-white p-3 text-[16px] font-normal text-(--color-text-strong) placeholder:text-(--color-text-muted) ${focusRing}`} />
    </label>
    {error ? <p role="alert" className="text-[13px] text-(--destructive)">{error}</p> : null}
    <div className="flex flex-wrap items-center gap-3">
      <button type="submit" disabled={reasons.length !== REQUIRED_ORIENTATION_REASONS || !question.trim() || submitting} className={buttonPrimary}>{submitting ? "Saving…" : "Continue to the orientation group"}</button>
      <span className="text-[12px] text-(--color-text-muted)">{reasons.length} / {REQUIRED_ORIENTATION_REASONS} selected</span>
    </div>
  </form>;
}
