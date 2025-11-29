"use client";

import React, { createContext, useContext, useRef, useEffect } from "react";

type AudioTrack = {
  id: string;
  src: string;
  volume?: number;
  loop?: boolean;
  priority: number; // Higher number = higher priority
};

type AudioContextType = {
  registerAudio: (track: AudioTrack) => () => void;
  isPlaying: (id: string) => boolean;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioInstancesRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const tracksRef = useRef<Map<string, AudioTrack>>(new Map());
  const activeTrackRef = useRef<string | null>(null);

  // Determine which track should be playing based on priority
  const updateActiveTrack = useRef(async () => {
    const tracks = tracksRef.current;
    if (tracks.size === 0) return;

    // Find highest priority track
    let highestPriority = -1;
    let highestTrackId: string | null = null;

    tracks.forEach((track, id) => {
      if (track.priority > highestPriority) {
        highestPriority = track.priority;
        highestTrackId = id;
      }
    });

    // If active track changed, switch
    if (highestTrackId !== activeTrackRef.current) {
      // Pause current active track
      if (activeTrackRef.current) {
        const currentAudio = audioInstancesRef.current.get(
          activeTrackRef.current
        );
        if (currentAudio) {
          currentAudio.pause();
        }
      }

      // Play new active track
      if (highestTrackId) {
        activeTrackRef.current = highestTrackId;
        const newAudio = audioInstancesRef.current.get(highestTrackId);
        if (newAudio) {
          try {
            await newAudio.play();
          } catch (error) {
            // Autoplay blocked - will play on user interaction
            console.log("Autoplay blocked for", highestTrackId);
          }
        }
      }
    }
  }).current;

  // Register/unregister audio tracks
  const registerAudio = (track: AudioTrack) => {
    const audio = new Audio(track.src);
    audio.loop = track.loop ?? true;
    audio.volume = track.volume ?? 0.3;
    audio.preload = "auto";

    audioInstancesRef.current.set(track.id, audio);
    tracksRef.current.set(track.id, track);

    // Update active track after registering
    updateActiveTrack();

    // Return cleanup function
    return () => {
      const audioInstance = audioInstancesRef.current.get(track.id);
      if (audioInstance) {
        audioInstance.pause();
        audioInstance.src = "";
        audioInstancesRef.current.delete(track.id);
      }
      tracksRef.current.delete(track.id);

      // If this was the active track, switch to next highest priority
      if (activeTrackRef.current === track.id) {
        activeTrackRef.current = null;
        updateActiveTrack();
      }
    };
  };

  // Handle user interaction to start audio
  useEffect(() => {
    const handleUserInteraction = async () => {
      if (activeTrackRef.current) {
        const audio = audioInstancesRef.current.get(activeTrackRef.current);
        if (audio && audio.paused) {
          try {
            await audio.play();
          } catch (error) {
            console.log("Playback failed", error);
          }
        }
      }
    };

    document.addEventListener("click", handleUserInteraction, { once: true });
    document.addEventListener("keydown", handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };
  }, []);

  const isPlaying = (id: string) => {
    return (
      activeTrackRef.current === id &&
      !audioInstancesRef.current.get(id)?.paused
    );
  };

  return (
    <AudioContext.Provider value={{ registerAudio, isPlaying }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within AudioProvider");
  }
  return context;
}
