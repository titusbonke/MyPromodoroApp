import { NavLink } from 'react-router-dom';

interface HeaderProps {
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
}

export default function Header({ isSettingsOpen, onToggleSettings }: HeaderProps) {
  return (
    <header className="d-flex flex-column mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
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
      </div>

      <nav className="nav nav-pills bg-dark p-1 rounded-3 border border-secondary" style={{ width: 'fit-content' }}>
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `nav-link px-4 py-2 btn-animate rounded-2 d-flex align-items-center text-decoration-none ${
              isActive ? 'bg-secondary bg-opacity-50 active text-white fw-semibold' : 'text-muted'
            }`
          }
        >
          <i className="bi bi-clock-history me-2"></i> Timer
        </NavLink>
        <NavLink 
          to="/tasks" 
          className={({ isActive }) => 
            `nav-link px-4 py-2 btn-animate rounded-2 d-flex align-items-center text-decoration-none ${
              isActive ? 'bg-secondary bg-opacity-50 active text-white fw-semibold' : 'text-muted'
            }`
          }
        >
          <i className="bi bi-check2-square me-2"></i> Tasks & Projects
        </NavLink>
      </nav>
    </header>
  );
}

