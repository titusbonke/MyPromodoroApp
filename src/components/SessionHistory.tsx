import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PomodoroSession } from '../db';

interface SessionHistoryProps {
  sessions: PomodoroSession[] | undefined;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onDeleteSession: (id: number) => void;
  onEditSession: (session: PomodoroSession) => void;
}

export default function SessionHistory({
  sessions,
  selectedDate,
  onDateChange,
  onDeleteSession,
  onEditSession,
}: SessionHistoryProps) {
  // Live query projects and tasks to render badges and link descriptions
  const projects = useLiveQuery(() => db.projects.toArray()) ?? [];
  const tasks = useLiveQuery(() => db.tasks.toArray()) ?? [];

  return (
    <section className="mb-5">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-3">
        <h2 className="h4 text-white mb-0 fw-bold">
          <span>Sessions Log</span>
          <span className="badge bg-secondary fs-6 rounded-pill ms-2">
            {sessions ? sessions.length : 0} completed
          </span>
        </h2>
        
        {/* Date Selector Input */}
        <div className="d-flex align-items-center gap-2" style={{ maxWidth: '220px' }}>
          <label htmlFor="logDatePicker" className="text-muted small mb-0 text-nowrap">Filter Date:</label>
          <input
            id="logDatePicker"
            type="date"
            className="form-control form-control-sm bg-dark text-light border-secondary"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>
      </div>

      {/* Sessions Table */}
      <div className="glass-card overflow-hidden">
        {sessions && sessions.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 align-middle">
              <thead>
                <tr className="text-muted small border-secondary">
                  <th scope="col" className="ps-4">Task / Goal Name</th>
                  <th scope="col">Time Range</th>
                  <th scope="col">Duration</th>
                  <th scope="col">Status</th>
                  <th scope="col">Notes</th>
                  <th scope="col" className="pe-4 text-end" style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="border-0">
                {sessions.map((session) => {
                  const associatedProject = session.projectId
                    ? projects.find((p) => p.id === session.projectId)
                    : undefined;
                  const associatedTask = session.taskId
                    ? tasks.find((t) => t.id === session.taskId)
                    : undefined;

                  return (
                    <tr key={session.id} className="border-secondary">
                      <td className="ps-4 fw-semibold text-white">
                        <div className="d-flex flex-column gap-1 py-1">
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span>{session.taskName}</span>
                            {associatedProject && (
                              <span
                                className="badge text-white rounded-pill py-0.5 px-2 small"
                                style={{
                                  backgroundColor: associatedProject.color,
                                  fontSize: '0.65rem',
                                  textShadow: '0px 1px 2px rgba(0,0,0,0.5)',
                                }}
                              >
                                {associatedProject.name}
                              </span>
                            )}
                          </div>
                          {associatedTask && (
                            <span className="text-muted small fw-normal d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                              <i className="bi bi-tag-fill text-secondary"></i> Task: {associatedTask.title}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="text-muted small">
                          {session.startTime} - {session.endTime}
                        </span>
                      </td>
                      <td>{session.duration}</td>
                      <td>
                        <span className={`badge rounded-pill px-2.5 py-1.5 small ${
                          session.status === 'Fully Completed' ? 'bg-success bg-opacity-25 text-success' :
                          session.status === 'Partially Completed' ? 'bg-warning bg-opacity-25 text-warning' :
                          'bg-danger bg-opacity-25 text-danger'
                        }`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="text-muted small max-width-notes" style={{ wordBreak: 'break-word', maxWidth: '180px' }}>
                        {session.notes || '—'}
                      </td>
                      <td className="pe-4 text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            className="btn btn-outline-primary btn-sm border-0 btn-animate py-1 px-2"
                            onClick={() => onEditSession(session)}
                            title="Edit Session"
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm border-0 btn-animate py-1 px-2"
                            onClick={() => session.id && onDeleteSession(session.id)}
                            title="Delete Session"
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-journal-x fs-1 mb-2 d-block"></i>
            No focus sessions logged for {selectedDate === new Date().toISOString().split('T')[0] ? 'today' : selectedDate} yet.
          </div>
        )}
      </div>
    </section>
  );
}
