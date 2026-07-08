import { useState, useEffect } from 'react';

interface SettingsPanelProps {
  isOpen: boolean;
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  alarmRepeatCount: number;
  alarmSound: 'digital' | 'chime' | 'bell';
  isRunning: boolean;
  onClose: () => void;
  onSave: (focus: number, short: number, long: number, repeat: number, sound: 'digital' | 'chime' | 'bell') => void;
}

export default function SettingsPanel({
  isOpen,
  focusMin,
  shortBreakMin,
  longBreakMin,
  alarmRepeatCount,
  alarmSound,
  isRunning,
  onClose,
  onSave,
}: SettingsPanelProps) {
  // Local state to hold edits before saving
  const [localFocusMin, setLocalFocusMin] = useState(focusMin);
  const [localShortBreakMin, setLocalShortBreakMin] = useState(shortBreakMin);
  const [localLongBreakMin, setLocalLongBreakMin] = useState(longBreakMin);
  const [localAlarmRepeatCount, setLocalAlarmRepeatCount] = useState(alarmRepeatCount);
  const [localAlarmSound, setLocalAlarmSound] = useState<'digital' | 'chime' | 'bell'>(alarmSound);

  // Sync state when props change
  useEffect(() => {
    if (isOpen) {
      setLocalFocusMin(focusMin);
      setLocalShortBreakMin(shortBreakMin);
      setLocalLongBreakMin(longBreakMin);
      setLocalAlarmRepeatCount(alarmRepeatCount);
      setLocalAlarmSound(alarmSound);
    }
  }, [focusMin, shortBreakMin, longBreakMin, alarmRepeatCount, alarmSound, isOpen]);

  // Audio Preview trigger on sound change
  useEffect(() => {
    // Only play preview if modal is open and the sound selection actually changes from the saved prop
    if (isOpen && localAlarmSound && localAlarmSound !== alarmSound) {
      const audioPath = `/alert_${localAlarmSound}.mp3`;
      const previewAudio = new Audio(audioPath);
      
      const playPromise = previewAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => console.log('Autoplay preview blocked:', e));
      }

      // Cut off preview after 2 seconds to not disturb the user
      const timer = setTimeout(() => {
        previewAudio.pause();
      }, 2000);

      return () => {
        clearTimeout(timer);
        previewAudio.pause();
      };
    }
  }, [localAlarmSound, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRunning && (localFocusMin !== focusMin || localShortBreakMin !== shortBreakMin || localLongBreakMin !== longBreakMin)) {
      if (!confirm('Timer is active. Saving new durations will reset your active session. Save anyway?')) {
        return;
      }
    }
    onSave(localFocusMin, localShortBreakMin, localLongBreakMin, localAlarmRepeatCount, localAlarmSound);
  };

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 16, 21, 0.9)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <form onSubmit={handleSubmit} className="modal-content glass-card border border-secondary p-4 shadow-2xl">
          <div className="modal-header border-0 pb-2 d-flex justify-content-between align-items-center">
            <h4 className="modal-title text-white fw-bold">
              <i className="bi bi-sliders me-2 text-primary"></i> Settings
            </h4>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body text-light">
            {/* Timer Durations */}
            <h6 className="text-muted small uppercase tracking-wider mb-3">Timer Durations (Minutes)</h6>
            <div className="row g-3 mb-4">
              <div className="col-4">
                <label htmlFor="inputFocus" className="form-label text-muted small">Focus</label>
                <input
                  id="inputFocus"
                  type="number"
                  className="form-control bg-dark text-light border-secondary"
                  value={localFocusMin}
                  onChange={(e) => setLocalFocusMin(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  required
                />
              </div>
              <div className="col-4">
                <label htmlFor="inputShort" className="form-label text-muted small">Short Break</label>
                <input
                  id="inputShort"
                  type="number"
                  className="form-control bg-dark text-light border-secondary"
                  value={localShortBreakMin}
                  onChange={(e) => setLocalShortBreakMin(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  required
                />
              </div>
              <div className="col-4">
                <label htmlFor="inputLong" className="form-label text-muted small">Long Break</label>
                <input
                  id="inputLong"
                  type="number"
                  className="form-control bg-dark text-light border-secondary"
                  value={localLongBreakMin}
                  onChange={(e) => setLocalLongBreakMin(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  required
                />
              </div>
            </div>

            {/* Alarm Audio Customization Settings */}
            <h6 className="text-muted small uppercase tracking-wider mb-3">Alarm Customization</h6>
            <div className="row g-3 mb-4">
              <div className="col-6">
                <label htmlFor="inputSound" className="form-label text-muted small">Alarm Tone</label>
                <select
                  id="inputSound"
                  className="form-select bg-dark text-light border-secondary"
                  value={localAlarmSound}
                  onChange={(e) => setLocalAlarmSound(e.target.value as 'digital' | 'chime' | 'bell')}
                >
                  <option value="chime">Ascending Chime (Default)</option>
                  <option value="bell">Soft Bell Ring</option>
                  <option value="digital">Digital Double Beep</option>
                </select>
              </div>
              <div className="col-6">
                <label htmlFor="inputRepeat" className="form-label text-muted small">Play Count (Times)</label>
                <input
                  id="inputRepeat"
                  type="number"
                  className="form-control bg-dark text-light border-secondary"
                  value={localAlarmRepeatCount}
                  onChange={(e) => setLocalAlarmRepeatCount(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  required
                />
              </div>
            </div>

            {/* Submit / Cancel buttons */}
            <div className="d-flex gap-2 justify-content-end">
              <button type="button" className="btn btn-secondary btn-animate px-4" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-animate px-4">
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
