import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PomodoroSession } from './db';
import Header from './components/Header';
import SettingsPanel from './components/SettingsPanel';
import TimerDisplay from './components/TimerDisplay';
import SessionHistory from './components/SessionHistory';
import PostSessionModal from './components/PostSessionModal';
import EditSessionModal from './components/EditSessionModal';
import GoalPromptModal from './components/GoalPromptModal';

type TimerPhase = 'focus' | 'shortBreak' | 'longBreak';

export default function App() {
  // Timer durations in minutes
  const [focusMin, setFocusMin] = useState(30);
  const [shortBreakMin, setShortBreakMin] = useState(5);
  const [longBreakMin, setLongBreakMin] = useState(15);

  // Alarm custom settings
  const [alarmRepeatCount, setAlarmRepeatCount] = useState(4);
  const [alarmSound, setAlarmSound] = useState<'digital' | 'chime' | 'bell'>('chime');

  // Active Phase
  const [phase, setPhase] = useState<TimerPhase>('focus');

  // State values
  const [timeLeft, setTimeLeft] = useState(focusMin * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Task Goal Input
  const [taskGoal, setTaskGoal] = useState('');

  // Audio/Alarm State
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playCountRef = useRef<number>(1);

  // Timing References for accurate tracking (compensating for browser throttling)
  const timerIntervalRef = useRef<number | null>(null);
  const expectedEndTimeRef = useRef<number | null>(null);
  const secondsAtStartRef = useRef<number>(focusMin * 60);

  // Log session timestamps
  const [sessionStartFormatted, setSessionStartFormatted] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionDurationStr, setSessionDurationStr] = useState('');

  // Modals state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postNotes, setPostNotes] = useState('');
  const [editingSession, setEditingSession] = useState<PomodoroSession | null>(null);

  // Helper: Format date as YYYY-MM-DD local time
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper: Format time as HH:MM AM/PM
  const formatTimeAMPM = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = String(minutes).padStart(2, '0');
    const hoursStr = String(hours).padStart(2, '0');
    return `${hoursStr}:${minutesStr} ${ampm}`;
  };

  // Live Query: Fetch only today's sessions from database
  const todayDateStr = getTodayDateString();
  const todaySessions = useLiveQuery(() => {
    return db.sessions
      .where('date')
      .equals(todayDateStr)
      .reverse()
      .toArray();
  }, [todayDateStr]);

  // Sync audio source whenever alarmSound changes
  useEffect(() => {
    const audioPath = `/alert_${alarmSound}.mp3`;
    if (audioRef.current) {
      audioRef.current.src = audioPath;
    } else {
      const audio = new Audio(audioPath);
      audioRef.current = audio;
    }
    audioRef.current.loop = false; // controlled manually by playCountRef
  }, [alarmSound]);

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

  // Load persisted settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const config = await db.settings.get('config');
        if (config) {
          setFocusMin(config.focusDuration);
          setTimeLeft(config.focusDuration * 60);
          setShortBreakMin(config.shortBreakDuration);
          setLongBreakMin(config.longBreakDuration);
          if (config.alarmRepeatCount) setAlarmRepeatCount(config.alarmRepeatCount);
          if (config.alarmSound) setAlarmSound(config.alarmSound);
        }
      } catch (err) {
        console.error('Error loading persisted settings:', err);
      }
    };
    loadSettings();
  }, []);

  // Save Settings from settings modal
  const handleSaveSettings = async (
    focus: number,
    short: number,
    long: number,
    repeat: number,
    sound: 'digital' | 'chime' | 'bell'
  ) => {
    setIsSettingsOpen(false);

    // Save config row to IndexedDB
    try {
      await db.settings.put({
        id: 'config',
        focusDuration: focus,
        shortBreakDuration: short,
        longBreakDuration: long,
        alarmRepeatCount: repeat,
        alarmSound: sound
      });
    } catch (err) {
      console.error('Failed to save settings to database:', err);
    }

    // Update states
    setFocusMin(focus);
    setShortBreakMin(short);
    setLongBreakMin(long);
    setAlarmRepeatCount(repeat);
    setAlarmSound(sound);

    // Sync timer time left
    setIsRunning(false);
    if (phase === 'focus') setTimeLeft(focus * 60);
    else if (phase === 'shortBreak') setTimeLeft(short * 60);
    else setTimeLeft(long * 60);
  };

  // Clean/Archive past days' entries on mount (Daily Auto-Reset)
  useEffect(() => {
    const cleanupOldSessions = async () => {
      try {
        const count = await db.sessions.where('date').notEqual(todayDateStr).count();
        if (count > 0) {
          await db.sessions.where('date').notEqual(todayDateStr).delete();
          console.log(`Archived/Cleaned up ${count} historical entries.`);
        }
      } catch (err) {
        console.error('Error auto-resetting database:', err);
      }
    };
    cleanupOldSessions();
  }, [todayDateStr]);

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

  // Update Page Title and handle Timer Tick
  useEffect(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const phaseLabel = phase === 'focus' ? 'Focus' : phase === 'shortBreak' ? 'Short Break' : 'Long Break';
    document.title = isRunning ? `(${formattedTime}) ${phaseLabel} | Pomodoro` : 'Pomodoro Productivity PWA';

    if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    }
  }, [timeLeft, isRunning, phase]);

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

  // Trigger when focus timer finishes
  const handleTimerComplete = () => {
    setIsRunning(false);
    setIsAlarmPlaying(true);
    playCountRef.current = 1;

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.log('Audio play failed: ', err));
    }

    if (phase === 'focus') {
      const now = new Date();
      setSessionDate(getTodayDateString());

      const durationSeconds = secondsAtStartRef.current;
      const startTimeObj = new Date(now.getTime() - durationSeconds * 1000);
      setSessionStartFormatted(formatTimeAMPM(startTimeObj));

      const minsSpent = Math.floor(durationSeconds / 60);
      const secsSpent = durationSeconds % 60;
      const durationText = minsSpent > 0 ? `${minsSpent}m ${secsSpent}s` : `${secsSpent}s`;
      setSessionDurationStr(durationText);

      setShowPostModal(true);
    } else {
      alert(`${phase === 'shortBreak' ? 'Short Break' : 'Long Break'} has ended! Ready to focus?`);
      stopAlarm();
      setPhase('focus');
      setTimeLeft(focusMin * 60);
    }
  };

  const handleStart = () => {
    if (phase === 'focus' && !taskGoal.trim()) {
      setShowGoalModal(true);
      return;
    }

    // Play & immediately pause to establish user gesture, bypassing browser autoplay restrictions
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

    const currentDuration = phase === 'focus' ? focusMin * 60 : phase === 'shortBreak' ? shortBreakMin * 60 : longBreakMin * 60;
    if (timeLeft === currentDuration) {
      secondsAtStartRef.current = currentDuration;
    }

    setIsRunning(true);
  };

  const handleGoalSubmit = (goal: string) => {
    setTaskGoal(goal);
    setShowGoalModal(false);

    // Perform browser Audio gesture unlock
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

    const currentDuration = focusMin * 60;
    if (timeLeft === currentDuration) {
      secondsAtStartRef.current = currentDuration;
    }

    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    stopAlarm();
    if (phase === 'focus') {
      setTimeLeft(focusMin * 60);
    } else if (phase === 'shortBreak') {
      setTimeLeft(shortBreakMin * 60);
    } else {
      setTimeLeft(longBreakMin * 60);
    }
  };

  const handleSkip = () => {
    setIsRunning(false);
    stopAlarm();
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

  const handleCompleteEarly = () => {
    setIsRunning(false);
    stopAlarm();

    const now = new Date();
    setSessionDate(getTodayDateString());

    const durationSeconds = secondsAtStartRef.current - timeLeft;
    const startTimeObj = new Date(now.getTime() - durationSeconds * 1000);
    setSessionStartFormatted(formatTimeAMPM(startTimeObj));

    const minsSpent = Math.floor(durationSeconds / 60);
    const secsSpent = durationSeconds % 60;
    const durationText = minsSpent > 0 ? `${minsSpent}m ${secsSpent}s` : `${secsSpent}s`;
    setSessionDurationStr(durationText);

    setShowPostModal(true);
  };

  const stopAlarm = () => {
    setIsAlarmPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const saveSession = async (status: PomodoroSession['status']) => {
    stopAlarm();
    setShowPostModal(false);

    const now = new Date();
    const formattedEndTime = formatTimeAMPM(now);

    const session: PomodoroSession = {
      taskName: taskGoal,
      startTime: sessionStartFormatted,
      endTime: formattedEndTime,
      status: status,
      date: sessionDate,
      duration: sessionDurationStr,
      notes: postNotes.trim() || undefined
    };

    try {
      await db.sessions.add(session);
      setTaskGoal('');
      setPostNotes('');
      setPhase('shortBreak');
      setTimeLeft(shortBreakMin * 60);
    } catch (err) {
      console.error('Error saving session:', err);
    }
  };

  const handleDeleteSession = async (id: number) => {
    if (confirm('Are you sure you want to delete this session from your history?')) {
      try {
        await db.sessions.delete(id);
      } catch (err) {
        console.error('Failed to delete session:', err);
      }
    }
  };

  const handleEditSession = (session: PomodoroSession) => {
    setEditingSession(session);
  };

  const handleUpdateSession = async (updatedSession: PomodoroSession) => {
    try {
      await db.sessions.put(updatedSession);
      setEditingSession(null);
    } catch (err) {
      console.error('Failed to update session:', err);
    }
  };

  const handlePhaseChange = (newPhase: TimerPhase) => {
    if (isRunning && !confirm('Timer is active. Transitioning phases will reset the timer. Continue?')) {
      return;
    }
    setIsRunning(false);
    setPhase(newPhase);
    if (newPhase === 'focus') setTimeLeft(focusMin * 60);
    else if (newPhase === 'shortBreak') setTimeLeft(shortBreakMin * 60);
    else setTimeLeft(longBreakMin * 60);
  };

  return (
    <div className="container py-5" style={{ maxWidth: '800px' }}>
      {/* Header Area */}
      <Header
        isSettingsOpen={isSettingsOpen}
        onToggleSettings={() => setIsSettingsOpen(true)}
      />

      {/* Settings Modal Component */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        focusMin={focusMin}
        shortBreakMin={shortBreakMin}
        longBreakMin={longBreakMin}
        alarmRepeatCount={alarmRepeatCount}
        alarmSound={alarmSound}
        isRunning={isRunning}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />

      {/* Timer Display Component */}
      <TimerDisplay
        timeLeft={timeLeft}
        isRunning={isRunning}
        phase={phase}
        taskGoal={taskGoal}
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
        onSkip={handleSkip}
        onCompleteEarly={handleCompleteEarly}
        onChangePhase={handlePhaseChange}
      />

      {/* History Log Table */}
      <SessionHistory
        sessions={todaySessions}
        onDeleteSession={handleDeleteSession}
        onEditSession={handleEditSession}
      />

      {/* Goal Prompt Modal Popup */}
      <GoalPromptModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onSubmit={handleGoalSubmit}
      />

      {/* Post Session Feedback Rating Modal */}
      <PostSessionModal
        isOpen={showPostModal}
        taskGoal={taskGoal}
        isAlarmPlaying={isAlarmPlaying}
        onStopAlarm={stopAlarm}
        notes={postNotes}
        onChangeNotes={setPostNotes}
        onSaveSession={saveSession}
      />

      {/* Edit Session Popup Modal */}
      <EditSessionModal
        isOpen={editingSession !== null}
        session={editingSession}
        onClose={() => setEditingSession(null)}
        onSave={handleUpdateSession}
      />
    </div>
  );
  //test
}
