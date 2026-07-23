import Dexie, { type Table } from 'dexie';

export interface Project {
  id?: number;
  name: string;
  color: string; // Hex code or bootstrap indicator color
}

export interface Task {
  id?: number;
  projectId?: number; // undefined or null implies 'Inbox'
  title: string;
  isCompleted: boolean;
  createdAt: string; // ISO datetime string or YYYY-MM-DD
  completedDate?: string;
}

export interface PomodoroSession {
  id?: number;
  taskName: string;
  startTime: string; // formatted e.g., "09:15 AM"
  endTime: string;   // formatted e.g., "09:45 AM"
  status: 'Fully Completed' | 'Partially Completed' | 'Did Not Complete';
  date: string;      // YYYY-MM-DD for simple filtering
  duration: string;  // e.g. "30m 00s" or "30:00"
  notes?: string;
  taskId?: number;
  projectId?: number;
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
  projects!: Table<Project>;
  tasks!: Table<Task>;

  constructor() {
    super('PomodoroDB');
    // Bump version to 3 to migration for the new settings columns
    this.version(3).stores({
      sessions: '++id, taskName, startTime, endTime, status, date',
      settings: 'id'
    });
    // Bump version to 4 to support tasks and projects tables
    this.version(4).stores({
      sessions: '++id, taskName, startTime, endTime, status, date, taskId, projectId',
      projects: '++id, name, color',
      tasks: '++id, projectId, title, isCompleted, createdAt, completedDate',
      settings: 'id'
    });
  }
}

export const db = new PomodoroDatabase();

