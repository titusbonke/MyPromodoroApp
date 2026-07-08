interface TaskInputProps {
  taskGoal: string;
  setTaskGoal: (val: string) => void;
  isRunning: boolean;
  phase: 'focus' | 'shortBreak' | 'longBreak';
}

export default function TaskInput({
  taskGoal,
  setTaskGoal,
  isRunning,
  phase,
}: TaskInputProps) {
  if (phase !== 'focus') return null;

  return (
    <div className="glass-card p-4 mb-5">
      <label htmlFor="taskInput" className="form-label text-muted small fw-semibold uppercase tracking-wider mb-2">
        Focus Goal for Next Session
      </label>
      <div className="input-group">
        <span className="input-group-text bg-dark border-secondary text-secondary">
          <i className="bi bi-list-task"></i>
        </span>
        <input
          id="taskInput"
          type="text"
          className="form-control bg-dark text-light border-secondary py-2"
          placeholder="e.g., Design database schemas or refactor user profiles..."
          value={taskGoal}
          onChange={(e) => setTaskGoal(e.target.value)}
          disabled={isRunning}
        />
      </div>
      {!taskGoal.trim() && (
        <div className="form-text text-warning mt-2 small">
          * A task goal must be set to start the Focus Timer.
        </div>
      )}
    </div>
  );
}
