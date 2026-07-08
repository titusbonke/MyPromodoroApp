import { useState, useEffect, useRef } from 'react';

type TimerPhase = 'focus' | 'shortBreak' | 'longBreak';

interface UseTimerProps {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  onComplete: () => void;
}

export function useTimer({
  focusMin,
  shortBreakMin,
  longBreakMin,
  onComplete,
}: UseTimerProps) {
  const [phase, setPhase] = useState<TimerPhase>('focus');
  const [timeLeft, setTimeLeft] = useState(focusMin * 60);
  const [isRunning, setIsRunning] = useState(false);

  const timerIntervalRef = useRef<number | null>(null);
  const expectedEndTimeRef = useRef<number | null>(null);
  const secondsAtStartRef = useRef<number>(focusMin * 60);

  // Sync Timer Duration with settings updates when not running
  useEffect(() => {
    if (!isRunning) {
      if (phase === 'focus') {
        setTimeLeft(focusMin * 60);
      } else if (phase === 'shortBreak') {
        setTimeLeft(shortBreakMin * 60);
      } else if (phase === 'longBreak') {
        setTimeLeft(longBreakMin * 60);
      }
    }
  }, [focusMin, shortBreakMin, longBreakMin, phase, isRunning]);

  // Update Page Title and handle Timer Tick complete trigger
  useEffect(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    const phaseLabel = phase === 'focus' ? 'Focus' : phase === 'shortBreak' ? 'Short Break' : 'Long Break';
    document.title = isRunning ? `(${formattedTime}) ${phaseLabel} | Pomodoro` : 'Pomodoro Productivity PWA';

    if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      onComplete();
    }
  }, [timeLeft, isRunning, phase, onComplete]);

  // Main tick timer logic using accurate delta
  useEffect(() => {
    if (isRunning) {
      expectedEndTimeRef.current = Date.now() + timeLeft * 1000;
      
      timerIntervalRef.current = window.setInterval(() => {
        if (expectedEndTimeRef.current !== null) {
          const delta = Math.round((expectedEndTimeRef.current - Date.now()) / 1000);
          if (delta <= 0) {
            setTimeLeft(0);
          } else {
            setTimeLeft(delta);
          }
        }
      }, 250);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      expectedEndTimeRef.current = null;
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRunning]);

  const startTimer = () => {
    const currentDuration = phase === 'focus' ? focusMin * 60 : phase === 'shortBreak' ? shortBreakMin * 60 : longBreakMin * 60;
    if (timeLeft === currentDuration) {
      secondsAtStartRef.current = currentDuration;
    }
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (phase === 'focus') {
      setTimeLeft(focusMin * 60);
    } else if (phase === 'shortBreak') {
      setTimeLeft(shortBreakMin * 60);
    } else {
      setTimeLeft(longBreakMin * 60);
    }
  };

  const skipPhase = () => {
    setIsRunning(false);
    if (phase === 'focus') {
      setPhase('shortBreak');
      setTimeLeft(shortBreakMin * 60);
    } else if (phase === 'shortBreak') {
      setPhase('longBreak');
      setTimeLeft(longBreakMin * 60);
    } else {
      setPhase('focus');
      setTimeLeft(focusMin * 60);
    }
  };

  const changePhase = (newPhase: TimerPhase) => {
    setIsRunning(false);
    setPhase(newPhase);
    if (newPhase === 'focus') setTimeLeft(focusMin * 60);
    else if (newPhase === 'shortBreak') setTimeLeft(shortBreakMin * 60);
    else setTimeLeft(longBreakMin * 60);
  };

  return {
    phase,
    timeLeft,
    isRunning,
    secondsAtStart: secondsAtStartRef.current,
    startTimer,
    pauseTimer,
    resetTimer,
    skipPhase,
    changePhase,
    setIsRunning,
    setTimeLeft,
    setPhase,
  };
}
