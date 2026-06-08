"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { Teaching } from "@/lib/db/queries/teachings";

type PlayerContextType = {
  currentTrack: Teaching | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  flatList: Teaching[];
  audioRef: React.RefObject<HTMLAudioElement | null>;
  setFlatList: (list: Teaching[]) => void;
  playTeaching: (teaching: Teaching) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  seek: (pct: number) => void;
  setVolume: (v: number) => void;
};

const PlayerCtx = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Teaching | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [flatList, setFlatList] = useState<Teaching[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Always-current refs (read during callbacks without stale closure issues)
  const flatListRef = useRef<Teaching[]>([]);
  flatListRef.current = flatList;
  const currentTrackRef = useRef<Teaching | null>(null);
  currentTrackRef.current = currentTrack;

  // Load + play when track changes (by id)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = currentTrack.audioUrl;
    audio.volume = volume;
    audio.play().catch(() => {});
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
    // volume intentionally excluded — only re-run when track identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  // Stable playNext — uses refs, never stale
  const playNext = useCallback(() => {
    setCurrentTrack((prev) => {
      if (!prev) return null;
      const list = flatListRef.current;
      const idx = list.findIndex((t) => t.id === prev.id);
      return idx >= 0 && idx < list.length - 1 ? list[idx + 1] : prev;
    });
  }, []);

  const playPrev = useCallback(() => {
    setCurrentTrack((prev) => {
      if (!prev) return null;
      const list = flatListRef.current;
      const idx = list.findIndex((t) => t.id === prev.id);
      return idx > 0 ? list[idx - 1] : prev;
    });
  }, []);

  // Audio event listeners — stable because playNext has no deps
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onDuration = () =>
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onEnded = () => playNext();
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDuration);
    audio.addEventListener("durationchange", onDuration);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDuration);
      audio.removeEventListener("durationchange", onDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, [playNext]);

  const playTeaching = useCallback((teaching: Teaching) => {
    const audio = audioRef.current;
    const isSame = currentTrackRef.current?.id === teaching.id;
    if (isSame) {
      if (!audio) return;
      if (audio.paused) {
        audio.play().catch(() => {});
        setIsPlaying(true);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
      return;
    }
    setCurrentTrack(teaching);
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const seek = useCallback((pct: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = pct * (audio.duration || 0);
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const value = useMemo<PlayerContextType>(
    () => ({
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      volume,
      flatList,
      audioRef,
      setFlatList,
      playTeaching,
      togglePlay,
      playNext,
      playPrev,
      seek,
      setVolume,
    }),
    [
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      volume,
      flatList,
      playTeaching,
      togglePlay,
      playNext,
      playPrev,
      seek,
      setVolume,
    ],
  );

  return (
    <PlayerCtx.Provider value={value}>
      <audio ref={audioRef} preload="metadata" />
      {children}
    </PlayerCtx.Provider>
  );
}

export function usePlayer(): PlayerContextType {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error("usePlayer must be inside <PlayerProvider>");
  return ctx;
}
