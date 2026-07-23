import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

interface PostSessionModalProps {
  isOpen: boolean;
  taskGoal: string; // This is the Session-specific Goal
  isAlarmPlaying: boolean;
  onStopAlarm: () => void;
  notes: string;
  onChangeNotes: (val: string) => void;
  onSaveSession: (
    status: 'Fully Completed' | 'Partially Completed' | 'Did Not Complete',
    completeTask: boolean
  ) => void;
  selectedTaskId: number | undefined;
}

export default function PostSessionModal({
  isOpen,
  taskGoal,
  isAlarmPlaying,
  onStopAlarm,
  notes,
  onChangeNotes,
  onSaveSession,
  selectedTaskId,
}: PostSessionModalProps) {
  const [completeTask, setCompleteTask] = useState(false);

  // Query linked task title reactively
  const linkedTask = useLiveQuery(
    async () => (selectedTaskId !== undefined ? await db.tasks.get(selectedTaskId) : undefined),
    [selectedTaskId]
  );

  // Reset checkbox state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCompleteTask(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 16, 21, 0.9)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content glass-card border border-secondary p-4 shadow-2xl">
          <div className="modal-header border-0 pb-0">
            <h4 className="modal-title text-white fw-bold">Session Completed! 🎉</h4>
          </div>
          <div className="modal-body text-light">
            <p className="mb-3 text-muted">
              Focus session on <strong>{taskGoal}</strong> is finished. Rate your completion status:
            </p>

            {/* Alarm Playing Alert Overlay */}
            {isAlarmPlaying && (
              <div className="alert alert-warning d-flex justify-content-between align-items-center mb-4 py-2 px-3 border-0 bg-opacity-10 bg-warning">
                <span className="small text-warning-emphasis">
                  <i className="bi bi-volume-up-fill me-1 animate-pulse"></i> Alarm is ringing...
                </span>
                <button className="btn btn-outline-warning btn-sm py-1 btn-animate" onClick={onStopAlarm}>
                  Stop Alarm
                </button>
              </div>
            )}

            {/* Notes Block */}
            <div className="mb-4">
              <label htmlFor="notesInput" className="form-label text-muted small">Optional Notes</label>
              <textarea
                id="notesInput"
                className="form-control bg-dark text-light border-secondary"
                rows={2}
                placeholder="What did you get done? Any roadblocks?"
                value={notes}
                onChange={(e) => onChangeNotes(e.target.value)}
              ></textarea>
            </div>

            {/* Mark Linked Task Complete Checkbox */}
            {linkedTask && (
              <div className="form-check mb-4 bg-dark bg-opacity-20 p-3 rounded-3 border border-secondary d-flex align-items-center animate-fadeIn">
                <input
                  type="checkbox"
                  className="form-check-input bg-dark border-secondary m-0 me-2"
                  id="completeTaskCheckbox"
                  checked={completeTask}
                  onChange={(e) => setCompleteTask(e.target.checked)}
                  style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                />
                <label className="form-check-label text-light small cursor-pointer" htmlFor="completeTaskCheckbox" style={{ cursor: 'pointer' }}>
                  Mark linked task <strong>"{linkedTask.title}"</strong> as completed
                </label>
              </div>
            )}

            {/* Action Rating Buttons */}
            <div className="d-grid gap-2">
              <button
                className="btn btn-success py-2 fw-semibold btn-animate text-white"
                onClick={() => onSaveSession('Fully Completed', completeTask)}
              >
                Fully Completed
              </button>
              <button
                className="btn btn-warning py-2 fw-semibold btn-animate text-dark"
                onClick={() => onSaveSession('Partially Completed', completeTask)}
              >
                Partially Completed
              </button>
              <button
                className="btn btn-danger py-2 fw-semibold btn-animate text-white"
                onClick={() => onSaveSession('Did Not Complete', completeTask)}
              >
                Did Not Complete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
