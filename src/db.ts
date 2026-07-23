import Dexie, { type Table } from 'dexie';

export interface PomodoroSession {
  id?: number;
  taskName: string;
  startTime: string; // formatted e.g., "09:15 AM"
  endTime: string;   // formatted e.g., "09:45 AM"
  status: 'Fully Completed' | 'Partially Completed' | 'Did Not Complete';
  date: string;      // YYYY-MM-DD for simple filtering
  duration: string;  // e.g. "30m 00s" or "30:00"
  notes?: string;
}

export interface PomodoroSetting {
  id: string; // static primary key e.g. 'config'
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  alarmRepeatCount: number;
  alarmSound: 'digital' | 'chime' | 'bell';
  alarmVolume?: number;
}

export class PomodoroDatabase extends Dexie {
  sessions!: Table<PomodoroSession>;
  settings!: Table<PomodoroSetting>;

  constructor() {
    super('PomodoroDB');
    // Bump version to 3 to migration for the new settings columns
    this.version(3).stores({
      sessions: '++id, taskName, startTime, endTime, status, date',
      settings: 'id'
    });
  }
}

export const db = new PomodoroDatabase();
