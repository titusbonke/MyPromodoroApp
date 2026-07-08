type TimerPhase = 'focus' | 'shortBreak' | 'longBreak';

interface TimerDisplayProps {
  timeLeft: number;
  isRunning: boolean;
  phase: TimerPhase;
  taskGoal: string;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onCompleteEarly: () => void;
  onChangePhase: (p: TimerPhase) => void;
}

export default function TimerDisplay({
  timeLeft,
  isRunning,
  phase,
  taskGoal,
  onStart,
  onPause,
  onReset,
  onSkip,
  onCompleteEarly,
  onChangePhase,
}: TimerDisplayProps) {
  const formatTimerDigits = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <>
      {/* Phase Toggle Controls */}
      <div className="d-flex justify-content-center gap-2 mb-4">
        {(['focus', 'shortBreak', 'longBreak'] as const).map((p) => (
          <button
            key={p}
            className={`btn btn-sm px-3 rounded-pill btn-animate ${
              phase === p
                ? 'btn-light text-dark fw-semibold'
                : 'btn-outline-secondary border-0 text-light'
            }`}
            onClick={() => onChangePhase(p)}
          >
            {p === 'focus' ? 'Focus' : p === 'shortBreak' ? 'Short Break' : 'Long Break'}
          </button>
        ))}
      </div>

      {/* Timer Display Card */}
      <div className={`glass-card text-center py-5 px-4 mb-4 ${isRunning ? 'timer-pulse-active' : ''}`}>
        <div className="clock-display mb-3">{formatTimerDigits()}</div>

        {/* Task Title Overlay */}
        {phase === 'focus' ? (
          <div className="mb-4">
            {isRunning ? (
              <span className="badge bg-danger bg-opacity-70 px-3 py-2 fs-6">
                Focusing on: <strong className="text-white">{taskGoal}</strong>
              </span>
            ) : (
              <span className="text-muted small">Enter goal and press start to focus</span>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <span className="badge bg-success bg-opacity-70 px-3 py-2 fs-6">
              {phase === 'shortBreak' ? 'Take a short breath' : 'Unwind and recover'}
            </span>
          </div>
        )}

        {/* Control Buttons */}
        <div className="d-flex justify-content-center align-items-center gap-3">
          {/* Reset button */}
          <button
            className="btn btn-secondary rounded-circle btn-animate"
            style={{ width: '50px', height: '50px' }}
            onClick={onReset}
            title="Reset Timer"
          >
            <i className="bi bi-arrow-counterclockwise fs-5"></i>
          </button>

          {/* Play/Pause Button */}
          {isRunning ? (
            <button
              className="btn btn-light rounded-circle btn-animate shadow-lg"
              style={{ width: '68px', height: '68px' }}
              onClick={onPause}
              title="Pause Timer"
            >
              <i className="bi bi-pause-fill fs-2 text-dark"></i>
            </button>
          ) : (
            <button
              className="btn btn-danger rounded-circle btn-animate shadow-lg"
              style={{ width: '68px', height: '68px' }}
              onClick={onStart}
              title="Start Timer"
            >
              <i className="bi bi-play-fill fs-2 text-white"></i>
            </button>
          )}

          {/* Complete Early Button (Only visible during focus phase) */}
          {phase === 'focus' && (
            <button
              className="btn btn-success rounded-circle btn-animate shadow-lg text-white"
              style={{ width: '50px', height: '50px' }}
              onClick={onCompleteEarly}
              disabled={!taskGoal.trim()}
              title="Complete Session Early"
            >
              <i className="bi bi-check-lg fs-5"></i>
            </button>
          )}

          {/* Skip button */}
          <button
            className="btn btn-secondary rounded-circle btn-animate"
            style={{ width: '50px', height: '50px' }}
            onClick={onSkip}
            title="Skip Phase"
          >
            <i className="bi bi-skip-forward-fill fs-5"></i>
          </button>
        </div>
      </div>
    </>
  );
}
