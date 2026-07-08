interface AppModalButton {
  label: string;
  icon?: string; // Bootstrap icon class, e.g. 'bi-trash-fill'
  variant?: 'primary' | 'danger' | 'secondary' | 'success';
  onClick: () => void;
}

interface AppModalProps {
  isOpen: boolean;
  icon?: string;       // Emoji or Bootstrap icon class
  title: string;
  message: string;
  buttons: AppModalButton[];
}

export default function AppModal({ isOpen, icon, title, message, buttons }: AppModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      style={{ backgroundColor: 'rgba(15, 16, 21, 0.85)' }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content glass-card border border-secondary shadow-2xl p-4 text-center">
          <div className="modal-body py-3">
            {icon && (
              <div className="mb-3" style={{ fontSize: '2.5rem' }}>
                {icon}
              </div>
            )}
            <h5 className="text-white fw-bold mb-2">{title}</h5>
            <p className="text-muted mb-0">{message}</p>
          </div>
          <div className="modal-footer border-0 d-flex gap-2 justify-content-center pb-2">
            {buttons.map((btn, idx) => (
              <button
                key={idx}
                className={`btn btn-${btn.variant ?? 'primary'} btn-animate px-4`}
                onClick={btn.onClick}
                autoFocus={idx === buttons.length - 1}
              >
                {btn.icon && <i className={`bi ${btn.icon} me-2`}></i>}
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
