import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";

const STORAGE_KEY = "pia_music_url";        // admin-uploaded data URL
const VOLUME_KEY = "pia_music_volume";
const MUTE_KEY = "pia_music_muted";

// Default ambient track — hosted free MP3. Falls back gracefully if blocked.
const DEFAULT_TRACK =
  "https://cdn.pixabay.com/audio/2022/10/30/audio_347111d654.mp3";

interface MusicCtx {
  playing: boolean;
  muted: boolean;
  volume: number;
  trackName: string;
  setMuted: (m: boolean) => void;
  setVolume: (v: number) => void;
  start: () => void;
  stop: () => void;
  setCustomTrack: (dataUrl: string, name: string) => void;
  resetTrack: () => void;
  currentSrc: string;
}

const MusicContext = createContext<MusicCtx | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMutedState] = useState<boolean>(() => localStorage.getItem(MUTE_KEY) === "1");
  const [volume, setVolumeState] = useState<number>(() => {
    const v = parseFloat(localStorage.getItem(VOLUME_KEY) || "0.4");
    return isNaN(v) ? 0.4 : v;
  });
  const [currentSrc, setCurrentSrc] = useState<string>(() => localStorage.getItem(STORAGE_KEY) || DEFAULT_TRACK);
  const [trackName, setTrackName] = useState<string>(() =>
    localStorage.getItem(STORAGE_KEY) ? localStorage.getItem("pia_music_name") || "Custom track" : "Default ambient"
  );

  // Lazily create audio element
  useEffect(() => {
    const a = new Audio();
    a.loop = true;
    a.preload = "auto";
    audioRef.current = a;
    return () => {
      a.pause();
      audioRef.current = null;
    };
  }, []);

  // Sync src
  useEffect(() => {
    if (!audioRef.current) return;
    if (audioRef.current.src !== currentSrc) {
      const wasPlaying = playing;
      audioRef.current.src = currentSrc;
      if (wasPlaying) audioRef.current.play().catch(() => {});
    }
  }, [currentSrc, playing]);

  // Sync volume / muted
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    audioRef.current.muted = muted;
  }, [volume, muted]);

  const start = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;
    a.muted = muted;
    if (!a.src) a.src = currentSrc;
    const p = a.play();
    if (p && typeof p.then === "function") {
      p.then(() => setPlaying(true)).catch(() => {
        // Autoplay was blocked. Try once more muted so the audio element is "primed",
        // then unmute as soon as we get a user gesture.
        a.muted = true;
        a.play().then(() => {
          setPlaying(true);
          const unlock = () => {
            a.muted = muted;
            window.removeEventListener("pointerdown", unlock);
            window.removeEventListener("keydown", unlock);
          };
          window.addEventListener("pointerdown", unlock, { once: true });
          window.addEventListener("keydown", unlock, { once: true });
        }).catch(() => setPlaying(false));
      });
    }
  }, [volume, muted, currentSrc]);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    setPlaying(false);
  }, []);

  const setMuted = useCallback((m: boolean) => {
    setMutedState(m);
    localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    localStorage.setItem(VOLUME_KEY, v.toString());
  }, []);

  const setCustomTrack = useCallback((dataUrl: string, name: string) => {
    localStorage.setItem(STORAGE_KEY, dataUrl);
    localStorage.setItem("pia_music_name", name);
    setCurrentSrc(dataUrl);
    setTrackName(name);
  }, []);

  const resetTrack = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("pia_music_name");
    setCurrentSrc(DEFAULT_TRACK);
    setTrackName("Default ambient");
  }, []);

  return (
    <MusicContext.Provider
      value={{ playing, muted, volume, trackName, setMuted, setVolume, start, stop, setCustomTrack, resetTrack, currentSrc }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used within MusicProvider");
  return ctx;
}
