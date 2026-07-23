import { useState, useEffect, useRef } from 'react';

export function useAlarm(alarmSound: 'digital' | 'chime' | 'bell', alarmRepeatCount: number, alarmVolume: number) {
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playCountRef = useRef<number>(1);

  // Preload and cache all audio assets to populate the PWA runtime cache
  useEffect(() => {
    const preload = () => {
      ['digital', 'chime', 'bell'].forEach(sound => {
        fetch(`${import.meta.env.BASE_URL}alert_${sound}.mp3`).catch(() => {
          // Silently fail if server is already offline
        });
      });
    };

    preload(); // Run on initial mount

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', preload);
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', preload);
      };
    }
  }, []);

  // Sync audio source when alarmSound changes
  useEffect(() => {
    const audioPath = `${import.meta.env.BASE_URL}alert_${alarmSound}.mp3`;
    if (audioRef.current) {
      audioRef.current.src = audioPath;
    } else {
      audioRef.current = new Audio(audioPath);
    }
    audioRef.current.loop = false; // programmatically controlled
    audioRef.current.volume = alarmVolume;
  }, [alarmSound]);

  // Sync volume when alarmVolume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = alarmVolume;
    }
  }, [alarmVolume]);

  // Audio repetition handler
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleAudioEnded = () => {
      if (isAlarmPlaying) {
        playCountRef.current += 1;
        if (playCountRef.current <= alarmRepeatCount) {
          audio.play().catch(err => console.log('Audio loop repeat failed:', err));
        } else {
          stopAlarm();
        }
      }
    };

    audio.addEventListener('ended', handleAudioEnded);
    return () => {
      audio.removeEventListener('ended', handleAudioEnded);
    };
  }, [isAlarmPlaying, alarmRepeatCount]);

  const unlockAudio = () => {
    if (audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          audioRef.current?.pause();
          audioRef.current!.currentTime = 0;
        }).catch(err => {
          console.log('Audio user gesture unlock error:', err);
        });
      }
    }
  };

  const playAlarm = () => {
    setIsAlarmPlaying(true);
    playCountRef.current = 1;
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.log('Audio play failed: ', err));
    }
  };

  const stopAlarm = () => {
    setIsAlarmPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return {
    isAlarmPlaying,
    unlockAudio,
    playAlarm,
    stopAlarm,
  };
}
