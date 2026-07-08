import { useState, useEffect } from 'react';
import { type PomodoroSession } from '../db';

interface EditSessionModalProps {
  isOpen: boolean;
  session: PomodoroSession | null;
  onClose: () => void;
  onSave: (updatedSession: PomodoroSession) => void;
}

export default function EditSessionModal({
  isOpen,
  session,
  onClose,
  onSave,
}: EditSessionModalProps) {
  const [taskName, setTaskName] = useState('');
  const [status, setStatus] = useState<PomodoroSession['status']>('Fully Completed');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (session) {
      setTaskName(session.taskName);
      setStatus(session.status);
      setNotes(session.notes || '');
    }
  }, [session]);

  if (!isOpen || !session) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    onSave({
      ...session,
      taskName: taskName.trim(),
      status,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 16, 21, 0.9)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <form onSubmit={handleSubmit} className="modal-content glass-card border border-secondary p-4 shadow-2xl">
          <div className="modal-header border-0 pb-2 d-flex justify-content-between align-items-center">
            <h4 className="modal-title text-white fw-bold">Edit Session</h4>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body text-light">
            {/* Task Name Goal */}
            <div className="mb-3">
              <label htmlFor="editTaskInput" className="form-label text-muted small">Task Goal</label>
              <input
                id="editTaskInput"
                type="text"
                className="form-control bg-dark text-light border-secondary"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                required
              />
            </div>

            {/* Status Option Select */}
            <div className="mb-3">
              <label htmlFor="editStatusSelect" className="form-label text-muted small">Completion Status</label>
              <select
                id="editStatusSelect"
                className="form-select bg-dark text-light border-secondary"
                value={status}
                onChange={(e) => setStatus(e.target.value as PomodoroSession['status'])}
              >
                <option value="Fully Completed">Fully Completed</option>
                <option value="Partially Completed">Partially Completed</option>
                <option value="Did Not Complete">Did Not Complete</option>
              </select>
            </div>

            {/* Notes textarea */}
            <div className="mb-4">
              <label htmlFor="editNotesInput" className="form-label text-muted small">Notes</label>
              <textarea
                id="editNotesInput"
                className="form-control bg-dark text-light border-secondary"
                rows={3}
                placeholder=" roadblock details, notes, etc..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="d-flex gap-2 justify-content-end">
              <button type="button" className="btn btn-secondary btn-animate px-4" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-animate px-4" disabled={!taskName.trim()}>
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
