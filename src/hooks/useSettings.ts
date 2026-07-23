import { useState, useEffect } from 'react';
import { db } from '../db';

export function useSettings() {
  const [focusMin, setFocusMin] = useState(30);
  const [shortBreakMin, setShortBreakMin] = useState(5);
  const [longBreakMin, setLongBreakMin] = useState(15);
  const [alarmRepeatCount, setAlarmRepeatCount] = useState(2);
  const [alarmSound, setAlarmSound] = useState<'digital' | 'chime' | 'bell'>('chime');
  const [alarmVolume, setAlarmVolume] = useState(0.5);

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
          if (config.alarmVolume !== undefined) setAlarmVolume(config.alarmVolume);
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
    sound: 'digital' | 'chime' | 'bell',
    volume: number
  ) => {
    try {
      await db.settings.put({
        id: 'config',
        focusDuration: focus,
        shortBreakDuration: short,
        longBreakDuration: long,
        alarmRepeatCount: repeat,
        alarmSound: sound,
        alarmVolume: volume,
      });
    } catch (err) {
      console.error('Failed to save settings to database:', err);
    }

    setFocusMin(focus);
    setShortBreakMin(short);
    setLongBreakMin(long);
    setAlarmRepeatCount(repeat);
    setAlarmSound(sound);
    setAlarmVolume(volume);
  };

  return {
    focusMin,
    shortBreakMin,
    longBreakMin,
    alarmRepeatCount,
    alarmSound,
    alarmVolume,
    saveSettings,
  };
}
