import { useState, useEffect } from 'react';
import { db } from '../db';

export function useSettings() {
  const [focusMin, setFocusMin] = useState(30);
  const [shortBreakMin, setShortBreakMin] = useState(5);
  const [longBreakMin, setLongBreakMin] = useState(15);
  const [alarmRepeatCount, setAlarmRepeatCount] = useState(4);
  const [alarmSound, setAlarmSound] = useState<'digital' | 'chime' | 'bell'>('chime');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const config = await db.settings.get('config');
        if (config) {
          setFocusMin(config.focusDuration);
          setShortBreakMin(config.shortBreakDuration);
          setLongBreakMin(config.longBreakDuration);
          if (config.alarmRepeatCount) setAlarmRepeatCount(config.alarmRepeatCount);
          if (config.alarmSound) setAlarmSound(config.alarmSound);
        }
      } catch (err) {
        console.error('Error loading persisted settings:', err);
      }
    };
    loadSettings();
  }, []);

  const saveSettings = async (
    focus: number,
    short: number,
    long: number,
    repeat: number,
    sound: 'digital' | 'chime' | 'bell'
  ) => {
    try {
      await db.settings.put({
        id: 'config',
        focusDuration: focus,
        shortBreakDuration: short,
        longBreakDuration: long,
        alarmRepeatCount: repeat,
        alarmSound: sound,
      });
    } catch (err) {
      console.error('Failed to save settings to database:', err);
    }

    setFocusMin(focus);
    setShortBreakMin(short);
    setLongBreakMin(long);
    setAlarmRepeatCount(repeat);
    setAlarmSound(sound);
  };

  return {
    focusMin,
    shortBreakMin,
    longBreakMin,
    alarmRepeatCount,
    alarmSound,
    saveSettings,
  };
}
