import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PomodoroSession } from './db';
import Header from './components/Header';
import SettingsPanel from './components/SettingsPanel';
import TimerDisplay from './components/TimerDisplay';
import SessionHistory from './components/SessionHistory';
import PostSessionModal from './components/PostSessionModal';
import EditSessionModal from './components/EditSessionModal';
import GoalPromptModal from './components/GoalPromptModal';

// Custom Hooks
import { useSettings } from './hooks/useSettings';
import { useAlarm } from './hooks/useAlarm';
import { useTimer } from './hooks/useTimer';

export default function App() {
  // 1. Settings state management hook
  const {
    focusMin,
    shortBreakMin,
    longBreakMin,
    alarmRepeatCount,
    alarmSound,
    saveSettings,
  } = useSettings();

  // 2. Alarm sound management hook
  const {
    isAlarmPlaying,
    unlockAudio,
    playAlarm,
    stopAlarm,
  } = useAlarm(alarmSound, alarmRepeatCount);

  // 3. Timer management hook
  const {
    phase,
    timeLeft,
    isRunning,
    secondsAtStart,
    startTimer,
    pauseTimer,
    resetTimer,
    skipPhase,
    changePhase,
    setTimeLeft,
    setPhase,
    setIsRunning,
  } = useTimer({
    focusMin,
    shortBreakMin,
    longBreakMin,
    onComplete: () => handleTimerComplete(),
  });

  // State variables for sessions
  const [taskGoal, setTaskGoal] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  // Log active selected date (defaults to today's date)
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());

  // Helpers
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

  // Live Query: Fetch only sessions from the selected filter date
  const todaySessions = useLiveQuery(() => {
    return db.sessions
      .where('date')
      .equals(selectedDate)
      .reverse()
      .toArray();
  }, [selectedDate]);


  // Trigger when focus timer finishes
  const handleTimerComplete = () => {
    playAlarm();

    if (phase === 'focus') {
      const now = new Date();
      setSessionDate(getTodayDateString());
      
      const durationSeconds = secondsAtStart;
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
    
    unlockAudio();
    startTimer();
  };

  const handleGoalSubmit = (goal: string) => {
    setTaskGoal(goal);
    setShowGoalModal(false);
    unlockAudio();
    startTimer();
  };

  const handleReset = () => {
    stopAlarm();
    resetTimer();
  };

  const handleSkip = () => {
    stopAlarm();
    skipPhase();
  };

  const handleCompleteEarly = () => {
    stopAlarm();
    pauseTimer();
    
    const now = new Date();
    setSessionDate(getTodayDateString());
    
    const durationSeconds = secondsAtStart - timeLeft;
    const startTimeObj = new Date(now.getTime() - durationSeconds * 1000);
    setSessionStartFormatted(formatTimeAMPM(startTimeObj));
    
    const minsSpent = Math.floor(durationSeconds / 60);
    const secsSpent = durationSeconds % 60;
    const durationText = minsSpent > 0 ? `${minsSpent}m ${secsSpent}s` : `${secsSpent}s`;
    setSessionDurationStr(durationText);
    
    setShowPostModal(true);
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
      // After saving, reset filter date to today so they see their newly added session in list
      setSelectedDate(getTodayDateString());
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
        onSave={(focus, short, long, repeat, sound) => {
          saveSettings(focus, short, long, repeat, sound);
          setIsSettingsOpen(false);
          setIsRunning(false);
        }}
      />

      {/* Timer Display Component */}
      <TimerDisplay
        timeLeft={timeLeft}
        isRunning={isRunning}
        phase={phase}
        taskGoal={taskGoal}
        onStart={handleStart}
        onPause={pauseTimer}
        onReset={handleReset}
        onSkip={handleSkip}
        onCompleteEarly={handleCompleteEarly}
        onChangePhase={changePhase}
      />

      {/* History Log Table */}
      <SessionHistory
        sessions={todaySessions}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
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
}
