import TaskSelector from './TaskSelector';

interface TaskInputProps {
  taskGoal: string;
  setTaskGoal: (val: string) => void;
  isRunning: boolean;
  phase: 'focus' | 'shortBreak' | 'longBreak';
  selectedTaskId: number | undefined;
  setSelectedTaskId: (id: number | undefined) => void;
  selectedProjectId: number | undefined;
  setSelectedProjectId: (id: number | undefined) => void;
}

export default function TaskInput({
  taskGoal,
  setTaskGoal,
  isRunning,
  phase,
  selectedTaskId,
  setSelectedTaskId,
  selectedProjectId: _selectedProjectId,
  setSelectedProjectId,
}: TaskInputProps) {
  if (phase !== 'focus') return null;

  // Handle selection from TaskSelector
  const handleSelectTask = (
    taskId: number | undefined,
    projectId: number | undefined,
    taskTitle: string | undefined
  ) => {
    setSelectedTaskId(taskId);
    setSelectedProjectId(projectId);
    
    // Auto-fill session goal if empty
    if (taskTitle && (!taskGoal.trim() || taskGoal.trim() === '')) {
      setTaskGoal(taskTitle);
    }
  };

  return (
    <div className="glass-card p-4 mb-5 position-relative" style={{ zIndex: 10 }}>
      <div className="row g-3">
        {/* Left Col: Task Selector */}
        <div className="col-12 col-sm-6">
          <label className="form-label text-muted small fw-semibold uppercase tracking-wider mb-2">
            Linked Task <span className="text-secondary">(Optional)</span>
          </label>
          <TaskSelector
            selectedTaskId={selectedTaskId}
            onSelectTask={handleSelectTask}
            disabled={isRunning}
          />
        </div>

        {/* Right Col: Session Goal */}
        <div className="col-12 col-sm-6">
          <label htmlFor="taskInput" className="form-label text-muted small fw-semibold uppercase tracking-wider mb-2">
            Session Focus Goal
          </label>
          <div className="input-group">
            <span className="input-group-text bg-dark border-secondary text-secondary">
              <i className="bi bi-clock-history"></i>
            </span>
            <input
              id="taskInput"
              type="text"
              className="form-control bg-dark text-light border-secondary py-2"
              placeholder="What are you focusing on in this session?"
              value={taskGoal}
              onChange={(e) => setTaskGoal(e.target.value)}
              disabled={isRunning}
            />
          </div>
        </div>
      </div>

      {!taskGoal.trim() && (
        <div className="form-text text-warning mt-2 small">
          * A focus goal must be set to start the Focus Timer.
        </div>
      )}
    </div>
  );
}
