import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task } from '../db';

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#38bdf8', // Sky Blue
  '#f59e0b', // Amber
  '#ef4444', // Crimson
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#f97316', // Orange
];

export default function TaskPage() {
  // Database live queries
  const projects = useLiveQuery(() => db.projects.toArray()) ?? [];
  const tasks = useLiveQuery(() => db.tasks.toArray()) ?? [];
  const sessions = useLiveQuery(() => db.sessions.toArray()) ?? [];

  // Local State
  const [selectedProjectId, setSelectedProjectId] = useState<'all' | 'inbox' | number>('all');
  const [taskStatusTab, setTaskStatusTab] = useState<'active' | 'completed'>('active');
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');

  // 1. Project Management Actions
  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      await db.projects.add({
        name: newProjectName.trim(),
        color: selectedColor,
      });
      setNewProjectName('');
      setSelectedColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    } catch (err) {
      console.error('Failed to add project:', err);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (confirm('Are you sure you want to delete this project? Tasks in this project will be moved to the Inbox.')) {
      try {
        await db.projects.delete(id);
        // Unassign tasks belonging to this project
        const projectTasks = tasks.filter(t => t.projectId === id);
        for (const task of projectTasks) {
          if (task.id) {
            await db.tasks.update(task.id, { projectId: undefined });
          }
        }
        // Also update sessions referencing this project
        const projectSessions = sessions.filter(s => s.projectId === id);
        for (const session of projectSessions) {
          if (session.id) {
            await db.sessions.update(session.id, { projectId: undefined });
          }
        }
        if (selectedProjectId === id) {
          setSelectedProjectId('all');
        }
      } catch (err) {
        console.error('Failed to delete project:', err);
      }
    }
  };

  // 2. Task Management Actions
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    // Determine target project ID based on current selection
    const projectId = typeof selectedProjectId === 'number' ? selectedProjectId : undefined;

    try {
      await db.tasks.add({
        title: newTaskTitle.trim(),
        projectId,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      });
      setNewTaskTitle('');
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  const handleToggleTaskCompletion = async (task: Task) => {
    if (!task.id) return;
    try {
      await db.tasks.update(task.id, {
        isCompleted: !task.isCompleted,
        completedDate: !task.isCompleted ? new Date().toISOString() : undefined,
      });
    } catch (err) {
      console.error('Failed to update task completion:', err);
    }
  };

  const handleStartEditing = (task: Task) => {
    if (!task.id) return;
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
  };

  const handleSaveEditing = async (id: number) => {
    if (!editingTaskTitle.trim()) return;
    try {
      await db.tasks.update(id, { title: editingTaskTitle.trim() });
      setEditingTaskId(null);
    } catch (err) {
      console.error('Failed to edit task title:', err);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (confirm('Are you sure you want to delete this task? Associated Pomodoro history remains intact.')) {
      try {
        await db.tasks.delete(id);
        // Clean up references in sessions
        const taskSessions = sessions.filter(s => s.taskId === id);
        for (const session of taskSessions) {
          if (session.id) {
            await db.sessions.update(session.id, { taskId: undefined });
          }
        }
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  // Helper calculations
  const getPomodoroCount = (taskId: number) => {
    return sessions.filter(s => s.taskId === taskId && s.status === 'Fully Completed').length;
  };

  const getProjectPomodoroCount = (projId: number | undefined) => {
    return sessions.filter(s => s.projectId === projId && s.status === 'Fully Completed').length;
  };

  const getUncompletedTaskCount = (projId: 'all' | 'inbox' | number) => {
    return tasks.filter(t => {
      if (t.isCompleted) return false;
      if (projId === 'all') return true;
      if (projId === 'inbox') return t.projectId === undefined;
      return t.projectId === projId;
    }).length;
  };

  // Filtered Task calculation
  const filteredTasks = tasks.filter(t => {
    // Project filter
    if (selectedProjectId === 'inbox' && t.projectId !== undefined) return false;
    if (typeof selectedProjectId === 'number' && t.projectId !== selectedProjectId) return false;

    // Status filter
    if (taskStatusTab === 'active' && t.isCompleted) return false;
    if (taskStatusTab === 'completed' && !t.isCompleted) return false;

    return true;
  });

  return (
    <div className="row g-4">
      {/* Sidebar: Projects */}
      <div className="col-12 col-md-4">
        <div className="glass-card p-4 h-100">
          <h2 className="h5 mb-4 text-white fw-bold d-flex align-items-center">
            <i className="bi bi-folder-fill text-primary me-2"></i> Projects
          </h2>

          {/* Built-in Categories */}
          <div className="list-group list-group-flush mb-4">
            <button
              onClick={() => setSelectedProjectId('all')}
              className={`list-group-item list-group-item-action bg-transparent border-0 d-flex justify-content-between align-items-center py-2 px-3 rounded-3 mb-1 text-light ${
                selectedProjectId === 'all' ? 'bg-secondary bg-opacity-25 fw-semibold text-white' : ''
              }`}
            >
              <span>
                <i className="bi bi-collection-fill me-2 text-info"></i> All Tasks
              </span>
              <span className="badge bg-secondary rounded-pill">{getUncompletedTaskCount('all')}</span>
            </button>

            <button
              onClick={() => setSelectedProjectId('inbox')}
              className={`list-group-item list-group-item-action bg-transparent border-0 d-flex justify-content-between align-items-center py-2 px-3 rounded-3 mb-1 text-light ${
                selectedProjectId === 'inbox' ? 'bg-secondary bg-opacity-25 fw-semibold text-white' : ''
              }`}
            >
              <span>
                <i className="bi bi-inbox-fill me-2 text-warning"></i> Inbox (Uncategorized)
              </span>
              <span className="badge bg-secondary rounded-pill">{getUncompletedTaskCount('inbox')}</span>
            </button>
          </div>

          <hr className="border-secondary mb-4" />

          {/* Custom Projects list */}
          <h3 className="h6 text-muted uppercase tracking-wider small fw-semibold mb-3">Custom Projects</h3>
          <div className="list-group list-group-flush mb-4 scroll-projects" style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {projects.length === 0 ? (
              <p className="text-muted small py-2 px-3">No custom projects yet.</p>
            ) : (
              projects.map(proj => (
                <div
                  key={proj.id}
                  onClick={() => proj.id !== undefined && setSelectedProjectId(proj.id)}
                  style={{ cursor: 'pointer' }}
                  className={`list-group-item list-group-item-action bg-transparent border-0 d-flex justify-content-between align-items-center py-2 px-3 rounded-3 mb-1 text-light ${
                    selectedProjectId === proj.id ? 'bg-secondary bg-opacity-25 fw-semibold text-white' : ''
                  }`}
                >
                  <div className="d-flex align-items-center text-truncate" style={{ minWidth: 0, flex: 1 }}>
                    <span
                      className="d-inline-block rounded-circle me-2 flex-shrink-0"
                      style={{ width: '12px', height: '12px', backgroundColor: proj.color }}
                    ></span>
                    <span className="text-truncate">{proj.name}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2" onClick={e => e.stopPropagation()}>
                    <span className="badge bg-dark border border-secondary text-light rounded-pill">
                      {getUncompletedTaskCount(proj.id!)}
                    </span>
                    <button
                      onClick={() => proj.id !== undefined && handleDeleteProject(proj.id)}
                      className="btn btn-link text-danger p-0 border-0 btn-animate"
                      title="Delete Project"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Project Form */}
          <form onSubmit={handleAddProject} className="mt-auto">
            <div className="mb-3">
              <label htmlFor="newProjectName" className="form-label text-muted small fw-semibold">New Project</label>
              <input
                id="newProjectName"
                type="text"
                className="form-control bg-dark border-secondary text-light py-2"
                placeholder="e.g. Coding, Health, Reading..."
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
              />
            </div>
            
            {/* Color selection circles */}
            <div className="mb-3">
              <label className="form-label text-muted small fw-semibold d-block">Project Color</label>
              <div className="d-flex gap-2 flex-wrap">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`rounded-circle border-0 position-relative p-0 btn-animate`}
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: color,
                    }}
                  >
                    {selectedColor === color && (
                      <i className="bi bi-check text-white position-absolute top-50 start-50 translate-middle font-bold"></i>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-outline-primary btn-sm w-100 py-2 d-flex align-items-center justify-content-center btn-animate">
              <i className="bi bi-plus-lg me-1"></i> Add Project
            </button>
          </form>
        </div>
      </div>

      {/* Main Content: Tasks */}
      <div className="col-12 col-md-8">
        <div className="glass-card p-4 h-100 d-flex flex-column">
          {/* Header area of main pane */}
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <h2 className="h4 mb-1 text-white fw-bold d-flex align-items-center">
                {selectedProjectId === 'all' && (
                  <>
                    <i className="bi bi-collection-fill text-info me-2"></i> All Tasks
                  </>
                )}
                {selectedProjectId === 'inbox' && (
                  <>
                    <i className="bi bi-inbox-fill text-warning me-2"></i> Inbox (Uncategorized)
                  </>
                )}
                {typeof selectedProjectId === 'number' && (
                  <>
                    <span
                      className="d-inline-block rounded-circle me-2"
                      style={{ width: '16px', height: '16px', backgroundColor: projects.find(p => p.id === selectedProjectId)?.color }}
                    ></span>
                    {projects.find(p => p.id === selectedProjectId)?.name}
                  </>
                )}
              </h2>
              {typeof selectedProjectId === 'number' && (
                <small className="text-muted">
                  Project focus history: {getProjectPomodoroCount(selectedProjectId)} completed sessions
                </small>
              )}
            </div>

            {/* Filter Tabs (Active / Completed) */}
            <div className="btn-group btn-group-sm bg-dark p-1 rounded-3 border border-secondary">
              <button
                onClick={() => setTaskStatusTab('active')}
                className={`btn btn-sm px-3 rounded-2 ${taskStatusTab === 'active' ? 'btn-secondary text-white' : 'btn-dark text-muted border-0'}`}
              >
                Active
              </button>
              <button
                onClick={() => setTaskStatusTab('completed')}
                className={`btn btn-sm px-3 rounded-2 ${taskStatusTab === 'completed' ? 'btn-secondary text-white' : 'btn-dark text-muted border-0'}`}
              >
                Completed
              </button>
            </div>
          </div>

          {/* Quick Task Creation Form */}
          {taskStatusTab === 'active' && (
            <form onSubmit={handleAddTask} className="mb-4">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control bg-dark border-secondary text-light py-2"
                  placeholder={
                    typeof selectedProjectId === 'number'
                      ? `Add a task to this project...`
                      : `Add a task (will go to Inbox)...`
                  }
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-animate">
                  <i className="bi bi-plus-lg me-1"></i> Add Task
                </button>
              </div>
            </form>
          )}

          {/* Tasks List */}
          <div className="flex-grow-1 overflow-auto scroll-tasks" style={{ minHeight: '300px', maxHeight: '450px' }}>
            {filteredTasks.length === 0 ? (
              <div className="text-center py-5">
                <i className={`bi ${taskStatusTab === 'completed' ? 'bi-check-circle' : 'bi-clipboard-check'} text-muted fs-1 mb-3 d-block`}></i>
                <p className="text-muted">No {taskStatusTab} tasks found.</p>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {filteredTasks.map(task => {
                  const associatedProject = projects.find(p => p.id === task.projectId);
                  const poms = getPomodoroCount(task.id!);

                  return (
                    <div
                      key={task.id}
                      className="list-group-item bg-transparent border-secondary border-bottom py-3 px-1 d-flex align-items-center justify-content-between gap-3 text-light"
                    >
                      <div className="d-flex align-items-center gap-3 flex-grow-1 min-width-0">
                        {/* Completion Checkbox */}
                        <div className="form-check m-0">
                          <input
                            type="checkbox"
                            className="form-check-input bg-dark border-secondary"
                            style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                            checked={task.isCompleted}
                            onChange={() => handleToggleTaskCompletion(task)}
                          />
                        </div>

                        {/* Title Display & Renaming Input */}
                        <div className="flex-grow-1 text-truncate">
                          {editingTaskId === task.id ? (
                            <input
                              type="text"
                              className="form-control form-control-sm bg-dark text-light border-primary"
                              value={editingTaskTitle}
                              onChange={e => setEditingTaskTitle(e.target.value)}
                              onBlur={() => handleSaveEditing(task.id!)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveEditing(task.id!);
                                if (e.key === 'Escape') setEditingTaskId(null);
                              }}
                              autoFocus
                            />
                          ) : (
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span
                                className={`text-truncate ${task.isCompleted ? 'text-decoration-line-through text-muted' : 'text-white'}`}
                                onDoubleClick={() => handleStartEditing(task)}
                                style={{ cursor: 'pointer' }}
                                title="Double click to edit"
                              >
                                {task.title}
                              </span>

                              {/* Show project badge if we are viewing "All Tasks" and it belongs to a project */}
                              {selectedProjectId === 'all' && associatedProject && (
                                <span
                                  className="badge text-white rounded-pill py-1 px-2 small"
                                  style={{
                                    backgroundColor: associatedProject.color,
                                    fontSize: '0.75rem',
                                    textShadow: '0px 1px 2px rgba(0,0,0,0.5)',
                                  }}
                                >
                                  {associatedProject.name}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right-aligned Stats & Actions */}
                      <div className="d-flex align-items-center gap-3 flex-shrink-0">
                        {/* Focus Session Counter */}
                        {poms > 0 && (
                          <span
                            className="badge bg-danger bg-opacity-25 border border-danger border-opacity-50 text-danger rounded-pill px-2 py-1 small"
                            title={`${poms} focus sessions logged`}
                          >
                            {poms} 🍅
                          </span>
                        )}

                        {/* Action buttons */}
                        <div className="d-flex gap-2">
                          {editingTaskId !== task.id && (
                            <button
                              onClick={() => handleStartEditing(task)}
                              className="btn btn-link btn-animate p-1 text-secondary"
                              title="Edit Task"
                            >
                              <i className="bi bi-pencil-fill"></i>
                            </button>
                          )}
                          <button
                            onClick={() => task.id !== undefined && handleDeleteTask(task.id)}
                            className="btn btn-link btn-animate p-1 text-danger"
                            title="Delete Task"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
