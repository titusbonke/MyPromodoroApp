import { useState } from 'react';

interface GoalPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goal: string) => void;
}

export default function GoalPromptModal({
  isOpen,
  onClose,
  onSubmit,
}: GoalPromptModalProps) {
  const [goal, setGoal] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;
    onSubmit(goal.trim());
    setGoal(''); // clear for next use
  };

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 16, 21, 0.9)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <form onSubmit={handleSubmit} className="modal-content glass-card border border-secondary p-4 shadow-2xl">
          <div className="modal-header border-0 pb-2 d-flex justify-content-between align-items-center">
            <h4 className="modal-title text-white fw-bold">Set Your Focus Goal</h4>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body text-light">
            <p className="text-muted small mb-4">
              What specific objective are you committing to complete in this upcoming session?
            </p>
            
            <div className="mb-4">
              <input
                type="text"
                className="form-control form-control-lg bg-dark text-light border-secondary"
                placeholder="e.g., Implement OAuth login or Refactor DB models..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="d-flex gap-2 justify-content-end">
              <button type="button" className="btn btn-secondary btn-animate px-4" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-danger btn-animate px-4" disabled={!goal.trim()}>
                Start Focusing
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
