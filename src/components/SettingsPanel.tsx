import { useState, useEffect } from 'react';

interface SettingsPanelProps {
  isOpen: boolean;
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  alarmRepeatCount: number;
  alarmSound: 'digital' | 'chime' | 'bell';
  alarmVolume: number;
  isRunning: boolean;
  onClose: () => void;
  onSave: (
    focus: number,
    short: number,
    long: number,
    repeat: number,
    sound: 'digital' | 'chime' | 'bell',
    volume: number
  ) => void;
}

export default function SettingsPanel({
  isOpen,
  focusMin,
  shortBreakMin,
  longBreakMin,
  alarmRepeatCount,
  alarmSound,
  alarmVolume,
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
  const [localAlarmVolume, setLocalAlarmVolume] = useState<number>(alarmVolume);

  // Sync state when props change
  useEffect(() => {
    if (isOpen) {
      setLocalFocusMin(focusMin);
      setLocalShortBreakMin(shortBreakMin);
      setLocalLongBreakMin(longBreakMin);
      setLocalAlarmRepeatCount(alarmRepeatCount);
      setLocalAlarmSound(alarmSound);
      setLocalAlarmVolume(alarmVolume);
    }
  }, [focusMin, shortBreakMin, longBreakMin, alarmRepeatCount, alarmSound, alarmVolume, isOpen]);

  // Audio Preview trigger on sound change
  useEffect(() => {
    // Only play preview if modal is open and the user actually changed the selection or volume
    if (!isOpen || !localAlarmSound) return;
    if (localAlarmSound === alarmSound && localAlarmVolume === alarmVolume) return;

    const audioPath = `${import.meta.env.BASE_URL}alert_${localAlarmSound}.mp3`;
    const previewAudio = new Audio();
    previewAudio.volume = localAlarmVolume;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const stopPreview = () => {
      if (timer) clearTimeout(timer);
      // Only pause if audio has started loading to avoid AbortError
      if (!previewAudio.paused) {
        previewAudio.pause();
      }
    };

    const onCanPlay = () => {
      if (cancelled) return;
      previewAudio.play().then(() => {
        // Cut off preview after 2 seconds
        timer = setTimeout(stopPreview, 2000);
      }).catch(() => {
        // Silently ignore — autoplay blocked or file unavailable
      });
    };

    const onError = () => {
      // File not cached yet — silently skip preview
    };

    previewAudio.addEventListener('canplaythrough', onCanPlay);
    previewAudio.addEventListener('error', onError);
    previewAudio.src = audioPath; // Set src after adding listeners

    return () => {
      cancelled = true;
      previewAudio.removeEventListener('canplaythrough', onCanPlay);
      previewAudio.removeEventListener('error', onError);
      stopPreview();
    };
  }, [localAlarmSound, localAlarmVolume, isOpen]);


  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRunning && (localFocusMin !== focusMin || localShortBreakMin !== shortBreakMin || localLongBreakMin !== longBreakMin)) {
      if (!confirm('Timer is active. Saving new durations will reset your active session. Save anyway?')) {
        return;
      }
    }
    onSave(localFocusMin, localShortBreakMin, localLongBreakMin, localAlarmRepeatCount, localAlarmSound, localAlarmVolume);
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
                  <option value="chime"> Chime (Default)</option>
                  <option value="bell"> bell</option>
                  <option value="digital"> digital</option>
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
              <div className="col-12 mt-3">
                <label htmlFor="inputVolume" className="form-label text-muted small d-flex justify-content-between align-items-center mb-2">
                  <span>Alarm Volume</span>
                  <span className="badge bg-secondary font-monospace" style={{ minWidth: '3rem' }}>
                    {Math.round(localAlarmVolume * 100)}%
                  </span>
                </label>
                <div className="d-flex align-items-center gap-3">
                  <i 
                    className={`bi ${localAlarmVolume === 0 ? 'bi-volume-mute-fill text-muted' : localAlarmVolume < 0.4 ? 'bi-volume-down-fill text-info' : 'bi-volume-up-fill text-primary'}`} 
                    style={{ fontSize: '1.4rem', minWidth: '1.5rem' }}
                  ></i>
                  <input
                    id="inputVolume"
                    type="range"
                    className="form-range flex-grow-1"
                    min="0"
                    max="1"
                    step="0.05"
                    value={localAlarmVolume}
                    onChange={(e) => setLocalAlarmVolume(parseFloat(e.target.value))}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
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
