"use client";

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { Music, VolumeX } from "lucide-react";
import clsx from "clsx";
import { getStorageItem, setStorageItem } from "@/lib/storage";
import { MusicSettings } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";

interface MusicContextType {
  settings: MusicSettings;
  updateSettings: (newSettings: Partial<MusicSettings>) => void;
  isPlaying: boolean;
  autoplayBlocked: boolean;
  playMusic: () => void;
  pauseMusic: () => void;
  toggleMusic: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic must be used within MusicProvider");
  return context;
};

const DEFAULT_SETTINGS: MusicSettings = {
  enabled: true,
  volume: 0.3,
  source: "/audio/background.mp3",
  userHasChosen: false,
};

export function MusicProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<MusicSettings>(DEFAULT_SETTINGS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    const stored = getStorageItem<MusicSettings | null>("richy_music_settings", null);
    const initialSettings = stored || DEFAULT_SETTINGS;
    setSettings(initialSettings);
    
    if (!audioRef.current) {
      audioRef.current = new Audio(initialSettings.source);
      audioRef.current.loop = true;
      audioRef.current.volume = initialSettings.volume;
    }

    if (initialSettings.enabled) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
        }).catch(() => {
          setIsPlaying(false);
          setAutoplayBlocked(true);
          toast({ message: "Chạm để bật nhạc nền", type: "info" });
        });
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [toast]);

  const updateSettings = (newSettings: Partial<MusicSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    setStorageItem("richy_music_settings", updated);
    
    if (audioRef.current) {
      if (newSettings.volume !== undefined) {
        audioRef.current.volume = newSettings.volume;
      }
      if (newSettings.source && newSettings.source !== settings.source) {
        audioRef.current.src = newSettings.source;
        if (updated.enabled) {
           playMusic();
        }
      }
    }
  };

  const playMusic = () => {
    if (!audioRef.current) return;
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        setIsPlaying(true);
        setAutoplayBlocked(false);
      }).catch(err => {
        console.error("Audio playback failed", err);
        setAutoplayBlocked(true);
      });
    }
  };

  const pauseMusic = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const toggleMusic = () => {
    if (isPlaying) {
      pauseMusic();
      updateSettings({ enabled: false, userHasChosen: true });
    } else {
      playMusic();
      updateSettings({ enabled: true, userHasChosen: true });
    }
  };

  return (
    <MusicContext.Provider value={{ settings, updateSettings, isPlaying, autoplayBlocked, playMusic, pauseMusic, toggleMusic }}>
      {children}
      
      {isMounted && (
        <button
          onClick={toggleMusic}
          className={clsx(
            "fixed top-12 right-4 z-[100] p-2.5 w-11 h-11 flex items-center justify-center rounded-full shadow-xl border backdrop-blur-md transition-all active:scale-95",
            (settings.enabled || autoplayBlocked) 
              ? "bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30 shadow-blue-500/20" 
              : "bg-gray-800/80 border-gray-700 text-gray-500 hover:bg-gray-700 hover:text-gray-400"
          )}
          aria-label={settings.enabled ? "Tắt nhạc nền" : "Bật nhạc nền"}
        >
          {settings.enabled || autoplayBlocked ? (
            <div className="relative flex items-center justify-center w-6 h-6">
              <Music size={20} className={clsx(isPlaying && "animate-pulse")} />
              {autoplayBlocked && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center w-6 h-6">
              <VolumeX size={20} />
            </div>
          )}
        </button>
      )}
    </MusicContext.Provider>
  );
}
