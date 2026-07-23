import { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task, type Project } from '../db';

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
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const projects = useLiveQuery(() => db.projects.toArray()) ?? [];
  const activeTasks = useLiveQuery(() => db.tasks.toArray())?.filter(t => !t.isCompleted) ?? [];

  if (phase !== 'focus') return null;

  // Handle task selection
  const handleSelectTask = (task: Task) => {
    setSelectedTaskId(task.id);
    setSelectedProjectId(task.projectId);
    
    // Auto-fill session goal if empty or matches some other task title
    if (!taskGoal.trim() || activeTasks.some(t => t.title === taskGoal.trim())) {
      setTaskGoal(task.title);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  // Handle quick task creation
  const handleQuickCreate = async () => {
    if (!searchQuery.trim()) return;
    try {
      const newTaskId = await db.tasks.add({
        title: searchQuery.trim(),
        isCompleted: false,
        createdAt: new Date().toISOString(),
      });
      const createdTask = await db.tasks.get(newTaskId);
      if (createdTask) {
        handleSelectTask(createdTask);
      }
    } catch (err) {
      console.error('Failed to quick create task:', err);
    }
  };

  const handleClearSelection = () => {
    setSelectedTaskId(undefined);
    setSelectedProjectId(undefined);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Group active tasks by project
  const tasksByProject: Record<string, { project?: Project; tasks: Task[] }> = {
    inbox: { tasks: [] },
  };

  // Prepopulate custom projects
  projects.forEach(p => {
    if (p.id !== undefined) {
      tasksByProject[p.id] = { project: p, tasks: [] };
    }
  });

  // Distribute tasks
  activeTasks.forEach(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return;
    }
    if (t.projectId !== undefined && tasksByProject[t.projectId]) {
      tasksByProject[t.projectId].tasks.push(t);
    } else {
      tasksByProject.inbox.tasks.push(t);
    }
  });

  // Active task details for selected states
  const selectedTask = activeTasks.find(t => t.id === selectedTaskId);
  const selectedProject = selectedTask ? projects.find(p => p.id === selectedTask.projectId) : undefined;

  return (
    <div className="glass-card p-4 mb-5 position-relative" ref={dropdownRef}>
      <div className="row g-3">
        {/* Left Col: Task Selector */}
        <div className="col-12 col-sm-6">
          <label className="form-label text-muted small fw-semibold uppercase tracking-wider mb-2">
            Linked Task <span className="text-secondary">(Optional)</span>
          </label>
          <div className="position-relative">
            {selectedTask ? (
              <div className="d-flex align-items-center justify-content-between bg-dark border border-secondary rounded-2 p-2 animate-fadeIn" style={{ minHeight: '38px' }}>
                <div className="d-flex align-items-center text-truncate gap-2 px-1">
                  <span
                    className="d-inline-block rounded-circle flex-shrink-0"
                    style={{ width: '10px', height: '10px', backgroundColor: selectedProject?.color ?? '#f59e0b' }}
                  ></span>
                  <span className="text-light text-truncate small fw-semibold">{selectedTask.title}</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-secondary p-0 border-0 btn-animate"
                    onClick={() => !isRunning && setIsOpen(!isOpen)}
                    disabled={isRunning}
                    title="Change Task"
                  >
                    <i className="bi bi-pencil-square"></i>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-danger p-0 border-0 btn-animate ms-1"
                    onClick={handleClearSelection}
                    disabled={isRunning}
                    title="Clear Task Link"
                  >
                    <i className="bi bi-x-circle-fill"></i>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-dark border-secondary text-secondary w-100 text-start py-2 px-3 rounded-2 d-flex align-items-center justify-content-between btn-animate"
                onClick={() => !isRunning && setIsOpen(!isOpen)}
                disabled={isRunning}
              >
                <span className="small"><i className="bi bi-tag-fill me-2"></i>Select Task...</span>
                <i className={`bi ${isOpen ? 'bi-chevron-up' : 'bi-chevron-down'} small`}></i>
              </button>
            )}

            {/* Task list dropdown overlay */}
            {isOpen && !isRunning && (
              <div
                className="glass-card p-3 position-absolute start-0 end-0 mt-1 border border-secondary shadow-lg"
                style={{
                  zIndex: 1000,
                  maxHeight: '260px',
                  overflowY: 'auto',
                  backgroundColor: 'rgba(20, 22, 28, 0.98)',
                }}
              >
                {/* Search / Add input inside dropdown */}
                <div className="input-group input-group-sm mb-2">
                  <span className="input-group-text bg-dark border-secondary text-muted">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control bg-dark border-secondary text-light"
                    placeholder="Search or quick-add task..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {searchQuery.trim() && (
                    <button
                      type="button"
                      className="btn btn-primary d-flex align-items-center btn-animate"
                      onClick={handleQuickCreate}
                    >
                      <i className="bi bi-plus-lg"></i>
                    </button>
                  )}
                </div>

                {/* Dropdown Items list */}
                <div className="d-flex flex-column gap-1">
                  {Object.entries(tasksByProject).map(([projId, group]) => {
                    if (group.tasks.length === 0) return null;
                    const isInbox = projId === 'inbox';
                    const projColor = isInbox ? '#f59e0b' : (group.project?.color ?? '#6c757d');
                    const projName = isInbox ? 'Inbox' : (group.project?.name ?? 'Project');

                    return (
                      <div key={projId} className="mb-2">
                        <div
                          className="text-muted small fw-bold px-2 py-0.5 uppercase tracking-wider d-flex align-items-center border-bottom border-secondary border-opacity-10 pb-0.5 mb-1"
                          style={{ fontSize: '0.65rem' }}
                        >
                          <span
                            className="d-inline-block rounded-circle me-2"
                            style={{ width: '6px', height: '6px', backgroundColor: projColor }}
                          ></span>
                          {projName}
                        </div>

                        <div className="d-flex flex-column gap-1">
                          {group.tasks.map(t => (
                            <button
                              key={t.id}
                              type="button"
                              className={`btn btn-sm text-start py-1.5 px-3 rounded-2 text-truncate border-0 d-flex align-items-center ${
                                selectedTaskId === t.id
                                  ? 'bg-secondary bg-opacity-50 text-white fw-semibold'
                                  : 'btn-outline-secondary text-light'
                              }`}
                              onClick={() => handleSelectTask(t)}
                            >
                              <i className={`bi ${selectedTaskId === t.id ? 'bi-check2-circle text-primary' : 'bi-circle'} me-2`}></i>
                              <span className="text-truncate" style={{ fontSize: '0.85rem' }}>{t.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {activeTasks.length === 0 && !searchQuery && (
                    <div className="text-center py-3 text-muted small">
                      No active tasks. Start by typing above to quick-create one!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
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
