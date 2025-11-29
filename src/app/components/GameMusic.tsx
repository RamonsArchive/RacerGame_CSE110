"use client";

import { useEffect } from "react";
import { useAudio } from "../contexts/AudioContext";

type GameMusicProps = {
  src: string;
  volume?: number;
  enabled?: boolean;
};

export default function GameMusic({
  src,
  volume = 0.4,
  enabled = true,
}: GameMusicProps) {
  const { registerAudio } = useAudio();

  useEffect(() => {
    if (!enabled) return;

    // Register game music with high priority (overrides background music)
    const unregister = registerAudio({
      id: "game-music",
      src,
      volume,
      loop: true,
      priority: 10, // High priority - overrides background music
    });

    return unregister;
  }, [registerAudio, src, volume, enabled]);

  return null;
}
