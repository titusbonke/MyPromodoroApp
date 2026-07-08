interface HeaderProps {
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
}

export default function Header({ isSettingsOpen, onToggleSettings }: HeaderProps) {
  return (
    <header className="d-flex justify-content-between align-items-center mb-5">
      <h1 className="h3 mb-0 fw-bold tracking-tight text-white d-flex align-items-center">
        <i className="bi bi-clock-fill text-danger me-2"></i> Pomodoro PWA
      </h1>
      <button 
        className="btn btn-outline-secondary btn-sm border-0 btn-animate" 
        onClick={onToggleSettings}
        aria-label="Settings"
      >
        <i className={`bi bi-gear-fill fs-5 ${isSettingsOpen ? 'text-primary' : 'text-light'}`}></i>
      </button>
    </header>
  );
}
