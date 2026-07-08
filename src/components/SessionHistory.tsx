import { type PomodoroSession } from '../db';

interface SessionHistoryProps {
  sessions: PomodoroSession[] | undefined;
  onDeleteSession: (id: number) => void;
  onEditSession: (session: PomodoroSession) => void;
}

export default function SessionHistory({
  sessions,
  onDeleteSession,
  onEditSession,
}: SessionHistoryProps) {
  return (
    <section className="mb-5">
      <h2 className="h4 text-white mb-3 fw-bold d-flex justify-content-between align-items-center">
        <span>Today's Sessions</span>
        <span className="badge bg-secondary fs-6 rounded-pill">
          {sessions ? sessions.length : 0} completed
        </span>
      </h2>

      {/* Sessions Table */}
      <div className="glass-card overflow-hidden">
        {sessions && sessions.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 align-middle">
              <thead>
                <tr className="text-muted small border-secondary">
                  <th scope="col" className="ps-4">Task Name</th>
                  <th scope="col">Time Range</th>
                  <th scope="col">Duration</th>
                  <th scope="col">Status</th>
                  <th scope="col">Notes</th>
                  <th scope="col" className="pe-4 text-end" style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="border-0">
                {sessions.map((session) => (
                  <tr key={session.id} className="border-secondary">
                    <td className="ps-4 fw-semibold text-white">{session.taskName}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-journal-x fs-1 mb-2 d-block"></i>
            No focus sessions logged for today yet.
          </div>
        )}
      </div>
    </section>
  );
}
