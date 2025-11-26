"use client";

import { useEffect, useRef } from "react";

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = true;
    audio.volume = 0.3;

    const playAudio = async () => {
      try {
        await audio.play();
      } catch (error) {
        console.log("Autoplay blocked by browser");
      }
    };

    playAudio();

    const handleUserInteraction = async () => {
      try {
        await audio.play();
      } catch (error) {
        console.log("Playback failed", error);
      }
    };

    document.addEventListener("click", handleUserInteraction, { once: true });
    document.addEventListener("keydown", handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };
  }, []);

  return <audio ref={audioRef} src="/Assets/bgm.mp3" preload="auto" />;
}
