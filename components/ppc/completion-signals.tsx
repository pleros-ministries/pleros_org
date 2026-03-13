import { CheckCircle2, Circle, FileText, Headphones, HelpCircle, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

type CompletionSignalsProps = {
  audioListened: boolean;
  notesRead: boolean;
  quizPassed: boolean;
  writtenApproved: boolean;
  compact?: boolean;
};

const signals = [
  { key: "audioListened", label: "Audio", icon: Headphones },
  { key: "notesRead", label: "Notes", icon: FileText },
  { key: "quizPassed", label: "Quiz", icon: HelpCircle },
  { key: "writtenApproved", label: "Written", icon: PenLine },
] as const;

export function CompletionSignals({ audioListened, notesRead, quizPassed, writtenApproved, compact }: CompletionSignalsProps) {
  const values: Record<string, boolean> = { audioListened, notesRead, quizPassed, writtenApproved };

  return (
    <div className={cn("flex gap-1.5", compact ? "gap-1" : "gap-2")}>
      {signals.map((s) => {
        const done = values[s.key];
        const Icon = s.icon;
        return (
          <div
            key={s.key}
            title={`${s.label}: ${done ? "Complete" : "Incomplete"}`}
            className={cn(
              "flex items-center gap-1 rounded-md border px-1.5 py-0.5",
              compact ? "text-[10px]" : "text-xs",
              done
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-zinc-200 bg-zinc-50 text-zinc-400",
            )}
          >
            <Icon className={cn(compact ? "size-2.5" : "size-3")} />
            {!compact && <span>{s.label}</span>}
            {done ? (
              <CheckCircle2 className={cn(compact ? "size-2.5" : "size-3")} />
            ) : (
              <Circle className={cn(compact ? "size-2.5" : "size-3")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
