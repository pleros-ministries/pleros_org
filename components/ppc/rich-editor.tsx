"use client";

import { cn } from "@/lib/utils";

type RichEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minRows?: number;
};

export function RichEditor({ value, onChange, placeholder, disabled, minRows = 8 }: RichEditorProps) {
  return (
    <div className="space-y-1">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={minRows}
        className={cn(
          "w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/50 transition-colors",
          disabled && "cursor-not-allowed bg-zinc-50 text-zinc-500",
        )}
      />
      <p className="text-right text-[10px] text-zinc-400">{value.length} characters</p>
    </div>
  );
}
