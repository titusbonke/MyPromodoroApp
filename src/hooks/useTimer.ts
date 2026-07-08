import { useState, useEffect, useRef } from 'react';

type TimerPhase = 'focus' | 'shortBreak' | 'longBreak';

interface UseTimerProps {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  onComplete: () => void;
}

const STORAGE_KEY = 'pomodoro_timer_state';

interface PersistedTimerState {
  phase: TimerPhase;
  expectedEndTime: number | null; // absolute timestamp ms when timer ends
  secondsAtStart: number;
  isRunning: boolean;
}

function loadPersistedState(): PersistedTimerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedTimerState;
  } catch {
    return null;
  }
}

function saveState(state: PersistedTimerState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable — ignore silently
  }
}

function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

export function useTimer({
  focusMin,
  shortBreakMin,
  longBreakMin,
  onComplete,
}: UseTimerProps) {
  // Restore persisted state on initial mount
  const persisted = useRef<PersistedTimerState | null>(loadPersistedState());
  const restored = persisted.current;

  // Compute initial timeLeft from persisted expected end time
  const computeInitialTimeLeft = (phase: TimerPhase): number => {
    if (restored?.isRunning && restored.expectedEndTime !== null) {
      const remaining = Math.round((restored.expectedEndTime - Date.now()) / 1000);
      // If timer already expired while page was closed, return 0 to trigger completion
      return Math.max(0, remaining);
    }
    if (phase === 'focus') return focusMin * 60;
    if (phase === 'shortBreak') return shortBreakMin * 60;
    return longBreakMin * 60;
  };

  const initialPhase: TimerPhase = restored?.phase ?? 'focus';
  const initialTimeLeft = computeInitialTimeLeft(initialPhase);
  const initialRunning = restored?.isRunning ?? false;

  const [phase, setPhase] = useState<TimerPhase>(initialPhase);
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
  const [isRunning, setIsRunning] = useState(initialRunning);

  const timerIntervalRef = useRef<number | null>(null);
  const expectedEndTimeRef = useRef<number | null>(
    restored?.isRunning && restored.expectedEndTime ? restored.expectedEndTime : null
  );
  const secondsAtStartRef = useRef<number>(
    restored?.secondsAtStart ?? focusMin * 60
  );

  // Persist state to localStorage on every meaningful state change
  useEffect(() => {
    saveState({
      phase,
      expectedEndTime: expectedEndTimeRef.current,
      secondsAtStart: secondsAtStartRef.current,
      isRunning,
    });
  }, [phase, timeLeft, isRunning]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusMin, shortBreakMin, longBreakMin]);

  // Update Page Title and handle Timer Tick complete trigger
  useEffect(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    const phaseLabel = phase === 'focus' ? 'Focus' : phase === 'shortBreak' ? 'Short Break' : 'Long Break';
    document.title = isRunning ? `(${formattedTime}) ${phaseLabel} | Pomodoro` : 'Pomodoro Productivity PWA';

    if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      clearState();
      onComplete();
    }
  }, [timeLeft, isRunning, phase, onComplete]);

  // Main tick timer logic using accurate delta
  useEffect(() => {
    if (isRunning) {
      // If restoring from persistence, use the saved end time; otherwise compute fresh
      if (expectedEndTimeRef.current === null) {
        expectedEndTimeRef.current = Date.now() + timeLeft * 1000;
      }
      
      timerIntervalRef.current = window.setInterval(() => {
        if (expectedEndTimeRef.current !== null) {
          const delta = Math.round((expectedEndTimeRef.current - Date.now()) / 1000);
          setTimeLeft(delta <= 0 ? 0 : delta);
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
    expectedEndTimeRef.current = Date.now() + timeLeft * 1000;
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    clearState();
    const duration = phase === 'focus' ? focusMin * 60 : phase === 'shortBreak' ? shortBreakMin * 60 : longBreakMin * 60;
    secondsAtStartRef.current = duration;
    setTimeLeft(duration);
  };

  const skipPhase = () => {
    setIsRunning(false);
    clearState();
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
    clearState();
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
