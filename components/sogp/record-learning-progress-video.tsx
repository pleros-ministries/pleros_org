"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Square } from "lucide-react";

import { MAX_LEARNING_PROGRESS_VIDEO_SECONDS } from "@/lib/sogp/learning-progress-share";
import {
  drawLearningProgressOverlay,
  loadLearningProgressOverlayAssets,
  type LearningProgressOverlayAssets,
} from "@/lib/sogp/learning-progress-video-overlay";

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

const MIME_CANDIDATES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4",
];

function pickSupportedMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

function isRecordingSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    typeof window !== "undefined" &&
    typeof window.MediaRecorder !== "undefined"
  );
}

type RenderData = {
  authorName: string;
  dayText: string;
  teachingLabel: string;
  headline: string;
};

async function fetchRenderData(
  track: "sogp" | "pre_sogp",
  dayNumber?: number,
): Promise<RenderData> {
  const params = new URLSearchParams({ track });
  if (typeof dayNumber === "number") params.set("dayNumber", String(dayNumber));
  const response = await fetch(`/api/sogp/learning-progress-shares/render-data?${params}`);
  const payload = (await response.json().catch(() => null)) as
    | (RenderData & { error?: string })
    | null;
  if (!response.ok || !payload) {
    throw new Error(payload?.error ?? "Could not prepare your video.");
  }
  return payload;
}

type Status = "requesting" | "ready" | "recording" | "recorded" | "error";

export function RecordLearningProgressVideo({
  track,
  dayNumber,
  onRecorded,
}: {
  track: "sogp" | "pre_sogp";
  dayNumber?: number;
  onRecorded: (blob: Blob, mimeType: string) => void;
}) {
  const [status, setStatus] = useState<Status>("requesting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(MAX_LEARNING_PROGRESS_VIDEO_SECONDS);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const overlayAssetsRef = useRef<LearningProgressOverlayAssets | null>(null);
  const renderDataRef = useRef<RenderData | null>(null);
  const rafRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const mimeTypeRef = useRef<string>("video/webm");
  const stopTimeoutRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!isRecordingSupported()) {
      setStatus("error");
      setErrorMessage("Video recording isn't supported in this browser.");
      return;
    }

    function drawFrame() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const assets = overlayAssetsRef.current;
      const renderData = renderDataRef.current;
      if (video && canvas && assets && renderData) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          drawLearningProgressOverlay(ctx, {
            width: canvas.width,
            height: canvas.height,
            video,
            dayText: renderData.dayText,
            teachingLabel: renderData.teachingLabel,
            headline: renderData.headline,
            authorName: renderData.authorName,
            assets,
          });
        }
      }
      rafRef.current = requestAnimationFrame(drawFrame);
    }

    async function start() {
      try {
        const [stream, assets, renderData] = await Promise.all([
          navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 1080 },
              height: { ideal: 1920 },
            },
            audio: true,
          }),
          loadLearningProgressOverlayAssets(),
          fetchRenderData(track, dayNumber),
        ]);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        cameraStreamRef.current = stream;
        overlayAssetsRef.current = assets;
        renderDataRef.current = renderData;

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = CANVAS_WIDTH;
          canvas.height = CANVAS_HEIGHT;
        }

        setStatus("ready");
        rafRef.current = requestAnimationFrame(drawFrame);
      } catch (startError) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(
          startError instanceof Error && startError.message
            ? startError.message
            : "Camera access is needed to record a video. Allow camera & microphone access and try again.",
        );
      }
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
      if (stopTimeoutRef.current) window.clearTimeout(stopTimeoutRef.current);
      if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start/drawFrame only need to run once per mount
  }, []);

  function startRecording() {
    const canvas = canvasRef.current;
    const cameraStream = cameraStreamRef.current;
    if (!canvas || !cameraStream) return;

    const mimeType = pickSupportedMimeType();
    if (!mimeType) {
      setStatus("error");
      setErrorMessage("This browser can't record video in a shareable format.");
      return;
    }
    mimeTypeRef.current = mimeType;

    const canvasStream = canvas.captureStream(30);
    const combined = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...cameraStream.getAudioTracks(),
    ]);

    const recorder = new MediaRecorder(combined, { mimeType });
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setStatus("recorded");
      onRecorded(blob, mimeTypeRef.current);
    };

    recorderRef.current = recorder;
    recorder.start();
    setStatus("recording");
    setSecondsLeft(MAX_LEARNING_PROGRESS_VIDEO_SECONDS);

    countdownIntervalRef.current = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);
    stopTimeoutRef.current = window.setTimeout(() => {
      stopRecording();
    }, MAX_LEARNING_PROGRESS_VIDEO_SECONDS * 1000);
  }

  function stopRecording() {
    if (stopTimeoutRef.current) window.clearTimeout(stopTimeoutRef.current);
    if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
    recorderRef.current?.stop();
  }

  if (status === "error") {
    return (
      <div className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-6 text-center">
        <p className="text-sm text-red-700">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-black">
        <video ref={videoRef} muted playsInline className="hidden" />
        <canvas ref={canvasRef} className="aspect-[9/16] w-full" />
        {status === "requesting" ? (
          <div className="absolute inset-0 grid place-items-center bg-black/40">
            <Loader2 className="size-6 animate-spin text-white" />
          </div>
        ) : null}
        {status === "recording" ? (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
            <span className="size-2 animate-pulse rounded-full bg-red-500" />
            {secondsLeft}s
          </div>
        ) : null}
        {status === "recorded" ? (
          <div className="absolute inset-0 grid place-items-center bg-black/40">
            <Loader2 className="size-6 animate-spin text-white" />
          </div>
        ) : null}
      </div>
      <div className="flex justify-center">
        {status === "recording" ? (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold text-white"
          >
            <Square className="size-3.5 fill-current" /> Stop recording
          </button>
        ) : status === "recorded" ? (
          <span className="text-xs font-semibold text-[var(--color-text-muted)]">
            Preparing your video…
          </span>
        ) : (
          <button
            type="button"
            disabled={status !== "ready"}
            onClick={startRecording}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Camera className="size-4" /> Start recording
          </button>
        )}
      </div>
      <p className="text-center text-xs text-[var(--color-text-muted)]">
        Up to {MAX_LEARNING_PROGRESS_VIDEO_SECONDS} seconds. Our branding is added to the video automatically.
      </p>
    </div>
  );
}
