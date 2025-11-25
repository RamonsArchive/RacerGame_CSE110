'use client';

import { useEffect, useRef } from 'react';

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 设置音频为循环播放
    audio.loop = true;
    audio.volume = 0.3; // 设置音量为30%，可根据需要调整

    // 尝试自动播放
    const playAudio = async () => {
      try {
        await audio.play();
      } catch (error) {
        // 某些浏览器不允许自动播放，这是正常的
        console.log('自动播放被浏览器阻止');
      }
    };

    playAudio();

    // 用户交互后确保音乐播放
    const handleUserInteraction = async () => {
      try {
        await audio.play();
      } catch (error) {
        console.log('播放失败', error);
      }
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  return (
    <audio
      ref={audioRef}
      src="/Assets/bgm.mp3"
      preload="auto"
    />
  );
}
