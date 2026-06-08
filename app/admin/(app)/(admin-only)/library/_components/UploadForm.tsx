"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { UploadCloudIcon, CheckCircle2Icon, AlertCircleIcon } from "lucide-react";

import { useUploadThing } from "@/lib/upload/uploadthing-client";

const SERIES_OPTIONS = [
  "Faith & Growth",
  "Gospel & Truth",
  "The New Creation",
  "Prayer & Devotion",
  "Purpose",
  "Redemption",
  "The Church & Supernatural",
];

type Props = {
  nextSn: number;
  existingSeries: string[];
};

export function UploadForm({ nextSn, existingSeries }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [series, setSeries] = useState(SERIES_OPTIONS[0]);
  const [customSeries, setCustomSeries] = useState("");
  const [date, setDate] = useState("");
  const [sn, setSn] = useState(nextSn);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { startUpload } = useUploadThing("teachingAudio", {
    onUploadProgress: setUploadProgress,
  });

  const resolvedSeries = series === "__new__" ? customSeries : series;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) return setError("Title is required.");
    if (!resolvedSeries.trim()) return setError("Series is required.");
    if (!selectedFile) return setError("Please select an audio file.");

    setUploading(true);
    setUploadProgress(0);

    try {
      const results = await startUpload([selectedFile]);
      if (!results?.[0]) throw new Error("Upload failed — no result returned.");

      const { url, key } = results[0];

      const res = await fetch("/api/teachings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sn,
          title: title.trim(),
          series: resolvedSeries.trim(),
          date: date.trim() || null,
          audio_url: url,
          file_key: key,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save teaching.");
      }

      setSuccess(true);
      setTimeout(() => router.push("/admin/library"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setUploading(false);
    }
  }

  const allSeries = [
    ...new Set([...SERIES_OPTIONS, ...existingSeries]),
    "__new__",
  ];

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <CheckCircle2Icon className="size-12 text-green-500" />
        <p className="text-lg font-semibold">Teaching saved!</p>
        <p className="text-sm text-muted-foreground">Redirecting to library…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[0.875rem] text-red-700">
          <AlertCircleIcon className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* S/N */}
      <div className="grid gap-1.5">
        <label className="text-[0.8125rem] font-medium">Serial Number</label>
        <input
          type="number"
          min={1}
          value={sn}
          onChange={(e) => setSn(parseInt(e.target.value, 10))}
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-[0.9375rem] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
          required
        />
      </div>

      {/* Title */}
      <div className="grid gap-1.5">
        <label className="text-[0.8125rem] font-medium">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Understanding the Gospel"
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-[0.9375rem] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
          required
        />
      </div>

      {/* Series */}
      <div className="grid gap-1.5">
        <label className="text-[0.8125rem] font-medium">Series</label>
        <select
          value={series}
          onChange={(e) => setSeries(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-[0.9375rem] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
        >
          {allSeries.map((s) => (
            <option key={s} value={s}>
              {s === "__new__" ? "＋ Add new series…" : s}
            </option>
          ))}
        </select>
        {series === "__new__" && (
          <input
            type="text"
            value={customSeries}
            onChange={(e) => setCustomSeries(e.target.value)}
            placeholder="New series name"
            className="mt-1 rounded-lg border border-input bg-background px-3 py-2.5 text-[0.9375rem] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
          />
        )}
      </div>

      {/* Date */}
      <div className="grid gap-1.5">
        <label className="text-[0.8125rem] font-medium">
          Date <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          type="text"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder="e.g. Mar 17, 2021"
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-[0.9375rem] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
        />
      </div>

      {/* Audio file */}
      <div className="grid gap-1.5">
        <label className="text-[0.8125rem] font-medium">Audio File</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed border-[var(--color-line-strong)] bg-[var(--color-surface-muted)] px-6 py-8 text-center transition-colors hover:border-[var(--color-brand-blue)] hover:bg-blue-50/40"
        >
          <UploadCloudIcon className="mx-auto mb-2 size-8 text-[var(--color-text-muted)]" />
          {selectedFile ? (
            <>
              <p className="text-[0.875rem] font-medium text-[var(--color-text-strong)]">
                {selectedFile.name}
              </p>
              <p className="text-[0.75rem] text-[var(--color-text-muted)]">
                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </>
          ) : (
            <>
              <p className="text-[0.875rem] font-medium text-[var(--color-text-muted)]">
                Click to choose an audio file
              </p>
              <p className="text-[0.75rem] text-[var(--color-text-muted)]">
                MP3, M4A, WAV, OGG — up to 512 MB
              </p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Upload progress */}
      {uploading && uploadProgress > 0 && (
        <div className="grid gap-1.5">
          <div className="flex justify-between text-[0.75rem] text-[var(--color-text-muted)]">
            <span>Uploading…</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-line)]">
            <div
              className="h-full rounded-full bg-[var(--color-brand-blue)] transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={uploading}
        className="rounded-lg bg-[var(--color-brand-blue)] px-6 py-3 text-[0.9375rem] font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "Upload Teaching"}
      </button>
    </form>
  );
}
