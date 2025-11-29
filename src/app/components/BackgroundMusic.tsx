"use client";

import { useEffect } from "react";
import { useAudio } from "../contexts/AudioContext";

export default function BackgroundMusic() {
  const { registerAudio } = useAudio();

  useEffect(() => {
    // Register background music with low priority (will be overridden by game music)
    const unregister = registerAudio({
      id: "background-music",
      src: "/Assets/bgm.mp3",
      volume: 0.3,
      loop: true,
      priority: 1, // Low priority - can be overridden
    });

    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // registerAudio is stable, no need to include it

  return null;
}
